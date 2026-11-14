<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->string('receipt_number')->unique();
            $table->foreignId('member_id')->nullable()->constrained('members')->nullOnDelete();
            $table->foreignId('cashier_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('discount_total', 12, 2)->default(0);
            $table->decimal('grand_total', 12, 2)->default(0);
            $table->string('currency', 10)->default('IDR');
            $table->string('payment_method')->default('cash'); // 'cash', 'transfer', 'qris', 'manual'
            $table->string('payment_status')->default('paid'); // 'paid', 'pending', 'void'
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('voided_at')->nullable();
            $table->string('void_reason')->nullable();
            $table->unsignedInteger('reprint_count')->default(0);
            $table->timestamp('last_reprinted_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->string('item_type')->default('voucher'); // 'voucher', 'member_fee', 'other'
            $table->string('description');
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->decimal('line_total', 12, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('sale_vouchers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')->constrained('sales')->cascadeOnDelete();
            $table->foreignId('voucher_id')->constrained('vouchers')->cascadeOnDelete();
            $table->decimal('price_snapshot', 12, 2)->default(0);
            $table->timestamps();

            $table->unique(['sale_id', 'voucher_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sale_vouchers');
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
    }
};
