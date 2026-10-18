<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

abstract class Controller
{
    protected function visitor(Request $request): string
    {
        if (! $request->session()->has('visitor_key')) {
            $request->session()->put('visitor_key', hash('sha256', $request->session()->getId()));
        }

        return $request->session()->get('visitor_key');
    }

    protected function moderator(Request $request): bool
    {
        return (int) $request->session()->get('moderator_until', 0) > now()->getTimestamp()
            || (config('services.moderator_token') && hash_equals(config('services.moderator_token'), $request->bearerToken() ?? ''));
    }
}
