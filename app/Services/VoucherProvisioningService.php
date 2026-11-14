<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\HotspotProfile;
use App\Models\RouterConnection;
use App\Models\Voucher;
use App\Models\VoucherBatch;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class VoucherProvisioningService
{
    public function __construct(
        protected RouterOsReadService $readService,
        protected RouterOsWriteService $writeService
    ) {}

    /**
     * Generate unique codes avoiding ambiguous characters (0/O, 1/I/l).
     */
    public function generateUniqueCode(int $length = 8, string $charset = 'mikhmon', string $prefix = ''): string
    {
        if ($charset === 'mikhmon' || $charset === 'alpha_num_split') {
            $letters = 'abcdefghjkmnpqrstuvwxyz';
            $digits = '23456789';
            $half = (int)ceil($length / 2);
            $digitCount = $length - $half;
            $code = '';
            for ($i = 0; $i < $half; $i++) {
                $code .= $letters[random_int(0, strlen($letters) - 1)];
            }
            for ($i = 0; $i < $digitCount; $i++) {
                $code .= $digits[random_int(0, strlen($digits) - 1)];
            }
            return $prefix . $code;
        }

        $chars = match ($charset) {
            'numbers' => '23456789',
            'letters' => 'abcdefghjkmnpqrstuvwxyz',
            'uppercase' => 'ABCDEFGHJKLMNPQRSTUVWXYZ',
            default => '23456789abcdefghjkmnpqrstuvwxyz', // safe alphanumeric
        };

        $code = '';
        $max = strlen($chars) - 1;
        for ($i = 0; $i < $length; $i++) {
            $code .= $chars[random_int(0, $max)];
        }

        return $prefix . $code;
    }

    /**
     * Create and provision a batch of vouchers.
     */
    public function createBatch(
        RouterConnection $connection,
        HotspotProfile $profile,
        int $quantity,
        array $options = [],
        ?int $userId = null
    ): VoucherBatch {
        if (!$profile->is_present) {
            throw new Exception("Selected profile '{$profile->name}' does not exist on the router.");
        }

        $codeLength = $options['length'] ?? 6;
        $charset = $options['charset'] ?? 'alphanumeric_safe';
        $prefix = $options['prefix'] ?? '';
        $userEqualsPass = $options['user_equals_password'] ?? true;
        $price = $options['price'] ?? 0;
        $notes = $options['notes'] ?? null;

        $batchCode = 'BATCH-' . strtoupper(Str::random(6)) . '-' . date('ymd');

        // 1. Create batch record
        $batch = VoucherBatch::create([
            'batch_code' => $batchCode,
            'router_connection_id' => $connection->id,
            'hotspot_profile_id' => $profile->id,
            'quantity_requested' => $quantity,
            'quantity_created' => 0,
            'status' => 'pending',
            'created_by' => $userId,
            'notes' => $notes,
        ]);

        // 2. Pre-generate usernames and reserve in database
        $reservedVouchers = [];
        $existingUsernames = Voucher::where('router_connection_id', $connection->id)
            ->pluck('username')
            ->flip();

        for ($i = 0; $i < $quantity; $i++) {
            $attempts = 0;
            do {
                $username = $this->generateUniqueCode($codeLength, $charset, $prefix);
                $attempts++;
            } while (isset($existingUsernames[$username]) && $attempts < 50);

            $existingUsernames[$username] = true;
            $password = $userEqualsPass ? $username : $this->generateUniqueCode($codeLength, $charset);
            $uuid = (string)Str::uuid();

            $voucher = Voucher::create([
                'uuid' => $uuid,
                'router_connection_id' => $connection->id,
                'batch_id' => $batch->id,
                'hotspot_profile_id' => $profile->id,
                'username' => $username,
                'password_encrypted' => $password,
                'commercial_status' => 'draft',
                'router_status' => 'inactive',
                'price_snapshot' => $price,
                'generated_at' => now(),
                'router_comment_marker' => "lnet-access:{$uuid}",
                'notes' => $notes,
            ]);

            $reservedVouchers[] = ['voucher' => $voucher, 'password' => $password];
        }

        // 3. Provision to RouterOS
        $this->provisionVouchers($connection, $batch, $reservedVouchers, $profile->name);

        return $batch->fresh(['vouchers']);
    }

    /**
     * Provision vouchers to router with verification and partial failure protection.
     */
    public function provisionVouchers(
        RouterConnection $connection,
        VoucherBatch $batch,
        array $voucherItems,
        string $profileName
    ): void {
        $batch->update(['status' => 'provisioning']);
        $successCount = 0;
        $failedCount = 0;

        $limitUptime = $batch->hotspotProfile?->session_timeout;

        foreach ($voucherItems as $item) {
            /** @var Voucher $voucher */
            $voucher = $item['voucher'];
            $plainPassword = $item['password'];

            try {
                $voucher->update(['commercial_status' => 'provisioning']);

                // Create and verify on RouterOS
                $routerUser = $this->writeService->createHotspotUser(
                    $connection,
                    $voucher->username,
                    $plainPassword,
                    $profileName,
                    $voucher->uuid,
                    $batch->batch_code,
                    $limitUptime
                );

                $voucher->update([
                    'commercial_status' => 'ready',
                    'provisioned_at' => now(),
                    'router_object_id' => $routerUser['.id'] ?? null,
                ]);

                $successCount++;
            } catch (Exception $e) {
                $failedCount++;
                $voucher->update([
                    'commercial_status' => 'draft',
                    'notes' => ($voucher->notes ? $voucher->notes . ' | ' : '') . 'Provision failed: ' . $e->getMessage(),
                ]);
            }
        }

        $finalStatus = 'completed';
        if ($failedCount > 0 && $successCount > 0) {
            $finalStatus = 'partial';
        } elseif ($failedCount > 0 && $successCount === 0) {
            $finalStatus = 'failed';
        }

        $batch->update([
            'status' => $finalStatus,
            'quantity_created' => $successCount,
        ]);
    }

    /**
     * Retry failed/draft vouchers in a batch safely.
     */
    public function retryBatch(VoucherBatch $batch): void
    {
        $connection = $batch->routerConnection;
        $profile = $batch->hotspotProfile;

        $unprovisioned = Voucher::where('batch_id', $batch->id)
            ->whereIn('commercial_status', ['draft', 'failed'])
            ->get();

        $items = [];
        foreach ($unprovisioned as $voucher) {
            $items[] = [
                'voucher' => $voucher,
                'password' => $voucher->password_encrypted,
            ];
        }

        $this->provisionVouchers($connection, $batch, $items, $profile->name);
    }

    /**
     * Delete a batch and burn/remove its vouchers from MikroTik and DB.
     *
     * @param VoucherBatch $batch
     * @param bool $deleteSold Whether to also delete vouchers that were already marked sold
     * @return array
     */
    public function deleteBatch(VoucherBatch $batch, bool $deleteSold = false): array
    {
        $connection = $batch->routerConnection;
        $allVouchers = $batch->vouchers;

        if ($deleteSold) {
            $targetVouchers = $allVouchers;
        } else {
            // Only unused vouchers (anything not sold)
            $targetVouchers = $allVouchers->filter(function (Voucher $v) {
                return !in_array($v->commercial_status, ['sold']);
            });
        }

        $removedFromRouter = 0;
        $routerErrors = [];

        // Remove target vouchers from RouterOS Hotspot
        if ($connection && $connection->is_active && $targetVouchers->isNotEmpty()) {
            try {
                $userPayload = $targetVouchers->map(function (Voucher $v) {
                    return [
                        'username' => $v->username,
                        'router_object_id' => $v->router_object_id,
                    ];
                })->values()->all();

                $removalResult = $this->writeService->removeHotspotUsers($connection, $userPayload);
                $removedFromRouter = $removalResult['removed'];
                $routerErrors = $removalResult['errors'];
            } catch (\Throwable $e) {
                Log::warning("Failed to remove vouchers from RouterOS for batch {$batch->batch_code}: " . $e->getMessage());
                $routerErrors[] = $e->getMessage();
            }
        }

        $targetIds = $targetVouchers->pluck('id')->all();
        $targetCount = count($targetIds);

        // Delete vouchers from DB
        if (!empty($targetIds)) {
            Voucher::whereIn('id', $targetIds)->delete();
        }

        $remainingCount = $batch->vouchers()->count();
        $batchDeleted = false;

        if ($remainingCount === 0 || $deleteSold) {
            $batchCode = $batch->batch_code;
            $batchId = $batch->id;
            $batch->delete();
            $batchDeleted = true;

            AuditLog::log('delete', 'voucher_batch', $batchId, $connection?->id, null, [
                'batch_code' => $batchCode,
                'vouchers_deleted' => $targetCount,
                'removed_from_router' => $removedFromRouter,
                'delete_sold' => $deleteSold,
            ]);
        } else {
            $batch->update([
                'quantity_created' => $remainingCount,
                'notes' => trim(($batch->notes ? $batch->notes . ' | ' : '') . "Dihanguskan {$targetCount} voucher tidak terpakai (" . now()->format('d/m/Y H:i') . ")"),
            ]);

            AuditLog::log('void_unused', 'voucher_batch', $batch->id, $connection?->id, null, [
                'batch_code' => $batch->batch_code,
                'vouchers_deleted' => $targetCount,
                'vouchers_retained' => $remainingCount,
                'removed_from_router' => $removedFromRouter,
            ]);
        }

        return [
            'batch_deleted' => $batchDeleted,
            'vouchers_deleted' => $targetCount,
            'vouchers_remaining' => $remainingCount,
            'removed_from_router' => $removedFromRouter,
            'router_errors' => $routerErrors,
        ];
    }

    /**
     * Delete/burn a single voucher from MikroTik and database.
     */
    public function deleteVoucher(Voucher $voucher): array
    {
        $connection = $voucher->routerConnection;
        $username = $voucher->username;
        $removedFromRouter = false;

        if ($connection && $connection->is_active) {
            try {
                $this->writeService->removeHotspotUsers($connection, [[
                    'username' => $voucher->username,
                    'router_object_id' => $voucher->router_object_id,
                ]]);
                $removedFromRouter = true;
            } catch (\Throwable $e) {
                Log::warning("Failed to remove voucher {$username} from RouterOS: " . $e->getMessage());
            }
        }

        $batch = $voucher->batch;
        $voucher->delete();

        if ($batch) {
            $remaining = $batch->vouchers()->count();
            $batch->update(['quantity_created' => $remaining]);
        }

        AuditLog::log('delete', 'voucher', $voucher->id, $connection?->id, null, [
            'username' => $username,
            'removed_from_router' => $removedFromRouter,
        ]);

        return [
            'success' => true,
            'username' => $username,
            'removed_from_router' => $removedFromRouter,
        ];
    }
}
