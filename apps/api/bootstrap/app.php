<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->convertEmptyStringsToNull(except: [fn (Request $request): bool => $request->is('api/v1/*')]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function ($response) {
            if (! request()->is('api/*') || $response->getStatusCode() < 400) {
                return $response;
            }
            $status = $response->getStatusCode();
            $original = json_decode($response->getContent(), true) ?: [];
            $retry = (int) $response->headers->get('Retry-After', 0);
            $message = match ($status) {
                429 => 'Muitas tentativas nesta ação. Aguarde '.$retry.' segundos e tente novamente.',
                503, 502, 504 => 'O serviço está temporariamente indisponível. Seu rascunho foi preservado.',
                500 => 'Não foi possível concluir a operação. Tente novamente.',
                default => $original['message'] ?? 'Não foi possível concluir a operação.',
            };
            $response->setContent(json_encode(['message' => $message, 'errors' => $original['errors'] ?? [], 'error' => ['code' => 'HTTP_'.$status, 'message' => $message, 'fields' => $original['errors'] ?? [], 'retry_after' => $retry]], JSON_UNESCAPED_UNICODE));
            $response->headers->set('Content-Type', 'application/json');

            return $response;
        });
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
