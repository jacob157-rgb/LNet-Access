<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\RouterConnection;
use App\Services\RouterOs\RouterOsTransportFactory;
use Exception;

class RouterOsWriteService
{
    /**
     * Create a Hotspot user with UUID marker and verify via read-back.
     */
    public function createHotspotUser(
        RouterConnection $connection,
        string $username,
        string $password,
        string $profile,
        string $uuid,
        ?string $comment = null,
        ?string $limitUptime = null
    ): array {
        $marker = "lnet-access:{$uuid}";
        $fullComment = $comment ? "{$marker} {$comment}" : $marker;

        $transport = RouterOsTransportFactory::create($connection);
        $transport->connect($connection);

        $payload = [
            'name' => $username,
            'password' => $password,
            'profile' => $profile,
            'comment' => $fullComment,
        ];
        if (!empty($limitUptime)) {
            $payload['limit-uptime'] = $limitUptime;
        }

        // 1. Create user
        $writeResult = $transport->write('/ip/hotspot/user/add', $payload);

        $createdId = $writeResult['ret'] ?? null;

        // 2. Read-back verification
        $verify = $transport->query('/ip/hotspot/user', ['name' => $username]);
        $transport->disconnect();

        if (empty($verify)) {
            throw new Exception("Read-back verification failed: user '{$username}' was not found on RouterOS after creation.");
        }

        $createdUser = $verify[0];
        if (($createdUser['profile'] ?? '') !== $profile) {
            throw new Exception("Read-back verification failed: user profile mismatch for '{$username}'.");
        }

        AuditLog::log('create', 'hotspot_user', null, $connection->id, null, [
            'username' => $username,
            'profile' => $profile,
            'comment' => $fullComment,
            'router_id' => $createdUser['.id'] ?? $createdId,
        ]);

        return $createdUser;
    }

    /**
     * Disable or enable a Hotspot user.
     */
    public function setHotspotUserDisabled(RouterConnection $connection, string $objectId, bool $disabled): bool
    {
        $transport = RouterOsTransportFactory::create($connection);
        $transport->connect($connection);
        $transport->write('/ip/hotspot/user/set', [
            '.id' => $objectId,
            'disabled' => $disabled ? 'yes' : 'no',
        ]);
        $transport->disconnect();

        AuditLog::log($disabled ? 'disable' : 'enable', 'hotspot_user', null, $connection->id, null, [
            'router_object_id' => $objectId,
            'disabled' => $disabled,
        ]);

        return true;
    }

    /**
     * Remove a Hotspot user.
     */
    public function removeHotspotUser(RouterConnection $connection, string $objectId, ?string $username = null): bool
    {
        $transport = RouterOsTransportFactory::create($connection);
        $transport->connect($connection);
        $result = $transport->remove('/ip/hotspot/user', $objectId);
        $transport->disconnect();

        AuditLog::log('remove', 'hotspot_user', null, $connection->id, [
            'router_object_id' => $objectId,
            'username' => $username,
        ], null);

        return $result;
    }

