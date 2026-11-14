import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Eye,
    Filter,
    Plus,
    Power,
    RefreshCw,
    Search,
    Shield,
    ShieldAlert,
    ShieldCheck,
    Trash2,
    Tv,
    X,
} from 'lucide-react';
import { useState } from 'react';

interface Binding {
    id: string;
    mac_address: string;
    address: string | null;
    to_address: string | null;
    server: string;
    type: 'bypassed' | 'regular' | 'blocked';
    disabled: boolean;
    comment: string | null;
}

interface Props {
    routers: any[];
    selectedRouterId: number;
    bindings: Binding[];
    filters: {
        search?: string;
        type?: string;
    };
    routerError?: string | null;
}

export default function HotspotIpBindings({
    routers,
    selectedRouterId,
    bindings,
    filters,
    routerError,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [typeFilter, setTypeFilter] = useState(filters.type ?? '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        router_id: selectedRouterId || (routers[0]?.id ?? ''),
        mac_address: '',
        address: '',
        to_address: '',
        type: 'bypassed',
        server: 'all',
        comment: '',
    });

    const handleRouterChange = (id: string) => {
        router.get('/hotspot/ip-bindings', { router_id: id }, { preserveState: true });
    };

    const handleFilter = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            '/hotspot/ip-bindings',
            {
                router_id: selectedRouterId,
                search: search || undefined,
                type: typeFilter || undefined,
            },
            { preserveState: true }
        );
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post('/hotspot/ip-bindings', {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    const handleToggle = (binding: Binding) => {
        router.patch(`/hotspot/ip-bindings/${binding.id}/toggle`, {
            router_id: selectedRouterId,
            disabled: !binding.disabled,
        });
    };

    const handleDelete = (binding: Binding) => {
        const desc = binding.comment ? `"${binding.comment}" (${binding.mac_address})` : binding.mac_address;
        if (confirm(`Hapus IP Binding untuk ${desc}? Tindakan ini akan langsung menghapusnya dari MikroTik.`)) {
            router.delete(`/hotspot/ip-bindings/${binding.id}`, {
                data: {
                    router_id: selectedRouterId,
                    mac_address: binding.mac_address,
                },
            });
        }
    };

    const handleSync = () => {
        setSyncing(true);
        router.reload({
            onFinish: () => setSyncing(false),
        });
    };

    const totalCount = bindings.length;
    const bypassedCount = bindings.filter((b) => b.type === 'bypassed').length;
    const regularCount = bindings.filter((b) => b.type === 'regular').length;
    const blockedCount = bindings.filter((b) => b.type === 'blocked').length;

    return (
        <>
            <Head title="Hotspot IP Bindings — L-Net Access" />

            <div className="flex flex-col gap-6 p-4 md:p-6 w-full flex-1">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Hotspot IP Bindings</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Bypass perangkat (Smart TV, CCTV, Cashier, dll) agar dapat internetan tanpa login voucher, atau blokir MAC address tertentu.
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

                        <button
                            type="button"
                            onClick={handleSync}
                            disabled={syncing}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-medium border bg-secondary hover:bg-secondary/80 transition-colors"
                        >
                            <RefreshCw className={`size-3.5 ${syncing ? 'animate-spin' : ''}`} />
                            Sync Router
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsCreateOpen(true)}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="size-3.5" />
                            Tambah IP Binding
                        </button>
                    </div>
                </div>

                {/* Router Error Warning */}
                {routerError && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive flex items-center gap-2">
                        <AlertTriangle className="size-4 shrink-0" />
                        <span>{routerError}</span>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-lg border bg-card">
                        <span className="text-muted-foreground text-[11px]">Total Bindings</span>
                        <p className="text-lg font-bold mt-0.5">{totalCount}</p>
                    </div>
                    <div className="p-3 rounded-lg border bg-card">
                        <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                            <ShieldCheck className="size-3 text-emerald-500" />
                            Bypassed (Bypass Voucher)
                        </span>
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                            {bypassedCount}
                        </p>
                    </div>
                    <div className="p-3 rounded-lg border bg-card">
                        <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                            <Shield className="size-3 text-blue-500" />
                            Regular
                        </span>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                            {regularCount}
                        </p>
                    </div>
                    <div className="p-3 rounded-lg border bg-card">
                        <span className="text-muted-foreground text-[11px] flex items-center gap-1">
                            <ShieldAlert className="size-3 text-rose-500" />
                            Blocked
                        </span>
                        <p className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                            {blockedCount}
                        </p>
                    </div>
                </div>

                {/* Filter Bar */}
                <form
                    onSubmit={handleFilter}
                    className="flex flex-wrap items-center gap-2.5 p-3 rounded-lg border bg-card text-card-foreground shadow-xs"
                >
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Cari MAC Address, IP, atau Catatan..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full text-xs h-8 pl-8 pr-3 rounded border bg-background"
                        />
                    </div>

                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="text-xs h-8 px-2.5 rounded border bg-background"
                    >
                        <option value="">Semua Tipe Binding</option>
                        <option value="bypassed">Bypassed (Bypass Login)</option>
                        <option value="regular">Regular</option>
                        <option value="blocked">Blocked (Blokir)</option>
                    </select>

                    <button
                        type="submit"
                        className="inline-flex items-center gap-1 h-8 px-3 rounded text-xs font-medium border bg-secondary hover:bg-secondary/80 transition-colors"
                    >
                        <Filter className="size-3" />
                        Filter
                    </button>
                    {(search || typeFilter) && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearch('');
                                setTypeFilter('');
                                router.get('/hotspot/ip-bindings', { router_id: selectedRouterId });
                            }}
                            className="h-8 px-2 rounded text-xs text-muted-foreground hover:text-foreground"
                        >
                            Reset
                        </button>
                    )}
                </form>

                {/* Bindings Table */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                                <th className="py-2.5 px-3">MAC Address</th>
                                <th className="py-2.5 px-3">IP Address</th>
                                <th className="py-2.5 px-3">To Address</th>
                                <th className="py-2.5 px-3">Tipe</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3">Catatan / Keterangan</th>
                                <th className="py-2.5 px-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {bindings.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                                        Tidak ada data IP Binding yang cocok.
                                    </td>
                                </tr>
                            ) : (
                                bindings.map((b) => (
                                    <tr
                                        key={b.id}
                                        className={`hover:bg-muted/30 transition-colors ${
                                            b.disabled ? 'opacity-60 bg-muted/10' : ''
                                        }`}
                                    >
                                        <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                                            {b.mac_address}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-muted-foreground">
                                            {b.address ?? '-'}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-muted-foreground">
                                            {b.to_address ?? '-'}
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <span
                                                className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-semibold capitalize ${
                                                    b.type === 'bypassed'
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                        : b.type === 'regular'
                                                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                }`}
                                            >
                                                {b.type === 'bypassed' ? 'Bypassed' : b.type}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <span
                                                className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-medium ${
                                                    b.disabled
                                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                }`}
                                            >
                                                {b.disabled ? 'Nonaktif' : 'Aktif'}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-muted-foreground text-[11px]">
                                            {b.comment ? (
                                                <span className="font-medium text-foreground">{b.comment}</span>
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="py-2.5 px-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggle(b)}
                                                    title={b.disabled ? 'Aktifkan IP Binding' : 'Nonaktifkan IP Binding'}
                                                    className={`p-1.5 rounded border text-[11px] font-medium transition-colors ${
                                                        b.disabled
                                                            ? 'text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/30'
                                                            : 'text-amber-600 hover:bg-amber-500/10 border-amber-500/30'
                                                    }`}
                                                >
                                                    <Power className="size-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(b)}
                                                    title="Hapus IP Binding dari MikroTik"
                                                    className="p-1.5 rounded border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                                                >
                                                    <Trash2 className="size-3" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Create IP Binding Modal */}
                {isCreateOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                        <div className="w-full max-w-md rounded-lg border bg-card text-card-foreground shadow-lg overflow-hidden">
                            <div className="p-4 border-b flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="size-4 text-primary" />
                                    <h3 className="font-semibold text-sm">Tambah Hotspot IP Binding</h3>
                                </div>
                                <button
                                    onClick={() => setIsCreateOpen(false)}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                            <form onSubmit={handleCreate} className="p-4 flex flex-col gap-3 text-xs">
                                <div>
                                    <label className="font-medium text-muted-foreground">Router</label>
                                    <select
                                        value={data.router_id}
                                        onChange={(e) => setData('router_id', e.target.value)}
                                        className="mt-1 w-full text-xs h-8 px-2 rounded border bg-background"
                                    >
                                        {routers.map((r) => (
                                            <option key={r.id} value={r.id}>
                                                {r.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="font-medium text-muted-foreground">
                                        MAC Address <span className="text-destructive">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Contoh: D4:61:37:13:F9:DC"
                                        value={data.mac_address}
                                        onChange={(e) => setData('mac_address', e.target.value.toUpperCase())}
                                        className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background font-mono uppercase"
                                    />
                                    {errors.mac_address && (
                                        <p className="text-destructive text-[11px] mt-1">{errors.mac_address}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="font-medium text-muted-foreground">
                                        Tipe Binding <span className="text-destructive">*</span>
                                    </label>
                                    <select
                                        value={data.type}
                                        onChange={(e) => setData('type', e.target.value as any)}
                                        className="mt-1 w-full text-xs h-8 px-2 rounded border bg-background"
                                    >
                                        <option value="bypassed">
                                            Bypassed (Direkomendasikan: Langsung Internetan Tanpa Login)
                                        </option>
                                        <option value="regular">
                                            Regular (Ikat MAC ke IP tertentu, tetap login voucher)
                                        </option>
                                        <option value="blocked">
                                            Blocked (Blokir perangkat agar tidak bisa akses)
                                        </option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="font-medium text-muted-foreground">IP Address (Opsional)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 10.20.30.52"
                                            value={data.address}
                                            onChange={(e) => {
                                                setData('address', e.target.value);
                                                if (!data.to_address) setData('to_address', e.target.value);
                                            }}
                                            className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="font-medium text-muted-foreground">To Address (Opsional)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 10.20.30.52"
                                            value={data.to_address}
                                            onChange={(e) => setData('to_address', e.target.value)}
                                            className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="font-medium text-muted-foreground">Catatan / Nama Perangkat</label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Smart TV Ruang Tamu, CCTV Depan, dll."
                                        value={data.comment}
                                        onChange={(e) => setData('comment', e.target.value)}
                                        className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background"
                                    />
                                </div>

                                <div className="pt-2 border-t flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateOpen(false)}
                                        className="h-8 px-3 rounded text-xs font-medium text-muted-foreground hover:bg-muted"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="h-8 px-4 rounded text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        Simpan ke MikroTik
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

HotspotIpBindings.layout = {
    breadcrumbs: [
        { title: 'Hotspot', href: '/hotspot/vouchers' },
        { title: 'IP Bindings', href: '/hotspot/ip-bindings' },
    ],
};
