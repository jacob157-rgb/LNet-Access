import { Head, router } from '@inertiajs/react';
import { History, Search } from 'lucide-react';
import { useState } from 'react';

interface Props {
    logs: any;
    filters: {
        action?: string;
        entity_type?: string;
    };
}

export default function AuditIndex({ logs, filters }: Props) {
    const [action, setAction] = useState(filters.action ?? '');
    const [entityType, setEntityType] = useState(filters.entity_type ?? '');

    const handleFilter = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get('/audit-logs', { action: action || undefined, entity_type: entityType || undefined }, { preserveState: true });
    };

    return (
        <>
            <Head title="Audit Trail — L-Net Access" />

            <div className="flex flex-col gap-6 p-4 md:p-6 w-full flex-1">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">System Audit Trail</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Immutable record of administrative actions, credential reveals, prints, and router writes.
                    </p>
                </div>

                {/* Filter */}
                <form onSubmit={handleFilter} className="flex items-center gap-2 max-w-md">
                    <select
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        className="text-xs h-8 px-2 rounded border bg-background"
                    >
                        <option value="">All Actions</option>
                        <option value="create">Create</option>
                        <option value="sale">Sale</option>
                        <option value="void_sale">Void Sale</option>
                        <option value="reveal_credential">Reveal Credential</option>
                        <option value="print_voucher">Print Voucher</option>
                        <option value="disconnect">Disconnect Session</option>
                        <option value="repair">Reconciliation Repair</option>
                    </select>

                    <select
                        value={entityType}
                        onChange={(e) => setEntityType(e.target.value)}
                        className="text-xs h-8 px-2 rounded border bg-background"
                    >
                        <option value="">All Entity Types</option>
                        <option value="voucher">Voucher</option>
                        <option value="sale">Sale</option>
                        <option value="member">Member</option>
                        <option value="hotspot_user">Hotspot User</option>
                        <option value="hotspot_session">Hotspot Session</option>
                        <option value="ppp_secret">PPP Secret</option>
                    </select>

                    <button
                        type="submit"
                        className="h-8 px-3 rounded text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    >
                        Filter
                    </button>
                </form>

                {/* Table */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                                <th className="py-2.5 px-3">Timestamp</th>
                                <th className="py-2.5 px-3">Actor</th>
                                <th className="py-2.5 px-3">Action</th>
                                <th className="py-2.5 px-3">Entity Type</th>
                                <th className="py-2.5 px-3">Entity ID</th>
                                <th className="py-2.5 px-3">Details (Diff)</th>
                                <th className="py-2.5 px-3 text-right">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {logs.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                                        No audit entries match the criteria.
                                    </td>
                                </tr>
                            ) : (
                                logs.data.map((log: any) => (
                                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-2.5 px-3 font-mono text-muted-foreground">
                                            {new Date(log.created_at).toLocaleString('id-ID')}
                                        </td>
                                        <td className="py-2.5 px-3 font-semibold text-foreground">
                                            {log.actor?.name ?? 'System'}
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted">
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-muted-foreground">{log.entity_type}</td>
                                        <td className="py-2.5 px-3 font-mono text-muted-foreground">
                                            {log.entity_id ? `#${log.entity_id}` : '-'}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground max-w-xs truncate">
                                            {JSON.stringify(log.after_json ?? log.before_json ?? {})}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-muted-foreground text-right">
                                            {log.ip_address ?? '-'}
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

AuditIndex.layout = {
    breadcrumbs: [
        { title: 'Audit Trail', href: '/audit-logs' },
    ],
};
