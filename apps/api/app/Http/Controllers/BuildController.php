<?php

namespace App\Http\Controllers;

use App\EngineClient;
use App\Models\Build;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BuildController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate(['q' => ['nullable', 'string', 'max:100'], 'context_id' => ['nullable', 'string', 'max:40']]);
        $query = Build::query()->withCount(['reactions as votes' => fn ($q) => $q->where('kind', 'vote')]);
        if ($request->boolean('mine')) {
            $query->where('session_key', $this->visitor($request));
        } else {
            $query->where('visibility', 'public');
        }
        if ($request->filled('context_id')) {
            $query->where('context_id', $request->string('context_id')->toString());
        }
        if ($request->filled('q')) {
            $query->where(fn ($q) => $q->where('pokemon', 'like', '%'.$request->string('q').'%')->orWhere('name', 'like', '%'.$request->string('q').'%'));
        }

        return response()->json($query->orderBy('pokemon')->orderBy('id')->paginate(24)->withQueryString());
    }

    public function show(Request $request, Build $build): JsonResponse
    {
        $this->readable($request, $build);

        return response()->json($build);
    }

    public function reaction(Request $request, Build $build): JsonResponse
    {
        $this->readable($request, $build);
        $input = $request->validate(['kind' => ['required', 'in:vote,favorite'], 'active' => ['required', 'boolean']]);
        $key = ['session_key' => $this->visitor($request), 'build_id' => $build->id, 'kind' => $input['kind']];
        if ($input['active']) {
            DB::table('reactions')->insertOrIgnore($key);
        } else {
            DB::table('reactions')->where($key)->delete();
        }

        return response()->json(['ok' => true]);
    }

    private function readable(Request $request, Build $build): void
    {
        abort_if($build->visibility === 'private' && $build->session_key !== $this->visitor($request), 404);
    }

    public function analyze(Request $request, EngineClient $engine): JsonResponse
    {
        return response()->json($engine->request('/evaluate', $request->validate(['configuration' => ['required', 'array']])['configuration']));
    }
}
