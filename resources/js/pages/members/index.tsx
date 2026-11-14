import { Head, Link, router, useForm } from '@inertiajs/react';
import { Plus, Search, UserCheck, Users, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
    members: any;
    filters: {
        search?: string;
    };
}

export default function MembersIndex({ members, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        phone: '',
        notes: '',
        status: 'active',
    });

    const handleFilter = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get('/members', { search: search || undefined }, { preserveState: true });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/members', {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    return (
        <>
            <Head title="Members — L-Net Access" />

            <div className="flex flex-col gap-6 p-4 md:p-6 w-full flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Customer Members</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Manage customer profiles, associated Hotspot/PPPoE accounts, and session history.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="size-3.5" />
                        Add Member
                    </button>
                </div>

                {/* Filter */}
                <form onSubmit={handleFilter} className="flex items-center gap-2 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search by name, code, or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-8 pr-2.5 text-xs h-8 rounded border bg-background"
                        />
                    </div>
                    <button
                        type="submit"
                        className="h-8 px-3 rounded text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    >
                        Search
                    </button>
                </form>

                {/* Table */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                                <th className="py-2.5 px-3">Member Code</th>
                                <th className="py-2.5 px-3">Full Name</th>
                                <th className="py-2.5 px-3">Phone</th>
                                <th className="py-2.5 px-3">Network Accounts</th>
                                <th className="py-2.5 px-3">Status</th>
                                <th className="py-2.5 px-3">Registered</th>
                                <th className="py-2.5 px-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {members.data.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                                        No members found.
                                    </td>
                                </tr>
                            ) : (
                                members.data.map((m: any) => (
                                    <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-2.5 px-3 font-mono font-bold text-primary">
                                            <Link href={`/members/${m.id}`} className="hover:underline">
                                                {m.member_code}
                                            </Link>
                                        </td>
                                        <td className="py-2.5 px-3 font-semibold text-foreground">{m.name}</td>
                                        <td className="py-2.5 px-3 font-mono text-muted-foreground">{m.phone ?? '-'}</td>
                                        <td className="py-2.5 px-3">
                                            <span className="inline-flex items-center gap-1 font-mono">
                                                {m.network_accounts_count ?? 0} account(s)
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <span
                                                className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-medium capitalize ${
                                                    m.status === 'active'
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                        : 'bg-rose-500/10 text-rose-600'
                                                }`}
                                            >
                                                {m.status}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-muted-foreground text-[11px]">
                                            {new Date(m.created_at).toLocaleDateString('id-ID')}
                                        </td>
                                        <td className="py-2.5 px-3 text-right">
                                            <Link
                                                href={`/members/${m.id}`}
                                                className="inline-flex items-center px-2 py-1 rounded text-[11px] font-medium text-primary hover:underline"
                                            >
                                                View Details
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Add Member Modal */}
                {isCreateOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                        <div className="w-full max-w-md rounded-lg border bg-card text-card-foreground shadow-lg overflow-hidden">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h3 className="font-semibold text-sm">Create New Member</h3>
                                <button onClick={() => setIsCreateOpen(false)} className="text-muted-foreground hover:text-foreground">
                                    <X className="size-4" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3 text-xs">
                                <div>
                                    <label className="font-medium text-muted-foreground">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Budi Santoso"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background"
                                    />
                                </div>
                                <div>
                                    <label className="font-medium text-muted-foreground">Phone Number (WhatsApp)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 08123456789"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="font-medium text-muted-foreground">Internal Notes</label>
                                    <textarea
                                        rows={2}
                                        placeholder="e.g. Home customer RT 02 / RW 05"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        className="mt-1 w-full text-xs p-2 rounded border bg-background"
                                    />
                                </div>
                                <div>
                                    <label className="font-medium text-muted-foreground">Account Status</label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="mt-1 w-full text-xs h-8 px-2 rounded border bg-background"
                                    >
                                        <option value="active">Active</option>
                                        <option value="suspended">Suspended</option>
                                    </select>
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
                                        Create Member
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

MembersIndex.layout = {
    breadcrumbs: [
        { title: 'Members', href: '/members' },
    ],
};
