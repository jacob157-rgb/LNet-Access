<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QrLoginToken extends Model
{
    use HasFactory;

    protected $fillable = [
        'token_hash',
        'voucher_id',
        'router_connection_id',
        'expires_at',
        'redeemed_at',
        'redeemed_session_reference',
        'attempt_count',
        'created_by',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'redeemed_at' => 'datetime',
        'attempt_count' => 'integer',
    ];

    public function voucher(): BelongsTo
    {
        return $this->belongsTo(Voucher::class);
    }

    public function routerConnection(): BelongsTo
    {
        return $this->belongsTo(RouterConnection::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isRedeemed(): bool
    {
        return $this->redeemed_at !== null;
    }
}
