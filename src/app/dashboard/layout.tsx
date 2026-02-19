"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
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
} from "lucide-react";

const navItems = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "Projects", href: "/dashboard/projects", icon: FolderKanban },
    { label: "Time", href: "/dashboard/time", icon: Clock },
    { label: "Budgets", href: "/dashboard/budgets", icon: DollarSign },
    { label: "Invoices", href: "/dashboard/invoices", icon: FileText },
    { label: "Team", href: "/dashboard/team", icon: Users },
    { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
];

const bottomItems = [
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [collapsed, setCollapsed] = useState(false);

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
                                    fontWeight: active ? 500 : 400,
                                    fontSize: "13px",
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

                    {/* Actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                            style={{
                                width: "36px", height: "36px", borderRadius: "6px",
                                border: "1px solid var(--border-primary)", background: "var(--bg-card)",
                                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                color: "var(--text-muted)", position: "relative", transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-secondary)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-primary)"; e.currentTarget.style.color = "var(--text-muted)"; }}
                        >
                            <Bell size={16} />
                            <div style={{ position: "absolute", top: "6px", right: "6px", width: "6px", height: "6px", borderRadius: "50%", background: "var(--danger)" }} />
                        </button>
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
