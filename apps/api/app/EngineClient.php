<?php

namespace App;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EngineClient
{
    public function request(string $path, array $input = [], string $method = 'post', int $timeout = 20): array
    {
        $client = Http::baseUrl(config('services.engine.url'))->withToken(config('services.engine.token'))->acceptJson()->connectTimeout(3)->timeout($timeout);
        $response = $method === 'get' ? $client->get($path, $input) : $client->post($path, $input);

        if (! $response->successful()) {
            abort($response->status() === 422 ? 422 : 503, $response->json('error.message') ?: 'O motor está temporariamente ocupado. Tente novamente.');
        }
        $result = $response->json();
        if (! is_array($result)) {
            Log::warning('Invalid engine response', ['path' => $path, 'status' => $response->status(), 'bytes' => strlen($response->body()), 'preview' => substr($response->body(), 0, 200)]);
            abort(503, 'O motor retornou uma resposta incompleta. A etapa será retomada.');
        }

        return $result;
    }
}
