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
    open: boolean;
    onOpenChange: (open: boolean) => void;
    routerId: number;
    batchesCount: number;
}

export default function DeleteAllBatchesModal({
    open,
    onOpenChange,
    routerId,
    batchesCount,
}: Props) {
    const [deleteSold, setDeleteSold] = useState(false);
    const [processing, setProcessing] = useState(false);

    const handleDeleteAll = () => {
        setProcessing(true);
        router.delete('/hotspot/batches', {
            data: {
                router_id: routerId,
                delete_sold: deleteSold,
            },
            onFinish: () => setProcessing(false),
            onSuccess: () => {
                onOpenChange(false);
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
                            Hanguskan & Hapus SEMUA Batch
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs text-muted-foreground">
                        Tindakan massal ini akan menghapus semua batch dan voucher terkait dari MikroTik.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2 text-xs">
                    <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 space-y-1.5 text-destructive dark:text-rose-400">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                            <div className="space-y-1 leading-relaxed">
                                <p className="font-semibold">
                                    Konfirmasi Penghangusan Massal ({batchesCount} Batch):
                                </p>
                                <p className="text-[11px] text-muted-foreground">
                                    Seluruh voucher yang belum terpakai dari semua batch akan <strong>dihapus permanen dari MikroTik RouterOS</strong> (<code className="font-mono">/ip hotspot user</code>) dan database.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-md border p-3 space-y-2 bg-card">
                        <p className="text-[11px] text-muted-foreground">
                            Secara default, voucher yang telah terjual / aktif akan dipertahankan demi integritas pembukuan kasir.
                        </p>
                        <label className="flex items-center gap-2 pt-1 cursor-pointer">
                            <Checkbox
                                checked={deleteSold}
                                onCheckedChange={(c) => setDeleteSold(Boolean(c))}
                            />
                            <span className="text-[11px] text-destructive font-medium">
                                Ikut hapus juga riwayat voucher yang sudah terjual (Hapus Bersih Total)
                            </span>
                        </label>
                    </div>
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
                        onClick={handleDeleteAll}
                        className="gap-1.5"
                    >
                        {processing ? (
                            <>
                                <Loader2 className="size-3.5 animate-spin" />
                                Menghanguskan Semua...
                            </>
                        ) : (
                            <>
                                <Trash2 className="size-3.5" />
                                Ya, Hanguskan Semua Batch
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
