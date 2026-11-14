<?php

namespace App\Http\Controllers;

use App\Models\HotspotProfile;
use App\Models\RouterConnection;
use App\Models\Voucher;
use App\Services\QrLoginService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PortalController extends Controller
{
    public function __construct(
        protected QrLoginService $qrService
    ) {}

    /**
     * Public Hotspot Portal landing page for customers.
     */
    public function index(Request $request): Response
    {
        $router = RouterConnection::where('is_active', true)->first();
        $profiles = $router ? HotspotProfile::where('router_connection_id', $router->id)
            ->where('is_present', true)
            ->whereNotIn('name', ['default'])
            ->get() : collect();

        return Inertia::render('portal/index', [
            'hotspotLoginUrl' => 'http://agungwifi.net/login',
            'clientIp' => $request->ip(),
            'profiles' => $profiles,
        ]);
    }

    /**
     * Public voucher display page (Opaque voucher UUID, no plain password in URL).
     */
    public function showVoucher(string $uuid): Response
    {
        $voucher = Voucher::where('uuid', $uuid)
            ->with(['hotspotProfile', 'routerConnection'])
            ->firstOrFail();

        return Inertia::render('portal/voucher', [
            'voucher' => [
                'username' => $voucher->username,
                'password' => $voucher->password_encrypted,
                'profile' => $voucher->hotspotProfile?->name,
                'rate_limit' => $voucher->hotspotProfile?->rate_limit,
                'router_name' => $voucher->routerConnection?->name,
                'status' => $voucher->commercial_status,
            ],
        ]);
    }

    /**
     * Redeem one-time QR login token for captive portal.
     */
    public function redeemQr(Request $request, string $token): Response
    {
        try {
            $voucher = $this->qrService->redeemToken($token, $request->ip());

            return Inertia::render('portal/redeem-success', [
                'voucher' => [
                    'username' => $voucher->username,
                    'password' => $voucher->password_encrypted,
                    'profile' => $voucher->hotspotProfile?->name,
                ],
                'hotspotLoginUrl' => 'http://agungwifi.net/login?username=' . urlencode($voucher->username) . '&password=' . urlencode($voucher->password_encrypted),
            ]);
        } catch (\Throwable $e) {
            return Inertia::render('portal/redeem-error', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}
