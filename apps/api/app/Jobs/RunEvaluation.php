<?php

namespace App\Jobs;

use App\EngineClient;
use App\Models\Evaluation;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Queue\Middleware\WithoutOverlapping;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

class RunEvaluation implements ShouldQueue
{
    use Queueable;

    public int $timeout = 600;

    public int $tries = 120;

    public function __construct(public int $evaluationId) {}

    public function middleware(): array
    {
        return [(new WithoutOverlapping('evaluation:'.$this->evaluationId))->releaseAfter(10)->expireAfter(620)];
    }

    public function handle(EngineClient $engine): void
    {
        $evaluation = Evaluation::findOrFail($this->evaluationId);
        if (in_array($evaluation->status, ['completed', 'cancelled'])) {
            return;
        }
        $baseline = $evaluation->result;
        $index = count($baseline['comparisons'] ?? []);
        $evaluation->update(['status' => 'running', 'error' => null, 'phase' => $baseline ? 'Comparando alternativa '.($index + 1).' de '.count($baseline['candidates']) : 'Medindo equipe original', 'heartbeat_at' => now()]);
        try {
            $input = [...$evaluation->input, 'evaluation_id' => $evaluation->public_id, 'snapshot_id' => $evaluation->snapshot_id];
            if (! $baseline) {
                $result = $engine->request('/simulate', [...$input, 'unit' => 'baseline'], 'post', 560);
            } elseif ($index < count($baseline['candidates'])) {
                $comparison = $engine->request('/simulate', [...$input, 'unit' => 'candidate', 'candidate_index' => $index, 'baseline' => $baseline], 'post', 560);
                $baseline['comparisons'][] = $comparison;
                $result = $baseline;
            } else {
                $result = $baseline;
            }
            if ($evaluation->fresh()->status === 'cancelled') {
                return;
            }
            $completed = count($result['comparisons'] ?? []) >= count($result['candidates'] ?? []);
            if ($completed && isset($result['candidates'])) {
                $result = $engine->request('/simulate/finalize', $result);
            }
            DB::transaction(function () use ($evaluation, $result, $completed): void {
                $evaluation->update(['status' => $completed ? 'completed' : 'queued', 'result' => $result, 'progress' => $completed ? 100 : (int) (100 * (1 + count($result['comparisons'])) / (1 + count($result['candidates']))), 'phase' => $completed ? 'Concluída' : 'Aguardando próxima etapa', 'heartbeat_at' => now()]);
                if (! $completed) {
                    self::dispatch($evaluation->id)->onQueue('evaluations');
                }
            });
        } catch (ConnectionException $error) {
            if ($evaluation->fresh()->status !== 'cancelled') {
                $evaluation->update(['status' => 'queued', 'phase' => 'Aguardando reconexão do motor', 'heartbeat_at' => now()]);
                $this->release(15);
            }
        } catch (HttpException $error) {
            if ($evaluation->fresh()->status === 'cancelled') {
                return;
            }
            if ($error->getStatusCode() === 503) {
                $evaluation->update(['status' => 'queued', 'phase' => 'Aguardando disponibilidade do motor', 'heartbeat_at' => now()]);
                $this->release(10);

                return;
            }
            throw $error;
        }
    }

    public function failed(?Throwable $exception): void
    {
        Evaluation::whereKey($this->evaluationId)->where('status', '!=', 'cancelled')->update(['status' => 'failed', 'error' => 'A avaliação foi interrompida. Tente novamente para retomar as etapas já concluídas.']);
    }
}
