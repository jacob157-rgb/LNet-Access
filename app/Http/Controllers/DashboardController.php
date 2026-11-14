<?php

namespace App\Http\Controllers;

use App\Models\AccessPoint;
use App\Models\AuditLog;
use App\Models\ReconciliationIssue;
use App\Models\RouterConnection;
use App\Models\RouterSession;
use App\Models\Sale;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        // Get active or first router connection
        $routers = RouterConnection::where('is_active', true)->get();
        $selectedRouterId = $request->get('router_id', $routers->first()?->id);
        $currentRouter = $routers->firstWhere('id', $selectedRouterId) ?? $routers->first();

        // Router metrics
        $hotspotActiveCount = 0;
        $pppoeActiveCount = 0;
        $activeSessions = [];

        if ($currentRouter) {
            $hotspotActiveCount = RouterSession::where('router_connection_id', $currentRouter->id)
                ->where('account_type', 'hotspot')
                ->count();

            $pppoeActiveCount = RouterSession::where('router_connection_id', $currentRouter->id)
                ->where('account_type', 'pppoe')
                ->count();

            $activeSessions = RouterSession::where('router_connection_id', $currentRouter->id)
                ->with('accessPoint')
                ->latest('observed_at')
                ->take(10)
                ->get()
                ->map(fn ($s) => [
                    'id' => $s->id,
                    'username' => $s->username,
                    'account_type' => $s->account_type,
                    'ip_address' => $s->ip_address,
                    'observed_mac' => $s->observed_mac,
                    'ap_name' => $s->accessPoint?->name ?? 'Unknown AP',
                    'uptime' => $s->raw_attributes_json['uptime'] ?? ($s->uptime_seconds ? gmdate("H:i:s", $s->uptime_seconds) : '-'),
                    'observed_at' => $s->observed_at->diffForHumans(),
                ]);
        }

        // Voucher stock summary
        $voucherStats = [
            'ready' => Voucher::when($currentRouter, fn ($q) => $q->where('router_connection_id', $currentRouter->id))->where('commercial_status', 'ready')->count(),
            'sold' => Voucher::when($currentRouter, fn ($q) => $q->where('router_connection_id', $currentRouter->id))->where('commercial_status', 'sold')->count(),
            'draft' => Voucher::when($currentRouter, fn ($q) => $q->where('router_connection_id', $currentRouter->id))->where('commercial_status', 'draft')->count(),
            'total' => Voucher::when($currentRouter, fn ($q) => $q->where('router_connection_id', $currentRouter->id))->count(),
        ];

        // Sales today
        $salesToday = Sale::whereDate('created_at', today())
            ->where('payment_status', 'paid')
            ->sum('grand_total');

        $salesCountToday = Sale::whereDate('created_at', today())
            ->where('payment_status', 'paid')
            ->count();

        // AP Overview
        $apStats = [
            'total' => AccessPoint::count(),
            'online' => AccessPoint::where('status', 'online')->count(),
            'degraded' => AccessPoint::where('status', 'degraded')->count(),
            'offline' => AccessPoint::where('status', 'offline')->count(),
        ];

        // Recent reconciliation issues
        $recentIssues = ReconciliationIssue::with('routerConnection')
            ->where('status', 'open')
            ->latest()
            ->take(5)
            ->get();

        // Recent Audit Logs
        $recentAudit = AuditLog::with('actor')
            ->latest('created_at')
            ->take(8)
            ->get();

        return Inertia::render('dashboard', [
            'routers' => $routers,
            'currentRouter' => $currentRouter,
            'hotspotActiveCount' => $hotspotActiveCount,
            'pppoeActiveCount' => $pppoeActiveCount,
            'activeSessions' => $activeSessions,
            'voucherStats' => $voucherStats,
            'salesToday' => (float)$salesToday,
            'salesCountToday' => $salesCountToday,
            'apStats' => $apStats,
            'recentIssues' => $recentIssues,
            'recentAudit' => $recentAudit,
        ]);
    }
}