    /**
     * Remove multiple Hotspot users in bulk efficiently on a single connection.
     *
     * @param RouterConnection $connection
     * @param array $users Array of ['username' => string, 'router_object_id' => ?string]
     * @return array
     */
    public function removeHotspotUsers(RouterConnection $connection, array $users): array
    {
        if (empty($users)) {
            return ['removed' => 0, 'not_found' => 0, 'errors' => []];
        }

        $transport = RouterOsTransportFactory::create($connection);
        $transport->connect($connection);

        // Fetch all current hotspot users on router to resolve exact current .id by name
        $existingUsers = $transport->query('/ip/hotspot/user');
        $userMapByName = [];
        $userMapById = [];
        foreach ($existingUsers as $u) {
            if (isset($u['name']) && isset($u['.id'])) {
                $userMapByName[$u['name']] = $u['.id'];
            }
            if (isset($u['.id'])) {
                $userMapById[$u['.id']] = $u;
            }
        }

        // Fetch all active sessions to terminate any active login
        $activeSessions = $transport->query('/ip/hotspot/active');
        $activeByUserName = [];
        foreach ($activeSessions as $sess) {
            if (isset($sess['user']) && isset($sess['.id'])) {
                $activeByUserName[$sess['user']][] = $sess['.id'];
            }
        }

        $removed = 0;
        $notFound = 0;
        $errors = [];

        foreach ($users as $item) {
            $username = is_array($item) ? ($item['username'] ?? null) : (string)$item;
            $objectId = is_array($item) ? ($item['router_object_id'] ?? null) : null;

            // Disconnect active session if any
            if ($username && isset($activeByUserName[$username])) {
                foreach ($activeByUserName[$username] as $sessId) {
                    try {
                        $transport->remove('/ip/hotspot/active', $sessId);
                    } catch (\Throwable $e) {
                        // ignore active disconnect error
                    }
                }
            }

            // Find target router .id: prioritize name lookup from fresh query, fallback to stored objectId
            $targetId = null;
            if ($username && isset($userMapByName[$username])) {
                $targetId = $userMapByName[$username];
            } elseif ($objectId && isset($userMapById[$objectId])) {
                $targetId = $objectId;
            } elseif ($objectId) {
                $targetId = $objectId;
            }

            if (!$targetId) {
                $notFound++;
                continue;
            }

            try {
                $transport->remove('/ip/hotspot/user', $targetId);
                $removed++;
                if ($username) unset($userMapByName[$username]);
                unset($userMapById[$targetId]);
            } catch (\Throwable $e) {
                $msg = $e->getMessage();
                if (str_contains(strtolower($msg), 'no such item') || str_contains(strtolower($msg), 'not found')) {
                    $notFound++;
                } else {
                    $errors[] = "User {$username}: {$msg}";
                }
            }
        }

        $transport->disconnect();

        AuditLog::log('bulk_remove', 'hotspot_user', null, $connection->id, null, [
            'total_requested' => count($users),
            'removed_count' => $removed,
            'not_found_count' => $notFound,
            'errors' => $errors,
        ]);

        return [
            'removed' => $removed,
            'not_found' => $notFound,
            'errors' => $errors,
        ];
    }

    /**
     * Disconnect an active Hotspot session by its exact RouterOS session ID.
     */
    public function disconnectHotspotSession(RouterConnection $connection, string $sessionId, ?string $username = null): bool
    {
        $transport = RouterOsTransportFactory::create($connection);
        $transport->connect($connection);
        $result = $transport->remove('/ip/hotspot/active', $sessionId);
        $transport->disconnect();

        AuditLog::log('disconnect', 'hotspot_session', null, $connection->id, [
            'router_session_id' => $sessionId,
            'username' => $username,
        ], null);

        return $result;
    }

    /**
     * Create a PPPoE / PPP secret with comment marker and read-back verification.
     */
    public function createPppSecret(
        RouterConnection $connection,
        string $username,
        string $password,
        string $profile,
        ?string $callerId = null,
        ?string $remoteAddress = null,
        ?string $comment = null
    ): array {
        $transport = RouterOsTransportFactory::create($connection);
        $transport->connect($connection);

        $data = [
            'name' => $username,
            'password' => $password,
            'profile' => $profile,
            'service' => 'pppoe',
        ];
        if ($callerId) {
            $data['caller-id'] = $callerId;
        }
        if ($remoteAddress) {
            $data['remote-address'] = $remoteAddress;
        }
        if ($comment) {
            $data['comment'] = $comment;
        }

        $transport->write('/ppp/secret/add', $data);

        // Read-back verification
        $verify = $transport->query('/ppp/secret', ['name' => $username]);
        $transport->disconnect();

        if (empty($verify)) {
            throw new Exception("Read-back verification failed: PPP secret '{$username}' not found after creation.");
        }

        $secret = $verify[0];

        AuditLog::log('create', 'ppp_secret', null, $connection->id, null, [
            'username' => $username,
            'profile' => $profile,
            'caller_id' => $callerId,
            'remote_address' => $remoteAddress,
            'router_id' => $secret['.id'] ?? null,
        ]);

        return $secret;
    }

    /**
     * Remove a PPP secret and disconnect active session.
     */
    public function removePppSecret(RouterConnection $connection, string $objectId, ?string $username = null): bool
    {
        $transport = RouterOsTransportFactory::create($connection);
        $transport->connect($connection);

        // Terminate any active sessions for this username first
        if ($username) {
            $activeSessions = $transport->query('/ppp/active', ['name' => $username]);
            foreach ($activeSessions as $sess) {
                if (isset($sess['.id'])) {
                    try {
                        $transport->remove('/ppp/active', $sess['.id']);
                    } catch (\Throwable $e) {}
                }
            }
        }

        $result = $transport->remove('/ppp/secret', $objectId);
        $transport->disconnect();

        AuditLog::log('remove', 'ppp_secret', null, $connection->id, [
            'router_object_id' => $objectId,
            'username' => $username,
        ], null);

        return $result;
    }

