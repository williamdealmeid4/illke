<?php

use App\Http\Controllers\BuildController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\DiscordController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\TeamController;
use App\Http\Controllers\TopicController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json(['service' => 'illke', 'api' => '/api/v1']));
Route::prefix('api/v1')->name('api.')->middleware('throttle:180,1')->group(function (): void {
    Route::get('sprite/{pokemon}', [CatalogController::class, 'sprite']);
    Route::get('session', fn () => response()->json(['csrf_token' => csrf_token(), 'discord_available' => (bool) config('services.discord.enabled'), 'discord_invite_url' => DiscordController::inviteUrl()]));
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
    Route::post('analyze', [BuildController::class, 'analyze'])->middleware('throttle:30,1');
    Route::post('teams/import', [TeamController::class, 'importTeam'])->middleware('throttle:30,1');
    Route::post('teams/validate', [TeamController::class, 'validateTeam'])->middleware('throttle:30,1');
    Route::get('topics', [TopicController::class, 'index']);
    Route::get('topics/{topic}', [TopicController::class, 'show']);
    Route::put('builds/{build}/reaction', [BuildController::class, 'reaction']);
    Route::post('topics', [TopicController::class, 'store'])->middleware('throttle:5,1');
    Route::post('topics/{topic}/replies', [TopicController::class, 'reply'])->middleware('throttle:15,1');
    Route::post('topics/{topic}/reports', [TopicController::class, 'report'])->middleware('throttle:5,1');
    Route::patch('topics/{topic}', [TopicController::class, 'update']);
    Route::post('evaluations', [EvaluationController::class, 'store'])->middleware('throttle:evaluations');
    Route::get('evaluations/{evaluation}', [EvaluationController::class, 'show']);
});
