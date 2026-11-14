<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\Member;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Voucher;
use Exception;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class SalesService
{
    /**
     * Complete a sale allocating ready vouchers.
     *
     * @param array $voucherIds List of ready voucher IDs to sell
     * @param array $saleData [cashier_id, member_id, payment_method, payment_status, discount, notes]
     */
    public function createSale(array $voucherIds, array $saleData): Sale
    {
        return DB::transaction(function () use ($voucherIds, $saleData) {
            // Lock and verify vouchers are ready
            $vouchers = Voucher::whereIn('id', $voucherIds)
                ->lockForUpdate()
                ->get();

            if ($vouchers->count() !== count($voucherIds)) {
                throw new Exception("One or more vouchers could not be found.");
            }

            foreach ($vouchers as $voucher) {
                if ($voucher->commercial_status !== 'ready') {
                    throw new Exception("Voucher '{$voucher->username}' is not in ready status (current: {$voucher->commercial_status}).");
                }
            }

            $subtotal = $vouchers->sum('price_snapshot');
            $discount = (float)($saleData['discount'] ?? 0);
            $grandTotal = max(0, $subtotal - $discount);
            $paymentStatus = $saleData['payment_status'] ?? 'paid';

            $receiptNumber = 'INV-' . date('Ymd') . '-' . strtoupper(Str::random(4));

            $sale = Sale::create([
                'receipt_number' => $receiptNumber,
                'member_id' => $saleData['member_id'] ?? null,
                'cashier_id' => $saleData['cashier_id'] ?? auth()->id(),
                'subtotal' => $subtotal,
                'discount_total' => $discount,
                'grand_total' => $grandTotal,
                'currency' => 'IDR',
                'payment_method' => $saleData['payment_method'] ?? 'cash',
                'payment_status' => $paymentStatus,
                'paid_at' => $paymentStatus === 'paid' ? now() : null,
                'notes' => $saleData['notes'] ?? null,
            ]);

            // Add sale items grouped by profile
            $grouped = $vouchers->groupBy('hotspot_profile_id');
            foreach ($grouped as $profileId => $groupVouchers) {
                $profileName = $groupVouchers->first()->hotspotProfile?->name ?? 'Hotspot Voucher';
                $unitPrice = (float)$groupVouchers->first()->price_snapshot;
                $qty = $groupVouchers->count();

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'item_type' => 'voucher',
                    'description' => "Voucher Hotspot - {$profileName}",
                    'quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'line_total' => $unitPrice * $qty,
                ]);
            }

            // Allocate vouchers and update status
            foreach ($vouchers as $voucher) {
                $sale->vouchers()->attach($voucher->id, [
                    'price_snapshot' => $voucher->price_snapshot,
                ]);

                $voucher->update([
                    'commercial_status' => 'sold',
                    'sold_at' => now(),
                ]);
            }

            AuditLog::log('sale', 'sale', $sale->id, $vouchers->first()?->router_connection_id, null, [
                'receipt_number' => $sale->receipt_number,
                'total' => $sale->grand_total,
                'vouchers_count' => count($voucherIds),
                'payment_method' => $sale->payment_method,
            ]);

            return $sale->load(['items', 'vouchers.hotspotProfile', 'member', 'cashier']);
        });
    }

    /**
     * Void a sale and optionally return vouchers to ready status.
     */
    public function voidSale(Sale $sale, string $reason, bool $releaseVouchers = true): Sale
    {
        return DB::transaction(function () use ($sale, $reason, $releaseVouchers) {
            if ($sale->payment_status === 'void') {
                throw new Exception("Sale {$sale->receipt_number} is already voided.");
            }

            $before = $sale->toArray();

            $sale->update([
                'payment_status' => 'void',
                'voided_at' => now(),
                'void_reason' => $reason,
            ]);

            if ($releaseVouchers) {
                foreach ($sale->vouchers as $voucher) {
                    $voucher->update([
                        'commercial_status' => 'ready',
                        'sold_at' => null,
                    ]);
                }
            }

            AuditLog::log('void_sale', 'sale', $sale->id, null, $before, [
                'void_reason' => $reason,
                'vouchers_released' => $releaseVouchers,
            ]);

            return $sale->fresh(['items', 'vouchers']);
        });
    }

    /**
     * Record a reprint audit event.
     */
    public function recordReprint(Sale $sale): void
    {
        $sale->increment('reprint_count');
        $sale->update(['last_reprinted_at' => now()]);

        AuditLog::log('reprint_receipt', 'sale', $sale->id, null, null, [
            'reprint_count' => $sale->reprint_count,
            'receipt_number' => $sale->receipt_number,
        ]);
    }
}
