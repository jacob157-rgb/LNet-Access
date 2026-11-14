<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\NetworkAccount;
use App\Models\PppProfile;
use App\Models\RouterConnection;
use App\Models\RouterSession;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class PppoeAccountService
{
    public function __construct(
        protected RouterOsReadService $readService,
        protected RouterOsWriteService $writeService
    ) {}

    /**
     * Mirror PPP profiles from router into database.
     */
    public function syncProfiles(RouterConnection $connection): Collection
    {
        $rawProfiles = $this->readService->getPppProfiles($connection);
        $syncedNames = [];

        foreach ($rawProfiles as $p) {
            $name = $p['name'] ?? null;
            if (!$name) {
                continue;
            }
            $syncedNames[] = $name;

            PppProfile::updateOrCreate(
                [
                    'router_connection_id' => $connection->id,
                    'name' => $name,
                ],
                [
                    'router_object_id' => $p['.id'] ?? '*0',
                    'local_address' => $p['local-address'] ?? null,
                    'remote_address' => $p['remote-address'] ?? null,
                    'rate_limit' => $p['rate-limit'] ?? null,
                    'raw_attributes_json' => $p,
                    'last_synced_at' => now(),
                    'is_present' => true,
                ]
            );
        }

        PppProfile::where('router_connection_id', $connection->id)
            ->whereNotIn('name', $syncedNames)
            ->update(['is_present' => false]);

        Cache::forget("router_{$connection->id}_ppp_profiles");

        return PppProfile::where('router_connection_id', $connection->id)
            ->where('is_present', true)
            ->get();
    }

    /**
     * Mirror PPP secrets from router into database.
     */
    public function syncSecrets(RouterConnection $connection): Collection
    {
        $rawSecrets = $this->readService->getPppSecrets($connection);
        $syncedUsernames = [];

        foreach ($rawSecrets as $s) {
            $username = $s['name'] ?? null;
            if (!$username) {
                continue;
            }
            $syncedUsernames[] = $username;
            $disabled = ($s['disabled'] ?? 'false') === 'true';

            NetworkAccount::updateOrCreate(
                [
                    'router_connection_id' => $connection->id,
                    'account_type' => 'pppoe',
                    'username' => $username,
                ],
                [
                    'router_object_id' => $s['.id'] ?? null,
                    'password_encrypted' => $s['password'] ?? '',
                    'profile_name' => $s['profile'] ?? 'default',
                    'expected_enabled' => !$disabled,
                    'last_router_state' => $disabled ? 'disabled' : 'enabled',
                    'notes' => $s['comment'] ?? null,
                    'last_seen_at' => now(),
                    'raw_attributes_json' => $s,
                ]
            );
        }

        // Clean up or mark accounts that no longer exist on router
        NetworkAccount::where('router_connection_id', $connection->id)
            ->where('account_type', 'pppoe')
            ->whereNotIn('username', $syncedUsernames)
            ->delete();

        return NetworkAccount::where('router_connection_id', $connection->id)
            ->where('account_type', 'pppoe')
            ->get();
    }

    /**
     * Sync active PPPoE sessions from router.
     */
    public function syncActiveSessions(RouterConnection $connection): Collection
    {
        $rawPpp = $this->readService->getPppActiveSessions($connection);

        RouterSession::where('router_connection_id', $connection->id)
            ->where('account_type', 'pppoe')
            ->delete();

        foreach ($rawPpp as $sess) {
            RouterSession::create([
                'router_connection_id' => $connection->id,
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

        return RouterSession::where('router_connection_id', $connection->id)
            ->where('account_type', 'pppoe')
            ->get();
    }

    /**
     * Get active PPP profiles (cached).
     */
    public function getActiveProfiles(RouterConnection $connection): Collection
    {
        return Cache::remember("router_{$connection->id}_ppp_profiles", 300, function () use ($connection) {
            return PppProfile::where('router_connection_id', $connection->id)
                ->where('is_present', true)
                ->orderBy('name')
                ->get();
        });
    }

    /**
     * Create a PPPoE secret on router and record in database.
     */
    public function createAccount(
        RouterConnection $connection,
        string $username,
        string $password,
        string $profile,
        ?string $callerId = null,
        ?string $remoteAddress = null,
        ?string $comment = null,
        ?int $memberId = null
    ): NetworkAccount {
        $secret = $this->writeService->createPppSecret(
            $connection,
            $username,
            $password,
            $profile,
            $callerId,
            $remoteAddress,
            $comment
        );

        return NetworkAccount::create([
            'member_id' => $memberId,
            'router_connection_id' => $connection->id,
            'account_type' => 'pppoe',
            'username' => $username,
            'password_encrypted' => $password,
            'profile_name' => $profile,
            'router_object_id' => $secret['.id'] ?? null,
            'managed_by_app' => true,
            'expected_enabled' => true,
            'last_router_state' => 'enabled',
            'notes' => $comment,
            'last_seen_at' => now(),
            'raw_attributes_json' => $secret,
        ]);
    }

    /**
     * Delete PPPoE secret from router and database.
     */
    public function deleteAccount(NetworkAccount $account): bool
    {
        $connection = $account->routerConnection;
        if ($connection && $account->router_object_id) {
            $this->writeService->removePppSecret(
                $connection,
                $account->router_object_id,
                $account->username
            );
        }

        // Also delete any session records
        RouterSession::where('router_connection_id', $account->router_connection_id)
            ->where('username', $account->username)
            ->delete();

        return (bool)$account->delete();
    }

    /**
     * Enable or disable PPPoE secret on router and database.
     */
    public function toggleAccount(NetworkAccount $account, bool $disabled): bool
    {
        $connection = $account->routerConnection;
        if ($connection && $account->router_object_id) {
            $this->writeService->setPppSecretDisabled(
                $connection,
                $account->router_object_id,
                $disabled
            );

            // If disabled, also drop active session
            if ($disabled) {
                $session = RouterSession::where('router_connection_id', $connection->id)
                    ->where('username', $account->username)
                    ->first();
                if ($session && $session->router_session_id) {
                    try {
                        $this->writeService->disconnectPppSession($connection, $session->router_session_id, $account->username);
                        $session->delete();
                    } catch (\Throwable $e) {}
                }
            }
        }

        $account->update([
            'expected_enabled' => !$disabled,
            'last_router_state' => $disabled ? 'disabled' : 'enabled',
        ]);

        return true;
    }
}
