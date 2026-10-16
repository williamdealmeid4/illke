<?php

namespace App\Http\Controllers;

use App\EngineClient;
use App\Models\Build;
use App\Models\CatalogEntry;
use App\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CatalogController extends Controller
{
    public function index(Request $request, string $kind = 'pokemon'): JsonResponse
    {
        abort_unless(in_array($kind, ['pokemon', 'item', 'move', 'ability']), 404);
        $input = $request->validate(['q' => ['nullable', 'string', 'max:100'], 'generation' => ['nullable', 'integer', 'between:1,9'], 'type' => ['nullable', 'string', 'max:30'], 'page' => ['nullable', 'integer', 'min:1']]);
        $query = CatalogEntry::where('kind', $kind);
        if ($q = $input['q'] ?? '') {
            $query->where(fn ($query) => $query->where('name', 'like', '%'.$q.'%')->orWhere('slug', 'like', '%'.$q.'%')->orWhere('national_number', ctype_digit($q) ? (int) $q : -1));
        }
        if ($gen = $input['generation'] ?? null) {
            $query->where('generation', $gen);
        }
        if ($type = $input['type'] ?? null) {
            $query->whereJsonContains('attributes->types', strtolower($type));
        }

        return response()->json($query->orderBy('national_number')->orderBy('id')->paginate(36)->withQueryString());
    }

    public function show(string $kind, string $slug): JsonResponse
    {
        return response()->json(CatalogEntry::where('kind', $kind)->where('slug', $slug)->firstOrFail());
    }

    public function sprite(Request $request, string $pokemon): RedirectResponse
    {
        $id = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $pokemon));
        $entry = CatalogEntry::where('kind', 'pokemon')->where(fn ($q) => $q->where('name', $pokemon)->orWhere('slug', $pokemon)->orWhere('attributes->showdown_id', $id))->firstOrFail();
        abort_unless($entry->image, 404);

        return redirect()->away($request->query('style') === 'artwork' ? ($entry->attributes['sprites']['artwork']['url'] ?? $entry->image['url']) : $entry->image['url'])->header('Cache-Control', 'public, max-age=86400');
    }

    public function summary(): JsonResponse
    {
        return response()->json(['pokemon' => CatalogEntry::where('kind', 'pokemon')->whereIn('slug', ['garchomp', 'corviknight', 'dragapult', 'great-tusk', 'gholdengo', 'kingambit'])->get(), 'counts' => CatalogEntry::selectRaw('kind, count(*) as total')->groupBy('kind')->pluck('total', 'kind'), 'builds' => Build::where('visibility', 'public')->count(), 'topics' => Topic::where('hidden', false)->count()]);
    }

    public function coverage(): JsonResponse
    {
        return response()->json(Storage::exists('catalog-metadata.json') ? json_decode(Storage::get('catalog-metadata.json'), true) : ['coverage' => [], 'status' => 'not_imported']);
    }

    public function species(EngineClient $engine): JsonResponse
    {
        return response()->json($engine->request('/species', [], 'get'));
    }

    public function contexts(EngineClient $engine): JsonResponse
    {
        return response()->json($engine->request('/contexts', [], 'get'));
    }

    public function options(Request $request, EngineClient $engine): JsonResponse
    {
        $input = $request->validate(['pokemon' => ['required', 'string', 'max:80'], 'context_id' => ['required', 'string', 'max:40']]);

        return response()->json($engine->request('/options', $input, 'get'));
    }
}
