<?php

namespace Tests\Feature;

use App\EngineClient;
use App\Jobs\RunEvaluation;
use App\Models\Build;
use App\Models\Evaluation;
use App\Models\Topic;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

class EvolutionTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withSession(['evolution_visitor' => true]);
        $this->withCookie(config('session.cookie'), session()->getId());
    }

    public function test_reading_pages_does_not_consume_publication_or_analysis_budget(): void
    {
        Http::preventStrayRequests();
        Http::fake(['127.0.0.1:8081/evaluate' => Http::response(['legality' => ['status' => 'legal']])]);
        for ($i = 0; $i < 40; $i++) {
            $this->getJson('/api/v1/session')->assertOk();
        }
        $this->postJson('/api/v1/topics', ['author_name' => 'Visitante', 'title' => 'Uma equipe para testar', 'category' => 'equipes', 'body' => 'Mensagem de discussão da equipe.'])->assertCreated();
        $this->postJson('/api/v1/analyze', ['configuration' => ['pokemon' => 'Garchomp']])->assertOk();
    }

    public function test_action_limits_return_a_recoverable_message_without_debug_trace(): void
    {
        Http::preventStrayRequests();
        Http::fake(['127.0.0.1:8081/evaluate' => Http::response(['legality' => ['status' => 'legal']])]);
        for ($i = 0; $i < 30; $i++) {
            $this->postJson('/api/v1/analyze', ['configuration' => ['pokemon' => 'Garchomp']])->assertOk();
        }
        $this->postJson('/api/v1/analyze', ['configuration' => ['pokemon' => 'Garchomp']])->assertStatus(429)->assertJsonPath('error.code', 'HTTP_429')->assertJsonMissingPath('trace');
        $this->getJson('/api/v1/session')->assertOk();
    }

    public function test_missing_sprite_is_an_explicit_image_fallback(): void
    {
        $this->get('/api/v1/sprite/Arceus-Fire')->assertOk()->assertHeader('Content-Type', 'image/svg+xml')->assertHeader('X-Sprite-Fallback', 'unavailable')->assertSee('Sprite indisponível');
    }

    public function test_public_reference_listing_excludes_invalid_imported_sets_by_default(): void
    {
        $build = Build::create(['public_id' => (string) Str::uuid(), 'source_key' => 'source-test', 'name' => 'Revisar', 'pokemon' => 'Pikachu', 'context_id' => 'gen9ou', 'visibility' => 'public', 'legality' => 'illegal', 'configuration' => []]);
        $this->getJson('/api/v1/builds')->assertJsonPath('total', 0);
        $this->getJson('/api/v1/builds?legality=all')->assertJsonPath('data.0.public_id', $build->public_id);
    }

    public function test_moderation_requires_credentials_and_expires(): void
    {
        config(['services.moderator_token' => 'test-only-secret']);
        $this->getJson('/api/v1/moderation/reports')->assertForbidden();
        $this->postJson('/api/v1/moderation/session', ['token' => 'wrong'])->assertForbidden();
        $this->postJson('/api/v1/moderation/session', ['token' => 'test-only-secret'])->assertOk()->assertJsonPath('expires_in', 1800);
        $this->getJson('/api/v1/moderation/reports')->assertOk();
        $this->travel(31)->minutes();
        $this->getJson('/api/v1/moderation/reports')->assertForbidden();
    }

    public function test_moderator_resolves_a_report_and_records_the_action(): void
    {
        $topic = Topic::create(['session_key' => 'another', 'author_name' => 'Autor', 'title' => 'Um tópico para revisão', 'category' => 'geral', 'body' => 'Mensagem suficiente para discussão.']);
        $id = DB::table('reports')->insertGetId(['topic_id' => $topic->id, 'session_key' => 'reporter', 'reason' => 'Conteúdo fora das regras', 'created_at' => now(), 'updated_at' => now()]);
        $this->withSession(['moderator_until' => time() + 1800]);
        $this->patchJson('/api/v1/moderation/reports/'.$id, ['action' => 'hide'])->assertOk();
        $this->assertDatabaseHas('topics', ['id' => $topic->id, 'hidden' => true]);
        $this->assertDatabaseHas('reports', ['id' => $id, 'resolved' => true]);
        $this->assertDatabaseHas('moderation_actions', ['target_id' => $topic->id, 'action' => 'hide']);
    }

    public function test_reply_ownership_is_required_to_edit_or_hide(): void
    {
        $topic = Topic::create(['session_key' => 'other', 'author_name' => 'Autor', 'title' => 'Uma discussão de equipe', 'category' => 'geral', 'body' => 'Mensagem suficiente para discussão.']);
        $reply = $topic->replies()->create(['session_key' => 'someone-else', 'author_name' => 'Outro', 'body' => 'Uma resposta de outra pessoa.']);
        $this->patchJson('/api/v1/topics/'.$topic->id.'/replies/'.$reply->id, ['body' => 'Mudança indevida'])->assertNotFound();
        $this->deleteJson('/api/v1/topics/'.$topic->id.'/replies/'.$reply->id)->assertNotFound();
        $this->withSession(['moderator_until' => time() + 1800]);
        $this->deleteJson('/api/v1/topics/'.$topic->id.'/replies/'.$reply->id)->assertOk();
        $this->getJson('/api/v1/topics/'.$topic->id)->assertJsonPath('replies.total', 0);
    }

    public function test_identical_evaluations_are_deduplicated_and_can_be_cancelled(): void
    {
        Queue::fake([RunEvaluation::class]);
        Http::preventStrayRequests();
        Http::fake(['127.0.0.1:8081/team/validate' => Http::response(['issues' => [], 'context' => ['id' => 'gen9ou']]), '127.0.0.1:8081/simulate/cancel' => Http::response(['cancelled' => true])]);
        $input = ['members' => array_fill(0, 6, ['pokemon' => 'Garchomp']), 'recommendation_slot' => 0];
        $first = $this->postJson('/api/v1/evaluations', $input)->assertAccepted();
        $this->postJson('/api/v1/evaluations', $input)->assertAccepted()->assertJsonPath('public_id', $first->json('public_id'));
        Queue::assertPushed(RunEvaluation::class, 1);
        $this->deleteJson('/api/v1/evaluations/'.$first->json('public_id'))->assertOk()->assertJsonPath('status', 'cancelled');
        $this->assertDatabaseCount('evaluations', 1);
    }

    public function test_health_works_in_both_html_and_json(): void
    {
        $this->get('/up')->assertOk();
        $this->getJson('/up')->assertOk()->assertJsonPath('status', 'up');
    }

    public function test_database_suite_uses_the_requested_driver(): void
    {
        $this->assertSame(getenv('ILLKE_EXPECTED_DATABASE') ?: 'sqlite', DB::connection()->getDriverName());
    }

    public function test_evaluation_persists_a_unit_before_queueing_the_next(): void
    {
        Queue::fake([RunEvaluation::class]);
        Http::preventStrayRequests();
        Http::fake(['127.0.0.1:8081/simulate' => Http::response(['candidates' => [['pokemon' => 'Garchomp']], 'comparisons' => [], 'outcomes' => [0, 1], 'complete' => false])]);
        $evaluation = Evaluation::create(['public_id' => (string) Str::uuid(), 'session_key' => 'visitor', 'input_hash' => 'unit-test', 'context_id' => 'gen9ou', 'input' => ['members' => [], 'recommendation_slot' => 0], 'status' => 'queued']);
        (new RunEvaluation($evaluation->id))->handle(app(EngineClient::class));
        $this->assertSame('queued', $evaluation->fresh()->status);
        $this->assertSame(50, $evaluation->fresh()->progress);
        $this->assertCount(1, $evaluation->fresh()->result['candidates']);
        Queue::assertPushed(RunEvaluation::class, 1);
    }

    public function test_cancelled_evaluation_never_contacts_the_engine(): void
    {
        Http::preventStrayRequests();
        $evaluation = Evaluation::create(['public_id' => (string) Str::uuid(), 'session_key' => 'visitor', 'input_hash' => 'cancelled-unit', 'context_id' => 'gen9ou', 'input' => [], 'status' => 'cancelled']);
        (new RunEvaluation($evaluation->id))->handle(app(EngineClient::class));
        Http::assertNothingSent();
        $this->assertSame('cancelled', $evaluation->fresh()->status);
    }
}
