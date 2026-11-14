<?php

namespace App\Http\Controllers;

use App\Models\AccessPoint;
use App\Models\RouterConnection;
use App\Services\AccessPointHealthCheckService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AccessPointController extends Controller
{
    public function __construct(
        protected AccessPointHealthCheckService $healthService
    ) {}

    public function index(): Response
    {
        $accessPoints = AccessPoint::with(['router', 'healthChecks' => function ($q) {
            $q->latest('checked_at')->take(10);
        }])->get();

        $routers = RouterConnection::where('is_active', true)->get();

        return Inertia::render('access-points/index', [
            'accessPoints' => $accessPoints,
            'routers' => $routers,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'location' => ['nullable', 'string', 'max:100'],
            'management_ip' => ['required', 'ip'],
            'health_check_type' => ['required', 'string', 'in:icmp,http,https,tcp'],
            'health_check_url' => ['nullable', 'string', 'max:255'],
            'health_check_port' => ['nullable', 'integer'],
            'check_interval_seconds' => ['required', 'integer', 'min:10', 'max:3600'],
            'timeout_ms' => ['required', 'integer', 'min:500', 'max:10000'],
            'failure_threshold' => ['required', 'integer', 'min:1', 'max:10'],
            'topology_mode' => ['required', 'string', 'in:bridged_dedicated_port,bridged_shared_uplink,router_nat,unknown'],
            'management_router_id' => ['nullable', 'exists:router_connections,id'],
            'router_bridge_name' => ['nullable', 'string', 'max:50'],
            'router_bridge_port' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $validated['client_mapping_capability'] = ($validated['topology_mode'] === 'bridged_dedicated_port' && !empty($validated['router_bridge_port']))
            ? 'reliable'
            : 'unavailable';

        $ap = AccessPoint::create($validated);

        // Run initial check
        $this->healthService->check($ap);

        return redirect()->route('access-points.index')->with('success', "Access Point '{$ap->name}' added.");
    }

    public function update(Request $request, AccessPoint $accessPoint): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'location' => ['nullable', 'string', 'max:100'],
            'management_ip' => ['required', 'ip'],
            'health_check_type' => ['required', 'string', 'in:icmp,http,https,tcp'],
            'health_check_url' => ['nullable', 'string', 'max:255'],
            'health_check_port' => ['nullable', 'integer'],
            'check_interval_seconds' => ['required', 'integer', 'min:10', 'max:3600'],
            'timeout_ms' => ['required', 'integer', 'min:500', 'max:10000'],
            'failure_threshold' => ['required', 'integer', 'min:1', 'max:10'],
            'topology_mode' => ['required', 'string', 'in:bridged_dedicated_port,bridged_shared_uplink,router_nat,unknown'],
            'management_router_id' => ['nullable', 'exists:router_connections,id'],
            'router_bridge_name' => ['nullable', 'string', 'max:50'],
            'router_bridge_port' => ['nullable', 'string', 'max:50'],
            'notes' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
        ]);

        $validated['client_mapping_capability'] = ($validated['topology_mode'] === 'bridged_dedicated_port' && !empty($validated['router_bridge_port']))
            ? 'reliable'
            : 'unavailable';

        $accessPoint->update($validated);

        return redirect()->route('access-points.index')->with('success', "Access Point '{$accessPoint->name}' updated.");
    }

    public function destroy(AccessPoint $accessPoint): RedirectResponse
    {
        $name = $accessPoint->name;
        $accessPoint->delete();

        return redirect()->route('access-points.index')->with('success', "Access Point '{$name}' deleted.");
    }

    public function checkNow(AccessPoint $accessPoint): RedirectResponse
    {
        $check = $this->healthService->check($accessPoint);

        $msg = "Checked {$accessPoint->name}: {$check->status}";
        if ($check->response_ms) {
            $msg .= " ({$check->response_ms}ms)";
        }

        return back()->with('success', $msg);
    }
}
