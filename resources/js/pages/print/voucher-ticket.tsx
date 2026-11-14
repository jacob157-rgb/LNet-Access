import { Head } from '@inertiajs/react';
import { Printer } from 'lucide-react';
import { useEffect } from 'react';

interface Props {
    voucher: {
        id: number;
        uuid: string;
        username: string;
        password: string;
        profile_name: string;
        rate_limit: string;
        price: number;
        currency: string;
        batch_code: string;
        generated_at: string;
        qr_svg: string;
        login_url: string;
    };
}

export default function VoucherTicket({ voucher }: Props) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-neutral-100 flex flex-col items-center p-4 print:p-0 print:bg-white text-black font-mono">
            <Head title={`Ticket ${voucher.username}`} />

            {/* Print Controls (Hidden on Print) */}
            <div className="mb-4 flex items-center gap-2 print:hidden">
                <button
                    onClick={handlePrint}
                    className="inline-flex items-center gap-1.5 h-8 px-4 rounded bg-neutral-900 text-white font-sans text-xs font-medium hover:bg-neutral-800 shadow-sm"
                >
                    <Printer className="size-3.5" />
                    Print 58mm Ticket
                </button>
            </div>

            {/* 58mm Ticket Container (width ~ 58mm is 220px at 96dpi or 58mm in print) */}
            <div className="w-[58mm] bg-white border border-dashed border-neutral-300 print:border-none p-3 flex flex-col items-center text-center text-xs leading-tight">
                {/* Header / Brand */}
                <div className="font-bold text-sm tracking-wider uppercase">L-NET HOTSPOT</div>
                <div className="text-[10px] text-neutral-600 mt-0.5">Internet Voucher Ticket</div>
                <div className="w-full border-t border-dashed my-2 border-neutral-400" />

                {/* Profile & Speed */}
                <div className="font-bold text-xs uppercase">{voucher.profile_name}</div>
                {voucher.rate_limit !== '-' && (
                    <div className="text-[10px] text-neutral-600 mt-0.5">Speed: {voucher.rate_limit}</div>
                )}

                {/* QR Code */}
                <div
                    className="my-2 p-1 border border-neutral-200"
                    dangerouslySetInnerHTML={{ __html: voucher.qr_svg }}
                />

                {/* Credentials */}
                <div className="w-full bg-neutral-50 print:bg-transparent border border-neutral-200 p-2 my-1 text-left">
                    <div className="text-[10px] uppercase text-neutral-500">Username / Kode:</div>
                    <div className="font-bold text-sm select-all tracking-wider">{voucher.username}</div>

                    <div className="text-[10px] uppercase text-neutral-500 mt-1">Password:</div>
                    <div className="font-bold text-sm select-all tracking-wider">{voucher.password}</div>
                </div>

                {/* Price & Footer */}
                <div className="w-full flex justify-between text-[11px] font-bold mt-1">
                    <span>Harga:</span>
                    <span>Rp {voucher.price.toLocaleString('id-ID')}</span>
                </div>

                <div className="w-full border-t border-dashed my-2 border-neutral-400" />
                <div className="text-[9px] text-neutral-500">
                    Login di browser: http://agungwifi.net
                </div>
                <div className="text-[9px] text-neutral-400 mt-0.5 font-mono">
                    Ref: {voucher.batch_code}
                </div>
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
