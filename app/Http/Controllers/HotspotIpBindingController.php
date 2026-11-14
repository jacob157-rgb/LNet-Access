<?php

namespace App\Http\Controllers;

use App\Models\RouterConnection;
use App\Services\RouterOsReadService;
use App\Services\RouterOsWriteService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HotspotIpBindingController extends Controller
{
    public function __construct(
        protected RouterOsReadService $readService,
        protected RouterOsWriteService $writeService
    ) {}

    public function index(Request $request): Response
    {
        $routers = RouterConnection::where('is_active', true)->get();
        $selectedRouterId = $request->get('router_id', $routers->first()?->id);
        $selectedRouter = $routers->firstWhere('id', $selectedRouterId);

        $bindings = [];
        $error = null;

        if ($selectedRouter) {
            try {
                $raw = $this->readService->getHotspotIpBindings($selectedRouter);
                
                // Format & sort
                $bindings = collect($raw)->map(function ($b) {
                    return [
                        'id' => $b['.id'] ?? '',
                        'mac_address' => $b['mac-address'] ?? '',
                        'address' => $b['address'] ?? null,
                        'to_address' => $b['to-address'] ?? null,
                        'server' => $b['server'] ?? 'all',
                        'type' => $b['type'] ?? 'regular',
                        'disabled' => ($b['disabled'] ?? 'false') === 'true',
                        'comment' => $b['comment'] ?? null,
                    ];
                });

                // Apply search filter
                if ($search = $request->get('search')) {
                    $search = strtolower($search);
                    $bindings = $bindings->filter(function ($b) use ($search) {
                        return str_contains(strtolower($b['mac_address']), $search) ||
                               str_contains(strtolower($b['address'] ?? ''), $search) ||
                               str_contains(strtolower($b['comment'] ?? ''), $search);
                    });
                }

                // Apply type filter
                if ($type = $request->get('type')) {
                    $bindings = $bindings->filter(fn ($b) => $b['type'] === $type);
                }

                $bindings = $bindings->values()->all();
            } catch (\Throwable $e) {
                $error = "Gagal membaca IP Binding dari router: " . $e->getMessage();
            }
        }

        return Inertia::render('hotspot/ip-bindings', [
            'routers' => $routers,
            'selectedRouterId' => (int)$selectedRouterId,
            'bindings' => $bindings,
            'filters' => $request->only(['search', 'type']),
            'routerError' => $error,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'router_id' => ['required', 'exists:router_connections,id'],
            'mac_address' => ['required', 'string', 'regex:/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/'],
            'address' => ['nullable', 'ip'],
            'to_address' => ['nullable', 'ip'],
            'type' => ['required', 'in:bypassed,regular,blocked'],
            'server' => ['nullable', 'string'],
            'comment' => ['nullable', 'string', 'max:100'],
        ]);

        $router = RouterConnection::findOrFail($validated['router_id']);

        try {
            $this->writeService->createHotspotIpBinding($router, $validated);
            return back()->with('success', "IP Binding untuk MAC '{$validated['mac_address']}' berhasil ditambahkan ke MikroTik.");
        } catch (\Throwable $e) {
            return back()->with('error', "Gagal menambah IP Binding: " . $e->getMessage());
        }
    }

    public function destroy(Request $request, string $id): RedirectResponse
    {
        $routerId = $request->input('router_id');
        $router = RouterConnection::findOrFail($routerId);

        try {
            $mac = $request->input('mac_address');
            $this->writeService->removeHotspotIpBinding($router, $id, $mac);
            return back()->with('success', "IP Binding '{$mac}' berhasil dihapus dari MikroTik.");
        } catch (\Throwable $e) {
            return back()->with('error', "Gagal menghapus IP Binding: " . $e->getMessage());
        }
    }

    public function toggle(Request $request, string $id): RedirectResponse
    {
        $routerId = $request->input('router_id');
        $router = RouterConnection::findOrFail($routerId);
        $disabled = $request->boolean('disabled');

        try {
            $this->writeService->setHotspotIpBindingDisabled($router, $id, $disabled);
            $status = $disabled ? 'dinonaktifkan' : 'diaktifkan';
            return back()->with('success', "IP Binding berhasil {$status}.");
        } catch (\Throwable $e) {
            return back()->with('error', "Gagal mengubah status IP Binding: " . $e->getMessage());
        }
    }
}
