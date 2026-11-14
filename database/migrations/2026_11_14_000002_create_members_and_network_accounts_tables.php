<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->string('member_code')->unique();
            $table->string('name');
            $table->string('phone')->nullable();
            $table->text('notes')->nullable();
            $table->string('status')->default('active'); // 'active', 'suspended', 'archived'
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('network_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->nullable()->constrained('members')->nullOnDelete();
            $table->foreignId('router_connection_id')->constrained('router_connections')->cascadeOnDelete();
            $table->string('account_type'); // 'hotspot', 'pppoe'
            $table->string('username');
            $table->text('password_encrypted')->nullable();
            $table->string('profile_name');
            $table->string('router_object_id')->nullable();
            $table->string('app_uuid')->nullable();
            $table->boolean('managed_by_app')->default(true);
            $table->boolean('expected_enabled')->default(true);
            $table->string('last_router_state')->nullable(); // 'enabled', 'disabled', 'missing'
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();

            $table->unique(['router_connection_id', 'account_type', 'username'], 'net_acc_router_type_user_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('network_accounts');
        Schema::dropIfExists('members');
    }
};
