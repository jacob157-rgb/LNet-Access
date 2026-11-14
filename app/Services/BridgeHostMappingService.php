<?php

namespace App\Services;

use App\Models\AccessPoint;
use App\Models\MacObservation;
use App\Models\RouterConnection;
use Exception;
use Illuminate\Support\Collection;

class BridgeHostMappingService
{
    public function __construct(
        protected RouterOsReadService $readService
    ) {}

    /**
     * Map a MAC address to an Access Point based on MikroTik bridge host learning and AP topology.
     *
     * @return array [ap_id, ap_name, confidence, on_interface, bridge]
     */
    public function resolveClientAp(
        RouterConnection $connection,
        string $mac,
        Collection $bridgeHosts,
        Collection $accessPoints
    ): array {
        $normalizedMac = strtoupper(str_replace(['-', ':'], '', $mac));

        // Find bridge host entry for this MAC
        $hostEntry = $bridgeHosts->first(function ($item) use ($normalizedMac) {
            $entryMac = strtoupper(str_replace(['-', ':'], '', $item['mac-address'] ?? ''));
            return $entryMac === $normalizedMac;
        });

        if (!$hostEntry) {
            return [
                'ap_id' => null,
                'ap_name' => 'Unknown AP',
                'confidence' => 'unknown',
                'on_interface' => null,
                'bridge' => null,
            ];
        }

        $onInterface = $hostEntry['on-interface'] ?? null;
        $bridge = $hostEntry['bridge'] ?? null;

        if (!$onInterface) {
            return [
                'ap_id' => null,
                'ap_name' => 'Unknown AP',
                'confidence' => 'unknown',
                'on_interface' => null,
                'bridge' => $bridge,
            ];
        }

        // Check if an AP is configured on this dedicated port
        $matchedAp = $accessPoints->first(function (AccessPoint $ap) use ($onInterface, $bridge) {
            if ($ap->topology_mode !== 'bridged_dedicated_port') {
                return false;
            }
            if ($ap->router_bridge_port !== $onInterface) {
                return false;
            }
            if ($ap->router_bridge_name && $bridge && $ap->router_bridge_name !== $bridge) {
                return false;
            }
            return true;
        });

        if ($matchedAp) {
            return [
                'ap_id' => $matchedAp->id,
                'ap_name' => $matchedAp->name,
                'confidence' => 'reliable',
                'on_interface' => $onInterface,
                'bridge' => $bridge,
            ];
        }

        return [
            'ap_id' => null,
            'ap_name' => 'Unknown AP',
            'confidence' => 'unavailable',
            'on_interface' => $onInterface,
            'bridge' => $bridge,
        ];
    }

    /**
     * Record an observed MAC into mac_observations table.
     */
    public function recordObservation(
        RouterConnection $connection,
        string $mac,
        string $source,
        ?int $apId = null,
        ?string $ipAddress = null,
        string $confidence = 'unverified',
        ?int $memberId = null,
        ?int $networkAccountId = null
    ): MacObservation {
        $obs = MacObservation::where('router_connection_id', $connection->id)
            ->where('observed_mac', $mac)
            ->first();

        if ($obs) {
            $obs->update([
                'last_seen_at' => now(),
                'source' => $source,
                'ap_id' => $apId ?? $obs->ap_id,
                'ip_address' => $ipAddress ?? $obs->ip_address,
                'confidence' => $confidence !== 'unverified' ? $confidence : $obs->confidence,
                'member_id' => $memberId ?? $obs->member_id,
                'network_account_id' => $networkAccountId ?? $obs->network_account_id,
            ]);
            return $obs;
        }

        return MacObservation::create([
            'router_connection_id' => $connection->id,
            'observed_mac' => $mac,
            'source' => $source,
            'ap_id' => $apId,
            'ip_address' => $ipAddress,
            'confidence' => $confidence,
            'member_id' => $memberId,
            'network_account_id' => $networkAccountId,
            'first_seen_at' => now(),
            'last_seen_at' => now(),
        ]);
    }
}
