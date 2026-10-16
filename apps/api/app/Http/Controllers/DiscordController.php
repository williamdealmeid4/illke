<?php

namespace App\Http\Controllers;

use App\EngineClient;
use App\Jobs\SendDiscordBuild;
use App\Models\DiscordDispatch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class DiscordController extends Controller
{
    public static function inviteUrl(): ?string
    {
        $clientId = config('services.discord.client_id');

        return $clientId ? 'https://discord.com/oauth2/authorize?'.http_build_query(['client_id' => $clientId, 'scope' => 'bot applications.commands', 'permissions' => '19456']) : null;
    }

    public function connect(Request $request): RedirectResponse
    {
        abort_unless(config('services.discord.client_id') && config('services.discord.client_secret'), 503, 'A conexão Discord ainda não está configurada.');
        $state = Str::random(64);
        $request->session()->put('discord_oauth', ['state' => $state, 'expires' => time() + 300]);

        return redirect()->away('https://discord.com/oauth2/authorize?'.http_build_query(['client_id' => config('services.discord.client_id'), 'redirect_uri' => config('services.discord.redirect_uri'), 'response_type' => 'code', 'scope' => 'identify guilds', 'state' => $state]));
    }

    public function callback(Request $request): RedirectResponse
    {
        $state = $request->session()->pull('discord_oauth');
        abort_unless($state && $state['expires'] >= time() && hash_equals($state['state'], (string) $request->query('state', '')), 403, 'Conexão expirada. Tente novamente.');
        if ($request->has('error')) {
            return redirect()->to(config('app.frontend_url').'/builder?discord=cancelled');
        }
        $request->validate(['code' => ['required', 'string', 'max:200']]);
        $token = Http::asForm()->timeout(15)->post('https://discord.com/api/v10/oauth2/token', ['client_id' => config('services.discord.client_id'), 'client_secret' => config('services.discord.client_secret'), 'grant_type' => 'authorization_code', 'code' => $request->query('code'), 'redirect_uri' => config('services.discord.redirect_uri')])->throw()->json('access_token');
        $guilds = [];
        $after = null;
        for ($page = 0; $page < 10; $page++) {
            $batch = Http::withToken($token)->timeout(15)->get('https://discord.com/api/v10/users/@me/guilds', array_filter(['limit' => 200, 'after' => $after]))->throw()->json();
            foreach ($batch as $guild) {
                if (($guild['owner'] ?? false) || (((int) $guild['permissions'] & 8) === 8)) {
                    $guilds[] = ['id' => $guild['id'], 'name' => $guild['name']];
                }
            }
            if (count($batch) < 200) {
                break;
            }
            $after = end($batch)['id'];
        }
        $request->session()->put('discord_access', ['guilds' => $guilds, 'expires' => time() + 900]);

        return redirect()->to(config('app.frontend_url').'/builder?discord=connected');
    }

    public function destinations(Request $request): JsonResponse
    {
        $access = $request->session()->get('discord_access');
        if (! $access || $access['expires'] < time()) {
            return response()->json(['connected' => false, 'guilds' => [], 'invite_url' => self::inviteUrl()]);
        }
        $response = Http::withToken(config('services.discord.token'))->timeout(20)->post(rtrim(config('services.discord.url'), '/').'/destinations', ['guilds' => $access['guilds']])->throw()->json();
        $request->session()->put('discord_destinations', $response['guilds']);

        return response()->json(['connected' => true, 'guilds' => $response['guilds'], 'invite_url' => self::inviteUrl()]);
    }

    public function store(Request $request, EngineClient $engine): JsonResponse
    {
        abort_unless(config('services.discord.enabled') && config('services.discord.token'), 503, 'O envio para o Discord ainda não está habilitado.');
        $input = $request->validate(['request_key' => ['required', 'uuid'], 'guild_id' => ['required', 'regex:/^[0-9]{1,24}$/'], 'channel_id' => ['required', 'regex:/^[0-9]{1,24}$/'], 'configuration' => ['required', 'array']]);
        $access = $request->session()->get('discord_access');
        abort_unless($access && $access['expires'] >= time(), 403, 'Conecte seu Discord para escolher um servidor.');
        $guild = collect($request->session()->get('discord_destinations', []))->firstWhere('id', $input['guild_id']);
        abort_unless($guild && collect($guild['channels'])->contains('id', $input['channel_id']), 403, 'Escolha um canal autorizado do seu servidor.');
        $existing = DiscordDispatch::where('session_key', $this->visitor($request))->where('request_key', $input['request_key'])->first();
        if ($existing) {
            return response()->json($existing);
        }
        $evaluation = $engine->request('/evaluate', $input['configuration']);
        abort_unless($evaluation['legality']['status'] === 'legal', 422, 'Corrija a build antes de enviar ao Discord.');
        $dispatch = DiscordDispatch::firstOrCreate(['session_key' => $this->visitor($request), 'request_key' => $input['request_key']], ['public_id' => (string) Str::uuid(), 'configuration' => $input['configuration'], 'guild_id' => $input['guild_id'], 'channel_id' => $input['channel_id'], 'status' => 'queued']);
        if ($dispatch->wasRecentlyCreated) {
            SendDiscordBuild::dispatch($dispatch->id);
        }

        return response()->json($dispatch, 202);
    }

    public function show(Request $request, DiscordDispatch $discordDispatch): JsonResponse
    {
        abort_unless($discordDispatch->session_key === $this->visitor($request), 404);

        return response()->json($discordDispatch);
    }
}