    /**
     * Create Hotspot IP Binding (bypassed, regular, blocked).
     */
    public function createHotspotIpBinding(RouterConnection $connection, array $data): array
    {
        $transport = RouterOsTransportFactory::create($connection);
        $transport->connect($connection);

        $payload = [
            'mac-address' => strtoupper(trim($data['mac_address'])),
            'type' => $data['type'] ?? 'bypassed',
        ];
        if (!empty($data['address'])) {
            $payload['address'] = trim($data['address']);
            $payload['to-address'] = trim($data['to_address'] ?? $data['address']);
        }
        if (!empty($data['server'])) {
            $payload['server'] = $data['server'];
        }
        if (!empty($data['comment'])) {
            $payload['comment'] = $data['comment'];
        }

        $transport->write('/ip/hotspot/ip-binding/add', $payload);

        // Read-back verification
        $verify = $transport->query('/ip/hotspot/ip-binding', ['mac-address' => $payload['mac-address']]);
        $transport->disconnect();

        if (empty($verify)) {
            throw new Exception("IP binding verification failed: MAC '{$payload['mac-address']}' not found after creation.");
        }

        $binding = $verify[0];

        AuditLog::log('create', 'hotspot_ip_binding', null, $connection->id, null, [
            'mac_address' => $payload['mac-address'],
            'address' => $payload['address'] ?? null,
            'type' => $payload['type'],
            'router_id' => $binding['.id'] ?? null,
        ]);

        return $binding;
    }

    /**
     * Remove Hotspot IP Binding.
     */
    public function removeHotspotIpBinding(RouterConnection $connection, string $objectId, ?string $mac = null): bool
    {
        $transport = RouterOsTransportFactory::create($connection);
        $transport->connect($connection);
        $result = $transport->remove('/ip/hotspot/ip-binding', $objectId);
        $transport->disconnect();

        AuditLog::log('remove', 'hotspot_ip_binding', null, $connection->id, [
            'router_object_id' => $objectId,
            'mac_address' => $mac,
        ], null);

        return $result;
    }

    /**
     * Enable or disable Hotspot IP Binding.
     */
    public function setHotspotIpBindingDisabled(RouterConnection $connection, string $objectId, bool $disabled): bool
    {
        $transport = RouterOsTransportFactory::create($connection);
        $transport->connect($connection);
        $transport->write('/ip/hotspot/ip-binding/set', [
            '.id' => $objectId,
            'disabled' => $disabled ? 'yes' : 'no',
        ]);
        $transport->disconnect();

        AuditLog::log($disabled ? 'disable' : 'enable', 'hotspot_ip_binding', null, $connection->id, null, [
            'router_object_id' => $objectId,
            'disabled' => $disabled,
        ]);

        return true;
    }

    /**
     * Disconnect an active PPP session by its exact RouterOS session ID.
     */
    public function disconnectPppSession(RouterConnection $connection, string $sessionId, ?string $username = null): bool
    {
        $transport = RouterOsTransportFactory::create($connection);
        $transport->connect($connection);
        $result = $transport->remove('/ppp/active', $sessionId);
        $transport->disconnect();

        AuditLog::log('disconnect', 'ppp_session', null, $connection->id, [
            'router_session_id' => $sessionId,
            'username' => $username,
        ], null);

        return $result;
    }

    /**
     * Set PPPoE secret password.
     */
    public function setPppSecretPassword(RouterConnection $connection, string $objectId, string $newPassword): bool
    {
        $transport = RouterOsTransportFactory::create($connection);
        $transport->connect($connection);
        $transport->write('/ppp/secret/set', [
            '.id' => $objectId,
            'password' => $newPassword,
        ]);
        $transport->disconnect();

        AuditLog::log('reset_password', 'ppp_secret', null, $connection->id, null, [
            'router_object_id' => $objectId,
        ]);

        return true;
    }

    /**
     * Disable or enable a PPP secret.
     */
    public function setPppSecretDisabled(RouterConnection $connection, string $objectId, bool $disabled): bool
    {
        $transport = RouterOsTransportFactory::create($connection);
        $transport->connect($connection);
        $transport->write('/ppp/secret/set', [
            '.id' => $objectId,
            'disabled' => $disabled ? 'yes' : 'no',
        ]);
        $transport->disconnect();

        AuditLog::log($disabled ? 'disable' : 'enable', 'ppp_secret', null, $connection->id, null, [
            'router_object_id' => $objectId,
            'disabled' => $disabled,
        ]);

        return true;
    }
}
