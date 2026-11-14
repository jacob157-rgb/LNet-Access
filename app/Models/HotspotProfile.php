<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HotspotProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'router_connection_id',
        'router_object_id',
        'name',
        'rate_limit',
        'shared_users',
        'session_timeout',
        'idle_timeout',
        'raw_attributes_json',
        'last_synced_at',
        'is_present',
    ];

    protected $casts = [
        'shared_users' => 'integer',
        'raw_attributes_json' => 'array',
        'last_synced_at' => 'datetime',
        'is_present' => 'boolean',
    ];

    public function routerConnection(): BelongsTo
    {
        return $this->belongsTo(RouterConnection::class);
    }

    public function vouchers(): HasMany
    {
        return $this->hasMany(Voucher::class);
    }

    public function voucherBatches(): HasMany
    {
        return $this->hasMany(VoucherBatch::class);
    }

    /**
     * Get the validity duration of this profile in seconds from session_timeout or profile name.
     */
    public function getValidityDurationInSeconds(): ?int
    {
        $timeout = $this->session_timeout;

        // Fallback to profile name if session_timeout is null (e.g. 2k-12j -> 12h, 3k-24j -> 24h, 10k-1mg -> 7d, 30k-1bl -> 30d)
        if (!$timeout) {
            if (preg_match('/(\d+)\s*j/i', $this->name, $m)) {
                $timeout = $m[1] . 'h';
            } elseif (preg_match('/(\d+)\s*mg/i', $this->name, $m)) {
                $timeout = ($m[1] * 7) . 'd';
            } elseif (preg_match('/(\d+)\s*bl/i', $this->name, $m)) {
                $timeout = ($m[1] * 30) . 'd';
            }
        }

        if (!$timeout) {
            return null;
        }

        $seconds = 0;
        if (preg_match_all('/(\d+)([wdhms])/', $timeout, $matches, PREG_SET_ORDER)) {
            foreach ($matches as $m) {
                $val = (int)$m[1];
                $unit = $m[2];
                $seconds += match ($unit) {
                    'w' => $val * 7 * 86400,
                    'd' => $val * 86400,
                    'h' => $val * 3600,
                    'm' => $val * 60,
                    's' => $val,
                    default => 0,
                };
            }
        }

        return $seconds > 0 ? $seconds : null;
    }
}
