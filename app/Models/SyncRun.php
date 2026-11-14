<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SyncRun extends Model
{
    use HasFactory;

    protected $fillable = [
        'router_connection_id',
        'sync_type',
        'status',
        'started_at',
        'finished_at',
        'records_read',
        'records_created',
        'records_updated',
        'records_missing',
        'error_summary',
        'details_json',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
        'records_read' => 'integer',
        'records_created' => 'integer',
        'records_updated' => 'integer',
        'records_missing' => 'integer',
        'details_json' => 'array',
    ];

    public function routerConnection(): BelongsTo
    {
        return $this->belongsTo(RouterConnection::class);
    }
}
