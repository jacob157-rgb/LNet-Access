<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'actor_id',
        'action',
        'entity_type',
        'entity_id',
        'router_connection_id',
        'before_json',
        'after_json',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'before_json' => 'array',
        'after_json' => 'array',
        'created_at' => 'datetime',
    ];

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public function routerConnection(): BelongsTo
    {
        return $this->belongsTo(RouterConnection::class);
    }

    public static function log(
        string $action,
        string $entityType,
        ?int $entityId = null,
        ?int $routerId = null,
        ?array $before = null,
        ?array $after = null,
        ?int $actorId = null
    ): self {
        return self::create([
            'actor_id' => $actorId ?? auth()->id(),
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'router_connection_id' => $routerId,
            'before_json' => $before,
            'after_json' => $after,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ]);
    }
}
