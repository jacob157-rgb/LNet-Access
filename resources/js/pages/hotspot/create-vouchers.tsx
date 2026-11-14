import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Check, FileText, Layers, Printer, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
    routers: any[];
    selectedRouterId: number;
    profiles: any[];
}

export default function CreateVouchers({ routers, selectedRouterId, profiles }: Props) {
    // Helper to guess price from profile name (e.g. 2k-12j -> 2000, 3k -> 3000, 10k -> 10000)
    const guessPriceFromProfile = (profName: string) => {
        if (!profName) return 2000;
        const name = profName.toLowerCase();
        if (name.includes('2k')) return 2000;
        if (name.includes('3k')) return 3000;
        if (name.includes('5k')) return 5000;
        if (name.includes('10k')) return 10000;
        if (name.includes('20k')) return 20000;
        if (name.includes('30k')) return 30000;
        if (name.includes('50k')) return 50000;
        if (name.includes('100k')) return 100000;
        return 2000;
    };

    const initialProfile = profiles[0];
    const initialPrice = initialProfile ? guessPriceFromProfile(initialProfile.name) : 2000;

    const { data, setData, post, processing, errors } = useForm({
        router_id: selectedRouterId || (routers[0]?.id ?? ''),
        profile_id: initialProfile?.id ?? '',
        quantity: 36, // Default 1 full sheet of F4 (36 vouchers)
        length: 8,   // Default 8 chars (4 letters + 4 digits: e.g. zetj5479)
        charset: 'mikhmon',
        prefix: '',
        user_equals_password: true,
        price: initialPrice,
        notes: '',
    });

    const [previewSamples, setPreviewSamples] = useState<string[]>([]);

    const generatePreview = () => {
        const letters = 'abcdefghjkmnpqrstuvwxyz';
        const digits = '23456789';
        const samples = [];

        for (let i = 0; i < 4; i++) {
            let code = data.prefix;
            if (data.charset === 'mikhmon') {
                const half = Math.ceil(data.length / 2);
                const digitCount = data.length - half;
                for (let j = 0; j < half; j++) {
                    code += letters[Math.floor(Math.random() * letters.length)];
                }
                for (let j = 0; j < digitCount; j++) {
                    code += digits[Math.floor(Math.random() * digits.length)];
                }
            } else if (data.charset === 'numbers') {
                for (let j = 0; j < data.length; j++) {
                    code += digits[Math.floor(Math.random() * digits.length)];
                }
            } else if (data.charset === 'letters') {
                for (let j = 0; j < data.length; j++) {
                    code += letters[Math.floor(Math.random() * letters.length)];
                }
            } else if (data.charset === 'uppercase') {
                const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
                for (let j = 0; j < data.length; j++) {
                    code += chars[Math.floor(Math.random() * chars.length)];
                }
            } else {
                const chars = '23456789abcdefghjkmnpqrstuvwxyz';
                for (let j = 0; j < data.length; j++) {
                    code += chars[Math.floor(Math.random() * chars.length)];
                }
            }
            samples.push(code);
        }
        setPreviewSamples(samples);
    };

    useEffect(() => {
        generatePreview();
    }, [data.length, data.charset, data.prefix]);

    const handleProfileChange = (profileId: string) => {
        const prof = profiles.find((p) => String(p.id) === String(profileId));
        setData((prev) => ({
            ...prev,
            profile_id: profileId,
            price: prof ? guessPriceFromProfile(prof.name) : prev.price,
        }));
    };

    const handleSelectQuantityPreset = (qty: number) => {
        setData('quantity', qty);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/hotspot/vouchers');
    };

    const f4Sheets = Math.ceil(data.quantity / 36);

    return (
        <>
            <Head title="Generate Vouchers (F4 Batch) — L-Net Access" />

            <div className="flex flex-col gap-6 p-4 md:p-6 w-full flex-1">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Generate Hotspot Vouchers</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Buat batch voucher cetak lembaran F4 (36 voucher/lembar) sesuai format sample PDF.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-5 rounded-lg border bg-card text-card-foreground shadow-xs">
                    {/* Target Router & Profile */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-foreground">Target Router</label>
                            <select
                                value={data.router_id}
                                onChange={(e) => setData('router_id', e.target.value)}
                                className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background font-medium focus:ring-1"
                            >
                                {routers.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name} ({r.host})
                                    </option>
                                ))}
                            </select>
                            {errors.router_id && <span className="text-xs text-rose-500">{errors.router_id}</span>}
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-foreground">Hotspot Profile (Paket)</label>
                            <select
                                value={data.profile_id}
                                onChange={(e) => handleProfileChange(e.target.value)}
                                className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background font-medium focus:ring-1"
                            >
                                {profiles.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} {p.rate_limit ? `(${p.rate_limit})` : ''} {p.session_timeout ? `• ${p.session_timeout}` : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.profile_id && <span className="text-xs text-rose-500">{errors.profile_id}</span>}
                        </div>
                    </div>

                    {/* Quantity & Preset Batch F4 */}
                    <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-foreground">
                                Jumlah Voucher (Batch Lembaran F4)
                            </label>
                            <span className="text-[11px] font-mono text-muted-foreground">
                                Setara <strong className="text-foreground">{f4Sheets} Lembar F4</strong> ({data.quantity} voucher @ 36/lbr)
                            </span>
                        </div>

                        {/* Quick Presets Buttons for F4 Sheets */}
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {[
                                { qty: 36, label: '36 (1 Lembar F4)' },
                                { qty: 72, label: '72 (2 Lembar F4)' },
                                { qty: 108, label: '108 (3 Lembar F4)' },
                                { qty: 144, label: '144 (4 Lembar F4)' },
                                { qty: 180, label: '180 (5 Lembar F4)' },
                                { qty: 360, label: '360 (10 Lembar F4)' },
                            ].map((preset) => (
                                <button
                                    key={preset.qty}
                                    type="button"
                                    onClick={() => handleSelectQuantityPreset(preset.qty)}
                                    className={`px-2.5 py-1 rounded text-xs font-mono font-medium border transition-colors ${
                                        data.quantity === preset.qty
                                            ? 'bg-primary text-primary-foreground border-primary font-bold shadow-2xs'
                                            : 'bg-muted/40 hover:bg-accent text-foreground border-border'
                                    }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs text-muted-foreground">Jumlah Kustom</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={500}
                                    required
                                    value={data.quantity}
                                    onChange={(e) => setData('quantity', parseInt(e.target.value) || 1)}
                                    className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background font-mono focus:ring-1"
                                />
                                <span className="text-[10px] text-muted-foreground">Maksimal 500 voucher per batch.</span>
                            </div>

                            <div>
                                <label className="text-xs text-muted-foreground">Harga Jual per Voucher (IDR)</label>
                                <input
                                    type="number"
                                    min={0}
                                    step={500}
                                    value={data.price}
                                    onChange={(e) => setData('price', parseFloat(e.target.value) || 0)}
                                    className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background font-mono font-semibold focus:ring-1"
                                />
                                <span className="text-[10px] text-muted-foreground">Dicetak pada pita hitam kiri voucher (e.g. Rp 2.000).</span>
                            </div>
                        </div>
                    </div>

                    {/* Voucher Format & Character Rules */}
                    <div className="border-t pt-4">
                        <h4 className="text-xs font-semibold mb-3">Format Kode Voucher</h4>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Model Karakter</label>
                                <select
                                    value={data.charset}
                                    onChange={(e) => setData('charset', e.target.value)}
                                    className="mt-1 w-full text-xs h-8 px-2 rounded border bg-background font-medium focus:ring-1"
                                >
                                    <option value="mikhmon">Mikhmon Mix (4 Huruf + 4 Angka: zetj5479 - Format PDF)</option>
                                    <option value="alphanumeric_safe">Alfanumerik Acak Aman (No 0/O, 1/I/l)</option>
                                    <option value="numbers">Angka Saja (23456789)</option>
                                    <option value="letters">Huruf Kecil Saja (abcdef...)</option>
                                    <option value="uppercase">Huruf Besar + Angka (ABCDEF...)</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Panjang Karakter</label>
                                <input
                                    type="number"
                                    min={4}
                                    max={12}
                                    value={data.length}
                                    onChange={(e) => setData('length', parseInt(e.target.value) || 8)}
                                    className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background font-mono focus:ring-1"
                                />
                                <span className="text-[10px] text-muted-foreground">Standar PDF: 8 karakter (4 huruf + 4 angka).</span>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Prefix Opsional</label>
                                <input
                                    type="text"
                                    maxLength={4}
                                    placeholder="e.g. vc-"
                                    value={data.prefix}
                                    onChange={(e) => setData('prefix', e.target.value)}
                                    className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background font-mono focus:ring-1"
                                />
                            </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="user_eq_pass"
                                checked={data.user_equals_password}
                                onChange={(e) => setData('user_equals_password', e.target.checked)}
                                className="size-3.5 rounded border"
                            />
                            <label htmlFor="user_eq_pass" className="text-xs text-muted-foreground cursor-pointer">
                                Username sama dengan Password (standar Hotspot login 1-kode seperti contoh PDF)
                            </label>
                        </div>
                    </div>

                    {/* Preview Box */}
                    <div className="p-3.5 rounded-lg bg-muted/40 border">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold flex items-center gap-1.5">
                                <Sparkles className="size-3.5 text-primary" />
                                Contoh Format Kode Voucher
                            </span>
                            <button
                                type="button"
                                onClick={generatePreview}
                                className="text-xs text-primary hover:underline font-semibold"
                            >
                                Acak Ulang Sample
                            </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {previewSamples.map((sample, idx) => (
                                <span key={idx} className="font-mono text-xs px-2.5 py-1 rounded bg-background border border-border/80 font-bold tracking-wider text-foreground shadow-2xs">
                                    {sample}
                                </span>
                            ))}
                        </div>

                        <div className="text-[11px] text-muted-foreground mt-3 border-t pt-2 flex items-center justify-between">
                            <span>Estimasi Total Nilai Penjualan Batch:</span>
                            <strong className="font-mono text-sm text-foreground font-bold">
                                Rp {(data.quantity * data.price).toLocaleString('id-ID')}
                            </strong>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t flex items-center justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="h-8 px-3 rounded text-xs font-medium text-muted-foreground hover:bg-muted"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="h-8 px-4 rounded text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-2xs flex items-center gap-1.5"
                        >
                            <FileText className="size-3.5" />
                            {processing ? 'Memproses ke RouterOS...' : `Generate ${data.quantity} Voucher (${f4Sheets} Lembar F4)`}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

CreateVouchers.layout = {
    breadcrumbs: [
        { title: 'Hotspot', href: '/hotspot/vouchers' },
        { title: 'Generate Vouchers', href: '/hotspot/vouchers/create' },
    ],
};
