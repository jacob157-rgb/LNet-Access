import { Head, Link, router } from '@inertiajs/react';
import { Ban, Eye, Plus, Printer, Search, ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
    sales: any;
    stats: {
        today_total: number;
        today_count: number;
    };
    filters: {
        search?: string;
        status?: string;
    };
}

export default function SalesIndex({ sales, stats, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [voidModalSale, setVoidModalSale] = useState<any>(null);
    const [voidReason, setVoidReason] = useState('');

    const handleFilter = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get('/sales', { search: search || undefined, status: status || undefined }, { preserveState: true });
    };

    const handleConfirmVoid = () => {
        if (!voidModalSale || !voidReason.trim()) return;
        router.post(`/sales/${voidModalSale.id}/void`, {
            reason: voidReason,
            release_vouchers: true,
        }, {
            onSuccess: () => {
                setVoidModalSale(null);
                setVoidReason('');
            },
        });
    };

    return (
        <>
            <Head title="Sales Transactions — L-Net Access" />

            <div className="flex flex-col gap-6 p-4 md:p-6 w-full flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Sales Transactions</h1>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Audit trail of cashier voucher sales and receipts.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-xs font-mono text-muted-foreground">
                            Today: <strong className="text-foreground">Rp {stats.today_total.toLocaleString('id-ID')}</strong> ({stats.today_count} sales)
                        </div>
                        <Link
                            href="/sales/create"
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="size-3.5" />
                            Cashier POS
                        </Link>
                    </div>
                </div>

                {/* Filter */}
                <form onSubmit={handleFilter} className="flex items-center gap-2 max-w-md">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search receipt number..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-8 pr-2.5 text-xs h-8 rounded border bg-background font-mono"
                        />
                    </div>

                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="text-xs h-8 px-2 rounded border bg-background"
                    >
                        <option value="">All Statuses</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="void">Void</option>
                    </select>

                    <button
                        type="submit"
                        className="h-8 px-3 rounded text-xs font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    >
                        Filter
                    </button>
                </form>

                {/* Sales Table */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                                <th className="py-2.5 px-3">Receipt #</th>
                                <th className="py-2.5 px-3">Customer / Member</th>
                                <th className="py-2.5 px-3">Cashier</th>
                                <th className="py-2.5 px-3">Items / Vouchers</th>
                                <th className="py-2.5 px-3">Payment</th>
                                <th className="py-2.5 px-3">Grand Total</th>
                                <th className="py-2.5 px-3">Date</th>
                                <th className="py-2.5 px-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {sales.data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
                                        No sales records found.
                                    </td>
                                </tr>
                            ) : (
                                sales.data.map((sale: any) => (
                                    <tr key={sale.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="py-2.5 px-3 font-mono font-bold text-foreground">
                                            {sale.receipt_number}
                                        </td>
                                        <td className="py-2.5 px-3">{sale.member?.name ?? 'Walk-in'}</td>
                                        <td className="py-2.5 px-3 text-muted-foreground">{sale.cashier?.name ?? 'Admin'}</td>
                                        <td className="py-2.5 px-3">
                                            {sale.items?.map((it: any) => `${it.quantity}x ${it.description}`).join(', ') || '-'}
                                        </td>
                                        <td className="py-2.5 px-3">
                                            <span className="font-mono text-[11px] uppercase">{sale.payment_method}</span>
                                            <span
                                                className={`ml-1.5 inline-flex px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                                                    sale.payment_status === 'paid'
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                        : sale.payment_status === 'void'
                                                        ? 'bg-rose-500/10 text-rose-600'
                                                        : 'bg-amber-500/10 text-amber-600'
                                                }`}
                                            >
                                                {sale.payment_status}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 font-mono font-bold">
                                            Rp {parseFloat(sale.grand_total).toLocaleString('id-ID')}
                                        </td>
                                        <td className="py-2.5 px-3 font-mono text-muted-foreground text-[11px]">
                                            {new Date(sale.created_at).toLocaleString('id-ID')}
                                        </td>
                                        <td className="py-2.5 px-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <a
                                                    href={`/print/sales/${sale.id}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    title="Print Receipt (58mm)"
                                                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    <Printer className="size-3.5" />
                                                </a>
                                                {sale.payment_status !== 'void' && (
                                                    <button
                                                        onClick={() => setVoidModalSale(sale)}
                                                        title="Void Transaction"
                                                        className="p-1.5 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-600 transition-colors"
                                                    >
                                                        <Ban className="size-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Void Modal */}
                {voidModalSale && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                        <div className="w-full max-w-sm rounded-lg border bg-card text-card-foreground shadow-lg overflow-hidden">
                            <div className="p-4 border-b flex items-center justify-between">
                                <h3 className="font-semibold text-sm">Void Transaction</h3>
                                <button onClick={() => setVoidModalSale(null)} className="text-muted-foreground hover:text-foreground">
                                    <X className="size-4" />
                                </button>
                            </div>
                            <div className="p-4 flex flex-col gap-3 text-xs">
                                <p className="text-muted-foreground">
                                    Voiding <strong className="text-foreground">{voidModalSale.receipt_number}</strong> will mark it as void and return allocated ready vouchers to stock.
                                </p>
                                <div>
                                    <label className="font-medium text-muted-foreground">Reason for void</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Customer cancelled / incorrect amount"
                                        value={voidReason}
                                        onChange={(e) => setVoidReason(e.target.value)}
                                        className="mt-1 w-full text-xs h-8 px-2.5 rounded border bg-background"
                                    />
                                </div>
                                <div className="pt-2 border-t flex justify-end gap-2">
                                    <button
                                        onClick={() => setVoidModalSale(null)}
                                        className="h-8 px-3 rounded text-xs font-medium text-muted-foreground hover:bg-muted"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleConfirmVoid}
                                        disabled={!voidReason.trim()}
                                        className="h-8 px-3 rounded text-xs font-medium bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                                    >
                                        Confirm Void
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

SalesIndex.layout = {
    breadcrumbs: [
        { title: 'Sales', href: '/sales' },
        { title: 'Transactions', href: '/sales' },
    ],
};
