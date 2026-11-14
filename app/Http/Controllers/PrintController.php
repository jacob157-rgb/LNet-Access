<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Sale;
use App\Models\Voucher;
use App\Models\VoucherBatch;
use App\Services\PrintService;
use App\Services\SalesService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PrintController extends Controller
{
    public function __construct(
        protected PrintService $printService,
        protected SalesService $salesService
    ) {}

    public function voucherTicket(Voucher $voucher): Response
    {
        $ticketData = $this->printService->formatVoucherTicket($voucher);

        AuditLog::log('print_voucher', 'voucher', $voucher->id, $voucher->router_connection_id, null, [
            'username' => $voucher->username,
        ]);

        return Inertia::render('print/voucher-ticket', [
            'voucher' => $ticketData,
        ]);
    }

    public function batchSheet(Request $request, VoucherBatch $batch): Response
    {
        $options = [
            'brand_name' => $request->get('brand_name'),
            'dns_host' => $request->get('dns_host'),
        ];
        $batchData = $this->printService->formatBatchSheet($batch, $options);

        AuditLog::log('print_batch', 'voucher_batch', $batch->id, $batch->router_connection_id, null, [
            'batch_code' => $batch->batch_code,
            'count' => $batchData['total_count'],
        ]);

        return Inertia::render('print/batch-sheet', [
            'batch' => $batchData,
        ]);
    }

    public function saleReceipt(Sale $sale): Response
    {
        $this->salesService->recordReprint($sale);
        $receiptData = $this->printService->formatSaleReceipt($sale);

        return Inertia::render('print/sale-receipt', [
            'receipt' => $receiptData,
            'saleId' => $sale->id,
        ]);
    }
}
