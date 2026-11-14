import { Head, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Plus,
    RefreshCw,
    Server,
    Trash2,
    X,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    routers: any[];
}

export default function RoutersIndex({ routers }: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);
    const [testing, setTesting] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        host: '192.168.10.1',
        port: 8729,
        transport: 'api_ssl',
        username: 'admin',
        password: '',
        tls_verify: false,
    });

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch('/routers/test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as any)?.content ?? '',
                },
                body: JSON.stringify(data),
            });
            const json = await res.json();
            setTestResult(json);
        } catch (e: any) {
            setTestResult({ success: false, message: e.message });
        } finally {
            setTesting(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/routers', {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
                setTestResult(null);
            },
        });
    };

    const handleDelete = (routerObj: any) => {
        if (confirm(`Are you sure you want to delete router connection '${routerObj.name}'?`)) {
            router.delete(`/routers/${routerObj.id}`);
        }
    };

    const handleSync = (routerObj: any) => {
        router.post(`/routers/${routerObj.id}/sync`);
    };

    return (
        <>
            <Head title="Router Connections — L-Net Access" />

            <div className="flex flex-col gap-6 p-4 md:p-6 w-full flex-1">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Router Connections</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Manage MikroTik RouterOS API-SSL and API instances.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="size-3.5" />
                        Add Router
                    </button>
                </div>

                {/* Routers Table */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                                <th className="py-2.5 px-3">Router Name</th>
                                <th className="py-2.5 px-3">Management Host</th>
                                <th className="py-2.5 px-3">Transport</th>
                                <th className="py-2.5 px-3">Identity / ROS</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3">Last Sync</th>
                                <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {routers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                                        No router connections added yet.
                                    </td>
                                </tr>
                            ) : (
                                routers.map((r) => (
                                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-2.5 px-3 font-semibold">{r.name}</td>
                                        <td className="py-2.5 px-3 font-mono text-muted-foreground">
                                            {r.host}:{r.port}
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <span className="font-mono uppercase text-[11px] px-1.5 py-0.5 rounded bg-muted">
                                                {r.transport}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <div className="font-medium">{r.router_identity ?? '-'}</div>
                                            <div className="text-[11px] text-muted-foreground font-mono">{r.routeros_version ?? '-'}</div>
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                                                    r.connection_status === 'online'
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                        : r.connection_status === 'stale'
                                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                }`}
                                            >
                                                <span className={`size-1.5 rounded-full ${
                                                    r.connection_status === 'online' ? 'bg-emerald-500' :
                                                    r.connection_status === 'stale' ? 'bg-amber-500' : 'bg-rose-500'
                                                }`} />
                                                {r.connection_status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-muted-foreground font-mono text-[11px]">
                                            {r.last_sync_at ? new Date(r.last_sync_at).toLocaleString('id-ID') : 'Never'}
                                        </td>
                                        <td className="py-2.5 px-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleSync(r)}
                                                    title="Sync Router State"
                                                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    <RefreshCw className="size-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(r)}
                                                    title="Delete Router"
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

                {/* Add Router Dialog */}
                {isCreateOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                        <div className="w-full max-w-lg rounded-lg border bg-card text-card-foreground shadow-lg overflow-hidden">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h3 className="font-semibold text-sm">Add Router Connection</h3>
                                <button
                                    onClick={() => {
                                        setIsCreateOpen(false);
                                        setTestResult(null);
                                    }}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Router Label / Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. AgungTik Gateway"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background"
                                    />
                                    {errors.name && <span className="text-xs text-rose-500">{errors.name}</span>}
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <div className="col-span-2">
                                        <label className="text-xs font-medium text-muted-foreground">Management IP / Host</label>
                                        <input
                                            type="text"
                                            required
                                            value={data.host}
                                            onChange={(e) => setData('host', e.target.value)}
                                            className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Port</label>
                                        <input
                                            type="number"
                                            required
                                            value={data.port}
                                            onChange={(e) => setData('port', parseInt(e.target.value) || 8729)}
                                            className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-muted-foreground">Transport Protocol</label>
                                    <select
                                        value={data.transport}
                                        onChange={(e) => {
                                            const t = e.target.value;
                                            setData((prev) => ({
                                                ...prev,
                                                transport: t,
                                                port: t === 'api_ssl' ? 8729 : t === 'api' ? 8728 : 443,
                                            }));
                                        }}
                                        className="mt-1 w-full text-xs h-8 px-2 rounded border bg-background"
                                    >
                                        <option value="api_ssl">API-SSL (TCP 8729) — Recommended Primary</option>
                                        <option value="api">Plain API (TCP 8728) — Unencrypted fallback</option>
                                        <option value="rest">REST over HTTPS (v7.1+)</option>
                                    </select>
                                </div>

                                {data.transport === 'api' && (
                                    <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-1.5">
                                        <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                                        <span>Plain API (port 8728) sends credentials in plaintext over LAN. API-SSL is recommended.</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">API Username</label>
                                        <input
                                            type="text"
                                            required
                                            value={data.username}
                                            onChange={(e) => setData('username', e.target.value)}
                                            className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">API Password</label>
                                        <input
                                            type="password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-1">
                                    <input
                                        type="checkbox"
                                        id="tls_verify"
                                        checked={data.tls_verify}
                                        onChange={(e) => setData('tls_verify', e.target.checked)}
                                        className="size-3.5 rounded border"
                                    />
                                    <label htmlFor="tls_verify" className="text-xs text-muted-foreground cursor-pointer">
                                        Verify TLS certificate (Disable for self-signed development certificates)
                                    </label>
                                </div>

                                {/* Test Connection Report */}
                                {testResult && (
                                    <div
                                        className={`p-3 rounded text-xs border ${
                                            testResult.success
                                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                                : 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5 font-semibold">
                                            {testResult.success ? (
                                                <CheckCircle2 className="size-4" />
                                            ) : (
                                                <XCircle className="size-4" />
                                            )}
                                            {testResult.message}
                                        </div>
                                        {testResult.capabilities && (
                                            <div className="mt-1.5 grid grid-cols-2 gap-x-2 text-[11px] font-mono opacity-90">
                                                <span>ROS: {testResult.capabilities.version}</span>
                                                <span>Board: {testResult.capabilities.board_name}</span>
                                                <span>Hotspot: {testResult.capabilities.hotspot_supported ? 'Yes' : 'No'}</span>
                                                <span>PPPoE: {testResult.capabilities.pppoe_supported ? 'Yes' : 'No'}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="pt-2 border-t flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={handleTest}
                                        disabled={testing}
                                        className="h-8 px-3 rounded text-xs font-medium border bg-secondary hover:bg-secondary/80 disabled:opacity-50"
                                    >
                                        {testing ? 'Testing...' : 'Test Connection'}
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsCreateOpen(false);
                                                setTestResult(null);
                                            }}
                                            className="h-8 px-3 rounded text-xs font-medium text-muted-foreground hover:bg-muted"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="h-8 px-4 rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                        >
                                            Save Router
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

RoutersIndex.layout = {
    breadcrumbs: [
        {
            title: 'Router Connections',
            href: '/routers',
        },
    ],
};
