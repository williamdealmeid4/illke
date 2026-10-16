<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['public_id', 'session_key', 'request_key', 'status', 'guild_id', 'channel_id', 'configuration', 'message_url', 'error'])]
class DiscordDispatch extends Model
{
    protected $hidden = ['session_key', 'request_key'];

    protected function casts(): array
    {
        return ['configuration' => 'array'];
    }

    public function getRouteKeyName(): string
    {
        return 'public_id';
    }
}
