<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['kind', 'slug', 'name', 'national_number', 'generation', 'image', 'attributes', 'revision'])]
class CatalogEntry extends Model
{
    protected function casts(): array
    {
        return ['image' => 'array', 'attributes' => 'array'];
    }
}
