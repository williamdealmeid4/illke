<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['author_name', 'topic_id', 'session_key', 'body', 'hidden'])]
class Reply extends Model
{
    protected $hidden = ['session_key'];

    protected function casts(): array
    {
        return ['hidden' => 'boolean'];
    }
}
