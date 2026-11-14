<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\RouterConnection;
use App\Models\SyncRun;
use App\Services\RouterOs\RouterOsTransportFactory;
use Exception;
use Illuminate\Support\Facades\Log;

class RouterConnectionService
{
    /**
     * Test a router connection without saving.
     */
    public function testConnection(array $params): array
    {
        $connection = new RouterConnection($params);
        $transport = RouterOsTransportFactory::create($connection);

        $startTime = microtime(true);
        $result = [
            'success' => false,
            'latency_ms' => 0,
            'message' => '',
            'capabilities' => null,
            'security_warning' => null,
        ];

        if ($connection->transport === 'api' || $connection->port == 8728) {
            $result['security_warning'] = 'Warning: Plain API (port 8728) is unencrypted. API-SSL (port 8729) is strongly recommended for production networks.';
        }

        try {
            $transport->connect($connection);
            $latency = round((microtime(true) - $startTime) * 1000);
            $result['latency_ms'] = (int)$latency;

            $caps = $transport->detectCapabilities();
            $result['success'] = true;
            $result['message'] = "Successfully connected to {$connection->host} ({$caps['identity']}) in {$latency}ms.";
            $result['capabilities'] = $caps;
            $transport->disconnect();
        } catch (Exception $e) {
            $result['success'] = false;
            $result['message'] = $e->getMessage();
        }

        return $result;
    }

    /**
     * Sync router health, resources, and identity.
     */
    public function syncHealth(RouterConnection $connection): void
    {
        $syncRun = SyncRun::create([
            'router_connection_id' => $connection->id,
            'sync_type' => 'health',
            'status' => 'running',
            'started_at' => now(),
        ]);

        try {
            $transport = RouterOsTransportFactory::create($connection);
            $transport->connect($connection);
            $caps = $transport->detectCapabilities();
            $transport->disconnect();

            $connection->update([
                'router_identity' => $caps['identity'] ?? $connection->router_identity,
                'routeros_version' => $caps['version'] ?? $connection->routeros_version,
                'board_name' => $caps['board_name'] ?? $connection->board_name,
                'cpu_load' => $caps['cpu_load'],
                'free_memory' => $caps['free_memory'],
                'total_memory' => $caps['total_memory'],
                'uptime' => $caps['uptime'],
                'connection_status' => 'online',
                'last_seen_at' => now(),
                'last_sync_at' => now(),
                'last_error' => null,
                'capabilities_json' => $caps,
            ]);

            $syncRun->update([
                'status' => 'completed',
                'finished_at' => now(),
                'records_read' => 1,
                'details_json' => $caps,
            ]);
        } catch (Exception $e) {
            Log::error("Router {$connection->id} health sync failed: " . $e->getMessage());

            $connection->update([
                'connection_status' => $connection->last_seen_at && $connection->last_seen_at->diffInHours(now()) < 1 ? 'stale' : 'offline',
                'last_error' => $e->getMessage(),
            ]);

            $syncRun->update([
                'status' => 'failed',
                'finished_at' => now(),
                'error_summary' => $e->getMessage(),
            ]);
        }
    }
}
