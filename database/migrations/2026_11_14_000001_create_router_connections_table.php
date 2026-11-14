<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('router_connections', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('host');
            $table->unsignedInteger('port')->default(8729);
            $table->string('transport')->default('api_ssl'); // 'api_ssl', 'api', 'rest'
            $table->string('username');
            $table->text('password_encrypted');
            $table->boolean('tls_verify')->default(true);
            $table->string('ca_certificate_path')->nullable();
            $table->string('routeros_version')->nullable();
            $table->string('router_identity')->nullable();
            $table->string('board_name')->nullable();
            $table->unsignedInteger('cpu_load')->nullable();
            $table->unsignedBigInteger('free_memory')->nullable();
            $table->unsignedBigInteger('total_memory')->nullable();
            $table->string('uptime')->nullable();
            $table->string('connection_status')->default('unknown'); // 'online', 'offline', 'stale', 'unknown'
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamp('last_sync_at')->nullable();
            $table->text('last_error')->nullable();
            $table->json('capabilities_json')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('router_connections');
    }
};
