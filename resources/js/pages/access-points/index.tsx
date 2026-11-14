import { Head, router, useForm } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    CheckCircle2,
    Clock,
    Plus,
    Radio,
    RefreshCw,
    Trash2,
    X,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    accessPoints: any[];
    routers: any[];
}

export default function AccessPointsIndex({ accessPoints, routers }: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [historyModalAp, setHistoryModalAp] = useState<any>(null);

    const { data, setData, post, processing, reset } = useForm({
        name: '',
        location: '',
        management_ip: '192.168.10.2',
        health_check_type: 'icmp',
        health_check_url: '',
        health_check_port: 80,
        check_interval_seconds: 60,
        timeout_ms: 2000,
        failure_threshold: 3,
        topology_mode: 'bridged_dedicated_port',
        management_router_id: routers[0]?.id ?? '',
        router_bridge_name: 'bridge1',
        router_bridge_port: 'ether2',
        notes: '',
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post('/access-points', {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    const handleCheckNow = (ap: any) => {
        router.post(`/access-points/${ap.id}/check`, {}, { preserveScroll: true });
    };

    const handleDelete = (ap: any) => {
        if (confirm(`Delete access point '${ap.name}'?`)) {
            router.delete(`/access-points/${ap.id}`);
        }
    };

    return (
        <>
            <Head title="Access Points — L-Net Access" />

            <div className="flex flex-col gap-6 p-4 md:p-6 w-full flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Access Point Monitoring</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Low-cost & unmanaged AP health monitoring (Ping, HTTP, TCP) and Layer-2 bridge port mapping.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="size-3.5" />
                        Add Access Point
                    </button>
                </div>

                {/* Table */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                                <th className="py-2.5 px-3">AP Name / Label</th>
                                <th className="py-2.5 px-3">Area / Location</th>
                                <th className="py-2.5 px-3">Management IP</th>
                                <th className="py-2.5 px-3">Check Method</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3">Latency</th>
                                <th className="py-2.5 px-3">Topology Mode</th>
                                <th className="py-2.5 px-3">Last Checked</th>
                                <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {accessPoints.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-8 text-center text-muted-foreground">
                                        No Access Points configured yet. Click 'Add Access Point'.
                                    </td>
                                </tr>
                            ) : (
                                accessPoints.map((ap: any) => (
                                    <tr key={ap.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-2.5 px-3 font-semibold text-foreground flex items-center gap-1.5">
                                            <Radio className="size-3.5 text-primary" />
                                            {ap.name}
                                        </td>
                                        <td className="py-2.5 px-3 text-muted-foreground">{ap.location ?? '-'}</td>
                                        <td className="py-2.5 px-3 font-mono">{ap.management_ip}</td>
                                        <td className="py-2.5 px-3 font-mono uppercase text-[11px] text-muted-foreground">
                                            {ap.health_check_type}
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                                                    ap.status === 'online'
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                        : ap.status === 'degraded'
                                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                }`}
                                            >
                                                <span className={`size-1.5 rounded-full ${
                                                    ap.status === 'online' ? 'bg-emerald-500' :
                                                    ap.status === 'degraded' ? 'bg-amber-500' : 'bg-rose-500'
                                                }`} />
                                                {ap.status}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 font-mono font-medium">
                                            {ap.last_response_ms ? `${ap.last_response_ms}ms` : '-'}
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                                {ap.topology_mode === 'bridged_dedicated_port'
                                                    ? `Port: ${ap.router_bridge_port ?? 'dedicated'}`
                                                    : ap.topology_mode}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                                            {ap.last_checked_at ? new Date(ap.last_checked_at).toLocaleTimeString('id-ID') : 'Never'}
                                        </td>
                                        <td className="py-2.5 px-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleCheckNow(ap)}
                                                    title="Check Now"
                                                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    <RefreshCw className="size-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setHistoryModalAp(ap)}
                                                    title="View Probe History"
                                                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    <Clock className="size-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(ap)}
                                                    title="Delete AP"
                                                    className="p-1.5 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 transition-colors"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Add AP Modal */}
                {isCreateOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                        <div className="w-full max-w-lg rounded-lg border bg-card text-card-foreground shadow-lg overflow-hidden">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h3 className="font-semibold text-sm">Add Access Point</h3>
                                <button onClick={() => setIsCreateOpen(false)} className="text-muted-foreground hover:text-foreground">
                                    <X className="size-4" />
                                </button>
                            </div>
                            <form onSubmit={handleCreate} className="p-4 flex flex-col gap-3 text-xs">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="font-medium text-muted-foreground">AP Name / Label</label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. AP-Kantor-Lt2"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background"
                                        />
                                    </div>
                                    <div>
                                        <label className="font-medium text-muted-foreground">Area / Location</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Lobby Lt. 2"
                                            value={data.location}
                                            onChange={(e) => setData('location', e.target.value)}
                                            className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="font-medium text-muted-foreground">Management IP</label>
                                        <input
                                            type="text"
                                            required
                                            value={data.management_ip}
                                            onChange={(e) => setData('management_ip', e.target.value)}
                                            className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="font-medium text-muted-foreground">Probe Check Type</label>
                                        <select
                                            value={data.health_check_type}
                                            onChange={(e) => setData('health_check_type', e.target.value)}
                                            className="mt-1 w-full text-xs h-8 px-2 rounded border bg-background"
                                        >
                                            <option value="icmp">ICMP Ping (Direct IP Echo)</option>
                                            <option value="http">HTTP GET (Web Management UI)</option>
                                            <option value="https">HTTPS GET</option>
                                            <option value="tcp">TCP Connect (Port check)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="border-t pt-3">
                                    <div className="font-semibold text-xs mb-2">Topology & Client Mapping (MikroTik Bridge)</div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="font-medium text-muted-foreground">Topology Mode</label>
                                            <select
                                                value={data.topology_mode}
                                                onChange={(e) => setData('topology_mode', e.target.value)}
                                                className="mt-1 w-full text-xs h-8 px-2 rounded border bg-background"
                                            >
                                                <option value="bridged_dedicated_port">Dedicated Bridge Port (Reliable mapping)</option>
                                                <option value="bridged_shared_uplink">Shared Switch Uplink (Unknown AP)</option>
                                                <option value="router_nat">Router / NAT Mode (Unavailable)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="font-medium text-muted-foreground">MikroTik Bridge Port</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. ether2 or ether3"
                                                value={data.router_bridge_port}
                                                onChange={(e) => setData('router_bridge_port', e.target.value)}
                                                className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 border-t flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreateOpen(false)}
                                        className="h-8 px-3 rounded text-xs font-medium text-muted-foreground hover:bg-muted"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="h-8 px-4 rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        Save & Test AP
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Health Checks History Modal */}
                {historyModalAp && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                        <div className="w-full max-w-md rounded-lg border bg-card text-card-foreground shadow-lg overflow-hidden">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h3 className="font-semibold text-sm">Probe History: {historyModalAp.name}</h3>
                                <button onClick={() => setHistoryModalAp(null)} className="text-muted-foreground hover:text-foreground">
                                    <X className="size-4" />
                                </button>
                            </div>
                            <div className="p-4 max-h-[350px] overflow-y-auto">
                                <div className="divide-y divide-border">
                                    {(!historyModalAp.health_checks || historyModalAp.health_checks.length === 0) ? (
                                        <div className="py-6 text-center text-muted-foreground text-xs">No probe logs recorded yet.</div>
                                    ) : (
                                        historyModalAp.health_checks.map((hc: any) => (
                                            <div key={hc.id} className="py-2 flex items-center justify-between text-xs font-mono">
                                                <div className="flex items-center gap-2">
                                                    <span className={`size-2 rounded-full ${
                                                        hc.status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'
                                                    }`} />
                                                    <span>{hc.check_type.toUpperCase()}</span>
                                                    <span className="text-muted-foreground">{hc.response_ms ? `${hc.response_ms}ms` : 'FAIL'}</span>
                                                </div>
                                                <span className="text-muted-foreground text-[11px]">
                                                    {new Date(hc.checked_at).toLocaleTimeString('id-ID')}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            <div className="p-3 border-t bg-muted/20 flex justify-end">
                                <button
                                    onClick={() => setHistoryModalAp(null)}
                                    className="h-8 px-3 rounded text-xs font-medium bg-primary text-primary-foreground"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

AccessPointsIndex.layout = {
    breadcrumbs: [
        { title: 'Access Points', href: '/access-points' },
    ],
};
