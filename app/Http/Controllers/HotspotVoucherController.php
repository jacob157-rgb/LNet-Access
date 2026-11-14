<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\HotspotProfile;
use App\Models\RouterConnection;
use App\Models\Voucher;
use App\Models\VoucherBatch;
use App\Services\HotspotProfileService;
use App\Services\VoucherProvisioningService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HotspotVoucherController extends Controller
{
    public function __construct(
        protected VoucherProvisioningService $voucherService,
        protected HotspotProfileService $profileService
    ) {}

    public function index(Request $request): Response
    {
        $routers = RouterConnection::where('is_active', true)->get();
        $selectedRouterId = $request->get('router_id', $routers->first()?->id);

        $query = Voucher::when($selectedRouterId, fn ($q) => $q->where('router_connection_id', $selectedRouterId))
            ->with(['hotspotProfile', 'batch', 'routerConnection']);

        if ($search = $request->get('search')) {
            $query->where('username', 'like', "%{$search}%");
        }

        if ($status = $request->get('status')) {
            $query->where('commercial_status', $status);
        }

        if ($profileId = $request->get('profile_id')) {
            $query->where('hotspot_profile_id', $profileId);
        }

        $vouchers = $query->latest()->paginate(25)->withQueryString();

        $profiles = HotspotProfile::when($selectedRouterId, fn ($q) => $q->where('router_connection_id', $selectedRouterId))
            ->where('is_present', true)
            ->get();

        return Inertia::render('hotspot/vouchers', [
            'routers' => $routers,
            'selectedRouterId' => (int)$selectedRouterId,
            'vouchers' => $vouchers,
            'profiles' => $profiles,
            'filters' => $request->only(['search', 'status', 'profile_id']),
        ]);
    }

    public function create(Request $request): Response
    {
        $routers = RouterConnection::where('is_active', true)->get();
        $selectedRouterId = $request->get('router_id', $routers->first()?->id);

        $profiles = HotspotProfile::when($selectedRouterId, fn ($q) => $q->where('router_connection_id', $selectedRouterId))
            ->where('is_present', true)
            ->get();

        return Inertia::render('hotspot/create-vouchers', [
            'routers' => $routers,
            'selectedRouterId' => (int)$selectedRouterId,
            'profiles' => $profiles,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'router_id' => ['required', 'exists:router_connections,id'],
            'profile_id' => ['required', 'exists:hotspot_profiles,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:500'],
            'length' => ['required', 'integer', 'min:4', 'max:12'],
            'charset' => ['required', 'string'],
            'prefix' => ['nullable', 'string', 'max:6'],
            'user_equals_password' => ['boolean'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $router = RouterConnection::findOrFail($validated['router_id']);
        $profile = HotspotProfile::findOrFail($validated['profile_id']);

        try {
            $batch = $this->voucherService->createBatch(
                $router,
                $profile,
                (int)$validated['quantity'],
                [
                    'length' => (int)$validated['length'],
                    'charset' => $validated['charset'],
                    'prefix' => $validated['prefix'] ?? '',
                    'user_equals_password' => $validated['user_equals_password'] ?? true,
                    'price' => (float)($validated['price'] ?? 0),
                    'notes' => $validated['notes'] ?? null,
                ],
                auth()->id()
            );

            return redirect()->route('hotspot.batches.show', $batch->id)
                ->with('success', "Batch {$batch->batch_code} generated ({$batch->quantity_created}/{$batch->quantity_requested} ready).");
        } catch (\Throwable $e) {
            return back()->with('error', "Voucher creation failed: " . $e->getMessage());
        }
    }

    public function show(Voucher $voucher): JsonResponse
    {
        // Reveal credential modal - logged to audit
        AuditLog::log('reveal_credential', 'voucher', $voucher->id, $voucher->router_connection_id, null, [
            'username' => $voucher->username,
        ]);

        return response()->json([
            'id' => $voucher->id,
            'uuid' => $voucher->uuid,
            'username' => $voucher->username,
            'password' => $voucher->password_encrypted,
            'profile_name' => $voucher->hotspotProfile?->name,
            'price' => (float)$voucher->price_snapshot,
            'status' => $voucher->commercial_status,
            'generated_at' => $voucher->generated_at?->format('d/m/Y H:i'),
            'router_comment' => $voucher->router_comment_marker,
        ]);
    }

    public function batches(Request $request): Response
    {
        $routers = RouterConnection::where('is_active', true)->get();
        $selectedRouterId = $request->get('router_id', $routers->first()?->id);

        $batches = VoucherBatch::when($selectedRouterId, fn ($q) => $q->where('router_connection_id', $selectedRouterId))
            ->with(['hotspotProfile', 'routerConnection', 'creator'])
            ->withCount([
                'vouchers',
                'vouchers as unused_count' => fn ($q) => $q->where('commercial_status', '!=', 'sold'),
                'vouchers as sold_count' => fn ($q) => $q->where('commercial_status', 'sold'),
            ])
            ->latest()
            ->paginate(20);

        return Inertia::render('hotspot/batches', [
            'routers' => $routers,
            'selectedRouterId' => (int)$selectedRouterId,
            'batches' => $batches,
        ]);
    }

    public function batch(VoucherBatch $batch): Response
    {
        $batch->load(['hotspotProfile', 'routerConnection', 'creator']);
        $batch->loadCount([
            'vouchers',
            'vouchers as unused_count' => fn ($q) => $q->where('commercial_status', '!=', 'sold'),
            'vouchers as sold_count' => fn ($q) => $q->where('commercial_status', 'sold'),
        ]);
        $vouchers = Voucher::where('batch_id', $batch->id)->paginate(50);

        return Inertia::render('hotspot/batch-detail', [
            'batch' => $batch,
            'vouchers' => $vouchers,
        ]);
    }

    public function retryBatch(VoucherBatch $batch): RedirectResponse
    {
        try {
            $this->voucherService->retryBatch($batch);
            return back()->with('success', "Batch {$batch->batch_code} retry finished ({$batch->fresh()->quantity_created}/{$batch->quantity_requested} ready).");
        } catch (\Throwable $e) {
            return back()->with('error', "Retry failed: " . $e->getMessage());
        }
    }

    public function destroyBatch(Request $request, VoucherBatch $batch): RedirectResponse
    {
        $deleteSold = $request->boolean('delete_sold', false);

        try {
            $batchCode = $batch->batch_code;
            $result = $this->voucherService->deleteBatch($batch, $deleteSold);

            if ($result['batch_deleted']) {
                $msg = "Batch {$batchCode} berhasil dihapus. {$result['vouchers_deleted']} voucher telah dihanguskan dari MikroTik & database.";
                return redirect()->route('hotspot.batches')->with('success', $msg);
            } else {
                $msg = "{$result['vouchers_deleted']} voucher belum terpakai pada batch {$batchCode} berhasil dihanguskan dari MikroTik. {$result['vouchers_remaining']} voucher terjual tetap disimpan.";
                return back()->with('success', $msg);
            }
        } catch (\Throwable $e) {
            return back()->with('error', "Gagal menghapus batch: " . $e->getMessage());
        }
    }

    public function destroyAllBatches(Request $request): RedirectResponse
    {
        $routerId = $request->input('router_id');
        $deleteSold = $request->boolean('delete_sold', false);

        $query = VoucherBatch::query();
        if ($routerId) {
            $query->where('router_connection_id', $routerId);
        }

        $batches = $query->with('vouchers')->get();
        $totalDeleted = 0;
        $batchesDeleted = 0;

        foreach ($batches as $batch) {
            $result = $this->voucherService->deleteBatch($batch, $deleteSold);
            $totalDeleted += $result['vouchers_deleted'];
            if ($result['batch_deleted']) {
                $batchesDeleted++;
            }
        }

        return redirect()->route('hotspot.batches')
            ->with('success', "Berhasil menghanguskan {$totalDeleted} voucher dari {$batchesDeleted} batch pada MikroTik & database.");
    }

    public function destroyVoucher(Voucher $voucher): RedirectResponse
    {
        try {
            $username = $voucher->username;
            $this->voucherService->deleteVoucher($voucher);
            return back()->with('success', "Voucher {$username} berhasil dihanguskan dan dihapus dari MikroTik.");
        } catch (\Throwable $e) {
            return back()->with('error', "Gagal menghapus voucher: " . $e->getMessage());
        }
    }
}
