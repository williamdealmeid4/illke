<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catalog_entries', function (Blueprint $table) {
            $table->id();
            $table->string('kind', 16)->index();
            $table->string('slug');
            $table->string('name')->index();
            $table->unsignedInteger('national_number')->nullable()->index();
            $table->unsignedTinyInteger('generation')->nullable();
            $table->json('image')->nullable();
            $table->json('attributes');
            $table->string('revision', 64);
            $table->unique(['kind', 'slug']);
            $table->timestamps();
        });
        Schema::create('builds', function (Blueprint $table) {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->string('session_key', 64)->nullable()->index();
            $table->string('author_name', 60)->nullable();
            $table->string('source_key')->nullable()->unique();
            $table->string('name', 100);
            $table->string('pokemon', 80)->index();
            $table->string('context_id', 40)->index();
            $table->string('visibility', 16)->default('private')->index();
            $table->json('configuration');
            $table->json('alternatives')->nullable();
            $table->string('source_name')->nullable();
            $table->text('source_url')->nullable();
            $table->string('legality', 20)->default('unchecked');
            $table->timestamps();
        });
        Schema::create('topics', function (Blueprint $table) {
            $table->id();
            $table->string('author_name', 60);
            $table->string('session_key', 64)->index();
            $table->foreignId('build_id')->nullable()->constrained()->nullOnDelete();
            $table->string('title', 160);
            $table->string('category', 40)->index();
            $table->string('context_id', 40)->nullable()->index();
            $table->text('body');
            $table->boolean('locked')->default(false);
            $table->boolean('hidden')->default(false);
            $table->timestamps();
        });
        Schema::create('replies', function (Blueprint $table) {
            $table->id();
            $table->string('author_name', 60);
            $table->foreignId('topic_id')->constrained()->cascadeOnDelete();
            $table->string('session_key', 64)->index();
            $table->text('body');
            $table->boolean('hidden')->default(false);
            $table->timestamps();
        });
        Schema::create('reactions', function (Blueprint $table) {
            $table->id();
            $table->string('session_key', 64)->index();
            $table->foreignId('build_id')->constrained()->cascadeOnDelete();
            $table->string('kind', 16);
            $table->unique(['session_key', 'build_id', 'kind']);
        });
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->string('session_key', 64)->index();
            $table->foreignId('topic_id')->constrained()->cascadeOnDelete();
            $table->string('reason', 1000);
            $table->boolean('resolved')->default(false);
            $table->timestamps();
        });
        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->string('session_key', 64)->index();
            $table->string('input_hash', 64)->index();
            $table->string('context_id', 40);
            $table->string('status', 20)->default('queued');
            $table->json('input');
            $table->json('result')->nullable();
            $table->text('error')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        foreach (['evaluations', 'reports', 'reactions', 'replies', 'topics', 'builds', 'catalog_entries'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
