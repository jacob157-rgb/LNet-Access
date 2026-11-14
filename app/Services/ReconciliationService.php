<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\HotspotProfile;
use App\Models\NetworkAccount;
use App\Models\ReconciliationIssue;
use App\Models\RouterConnection;
use App\Models\Voucher;
use Exception;
use Illuminate\Support\Collection;

class ReconciliationService
{
    public function __construct(
        protected RouterOsReadService $readService,
        protected RouterOsWriteService $writeService
    ) {}

    /**
     * Run reconciliation between local database and router.
     */
    public function reconcile(RouterConnection $connection): Collection
    {
        // 1. Fetch live router users
        $routerUsers = collect($this->readService->getHotspotUsers($connection));
        $routerUsersByUsername = $routerUsers->keyBy('name');

        // 2. Fetch local vouchers that are ready or sold
        $localVouchers = Voucher::where('router_connection_id', $connection->id)
            ->whereIn('commercial_status', ['ready', 'sold'])
            ->get();

        $activeProfiles = HotspotProfile::where('router_connection_id', $connection->id)
            ->where('is_present', true)
            ->pluck('name')
            ->flip();

        $foundIssues = collect();

        // Check local records against router
        foreach ($localVouchers as $voucher) {
            $routerUser = $routerUsersByUsername->get($voucher->username);

            // Check if profile is missing
            if ($voucher->hotspotProfile && !isset($activeProfiles[$voucher->hotspotProfile->name])) {
                $foundIssues->push($this->recordIssue(
                    $connection,
                    'hotspot_user',
                    $voucher->id,
                    $voucher->router_object_id,
                    'profile_missing',
                    'high',
                    ['profile' => $voucher->hotspotProfile->name],
                    ['available_profiles' => array_keys($activeProfiles->toArray())]
                ));
            }

            if (!$routerUser) {
                // Missing on router!
                $foundIssues->push($this->recordIssue(
                    $connection,
                    'hotspot_user',
                    $voucher->id,
                    $voucher->router_object_id,
                    'missing_on_router',
                    'high',
                    ['username' => $voucher->username, 'profile' => $voucher->hotspotProfile?->name],
                    ['status' => 'not_found_on_router']
                ));
            } else {
                // Check attribute mismatch (e.g. profile)
                $routerProfile = $routerUser['profile'] ?? '';
                if ($voucher->hotspotProfile && $routerProfile !== $voucher->hotspotProfile->name) {
                    $foundIssues->push($this->recordIssue(
                        $connection,
                        'hotspot_user',
                        $voucher->id,
                        $routerUser['.id'] ?? null,
                        'attribute_mismatch',
                        'medium',
                        ['profile' => $voucher->hotspotProfile->name],
                        ['profile' => $routerProfile]
                    ));
                }
            }
        }

        return $foundIssues;
    }

    /**
     * Record or update a reconciliation issue.
     */
    protected function recordIssue(
        RouterConnection $connection,
        string $entityType,
        ?int $localEntityId,
        ?string $routerObjectId,
        string $issueType,
        string $severity,
        array $expected,
        array $actual
    ): ReconciliationIssue {
        return ReconciliationIssue::updateOrCreate(
            [
                'router_connection_id' => $connection->id,
                'entity_type' => $entityType,
                'local_entity_id' => $localEntityId,
                'issue_type' => $issueType,
                'status' => 'open',
            ],
            [
                'router_object_id' => $routerObjectId,
                'severity' => $severity,
                'expected_json' => $expected,
                'actual_json' => $actual,
            ]
        );
    }

    /**
     * Safe repair action.
     */
    public function repair(ReconciliationIssue $issue, string $action, ?string $note = null): bool
    {
        $connection = $issue->routerConnection;

        if ($action === 'ignore') {
            $issue->update([
                'status' => 'ignored',
                'resolution_note' => $note ?? 'Ignored by administrator',
                'resolved_at' => now(),
            ]);
            return true;
        }

        if ($issue->issue_type === 'missing_on_router' && $action === 'recreate') {
            /** @var Voucher|null $voucher */
            $voucher = Voucher::find($issue->local_entity_id);
            if (!$voucher) {
                throw new Exception("Local voucher record not found.");
            }

            $plainPassword = $voucher->password_encrypted;
            $profileName = $voucher->hotspotProfile->name;

            $created = $this->writeService->createHotspotUser(
                $connection,
                $voucher->username,
                $plainPassword,
                $profileName,
                $voucher->uuid,
                'Repaired by L-Net Access'
            );

            $voucher->update([
                'router_object_id' => $created['.id'] ?? null,
                'commercial_status' => 'ready',
            ]);

            $issue->update([
                'status' => 'resolved',
                'resolution_note' => $note ?? "Re-created user '{$voucher->username}' on RouterOS.",
                'resolved_at' => now(),
            ]);

            AuditLog::log('repair', 'reconciliation_issue', $issue->id, $connection->id, null, [
                'action' => 'recreate',
                'voucher' => $voucher->username,
            ]);

            return true;
        }

        return false;
    }
}
