<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\Voucher;
use App\Models\VoucherBatch;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Collection;

class PrintService
{
    /**
     * Generate an SVG QR code string with configurable margin (default 0 for maximum module size).
     */
    public function generateQrCode(string $content, int $size = 140, int $margin = 0): string
    {
        $renderer = new ImageRenderer(
            new RendererStyle($size, $margin),
            new SvgImageBackEnd()
        );
        $writer = new Writer($renderer);
        $svg = $writer->writeString($content);

        // Make SVG responsive so it scales cleanly to any container size
        return preg_replace('/width="\d+" height="\d+"/', 'width="100%" height="100%"', $svg, 1) ?? $svg;
    }

    /**
     * Prepare data for a single voucher ticket.
     */
    public function formatVoucherTicket(Voucher $voucher): array
    {
        $voucher->loadMissing(['hotspotProfile', 'routerConnection']);
        $dnsHost = 'agungwifi.net';
        $password = $voucher->password_encrypted ?: $voucher->username;
        $loginParam = ($voucher->username === $password)
            ? "username=" . urlencode($voucher->username)
            : "username=" . urlencode($voucher->username) . "&password=" . urlencode($password);

        $loginUrl = "http://{$dnsHost}/login?{$loginParam}";
        $qrSvg = $this->generateQrCode($loginUrl, 140, 0);

        return [
            'id' => $voucher->id,
            'uuid' => $voucher->uuid,
            'username' => $voucher->username,
            'password' => $password,
            'profile_name' => $voucher->hotspotProfile?->name ?? 'Standard',
            'rate_limit' => $this->formatRateLimitIndonesian($voucher->hotspotProfile?->rate_limit),
            'validity' => $this->formatTimeoutIndonesian($voucher->hotspotProfile?->session_timeout),
            'price' => (float)$voucher->price_snapshot,
            'currency' => $voucher->currency,
            'batch_code' => $voucher->batch?->batch_code ?? 'SINGLE',
            'generated_at' => $voucher->generated_at?->format('d/m/Y H:i') ?? '',
            'qr_svg' => $qrSvg,
            'login_url' => $loginUrl,
        ];
    }

    /**
     * Prepare data for a sales receipt (Thermal 58mm).
     */
    public function formatSaleReceipt(Sale $sale): array
    {
        $sale->load(['items', 'vouchers.hotspotProfile', 'member', 'cashier']);
        $receiptUrl = url("/receipt/{$sale->receipt_number}");
        $qrSvg = $this->generateQrCode($receiptUrl, 90);

        return [
            'receipt_number' => $sale->receipt_number,
            'date' => $sale->created_at->format('d/m/Y H:i:s'),
            'cashier_name' => $sale->cashier?->name ?? 'Admin',
            'member_name' => $sale->member?->name ?? 'Umum',
            'payment_method' => strtoupper($sale->payment_method),
            'payment_status' => strtoupper($sale->payment_status),
            'subtotal' => (float)$sale->subtotal,
            'discount' => (float)$sale->discount_total,
            'grand_total' => (float)$sale->grand_total,
            'items' => $sale->items->map(fn ($item) => [
                'description' => $item->description,
                'quantity' => $item->quantity,
                'unit_price' => (float)$item->unit_price,
                'line_total' => (float)$item->line_total,
            ])->toArray(),
            'vouchers' => $sale->vouchers->map(fn ($v) => [
                'username' => $v->username,
                'password' => $v->password_encrypted ?: $v->username,
                'profile' => $v->hotspotProfile?->name ?? '',
            ])->toArray(),
            'qr_svg' => $qrSvg,
            'reprint_count' => $sale->reprint_count,
        ];
    }

