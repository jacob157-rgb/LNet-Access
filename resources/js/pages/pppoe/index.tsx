import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Activity,
    Eye,
    EyeOff,
    KeyRound,
    Network,
    Plus,
    Power,
    RefreshCw,
    Search,
    Shield,
    Trash2,
    User,
    X,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    routers: any[];
    selectedRouterId: number;
    accounts: any;
    activeSessions: any[];
    profiles: any[];
    members: any[];
}

export default function PppoeIndex({
    routers,
    selectedRouterId,
    accounts,
    activeSessions,
    profiles,
    members,
}: Props) {
    const [activeTab, setActiveTab] = useState<'accounts' | 'sessions' | 'profiles'>('accounts');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [revealedPasswords, setRevealedPasswords] = useState<Record<number, boolean>>({});
    const [syncing, setSyncing] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        router_id: selectedRouterId || (routers[0]?.id ?? ''),
        username: '',
        password: '',
        profile_name: profiles[0]?.name ?? '10M',
        caller_id: '',
        remote_address: '',
        comment: '',
        member_id: '',
    });

    const handleRouterChange = (id: string) => {
        router.get('/pppoe', { router_id: id }, { preserveState: true });
    };

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post('/pppoe', {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    const handleDisconnect = (session: any) => {
        if (confirm(`Putus sesi aktif PPPoE untuk '${session.username}'?`)) {
            router.delete(`/pppoe/sessions/${session.id}`);
        }
    };

    const handleToggleAccount = (acc: any) => {
        const action = acc.last_router_state === 'enabled' ? 'Nonaktifkan' : 'Aktifkan';
        if (confirm(`${action} akun PPPoE '${acc.username}'?`)) {
            router.patch(`/pppoe/accounts/${acc.id}/toggle`);
        }
    };

    const handleDeleteAccount = (acc: any) => {
        if (confirm(`Hapus akun PPPoE '${acc.username}'? Akun ini akan dihapus permanen dari MikroTik & database.`)) {
            router.delete(`/pppoe/accounts/${acc.id}`);
        }
    };

    const handleSync = () => {
        if (!selectedRouterId) return;
        setSyncing(true);
        router.post(`/pppoe/${selectedRouterId}/sync`, {}, {
            onFinish: () => setSyncing(false),
        });
    };

    const togglePasswordVisibility = (id: number) => {
        setRevealedPasswords((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    return (
        <>
            <Head title="PPPoE Accounts & Sessions — L-Net Access" />

            <div className="flex flex-col gap-6 p-4 md:p-6 w-full flex-1">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">PPPoE Management</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Kelola akun PPPoE pelanggan rumah, sesi aktif, dan sinkronisasi langsung dengan MikroTik.
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
                            Sync dari MikroTik
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsCreateOpen(true)}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="size-3.5" />
                            Buat Akun PPPoE Baru
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-b flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-medium">
                        {[
                            { id: 'accounts', label: `Akun PPPoE (${accounts.total ?? accounts.data?.length ?? 0})` },
                            { id: 'sessions', label: `Sesi Aktif (${activeSessions.length})` },
                            { id: 'profiles', label: `PPP Profiles (${profiles.length})` },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`pb-2 px-3 border-b-2 font-medium transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab: Accounts */}
                {activeTab === 'accounts' && (
                    <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                                    <th className="py-2.5 px-3">Username</th>
                                    <th className="py-2.5 px-3">Password</th>
                                    <th className="py-2.5 px-3">Profile</th>
                                    <th className="py-2.5 px-3">Pelanggan / Member</th>
                                    <th className="py-2.5 px-3">Caller-ID Lock</th>
                                    <th className="py-2.5 px-3">Catatan / Keterangan</th>
                                    <th className="py-2.5 px-3">Status</th>
                                    <th className="py-2.5 px-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {accounts.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-8 text-center text-muted-foreground">
                                            Tidak ada akun PPPoE yang terdaftar. Klik "Sync dari MikroTik" untuk mengambil akun yang ada.
                                        </td>
                                    </tr>
                                ) : (
                                    accounts.data.map((acc: any) => {
                                        const isRevealed = revealedPasswords[acc.id] ?? false;
                                        const isEnabled = acc.last_router_state === 'enabled';
                                        return (
                                            <tr
                                                key={acc.id}
                                                className={`hover:bg-muted/30 transition-colors ${
                                                    !isEnabled ? 'opacity-60 bg-muted/10' : ''
                                                }`}
                                            >
                                                <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                                                    {acc.username}
                                                </td>
                                                <td className="py-2.5 px-3 font-mono">
                                                    <div className="flex items-center gap-1.5">
                                                        <span>{isRevealed ? acc.password_encrypted : '••••••••'}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => togglePasswordVisibility(acc.id)}
                                                            className="text-muted-foreground hover:text-foreground"
                                                        >
                                                            {isRevealed ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="py-2.5 px-3 font-medium">
                                                    <span className="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px]">
                                                        {acc.profile_name}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    {acc.member?.name ?? (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </td>
                                                <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                                                    {acc.raw_attributes_json?.['caller-id'] || '-'}
                                                </td>
                                                <td className="py-2.5 px-3 text-muted-foreground text-[11px] max-w-[200px] truncate">
                                                    {acc.notes ?? '-'}
                                                </td>
                                                <td className="py-2.5 px-3">
                                                    <span
                                                        className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-medium capitalize ${
                                                            isEnabled
                                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                        }`}
                                                    >
                                                        {isEnabled ? 'Aktif' : 'Nonaktif'}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleAccount(acc)}
                                                            title={isEnabled ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                                                            className={`p-1.5 rounded border text-[11px] font-medium transition-colors ${
                                                                isEnabled
                                                                    ? 'text-amber-600 hover:bg-amber-500/10 border-amber-500/30'
                                                                    : 'text-emerald-600 hover:bg-emerald-500/10 border-emerald-500/30'
                                                            }`}
                                                        >
                                                            <Power className="size-3" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteAccount(acc)}
                                                            title="Hapus Akun dari MikroTik & Database"
                                                            className="p-1.5 rounded border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                                                        >
                                                            <Trash2 className="size-3" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Tab: Active Sessions */}
                {activeTab === 'sessions' && (
                    <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                                    <th className="py-2.5 px-3">User / Account</th>
                                    <th className="py-2.5 px-3">IP Address</th>
                                    <th className="py-2.5 px-3">Caller-ID (MAC)</th>
                                    <th className="py-2.5 px-3">Interface</th>
                                    <th className="py-2.5 px-3">Uptime</th>
                                    <th className="py-2.5 px-3 text-right">Putus Sesi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {activeSessions.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                                            Tidak ada sesi PPPoE yang aktif saat ini.
                                        </td>
                                    </tr>
                                ) : (
                                    activeSessions.map((s: any) => (
                                        <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                                                {s.username}
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-foreground font-medium">
                                                {s.ip_address ?? '-'}
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-muted-foreground">
                                                {s.observed_mac ?? '-'}
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                                                {s.interface_name ?? '-'}
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                                                {s.raw_attributes_json?.uptime ?? '-'}
                                            </td>
                                            <td className="py-2.5 px-3 text-right">
                                                <button
                                                    onClick={() => handleDisconnect(s)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 transition-colors"
                                                >
                                                    <Power className="size-3" />
                                                    Disconnect
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Tab: PPP Profiles */}
                {activeTab === 'profiles' && (
                    <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                                    <th className="py-2.5 px-3">Profile Name</th>
                                    <th className="py-2.5 px-3">Local Address</th>
                                    <th className="py-2.5 px-3">Remote Address</th>
                                    <th className="py-2.5 px-3">Rate Limit</th>
                                    <th className="py-2.5 px-3 text-right">Object ID</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {profiles.map((p: any) => (
                                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-2.5 px-3 font-bold">{p.name}</td>
                                        <td className="py-2.5 px-3 font-mono text-muted-foreground">
                                            {p.local_address ?? '-'}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-muted-foreground">
                                            {p.remote_address ?? '-'}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono font-medium text-emerald-600">
                                            {p.rate_limit ?? 'Unlimited'}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground text-right">
                                            {p.router_object_id}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Create PPPoE Secret Modal */}
                {isCreateOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                        <div className="w-full max-w-md rounded-lg border bg-card text-card-foreground shadow-lg overflow-hidden">
                            <div className="p-4 border-b flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Network className="size-4 text-primary" />
                                    <h3 className="font-semibold text-sm">Buat Akun PPPoE Baru</h3>
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

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="font-medium text-muted-foreground">
                                            Username <span className="text-destructive">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. agung"
                                            value={data.username}
                                            onChange={(e) => setData('username', e.target.value)}
                                            className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background font-mono"
                                        />
                                        {errors.username && (
                                            <p className="text-destructive text-[11px] mt-1">{errors.username}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="font-medium text-muted-foreground">
                                            Password <span className="text-destructive">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. secret123"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background font-mono"
                                        />
                                        {errors.password && (
                                            <p className="text-destructive text-[11px] mt-1">{errors.password}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="font-medium text-muted-foreground">
                                        PPP Profile <span className="text-destructive">*</span>
                                    </label>
                                    <select
                                        value={data.profile_name}
                                        onChange={(e) => setData('profile_name', e.target.value)}
                                        className="mt-1 w-full text-xs h-8 px-2 rounded border bg-background"
                                    >
                                        {profiles.map((p) => (
                                            <option key={p.id} value={p.name}>
                                                {p.name} {p.rate_limit ? `(${p.rate_limit})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="font-medium text-muted-foreground">
                                            Caller-ID / MAC Lock (Opsional)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 00:11:22:33:44:55"
                                            value={data.caller_id}
                                            onChange={(e) => setData('caller_id', e.target.value)}
                                            className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="font-medium text-muted-foreground">
                                            IP Statis / Remote (Opsional)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 30.20.10.250"
                                            value={data.remote_address}
                                            onChange={(e) => setData('remote_address', e.target.value)}
                                            className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="font-medium text-muted-foreground">
                                        Catatan / Keterangan Pelanggan
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: PPPoE Rumahan - Pak Budi"
                                        value={data.comment}
                                        onChange={(e) => setData('comment', e.target.value)}
                                        className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background"
                                    />
                                </div>

                                <div>
                                    <label className="font-medium text-muted-foreground">
                                        Kaitkan dengan Member (Opsional)
                                    </label>
                                    <select
                                        value={data.member_id}
                                        onChange={(e) => setData('member_id', e.target.value)}
                                        className="mt-1 w-full text-xs h-8 px-2 rounded border bg-background"
                                    >
                                        <option value="">Tidak dikaitkan / Standalone</option>
                                        {members.map((m) => (
                                            <option key={m.id} value={m.id}>
                                                {m.name} ({m.phone})
                                            </option>
                                        ))}
                                    </select>
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

PppoeIndex.layout = {
    breadcrumbs: [{ title: 'PPPoE', href: '/pppoe' }],
};
