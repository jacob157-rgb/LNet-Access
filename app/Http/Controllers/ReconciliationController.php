<?php

namespace App\Http\Controllers;

use App\Models\ReconciliationIssue;
use App\Models\RouterConnection;
use App\Services\ReconciliationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReconciliationController extends Controller
{
    public function __construct(
        protected ReconciliationService $reconciliationService
    ) {}

    public function index(Request $request): Response
    {
        $routers = RouterConnection::where('is_active', true)->get();
        $selectedRouterId = $request->get('router_id', $routers->first()?->id);

        $issues = ReconciliationIssue::when($selectedRouterId, fn ($q) => $q->where('router_connection_id', $selectedRouterId))
            ->with('routerConnection')
            ->latest()
            ->paginate(20);

        return Inertia::render('reconciliation/index', [
            'routers' => $routers,
            'selectedRouterId' => (int)$selectedRouterId,
            'issues' => $issues,
        ]);
    }

    public function run(RouterConnection $router): RedirectResponse
    {
        try {
            $issues = $this->reconciliationService->reconcile($router);
            return back()->with('success', "Reconciliation finished. Identified {$issues->count()} issues.");
        } catch (\Throwable $e) {
            return back()->with('error', "Reconciliation failed: " . $e->getMessage());
        }
    }

    public function repair(Request $request, ReconciliationIssue $issue): RedirectResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:recreate,ignore'],
            'note' => ['nullable', 'string', 'max:255'],
        ]);

        try {
            $this->reconciliationService->repair($issue, $validated['action'], $validated['note'] ?? null);
            return back()->with('success', "Issue resolved ({$validated['action']}).");
        } catch (\Throwable $e) {
            return back()->with('error', "Repair failed: " . $e->getMessage());
        }
    }
}