    /**
     * Prepare data for F4 / A4 batch voucher sheets (36 vouchers per sheet matching sample PDF).
     */
    public function formatBatchSheet(VoucherBatch $batch, array $options = []): array
    {
        $batch->load(['vouchers.hotspotProfile', 'routerConnection']);

        $router = $batch->routerConnection;
        $profile = $batch->hotspotProfile;

        // Brand name: e.g. AgungWifi or router name
        $defaultBrand = 'AgungWifi';
        if ($router?->router_identity) {
            $defaultBrand = str_replace(['Tik', 'tik', 'TIK'], 'Wifi', $router->router_identity);
            if ($defaultBrand === 'AgungTik') {
                $defaultBrand = 'AgungWifi';
            }
        }
        $brandName = $options['brand_name'] ?? $defaultBrand;

        // Login DNS host: e.g. agungwifi.net
        $dnsHost = $options['dns_host'] ?? 'agungwifi.net';

        // Profile details
        $sessionTimeout = $profile?->session_timeout ?? '12h';
        $validityFormatted = $this->formatTimeoutIndonesian($sessionTimeout);
        $rateLimitFormatted = $this->formatRateLimitIndonesian($profile?->rate_limit);

        $vouchers = $batch->vouchers->values()->map(function (Voucher $voucher, int $index) use ($dnsHost, $brandName, $validityFormatted, $rateLimitFormatted) {
            $password = $voucher->password_encrypted ?: $voucher->username;

            // Simplified MikroTik Hotspot login URL:
            // When username equals password, passing username is sufficient and keeps QR code simple
            $loginParam = ($voucher->username === $password)
                ? "username=" . urlencode($voucher->username)
                : "username=" . urlencode($voucher->username) . "&password=" . urlencode($password);

            $directLoginUrl = "http://{$dnsHost}/login?{$loginParam}";
            $codeOnly = $voucher->username;
            $portalUrl = url("/portal/voucher/{$voucher->uuid}");

            // Zero-margin QR code with large chunky modules (Level L) for instant scan on low-end cameras
            $qrSvg = $this->generateQrCode($directLoginUrl, 160, 0);
            $qrSvgCodeOnly = $this->generateQrCode($codeOnly, 160, 0);

            // Format date for bottom-right: e.g. 14/11/26
            $createdDate = $voucher->generated_at
                ? $voucher->generated_at->format('d/m/y')
                : ($voucher->created_at ? $voucher->created_at->format('d/m/y') : date('d/m/y'));

            return [
                'id' => $voucher->id,
                'uuid' => $voucher->uuid,
                'index' => $index + 1,
                'username' => $voucher->username,
                'password' => $password,
                'user_equals_password' => ($voucher->username === $password),
                'profile_name' => $voucher->hotspotProfile?->name ?? 'Standard',
                'validity' => $validityFormatted,
                'duration' => $validityFormatted,
                'rate_limit' => $rateLimitFormatted,
                'price' => (float)$voucher->price_snapshot,
                'currency' => $voucher->currency,
                'batch_code' => $voucher->batch?->batch_code ?? 'SINGLE',
                'generated_at' => $voucher->generated_at?->format('d/m/Y H:i') ?? '',
                'generated_date' => $createdDate,
                'qr_svg' => $qrSvg,
                'qr_svg_code_only' => $qrSvgCodeOnly,
                'direct_login_url' => $directLoginUrl,
                'portal_url' => $portalUrl,
            ];
        })->toArray();

        return [
            'batch_id' => $batch->id,
            'batch_code' => $batch->batch_code,
            'router_name' => $router?->name ?? 'AgungTik',
            'brand_name' => $brandName,
            'dns_host' => $dnsHost,
            'profile_name' => $profile?->name ?? '2k-12j',
            'total_count' => count($vouchers),
            'vouchers' => $vouchers,
        ];
    }

    /**
     * Format session timeouts into Indonesian display (e.g. 12h -> 12Jam, 1d -> 24Jam).
     */
    public function formatTimeoutIndonesian(?string $timeout): string
    {
        if (empty($timeout) || $timeout === 'none') {
            return 'Unlimited';
        }

        $timeout = strtolower(trim($timeout));

        if (preg_match('/^(\d+)h$/', $timeout, $m)) {
            return $m[1] . 'Jam';
        }

        if (preg_match('/^(\d+)d$/', $timeout, $m)) {
            $days = (int)$m[1];
            if ($days === 1) return '24Jam';
            if ($days === 7) return '7Hari';
            if ($days >= 30) return '30Hari';
            return $days . 'Hari';
        }

        if ($timeout === '4w3d' || $timeout === '31d') {
            return '30Hari';
        }

        if (preg_match('/^(\d+)w$/', $timeout, $m)) {
            return ((int)$m[1] * 7) . 'Hari';
        }

        if (preg_match('/^(\d+)m$/', $timeout, $m)) {
            return $m[1] . 'Menit';
        }

        return $timeout;
    }

    /**
     * Format bandwidth limits into friendly labels (e.g. 512k/1024k -> 2 MiB / 1 Mbps).
     */
    public function formatRateLimitIndonesian(?string $rateLimit): string
    {
        if (empty($rateLimit) || $rateLimit === 'none' || $rateLimit === '-') {
            return '2 MiB';
        }

        $rateLimit = trim($rateLimit);

        if (str_contains($rateLimit, '1024k') || str_contains($rateLimit, '1M')) {
            return '2 MiB';
        }
        if (str_contains($rateLimit, '1500k')) {
            return '3 MiB';
        }
        if (str_contains($rateLimit, '2048k') || str_contains($rateLimit, '2M')) {
            return '4 MiB';
        }

        return $rateLimit;
    }
}
