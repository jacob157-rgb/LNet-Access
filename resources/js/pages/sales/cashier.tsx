import { Head, router, useForm } from '@inertiajs/react';
import { Check, CreditCard, Printer, QrCode, ShoppingBag, ShoppingCart, User, Wifi } from 'lucide-react';
import { useState } from 'react';

interface ProfileOption {
    id: number;
    name: string;
    rate_limit: string | null;
    ready_count: number;
    default_price: number;
}

interface Props {
    routers: any[];
    selectedRouterId: number;
    profiles: ProfileOption[];
    members: any[];
}

export default function CashierPOS({ routers, selectedRouterId, profiles, members }: Props) {
    const [selectedProfile, setSelectedProfile] = useState<ProfileOption | null>(profiles[0] ?? null);

    const { data, setData, post, processing, errors } = useForm({
        profile_id: profiles[0]?.id ?? '',
        quantity: 1,
        payment_method: 'cash',
        payment_status: 'paid',
        discount: 0,
        member_id: '',
        notes: '',
    });

    const unitPrice = selectedProfile?.default_price ?? 0;
    const subtotal = unitPrice * data.quantity;
    const grandTotal = Math.max(0, subtotal - data.discount);

    const handleSelectProfile = (p: ProfileOption) => {
        setSelectedProfile(p);
        setData((prev) => ({
            ...prev,
            profile_id: p.id,
            quantity: 1,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/sales');
    };

    return (
        <>
            <Head title="Cashier POS — L-Net Access" />

            <div className="flex flex-col gap-6 p-4 md:p-6 w-full flex-1">
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Cashier POS</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Sell Hotspot vouchers and print receipts directly.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Voucher Profile Selection Grid */}
                    <div className="lg:col-span-7 flex flex-col gap-4">
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Select Voucher Package
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {profiles.map((p) => {
                                const isSelected = selectedProfile?.id === p.id;
                                const isOutOfStock = p.ready_count === 0;

                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        disabled={isOutOfStock}
                                        onClick={() => handleSelectProfile(p)}
                                        className={`p-4 rounded-lg border text-left flex flex-col justify-between transition-all ${
                                            isSelected
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary shadow-xs'
                                                : 'bg-card text-card-foreground hover:border-primary/50'
                                        } ${isOutOfStock ? 'opacity-50 cursor-not-allowed bg-muted/40' : ''}`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="font-bold text-sm flex items-center gap-1.5">
                                                <Wifi className="size-4 text-primary" />
                                                {p.name}
                                            </div>
                                            {isSelected && (
                                                <span className="p-0.5 rounded-full bg-primary text-primary-foreground">
                                                    <Check className="size-3" />
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-xs text-muted-foreground font-mono mt-1">
                                            {p.rate_limit ?? 'Unlimited speed'}
                                        </div>

                                        <div className="mt-4 pt-2 border-t flex items-center justify-between text-xs">
                                            <span className="font-bold font-mono text-sm text-foreground">
                                                Rp {p.default_price.toLocaleString('id-ID')}
                                            </span>
                                            <span
                                                className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                                                    isOutOfStock
                                                        ? 'bg-rose-500/10 text-rose-600'
                                                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium'
                                                }`}
                                            >
                                                {p.ready_count} available
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: Checkout & Payment Order Card */}
                    <div className="lg:col-span-5 rounded-lg border bg-card text-card-foreground shadow-xs p-5 flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="text-sm font-semibold flex items-center gap-2">
                                <ShoppingCart className="size-4 text-primary" />
                                Sale Summary
                            </h3>
                            <span className="text-xs font-mono font-medium text-muted-foreground">
                                {selectedProfile?.name ?? 'No package selected'}
                            </span>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {/* Quantity Controls */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Quantity</label>
                                <div className="flex items-center gap-2 mt-1">
                                    <button
                                        type="button"
                                        onClick={() => setData('quantity', Math.max(1, data.quantity - 1))}
                                        className="size-8 rounded border bg-secondary font-bold text-sm flex items-center justify-center hover:bg-secondary/80"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        min={1}
                                        max={selectedProfile?.ready_count || 100}
                                        value={data.quantity}
                                        onChange={(e) => setData('quantity', parseInt(e.target.value) || 1)}
                                        className="h-8 w-20 text-center font-mono font-bold text-sm rounded border bg-background"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setData('quantity', data.quantity + 1)}
                                        disabled={selectedProfile ? data.quantity >= selectedProfile.ready_count : true}
                                        className="size-8 rounded border bg-secondary font-bold text-sm flex items-center justify-center hover:bg-secondary/80 disabled:opacity-40"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Customer Member (Optional) */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Customer (Optional)</label>
                                <select
                                    value={data.member_id}
                                    onChange={(e) => setData('member_id', e.target.value)}
                                    className="mt-1 w-full text-xs h-8 px-2 rounded border bg-background"
                                >
                                    <option value="">Walk-in / Anonymous Customer</option>
                                    {members.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} ({m.member_code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Payment Method Selector */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground">Payment Method</label>
                                <div className="grid grid-cols-3 gap-2 mt-1">
                                    {[
                                        { id: 'cash', label: 'Cash' },
                                        { id: 'qris', label: 'QRIS' },
                                        { id: 'transfer', label: 'Transfer' },
                                    ].map((method) => (
                                        <button
                                            key={method.id}
                                            type="button"
                                            onClick={() => setData('payment_method', method.id)}
                                            className={`h-8 rounded text-xs font-medium border transition-colors ${
                                                data.payment_method === method.id
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : 'bg-background hover:bg-muted'
                                            }`}
                                        >
                                            {method.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Status */}
                            <div className="flex items-center gap-4">
                                <label className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="payment_status"
                                        checked={data.payment_status === 'paid'}
                                        onChange={() => setData('payment_status', 'paid')}
                                    />
                                    <span>Paid in Full</span>
                                </label>
                                <label className="text-xs text-muted-foreground flex items-center gap-1.5 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="payment_status"
                                        checked={data.payment_status === 'pending'}
                                        onChange={() => setData('payment_status', 'pending')}
                                    />
                                    <span>Pending Payment</span>
                                </label>
                            </div>

                            {/* Price Breakdown */}
                            <div className="p-3 rounded-md bg-muted/40 border flex flex-col gap-1.5 text-xs font-mono">
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Subtotal ({data.quantity} × {unitPrice.toLocaleString('id-ID')})</span>
                                    <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="flex justify-between items-center text-muted-foreground">
                                    <span>Discount (IDR)</span>
                                    <input
                                        type="number"
                                        min={0}
                                        step={500}
                                        value={data.discount}
                                        onChange={(e) => setData('discount', parseFloat(e.target.value) || 0)}
                                        className="h-6 w-24 text-right px-1.5 text-xs rounded border bg-background font-mono"
                                    />
                                </div>
                                <div className="border-t pt-1.5 flex justify-between font-bold text-sm text-foreground">
                                    <span>Grand Total</span>
                                    <span className="text-primary text-base">
                                        Rp {grandTotal.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing || !selectedProfile || selectedProfile.ready_count < data.quantity}
                                className="w-full h-10 rounded-md text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs flex items-center justify-center gap-2"
                            >
                                <Printer className="size-4" />
                                {processing ? 'Processing Sale...' : 'Confirm Sale & Print Receipt'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}

CashierPOS.layout = {
    breadcrumbs: [
        { title: 'Sales', href: '/sales' },
        { title: 'Cashier POS', href: '/sales/create' },
    ],
};
