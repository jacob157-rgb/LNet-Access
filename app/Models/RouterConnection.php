<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class RouterConnection extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'host',
        'port',
        'transport',
        'username',
        'password_encrypted',
        'tls_verify',
        'ca_certificate_path',
        'routeros_version',
        'router_identity',
        'board_name',
        'cpu_load',
        'free_memory',
        'total_memory',
        'uptime',
        'connection_status',
        'last_seen_at',
        'last_sync_at',
        'last_error',
        'capabilities_json',
        'is_active',
    ];

    protected $casts = [
        'port' => 'integer',
        'tls_verify' => 'boolean',
        'is_active' => 'boolean',
        'password_encrypted' => 'encrypted',
        'capabilities_json' => 'array',
        'last_seen_at' => 'datetime',
        'last_sync_at' => 'datetime',
        'cpu_load' => 'integer',
        'free_memory' => 'integer',
        'total_memory' => 'integer',
    ];

    protected $hidden = [
        'password_encrypted',
    ];

    public function hotspotProfiles(): HasMany
    {
        return $this->hasMany(HotspotProfile::class);
    }

    public function pppProfiles(): HasMany
    {
        return $this->hasMany(PppProfile::class);
    }

    public function vouchers(): HasMany
    {
        return $this->hasMany(Voucher::class);
    }

    public function voucherBatches(): HasMany
    {
        return $this->hasMany(VoucherBatch::class);
    }

    public function networkAccounts(): HasMany
    {
        return $this->hasMany(NetworkAccount::class);
    }

    public function sessions(): HasMany
    {
        return $this->hasMany(RouterSession::class);
    }

    public function accessPoints(): HasMany
    {
        return $this->hasMany(AccessPoint::class, 'management_router_id');
    }

    public function syncRuns(): HasMany
    {
        return $this->hasMany(SyncRun::class);
    }

    public function reconciliationIssues(): HasMany
    {
        return $this->hasMany(ReconciliationIssue::class);
    }

    public function isOnline(): bool
    {
        return $this->connection_status === 'online' &&
            $this->last_seen_at &&
            $this->last_seen_at->diffInMinutes(now()) <= 2;
    }

    public function isStale(): bool
    {
        return $this->connection_status === 'stale' || (
            $this->last_seen_at &&
            $this->last_seen_at->diffInMinutes(now()) > 2 &&
            $this->last_seen_at->diffInMinutes(now()) <= 15
        );
    }
}
