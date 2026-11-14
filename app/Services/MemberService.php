<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Member;
use App\Models\NetworkAccount;
use App\Models\RouterConnection;
use Exception;
use Illuminate\Support\Str;

class MemberService
{
    public function __construct(
        protected RouterOsWriteService $writeService,
        protected RouterOsReadService $readService
    ) {}

    /**
     * Create a new member.
     */
    public function createMember(array $data): Member
    {
        $code = 'MEM-' . strtoupper(Str::random(6));

        $member = Member::create([
            'member_code' => $data['member_code'] ?? $code,
            'name' => $data['name'],
            'phone' => $data['phone'] ?? null,
            'notes' => $data['notes'] ?? null,
            'status' => $data['status'] ?? 'active',
        ]);

        AuditLog::log('create', 'member', $member->id, null, null, $member->toArray());

        return $member;
    }

    /**
     * Assign an existing or new Hotspot or PPPoE account to a member.
     */
    public function attachNetworkAccount(
        Member $member,
        RouterConnection $connection,
        string $type,
        string $username,
        string $password,
        string $profileName
    ): NetworkAccount {
        $uuid = (string)Str::uuid();

        if ($type === 'hotspot') {
            $routerRecord = $this->writeService->createHotspotUser(
                $connection,
                $username,
                $password,
                $profileName,
                $uuid,
                "Member: {$member->name}"
            );
        } else {
            $routerRecord = $this->writeService->createPppSecret(
                $connection,
                $username,
                $password,
                $profileName,
                null,
                "Member: {$member->name}"
            );
        }

        $account = NetworkAccount::create([
            'member_id' => $member->id,
            'router_connection_id' => $connection->id,
            'account_type' => $type,
            'username' => $username,
            'password_encrypted' => $password,
            'profile_name' => $profileName,
            'router_object_id' => $routerRecord['.id'] ?? null,
            'app_uuid' => $uuid,
            'managed_by_app' => true,
            'expected_enabled' => true,
            'last_router_state' => 'enabled',
            'last_seen_at' => now(),
        ]);

        AuditLog::log('attach_account', 'member', $member->id, $connection->id, null, [
            'account_type' => $type,
            'username' => $username,
            'profile' => $profileName,
        ]);

        return $account;
    }

    /**
     * Reset/change password for a member's network account.
     */
    public function resetAccountPassword(NetworkAccount $account, string $newPassword): void
    {
        $connection = $account->routerConnection;

        if ($account->account_type === 'pppoe' && $account->router_object_id) {
            $this->writeService->setPppSecretPassword($connection, $account->router_object_id, $newPassword);
        }

        $account->update([
            'password_encrypted' => $newPassword,
        ]);

        AuditLog::log('reset_password', 'network_account', $account->id, $connection->id, null, [
            'username' => $account->username,
            'account_type' => $account->account_type,
        ]);
    }

    /**
     * Toggle enabled state for a member's network account.
     */
    public function toggleAccountState(NetworkAccount $account, bool $enable): void
    {
        $connection = $account->routerConnection;

        if ($account->router_object_id) {
            if ($account->account_type === 'hotspot') {
                $this->writeService->setHotspotUserDisabled($connection, $account->router_object_id, !$enable);
            } else {
                $this->writeService->setPppSecretDisabled($connection, $account->router_object_id, !$enable);
            }
        }

        $account->update([
            'expected_enabled' => $enable,
            'last_router_state' => $enable ? 'enabled' : 'disabled',
        ]);
    }
}
