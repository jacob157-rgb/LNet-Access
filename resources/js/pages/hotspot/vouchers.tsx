import { Head, Link, router } from '@inertiajs/react';
import {
    Eye,
    Filter,
    Plus,
    Printer,
    Search,
    Ticket,
    Trash2,
    X,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    routers: any[];
    selectedRouterId: number;
    vouchers: any;
    profiles: any[];
    filters: {
        search?: string;
        status?: string;
        profile_id?: string;
    };
}

export default function HotspotVouchers({
    routers,
    selectedRouterId,
    vouchers,
    profiles,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [profileId, setProfileId] = useState(filters.profile_id ?? '');
    const [revealedVoucher, setRevealedVoucher] = useState<any>(null);
    const [loadingReveal, setLoadingReveal] = useState(false);

    const handleFilter = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            '/hotspot/vouchers',
            {
                router_id: selectedRouterId,
                search: search || undefined,
                status: status || undefined,
                profile_id: profileId || undefined,
            },
            { preserveState: true }
        );
    };

    const handleReveal = async (voucherId: number) => {
        setLoadingReveal(true);
        try {
            const res = await fetch(`/hotspot/vouchers/${voucherId}`);
            const data = await res.json();
            setRevealedVoucher(data);
        } catch (e) {
            alert('Failed to reveal voucher credentials.');
        } finally {
            setLoadingReveal(false);
        }
    };

    const handleDeleteVoucher = (v: any) => {
        if (!confirm(`Hanguskan voucher "${v.username}"? Akun hotspot ini akan langsung dihapus dari MikroTik RouterOS.`)) {
            return;
        }
        router.delete(`/hotspot/vouchers/${v.id}`);
    };

    return (
        <>
            <Head title="Vouchers — L-Net Access" />

            <div className="flex flex-col gap-6 p-4 md:p-6 w-full flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Voucher Inventory</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Manage generated Hotspot vouchers and credentials.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/hotspot/batches"
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-medium border bg-secondary hover:bg-secondary/80 transition-colors"
                        >
                            View Batches
                        </Link>
                        <Link
                            href="/hotspot/vouchers/create"
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="size-3.5" />
                            Generate Vouchers
                        </Link>
                    </div>
                </div>

                {/* Filter Strip */}
                <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-2.5 p-3 rounded-lg border bg-card text-card-foreground shadow-xs">
                    <div className="relative flex-1 min-w-[180px]">
                        <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search username..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-8 pr-2.5 text-xs h-8 rounded border bg-background"
                        />
                    </div>

                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="text-xs h-8 px-2 rounded border bg-background"
                    >
                        <option value="">All Statuses</option>
                        <option value="ready">Ready (Available)</option>
                        <option value="sold">Sold</option>
                        <option value="draft">Draft / Provisioning</option>
                        <option value="expired">Expired</option>
                        <option value="disabled">Disabled</option>
                    </select>

                    <select
                        value={profileId}
                        onChange={(e) => setProfileId(e.target.value)}
                        className="text-xs h-8 px-2 rounded border bg-background"
                    >
                        <option value="">All Profiles</option>
                        {profiles.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>

                    <button
                        type="submit"
                        className="h-8 px-3 rounded text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                    >
                        Filter
                    </button>
                </form>

                {/* Vouchers Table */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                                <th className="py-2.5 px-3">Username / Code</th>
                                <th className="py-2.5 px-3">Profile</th>
                                <th className="py-2.5 px-3">Price</th>
                                <th className="py-2.5 px-3">Commercial Status</th>
                                <th className="py-2.5 px-3">Batch</th>
                                <th className="py-2.5 px-3">Generated</th>
                                <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {vouchers.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                                        No vouchers match the criteria.
                                    </td>
                                </tr>
                            ) : (
                                vouchers.data.map((v: any) => (
                                    <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-2.5 px-3 font-mono font-semibold">{v.username}</td>
                                        <td className="py-2.5 px-3">
                                            <span className="font-medium">{v.hotspot_profile?.name ?? '-'}</span>
                                        </td>
                                        <td className="py-2.5 px-3 font-mono font-medium">
                                            Rp {parseFloat(v.price_snapshot).toLocaleString('id-ID')}
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <span
                                                className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-medium capitalize ${
                                                    v.commercial_status === 'ready'
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                        : v.commercial_status === 'sold'
                                                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                        : v.commercial_status === 'draft'
                                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                        : 'bg-muted text-muted-foreground'
                                                }`}
                                            >
                                                {v.commercial_status}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-muted-foreground text-[11px]">
                                            {v.batch?.batch_code ?? 'Manual'}
                                        </td>
                                        <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                                            {v.generated_at ? new Date(v.generated_at).toLocaleDateString('id-ID') : '-'}
                                        </td>
                                        <td className="py-2.5 px-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleReveal(v.id)}
                                                    title="View Credentials (Audited)"
                                                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    <Eye className="size-3.5" />
                                                </button>
                                                <a
                                                    href={`/print/voucher/${v.id}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title="Print Voucher Ticket"
                                                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    <Printer className="size-3.5" />
                                                </a>
                                                {v.commercial_status !== 'sold' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteVoucher(v)}
                                                        title="Hanguskan voucher ini dari MikroTik"
                                                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {vouchers.links && vouchers.links.length > 3 && (
                        <div className="p-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                                Showing {vouchers.from ?? 0} to {vouchers.to ?? 0} of {vouchers.total} vouchers
                            </span>
                            <div className="flex items-center gap-1">
                                {vouchers.links.map((link: any, idx: number) => (
                                    <Link
                                        key={idx}
                                        href={link.url ?? '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`px-2.5 py-1 rounded border text-xs ${
                                            link.active
                                                ? 'bg-primary text-primary-foreground border-primary font-medium'
                                                : link.url
                                                ? 'hover:bg-muted'
                                                : 'opacity-40 pointer-events-none'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* View / Reveal Credential Modal */}
                {revealedVoucher && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                        <div className="w-full max-w-sm rounded-lg border bg-card text-card-foreground shadow-lg overflow-hidden">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h3 className="font-semibold text-sm">Voucher Credentials</h3>
                                <button
                                    onClick={() => setRevealedVoucher(null)}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            <div className="p-4 flex flex-col gap-3 text-xs">
                                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px]">
                                    Notice: Credential reveal event has been recorded in the audit log.
                                </div>

                                <div className="grid grid-cols-2 gap-2 bg-muted/30 p-3 rounded-md border font-mono">
                                    <div>
                                        <div className="text-[10px] text-muted-foreground uppercase">Username</div>
                                        <div className="font-bold text-sm select-all">{revealedVoucher.username}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-muted-foreground uppercase">Password</div>
                                        <div className="font-bold text-sm select-all text-primary">{revealedVoucher.password}</div>
                                    </div>
                                </div>

                                <div className="space-y-1 text-muted-foreground">
                                    <div>Profile: <span className="text-foreground font-medium">{revealedVoucher.profile_name}</span></div>
                                    <div>Price: <span className="text-foreground font-medium">Rp {revealedVoucher.price.toLocaleString('id-ID')}</span></div>
                                    <div>Status: <span className="text-foreground font-medium capitalize">{revealedVoucher.status}</span></div>
                                    <div className="text-[11px] font-mono text-muted-foreground">Comment: {revealedVoucher.router_comment}</div>
                                </div>

                                <div className="pt-2 border-t flex items-center justify-end gap-2">
                                    <a
                                        href={`/print/voucher/${revealedVoucher.id}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-medium border bg-secondary hover:bg-secondary/80"
                                    >
                                        <Printer className="size-3.5" />
                                        Print Slip
                                    </a>
                                    <button
                                        onClick={() => setRevealedVoucher(null)}
                                        className="h-8 px-3 rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

HotspotVouchers.layout = {
    breadcrumbs: [
        { title: 'Hotspot', href: '/hotspot/vouchers' },
        { title: 'Vouchers', href: '/hotspot/vouchers' },
    ],
};
