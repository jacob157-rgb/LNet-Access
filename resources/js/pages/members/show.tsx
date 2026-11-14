import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Activity,
    ArrowLeft,
    Check,
    History,
    KeyRound,
    Network,
    Plus,
    Power,
    Receipt,
    Shield,
    ToggleLeft,
    ToggleRight,
    Users,
    Wifi,
    X,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    member: any;
    routers: any[];
    hotspotProfiles: any[];
    pppProfiles: any[];
    activeSessions: any[];
    auditLogs: any[];
}

export default function MemberShow({
    member,
    routers,
    hotspotProfiles,
    pppProfiles,
    activeSessions,
    auditLogs,
}: Props) {
    const [activeTab, setActiveTab] = useState<'accounts' | 'sessions' | 'sales' | 'macs' | 'audit'>('accounts');
    const [isAttachOpen, setIsAttachOpen] = useState(false);
    const [passwordModalAccount, setPasswordModalAccount] = useState<any>(null);
    const [newPassword, setNewPassword] = useState('');

    // Attach Account Form
    const { data, setData, post, processing, reset } = useForm({
        router_id: routers[0]?.id ?? '',
        account_type: 'hotspot',
        username: `${member.member_code.toLowerCase()}_hs`,
        password: '',
        profile_name: hotspotProfiles[0]?.name ?? 'default',
    });

    const handleAttach = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/members/${member.id}/accounts`, {
            onSuccess: () => {
                setIsAttachOpen(false);
                reset();
            },
        });
    };

    const handleResetPassword = () => {
        if (!passwordModalAccount || !newPassword.trim()) return;
        router.post(`/members/accounts/${passwordModalAccount.id}/password`, {
            password: newPassword,
        }, {
            onSuccess: () => {
                setPasswordModalAccount(null);
                setNewPassword('');
            },
        });
    };

    const handleToggleAccount = (acc: any) => {
        router.post(`/members/accounts/${acc.id}/toggle`);
    };

    return (
        <>
            <Head title={`${member.name} — Member Details`} />

            <div className="flex flex-col gap-6 p-4 md:p-6 w-full flex-1">
                {/* Member Header Card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-lg border bg-card text-card-foreground shadow-xs">
                    <div className="flex items-center gap-3">
                        <Link href="/members" className="p-2 rounded hover:bg-muted text-muted-foreground">
                            <ArrowLeft className="size-4" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold tracking-tight">{member.name}</h1>
                                <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                                    {member.member_code}
                                </span>
                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded capitalize ${
                                    member.status === 'active'
                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                        : 'bg-rose-500/10 text-rose-600'
                                }`}>
                                    {member.status}
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground font-mono flex items-center gap-4 mt-1">
                                <span>Phone: {member.phone ?? 'None'}</span>
                                <span>Registered: {new Date(member.created_at).toLocaleDateString('id-ID')}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsAttachOpen(true)}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="size-3.5" />
                        Attach Network Account
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b flex items-center gap-2 text-xs font-medium">
                    {[
                        { id: 'accounts', label: `Network Accounts (${member.network_accounts?.length || 0})` },
                        { id: 'sessions', label: `Active Sessions (${activeSessions.length})` },
                        { id: 'sales', label: `Sales History (${member.sales?.length || 0})` },
                        { id: 'macs', label: `Observed MACs (${member.mac_observations?.length || 0})` },
                        { id: 'audit', label: 'Audit Trail' },
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

                {/* Tab: Network Accounts */}
                {activeTab === 'accounts' && (
                    <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                                    <th className="py-2.5 px-3">Type</th>
                                    <th className="py-2.5 px-3">Username</th>
                                    <th className="py-2.5 px-3">Router</th>
                                    <th className="py-2.5 px-3">Profile / Package</th>
                                    <th className="py-2.5 px-3">Router Object ID</th>
                                    <th className="py-2.5 px-3">Status</th>
                                    <th className="py-2.5 px-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {member.network_accounts.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                                            No network accounts attached to this member.
                                        </td>
                                    </tr>
                                ) : (
                                    member.network_accounts.map((acc: any) => (
                                        <tr key={acc.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-2.5 px-3 font-mono uppercase font-bold text-muted-foreground">
                                                {acc.account_type}
                                            </td>
                                            <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                                                {acc.username}
                                            </td>
                                            <td className="py-2.5 px-3 text-muted-foreground">
                                                {acc.router_connection?.name ?? 'Router'}
                                            </td>
                                            <td className="py-2.5 px-3 font-medium">
                                                {acc.profile_name}
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-muted-foreground text-[11px]">
                                                {acc.router_object_id ?? '-'}
                                            </td>
                                            <td className="py-2.5 px-3">
                                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-medium capitalize ${
                                                    acc.expected_enabled
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                        : 'bg-rose-500/10 text-rose-600'
                                                }`}>
                                                    {acc.expected_enabled ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => setPasswordModalAccount(acc)}
                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded border text-[11px] hover:bg-muted font-medium"
                                                    >
                                                        <KeyRound className="size-3" />
                                                        Reset Pass
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleAccount(acc)}
                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded border text-[11px] hover:bg-muted font-medium"
                                                    >
                                                        {acc.expected_enabled ? 'Disable' : 'Enable'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Tab: Observed MAC History */}
                {activeTab === 'macs' && (
                    <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
                        <div className="p-3 bg-muted/20 border-b text-xs text-muted-foreground">
                            Note: MAC addresses are recorded only as technical observation snapshots for troubleshooting, not as proof of identity.
                        </div>
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                                    <th className="py-2.5 px-3">Observed MAC</th>
                                    <th className="py-2.5 px-3">Source</th>
                                    <th className="py-2.5 px-3">IP Address</th>
                                    <th className="py-2.5 px-3">Associated AP</th>
                                    <th className="py-2.5 px-3">Confidence</th>
                                    <th className="py-2.5 px-3">First Seen</th>
                                    <th className="py-2.5 px-3 text-right">Last Seen</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {member.mac_observations.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                                            No MAC observations recorded yet.
                                        </td>
                                    </tr>
                                ) : (
                                    member.mac_observations.map((obs: any) => (
                                        <tr key={obs.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-2.5 px-3 font-mono font-bold text-foreground">{obs.observed_mac}</td>
                                            <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">{obs.source}</td>
                                            <td className="py-2.5 px-3 font-mono text-muted-foreground">{obs.ip_address ?? '-'}</td>
                                            <td className="py-2.5 px-3">{obs.access_point?.name ?? 'Unknown AP'}</td>
                                            <td className="py-2.5 px-3">
                                                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-muted capitalize">
                                                    {obs.confidence}
                                                </span>
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-muted-foreground text-[11px]">
                                                {new Date(obs.first_seen_at).toLocaleString('id-ID')}
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-muted-foreground text-[11px] text-right">
                                                {new Date(obs.last_seen_at).toLocaleString('id-ID')}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Tab: Sales History */}
                {activeTab === 'sales' && (
                    <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                                    <th className="py-2.5 px-3">Receipt #</th>
                                    <th className="py-2.5 px-3">Payment</th>
                                    <th className="py-2.5 px-3">Total Amount</th>
                                    <th className="py-2.5 px-3">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {member.sales.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                                            No purchases on record for this member.
                                        </td>
                                    </tr>
                                ) : (
                                    member.sales.map((sale: any) => (
                                        <tr key={sale.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-2.5 px-3 font-mono font-bold">{sale.receipt_number}</td>
                                            <td className="py-2.5 px-3 font-mono uppercase">{sale.payment_method} ({sale.payment_status})</td>
                                            <td className="py-2.5 px-3 font-mono font-bold">Rp {parseFloat(sale.grand_total).toLocaleString('id-ID')}</td>
                                            <td className="py-2.5 px-3 font-mono text-muted-foreground">{new Date(sale.created_at).toLocaleString('id-ID')}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Tab: Audit Logs */}
                {activeTab === 'audit' && (
                    <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                                    <th className="py-2.5 px-3">Timestamp</th>
                                    <th className="py-2.5 px-3">Action</th>
                                    <th className="py-2.5 px-3">Details</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {auditLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-muted-foreground">
                                            No audit entries found.
                                        </td>
                                    </tr>
                                ) : (
                                    auditLogs.map((log: any) => (
                                        <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-2.5 px-3 font-mono text-muted-foreground">{new Date(log.created_at).toLocaleString('id-ID')}</td>
                                            <td className="py-2.5 px-3 font-mono font-medium">{log.action}</td>
                                            <td className="py-2.5 px-3 font-mono text-[11px] text-muted-foreground">
                                                {JSON.stringify(log.after_json ?? log.before_json ?? {})}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Attach Account Modal */}
                {isAttachOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                        <div className="w-full max-w-md rounded-lg border bg-card text-card-foreground shadow-lg overflow-hidden">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h3 className="font-semibold text-sm">Attach Network Account</h3>
                                <button onClick={() => setIsAttachOpen(false)} className="text-muted-foreground hover:text-foreground">
                                    <X className="size-4" />
                                </button>
                            </div>
                            <form onSubmit={handleAttach} className="p-4 flex flex-col gap-3 text-xs">
                                <div>
                                    <label className="font-medium text-muted-foreground">Account Type</label>
                                    <div className="grid grid-cols-2 gap-2 mt-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setData('account_type', 'hotspot');
                                                setData('profile_name', hotspotProfiles[0]?.name ?? 'default');
                                            }}
                                            className={`h-8 rounded text-xs font-medium border ${
                                                data.account_type === 'hotspot' ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
                                            }`}
                                        >
                                            Hotspot
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setData('account_type', 'pppoe');
                                                setData('profile_name', pppProfiles[0]?.name ?? 'default');
                                            }}
                                            className={`h-8 rounded text-xs font-medium border ${
                                                data.account_type === 'pppoe' ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'
                                            }`}
                                        >
                                            PPPoE
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="font-medium text-muted-foreground">Router</label>
                                    <select
                                        value={data.router_id}
                                        onChange={(e) => setData('router_id', e.target.value)}
                                        className="mt-1 w-full text-xs h-8 px-2 rounded border bg-background"
                                    >
                                        {routers.map((r) => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="font-medium text-muted-foreground">Username</label>
                                    <input
                                        type="text"
                                        required
                                        value={data.username}
                                        onChange={(e) => setData('username', e.target.value)}
                                        className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="font-medium text-muted-foreground">Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="font-medium text-muted-foreground">Profile</label>
                                    <select
                                        value={data.profile_name}
                                        onChange={(e) => setData('profile_name', e.target.value)}
                                        className="mt-1 w-full text-xs h-8 px-2 rounded border bg-background font-medium"
                                    >
                                        {(data.account_type === 'hotspot' ? hotspotProfiles : pppProfiles).map((p) => (
                                            <option key={p.id} value={p.name}>{p.name} {p.rate_limit ? `(${p.rate_limit})` : ''}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-2 border-t flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsAttachOpen(false)}
                                        className="h-8 px-3 rounded text-xs font-medium text-muted-foreground hover:bg-muted"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="h-8 px-4 rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        Provision Account
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Reset Password Modal */}
                {passwordModalAccount && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                        <div className="w-full max-w-sm rounded-lg border bg-card text-card-foreground shadow-lg overflow-hidden">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h3 className="font-semibold text-sm">Reset Password</h3>
                                <button onClick={() => setPasswordModalAccount(null)} className="text-muted-foreground hover:text-foreground">
                                    <X className="size-4" />
                                </button>
                            </div>
                            <div className="p-4 flex flex-col gap-3 text-xs">
                                <p className="text-muted-foreground">
                                    Resetting password for account <strong className="text-foreground font-mono">{passwordModalAccount.username}</strong> ({passwordModalAccount.account_type}).
                                </p>
                                <div>
                                    <label className="font-medium text-muted-foreground">New Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background font-mono"
                                    />
                                </div>
                                <div className="pt-2 border-t flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPasswordModalAccount(null)}
                                        className="h-8 px-3 rounded text-xs font-medium text-muted-foreground hover:bg-muted"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleResetPassword}
                                        disabled={!newPassword.trim()}
                                        className="h-8 px-4 rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        Save Password
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

MemberShow.layout = (props: any) => ({
    breadcrumbs: [
        { title: 'Members', href: '/members' },
        { title: props?.member?.name || 'Details', href: `/members/${props?.member?.id}` },
    ],
});
