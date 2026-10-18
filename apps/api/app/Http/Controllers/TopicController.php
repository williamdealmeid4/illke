<?php

namespace App\Http\Controllers;

use App\Models\Build;
use App\Models\Reply;
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

    public function show(Request $request, Topic $topic): JsonResponse
    {
        abort_if($topic->hidden, 404);

        $topic->setAttribute('can_edit', $topic->session_key === $this->visitor($request) || $this->moderator($request));
        $replies = $topic->replies()->orderBy('id')->paginate(50);
        $replies->getCollection()->each(fn ($reply) => $reply->setAttribute('can_edit', $reply->session_key === $this->visitor($request) || $this->moderator($request)));

        return response()->json(['topic' => $topic, 'replies' => $replies, 'build' => $topic->build_id ? Build::whereKey($topic->build_id)->where('visibility', 'public')->first() : null]);
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
        $isModerator = $this->moderator($request);
        abort_unless($isModerator || $this->visitor($request) === $topic->session_key, 404);
        $rules = $isModerator ? ['hidden' => ['sometimes', 'boolean'], 'locked' => ['sometimes', 'boolean']] : [];
        $input = $request->validate([...$rules, 'title' => ['sometimes', 'string', 'min:5', 'max:160'], 'body' => ['sometimes', 'string', 'min:10', 'max:20000']]);
        $topic->update($input);

        return response()->json($topic);
    }

    public function updateReply(Request $request, Topic $topic, Reply $reply): JsonResponse
    {
        abort_unless($reply->topic_id === $topic->id && ! $topic->hidden && ! $reply->hidden, 404);
        abort_unless($reply->session_key === $this->visitor($request) || $this->moderator($request), 404);
        $reply->update($request->validate(['body' => ['required', 'string', 'min:2', 'max:20000']]));

        return response()->json($reply);
    }

    public function hideReply(Request $request, Topic $topic, Reply $reply): JsonResponse
    {
        abort_unless($reply->topic_id === $topic->id && ! $topic->hidden, 404);
        abort_unless($reply->session_key === $this->visitor($request) || $this->moderator($request), 404);
        $reply->update(['hidden' => true]);
        if ($this->moderator($request)) {
            DB::table('moderation_actions')->insert(['session_key' => $this->visitor($request), 'action' => 'hide_reply', 'target_id' => $reply->id, 'created_at' => now(), 'updated_at' => now()]);
        }

        return response()->json(['message' => 'Resposta ocultada.']);
    }
}
