<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AccessPoint extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'location',
        'notes',
        'management_router_id',
        'management_ip',
        'management_mac',
        'health_check_type',
        'health_check_url',
        'health_check_port',
        'expected_http_statuses_json',
        'check_interval_seconds',
        'timeout_ms',
        'failure_threshold',
        'consecutive_failures',
        'status',
        'last_checked_at',
        'last_success_at',
        'last_response_ms',
        'last_http_status',
        'last_error',
        'topology_mode',
        'router_bridge_name',
        'router_bridge_port',
        'client_mapping_capability',
        'is_active',
    ];

    protected $casts = [
        'expected_http_statuses_json' => 'array',
        'check_interval_seconds' => 'integer',
        'timeout_ms' => 'integer',
        'failure_threshold' => 'integer',
        'consecutive_failures' => 'integer',
        'last_response_ms' => 'integer',
        'last_http_status' => 'integer',
        'health_check_port' => 'integer',
        'last_checked_at' => 'datetime',
        'last_success_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function router(): BelongsTo
    {
        return $this->belongsTo(RouterConnection::class, 'management_router_id');
    }

    public function healthChecks(): HasMany
    {
        return $this->hasMany(AccessPointHealthCheck::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(RouterSession::class, 'ap_id');
    }

    public function macObservations(): HasMany
    {
        return $this->hasMany(MacObservation::class, 'ap_id');
    }

    public function isOnline(): bool
    {
        return $this->status === 'online';
    }

    public function isDegraded(): bool
    {
        return $this->status === 'degraded';
    }

    public function isOffline(): bool
    {
        return $this->status === 'offline';
    }
}
