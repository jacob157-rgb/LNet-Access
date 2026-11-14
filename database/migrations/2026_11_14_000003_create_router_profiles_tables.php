<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hotspot_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('router_connection_id')->constrained('router_connections')->cascadeOnDelete();
            $table->string('router_object_id');
            $table->string('name');
            $table->string('rate_limit')->nullable();
            $table->unsignedInteger('shared_users')->default(1);
            $table->string('session_timeout')->nullable();
            $table->string('idle_timeout')->nullable();
            $table->json('raw_attributes_json')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->boolean('is_present')->default(true);
            $table->timestamps();

            $table->unique(['router_connection_id', 'name'], 'hs_prof_router_name_unique');
        });

        Schema::create('ppp_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('router_connection_id')->constrained('router_connections')->cascadeOnDelete();
            $table->string('router_object_id');
            $table->string('name');
            $table->string('local_address')->nullable();
            $table->string('remote_address')->nullable();
            $table->string('rate_limit')->nullable();
            $table->json('raw_attributes_json')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->boolean('is_present')->default(true);
            $table->timestamps();

            $table->unique(['router_connection_id', 'name'], 'ppp_prof_router_name_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ppp_profiles');
        Schema::dropIfExists('hotspot_profiles');
    }
};
