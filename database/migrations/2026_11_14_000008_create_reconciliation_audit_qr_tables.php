<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sync_runs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('router_connection_id')->constrained('router_connections')->cascadeOnDelete();
            $table->string('sync_type'); // 'health', 'sessions', 'inventory', 'bridge_host', 'reconciliation'
            $table->string('status')->default('running'); // 'running', 'completed', 'failed', 'stale'
            $table->timestamp('started_at');
            $table->timestamp('finished_at')->nullable();
            $table->unsignedInteger('records_read')->default(0);
            $table->unsignedInteger('records_created')->default(0);
            $table->unsignedInteger('records_updated')->default(0);
            $table->unsignedInteger('records_missing')->default(0);
            $table->text('error_summary')->nullable();
            $table->json('details_json')->nullable();
            $table->timestamps();
        });

        Schema::create('reconciliation_issues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('router_connection_id')->constrained('router_connections')->cascadeOnDelete();
            $table->string('entity_type'); // 'hotspot_user', 'ppp_secret', 'hotspot_profile', 'ppp_profile'
            $table->unsignedBigInteger('local_entity_id')->nullable();
            $table->string('router_object_id')->nullable();
            $table->string('issue_type'); // 'missing_on_router', 'unexpected_on_router', 'attribute_mismatch', 'duplicate_username', 'profile_missing', 'unknown_owner'
            $table->string('severity')->default('medium'); // 'low', 'medium', 'high'
            $table->json('expected_json')->nullable();
            $table->json('actual_json')->nullable();
            $table->string('status')->default('open'); // 'open', 'resolved', 'ignored'
            $table->text('resolution_note')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->index(['router_connection_id', 'status']);
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action'); // 'create', 'update', 'delete', 'disconnect', 'provision', 'sale', 'reprint', 'repair'
            $table->string('entity_type');
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->foreignId('router_connection_id')->nullable()->constrained('router_connections')->nullOnDelete();
            $table->json('before_json')->nullable();
            $table->json('after_json')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });

        Schema::create('qr_login_tokens', function (Blueprint $table) {
            $table->id();
            $table->string('token_hash', 64)->unique();
            $table->foreignId('voucher_id')->constrained('vouchers')->cascadeOnDelete();
            $table->foreignId('router_connection_id')->constrained('router_connections')->cascadeOnDelete();
            $table->timestamp('expires_at');
            $table->timestamp('redeemed_at')->nullable();
            $table->string('redeemed_session_reference')->nullable();
            $table->unsignedInteger('attempt_count')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['expires_at', 'redeemed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('qr_login_tokens');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('reconciliation_issues');
        Schema::dropIfExists('sync_runs');
    }
};
