<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['public_id', 'session_key', 'input_hash', 'context_id', 'status', 'input', 'result', 'error', 'snapshot_id', 'phase', 'progress', 'heartbeat_at'])]
class Evaluation extends Model
{
    protected $hidden = ['session_key'];

    protected function casts(): array
    {
        return ['input' => 'array', 'result' => 'array', 'heartbeat_at' => 'datetime'];
    }

    public function getRouteKeyName(): string
    {
        return 'public_id';
    }
}
