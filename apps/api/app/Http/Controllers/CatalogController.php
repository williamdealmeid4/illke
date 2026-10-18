<?php

namespace App\Http\Controllers;

use App\EngineClient;
use App\Models\Build;
use App\Models\CatalogEntry;
use App\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
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

    public function sprite(Request $request, string $pokemon): RedirectResponse|Response
    {
        $id = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $pokemon));
        $aliases = [preg_replace('/-Paldea-(Combat|Blaze|Aqua)$/i', '-paldea-$1-breed', $pokemon), preg_replace('/^(Pikachu)-(Original|Hoenn|Sinnoh|Unova|Kalos|Alola|Partner|World)$/i', '$1-$2-cap', $pokemon), preg_replace('/-Alola-Totem$/i', '-totem-alola', $pokemon)];
        $entry = CatalogEntry::where('kind', 'pokemon')->where(fn ($q) => $q->whereRaw('LOWER(name) = ?', [strtolower($pokemon)])->orWhere('slug', strtolower($pokemon))->orWhereIn('slug', array_map('strtolower', $aliases))->orWhere('attributes->showdown_id', $id))->first();
        if (! $entry?->image) {
            $label = htmlspecialchars($pokemon, ENT_XML1 | ENT_QUOTES, 'UTF-8');

            return response('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="240" height="240" rx="20" fill="#202c3d"/><circle cx="120" cy="85" r="38" fill="none" stroke="#a6b2c7" stroke-width="4"/><path d="M82 85h76" stroke="#a6b2c7" stroke-width="4"/><text x="120" y="158" text-anchor="middle" fill="#e8edf6" font-family="sans-serif" font-size="12">Sprite indisponível</text><text x="120" y="180" text-anchor="middle" fill="#a6b2c7" font-family="sans-serif" font-size="10">'.$label.'</text></svg>', 200, ['Content-Type' => 'image/svg+xml', 'Cache-Control' => 'public, max-age=3600', 'X-Sprite-Fallback' => 'unavailable']);
        }

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
