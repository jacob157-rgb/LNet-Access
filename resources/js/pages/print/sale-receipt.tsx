import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';

interface Props {
    receipt: {
        receipt_number: string;
        date: string;
        cashier_name: string;
        member_name: string;
        payment_method: string;
        payment_status: string;
        subtotal: number;
        discount: number;
        grand_total: number;
        items: Array<{
            description: string;
            quantity: number;
            unit_price: number;
            line_total: number;
        }>;
        vouchers: Array<{
            username: string;
            password: string;
            profile: string;
        }>;
        qr_svg: string;
        reprint_count: number;
    };
    saleId: number;
}

export default function SaleReceipt({ receipt }: Props) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-neutral-100 flex flex-col items-center p-4 print:p-0 print:bg-white text-black font-mono">
            <Head title={`Receipt ${receipt.receipt_number}`} />

            {/* Controls */}
            <div className="mb-4 flex items-center gap-2 print:hidden">
                <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 h-8 px-4 rounded bg-neutral-900 text-white font-sans text-xs font-medium hover:bg-neutral-800 shadow-sm"
                >
                    <Printer className="size-3.5" />
                    Print Receipt (58mm)
                </button>
            </div>

            {/* 58mm Thermal Container */}
            <div className="w-[58mm] bg-white border border-dashed border-neutral-300 print:border-none p-3 flex flex-col text-xs leading-tight">
                <div className="text-center font-bold text-sm tracking-wider">L-NET ACCESS</div>
                <div className="text-center text-[10px] text-neutral-600">Hotspot & Internet Management</div>
                {receipt.reprint_count > 1 && (
                    <div className="text-center text-[9px] text-neutral-500 font-bold mt-0.5">
                        [REPRINT #{receipt.reprint_count}]
                    </div>
                )}

                <div className="w-full border-t border-dashed my-2 border-neutral-400" />

                <div className="flex justify-between text-[10px]">
                    <span>No: {receipt.receipt_number}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                    <span>Tgl: {receipt.date}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                    <span>Kasir: {receipt.cashier_name}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                    <span>Plggn: {receipt.member_name}</span>
                </div>

                <div className="w-full border-t border-dashed my-2 border-neutral-400" />

                {/* Items */}
                <div className="flex flex-col gap-1 text-[11px]">
                    {receipt.items.map((it, idx) => (
                        <div key={idx}>
                            <div>{it.description}</div>
                            <div className="flex justify-between text-[10px] text-neutral-600">
                                <span>{it.quantity} x {it.unit_price.toLocaleString('id-ID')}</span>
                                <span>{it.line_total.toLocaleString('id-ID')}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="w-full border-t border-dashed my-2 border-neutral-400" />

                {/* Totals */}
                <div className="flex justify-between text-[11px]">
                    <span>Subtotal:</span>
                    <span>Rp {receipt.subtotal.toLocaleString('id-ID')}</span>
                </div>
                {receipt.discount > 0 && (
                    <div className="flex justify-between text-[11px]">
                        <span>Diskon:</span>
                        <span>-Rp {receipt.discount.toLocaleString('id-ID')}</span>
                    </div>
                )}
                <div className="flex justify-between font-bold text-xs mt-1">
                    <span>Total:</span>
                    <span>Rp {receipt.grand_total.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-[10px] mt-1">
                    <span>Bayar:</span>
                    <span>{receipt.payment_method} ({receipt.payment_status})</span>
                </div>

                {/* Issued Vouchers Credential Box */}
                {receipt.vouchers.length > 0 && (
                    <>
                        <div className="w-full border-t border-dashed my-2 border-neutral-400" />
                        <div className="text-[10px] font-bold text-center uppercase">Voucher Diterbitkan</div>
                        <div className="flex flex-col gap-1.5 mt-1">
                            {receipt.vouchers.map((v, idx) => (
                                <div key={idx} className="border border-neutral-300 p-1.5 text-center bg-neutral-50 print:bg-transparent">
                                    <div className="text-[9px] text-neutral-500 uppercase">{v.profile}</div>
                                    <div className="font-bold text-xs mt-0.5">Kode: {v.username}</div>
                                    {v.username !== v.password && (
                                        <div className="text-[10px]">Pass: {v.password}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <div className="w-full border-t border-dashed my-2 border-neutral-400" />
                <div className="text-center text-[10px] text-neutral-600">Terima kasih atas kunjungan Anda</div>
                <div className="text-center text-[9px] text-neutral-400 mt-1">http://192.168.10.1</div>
            </div>

            <style>{`
                @media print {
                    @page {
                        size: 58mm auto;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                    }
                }
            `}</style>
        </div>
    );
}
