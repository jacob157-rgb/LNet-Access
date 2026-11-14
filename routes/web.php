<?php

use App\Http\Controllers\AccessPointController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HotspotProfileController;
use App\Http\Controllers\HotspotSessionController;
use App\Http\Controllers\HotspotVoucherController;
use App\Http\Controllers\HotspotIpBindingController;
use App\Http\Controllers\MemberController;
use App\Http\Controllers\PortalController;
use App\Http\Controllers\PppoeController;
use App\Http\Controllers\PrintController;
use App\Http\Controllers\ReconciliationController;
use App\Http\Controllers\RouterConnectionController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\Teams\TeamInvitationController;
use App\Http\Middleware\EnsureTeamMembership;
use Illuminate\Support\Facades\Route;

// Public portal routes
Route::get('portal', [PortalController::class, 'index'])->name('portal.index');
Route::get('portal/voucher/{uuid}', [PortalController::class, 'showVoucher'])->name('portal.voucher');
Route::get('portal/qr/{token}', [PortalController::class, 'redeemQr'])->name('portal.redeem');

// Dedicated printable views
Route::middleware(['auth'])->group(function () {
    Route::get('print/voucher/{voucher}', [PrintController::class, 'voucherTicket'])->name('print.voucher');
    Route::get('print/vouchers/{batch}', [PrintController::class, 'batchSheet'])->name('print.batch');
    Route::get('print/sales/{sale}', [PrintController::class, 'saleReceipt'])->name('print.sale');
});

// Root route
Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('portal.index');
})->name('home');

