"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { trpc } from "@/app/providers";
import {
    LayoutDashboard,
    FolderKanban,
    Clock,
    DollarSign,
    FileText,
    Users,
    BarChart3,
    Settings,
    ChevronLeft,
    ChevronRight,
    Bell,
    Search,
    LogOut,
    Building2,
    ChevronDown,
    Check,
    AlertTriangle,
    Info,
    CalendarRange,
    Receipt,
    Waypoints,
} from "lucide-react";

const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Projects", href: "/dashboard/projects", icon: FolderKanban },
    { label: "Time", href: "/dashboard/time", icon: Clock },
    { label: "Budgets", href: "/dashboard/budgets", icon: DollarSign },
    { label: "Expenses", href: "/dashboard/expenses", icon: Receipt },
    { label: "Invoices", href: "/dashboard/invoices", icon: FileText },
    { label: "Team", href: "/dashboard/team", icon: Users },
    { label: "Clients", href: "/dashboard/clients", icon: Building2 },
    { label: "Resources", href: "/dashboard/resources", icon: Waypoints },
    { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
    { label: "Schedule", href: "/dashboard/schedule", icon: CalendarRange },
];

const bottomItems = [
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const notifTypeStyles: Record<string, { color: string; icon: React.ComponentType<any> }> = {
    budget_critical: { color: "var(--danger)", icon: AlertTriangle },
    budget_warning: { color: "var(--warning)", icon: AlertTriangle },
    budget_alert: { color: "var(--accent-primary)", icon: DollarSign },
    info: { color: "var(--text-muted)", icon: Info },
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [collapsed, setCollapsed] = useState(false);
    const [showNotifs, setShowNotifs] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    // Notification data
    const { data: notifications = [], refetch: refetchNotifs } = trpc.notification.list.useQuery(undefined, { enabled: status === "authenticated" });
    const { data: unreadCount = 0, refetch: refetchCount } = trpc.notification.unreadCount.useQuery(undefined, { enabled: status === "authenticated" });
    const markRead = trpc.notification.markRead.useMutation({ onSuccess: () => { refetchNotifs(); refetchCount(); } });
    const markAllRead = trpc.notification.markAllRead.useMutation({ onSuccess: () => { refetchNotifs(); refetchCount(); } });
    const checkBudgets = trpc.notification.checkBudgets.useMutation({ onSuccess: () => { refetchNotifs(); refetchCount(); } });

    // Auto-check budgets on mount
    useEffect(() => {
        if (status === "authenticated") {
            checkBudgets.mutate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
                setShowNotifs(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Redirect to login if not authenticated
    if (status === "unauthenticated") {
        router.push("/login");
        return null;
    }

    // Loading state
    if (status === "loading") {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "4px", border: "1.5px solid var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 21L12 3L21 21" /><path d="M7.5 14h9" />
                        </svg>
                    </div>
                    <p style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 300 }}>Loading...</p>
                </div>
            </div>
        );
    }

    const userName = session?.user?.name || "User";
    const userInitials = userName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

    const isActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard";
        return pathname.startsWith(href);
    };

    const sidebarWidth = collapsed ? 72 : 240;

    const formatTimeAgo = (dateStr: string) => {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const mins = Math.floor(diffMs / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    return (
        <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg-primary)" }}>
            {/* Sidebar */}
            <aside
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: `${sidebarWidth}px`,
                    background: "var(--bg-card)",
                    borderRight: "1px solid var(--border-primary)",
                    display: "flex",
                    flexDirection: "column",
                    transition: "width 0.25s ease",
                    zIndex: 40,
                    overflow: "hidden",
                }}
            >
                {/* Logo */}
                <div
                    style={{
                        padding: collapsed ? "20px 12px" : "20px 20px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: collapsed ? "center" : "flex-start",
                        gap: "10px",
                        borderBottom: "1px solid var(--border-primary)",
                        minHeight: "65px",
                    }}
                >
                    <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
                        <div
                            style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "4px",
                                border: "1.5px solid var(--accent-primary)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 21L12 3L21 21" />
                                <path d="M7.5 14h9" />
                            </svg>
                        </div>
                        {!collapsed && (
                            <span style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", whiteSpace: "nowrap" }}>
                                ArchFlow
                            </span>
                        )}
                    </Link>
                </div>

                {/* Org selector */}
                <div style={{ padding: collapsed ? "12px 8px" : "12px 14px" }}>
                    <button
                        style={{
                            width: "100%",
                            padding: collapsed ? "8px" : "8px 10px",
                            borderRadius: "6px",
                            border: "1px solid var(--border-primary)",
                            background: "var(--bg-warm)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: collapsed ? "center" : "flex-start",
                            gap: "8px",
                            transition: "all 0.2s",
                        }}
                    >
                        <div style={{ width: "24px", height: "24px", borderRadius: "4px", background: "rgba(176,122,74,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Building2 size={12} style={{ color: "var(--accent-primary)" }} />
                        </div>
                        {!collapsed && (
                            <>
                                <div style={{ flex: 1, textAlign: "left", overflow: "hidden" }}>
                                    <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Studio Design Co.</p>
                                    <p style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 300 }}>Professional</p>
                                </div>
                                <ChevronDown size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                            </>
                        )}
                    </button>
                </div>

                {/* Nav links */}
                <nav style={{ flex: 1, padding: collapsed ? "8px 8px" : "8px 14px", display: "flex", flexDirection: "column", gap: "2px" }}>
                    {navItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    padding: collapsed ? "10px" : "10px 12px",
                                    borderRadius: "6px",
                                    textDecoration: "none",
                                    justifyContent: collapsed ? "center" : "flex-start",
                                    background: active ? "rgba(176,122,74,0.08)" : "transparent",
                                    color: active ? "var(--accent-primary)" : "var(--text-tertiary)",
                                    fontSize: "13px",
                                    fontWeight: active ? 500 : 400,
                                    transition: "all 0.15s",
                                    whiteSpace: "nowrap",
                                }}
                                onMouseEnter={(e) => {
                                    if (!active) {
                                        e.currentTarget.style.background = "var(--bg-warm)";
                                        e.currentTarget.style.color = "var(--text-secondary)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!active) {
                                        e.currentTarget.style.background = "transparent";
                                        e.currentTarget.style.color = "var(--text-tertiary)";
                                    }
                                }}
                            >
                                <item.icon size={18} style={{ flexShrink: 0 }} />
                                {!collapsed && item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom nav */}
                <div style={{ padding: collapsed ? "8px 8px 12px" : "8px 14px 12px", borderTop: "1px solid var(--border-primary)", display: "flex", flexDirection: "column", gap: "2px" }}>
                    {bottomItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link key={item.href} href={item.href}
                                style={{
                                    display: "flex", alignItems: "center", gap: "10px",
                                    padding: collapsed ? "10px" : "10px 12px", borderRadius: "6px",
                                    textDecoration: "none", justifyContent: collapsed ? "center" : "flex-start",
                                    background: active ? "rgba(176,122,74,0.08)" : "transparent",
                                    color: active ? "var(--accent-primary)" : "var(--text-tertiary)",
                                    fontSize: "13px", fontWeight: active ? 500 : 400, transition: "all 0.15s",
                                }}
                                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--bg-warm)"; e.currentTarget.style.color = "var(--text-secondary)"; } }}
                                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; } }}
                            >
                                <item.icon size={18} style={{ flexShrink: 0 }} />
                                {!collapsed && item.label}
                            </Link>
                        );
                    })}

                    {/* User */}
                    <div
                        style={{
                            marginTop: "8px",
                            padding: collapsed ? "8px" : "8px 10px",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            justifyContent: collapsed ? "center" : "flex-start",
                            cursor: "pointer",
                        }}
                    >
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "11px", fontWeight: 500, flexShrink: 0 }}>
                            {userInitials}
                        </div>
                        {!collapsed && (
                            <div style={{ flex: 1, overflow: "hidden" }}>
                                <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userName}</p>
                                <p style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 300 }}>{(session?.user as any)?.role || "Member"}</p>
                            </div>
                        )}
                        {!collapsed && <LogOut size={14} style={{ color: "var(--text-muted)", flexShrink: 0, cursor: "pointer" }} onClick={() => signOut({ callbackUrl: "/login" })} />}
                    </div>
                </div>

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    style={{
                        position: "absolute",
                        top: "76px",
                        right: "-12px",
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        border: "1px solid var(--border-secondary)",
                        background: "var(--bg-card)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-muted)",
                        zIndex: 50,
                        boxShadow: "var(--shadow-sm)",
                        transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; e.currentTarget.style.color = "var(--accent-primary)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-secondary)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                >
                    {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                </button>
            </aside>

            {/* Main content area */}
            <div style={{ flex: 1, marginLeft: `${sidebarWidth}px`, transition: "margin-left 0.25s ease", display: "flex", flexDirection: "column" }}>
                {/* Top bar */}
                <header
                    style={{
                        position: "sticky",
                        top: 0,
                        zIndex: 30,
                        height: "65px",
                        background: "rgba(250,248,245,0.92)",
                        backdropFilter: "blur(12px)",
                        WebkitBackdropFilter: "blur(12px)",
                        borderBottom: "1px solid var(--border-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0 28px",
                    }}
                >
                    {/* Search */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-secondary)", borderRadius: "6px", padding: "8px 14px", maxWidth: "360px", width: "100%", border: "1px solid var(--border-primary)" }}>
                        <Search size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                        <input
                            type="text"
                            placeholder="Search projects, clients, invoices..."
                            style={{ flex: 1, border: "none", background: "transparent", fontSize: "13px", color: "var(--text-primary)", outline: "none", fontFamily: "inherit" }}
                        />
                        <kbd style={{ fontSize: "10px", color: "var(--text-muted)", background: "var(--bg-card)", border: "1px solid var(--border-primary)", borderRadius: "3px", padding: "1px 5px", fontFamily: "inherit" }}>⌘K</kbd>
                    </div>

                    {/* Actions — Notification Bell */}
                    <div ref={notifRef} style={{ display: "flex", alignItems: "center", gap: "8px", position: "relative" }}>
                        <button
                            onClick={() => setShowNotifs(!showNotifs)}
                            style={{
                                width: "36px", height: "36px", borderRadius: "6px",
                                border: "1px solid var(--border-primary)", background: showNotifs ? "var(--bg-warm)" : "var(--bg-card)",
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                color: showNotifs ? "var(--accent-primary)" : "var(--text-muted)", position: "relative", transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-secondary)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                            onMouseLeave={(e) => {
                                if (!showNotifs) { e.currentTarget.style.borderColor = "var(--border-primary)"; e.currentTarget.style.color = "var(--text-muted)"; }
                            }}
                        >
                            <Bell size={16} />
                            {unreadCount > 0 && (
                                <div style={{
                                    position: "absolute", top: "4px", right: "4px",
                                    minWidth: "14px", height: "14px", borderRadius: "7px",
                                    background: "var(--danger)", color: "white",
                                    fontSize: "9px", fontWeight: 700, display: "flex",
                                    alignItems: "center", justifyContent: "center",
                                    padding: "0 3px", lineHeight: 1,
                                }}>
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </div>
                            )}
                        </button>

                        {/* Notification dropdown */}
                        {showNotifs && (
                            <div style={{
                                position: "absolute", top: "44px", right: 0,
                                width: "380px", maxHeight: "420px",
                                background: "var(--bg-card)", borderRadius: "10px",
                                border: "1px solid var(--border-secondary)",
                                boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
                                overflow: "hidden", display: "flex", flexDirection: "column",
                                zIndex: 100,
                            }}>
                                {/* Header */}
                                <div style={{
                                    padding: "14px 16px", borderBottom: "1px solid var(--border-primary)",
                                    display: "flex", justifyContent: "space-between", alignItems: "center",
                                }}>
                                    <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                                        Notifications {unreadCount > 0 && <span style={{ fontSize: "11px", color: "var(--accent-primary)", fontWeight: 400 }}>({unreadCount} new)</span>}
                                    </h4>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={() => markAllRead.mutate()}
                                            style={{
                                                background: "none", border: "none", cursor: "pointer",
                                                fontSize: "11px", color: "var(--accent-primary)", fontFamily: "inherit",
                                                display: "flex", alignItems: "center", gap: "4px",
                                            }}
                                        >
                                            <Check size={12} /> Mark all read
                                        </button>
                                    )}
                                </div>

                                {/* Notification list */}
                                <div style={{ flex: 1, overflowY: "auto", maxHeight: "340px" }}>
                                    {notifications.length === 0 ? (
                                        <div style={{ padding: "40px 16px", textAlign: "center" }}>
                                            <Bell size={24} style={{ color: "var(--text-muted)", opacity: 0.4, marginBottom: "8px" }} />
                                            <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 300 }}>No notifications</p>
                                        </div>
                                    ) : (
                                        notifications.map((n: any) => {
                                            const nStyle = notifTypeStyles[n.type] || notifTypeStyles.info;
                                            const NotifIcon = nStyle.icon;
                                            return (
                                                <div
                                                    key={n.id}
                                                    onClick={() => { if (!n.read) markRead.mutate({ id: n.id }); }}
                                                    style={{
                                                        padding: "12px 16px",
                                                        borderBottom: "1px solid var(--border-primary)",
                                                        display: "flex", gap: "10px", alignItems: "flex-start",
                                                        background: n.read ? "transparent" : "rgba(176,122,74,0.03)",
                                                        cursor: n.read ? "default" : "pointer",
                                                        transition: "background 0.15s",
                                                    }}
                                                >
                                                    <div style={{
                                                        width: "28px", height: "28px", borderRadius: "6px",
                                                        background: `${nStyle.color}12`, display: "flex",
                                                        alignItems: "center", justifyContent: "center", flexShrink: 0,
                                                    }}>
                                                        <NotifIcon size={13} style={{ color: nStyle.color }} />
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                            <p style={{
                                                                fontSize: "12px", fontWeight: n.read ? 400 : 600,
                                                                color: "var(--text-primary)",
                                                            }}>{n.title}</p>
                                                            {!n.read && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-primary)", flexShrink: 0 }} />}
                                                        </div>
                                                        <p style={{
                                                            fontSize: "11px", color: "var(--text-muted)",
                                                            fontWeight: 300, marginTop: "2px", lineHeight: 1.4,
                                                        }}>{n.message}</p>
                                                        <div style={{ display: "flex", gap: "8px", marginTop: "4px", alignItems: "center" }}>
                                                            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{formatTimeAgo(n.createdAt)}</span>
                                                            {n.project && (
                                                                <span style={{
                                                                    fontSize: "9px", padding: "1px 6px", borderRadius: "3px",
                                                                    background: "var(--bg-secondary)", color: "var(--text-muted)",
                                                                }}>{n.project.name}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* Page content */}
                <main style={{ flex: 1, padding: "28px" }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
