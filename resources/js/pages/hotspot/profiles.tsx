import { Head, router } from '@inertiajs/react';
import { Clock, RefreshCw, Shield, Users, Wifi } from 'lucide-react';

interface Props {
    routers: any[];
    selectedRouterId: number;
    profiles: any[];
}

export default function HotspotProfiles({ routers, selectedRouterId, profiles }: Props) {
    const handleRouterChange = (id: string) => {
        router.get('/hotspot/profiles', { router_id: id }, { preserveState: true });
    };

    const handleSync = () => {
        if (!selectedRouterId) return;
        router.post(`/hotspot/profiles/${selectedRouterId}/sync`);
    };

    return (
        <>
            <Head title="Hotspot Profiles — L-Net Access" />

            <div className="flex flex-col gap-6 p-4 md:p-6 w-full flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Hotspot Profiles</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Mirrored from RouterOS <code className="font-mono text-xs">/ip/hotspot/user/profile</code>. Read-only in L-Net Access.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {routers.length > 1 && (
                            <select
                                value={selectedRouterId}
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

                        <button
                            onClick={handleSync}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-medium border bg-secondary hover:bg-secondary/80 transition-colors"
                        >
                            <RefreshCw className="size-3.5" />
                            Sync From Router
                        </button>
                    </div>
                </div>

                {/* Profiles Table */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                                <th className="py-2.5 px-3">Profile Name</th>
                                <th className="py-2.5 px-3">Rate Limit (Rx/Tx)</th>
                                <th className="py-2.5 px-3">Shared Users</th>
                                <th className="py-2.5 px-3">Session Timeout</th>
                                <th className="py-2.5 px-3">Idle Timeout</th>
                                <th className="py-2.5 px-3">Router Object ID</th>
                                <th className="py-2.5 px-3 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {profiles.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                                        No profiles synced for this router. Click 'Sync From Router'.
                                    </td>
                                </tr>
                            ) : (
                                profiles.map((p) => (
                                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-2.5 px-3">
                                            <div className="font-semibold flex items-center gap-1.5">
                                                <Wifi className="size-3.5 text-primary" />
                                                {p.name}
                                            </div>
                                        </td>
                                        <td className="py-2.5 px-3 font-mono font-medium text-muted-foreground">
                                            {p.rate_limit ?? 'Unlimited'}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono">
                                            <span className="inline-flex items-center gap-1">
                                                <Users className="size-3 text-muted-foreground" />
                                                {p.shared_users}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-muted-foreground">
                                            {p.session_timeout ?? '-'}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-muted-foreground">
                                            {p.idle_timeout ?? '-'}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                                            {p.router_object_id}
                                        </td>
                                        <td className="py-2.5 px-3 text-right">
                                            {p.is_present ? (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                                    Active on Router
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                                    Removed from Router
                                                </span>
                                            )}
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

HotspotProfiles.layout = {
    breadcrumbs: [
        { title: 'Hotspot', href: '/hotspot/vouchers' },
        { title: 'Profiles', href: '/hotspot/profiles' },
    ],
};
