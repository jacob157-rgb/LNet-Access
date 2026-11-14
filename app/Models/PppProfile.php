<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PppProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'router_connection_id',
        'router_object_id',
        'name',
        'local_address',
        'remote_address',
        'rate_limit',
        'raw_attributes_json',
        'last_synced_at',
        'is_present',
    ];

    protected $casts = [
        'raw_attributes_json' => 'array',
        'last_synced_at' => 'datetime',
        'is_present' => 'boolean',
    ];

    public function routerConnection(): BelongsTo
    {
        return $this->belongsTo(RouterConnection::class);
    }
}
