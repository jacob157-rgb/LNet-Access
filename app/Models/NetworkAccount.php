<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NetworkAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'router_connection_id',
        'account_type',
        'username',
        'password_encrypted',
        'profile_name',
        'router_object_id',
        'app_uuid',
        'managed_by_app',
        'expected_enabled',
        'last_router_state',
        'notes',
        'raw_attributes_json',
        'last_seen_at',
    ];

    protected $casts = [
        'managed_by_app' => 'boolean',
        'expected_enabled' => 'boolean',
        'password_encrypted' => 'encrypted',
        'raw_attributes_json' => 'array',
        'last_seen_at' => 'datetime',
    ];

    protected $hidden = [
        // password_encrypted is unhidden so authorized admins can inspect PPPoE passwords in router panel
    ];

    public function member(): BelongsTo
    {
        return $this->belongsTo(Member::class);
    }

    public function routerConnection(): BelongsTo
    {
        return $this->belongsTo(RouterConnection::class);
    }

    public function vouchers(): HasMany
    {
        return $this->hasMany(Voucher::class);
    }

    public function macObservations(): HasMany
    {
        return $this->hasMany(MacObservation::class);
    }
}
