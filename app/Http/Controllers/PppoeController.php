<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\NetworkAccount;
use App\Models\PppProfile;
use App\Models\RouterConnection;
use App\Models\RouterSession;
use App\Services\PppoeAccountService;
use App\Services\RouterOsWriteService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PppoeController extends Controller
{
    public function __construct(
        protected PppoeAccountService $pppoeService,
        protected RouterOsWriteService $writeService
    ) {}

    public function index(Request $request): Response
    {
        $routers = RouterConnection::where('is_active', true)->get();
        $selectedRouterId = $request->get('router_id', $routers->first()?->id);
        $selectedRouter = $routers->firstWhere('id', $selectedRouterId);

        // Auto-sync if accounts or profiles are empty
        if ($selectedRouter) {
            $accountCount = NetworkAccount::where('router_connection_id', $selectedRouterId)
                ->where('account_type', 'pppoe')
                ->count();
            if ($accountCount === 0) {
                try {
                    $this->pppoeService->syncProfiles($selectedRouter);
                    $this->pppoeService->syncSecrets($selectedRouter);
                    $this->pppoeService->syncActiveSessions($selectedRouter);
                } catch (\Throwable $e) {
                    // ignore initial sync failure
                }
            }
        }

        $accounts = NetworkAccount::when($selectedRouterId, fn ($q) => $q->where('router_connection_id', $selectedRouterId))
            ->where('account_type', 'pppoe')
            ->with(['member', 'routerConnection'])
            ->latest()
            ->paginate(50);

        $activeSessions = RouterSession::when($selectedRouterId, fn ($q) => $q->where('router_connection_id', $selectedRouterId))
            ->where('account_type', 'pppoe')
            ->with('routerConnection')
            ->latest('observed_at')
            ->get();

        $profiles = PppProfile::when($selectedRouterId, fn ($q) => $q->where('router_connection_id', $selectedRouterId))
            ->where('is_present', true)
            ->get();

        $members = Member::where('status', 'active')->orderBy('name')->take(50)->get();

        return Inertia::render('pppoe/index', [
            'routers' => $routers,
            'selectedRouterId' => (int)$selectedRouterId,
            'accounts' => $accounts,
            'activeSessions' => $activeSessions,
            'profiles' => $profiles,
            'members' => $members,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'router_id' => ['required', 'exists:router_connections,id'],
            'username' => ['required', 'string', 'max:50'],
            'password' => ['required', 'string', 'max:50'],
            'profile_name' => ['required', 'string'],
            'caller_id' => ['nullable', 'string', 'max:50'],
            'remote_address' => ['nullable', 'string', 'max:50'],
            'comment' => ['nullable', 'string', 'max:100'],
            'member_id' => ['nullable', 'exists:members,id'],
        ]);

        $router = RouterConnection::findOrFail($validated['router_id']);

        try {
            $this->pppoeService->createAccount(
                $router,
                $validated['username'],
                $validated['password'],
                $validated['profile_name'],
                $validated['caller_id'] ?? null,
                $validated['remote_address'] ?? null,
                $validated['comment'] ?? null,
                $validated['member_id'] ?? null
            );

            return back()->with('success', "Akun PPPoE '{$validated['username']}' berhasil dibuat di MikroTik.");
        } catch (\Throwable $e) {
            return back()->with('error', "Gagal membuat akun PPPoE: " . $e->getMessage());
        }
    }

    public function destroy(NetworkAccount $account): RedirectResponse
    {
        try {
            $username = $account->username;
            $this->pppoeService->deleteAccount($account);
            return back()->with('success', "Akun PPPoE '{$username}' berhasil dihapus dari MikroTik & database.");
        } catch (\Throwable $e) {
            return back()->with('error', "Gagal menghapus akun PPPoE: " . $e->getMessage());
        }
    }

    public function toggle(NetworkAccount $account): RedirectResponse
    {
        try {
            $disabled = $account->last_router_state === 'enabled';
            $this->pppoeService->toggleAccount($account, $disabled);
            $statusText = $disabled ? 'dinonaktifkan' : 'diaktifkan';
            return back()->with('success', "Akun PPPoE '{$account->username}' berhasil {$statusText}.");
        } catch (\Throwable $e) {
            return back()->with('error', "Gagal mengubah status PPPoE: " . $e->getMessage());
        }
    }

    public function disconnect(Request $request, RouterSession $session): RedirectResponse
    {
        $connection = $session->routerConnection;

        try {
            $this->writeService->disconnectPppSession(
                $connection,
                $session->router_session_id,
                $session->username
            );

            $session->delete();

            return back()->with('success', "Sesi PPPoE '{$session->username}' berhasil diputus.");
        } catch (\Throwable $e) {
            return back()->with('error', "Gagal memutus sesi: " . $e->getMessage());
        }
    }

    public function sync(RouterConnection $router): RedirectResponse
    {
        try {
            $profiles = $this->pppoeService->syncProfiles($router);
            $secrets = $this->pppoeService->syncSecrets($router);
            $sessions = $this->pppoeService->syncActiveSessions($router);

            return back()->with('success', "Berhasil sinkronisasi: {$secrets->count()} akun PPPoE, {$sessions->count()} sesi aktif, dan {$profiles->count()} profil dari {$router->name}.");
        } catch (\Throwable $e) {
            return back()->with('error', "Gagal sinkronisasi PPPoE: " . $e->getMessage());
        }
    }
}
