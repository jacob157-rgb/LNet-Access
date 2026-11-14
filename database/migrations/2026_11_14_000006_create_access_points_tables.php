<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('access_points', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('location')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('management_router_id')->nullable()->constrained('router_connections')->nullOnDelete();
            $table->string('management_ip');
            $table->string('management_mac')->nullable();
            $table->string('health_check_type')->default('icmp'); // 'icmp', 'http', 'https', 'tcp'
            $table->string('health_check_url')->nullable();
            $table->unsignedInteger('health_check_port')->nullable();
            $table->json('expected_http_statuses_json')->nullable();
            $table->unsignedInteger('check_interval_seconds')->default(60);
            $table->unsignedInteger('timeout_ms')->default(2000);
            $table->unsignedInteger('failure_threshold')->default(3);
            $table->unsignedInteger('consecutive_failures')->default(0);
            $table->string('status')->default('unknown'); // 'online', 'degraded', 'offline', 'unknown', 'stale'
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamp('last_success_at')->nullable();
            $table->unsignedInteger('last_response_ms')->nullable();
            $table->unsignedInteger('last_http_status')->nullable();
            $table->text('last_error')->nullable();
            $table->string('topology_mode')->default('unknown'); // 'bridged_dedicated_port', 'bridged_shared_uplink', 'router_nat', 'unknown'
            $table->string('router_bridge_name')->nullable();
            $table->string('router_bridge_port')->nullable();
            $table->string('client_mapping_capability')->default('unavailable'); // 'reliable', 'approximate', 'unavailable'
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('access_point_health_checks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('access_point_id')->constrained('access_points')->cascadeOnDelete();
            $table->string('check_type');
            $table->string('status'); // 'online', 'degraded', 'offline'
            $table->unsignedInteger('response_ms')->nullable();
            $table->unsignedInteger('http_status')->nullable();
            $table->unsignedInteger('packet_loss_percent')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('checked_at');

            $table->index(['access_point_id', 'checked_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('access_point_health_checks');
        Schema::dropIfExists('access_points');
    }
};
