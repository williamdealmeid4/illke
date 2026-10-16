<?php

namespace App\Http\Controllers;

use App\EngineClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeamController extends Controller
{
    public function importTeam(Request $request, EngineClient $engine): JsonResponse
    {
        $input = $request->validate(['text' => ['required', 'string', 'max:20000'], 'context_id' => ['required', 'regex:/^gen[1-9]ou$/']]);
        $sets = $engine->request('/import', ['text' => $input['text']]);
        abort_if(count($sets) > 6 || count($sets) === 0, 422, 'Importe de 1 a 6 Pokémon.');
        $stats = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];

        return response()->json(array_map(fn (array $set): array => ['name' => $set['name'] ?: $set['species'], 'pokemon' => $set['species'], 'context_id' => $input['context_id'], 'level' => $set['level'] ?? 100, 'nature' => $set['nature'] ?? 'Serious', 'ability' => $set['ability'] ?? '', 'item' => $set['item'] ?? '', 'moves' => $set['moves'] ?? [], 'evs' => array_replace(array_fill_keys($stats, 0), $set['evs'] ?? []), 'ivs' => array_replace(array_fill_keys($stats, 31), $set['ivs'] ?? []), 'tera_type' => $set['teraType'] ?? '', 'role' => 'support', 'strategy' => '', 'visibility' => 'private'], $sets));
    }

    public function validateTeam(Request $request, EngineClient $engine): JsonResponse
    {
        $input = $request->validate(['builds' => ['required', 'array', 'min:1', 'max:6']]);

        return response()->json($engine->request('/team/validate', $input));
    }
}
