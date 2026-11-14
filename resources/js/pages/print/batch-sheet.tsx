import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Check, Copy, Download, FileText, Printer, QrCode, RotateCcw, Settings2 } from 'lucide-react';
import { useState } from 'react';

interface VoucherItem {
    id: number;
    uuid: string;
    index: number;
    username: string;
    password: string;
    user_equals_password: boolean;
    profile_name: string;
    validity: string;
    duration: string;
    rate_limit: string;
    price: number;
    currency: string;
    batch_code: string;
    generated_at: string;
    generated_date: string;
    qr_svg: string;
    qr_svg_code_only: string;
    direct_login_url: string;
    portal_url: string;
}

interface Props {
    batch: {
        batch_id: number;
        batch_code: string;
        router_name: string;
        brand_name: string;
        dns_host: string;
        profile_name: string;
        total_count: number;
        vouchers: VoucherItem[];
    };
}

export default function BatchSheet({ batch }: Props) {
    const [paperSize, setPaperSize] = useState<'f4' | 'a4'>('f4');
    const [brandName, setBrandName] = useState(batch.brand_name || 'AgungWifi');
    const [dnsHost, setDnsHost] = useState(batch.dns_host || 'agungwifi.net');
    const [qrType, setQrType] = useState<'url' | 'code'>('url');

    const handlePrint = () => {
        window.print();
    };

    // Vouchers per sheet: 36 for F4 (3 cols x 12 rows), 30 for A4 (3 cols x 10 rows)
    const vouchersPerPage = paperSize === 'f4' ? 36 : 30;

    // Chunk vouchers into pages
    const pages: VoucherItem[][] = [];
    for (let i = 0; i < batch.vouchers.length; i += vouchersPerPage) {
        pages.push(batch.vouchers.slice(i, i + vouchersPerPage));
    }

    return (
        <div className="min-h-screen bg-neutral-200/80 text-black font-sans print:bg-white print:p-0">
            <Head title={`Print Batch ${batch.batch_code} (F4/A4 Sheet) — L-Net Access`} />

            {/* Top Operational Controls Bar (Hidden during Print) */}
            <header className="sticky top-0 z-30 bg-neutral-900 text-white px-4 py-3 border-b border-neutral-800 shadow-md print:hidden">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                    {/* Left: Back & Batch Info */}
                    <div className="flex items-center gap-3">
                        <Link
                            href={`/hotspot/batches/${batch.batch_id}`}
                            className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                            title="Kembali ke Detail Batch"
                        >
                            <ArrowLeft className="size-4" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-bold text-sm text-white tracking-tight">
                                    Voucher Sheet Generator
                                </h1>
                                <span className="bg-neutral-800 text-neutral-300 text-[11px] px-2 py-0.5 rounded font-mono">
                                    {batch.batch_code}
                                </span>
                            </div>
                            <p className="text-[11px] text-neutral-400">
                                Total: {batch.total_count} Vouchers • Paket: {batch.profile_name} • {pages.length} Lembar ({vouchersPerPage}/lembar)
                            </p>
                        </div>
                    </div>

                    {/* Middle: Live Customization Inputs */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                        {/* Paper Size Selector */}
                        <div className="flex items-center rounded bg-neutral-800 p-0.5 border border-neutral-700">
                            <button
                                type="button"
                                onClick={() => setPaperSize('f4')}
                                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                                    paperSize === 'f4'
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'text-neutral-400 hover:text-white'
                                }`}
                                title="F4 / Folio (215 x 330 mm) - 36 Vouchers per Lembar (Format Standar PDF)"
                            >
                                F4 (36/lbr)
                            </button>
                            <button
                                type="button"
                                onClick={() => setPaperSize('a4')}
                                className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                                    paperSize === 'a4'
                                        ? 'bg-primary text-primary-foreground shadow-xs'
                                        : 'text-neutral-400 hover:text-white'
                                }`}
                                title="A4 (210 x 297 mm) - 30 Vouchers per Lembar"
                            >
                                A4 (30/lbr)
                            </button>
                        </div>

                        {/* QR Code Density Mode */}
                        <div className="flex items-center rounded bg-neutral-800 p-0.5 border border-neutral-700" title="Mode QR Code">
                            <button
                                type="button"
                                onClick={() => setQrType('url')}
                                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                                    qrType === 'url'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'text-neutral-400 hover:text-white'
                                }`}
                                title="Scan langsung buka URL login MikroTik"
                            >
                                <QrCode className="size-3" />
                                QR: URL Login
                            </button>
                            <button
                                type="button"
                                onClick={() => setQrType('code')}
                                className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 ${
                                    qrType === 'code'
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'text-neutral-400 hover:text-white'
                                }`}
                                title="QR ekstra sederhana (hanya kode) untuk kamera HP kualitas rendah"
                            >
                                <QrCode className="size-3" />
                                QR: Kode Saja (Ultra-Simple)
                            </button>
                        </div>

                        {/* Brand Name Input */}
                        <div className="flex items-center gap-1.5 bg-neutral-800/90 border border-neutral-700 rounded px-2 py-1">
                            <span className="text-neutral-400 text-[11px]">Brand:</span>
                            <input
                                type="text"
                                value={brandName}
                                onChange={(e) => setBrandName(e.target.value)}
                                className="bg-transparent text-white text-xs font-semibold w-24 focus:outline-hidden"
                                placeholder="AgungWifi"
                            />
                        </div>

                        {/* Login DNS Input */}
                        <div className="flex items-center gap-1.5 bg-neutral-800/90 border border-neutral-700 rounded px-2 py-1">
                            <span className="text-neutral-400 text-[11px]">DNS:</span>
                            <input
                                type="text"
                                value={dnsHost}
                                onChange={(e) => setDnsHost(e.target.value)}
                                className="bg-transparent text-white text-xs font-mono w-28 focus:outline-hidden"
                                placeholder="agungwifi.net"
                            />
                        </div>
                    </div>

                    {/* Right: Print Action */}
                    <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 h-8 px-4 rounded bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors shadow-sm"
                        >
                            <Printer className="size-3.5" />
                            Print Lembar ({paperSize.toUpperCase()})
                        </button>
                    </div>
                </div>
            </header>

            {/* Print Preview Container */}
            <main className="py-6 px-4 print:p-0 flex flex-col items-center gap-8 print:gap-0">
                {pages.map((pageVouchers, pageIdx) => (
                    <div
                        key={pageIdx}
                        className={`sheet-page bg-white shadow-xl print:shadow-none mx-auto relative ${
                            paperSize === 'f4' ? 'w-[215mm] h-[330mm]' : 'w-[210mm] h-[297mm]'
                        }`}
                        style={{
                            padding: '5mm',
                            boxSizing: 'border-box',
                        }}
                    >
                        {/* Page Indicator (Screen only) */}
                        <div className="absolute -top-5 left-0 text-[11px] font-mono text-neutral-500 font-semibold print:hidden">
                            Halaman {pageIdx + 1} dari {pages.length} ({pageVouchers.length} Vouchers)
                        </div>

                        {/* 3 Columns Grid (12 rows for F4, 10 rows for A4) */}
                        <div
                            className={`grid grid-cols-3 gap-x-[2mm] ${
                                paperSize === 'f4' ? 'gap-y-[1.5mm]' : 'gap-y-[1.2mm]'
                            } w-full h-full content-start`}
                        >
                            {pageVouchers.map((v) => (
                                <div
                                    key={v.id}
                                    className={`border border-black rounded-[2.5px] bg-white flex flex-row overflow-hidden relative break-inside-avoid shadow-2xs print:shadow-none ${
                                        paperSize === 'f4' ? 'h-[24.8mm]' : 'h-[26.5mm]'
                                    }`}
                                >
                                    {/* Left Price Ribbon (Black with vertical white text) */}
                                    <div className="w-[17px] bg-black text-white flex items-center justify-center shrink-0 h-full select-none">
                                        <span
                                            className="font-sans font-black text-[9px] tracking-wide whitespace-nowrap text-white text-center"
                                            style={{
                                                writingMode: 'vertical-rl',
                                                textOrientation: 'mixed',
                                            }}
                                        >
                                            Rp {v.price ? v.price.toLocaleString('id-ID') : '2.000'}
                                        </span>
                                    </div>

                                    {/* Main Voucher Body (Center & Right) */}
                                    <div className="flex-1 flex flex-col justify-between py-[2.5px] px-[5px] relative min-w-0 bg-white">
                                        {/* Top Row: Brand & Extra-Large QR Code */}
                                        <div className="flex items-start justify-between min-w-0">
                                            <span className="font-sans font-bold text-[10.5px] text-black tracking-tight leading-none truncate max-w-[120px]">
                                                {brandName}
                                            </span>

                                            {/* Extra-Large QR Code (Top-Right, 68px / ~18mm, zero-margin SVG for easy low-end camera scan) */}
                                            <div
                                                className="size-[68px] shrink-0 absolute top-[2px] right-[2px] border border-neutral-300 rounded-[1px] p-[1px] bg-white flex items-center justify-center overflow-hidden [&_svg]:size-full [&_svg]:block"
                                                dangerouslySetInnerHTML={{
                                                    __html: qrType === 'code' ? (v.qr_svg_code_only || v.qr_svg) : v.qr_svg
                                                }}
                                                title={`Scan untuk login: ${v.username}`}
                                            />
                                        </div>

                                        {/* Middle Row: Bold Voucher Code in Dashed Box (Sejajar Kiri dengan AgungWifi, mepet/snug) */}
                                        <div className="my-auto pr-[72px] flex items-center justify-start">
                                            <div className="border border-dashed border-neutral-900 rounded-[2px] py-[1px] px-1.5 bg-neutral-50/80">
                                                <span className="font-mono font-black text-[17px] sm:text-[18px] text-black tracking-wider leading-none select-all block">
                                                    {v.username}
                                                </span>
                                            </div>
                                        </div>

                                        {/* If password differs from username, show small password note */}
                                        {!v.user_equals_password && (
                                            <div className="text-[7.5px] font-mono text-neutral-800 pr-[72px] -mt-1 text-left truncate">
                                                Pass: <span className="font-bold">{v.password}</span>
                                            </div>
                                        )}

                                        {/* Bottom Rows: Validity & Login DNS URL + Tanggal Pembuatan sebelum [no] */}
                                        <div className="flex flex-col gap-[0.5px]">
                                            <div className="text-[7.2px] font-sans font-bold text-black leading-tight truncate pr-[2px]">
                                                Aktif:{v.validity} | Dur:{v.duration} | {v.rate_limit}
                                            </div>
                                            <div className="flex items-center justify-between text-[6.8px] text-neutral-800 font-sans leading-tight">
                                                <span className="truncate pr-1">
                                                    Login: http://{dnsHost}
                                                </span>
                                                <span className="font-mono text-neutral-700 font-bold shrink-0">
                                                    {v.generated_date} [{v.index}]
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </main>

            {/* Print-specific CSS */}
            <style>{`
                @media print {
                    @page {
                        size: ${paperSize === 'f4' ? '215mm 330mm' : 'A4 portrait'};
                        margin: 5mm;
                    }
                    html, body {
                        background: #fff !important;
                        color: #000 !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .sheet-page {
                        width: ${paperSize === 'f4' ? '205mm' : '200mm'} !important;
                        height: ${paperSize === 'f4' ? '320mm' : '287mm'} !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                        page-break-after: always;
                        break-after: page;
                        box-sizing: border-box;
                    }
                    .sheet-page:last-child {
                        page-break-after: auto;
                        break-after: auto;
                    }
                }
            `}</style>
        </div>
    );
}
