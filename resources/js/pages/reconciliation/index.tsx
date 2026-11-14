import { Head, router } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, RefreshCw, Wrench, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
    routers: any[];
    selectedRouterId: number;
    issues: any;
}

export default function ReconciliationIndex({ routers, selectedRouterId, issues }: Props) {
    const [repairIssue, setRepairIssue] = useState<any>(null);
    const [repairNote, setRepairNote] = useState('');

    const handleRouterChange = (id: string) => {
        router.get('/reconciliation', { router_id: id }, { preserveState: true });
    };

    const handleRunReconciliation = () => {
        if (!selectedRouterId) return;
        router.post(`/reconciliation/${selectedRouterId}/run`);
    };

    const handleExecuteRepair = (action: 'recreate' | 'ignore') => {
        if (!repairIssue) return;
        router.post(`/reconciliation/${repairIssue.id}/repair`, {
            action,
            note: repairNote,
        }, {
            onSuccess: () => {
                setRepairIssue(null);
                setRepairNote('');
            },
        });
    };

    return (
        <>
            <Head title="Reconciliation — L-Net Access" />

            <div className="flex flex-col gap-6 p-4 md:p-6 w-full flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">State Reconciliation</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Compare expected Laravel records with live RouterOS users and repair state drift.
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
                            onClick={handleRunReconciliation}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            <RefreshCw className="size-3.5" />
                            Run Reconciliation Now
                        </button>
                    </div>
                </div>

                {/* Issues Table */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                                <th className="py-2.5 px-3">Issue Type</th>
                                <th className="py-2.5 px-3">Entity</th>
                                <th className="py-2.5 px-3">Severity</th>
                                <th className="py-2.5 px-3">Expected State (DB)</th>
                                <th className="py-2.5 px-3">Actual State (RouterOS)</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {issues.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-10 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-1.5">
                                            <CheckCircle2 className="size-6 text-emerald-500" />
                                            <span className="font-semibold text-foreground">No reconciliation issues detected.</span>
                                            <span className="text-xs">Database and RouterOS accounts are in sync.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                issues.data.map((issue: any) => (
                                    <tr key={issue.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-2.5 px-3 font-semibold text-foreground flex items-center gap-1.5">
                                            <AlertTriangle className={`size-3.5 ${
                                                issue.severity === 'high' ? 'text-rose-500' : 'text-amber-500'
                                            }`} />
                                            {issue.issue_type.replace(/_/g, ' ')}
                                        </td>
                                        <td className="py-2.5 px-3 text-muted-foreground">
                                            {issue.entity_type} #{issue.local_entity_id}
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                issue.severity === 'high'
                                                    ? 'bg-rose-500/10 text-rose-600'
                                                    : 'bg-amber-500/10 text-amber-600'
                                            }`}>
                                                {issue.severity}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                                            {JSON.stringify(issue.expected_json)}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                                            {JSON.stringify(issue.actual_json)}
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <span className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-medium capitalize ${
                                                issue.status === 'open'
                                                    ? 'bg-amber-500/10 text-amber-600'
                                                    : 'bg-emerald-500/10 text-emerald-600'
                                            }`}>
                                                {issue.status}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-right">
                                            {issue.status === 'open' && (
                                                <button
                                                    onClick={() => setRepairIssue(issue)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border bg-secondary hover:bg-secondary/80 transition-colors"
                                                >
                                                    <Wrench className="size-3" />
                                                    Repair
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Repair Modal */}
                {repairIssue && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                        <div className="w-full max-w-lg rounded-lg border bg-card text-card-foreground shadow-lg overflow-hidden">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h3 className="font-semibold text-sm">Resolve Reconciliation Issue</h3>
                                <button onClick={() => setRepairIssue(null)} className="text-muted-foreground hover:text-foreground">
                                    <X className="size-4" />
                                </button>
                            </div>
                            <div className="p-4 flex flex-col gap-3 text-xs">
                                <div className="p-3 rounded bg-muted/40 border flex flex-col gap-2">
                                    <div className="font-semibold text-foreground capitalize">
                                        {repairIssue.issue_type.replace(/_/g, ' ')}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                                        <div>
                                            <div className="text-[10px] text-muted-foreground uppercase">Expected (DB):</div>
                                            <div className="text-foreground">{JSON.stringify(repairIssue.expected_json, null, 2)}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] text-muted-foreground uppercase">Actual (RouterOS):</div>
                                            <div className="text-foreground">{JSON.stringify(repairIssue.actual_json, null, 2)}</div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="font-medium text-muted-foreground">Audit / Resolution Note</label>
                                    <input
                                        type="text"
                                        placeholder="Optional operator comment..."
                                        value={repairNote}
                                        onChange={(e) => setRepairNote(e.target.value)}
                                        className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background"
                                    />
                                </div>

                                <div className="pt-2 border-t flex items-center justify-between">
                                    <button
                                        type="button"
                                        onClick={() => handleExecuteRepair('ignore')}
                                        className="h-8 px-3 rounded text-xs font-medium border text-muted-foreground hover:bg-muted"
                                    >
                                        Ignore Issue
                                    </button>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setRepairIssue(null)}
                                            className="h-8 px-3 rounded text-xs font-medium text-muted-foreground hover:bg-muted"
                                        >
                                            Cancel
                                        </button>
                                        {repairIssue.issue_type === 'missing_on_router' && (
                                            <button
                                                type="button"
                                                onClick={() => handleExecuteRepair('recreate')}
                                                className="h-8 px-4 rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90"
                                            >
                                                Re-create on RouterOS
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

ReconciliationIndex.layout = {
    breadcrumbs: [
        { title: 'Reconciliation', href: '/reconciliation' },
    ],
};
