<?php

namespace App;

use Illuminate\Support\Facades\Http;

class EngineClient
{
    public function request(string $path, array $input = [], string $method = 'post', int $timeout = 20): array
    {
        $client = Http::baseUrl(config('services.engine.url'))->withToken(config('services.engine.token'))->acceptJson()->timeout($timeout);
        $response = $method === 'get' ? $client->get($path, $input) : $client->post($path, $input);

        return $response->throw()->json();
    }
}
