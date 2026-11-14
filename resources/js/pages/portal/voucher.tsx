import { Head } from '@inertiajs/react';
import { Check, ShieldCheck, Wifi } from 'lucide-react';

interface Props {
    voucher: {
        username: string;
        password: string;
        profile: string;
        rate_limit: string | null;
        router_name: string;
        status: string;
    };
}

export default function PortalVoucher({ voucher }: Props) {
    return (
        <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-4 font-sans">
            <Head title="Voucher Internet — L-Net" />

            <div className="w-full max-w-sm rounded-xl bg-neutral-800 border border-neutral-700 p-6 shadow-xl flex flex-col items-center text-center">
                <div className="size-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                    <Wifi className="size-6" />
                </div>

                <h1 className="font-bold text-lg">L-Net Hotspot</h1>
                <p className="text-xs text-neutral-400 mt-0.5">Voucher Internet Anda</p>

                <div className="w-full bg-neutral-900/80 border border-neutral-700/60 rounded-lg p-4 my-5 flex flex-col gap-3 font-mono">
                    <div>
                        <div className="text-[11px] text-neutral-400 uppercase tracking-wider">Kode Voucher / Username</div>
                        <div className="text-lg font-bold select-all text-emerald-400">{voucher.username}</div>
                    </div>

                    <div>
                        <div className="text-[11px] text-neutral-400 uppercase tracking-wider">Password</div>
                        <div className="text-lg font-bold select-all text-white">{voucher.password}</div>
                    </div>
                </div>

                <div className="w-full text-xs text-neutral-400 flex flex-col gap-1 border-t border-neutral-700 pt-3">
                    <div className="flex justify-between">
                        <span>Paket:</span>
                        <span className="text-neutral-200 font-semibold">{voucher.profile}</span>
                    </div>
                    {voucher.rate_limit && (
                        <div className="flex justify-between">
                            <span>Kecepatan:</span>
                            <span className="text-neutral-200 font-semibold">{voucher.rate_limit}</span>
                        </div>
                    )}
                </div>

                <a
                    href="http://192.168.10.1/login"
                    className="w-full mt-6 h-10 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-colors shadow-md"
                >
                    Buka Halaman Login Hotspot
                </a>
            </div>
        </div>
    );
}
