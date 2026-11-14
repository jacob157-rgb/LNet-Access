<?php

namespace App\Services;

use App\Models\HotspotProfile;
use App\Models\RouterConnection;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class HotspotProfileService
{
    public function __construct(
        protected RouterOsReadService $readService
    ) {}

    /**
     * Sync profiles from router into local database.
     */
    public function syncProfiles(RouterConnection $connection): Collection
    {
        $rawProfiles = $this->readService->getHotspotProfiles($connection);
        $syncedNames = [];

        foreach ($rawProfiles as $p) {
            $name = $p['name'] ?? null;
            if (!$name) {
                continue;
            }
            $syncedNames[] = $name;

            HotspotProfile::updateOrCreate(
                [
                    'router_connection_id' => $connection->id,
                    'name' => $name,
                ],
                [
                    'router_object_id' => $p['.id'] ?? '*0',
                    'rate_limit' => $p['rate-limit'] ?? null,
                    'shared_users' => isset($p['shared-users']) ? (int)$p['shared-users'] : 1,
                    'session_timeout' => $p['session-timeout'] ?? null,
                    'idle_timeout' => $p['idle-timeout'] ?? null,
                    'raw_attributes_json' => $p,
                    'last_synced_at' => now(),
                    'is_present' => true,
                ]
            );
        }

        // Mark missing profiles
        HotspotProfile::where('router_connection_id', $connection->id)
            ->whereNotIn('name', $syncedNames)
            ->update(['is_present' => false]);

        Cache::forget("router_{$connection->id}_hotspot_profiles");

        return HotspotProfile::where('router_connection_id', $connection->id)
            ->where('is_present', true)
            ->get();
    }

    /**
     * Get active hotspot profiles (cached).
     */
    public function getActiveProfiles(RouterConnection $connection): Collection
    {
        return Cache::remember("router_{$connection->id}_hotspot_profiles", 300, function () use ($connection) {
            return HotspotProfile::where('router_connection_id', $connection->id)
                ->where('is_present', true)
                ->orderBy('name')
                ->get();
        });
    }
}
