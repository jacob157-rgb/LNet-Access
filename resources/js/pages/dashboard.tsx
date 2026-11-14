import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    AlertTriangle,
    CheckCircle2,
    Clock,
    Cpu,
    HardDrive,
    Layers,
    Radio,
    RefreshCw,
    Server,
    ShoppingCart,
    Ticket,
    Wifi,
    XCircle,
} from 'lucide-react';

interface Props {
    routers: any[];
    currentRouter: any;
    hotspotActiveCount: number;
    pppoeActiveCount: number;
    activeSessions: any[];
    voucherStats: {
        ready: number;
        sold: number;
        draft: number;
        total: number;
    };
    salesToday: number;
    salesCountToday: number;
    apStats: {
        total: number;
        online: number;
        degraded: number;
        offline: number;
    };
    recentIssues: any[];
    recentAudit: any[];
}

export default function Dashboard({
    routers,
    currentRouter,
    hotspotActiveCount,
    pppoeActiveCount,
    activeSessions,
    voucherStats,
    salesToday,
    salesCountToday,
    apStats,
    recentIssues,
    recentAudit,
}: Props) {
    const handleRouterChange = (routerId: string) => {
        router.get('/dashboard', { router_id: routerId }, { preserveState: true });
    };

    const handleSync = () => {
        if (!currentRouter) return;
        router.post(`/routers/${currentRouter.id}/sync`, {}, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Dashboard — L-Net Access" />

            <div className="flex flex-col gap-6 p-4 md:p-6 w-full flex-1">
                {/* Router Health Strip */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-lg border bg-card text-card-foreground shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-muted">
                            <Server className="size-5 text-muted-foreground" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-base">
                                    {currentRouter ? currentRouter.name : 'No Router Connected'}
                                </span>
                                {currentRouter && (
                                    <span
                                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                                            currentRouter.connection_status === 'online'
                                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                : currentRouter.connection_status === 'stale'
                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                        }`}
                                    >
                                        <span className={`size-1.5 rounded-full ${
                                            currentRouter.connection_status === 'online' ? 'bg-emerald-500' :
                                            currentRouter.connection_status === 'stale' ? 'bg-amber-500' : 'bg-rose-500'
                                        }`} />
                                        {currentRouter.connection_status.toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono flex flex-wrap items-center gap-x-4 gap-y-1 mt-0.5">
                                <span>Host: {currentRouter?.host}:{currentRouter?.port}</span>
                                <span>Identity: {currentRouter?.router_identity ?? '-'}</span>
                                <span>ROS: {currentRouter?.routeros_version ?? '-'}</span>
                                <span>Transport: {currentRouter?.transport?.toUpperCase() ?? '-'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        {currentRouter && (
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1" title="CPU Load">
                                    <Cpu className="size-3.5 text-muted-foreground" />
                                    <span className="font-mono font-medium">{currentRouter.cpu_load ?? 0}%</span>
                                </div>
                                <div className="flex items-center gap-1" title="Uptime">
                                    <Clock className="size-3.5 text-muted-foreground" />
                                    <span className="font-mono">{currentRouter.uptime ?? '-'}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-2">
                            {routers.length > 1 && (
                                <select
                                    value={currentRouter?.id ?? ''}
                                    onChange={(e) => handleRouterChange(e.target.value)}
                                    className="text-xs h-8 px-2 rounded border bg-background text-foreground"
                                >
                                    {routers.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                            )}

                            {currentRouter && (
                                <button
                                    onClick={handleSync}
                                    className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded text-xs font-medium border bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                                >
                                    <RefreshCw className="size-3.5" />
                                    Sync
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* KPI Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Active Sessions */}
                    <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-xs">
                        <div className="flex items-center justify-between text-muted-foreground mb-2">
                            <span className="text-xs font-medium">Hotspot Active</span>
                            <Activity className="size-4 text-emerald-500" />
                        </div>
                        <div className="text-2xl font-bold font-mono tracking-tight">{hotspotActiveCount}</div>
                        <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
                            <span>PPPoE Active: <span className="font-mono font-medium">{pppoeActiveCount}</span></span>
                            <Link href="/hotspot/sessions" className="text-primary hover:underline">View live</Link>
                        </div>
                    </div>

                    {/* Vouchers Ready */}
                    <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-xs">
                        <div className="flex items-center justify-between text-muted-foreground mb-2">
                            <span className="text-xs font-medium">Ready Vouchers</span>
                            <Ticket className="size-4 text-primary" />
                        </div>
                        <div className="text-2xl font-bold font-mono tracking-tight">{voucherStats.ready}</div>
                        <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
                            <span>Sold: <span className="font-mono font-medium">{voucherStats.sold}</span></span>
                            <Link href="/hotspot/vouchers" className="text-primary hover:underline">Manage</Link>
                        </div>
                    </div>

                    {/* Sales Today */}
                    <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-xs">
                        <div className="flex items-center justify-between text-muted-foreground mb-2">
                            <span className="text-xs font-medium">Sales Today</span>
                            <ShoppingCart className="size-4 text-primary" />
                        </div>
                        <div className="text-2xl font-bold font-mono tracking-tight">
                            Rp {salesToday.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
                            <span>{salesCountToday} transactions</span>
                            <Link href="/sales/create" className="text-primary hover:underline">New Sale</Link>
                        </div>
                    </div>

                    {/* Access Points Status */}
                    <div className="p-4 rounded-lg border bg-card text-card-foreground shadow-xs">
                        <div className="flex items-center justify-between text-muted-foreground mb-2">
                            <span className="text-xs font-medium">Access Points</span>
                            <Radio className="size-4 text-muted-foreground" />
                        </div>
                        <div className="text-2xl font-bold font-mono tracking-tight">{apStats.total}</div>
                        <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-2">
                            <span className="text-emerald-600 font-mono">{apStats.online} on</span>
                            <span>•</span>
                            <span className="text-amber-600 font-mono">{apStats.degraded} deg</span>
                            <span>•</span>
                            <span className="text-rose-600 font-mono">{apStats.offline} off</span>
                        </div>
                    </div>
                </div>

                {/* Active Sessions & Open Issues Two-Column Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Live Sessions Table */}
                    <div className="lg:col-span-2 rounded-lg border bg-card text-card-foreground shadow-xs flex flex-col">
                        <div className="p-4 border-b flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold">Recent Active Sessions</h3>
                                <p className="text-xs text-muted-foreground">Observed client connections and AP mappings</p>
                            </div>
                            <Link href="/hotspot/sessions" className="text-xs font-medium text-primary hover:underline">
                                View all ({hotspotActiveCount})
                            </Link>
                        </div>

                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                                        <th className="py-2.5 px-3">User / Account</th>
                                        <th className="py-2.5 px-3">IP Address</th>
                                        <th className="py-2.5 px-3">Observed MAC</th>
                                        <th className="py-2.5 px-3">Mapped AP</th>
                                        <th className="py-2.5 px-3 text-right">Uptime</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {activeSessions.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-6 text-center text-muted-foreground">
                                                No active sessions on this router.
                                            </td>
                                        </tr>
                                    ) : (
                                        activeSessions.map((sess) => (
                                            <tr key={sess.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-2.5 px-3 font-mono font-medium">{sess.username}</td>
                                                <td className="py-2.5 px-3 font-mono text-muted-foreground">{sess.ip_address ?? '-'}</td>
                                                <td className="py-2.5 px-3 font-mono text-muted-foreground">{sess.observed_mac ?? '-'}</td>
                                                <td className="py-2.5 px-3">
                                                    <span className={`inline-flex px-1.5 py-0.5 rounded text-[11px] ${
                                                        sess.ap_name !== 'Unknown AP'
                                                            ? 'bg-secondary font-medium text-secondary-foreground'
                                                            : 'text-muted-foreground'
                                                    }`}>
                                                        {sess.ap_name}
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 font-mono text-right text-muted-foreground">{sess.uptime}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Open Reconciliation Issues */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-xs flex flex-col">
                        <div className="p-4 border-b flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-semibold">Reconciliation Issues</h3>
                                <p className="text-xs text-muted-foreground">State drift between DB and RouterOS</p>
                            </div>
                            <Link href="/reconciliation" className="text-xs font-medium text-primary hover:underline">
                                Review
                            </Link>
                        </div>

                        <div className="p-4 flex-1 divide-y divide-border">
                            {recentIssues.length === 0 ? (
                                <div className="py-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                                    <CheckCircle2 className="size-6 text-emerald-500" />
                                    <span className="text-xs">All records in sync with RouterOS.</span>
                                </div>
                            ) : (
                                recentIssues.map((issue) => (
                                    <div key={issue.id} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <AlertTriangle className="size-3.5 text-amber-500" />
                                                <span className="text-xs font-medium">
                                                    {issue.issue_type.replace(/_/g, ' ')}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-muted-foreground mt-0.5">
                                                Entity: {issue.entity_type} #{issue.local_entity_id}
                                            </div>
                                        </div>
                                        <Link
                                            href="/reconciliation"
                                            className="text-xs font-medium text-primary hover:underline"
                                        >
                                            Fix
                                        </Link>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Audit Log */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-xs">
                    <div className="p-4 border-b flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-semibold">Audit Trail</h3>
                            <p className="text-xs text-muted-foreground">Recent operator and system events</p>
                        </div>
                        <Link href="/audit-logs" className="text-xs font-medium text-primary hover:underline">
                            Full Log
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                                    <th className="py-2.5 px-3">Timestamp</th>
                                    <th className="py-2.5 px-3">Actor</th>
                                    <th className="py-2.5 px-3">Action</th>
                                    <th className="py-2.5 px-3">Entity</th>
                                    <th className="py-2.5 px-3">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {recentAudit.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-6 text-center text-muted-foreground">
                                            No audit records logged yet.
                                        </td>
                                    </tr>
                                ) : (
                                    recentAudit.map((log) => (
                                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-2.5 px-3 font-mono text-muted-foreground">{new Date(log.created_at).toLocaleTimeString('id-ID')}</td>
                                            <td className="py-2.5 px-3 font-medium">{log.actor?.name ?? 'System'}</td>
                                            <td className="py-2.5 px-3">
                                                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted">
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-muted-foreground">{log.entity_type}</td>
                                            <td className="py-2.5 px-3 font-mono text-muted-foreground">{log.ip_address ?? '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
    ],
};
