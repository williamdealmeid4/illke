<?php

namespace App\Http\Controllers;

use App\Models\Build;
use App\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TopicController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate(['category' => ['nullable', 'string', 'max:40'], 'context_id' => ['nullable', 'string', 'max:40']]);
        $query = Topic::where('hidden', false)->withCount('replies');
        foreach (['category', 'context_id'] as $key) {
            if ($request->filled($key)) {
                $query->where($key, $request->string($key)->toString());
            }
        }

        return response()->json($query->latest('id')->paginate(25)->withQueryString());
    }

    public function show(Topic $topic): JsonResponse
    {
        abort_if($topic->hidden, 404);

        return response()->json(['topic' => $topic, 'replies' => $topic->replies()->orderBy('id')->paginate(50)]);
    }

    public function store(Request $request): JsonResponse
    {
        $input = $request->validate(['author_name' => ['required', 'string', 'min:2', 'max:60'], 'title' => ['required', 'string', 'min:5', 'max:160'], 'category' => ['required', 'in:estrategia,equipes,campanha,duvidas,geral'], 'context_id' => ['nullable', 'string', 'max:40'], 'body' => ['required', 'string', 'min:10', 'max:20000'], 'build_id' => ['nullable', 'integer']]);
        if (isset($input['build_id'])) {
            abort_unless(Build::whereKey($input['build_id'])->where('visibility', 'public')->exists(), 422, 'A build precisa ser pública.');
        }

        return response()->json(Topic::create([...$input, 'session_key' => $this->visitor($request)]), 201);
    }

    public function reply(Request $request, Topic $topic): JsonResponse
    {
        abort_if($topic->hidden, 404);
        abort_if($topic->locked, 403, 'Este tópico está fechado.');
        $input = $request->validate(['author_name' => ['required', 'string', 'min:2', 'max:60'], 'body' => ['required', 'string', 'min:2', 'max:20000']]);

        return response()->json($topic->replies()->create([...$input, 'session_key' => $this->visitor($request)]), 201);
    }

    public function report(Request $request, Topic $topic): JsonResponse
    {
        abort_if($topic->hidden, 404);
        $input = $request->validate(['reason' => ['required', 'string', 'min:5', 'max:1000']]);
        DB::table('reports')->insert([...$input, 'session_key' => $this->visitor($request), 'topic_id' => $topic->id, 'created_at' => now(), 'updated_at' => now()]);

        return response()->json(['message' => 'Denúncia registrada.'], 201);
    }

    public function update(Request $request, Topic $topic): JsonResponse
    {
        $isModerator = config('services.moderator_token') && hash_equals(config('services.moderator_token'), $request->bearerToken() ?? '');
        abort_unless($isModerator || $this->visitor($request) === $topic->session_key, 404);
        $rules = $isModerator ? ['hidden' => ['sometimes', 'boolean'], 'locked' => ['sometimes', 'boolean']] : [];
        $input = $request->validate([...$rules, 'title' => ['sometimes', 'string', 'min:5', 'max:160'], 'body' => ['sometimes', 'string', 'min:10', 'max:20000']]);
        $topic->update($input);

        return response()->json($topic);
    }
}