// Authenticated application routes
Route::middleware(['auth'])->group(function () {
    // Dashboard
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    // Routers
    Route::get('routers', [RouterConnectionController::class, 'index'])->name('routers.index');
    Route::post('routers', [RouterConnectionController::class, 'store'])->name('routers.store');
    Route::put('routers/{router}', [RouterConnectionController::class, 'update'])->name('routers.update');
    Route::delete('routers/{router}', [RouterConnectionController::class, 'destroy'])->name('routers.destroy');
    Route::post('routers/test', [RouterConnectionController::class, 'test'])->name('routers.test');
    Route::post('routers/{router}/sync', [RouterConnectionController::class, 'sync'])->name('routers.sync');
    Route::post('routers/{router}/activate', [RouterConnectionController::class, 'activate'])->name('routers.activate');

    // Hotspot
    Route::get('hotspot/profiles', [HotspotProfileController::class, 'index'])->name('hotspot.profiles');
    Route::post('hotspot/profiles/{router}/sync', [HotspotProfileController::class, 'sync'])->name('hotspot.profiles.sync');

    Route::get('hotspot/vouchers', [HotspotVoucherController::class, 'index'])->name('hotspot.vouchers');
    Route::get('hotspot/vouchers/create', [HotspotVoucherController::class, 'create'])->name('hotspot.vouchers.create');
    Route::post('hotspot/vouchers', [HotspotVoucherController::class, 'store'])->name('hotspot.vouchers.store');
    Route::get('hotspot/vouchers/{voucher}', [HotspotVoucherController::class, 'show'])->name('hotspot.vouchers.show');
    Route::delete('hotspot/vouchers/{voucher}', [HotspotVoucherController::class, 'destroyVoucher'])->name('hotspot.vouchers.destroy');

    Route::get('hotspot/batches', [HotspotVoucherController::class, 'batches'])->name('hotspot.batches');
    Route::delete('hotspot/batches', [HotspotVoucherController::class, 'destroyAllBatches'])->name('hotspot.batches.destroy-all');
    Route::get('hotspot/batches/{batch}', [HotspotVoucherController::class, 'batch'])->name('hotspot.batches.show');
    Route::post('hotspot/batches/{batch}/retry', [HotspotVoucherController::class, 'retryBatch'])->name('hotspot.batches.retry');
    Route::delete('hotspot/batches/{batch}', [HotspotVoucherController::class, 'destroyBatch'])->name('hotspot.batches.destroy');

    Route::get('hotspot/sessions', [HotspotSessionController::class, 'index'])->name('hotspot.sessions');
    Route::delete('hotspot/sessions/{session}', [HotspotSessionController::class, 'disconnect'])->name('hotspot.sessions.disconnect');

    Route::get('hotspot/ip-bindings', [HotspotIpBindingController::class, 'index'])->name('hotspot.ip-bindings');
    Route::post('hotspot/ip-bindings', [HotspotIpBindingController::class, 'store'])->name('hotspot.ip-bindings.store');
    Route::delete('hotspot/ip-bindings/{id}', [HotspotIpBindingController::class, 'destroy'])->name('hotspot.ip-bindings.destroy');
    Route::patch('hotspot/ip-bindings/{id}/toggle', [HotspotIpBindingController::class, 'toggle'])->name('hotspot.ip-bindings.toggle');

    // Sales
    Route::get('sales', [SalesController::class, 'index'])->name('sales.index');
    Route::get('sales/create', [SalesController::class, 'create'])->name('sales.create');
    Route::post('sales', [SalesController::class, 'store'])->name('sales.store');
    Route::get('sales/{sale}', [SalesController::class, 'show'])->name('sales.show');
    Route::post('sales/{sale}/void', [SalesController::class, 'voidSale'])->name('sales.void');

    // Members
    Route::get('members', [MemberController::class, 'index'])->name('members.index');
    Route::post('members', [MemberController::class, 'store'])->name('members.store');
    Route::get('members/{member}', [MemberController::class, 'show'])->name('members.show');
    Route::put('members/{member}', [MemberController::class, 'update'])->name('members.update');
    Route::post('members/{member}/accounts', [MemberController::class, 'attachAccount'])->name('members.accounts.attach');
    Route::post('members/accounts/{account}/password', [MemberController::class, 'resetPassword'])->name('members.accounts.password');
    Route::post('members/accounts/{account}/toggle', [MemberController::class, 'toggleAccount'])->name('members.accounts.toggle');

    // PPPoE
    Route::get('pppoe', [PppoeController::class, 'index'])->name('pppoe.index');
    Route::post('pppoe', [PppoeController::class, 'store'])->name('pppoe.store');
    Route::delete('pppoe/accounts/{account}', [PppoeController::class, 'destroy'])->name('pppoe.destroy');
    Route::patch('pppoe/accounts/{account}/toggle', [PppoeController::class, 'toggle'])->name('pppoe.toggle');
    Route::delete('pppoe/sessions/{session}', [PppoeController::class, 'disconnect'])->name('pppoe.sessions.disconnect');
    Route::post('pppoe/{router}/sync', [PppoeController::class, 'sync'])->name('pppoe.sync');

    // Access Points
    Route::get('access-points', [AccessPointController::class, 'index'])->name('access-points.index');
    Route::post('access-points', [AccessPointController::class, 'store'])->name('access-points.store');
    Route::put('access-points/{accessPoint}', [AccessPointController::class, 'update'])->name('access-points.update');
    Route::delete('access-points/{accessPoint}', [AccessPointController::class, 'destroy'])->name('access-points.destroy');
    Route::post('access-points/{accessPoint}/check', [AccessPointController::class, 'checkNow'])->name('access-points.check');

    // Reconciliation
    Route::get('reconciliation', [ReconciliationController::class, 'index'])->name('reconciliation.index');
    Route::post('reconciliation/{router}/run', [ReconciliationController::class, 'run'])->name('reconciliation.run');
    Route::post('reconciliation/{issue}/repair', [ReconciliationController::class, 'repair'])->name('reconciliation.repair');

    // Audit Logs
    Route::get('audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');

    // Existing team invitations
    Route::post('invitations/{invitation}/accept', [TeamInvitationController::class, 'accept'])->name('invitations.accept');
    Route::delete('invitations/{invitation}', [TeamInvitationController::class, 'decline'])->name('invitations.decline');
});

// Backward compatibility for team prefix dashboard if requested
Route::prefix('{current_team}')
    ->middleware(['auth'])
    ->group(function () {
        Route::get('dashboard', fn () => redirect()->route('dashboard'));
    });

require __DIR__.'/settings.php';
