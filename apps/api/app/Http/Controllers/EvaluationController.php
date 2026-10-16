<?php

namespace App\Http\Controllers;

use App\EngineClient;
use App\Jobs\RunEvaluation;
use App\Models\Evaluation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EvaluationController extends Controller
{
    public function store(Request $request, EngineClient $engine): JsonResponse
    {
        $input = $request->validate(['members' => ['required', 'array', 'size:6'], 'members.*' => ['required', 'array'], 'recommendation_slot' => ['required', 'integer', 'between:0,5']]);
        $validation = $engine->request('/team/validate', ['builds' => $input['members']]);
        abort_if(count($validation['issues']) > 0, 422, implode(' ', $validation['issues']));
        $key = hash('sha256', json_encode([$input, config('services.engine.revision'), @filemtime(base_path('../../.data/catalog.json'))]));
        $existing = Evaluation::where('session_key', $this->visitor($request))->where('input_hash', $key)->whereIn('status', ['queued', 'running', 'completed'])->latest('id')->first();
        if ($existing) {
            return response()->json($existing);
        }
        $evaluation = Evaluation::create(['public_id' => (string) Str::uuid(), 'session_key' => $this->visitor($request), 'input_hash' => $key, 'context_id' => $validation['context']['id'], 'input' => $input, 'status' => 'queued']);
        RunEvaluation::dispatch($evaluation->id);

        return response()->json($evaluation, 202);
    }

    public function show(Request $request, Evaluation $evaluation): JsonResponse
    {
        abort_unless($evaluation->session_key === $this->visitor($request), 404);

        return response()->json($evaluation);
    }
}
