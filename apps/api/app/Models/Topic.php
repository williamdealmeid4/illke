<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['author_name', 'session_key', 'build_id', 'title', 'category', 'context_id', 'body', 'locked', 'hidden'])]
class Topic extends Model
{
    protected $hidden = ['session_key'];

    protected function casts(): array
    {
        return ['locked' => 'boolean', 'hidden' => 'boolean'];
    }

    public function replies(): HasMany
    {
        return $this->hasMany(Reply::class)->where('hidden', false);
    }
}
