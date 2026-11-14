<?php

namespace App\Http\Controllers;

use App\Models\HotspotProfile;
use App\Models\RouterConnection;
use App\Services\HotspotProfileService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HotspotProfileController extends Controller
{
    public function __construct(
        protected HotspotProfileService $profileService
    ) {}

    public function index(Request $request): Response
    {
        $routers = RouterConnection::where('is_active', true)->get();
        $selectedRouterId = $request->get('router_id', $routers->first()?->id);

        $profiles = HotspotProfile::when($selectedRouterId, fn ($q) => $q->where('router_connection_id', $selectedRouterId))
            ->with('routerConnection')
            ->orderBy('name')
            ->get();

        return Inertia::render('hotspot/profiles', [
            'routers' => $routers,
            'selectedRouterId' => (int)$selectedRouterId,
            'profiles' => $profiles,
        ]);
    }

    public function sync(RouterConnection $router): RedirectResponse
    {
        try {
            $synced = $this->profileService->syncProfiles($router);
            return back()->with('success', "Synced {$synced->count()} Hotspot profiles from {$router->name}.");
        } catch (\Throwable $e) {
            return back()->with('error', "Failed to sync profiles: " . $e->getMessage());
        }
    }
}
