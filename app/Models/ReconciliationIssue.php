<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReconciliationIssue extends Model
{
    use HasFactory;

    protected $fillable = [
        'router_connection_id',
        'entity_type',
        'local_entity_id',
        'router_object_id',
        'issue_type',
        'severity',
        'expected_json',
        'actual_json',
        'status',
        'resolution_note',
        'resolved_at',
    ];

    protected $casts = [
        'expected_json' => 'array',
        'actual_json' => 'array',
        'resolved_at' => 'datetime',
    ];

    public function routerConnection(): BelongsTo
    {
        return $this->belongsTo(RouterConnection::class);
    }
}
