<?php

namespace App\Jobs;

use App\Models\CatalogEntry;
use App\Models\DiscordDispatch;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Http;
use Throwable;

class SendDiscordBuild implements ShouldQueue
{
    use Queueable;

    public int $tries = 1;

    public int $timeout = 40;

    public function __construct(public int $dispatchId) {}

    public function handle(): void
    {
        $dispatch = DiscordDispatch::findOrFail($this->dispatchId);
        if ($dispatch->status !== 'queued') {
            return;
        }
        $dispatch->update(['status' => 'sending']);
        $build = $dispatch->configuration;
        $entry = CatalogEntry::where('kind', 'pokemon')->where('name', $build['pokemon'])->first();
        $response = Http::withToken(config('services.discord.token'))->timeout(25)->post(rtrim(config('services.discord.url'), '/').'/dispatch', ['id' => $dispatch->public_id, 'guild_id' => $dispatch->guild_id, 'channel_id' => $dispatch->channel_id, 'configuration' => $build, 'image_url' => $entry?->image['url'] ?? null]);
        $response->throw();
        $dispatch->update(['status' => 'sent', 'message_url' => $response->json('message_url')]);
    }

    public function failed(?Throwable $exception): void
    {
        DiscordDispatch::whereKey($this->dispatchId)->update(['status' => 'unconfirmed', 'error' => 'Não foi possível confirmar o envio. Confira o canal antes de solicitar novamente.']);
    }
}
