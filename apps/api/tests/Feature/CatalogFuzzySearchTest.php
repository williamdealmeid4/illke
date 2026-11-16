<?php

namespace Tests\Feature;

use App\Models\Build;
use App\Models\CatalogEntry;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CatalogFuzzySearchTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_catalog_suggests_and_returns_matches_for_typos_across_all_kinds(): void
    {
        CatalogEntry::create([
            'kind' => 'pokemon',
            'slug' => 'pikachu',
            'name' => 'Pikachu',
            'national_number' => 25,
            'generation' => 1,
            'revision' => 'test',
            'attributes' => ['types' => ['Electric']],
        ]);
        CatalogEntry::create([
            'kind' => 'pokemon',
            'slug' => 'charizard',
            'name' => 'Charizard',
            'national_number' => 6,
            'generation' => 1,
            'revision' => 'test',
            'attributes' => ['types' => ['Fire', 'Flying']],
        ]);
        CatalogEntry::create([
            'kind' => 'item',
            'slug' => 'choice-band',
            'name' => 'Choice Band',
            'national_number' => 0,
            'generation' => 3,
            'revision' => 'test',
            'attributes' => ['effect' => 'Boosts Attack'],
        ]);
        CatalogEntry::create([
            'kind' => 'move',
            'slug' => 'thunderbolt',
            'name' => 'Thunderbolt',
            'national_number' => 0,
            'generation' => 1,
            'revision' => 'test',
            'attributes' => ['type' => 'Electric', 'category' => 'Special'],
        ]);
        CatalogEntry::create([
            'kind' => 'ability',
            'slug' => 'intimidate',
            'name' => 'Intimidate',
            'national_number' => 0,
            'generation' => 3,
            'revision' => 'test',
            'attributes' => ['effect' => 'Lowers Attack'],
        ]);

        // Pokémon typo: pikachisu -> Pikachu
        $this->getJson('/api/v1/catalog/pokemon?q=pikachisu')
            ->assertOk()
            ->assertJsonPath('suggestion', 'Pikachu')
            ->assertJsonPath('data.0.slug', 'pikachu');

        // Exact match should not emit a suggestion
        $this->getJson('/api/v1/catalog/pokemon?q=pikachu')
            ->assertOk()
            ->assertJsonPath('suggestion', null)
            ->assertJsonPath('data.0.slug', 'pikachu');

        // Item typo: chocie band -> Choice Band
        $this->getJson('/api/v1/catalog/item?q=chocie%20band')
            ->assertOk()
            ->assertJsonPath('suggestion', 'Choice Band')
            ->assertJsonPath('data.0.slug', 'choice-band');

        // Move typo: tunderblot -> Thunderbolt
        $this->getJson('/api/v1/catalog/move?q=tunderblot')
            ->assertOk()
            ->assertJsonPath('suggestion', 'Thunderbolt')
            ->assertJsonPath('data.0.slug', 'thunderbolt');

        // Ability typo: intimdate -> Intimidate
        $this->getJson('/api/v1/catalog/ability?q=intimdate')
            ->assertOk()
            ->assertJsonPath('suggestion', 'Intimidate')
            ->assertJsonPath('data.0.slug', 'intimidate');

        // Unrelated gibberish should return null suggestion and empty data
        $this->getJson('/api/v1/catalog/pokemon?q=xyzqwerty')
            ->assertOk()
            ->assertJsonPath('suggestion', null)
            ->assertJsonCount(0, 'data');
    }

    public function test_builds_search_suggests_and_returns_matches_for_typos(): void
    {
        Build::create([
            'public_id' => (string) Str::uuid(),
            'context_id' => 'gen9-ou',
            'pokemon' => 'Pikachu',
            'name' => 'Pikachu Light Ball',
            'visibility' => 'public',
            'source_active' => true,
            'legality' => 'legal',
            'configuration' => ['pokemon' => 'Pikachu'],
        ]);

        $this->getJson('/api/v1/builds?q=pikachisu')
            ->assertOk()
            ->assertJsonPath('suggestion', 'Pikachu')
            ->assertJsonPath('data.0.pokemon', 'Pikachu');
    }
}
