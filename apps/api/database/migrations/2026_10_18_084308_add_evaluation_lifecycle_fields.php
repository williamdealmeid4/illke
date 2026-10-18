<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('catalog_entries', fn (Blueprint $table) => $table->string('snapshot_id', 64)->nullable()->index());
        Schema::table('evaluations', function (Blueprint $table): void {
            $table->string('snapshot_id', 64)->nullable();
            $table->string('phase', 40)->nullable();
            $table->unsignedInteger('progress')->default(0);
            $table->timestamp('heartbeat_at')->nullable();
        });
        Schema::table('builds', function (Blueprint $table): void {
            $table->string('snapshot_id', 64)->nullable()->index();
            $table->json('validation_issues')->nullable();
            $table->boolean('source_active')->default(true)->index();
        });
        Schema::create('moderation_actions', function (Blueprint $table): void {
            $table->id();
            $table->string('session_key', 64);
            $table->string('action', 40);
            $table->unsignedBigInteger('target_id');
            $table->json('details')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('moderation_actions');
        Schema::table('catalog_entries', fn (Blueprint $table) => $table->dropColumn('snapshot_id'));
        Schema::table('evaluations', fn (Blueprint $table) => $table->dropColumn(['snapshot_id', 'phase', 'progress', 'heartbeat_at']));
        Schema::table('builds', fn (Blueprint $table) => $table->dropColumn(['snapshot_id', 'validation_issues', 'source_active']));
    }
};
