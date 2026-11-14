<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MacObservation extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'network_account_id',
        'router_connection_id',
        'observed_mac',
        'source',
        'ap_id',
        'router_bridge_name',
        'router_bridge_port',
        'ip_address',
        'confidence',
        'first_seen_at',
        'last_seen_at',
    ];

    protected $casts = [
        'first_seen_at' => 'datetime',
        'last_seen_at' => 'datetime',
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function networkAccount(): BelongsTo
    {
        return $this->belongsTo(NetworkAccount::class);
    }

    public function routerConnection(): BelongsTo
    {
        return $this->belongsTo(RouterConnection::class);
    }

    public function accessPoint(): BelongsTo
    {
        return $this->belongsTo(AccessPoint::class, 'ap_id');
    }
}
