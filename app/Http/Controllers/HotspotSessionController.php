<?php

namespace App\Http\Controllers;

use App\Models\RouterConnection;
use App\Models\RouterSession;
use App\Services\RouterOsWriteService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HotspotSessionController extends Controller
{
    public function __construct(
        protected RouterOsWriteService $writeService
    ) {}

    public function index(Request $request): Response
    {
        $routers = RouterConnection::where('is_active', true)->get();
        $selectedRouterId = $request->get('router_id', $routers->first()?->id);

        $sessions = RouterSession::when($selectedRouterId, fn ($q) => $q->where('router_connection_id', $selectedRouterId))
            ->where('account_type', 'hotspot')
            ->with(['accessPoint', 'routerConnection'])
            ->latest('observed_at')
            ->paginate(30);

        return Inertia::render('hotspot/sessions', [
            'routers' => $routers,
            'selectedRouterId' => (int)$selectedRouterId,
            'sessions' => $sessions,
        ]);
    }

    public function disconnect(Request $request, RouterSession $session): RedirectResponse
    {
        $connection = $session->routerConnection;

        try {
            $this->writeService->disconnectHotspotSession(
                $connection,
                $session->router_session_id,
                $session->username
            );

            $session->delete();

            return back()->with('success', "Session for '{$session->username}' disconnected.");
        } catch (\Throwable $e) {
            return back()->with('error', "Failed to disconnect: " . $e->getMessage());
        }
    }
}
