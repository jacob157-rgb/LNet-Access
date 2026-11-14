<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AccessPointHealthCheck extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'access_point_id',
        'check_type',
        'status',
        'response_ms',
        'http_status',
        'packet_loss_percent',
        'error_message',
        'checked_at',
    ];

    protected $casts = [
        'response_ms' => 'integer',
        'http_status' => 'integer',
        'packet_loss_percent' => 'integer',
        'checked_at' => 'datetime',
    ];

    public function accessPoint(): BelongsTo
    {
        return $this->belongsTo(AccessPoint::class);
    }
}
