<?php

namespace App\Http\Controllers;

use App\Models\Topic;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ModerationController extends Controller
{
    public function session(Request $request): JsonResponse
    {
        return response()->json(['authorized' => $this->moderator($request)]);
    }

    public function login(Request $request): JsonResponse
    {
        $input = $request->validate(['token' => ['required', 'string', 'max:500']]);
        abort_unless(config('services.moderator_token') && hash_equals(config('services.moderator_token'), $input['token']), 403, 'Credencial de moderação inválida.');
        $this->visitor($request);
        $request->session()->regenerate();
        $request->session()->put('moderator_until', now()->addMinutes(30)->getTimestamp());

        return response()->json(['authorized' => true, 'expires_in' => 1800]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->session()->forget('moderator_until');

        return response()->json(['authorized' => false]);
    }

    public function index(Request $request): JsonResponse
    {
        abort_unless($this->moderator($request), 403);
        $reports = DB::table('reports')->join('topics', 'topics.id', '=', 'reports.topic_id')->select('reports.id', 'reports.topic_id', 'reports.reason', 'reports.resolved', 'reports.created_at', 'topics.title as topic_title', 'topics.hidden', 'topics.locked')->when(! $request->boolean('resolved'), fn ($q) => $q->where('reports.resolved', false))->orderByDesc('reports.id')->paginate(25);

        return response()->json($reports);
    }

    public function update(Request $request, int $report): JsonResponse
    {
        abort_unless($this->moderator($request), 403);
        $input = $request->validate(['action' => ['required', 'in:resolve,hide,lock']]);
        DB::transaction(function () use ($request, $report, $input): void {
            $record = DB::table('reports')->where('id', $report)->first();
            abort_unless($record, 404);
            if ($input['action'] !== 'resolve') {
                Topic::whereKey($record->topic_id)->update([$input['action'] === 'hide' ? 'hidden' : 'locked' => true]);
            }
            DB::table('reports')->where('id', $report)->update(['resolved' => true, 'updated_at' => now()]);
            DB::table('moderation_actions')->insert(['session_key' => $this->visitor($request), 'action' => $input['action'], 'target_id' => $record->topic_id, 'details' => json_encode(['report_id' => $report]), 'created_at' => now(), 'updated_at' => now()]);
        });

        return response()->json(['message' => 'Denúncia resolvida.']);
    }
}
