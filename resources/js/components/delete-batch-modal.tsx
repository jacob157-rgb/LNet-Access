import { router } from '@inertiajs/react';
import { AlertTriangle, Flame, Loader2, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Checkbox } from '@/Components/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';

interface Props {
    batch: any | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export default function DeleteBatchModal({ batch, open, onOpenChange, onSuccess }: Props) {
    const [deleteSold, setDeleteSold] = useState(false);
    const [processing, setProcessing] = useState(false);

    if (!batch) return null;

    const totalVouchers = batch.vouchers_count ?? batch.quantity_created ?? 0;
    const soldCount = batch.sold_count ?? 0;
    const unusedCount = batch.unused_count ?? (totalVouchers - soldCount);

    const handleDelete = () => {
        setProcessing(true);
        router.delete(`/hotspot/batches/${batch.id}`, {
            data: { delete_sold: deleteSold },
            onFinish: () => setProcessing(false),
            onSuccess: () => {
                onOpenChange(false);
                if (onSuccess) onSuccess();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-destructive mb-1">
                        <Flame className="size-5" />
                        <DialogTitle className="text-base font-bold">
                            Hanguskan Voucher & Hapus Batch
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Tindakan ini akan menghanguskan voucher yang belum terpakai dari router MikroTik dan sistem.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2 text-xs">
                    {/* Batch Summary Card */}
                    <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Kode Batch:</span>
                            <span className="font-mono font-bold text-foreground">{batch.batch_code}</span>
                        </div>
                        {batch.hotspot_profile?.name && (
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Profil Hotspot:</span>
                                <span className="font-medium text-foreground">{batch.hotspot_profile.name}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Total Voucher:</span>
                            <span className="font-medium text-foreground">{totalVouchers}</span>
                        </div>
                    </div>

                    {/* Breakdown Info */}
                    <div className="rounded-md border border-amber-500/20 bg-amber-500/5 p-3 space-y-1.5 text-amber-800 dark:text-amber-300">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                            <div className="space-y-1 leading-relaxed">
                                <p className="font-semibold">
                                    {unusedCount} Voucher Belum Terpakai akan Dihanguskan:
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    Semua akun voucher tersebut akan <strong>langsung dihapus dari MikroTik</strong> (<code className="font-mono">/ip hotspot user</code>) sehingga tidak dapat dipakai login lagi.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* If there are sold vouchers */}
                    {soldCount > 0 && (
                        <div className="rounded-md border p-3 space-y-2 bg-card">
                            <div className="flex items-center justify-between font-medium">
                                <span className="text-muted-foreground">Voucher Terjual / Aktif:</span>
                                <span className="text-blue-600 font-semibold">{soldCount} voucher</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                Secara default, riwayat voucher yang sudah terjual tetap disimpan untuk audit keuangan.
                            </p>
                            <label className="flex items-center gap-2 pt-1 cursor-pointer">
                                <Checkbox
                                    checked={deleteSold}
                                    onCheckedChange={(c) => setDeleteSold(Boolean(c))}
                                />
                                <span className="text-[11px] text-destructive font-medium">
                                    Hapus juga riwayat {soldCount} voucher yang sudah terjual
                                </span>
                            </label>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <DialogClose asChild disabled={processing}>
                        <Button type="button" variant="outline" size="sm">
                            Batal
                        </Button>
                    </DialogClose>
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={processing}
                        onClick={handleDelete}
                        className="gap-1.5"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="size-3.5 animate-spin" />
                                Menghapus & Menghanguskan...
                            </>
                        ) : (
                            <>
                                <Trash2 className="size-3.5" />
                                {soldCount > 0 && !deleteSold
                                    ? `Hanguskan ${unusedCount} Voucher Saja`
                                    : 'Ya, Hanguskan & Hapus Batch'}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
