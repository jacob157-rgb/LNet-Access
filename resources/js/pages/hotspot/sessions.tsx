import { Head, router } from '@inertiajs/react';
import { Activity, Power, RefreshCw, Search } from 'lucide-react';
import { useState } from 'react';

interface Props {
    routers: any[];
    selectedRouterId: number;
    sessions: any;
}

export default function HotspotSessions({ routers, selectedRouterId, sessions }: Props) {
    const [search, setSearch] = useState('');

    const handleRouterChange = (id: string) => {
        router.get('/hotspot/sessions', { router_id: id }, { preserveState: true });
    };

    const handleDisconnect = (session: any) => {
        if (confirm(`Disconnect active session for user '${session.username}'?`)) {
            router.delete(`/hotspot/sessions/${session.id}`);
        }
    };

    const handleRefresh = () => {
        if (!selectedRouterId) return;
        router.post(`/routers/${selectedRouterId}/sync`, {}, { preserveScroll: true });
    };

    const filtered = sessions.data.filter((s: any) =>
        s.username.toLowerCase().includes(search.toLowerCase()) ||
        (s.observed_mac && s.observed_mac.toLowerCase().includes(search.toLowerCase())) ||
        (s.ip_address && s.ip_address.includes(search))
    );

    return (
        <>
            <Head title="Active Hotspot Sessions — L-Net Access" />

            <div className="flex flex-col gap-6 p-4 md:p-6 w-full flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Active Hotspot Sessions</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Live authenticated clients on RouterOS with AP topology mapping.
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
                            onClick={handleRefresh}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-medium border bg-secondary hover:bg-secondary/80 transition-colors"
                        >
                            <RefreshCw className="size-3.5" />
                            Refresh Live State
                        </button>
                    </div>
                </div>

                {/* Filter */}
                <div className="relative max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by username, MAC, or IP..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-8 pr-2.5 text-xs h-8 rounded border bg-background"
                    />
                </div>

                {/* Sessions Table */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                                <th className="py-2.5 px-3">Username / Account</th>
                                <th className="py-2.5 px-3">IP Address</th>
                                <th className="py-2.5 px-3">Observed MAC</th>
                                <th className="py-2.5 px-3">Mapped AP (Topology)</th>
                                <th className="py-2.5 px-3">Traffic (Down / Up)</th>
                                <th className="py-2.5 px-3">Uptime</th>
                                <th className="py-2.5 px-3 text-right">Disconnect</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                                        No active sessions found.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((s: any) => (
                                    <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                                            {s.username}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-muted-foreground">
                                            {s.ip_address ?? '-'}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-muted-foreground">
                                            {s.observed_mac ?? '-'}
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[11px] ${
                                                s.access_point?.name
                                                    ? 'bg-primary/10 text-primary font-medium'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}>
                                                {s.access_point?.name ?? 'Unknown AP'}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                                            {(s.bytes_in / (1024 * 1024)).toFixed(1)} MB / {(s.bytes_out / (1024 * 1024)).toFixed(1)} MB
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-muted-foreground">
                                            {s.raw_attributes_json?.uptime ?? '-'}
                                        </td>
                                        <td className="py-2.5 px-3 text-right">
                                            <button
                                                onClick={() => handleDisconnect(s)}
                                                title="Disconnect session"
                                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium border border-rose-500/20 text-rose-600 hover:bg-rose-500/10 transition-colors"
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
            </div>
        </>
    );
}

HotspotSessions.layout = {
    breadcrumbs: [
        { title: 'Hotspot', href: '/hotspot/vouchers' },
        { title: 'Active Sessions', href: '/hotspot/sessions' },
    ],
};
