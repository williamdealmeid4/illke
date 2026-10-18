<?php

namespace App\Http\Controllers;

use App\EngineClient;
use App\Jobs\RunEvaluation;
use App\Models\Evaluation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class EvaluationController extends Controller
{
    public function store(Request $request, EngineClient $engine): JsonResponse
    {
        $input = $request->validate(['members' => ['required', 'array', 'size:6'], 'members.*' => ['required', 'array'], 'recommendation_slot' => ['required', 'integer', 'between:0,5']]);
        $validation = $engine->request('/team/validate', ['builds' => $input['members']]);
        abort_if(count($validation['issues']) > 0, 422, implode(' ', $validation['issues']));
        $metadata = Storage::exists('catalog-metadata.json') ? json_decode(Storage::get('catalog-metadata.json'), true) : [];
        $snapshot = $metadata['snapshot_id'] ?? null;
        $competitive = $input;
        $competitive['members'] = array_map(fn (array $member) => Arr::only($member, ['pokemon', 'context_id', 'level', 'nature', 'ability', 'item', 'moves', 'evs', 'ivs', 'tera_type']), $input['members']);
        $key = hash('sha256', json_encode($this->canonical([$competitive, config('services.engine.revision'), $snapshot])));
        $visitor = $this->visitor($request);
        $evaluation = Cache::lock('evaluation:'.$visitor.':'.$key, 10)->block(3, function () use ($visitor, $key, $input, $validation, $snapshot): Evaluation {
            $existing = Evaluation::where('session_key', $visitor)->where('input_hash', $key)->whereIn('status', ['queued', 'running', 'completed', 'failed'])->latest('id')->first();
            $stale = $existing && in_array($existing->status, ['queued', 'running']) && ($existing->heartbeat_at ?: $existing->updated_at)->lt(now()->subMinutes(15));
            if ($existing && $existing->status !== 'failed' && ! $stale) {
                return $existing;
            }
            $evaluation = $existing ?: Evaluation::create(['public_id' => (string) Str::uuid(), 'session_key' => $visitor, 'input_hash' => $key, 'context_id' => $validation['context']['id'], 'snapshot_id' => $snapshot, 'input' => $input, 'status' => 'queued']);
            $evaluation->update(['status' => 'queued', 'error' => null, 'phase' => 'Aguardando motor', 'heartbeat_at' => now()]);
            RunEvaluation::dispatch($evaluation->id)->onQueue('evaluations');

            return $evaluation;
        });

        return response()->json($evaluation, $evaluation->status === 'completed' ? 200 : 202);
    }

    public function show(Request $request, Evaluation $evaluation): JsonResponse
    {
        abort_unless($evaluation->session_key === $this->visitor($request), 404);

        $evaluation->setAttribute('can_resume', in_array($evaluation->status, ['queued', 'running', 'failed']) && ($evaluation->status === 'failed' || ($evaluation->heartbeat_at ?: $evaluation->updated_at)->lt(now()->subMinutes(15))));

        return response()->json($evaluation);
    }

    public function index(Request $request): JsonResponse
    {
        return response()->json(Evaluation::where('session_key', $this->visitor($request))->latest('id')->paginate(25));
    }

    public function destroy(Request $request, Evaluation $evaluation, EngineClient $engine): JsonResponse
    {
        abort_unless($evaluation->session_key === $this->visitor($request), 404);
        if (in_array($evaluation->status, ['queued', 'running', 'failed'])) {
            $evaluation->update(['status' => 'cancelled', 'phase' => 'Cancelada']);
            try {
                $engine->request('/simulate/cancel', ['evaluation_id' => $evaluation->public_id], 'post', 3);
            } catch (\Throwable $error) {
                report($error);
            }
        }

        return response()->json($evaluation);
    }

    private function canonical(array $value): array
    {
        if (! array_is_list($value)) {
            ksort($value);
        }

        return array_map(fn ($item) => is_array($item) ? $this->canonical($item) : $item, $value);
    }
}
