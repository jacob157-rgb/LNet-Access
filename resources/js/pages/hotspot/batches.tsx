import { Head, Link, router } from '@inertiajs/react';
import { Layers, Printer, RefreshCw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import DeleteBatchModal from '@/Components/delete-batch-modal';
import DeleteAllBatchesModal from '@/Components/delete-all-batches-modal';

interface Props {
    routers: any[];
    selectedRouterId: number;
    batches: any;
}

export default function HotspotBatches({ routers, selectedRouterId, batches }: Props) {
    const [batchToDelete, setBatchToDelete] = useState<any | null>(null);
    const [deleteAllOpen, setDeleteAllOpen] = useState(false);

    const handleRouterChange = (id: string) => {
        router.get('/hotspot/batches', { router_id: id }, { preserveState: true });
    };

    return (
        <>
            <Head title="Voucher Batches — L-Net Access" />

            <div className="flex flex-col gap-6 p-4 md:p-6 w-full flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Voucher Batches</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Batch provisioning history, bulk printing sheets, and voucher revocation.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {routers.length > 1 && (
                            <select
                                value={selectedRouterId}
                                onChange={(e) => handleRouterChange(e.target.value)}
                                className="text-xs h-8 px-2 rounded border bg-background"
                            >
                                {routers.map((r) => (
                                    <option key={r.id} value={r.id}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                        )}

                        {batches.data.length > 0 && (
                            <button
                                type="button"
                                onClick={() => setDeleteAllOpen(true)}
                                className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-semibold border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors shadow-2xs"
                            >
                                <Trash2 className="size-3.5" />
                                Hapus Semua Batch
                            </button>
                        )}

                        <Link
                            href="/hotspot/vouchers/create"
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            Generate New Batch
                        </Link>
                    </div>
                </div>

                {/* Batches Table */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                                <th className="py-2.5 px-3">Batch Code</th>
                                <th className="py-2.5 px-3">Profile</th>
                                <th className="py-2.5 px-3">Created / Requested</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3">Operator</th>
                                <th className="py-2.5 px-3">Date</th>
                                <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {batches.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                                        No batches created yet.
                                    </td>
                                </tr>
                            ) : (
                                batches.data.map((b: any) => (
                                    <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-2.5 px-3 font-mono font-bold">
                                            <Link href={`/hotspot/batches/${b.id}`} className="text-primary hover:underline">
                                                {b.batch_code}
                                            </Link>
                                        </td>
                                        <td className="py-2.5 px-3 font-medium">{b.hotspot_profile?.name ?? '-'}</td>
                                        <td className="py-2.5 px-3 font-mono">
                                            <span className="font-semibold text-emerald-600">{b.quantity_created}</span>
                                            <span className="text-muted-foreground"> / {b.quantity_requested}</span>
                                            {b.sold_count > 0 && (
                                                <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600">
                                                    {b.sold_count} terjual
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <span
                                                className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-medium capitalize ${
                                                    b.status === 'completed'
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                        : b.status === 'partial'
                                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                }`}
                                            >
                                                {b.status}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-muted-foreground">{b.creator?.name ?? 'Admin'}</td>
                                        <td className="py-2.5 px-3 font-mono text-muted-foreground text-[11px]">
                                            {new Date(b.created_at).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="py-2.5 px-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <a
                                                    href={`/print/vouchers/${b.id}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title="Print Lembar Voucher F4 / A4"
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded border text-[11px] font-medium hover:bg-muted transition-colors shadow-2xs"
                                                >
                                                    <Printer className="size-3" />
                                                    Print
                                                </a>
                                                <Link
                                                    href={`/hotspot/batches/${b.id}`}
                                                    className="px-2 py-1 rounded border text-[11px] font-medium hover:bg-muted transition-colors"
                                                >
                                                    View
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => setBatchToDelete(b)}
                                                    title="Hanguskan voucher & hapus batch"
                                                    className="inline-flex items-center gap-1 px-2 py-1 rounded border border-destructive/40 text-[11px] font-medium text-destructive hover:bg-destructive/10 transition-colors"
                                                >
                                                    <Trash2 className="size-3" />
                                                    Hapus
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {batches.links && batches.links.length > 3 && (
                    <div className="flex items-center justify-center gap-1 text-xs">
                        {batches.links.map((link: any, idx: number) => (
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

            {/* Delete Single Batch Modal */}
            <DeleteBatchModal
                batch={batchToDelete}
                open={Boolean(batchToDelete)}
                onOpenChange={(open) => !open && setBatchToDelete(null)}
            />

            {/* Delete All Batches Modal */}
            <DeleteAllBatchesModal
                open={deleteAllOpen}
                onOpenChange={setDeleteAllOpen}
                routerId={selectedRouterId}
                batchesCount={batches.data.length}
            />
        </>
    );
}

HotspotBatches.layout = {
    breadcrumbs: [
        { title: 'Hotspot', href: '/hotspot/vouchers' },
        { title: 'Voucher Batches', href: '/hotspot/batches' },
    ],
};
