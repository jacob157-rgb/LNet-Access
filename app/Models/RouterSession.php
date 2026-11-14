<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RouterSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'router_connection_id',
        'account_type',
        'username',
        'router_session_id',
        'ip_address',
        'observed_mac',
        'server_name',
        'interface_name',
        'ap_id',
        'uptime_seconds',
        'bytes_in',
        'bytes_out',
        'started_at',
        'observed_at',
        'ended_at',
        'raw_attributes_json',
    ];

    protected $casts = [
        'uptime_seconds' => 'integer',
        'bytes_in' => 'integer',
        'bytes_out' => 'integer',
        'started_at' => 'datetime',
        'observed_at' => 'datetime',
        'ended_at' => 'datetime',
        'raw_attributes_json' => 'array',
    ];

    public function routerConnection(): BelongsTo
    {
        return $this->belongsTo(RouterConnection::class);
    }

    public function accessPoint(): BelongsTo
    {
        return $this->belongsTo(AccessPoint::class, 'ap_id');
    }
}
