<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VoucherBatch extends Model
{
    use HasFactory;

    protected $fillable = [
        'batch_code',
        'router_connection_id',
        'hotspot_profile_id',
        'quantity_requested',
        'quantity_created',
        'status',
        'created_by',
        'notes',
    ];

    protected $casts = [
        'quantity_requested' => 'integer',
        'quantity_created' => 'integer',
    ];

    public function routerConnection(): BelongsTo
    {
        return $this->belongsTo(RouterConnection::class);
    }

    public function hotspotProfile(): BelongsTo
    {
        return $this->belongsTo(HotspotProfile::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function vouchers(): HasMany
    {
        return $this->hasMany(Voucher::class, 'batch_id');
    }
}
