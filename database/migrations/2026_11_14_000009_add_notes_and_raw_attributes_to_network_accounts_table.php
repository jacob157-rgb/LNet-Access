<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('network_accounts', function (Blueprint $table) {
            $table->text('notes')->nullable()->after('last_router_state');
            $table->json('raw_attributes_json')->nullable()->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('network_accounts', function (Blueprint $table) {
            $table->dropColumn(['notes', 'raw_attributes_json']);
        });
    }
};
