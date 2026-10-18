<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['author_name', 'public_id', 'session_key', 'source_key', 'name', 'pokemon', 'context_id', 'visibility', 'configuration', 'alternatives', 'source_name', 'source_url', 'legality', 'snapshot_id', 'validation_issues', 'source_active'])]
class Build extends Model
{
    protected $hidden = ['session_key'];

    protected function casts(): array
    {
        return ['configuration' => 'array', 'alternatives' => 'array', 'validation_issues' => 'array', 'source_active' => 'boolean'];
    }

    public function reactions(): HasMany
    {
        return $this->hasMany(Reaction::class);
    }

    public function getRouteKeyName(): string
    {
        return 'public_id';
    }
}
