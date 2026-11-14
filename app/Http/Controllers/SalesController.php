<?php

namespace App\Http\Controllers;

use App\Models\HotspotProfile;
use App\Models\Member;
use App\Models\RouterConnection;
use App\Models\Sale;
use App\Models\Voucher;
use App\Services\SalesService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SalesController extends Controller
{
    public function __construct(
        protected SalesService $salesService
    ) {}

    public function index(Request $request): Response
    {
        $query = Sale::with(['cashier', 'member', 'items'])->latest();

        if ($search = $request->get('search')) {
            $query->where('receipt_number', 'like', "%{$search}%");
        }

        if ($status = $request->get('status')) {
            $query->where('payment_status', $status);
        }

        $sales = $query->paginate(20)->withQueryString();

        $stats = [
            'today_total' => (float)Sale::whereDate('created_at', today())->where('payment_status', 'paid')->sum('grand_total'),
            'today_count' => Sale::whereDate('created_at', today())->where('payment_status', 'paid')->count(),
        ];

        return Inertia::render('sales/index', [
            'sales' => $sales,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create(Request $request): Response
    {
        $routers = RouterConnection::where('is_active', true)->get();
        $selectedRouterId = $request->get('router_id', $routers->first()?->id);

        // Profiles with available ready voucher count
        $profiles = HotspotProfile::when($selectedRouterId, fn ($q) => $q->where('router_connection_id', $selectedRouterId))
            ->where('is_present', true)
            ->get()
            ->map(function ($p) {
                $readyCount = Voucher::where('hotspot_profile_id', $p->id)
                    ->where('commercial_status', 'ready')
                    ->count();

                $latestVoucher = Voucher::where('hotspot_profile_id', $p->id)->latest()->first();

                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'rate_limit' => $p->rate_limit,
                    'ready_count' => $readyCount,
                    'default_price' => (float)($latestVoucher?->price_snapshot ?? 5000),
                ];
            });

        $members = Member::where('status', 'active')->orderBy('name')->take(50)->get();

        return Inertia::render('sales/cashier', [
            'routers' => $routers,
            'selectedRouterId' => (int)$selectedRouterId,
            'profiles' => $profiles,
            'members' => $members,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'profile_id' => ['required', 'exists:hotspot_profiles,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:50'],
            'payment_method' => ['required', 'string', 'in:cash,transfer,qris,manual'],
            'payment_status' => ['required', 'string', 'in:paid,pending'],
            'discount' => ['nullable', 'numeric', 'min:0'],
            'member_id' => ['nullable', 'exists:members,id'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        // Find requested number of ready vouchers for this profile
        $vouchers = Voucher::where('hotspot_profile_id', $validated['profile_id'])
            ->where('commercial_status', 'ready')
            ->take((int)$validated['quantity'])
            ->get();

        if ($vouchers->count() < (int)$validated['quantity']) {
            return back()->with('error', "Not enough ready vouchers available in stock (available: {$vouchers->count()}).");
        }

        try {
            $sale = $this->salesService->createSale(
                $vouchers->pluck('id')->toArray(),
                [
                    'cashier_id' => auth()->id(),
                    'member_id' => $validated['member_id'] ?? null,
                    'payment_method' => $validated['payment_method'],
                    'payment_status' => $validated['payment_status'],
                    'discount' => (float)($validated['discount'] ?? 0),
                    'notes' => $validated['notes'] ?? null,
                ]
            );

            return redirect()->route('print.sale', $sale->id)
                ->with('success', "Sale {$sale->receipt_number} completed!");
        } catch (\Throwable $e) {
            return back()->with('error', "Sale failed: " . $e->getMessage());
        }
    }

    public function show(Sale $sale): Response
    {
        $sale->load(['items', 'vouchers.hotspotProfile', 'member', 'cashier']);

        return Inertia::render('sales/show', [
            'sale' => $sale,
        ]);
    }

    public function voidSale(Request $request, Sale $sale): RedirectResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:255'],
            'release_vouchers' => ['boolean'],
        ]);

        try {
            $this->salesService->voidSale(
                $sale,
                $validated['reason'],
                $validated['release_vouchers'] ?? true
            );

            return back()->with('success', "Sale {$sale->receipt_number} voided.");
        } catch (\Throwable $e) {
            return back()->with('error', "Void failed: " . $e->getMessage());
        }
    }
}
