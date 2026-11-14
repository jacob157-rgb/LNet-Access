import { Head, Link, router } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Flame,
    Printer,
    RefreshCw,
    Trash2,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import DeleteBatchModal from '@/Components/delete-batch-modal';

interface Props {
    batch: any;
    vouchers: any;
}

export default function BatchDetail({ batch, vouchers }: Props) {
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [voucherToDelete, setVoucherToDelete] = useState<any | null>(null);
    const [deletingVoucher, setDeletingVoucher] = useState(false);

    const handleRetry = () => {
        router.post(`/hotspot/batches/${batch.id}/retry`);
    };

    const handleDeleteSingleVoucher = (v: any) => {
        if (!confirm(`Hanguskan voucher "${v.username}"? Akun ini akan langsung dihapus dari MikroTik RouterOS.`)) {
            return;
        }
        setDeletingVoucher(true);
        router.delete(`/hotspot/vouchers/${v.id}`, {
            onFinish: () => setDeletingVoucher(false),
        });
    };

    const totalVouchers = batch.vouchers_count ?? batch.quantity_created ?? 0;
    const soldCount = batch.sold_count ?? vouchers.data.filter((v: any) => v.commercial_status === 'sold').length;
    const unusedCount = batch.unused_count ?? (totalVouchers - soldCount);

    return (
        <>
            <Head title={`Batch ${batch.batch_code} — L-Net Access`} />

            <div className="flex flex-col gap-6 p-4 md:p-6 w-full flex-1">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/hotspot/batches" className="p-1.5 rounded hover:bg-muted text-muted-foreground">
                            <ArrowLeft className="size-4" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold tracking-tight font-mono">{batch.batch_code}</h1>
                                <span
                                    className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                                        batch.status === 'completed'
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                            : batch.status === 'partial'
                                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                    }`}
                                >
                                    {batch.status}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Profile: <span className="text-foreground font-medium">{batch.hotspot_profile?.name}</span> • Router: <span className="text-foreground font-medium">{batch.router_connection?.name}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {batch.status !== 'completed' && (
                            <button
                                onClick={handleRetry}
                                className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-medium border bg-secondary hover:bg-secondary/80 transition-colors"
                            >
                                <RefreshCw className="size-3.5" />
                                Retry Failed
                            </button>
                        )}
                        <a
                            href={`/print/vouchers/${batch.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
                        >
                            <Printer className="size-3.5" />
                            Print Lembar F4 / A4
                        </a>
                        <button
                            type="button"
                            onClick={() => setDeleteModalOpen(true)}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-semibold border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors shadow-2xs"
                        >
                            <Trash2 className="size-3.5" />
                            Hapus Batch
                        </button>
                    </div>
                </div>

                {/* Stat Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-lg border bg-card">
                        <span className="text-muted-foreground text-[11px]">Total Voucher</span>
                        <p className="text-lg font-bold mt-0.5">{totalVouchers}</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-card">
                        <span className="text-muted-foreground text-[11px]">Belum Terpakai (Ready)</span>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{unusedCount}</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-card">
                        <span className="text-muted-foreground text-[11px]">Sudah Terjual (Sold)</span>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">{soldCount}</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-card">
                        <span className="text-muted-foreground text-[11px]">Tgl Dibuat</span>
                        <p className="text-xs font-semibold mt-1 font-mono">
                            {new Date(batch.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                    </div>
                </div>

                {/* Vouchers Table */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                                <th className="py-2.5 px-3">Username / Code</th>
                                <th className="py-2.5 px-3">Commercial Status</th>
                                <th className="py-2.5 px-3">Router Object ID</th>
                                <th className="py-2.5 px-3">Comment Marker</th>
                                <th className="py-2.5 px-3">Notes / Error</th>
                                <th className="py-2.5 px-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {vouchers.data.map((v: any) => (
                                <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="py-2.5 px-3 font-mono font-bold">{v.username}</td>
                                    <td className="py-2.5 px-3">
                                        <span
                                            className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-medium capitalize ${
                                                v.commercial_status === 'ready'
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                    : v.commercial_status === 'sold'
                                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                            }`}
                                        >
                                            {v.commercial_status}
                                        </span>
                                    </td>
                                    <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                                        {v.router_object_id ?? '-'}
                                    </td>
                                    <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground truncate max-w-[200px]">
                                        {v.router_comment_marker}
                                    </td>
                                    <td className="py-2.5 px-3 text-muted-foreground text-[11px]">
                                        {v.notes ?? '-'}
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <a
                                                href={`/print/voucher/${v.id}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                title="Print Voucher"
                                                className="p-1.5 rounded hover:bg-muted text-muted-foreground inline-flex"
                                            >
                                                <Printer className="size-3.5" />
                                            </a>
                                            {v.commercial_status !== 'sold' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteSingleVoucher(v)}
                                                    title="Hanguskan voucher ini dari MikroTik"
                                                    className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive inline-flex transition-colors"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {vouchers.links && vouchers.links.length > 3 && (
                    <div className="flex items-center justify-center gap-1 text-xs">
                        {vouchers.links.map((link: any, idx: number) => (
                            <Link
                                key={idx}
                                href={link.url ?? '#'}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                className={`px-2.5 py-1 rounded border ${
                                    link.active
                                        ? 'bg-primary text-primary-foreground font-semibold border-primary'
                                        : !link.url
                                        ? 'text-muted-foreground opacity-50 pointer-events-none'
                                        : 'hover:bg-muted'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Batch Modal */}
            <DeleteBatchModal
                batch={batch}
                open={deleteModalOpen}
                onOpenChange={setDeleteModalOpen}
            />
        </>
    );
}

BatchDetail.layout = (props: any) => ({
    breadcrumbs: [
        { title: 'Hotspot', href: '/hotspot/vouchers' },
        { title: 'Batches', href: '/hotspot/batches' },
        { title: props?.batch?.batch_code || 'Detail', href: `/hotspot/batches/${props?.batch?.id}` },
    ],
});
