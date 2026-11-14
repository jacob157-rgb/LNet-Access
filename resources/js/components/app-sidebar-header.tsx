import { Link, router, usePage } from '@inertiajs/react';
import {
    Check,
    ChevronDown,
    Moon,
    Plus,
    RefreshCw,
    Server,
    ShoppingCart,
    Sun,
    Wifi,
} from 'lucide-react';
import { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserMenuContent } from '@/components/user-menu-content';
import { useAppearance } from '@/hooks/use-appearance';
import { useInitials } from '@/hooks/use-initials';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const page = usePage<any>();
    const user = page.props.auth?.user;
    const activeRouter = page.props.activeRouter;
    const allRouters = page.props.allRouters || [];
    const getInitials = useInitials();
    const { appearance, updateAppearance } = useAppearance();
    const [syncing, setSyncing] = useState(false);

    const handleQuickSync = () => {
        if (!activeRouter || syncing) return;
        setSyncing(true);
        router.post(`/routers/${activeRouter.id}/sync`, {}, {
            preserveScroll: true,
            onFinish: () => setSyncing(false),
        });
    };

    const handleSwitchRouter = (routerId: number) => {
        if (activeRouter && activeRouter.id === routerId) return;
        router.post(`/routers/${routerId}/activate`, {}, {
            preserveScroll: true,
        });
    };

    const toggleTheme = () => {
        updateAppearance(appearance === 'dark' ? 'light' : 'dark');
    };

    return (
        <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 md:px-6 backdrop-blur-md transition-[width,height] ease-linear w-full">
            {/* Left: Sidebar trigger & Breadcrumbs */}
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <SidebarTrigger className="-ml-1 text-muted-foreground hover:text-foreground" />
                <div className="h-4 w-px bg-border/70 hidden sm:block" />
                <div className="min-w-0">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>

            {/* Right: Operational Controls, Active Router, POS Action, Theme & User */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                {/* Active Router Indicator / Selector */}
                {activeRouter ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="inline-flex items-center gap-1.5 sm:gap-2 h-8 px-2 sm:px-2.5 rounded-md border border-border/70 bg-card hover:bg-accent hover:text-accent-foreground text-xs transition-colors shadow-2xs font-mono"
                                title={`Router Aktif: ${activeRouter.name} (${activeRouter.host}:${activeRouter.port})`}
                            >
                                <span className="relative flex h-2 w-2 shrink-0">
                                    {activeRouter.connection_status === 'online' ? (
                                        <>
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                        </>
                                    ) : activeRouter.connection_status === 'stale' ? (
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                                    ) : (
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                                    )}
                                </span>
                                <span className="font-sans font-semibold text-foreground truncate max-w-[85px] sm:max-w-[130px] md:max-w-[170px]">
                                    {activeRouter.name}
                                </span>
                                <span className="text-[11px] text-muted-foreground hidden lg:inline">
                                    {activeRouter.host}:{activeRouter.port}
                                </span>
                                <ChevronDown className="size-3 text-muted-foreground opacity-60 ml-0.5 shrink-0" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 text-xs">
                            <div className="px-2.5 py-2 border-b border-border/80">
                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                    Router Aktif
                                </p>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="font-semibold text-foreground truncate max-w-[170px]">
                                        {activeRouter.name}
                                    </span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase font-semibold ${
                                        activeRouter.connection_status === 'online'
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                            : activeRouter.connection_status === 'stale'
                                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                    }`}>
                                        {activeRouter.connection_status}
                                    </span>
                                </div>
                                <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                                    {activeRouter.host}:{activeRouter.port} ({activeRouter.transport.toUpperCase()})
                                </p>
                            </div>

                            <DropdownMenuLabel className="font-semibold text-muted-foreground text-[11px] pt-2 px-2.5">
                                Pilih Router
                            </DropdownMenuLabel>
                            {allRouters.map((r: any) => {
                                const isCurrent = r.id === activeRouter.id;
                                return (
                                    <DropdownMenuItem
                                        key={r.id}
                                        className={`flex items-center justify-between cursor-pointer py-1.5 px-2.5 ${
                                            isCurrent ? 'bg-primary/10 font-semibold' : ''
                                        }`}
                                        onClick={() => handleSwitchRouter(r.id)}
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className={`size-1.5 rounded-full shrink-0 ${
                                                r.connection_status === 'online' ? 'bg-emerald-500' :
                                                r.connection_status === 'stale' ? 'bg-amber-500' : 'bg-rose-500'
                                            }`} />
                                            <span className="truncate max-w-[130px]">{r.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 ml-2 shrink-0">
                                            <span className="font-mono text-[10px] text-muted-foreground">{r.host}</span>
                                            {isCurrent && <Check className="size-3.5 text-primary" />}
                                        </div>
                                    </DropdownMenuItem>
                                );
                            })}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/routers" className="w-full flex items-center gap-2 cursor-pointer text-primary py-1.5 px-2.5">
                                    <Server className="size-3.5" />
                                    Kelola Router Connections
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Link
                        href="/routers"
                        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border text-xs text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 font-medium"
                    >
                        <Server className="size-3.5" />
                        <span>Connect Router</span>
                    </Link>
                )}

                {/* Quick Sync Button */}
                {activeRouter && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleQuickSync}
                        disabled={syncing}
                        title="Sync Router Resources & Sessions"
                        className="h-8 px-2.5 text-xs gap-1.5 border-border/70 hover:bg-accent shadow-2xs"
                    >
                        <RefreshCw className={`size-3.5 ${syncing ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
                        <span className="hidden md:inline text-xs font-medium">Sync</span>
                    </Button>
                )}

                {/* Quick Action: Cashier POS */}
                <Link
                    href="/sales/create"
                    className="inline-flex items-center gap-1.5 h-8 px-2.5 sm:px-3 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-2xs"
                >
                    <ShoppingCart className="size-3.5" />
                    <span className="hidden sm:inline">Kasir POS</span>
                </Link>

                {/* Theme Toggle Button */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleTheme}
                    title={appearance === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
                    className="size-8 text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                    {appearance === 'dark' ? (
                        <Sun className="size-4" />
                    ) : (
                        <Moon className="size-4" />
                    )}
                </Button>

                {/* User Dropdown */}
                {user && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 rounded-full border border-border/80 focus-visible:ring-1 hover:border-primary/50 transition-colors"
                            >
                                <Avatar className="size-7">
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback className="text-[11px] font-bold bg-primary/10 text-primary">
                                        {getInitials(user.name)}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <UserMenuContent user={user} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </header>
    );
}
