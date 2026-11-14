<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\HotspotProfile;
use App\Models\Member;
use App\Models\NetworkAccount;
use App\Models\PppProfile;
use App\Models\RouterConnection;
use App\Models\RouterSession;
use App\Services\MemberService;
use App\Services\RouterOsWriteService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MemberController extends Controller
{
    public function __construct(
        protected MemberService $memberService,
        protected RouterOsWriteService $writeService
    ) {}

    public function index(Request $request): Response
    {
        $query = Member::withCount('networkAccounts')->latest();

        if ($search = $request->get('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('member_code', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $members = $query->paginate(20)->withQueryString();

        return Inertia::render('members/index', [
            'members' => $members,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:20'],
            'notes' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,suspended,archived'],
        ]);

        $member = $this->memberService->createMember($validated);

        return redirect()->route('members.show', $member->id)
            ->with('success', "Member '{$member->name}' created.");
    }

    public function show(Member $member): Response
    {
        $member->load([
            'networkAccounts.routerConnection',
            'sales.items',
            'macObservations.accessPoint',
        ]);

        $routers = RouterConnection::where('is_active', true)->get();
        $hotspotProfiles = HotspotProfile::where('is_present', true)->get();
        $pppProfiles = PppProfile::where('is_present', true)->get();

        // Check if member accounts have live sessions
        $accountUsernames = $member->networkAccounts->pluck('username')->toArray();
        $activeSessions = RouterSession::whereIn('username', $accountUsernames)
            ->with('accessPoint')
            ->get();

        $auditLogs = AuditLog::where(function ($q) use ($member) {
            $q->where('entity_type', 'member')->where('entity_id', $member->id);
        })->orWhere(function ($q) use ($member) {
            $accountIds = $member->networkAccounts->pluck('id');
            $q->where('entity_type', 'network_account')->whereIn('entity_id', $accountIds);
        })->latest('created_at')->take(20)->get();

        return Inertia::render('members/show', [
            'member' => $member,
            'routers' => $routers,
            'hotspotProfiles' => $hotspotProfiles,
            'pppProfiles' => $pppProfiles,
            'activeSessions' => $activeSessions,
            'auditLogs' => $auditLogs,
        ]);
    }

    public function update(Request $request, Member $member): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:20'],
            'notes' => ['nullable', 'string', 'max:255'],
            'status' => ['required', 'string', 'in:active,suspended,archived'],
        ]);

        $member->update($validated);

        return back()->with('success', "Member updated.");
    }

    public function attachAccount(Request $request, Member $member): RedirectResponse
    {
        $validated = $request->validate([
            'router_id' => ['required', 'exists:router_connections,id'],
            'account_type' => ['required', 'string', 'in:hotspot,pppoe'],
            'username' => ['required', 'string', 'max:50'],
            'password' => ['required', 'string', 'max:50'],
            'profile_name' => ['required', 'string'],
        ]);

        $router = RouterConnection::findOrFail($validated['router_id']);

        try {
            $this->memberService->attachNetworkAccount(
                $member,
                $router,
                $validated['account_type'],
                $validated['username'],
                $validated['password'],
                $validated['profile_name']
            );

            return back()->with('success', "Added {$validated['account_type']} account '{$validated['username']}' to {$member->name}.");
        } catch (\Throwable $e) {
            return back()->with('error', "Failed to create network account: " . $e->getMessage());
        }
    }

    public function resetPassword(Request $request, NetworkAccount $account): RedirectResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'min:4', 'max:50'],
        ]);

        try {
            $this->memberService->resetAccountPassword($account, $validated['password']);
            return back()->with('success', "Password for '{$account->username}' updated.");
        } catch (\Throwable $e) {
            return back()->with('error', "Password reset failed: " . $e->getMessage());
        }
    }

    public function toggleAccount(NetworkAccount $account): RedirectResponse
    {
        $newState = !$account->expected_enabled;

        try {
            $this->memberService->toggleAccountState($account, $newState);
            return back()->with('success', "Account '{$account->username}' " . ($newState ? 'enabled' : 'disabled') . ".");
        } catch (\Throwable $e) {
            return back()->with('error', "Toggle failed: " . $e->getMessage());
        }
    }
}
