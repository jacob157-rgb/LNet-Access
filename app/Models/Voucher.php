<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Voucher extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'router_connection_id',
        'network_account_id',
        'batch_id',
        'hotspot_profile_id',
        'username',
        'password_encrypted',
        'commercial_status',
        'router_status',
        'price_snapshot',
        'currency',
        'generated_at',
        'provisioned_at',
        'sold_at',
        'expires_at',
        'router_object_id',
        'router_comment_marker',
        'last_reconciled_at',
        'notes',
    ];

    protected $casts = [
        'password_encrypted' => 'encrypted',
        'price_snapshot' => 'decimal:2',
        'generated_at' => 'datetime',
        'provisioned_at' => 'datetime',
        'sold_at' => 'datetime',
        'expires_at' => 'datetime',
        'last_reconciled_at' => 'datetime',
    ];

    protected $hidden = [
        'password_encrypted',
    ];

    public function routerConnection(): BelongsTo
    {
        return $this->belongsTo(RouterConnection::class);
    }

    public function networkAccount(): BelongsTo
    {
        return $this->belongsTo(NetworkAccount::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(VoucherBatch::class, 'batch_id');
    }

    public function hotspotProfile(): BelongsTo
    {
        return $this->belongsTo(HotspotProfile::class);
    }

    public function sales(): BelongsToMany
    {
        return $this->belongsToMany(Sale::class, 'sale_vouchers')
            ->withPivot('price_snapshot')
            ->withTimestamps();
    }

    public function qrTokens(): HasMany
    {
        return $this->hasMany(QrLoginToken::class);
    }
}
