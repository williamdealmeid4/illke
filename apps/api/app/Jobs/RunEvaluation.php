<?php

namespace App\Jobs;

use App\EngineClient;
use App\Models\Evaluation;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Throwable;

class RunEvaluation implements ShouldQueue
{
    use Queueable;

    public int $timeout = 600;

    public int $tries = 1;

    public function __construct(public int $evaluationId) {}

    public function handle(EngineClient $engine): void
    {
        $evaluation = Evaluation::findOrFail($this->evaluationId);
        if ($evaluation->status === 'completed') {
            return;
        }
        $evaluation->update(['status' => 'running', 'error' => null]);
        $result = $engine->request('/simulate', $evaluation->input, 'post', 560);
        $evaluation->update(['status' => 'completed', 'result' => $result]);
    }

    public function failed(?Throwable $exception): void
    {
        Evaluation::whereKey($this->evaluationId)->update(['status' => 'failed', 'error' => 'A avaliação não foi concluída. Revise a equipe e tente novamente.']);
    }
}
