<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discord_dispatches', function (Blueprint $table) {
            $table->id();
            $table->uuid('public_id')->unique();
            $table->string('session_key', 64)->index();
            $table->uuid('request_key');
            $table->string('status', 20)->default('queued');
            $table->json('configuration');
            $table->string('guild_id', 24);
            $table->string('channel_id', 24);
            $table->text('message_url')->nullable();
            $table->text('error')->nullable();
            $table->timestamps();
            $table->unique(['session_key', 'request_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discord_dispatches');
    }
};
