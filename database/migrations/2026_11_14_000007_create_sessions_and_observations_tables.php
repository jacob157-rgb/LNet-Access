<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('router_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('router_connection_id')->constrained('router_connections')->cascadeOnDelete();
            $table->string('account_type'); // 'hotspot', 'pppoe'
            $table->string('username');
            $table->string('router_session_id');
            $table->string('ip_address')->nullable();
            $table->string('observed_mac')->nullable();
            $table->string('server_name')->nullable();
            $table->string('interface_name')->nullable();
            $table->foreignId('ap_id')->nullable()->constrained('access_points')->nullOnDelete();
            $table->unsignedInteger('uptime_seconds')->default(0);
            $table->unsignedBigInteger('bytes_in')->default(0);
            $table->unsignedBigInteger('bytes_out')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('observed_at');
            $table->timestamp('ended_at')->nullable();
            $table->json('raw_attributes_json')->nullable();
            $table->timestamps();

            $table->index(['router_connection_id', 'username']);
            $table->index(['observed_mac']);
        });

        Schema::create('mac_observations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->nullable()->constrained('members')->nullOnDelete();
            $table->foreignId('network_account_id')->nullable()->constrained('network_accounts')->nullOnDelete();
            $table->foreignId('router_connection_id')->constrained('router_connections')->cascadeOnDelete();
            $table->string('observed_mac');
            $table->string('source'); // 'hotspot_active', 'bridge_host', 'dhcp', 'arp', 'ppp_caller_id'
            $table->foreignId('ap_id')->nullable()->constrained('access_points')->nullOnDelete();
            $table->string('router_bridge_name')->nullable();
            $table->string('router_bridge_port')->nullable();
            $table->string('ip_address')->nullable();
            $table->string('confidence')->default('unverified'); // 'reliable', 'approximate', 'unknown', 'manually_confirmed', 'unverified'
            $table->timestamp('first_seen_at');
            $table->timestamp('last_seen_at');
            $table->timestamps();

            $table->index(['observed_mac']);
            $table->index(['member_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mac_observations');
        Schema::dropIfExists('router_sessions');
    }
};
