import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    FileText,
    History,
    Layers,
    LayoutDashboard,
    Network,
    Radio,
    Receipt,
    RefreshCw,
    Router as RouterIcon,
    Server,
    ShieldCheck,
    ShoppingCart,
    Ticket,
    Users,
    Wifi,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';

export function AppSidebar() {
    const { isCurrentUrl } = useCurrentUrl();

    const hotspotItems = [
        { title: 'Profiles', href: '/hotspot/profiles', icon: Wifi },
        { title: 'Vouchers', href: '/hotspot/vouchers', icon: Ticket },
        { title: 'Batches', href: '/hotspot/batches', icon: Layers },
        { title: 'IP Bindings', href: '/hotspot/ip-bindings', icon: ShieldCheck },
        { title: 'Active Sessions', href: '/hotspot/sessions', icon: Activity },
    ];

    const salesItems = [
        { title: 'Cashier POS', href: '/sales/create', icon: ShoppingCart },
        { title: 'Transactions', href: '/sales', icon: Receipt },
    ];

    const infraItems = [
        { title: 'Access Points', href: '/access-points', icon: Radio },
        { title: 'Reconciliation', href: '/reconciliation', icon: RefreshCw },
        { title: 'Router Connections', href: '/routers', icon: Server },
        { title: 'Audit Trail', href: '/audit-logs', icon: History },
    ];

    return (
        <Sidebar collapsible="icon" variant="sidebar">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm tracking-wider">
                                    L-NET
                                </div>
                                <div className="ml-1 grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold tracking-tight">L-Net Access</span>
                                    <span className="truncate text-xs text-muted-foreground">Network Operations</span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                {/* Overview */}
                <SidebarGroup className="px-2 py-0">
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isCurrentUrl('/dashboard')} tooltip={{ children: 'Dashboard' }}>
                                <Link href="/dashboard">
                                    <LayoutDashboard className="size-4" />
                                    <span>Dashboard</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                {/* Hotspot */}
                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                        Hotspot
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        {hotspotItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild isActive={isCurrentUrl(item.href)} tooltip={{ children: item.title }}>
                                    <Link href={item.href}>
                                        <item.icon className="size-4" />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                {/* Sales */}
                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                        Sales
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        {salesItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild isActive={isCurrentUrl(item.href)} tooltip={{ children: item.title }}>
                                    <Link href={item.href}>
                                        <item.icon className="size-4" />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                {/* Members */}
                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                        Customers
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isCurrentUrl('/members')} tooltip={{ children: 'Members' }}>
                                <Link href="/members">
                                    <Users className="size-4" />
                                    <span>Members</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isCurrentUrl('/pppoe')} tooltip={{ children: 'PPPoE' }}>
                                <Link href="/pppoe">
                                    <Network className="size-4" />
                                    <span>PPPoE</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                {/* Infrastructure & Audit */}
                <SidebarGroup className="px-2 py-0">
                    <SidebarGroupLabel className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
                        System
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        {infraItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton asChild isActive={isCurrentUrl(item.href)} tooltip={{ children: item.title }}>
                                    <Link href={item.href}>
                                        <item.icon className="size-4" />
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
