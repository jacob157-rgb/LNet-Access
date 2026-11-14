import { Head } from '@inertiajs/react';
import { CheckCircle2, Wifi } from 'lucide-react';

interface Props {
    voucher: {
        username: string;
        password: string;
        profile: string;
    };
    hotspotLoginUrl: string;
}

export default function RedeemSuccess({ voucher, hotspotLoginUrl }: Props) {
    return (
        <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-4 font-sans">
            <Head title="QR Login — L-Net" />

            <div className="w-full max-w-sm rounded-xl bg-neutral-800 border border-neutral-700 p-6 shadow-xl flex flex-col items-center text-center">
                <div className="size-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                    <CheckCircle2 className="size-6" />
                </div>

                <h1 className="font-bold text-lg">QR Login Berhasil</h1>
                <p className="text-xs text-neutral-400 mt-0.5">Token satu kali pakai berhasil diklaim.</p>

                <div className="w-full bg-neutral-900/80 border border-neutral-700/60 rounded-lg p-4 my-5 flex flex-col gap-2 font-mono">
                    <div className="text-xs text-neutral-400 uppercase">Akun Anda</div>
                    <div className="text-base font-bold text-emerald-400">{voucher.username}</div>
                    <div className="text-xs text-neutral-400">Paket: {voucher.profile}</div>
                </div>

                <a
                    href={hotspotLoginUrl}
                    className="w-full h-10 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-colors shadow-md"
                >
                    Masuk ke Jaringan Hotspot
                </a>
            </div>
        </div>
    );
}
