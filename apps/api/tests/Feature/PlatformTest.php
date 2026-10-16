<?php

namespace Tests\Feature;

use App\Jobs\RunEvaluation;
use App\Jobs\SendDiscordBuild;
use App\Models\Build;
use App\Models\DiscordDispatch;
use App\Models\Evaluation;
use App\Models\Topic;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

class PlatformTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withCredentials();
        $this->withSession(['test_visitor' => true]);
        $this->withCookie(config('session.cookie'), session()->getId());
    }

    public function test_no_login_routes_or_registration_are_exposed(): void
    {
        $this->postJson('/api/v1/login')->assertNotFound();
        $this->postJson('/api/v1/register')->assertNotFound();
        $this->getJson('/api/v1/session')->assertOk()->assertJsonStructure(['csrf_token', 'discord_available'])->assertJsonMissingPath('user');
    }

    public function test_visitor_can_publish_a_topic_and_reply_with_a_nickname(): void
    {
        $topic = $this->postJson('/api/v1/topics', ['author_name' => 'Treinador', 'title' => 'Como montar uma equipe?', 'category' => 'equipes', 'body' => 'Gostaria de discutir algumas opções.'])->assertCreated()->assertJsonPath('author_name', 'Treinador')->assertJsonMissingPath('session_key');
        $this->assertDatabaseHas('topics', ['title' => 'Como montar uma equipe?']);
        $this->postJson('/api/v1/topics/'.$topic->json('id').'/replies', ['author_name' => 'Outro treinador', 'body' => 'Qual é o formato?'])->assertCreated()->assertJsonMissingPath('session_key');
        $this->assertDatabaseCount('replies', 1);
    }

    public function test_topic_without_nickname_is_rejected(): void
    {
        $this->postJson('/api/v1/topics', ['title' => 'Como montar uma equipe?', 'category' => 'equipes', 'body' => 'Gostaria de discutir algumas opções.'])->assertUnprocessable()->assertJsonValidationErrors('author_name');
        $this->assertDatabaseCount('topics', 0);
    }

    public function test_other_session_cannot_edit_topic_and_owner_cannot_moderate(): void
    {
        $topic = Topic::create(['session_key' => 'another-session', 'author_name' => 'Treinador', 'title' => 'Como montar uma equipe?', 'category' => 'equipes', 'body' => 'Gostaria de discutir algumas opções.']);
        $this->patchJson('/api/v1/topics/'.$topic->id, ['title' => 'Alteração indevida'])->assertNotFound();
        $created = $this->postJson('/api/v1/topics', ['author_name' => 'Visitante', 'title' => 'Como montar outra equipe?', 'category' => 'equipes', 'body' => 'Gostaria de discutir algumas opções.'])->assertCreated();
        $this->patchJson('/api/v1/topics/'.$created->json('id'), ['hidden' => true, 'title' => 'Uma equipe de tartarugas'])->assertOk()->assertJsonPath('hidden', false);
        $this->assertDatabaseHas('topics', ['id' => $created->json('id'), 'title' => 'Uma equipe de tartarugas', 'hidden' => false]);
    }

    public function test_locked_topic_refuses_replies_and_hidden_topic_is_not_listed(): void
    {
        $topic = Topic::create(['session_key' => 'another-session', 'author_name' => 'Treinador', 'title' => 'Como montar uma equipe?', 'category' => 'equipes', 'body' => 'Gostaria de discutir algumas opções.', 'locked' => true]);
        $this->postJson('/api/v1/topics/'.$topic->id.'/replies', ['author_name' => 'Visitante', 'body' => 'Uma resposta'])->assertForbidden();
        $this->assertDatabaseCount('replies', 0);
        $topic->update(['hidden' => true]);
        $this->getJson('/api/v1/topics')->assertJsonPath('total', 0);
        $this->getJson('/api/v1/topics/'.$topic->id)->assertNotFound();
    }

    public function test_vote_is_idempotent_and_does_not_disclose_private_build(): void
    {
        $build = Build::create(['public_id' => (string) Str::uuid(), 'session_key' => 'another-session', 'name' => 'Wall', 'pokemon' => 'Blastoise', 'context_id' => 'gen9ou', 'visibility' => 'public', 'configuration' => []]);
        $this->putJson('/api/v1/builds/'.$build->public_id.'/reaction', ['kind' => 'vote', 'active' => true])->assertOk();
        $this->putJson('/api/v1/builds/'.$build->public_id.'/reaction', ['kind' => 'vote', 'active' => true])->assertOk();
        $this->assertDatabaseCount('reactions', 1);
        $this->getJson('/api/v1/builds')->assertJsonPath('data.0.votes', 1);
        $build->update(['visibility' => 'private']);
        $this->getJson('/api/v1/builds/'.$build->public_id)->assertNotFound();
        $this->putJson('/api/v1/builds/'.$build->public_id.'/reaction', ['kind' => 'vote', 'active' => false])->assertNotFound();
    }

    public function test_optional_empty_strings_reach_engine_without_becoming_null(): void
    {
        Http::preventStrayRequests();
        Http::fake(['127.0.0.1:8081/evaluate' => Http::response(['legality' => ['status' => 'legal']])]);
        $this->postJson('/api/v1/analyze', ['configuration' => ['item' => '', 'tera_type' => '', 'strategy' => '']])->assertOk();
        Http::assertSent(fn ($request) => $request['item'] === '' && $request['tera_type'] === '' && $request['strategy'] === '');
    }

    public function test_discord_is_disabled_without_configuration_and_never_sends(): void
    {
        Queue::fake([SendDiscordBuild::class]);
        config(['services.discord.enabled' => false]);
        $this->postJson('/api/v1/discord/builds', ['configuration' => []])->assertServiceUnavailable();
        Queue::assertNotPushed(SendDiscordBuild::class);
    }

    public function test_visitor_can_queue_discord_once_and_other_session_cannot_read_dispatch(): void
    {
        Queue::fake([SendDiscordBuild::class]);
        Http::preventStrayRequests();
        Http::fake(['127.0.0.1:8081/evaluate' => Http::response(['legality' => ['status' => 'legal']])]);
        config(['services.discord.enabled' => true, 'services.discord.token' => 'test-token']);
        $this->withSession(['discord_access' => ['expires' => time() + 900], 'discord_destinations' => [['id' => '100', 'channels' => [['id' => '200']]]]]);
        $input = ['guild_id' => '100', 'channel_id' => '200', 'request_key' => (string) Str::uuid(), 'configuration' => ['pokemon' => 'Blastoise']];
        $first = $this->postJson('/api/v1/discord/builds', $input)->assertAccepted()->assertJsonPath('status', 'queued');
        $this->postJson('/api/v1/discord/builds', $input)->assertOk()->assertJsonPath('public_id', $first->json('public_id'));
        Queue::assertPushed(SendDiscordBuild::class, 1);
        Http::assertSentCount(1);
        $this->assertDatabaseCount('discord_dispatches', 1);
        $dispatch = DiscordDispatch::first();
        $dispatch->update(['session_key' => 'another-session']);
        $this->getJson('/api/v1/discord/builds/'.$dispatch->public_id)->assertNotFound();
    }

    public function test_evaluations_are_available_without_login_but_require_six_legal_members(): void
    {
        Queue::fake([RunEvaluation::class]);
        $this->postJson('/api/v1/evaluations', ['members' => [[]], 'recommendation_slot' => 0])->assertUnprocessable();
        Http::preventStrayRequests();
        Http::fake(['127.0.0.1:8081/team/validate' => Http::response(['issues' => [], 'context' => ['id' => 'gen9ou']])]);
        $response = $this->postJson('/api/v1/evaluations', ['members' => array_fill(0, 6, ['pokemon' => 'Blastoise']), 'recommendation_slot' => 0])->assertAccepted()->assertJsonMissingPath('session_key');
        Queue::assertPushed(RunEvaluation::class, 1);
        Http::assertSentCount(1);
        $this->getJson('/api/v1/evaluations/'.$response->json('public_id'))->assertOk();
        Evaluation::first()->update(['session_key' => 'another-session']);
        $this->getJson('/api/v1/evaluations/'.$response->json('public_id'))->assertNotFound();
    }

    public function test_discord_oauth_rejects_forged_state_before_contacting_discord(): void
    {
        Http::preventStrayRequests();
        $this->get('/api/v1/discord/callback?state=forged&code=fake')->assertForbidden();
        Http::assertNothingSent();
    }

    public function test_discord_refuses_destination_outside_authorized_server(): void
    {
        Http::preventStrayRequests();
        config(['services.discord.enabled' => true, 'services.discord.token' => 'test-token']);
        $this->withSession(['discord_access' => ['expires' => time() + 900], 'discord_destinations' => [['id' => '100', 'channels' => [['id' => '200']]]]]);
        $this->postJson('/api/v1/discord/builds', ['guild_id' => '300', 'channel_id' => '400', 'request_key' => (string) Str::uuid(), 'configuration' => ['pokemon' => 'Blastoise']])->assertForbidden();
        Http::assertNothingSent();
    }
}
