<?php

namespace App\Console\Commands;

use App\Models\Build;
use App\Models\CatalogEntry;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImportCatalog extends Command
{
    protected $signature = 'catalog:import {path?}';

    protected $description = 'Importa o snapshot auditado da PokéAPI e das builds.';

    public function handle(): int
    {
        $path = $this->argument('path') ?: base_path('../../.data/catalog.json');
        if (! is_file($path)) {
            $this->error('Snapshot ausente. Execute npm run sync:data na raiz.');

            return self::FAILURE;
        }
        $data = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
        $data['snapshot_id'] ??= hash_file('sha256', $path);
        if (empty($data['entities']) || empty($data['builds'])) {
            $this->error('Snapshot vazio: o acervo anterior foi preservado.');

            return self::FAILURE;
        }
        DB::transaction(function () use ($data): void {
            foreach (array_chunk($data['entities'], 200) as $chunk) {
                $rows = array_map(fn (array $row): array => [...$row, 'snapshot_id' => $data['snapshot_id'], 'image' => isset($row['image']) ? json_encode($row['image']) : null, 'attributes' => json_encode($row['attributes']), 'revision' => $data['revision'], 'created_at' => now(), 'updated_at' => now()], $chunk);
                CatalogEntry::upsert($rows, ['kind', 'slug'], ['name', 'national_number', 'generation', 'image', 'attributes', 'revision', 'snapshot_id', 'updated_at']);
            }
            Build::whereNotNull('source_key')->update(['source_active' => false]);
            foreach ($data['builds'] as $build) {
                Build::updateOrCreate(['source_key' => $build['slug']], ['public_id' => Build::where('source_key', $build['slug'])->value('public_id') ?: (string) Str::uuid(), 'name' => $build['name'], 'pokemon' => $build['pokemon'], 'context_id' => $build['context_id'], 'visibility' => 'public', 'configuration' => collect($build)->only(['name', 'nickname', 'context_id', 'pokemon', 'level', 'nature', 'ability', 'item', 'moves', 'evs', 'ivs', 'tera_type', 'role', 'strategy', 'visibility'])->all(), 'alternatives' => $build['alternatives'], 'source_name' => $build['source_name'], 'source_url' => $build['source_url'], 'legality' => $build['legality'], 'validation_issues' => $build['issues'] ?? [], 'source_active' => true, 'snapshot_id' => $data['snapshot_id']]);
            }
            CatalogEntry::whereNotNull('snapshot_id')->where('snapshot_id', '!=', $data['snapshot_id'])->delete();
        });
        Storage::put('catalog-metadata.json', json_encode(collect($data)->except(['entities', 'builds'])->all()));
        $this->info('Catálogo importado: '.count($data['entities']).' registros; '.count($data['builds']).' builds.');

        return self::SUCCESS;
    }
}
