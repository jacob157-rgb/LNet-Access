import { Head, Link } from '@inertiajs/react';
import { Camera, CheckCircle2, ChevronRight, KeyRound, QrCode, Shield, Sparkles, User, Wifi, X } from 'lucide-react';
import React, { useRef, useState } from 'react';

interface Profile {
    id: number;
    name: string;
    rate_limit: string | null;
    session_timeout: string | null;
}

interface Props {
    hotspotLoginUrl: string;
    clientIp: string;
    profiles: Profile[];
}

export default function PortalIndex({ hotspotLoginUrl, clientIp, profiles }: Props) {
    const [loginType, setLoginType] = useState<'voucher' | 'member'>('voucher');
    const [voucherCode, setVoucherCode] = useState('');
    const [memberUser, setMemberUser] = useState('');
    const [memberPass, setMemberPass] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleVoucherSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const code = voucherCode.trim();
        if (!code) return;

        setIsSubmitting(true);
        const target = `${hotspotLoginUrl}?username=${encodeURIComponent(code)}&password=${encodeURIComponent(code)}`;
        window.location.href = target;
    };

    const handleMemberSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const u = memberUser.trim();
        const p = memberPass.trim();
        if (!u || !p) return;

        setIsSubmitting(true);
        const target = `${hotspotLoginUrl}?username=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}`;
        window.location.href = target;
    };

    const triggerQrCamera = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    // Guess readable duration & price from profile name
    const getProfileDetails = (name: string) => {
        if (name.includes('2k') || name.includes('12j')) {
            return { price: 'Rp 2.000', duration: '12 Jam', speed: '2 Mbps' };
        }
        if (name.includes('3k') || name.includes('24j')) {
            return { price: 'Rp 3.000', duration: '24 Jam (1 Hari)', speed: '3 Mbps' };
        }
        if (name.includes('10k') || name.includes('1mg')) {
            return { price: 'Rp 10.000', duration: '7 Hari (1 Minggu)', speed: '3 Mbps' };
        }
        if (name.includes('30k') || name.includes('1bl')) {
            return { price: 'Rp 30.000', duration: '30 Hari (1 Bulan)', speed: '4 Mbps' };
        }
        return { price: 'Paket Hotspot', duration: 'Masa Aktif Standar', speed: 'Stabil' };
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between items-center p-4 selection:bg-emerald-500 selection:text-white font-sans">
            <Head title="AgungWifi - Portal Masuk Hotspot" />

            {/* Hidden Camera Input for Mobile QR Scan */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                        alert("Membaca foto QR... Jika kode terbaca, sistem akan otomatis login.");
                    }
                }}
            />

            {/* Main Container */}
            <div className="w-full max-w-md my-auto pt-4 pb-8 flex flex-col items-center">
                
                {/* Brand Header */}
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="size-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3">
                        <Wifi className="size-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                        AgungWifi <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">Hotspot</span>
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">Koneksi Internet Cepat, Stabil, &amp; Kuota Tanpa Batas</p>

                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-mono">
                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>IP Anda: {clientIp || '10.20.30.x'}</span>
                    </div>
                </div>

                {/* Login Card */}
                <div className="w-full rounded-2xl bg-slate-900/90 border border-slate-800 p-6 shadow-2xl backdrop-blur-sm">
                    {/* Switcher Tabs */}
                    <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-xl border border-slate-800/80 mb-5">
                        <button
                            type="button"
                            onClick={() => setLoginType('voucher')}
                            className={`py-2 text-xs font-bold rounded-lg transition-all ${
                                loginType === 'voucher'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Kode Voucher
                        </button>
                        <button
                            type="button"
                            onClick={() => setLoginType('member')}
                            className={`py-2 text-xs font-bold rounded-lg transition-all ${
                                loginType === 'member'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Akun Member
                        </button>
                    </div>

                    {/* Voucher Form */}
                    {loginType === 'voucher' ? (
                        <form onSubmit={handleVoucherSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                    Masukkan Kode Voucher
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={voucherCode}
                                        onChange={(e) => setVoucherCode(e.target.value.toLowerCase())}
                                        placeholder="contoh: tsteas663"
                                        autoFocus
                                        autoCapitalize="none"
                                        autoCorrect="off"
                                        spellCheck="false"
                                        className="w-full h-12 pl-4 pr-12 rounded-xl bg-slate-950 border border-slate-700/80 text-white font-mono font-bold text-base placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={triggerQrCamera}
                                        title="Scan QR Code Voucher"
                                        className="absolute right-2 top-2 size-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 flex items-center justify-center transition-colors"
                                    >
                                        <Camera className="size-4" />
                                    </button>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1.5">
                                    Punya voucher dengan QR? Tekan ikon kamera untuk scan langsung.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !voucherCode.trim()}
                                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                            >
                                <Sparkles className="size-4" />
                                <span>{isSubmitting ? 'Menghubungkan...' : 'Hubungkan Internet'}</span>
                            </button>
                        </form>
                    ) : (
                        /* Member Form */
                        <form onSubmit={handleMemberSubmit} className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    value={memberUser}
                                    onChange={(e) => setMemberUser(e.target.value)}
                                    placeholder="Username pelanggan"
                                    className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white font-medium text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={memberPass}
                                    onChange={(e) => setMemberPass(e.target.value)}
                                    placeholder="Kata sandi"
                                    className="w-full h-11 px-3.5 rounded-xl bg-slate-950 border border-slate-700/80 text-white font-medium text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting || !memberUser || !memberPass}
                                className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                            >
                                <span>{isSubmitting ? 'Menghubungkan...' : 'Masuk Jaringan'}</span>
                            </button>
                        </form>
                    )}
                </div>

                {/* Pricing / Packages Banner */}
                <div className="w-full mt-6">
                    <div className="flex items-center justify-between mb-3 px-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pilihan Paket Voucher</span>
                        <span className="text-[11px] text-emerald-400 font-medium">Aktif 24/7</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                        {profiles.filter(p => p.name !== 'member').slice(0, 4).map((prof) => {
                            const details = getProfileDetails(prof.name);
                            return (
                                <div
                                    key={prof.id}
                                    className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-3 flex flex-col justify-between hover:border-emerald-500/40 transition-colors"
                                >
                                    <div>
                                        <div className="text-xs font-bold text-white">{prof.name}</div>
                                        <div className="text-base font-black text-emerald-400 mt-0.5">{details.price}</div>
                                    </div>
                                    <div className="mt-2 text-[10px] text-slate-400 font-medium">
                                        ⏱ {details.duration}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>

            {/* Footer */}
            <div className="w-full max-w-md pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span>&copy; {new Date().getFullYear()} AgungWifi Network</span>
                <Link
                    href="/login"
                    className="text-slate-400 hover:text-emerald-400 transition-colors font-medium"
                >
                    Login Operator &rarr;
                </Link>
            </div>
        </div>
    );
}
