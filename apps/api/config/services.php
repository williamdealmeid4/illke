<?php

return [
    'discord' => ['enabled' => env('DISCORD_ENABLED', false), 'client_id' => env('DISCORD_APPLICATION_ID'), 'client_secret' => env('DISCORD_CLIENT_SECRET'), 'redirect_uri' => env('DISCORD_REDIRECT_URI', 'http://127.0.0.1:5186/api/v1/discord/callback'), 'url' => env('DISCORD_SERVICE_URL', 'http://127.0.0.1:8082'), 'token' => env('BOT_SERVICE_TOKEN')],
    'moderator_token' => env('MODERATOR_TOKEN'),
    'engine' => ['revision' => 'heuristic-singles-v1-reference-sets-v1', 'url' => env('ENGINE_URL', 'http://127.0.0.1:8081'), 'token' => env('ENGINE_TOKEN')],

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

];
