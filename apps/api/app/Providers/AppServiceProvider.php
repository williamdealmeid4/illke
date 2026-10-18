<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        foreach (['api-read' => 180, 'stats' => 120, 'analysis' => 30, 'team-import' => 30, 'team-validation' => 30, 'topics' => 5, 'replies' => 15, 'reports' => 5, 'discord' => 3, 'evaluations' => 3, 'moderation-login' => 5] as $name => $maximum) {
            RateLimiter::for($name, fn (Request $request) => Limit::perMinute($maximum)->by($name.':'.($name === 'moderation-login' ? $request->ip() : $request->session()->get('visitor_key', hash('sha256', $request->session()->getId())))));
        }
        foreach (['views', 'sessions', 'cache/data'] as $directory) {
            $path = storage_path('framework/'.$directory);
            if (! is_dir($path)) {
                mkdir($path, 0755, true);
            }
        }
        if (! config('view.compiled')) {
            config(['view.compiled' => storage_path('framework/views')]);
        }
    }
}
