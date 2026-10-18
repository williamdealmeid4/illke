<?php

use App\Http\Controllers\BuildController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\DiscordController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\ModerationController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\TopicController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json(['service' => 'illke', 'api' => '/api/v1']));
Route::prefix('api/v1')->name('api.')->group(function (): void {
    Route::get('sprite/{pokemon}', [CatalogController::class, 'sprite']);
    Route::get('session', function () {
        $availability = DiscordController::availability();

        return response()->json(['csrf_token' => csrf_token(), 'discord_available' => $availability['available'], 'discord_reason' => $availability['reason'], 'discord_invite_url' => DiscordController::inviteUrl()]);
    });
    Route::get('discord/connect', [DiscordController::class, 'connect']);
    Route::get('discord/callback', [DiscordController::class, 'callback']);
    Route::get('discord/destinations', [DiscordController::class, 'destinations']);
    Route::post('discord/builds', [DiscordController::class, 'store'])->middleware('throttle:discord');
    Route::get('discord/builds/{discordDispatch}', [DiscordController::class, 'show']);
    Route::get('summary', [CatalogController::class, 'summary']);
    Route::get('coverage', [CatalogController::class, 'coverage']);
    Route::get('species', [CatalogController::class, 'species']);
    Route::get('contexts', [CatalogController::class, 'contexts']);
    Route::get('options', [CatalogController::class, 'options']);
    Route::get('catalog/{kind}', [CatalogController::class, 'index']);
    Route::get('catalog/{kind}/{slug}', [CatalogController::class, 'show']);
    Route::get('builds', [BuildController::class, 'index']);
    Route::get('builds/{build}', [BuildController::class, 'show']);
    Route::post('analyze', [BuildController::class, 'analyze'])->middleware('throttle:analysis');
    Route::post('teams/import', [TeamController::class, 'importTeam'])->middleware('throttle:team-import');
    Route::post('teams/validate', [TeamController::class, 'validateTeam'])->middleware('throttle:team-validation');
    Route::post('teams/analyze', [TeamController::class, 'analyze'])->middleware('throttle:analysis');
    Route::post('damage', [TeamController::class, 'damage'])->middleware('throttle:analysis');
    Route::post('stats', [TeamController::class, 'stats'])->middleware('throttle:stats');
    Route::get('topics', [TopicController::class, 'index']);
    Route::get('topics/{topic}', [TopicController::class, 'show']);
    Route::put('builds/{build}/reaction', [BuildController::class, 'reaction']);
    Route::post('topics', [TopicController::class, 'store'])->middleware('throttle:topics');
    Route::post('topics/{topic}/replies', [TopicController::class, 'reply'])->middleware('throttle:replies');
    Route::patch('topics/{topic}/replies/{reply}', [TopicController::class, 'updateReply'])->middleware('throttle:replies');
    Route::delete('topics/{topic}/replies/{reply}', [TopicController::class, 'hideReply'])->middleware('throttle:replies');
    Route::post('topics/{topic}/reports', [TopicController::class, 'report'])->middleware('throttle:reports');
    Route::patch('topics/{topic}', [TopicController::class, 'update']);
    Route::post('evaluations', [EvaluationController::class, 'store'])->middleware('throttle:evaluations');
    Route::get('evaluations', [EvaluationController::class, 'index'])->middleware('throttle:api-read');
    Route::get('evaluations/{evaluation}', [EvaluationController::class, 'show']);
    Route::delete('evaluations/{evaluation}', [EvaluationController::class, 'destroy']);
    Route::get('moderation/session', [ModerationController::class, 'session']);
    Route::post('moderation/session', [ModerationController::class, 'login'])->middleware('throttle:moderation-login');
    Route::delete('moderation/session', [ModerationController::class, 'logout']);
    Route::get('moderation/reports', [ModerationController::class, 'index']);
    Route::patch('moderation/reports/{report}', [ModerationController::class, 'update']);
    foreach (Route::getRoutes() as $route) {
        if (str_starts_with($route->uri(), 'api/v1/') && in_array('GET', $route->methods()) && ! str_starts_with($route->uri(), 'api/v1/sprite/')) {
            $route->middleware('throttle:api-read');
        }
    }
});
