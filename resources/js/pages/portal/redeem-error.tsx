import { Head } from '@inertiajs/react';
import { AlertCircle } from 'lucide-react';

interface Props {
    error: string;
}

export default function RedeemError({ error }: Props) {
    return (
        <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center justify-center p-4 font-sans">
            <Head title="Klaim Gagal — L-Net" />

            <div className="w-full max-w-sm rounded-xl bg-neutral-800 border border-neutral-700 p-6 shadow-xl flex flex-col items-center text-center">
                <div className="size-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
                    <AlertCircle className="size-6" />
                </div>

                <h1 className="font-bold text-lg">Klaim QR Gagal</h1>
                <p className="text-xs text-rose-400 mt-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-md w-full">
                    {error}
                </p>

                <p className="text-xs text-neutral-400 mt-4 leading-relaxed">
                    Token QR sudah kedaluwarsa atau telah digunakan sebelumnya. Silakan gunakan username dan password pada tiket fisik Anda.
                </p>

                <a
                    href="http://192.168.10.1/login"
                    className="w-full mt-6 h-10 rounded-md bg-neutral-700 hover:bg-neutral-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center transition-colors shadow-md"
                >
                    Kembali ke Login
                </a>
            </div>
        </div>
    );
}
