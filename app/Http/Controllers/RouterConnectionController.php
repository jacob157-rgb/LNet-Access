<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\RouterConnection;
use App\Services\RouterConnectionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RouterConnectionController extends Controller
{
    public function __construct(
        protected RouterConnectionService $connectionService
    ) {}

    public function index(): Response
    {
        $routers = RouterConnection::latest()->get();

        return Inertia::render('routers/index', [
            'routers' => $routers,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'host' => ['required', 'string'],
            'port' => ['required', 'integer'],
            'transport' => ['required', 'string', 'in:api_ssl,api,rest'],
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
            'tls_verify' => ['boolean'],
        ]);

        $router = RouterConnection::create([
            'name' => $validated['name'],
            'host' => $validated['host'],
            'port' => $validated['port'],
            'transport' => $validated['transport'],
            'username' => $validated['username'],
            'password_encrypted' => $validated['password'],
            'tls_verify' => $validated['tls_verify'] ?? false,
        ]);

        AuditLog::log('create', 'router_connection', $router->id, $router->id, null, [
            'name' => $router->name,
            'host' => $router->host,
            'transport' => $router->transport,
        ]);

        // Attempt initial health sync
        $this->connectionService->syncHealth($router);

        return redirect()->route('routers.index')->with('success', "Router '{$router->name}' added successfully.");
    }

    public function update(Request $request, RouterConnection $router): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'host' => ['required', 'string'],
            'port' => ['required', 'integer'],
            'transport' => ['required', 'string', 'in:api_ssl,api,rest'],
            'username' => ['required', 'string'],
            'password' => ['nullable', 'string'],
            'tls_verify' => ['boolean'],
            'is_active' => ['boolean'],
        ]);

        $updateData = [
            'name' => $validated['name'],
            'host' => $validated['host'],
            'port' => $validated['port'],
            'transport' => $validated['transport'],
            'username' => $validated['username'],
            'tls_verify' => $validated['tls_verify'] ?? false,
            'is_active' => $validated['is_active'] ?? true,
        ];

        if (!empty($validated['password'])) {
            $updateData['password_encrypted'] = $validated['password'];
        }

        $router->update($updateData);

        return redirect()->route('routers.index')->with('success', "Router '{$router->name}' updated.");
    }

    public function destroy(RouterConnection $router): RedirectResponse
    {
        $name = $router->name;
        $router->delete();

        return redirect()->route('routers.index')->with('success', "Router '{$name}' deleted.");
    }

    public function test(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'host' => ['required', 'string'],
            'port' => ['required', 'integer'],
            'transport' => ['required', 'string', 'in:api_ssl,api,rest'],
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
            'tls_verify' => ['boolean'],
        ]);

        $result = $this->connectionService->testConnection([
            'name' => 'Test',
            'host' => $validated['host'],
            'port' => $validated['port'],
            'transport' => $validated['transport'],
            'username' => $validated['username'],
            'password_encrypted' => $validated['password'],
            'tls_verify' => $validated['tls_verify'] ?? false,
        ]);

        return response()->json($result);
    }

    public function sync(RouterConnection $router): RedirectResponse
    {
        $this->connectionService->syncHealth($router);

        return back()->with('success', "Router '{$router->name}' status updated.");
    }

    public function activate(Request $request, RouterConnection $router): RedirectResponse
    {
        $request->session()->put('active_router_id', $router->id);

        return back()->with('success', "Active router switched to '{$router->name}'.");
    }
}
