<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'receipt_number',
        'member_id',
        'cashier_id',
        'subtotal',
        'discount_total',
        'grand_total',
        'currency',
        'payment_method',
        'payment_status',
        'paid_at',
        'voided_at',
        'void_reason',
        'reprint_count',
        'last_reprinted_at',
        'notes',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'reprint_count' => 'integer',
        'paid_at' => 'datetime',
        'voided_at' => 'datetime',
        'last_reprinted_at' => 'datetime',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function vouchers(): BelongsToMany
    {
        return $this->belongsToMany(Voucher::class, 'sale_vouchers')
            ->withPivot('price_snapshot')
            ->withTimestamps();
    }
}
