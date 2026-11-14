<?php

namespace App\Console\Commands;

use App\Models\AccessPoint;
use App\Models\RouterConnection;
use App\Models\RouterSession;
use App\Models\Voucher;
use App\Services\BridgeHostMappingService;
use App\Services\HotspotProfileService;
use App\Services\PppoeAccountService;
use App\Services\RouterConnectionService;
use App\Services\RouterOsReadService;
use App\Services\RouterOsWriteService;
use Illuminate\Console\Command;

class SyncRouterCommand extends Command
{
    protected $signature = 'lnet:sync-router {router_id?}';
    protected $description = 'Sync RouterOS resources, profiles, active sessions, and bridge host table';

    public function handle(
        RouterConnectionService $connectionService,
        HotspotProfileService $hotspotProfileService,
        PppoeAccountService $pppoeAccountService,
        RouterOsReadService $readService,
        RouterOsWriteService $writeService,
        BridgeHostMappingService $bridgeMappingService
    ): int {
        $routerId = $this->argument('router_id');

        $query = RouterConnection::where('is_active', true);
        if ($routerId) {
            $query->where('id', $routerId);
        }

        $routers = $query->get();

        if ($routers->isEmpty()) {
            $this->warn('No active router connections found.');
            return 0;
        }

        foreach ($routers as $router) {
            $this->info("Syncing router: {$router->name} ({$router->host})...");

            // 1. Sync Health / Resources
            $connectionService->syncHealth($router);

            if ($router->fresh()->connection_status === 'offline') {
                $this->error("Router {$router->name} is offline. Skipping detailed sync.");
                continue;
            }

            // 2. Sync Profiles
            try {
                $hotspotProfileService->syncProfiles($router);
                $pppoeAccountService->syncProfiles($router);
                $this->line("  ✓ Profiles mirrored successfully.");
            } catch (\Throwable $e) {
                $this->warn("  ! Profile sync failed: " . $e->getMessage());
            }

            // 3. Sync Active Hotspot Sessions & Map to AP
            try {
                $rawSessions = $readService->getHotspotActiveSessions($router);
                $bridgeHosts = collect($readService->getBridgeHosts($router));
                $accessPoints = AccessPoint::where('management_router_id', $router->id)
                    ->orWhereNull('management_router_id')
                    ->get();

                // Clear previous live sessions for this router
                RouterSession::where('router_connection_id', $router->id)
                    ->where('account_type', 'hotspot')
                    ->delete();

                foreach ($rawSessions as $sess) {
                    $mac = $sess['mac-address'] ?? '';
                    $username = $sess['user'] ?? '';
                    $sessionId = $sess['.id'] ?? '';
                    $ip = $sess['address'] ?? null;
                    $uptime = isset($sess['uptime']) ? 0 : 0; // can parse uptime string

                    // AP mapping via Bridge host table
                    $apInfo = $bridgeMappingService->resolveClientAp($router, $mac, $bridgeHosts, $accessPoints);

                    RouterSession::create([
                        'router_connection_id' => $router->id,
                        'account_type' => 'hotspot',
                        'username' => $username,
                        'router_session_id' => $sessionId,
                        'ip_address' => $ip,
                        'observed_mac' => $mac,
                        'server_name' => $sess['server'] ?? null,
                        'ap_id' => $apInfo['ap_id'],
                        'uptime_seconds' => $uptime,
                        'bytes_in' => isset($sess['bytes-in']) ? (int)$sess['bytes-in'] : 0,
                        'bytes_out' => isset($sess['bytes-out']) ? (int)$sess['bytes-out'] : 0,
                        'observed_at' => now(),
                        'raw_attributes_json' => $sess,
                    ]);

                    // Record MAC observation
                    if ($mac) {
                        $bridgeMappingService->recordObservation(
                            $router,
                            $mac,
                            'hotspot_active',
                            $apInfo['ap_id'],
                            $ip,
                            $apInfo['confidence']
                        );
                    }
                }

                $this->line("  ✓ Synced " . count($rawSessions) . " active Hotspot sessions.");

                // 3b. Track first login & start validity calendar timer
                $activeUsernames = collect($rawSessions)->pluck('user')->filter()->unique()->values()->all();
                if (!empty($activeUsernames)) {
                    $vouchersToActivate = Voucher::where('router_connection_id', $router->id)
                        ->whereIn('username', $activeUsernames)
                        ->whereNull('sold_at')
                        ->with('hotspotProfile')
                        ->get();

                    foreach ($vouchersToActivate as $v) {
                        $durationSeconds = $v->hotspotProfile?->getValidityDurationInSeconds();
                        $now = now();
                        $expiresAt = $durationSeconds ? $now->copy()->addSeconds($durationSeconds) : null;
                        $v->update([
                            'sold_at' => $now,
                            'expires_at' => $expiresAt,
                            'commercial_status' => 'sold',
                            'router_status' => 'active',
                        ]);
                        $this->line("  ✓ Voucher '{$v->username}' first login detected. Validity expires at: " . ($expiresAt ? $expiresAt->toDateTimeString() : 'no limit'));
                    }
                }

                // 3c. Expire and clean up vouchers whose calendar validity has elapsed
                $expiredVouchers = Voucher::where('router_connection_id', $router->id)
                    ->whereNotNull('expires_at')
                    ->where('expires_at', '<=', now())
                    ->whereNotIn('commercial_status', ['expired', 'void'])
                    ->get();

                if ($expiredVouchers->isNotEmpty()) {
                    $userPayload = $expiredVouchers->map(fn ($v) => [
                        'username' => $v->username,
                        'router_object_id' => $v->router_object_id,
                    ])->all();

                    $writeService->removeHotspotUsers($router, $userPayload);

                    foreach ($expiredVouchers as $ev) {
                        $ev->update([
                            'commercial_status' => 'expired',
                            'router_status' => 'missing',
                        ]);
                    }
                    $this->line("  ✓ Expired & removed " . $expiredVouchers->count() . " vouchers (validity elapsed).");
                }
            } catch (\Throwable $e) {
                $this->warn("  ! Hotspot session sync failed: " . $e->getMessage());
            }

            // 4. Sync PPPoE Active Sessions
            try {
                $rawPpp = $readService->getPppActiveSessions($router);

                RouterSession::where('router_connection_id', $router->id)
                    ->where('account_type', 'pppoe')
                    ->delete();

                foreach ($rawPpp as $sess) {
                    RouterSession::create([
                        'router_connection_id' => $router->id,
                        'account_type' => 'pppoe',
                        'username' => $sess['name'] ?? '',
                        'router_session_id' => $sess['.id'] ?? '',
                        'ip_address' => $sess['address'] ?? null,
                        'observed_mac' => $sess['caller-id'] ?? null,
                        'server_name' => $sess['service'] ?? null,
                        'interface_name' => $sess['interface'] ?? null,
                        'observed_at' => now(),
                        'raw_attributes_json' => $sess,
                    ]);
                }

                $this->line("  ✓ Synced " . count($rawPpp) . " active PPPoE sessions.");
            } catch (\Throwable $e) {
                $this->warn("  ! PPPoE session sync failed: " . $e->getMessage());
            }
        }

        $this->info("Router sync completed.");
        return 0;
    }
}
