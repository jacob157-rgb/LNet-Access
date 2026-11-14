<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('voucher_batches', function (Blueprint $table) {
            $table->id();
            $table->string('batch_code')->unique();
            $table->foreignId('router_connection_id')->constrained('router_connections')->cascadeOnDelete();
            $table->foreignId('hotspot_profile_id')->constrained('hotspot_profiles')->cascadeOnDelete();
            $table->unsignedInteger('quantity_requested');
            $table->unsignedInteger('quantity_created')->default(0);
            $table->string('status')->default('pending'); // 'pending', 'provisioning', 'completed', 'failed', 'partial'
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('uuid')->unique();
            $table->foreignId('router_connection_id')->constrained('router_connections')->cascadeOnDelete();
            $table->foreignId('network_account_id')->nullable()->constrained('network_accounts')->nullOnDelete();
            $table->foreignId('batch_id')->nullable()->constrained('voucher_batches')->nullOnDelete();
            $table->foreignId('hotspot_profile_id')->constrained('hotspot_profiles')->cascadeOnDelete();
            $table->string('username');
            $table->text('password_encrypted');
            $table->string('commercial_status')->default('draft'); // 'draft', 'provisioning', 'ready', 'reserved', 'sold', 'expired', 'disabled', 'missing', 'conflict'
            $table->string('router_status')->default('inactive'); // 'active', 'inactive', 'unknown'
            $table->decimal('price_snapshot', 12, 2)->default(0);
            $table->string('currency', 10)->default('IDR');
            $table->timestamp('generated_at')->nullable();
            $table->timestamp('provisioned_at')->nullable();
            $table->timestamp('sold_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->string('router_object_id')->nullable();
            $table->string('router_comment_marker')->nullable(); // e.g. lnet-access:<UUID>
            $table->timestamp('last_reconciled_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['router_connection_id', 'username']);
            $table->index(['commercial_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vouchers');
        Schema::dropIfExists('voucher_batches');
    }
};
