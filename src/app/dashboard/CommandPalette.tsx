"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/app/providers";
import {
    Search,
    LayoutDashboard,
    FolderKanban,
    Clock,
    DollarSign,
    FileText,
    Users,
    BarChart3,
    Settings,
    Building2,
    CalendarRange,
    Receipt,
    Waypoints,
    Plus,
    ArrowRight,
    Command,
} from "lucide-react";

/* ─── Types ─── */
interface PaletteItem {
    id: string;
    label: string;
    subtitle?: string;
    icon: React.ReactNode;
    action: () => void;
    category: string;
}

/* ─── Static Navigation Items ─── */
const navActions = (go: (path: string) => void): PaletteItem[] => [
    { id: "nav-overview", label: "Overview", subtitle: "Dashboard home", icon: <LayoutDashboard size={16} />, action: () => go("/dashboard"), category: "Navigate" },
    { id: "nav-projects", label: "Projects", subtitle: "All projects", icon: <FolderKanban size={16} />, action: () => go("/dashboard/projects"), category: "Navigate" },
    { id: "nav-time", label: "Time", subtitle: "Time tracking", icon: <Clock size={16} />, action: () => go("/dashboard/time"), category: "Navigate" },
    { id: "nav-budgets", label: "Budgets", subtitle: "Budget tracking", icon: <DollarSign size={16} />, action: () => go("/dashboard/budgets"), category: "Navigate" },
    { id: "nav-expenses", label: "Expenses", subtitle: "Expense tracking", icon: <Receipt size={16} />, action: () => go("/dashboard/expenses"), category: "Navigate" },
    { id: "nav-invoices", label: "Money", subtitle: "Invoices & billing", icon: <FileText size={16} />, action: () => go("/dashboard/invoices"), category: "Navigate" },
    { id: "nav-team", label: "Team", subtitle: "Team management", icon: <Users size={16} />, action: () => go("/dashboard/team"), category: "Navigate" },
    { id: "nav-clients", label: "Clients", subtitle: "Client management", icon: <Building2 size={16} />, action: () => go("/dashboard/clients"), category: "Navigate" },
    { id: "nav-resources", label: "Resources", subtitle: "Resource allocation", icon: <Waypoints size={16} />, action: () => go("/dashboard/resources"), category: "Navigate" },
    { id: "nav-reports", label: "Reports", subtitle: "Analytics & reports", icon: <BarChart3 size={16} />, action: () => go("/dashboard/reports"), category: "Navigate" },
    { id: "nav-schedule", label: "Schedule", subtitle: "Calendar view", icon: <CalendarRange size={16} />, action: () => go("/dashboard/schedule"), category: "Navigate" },
    { id: "nav-settings", label: "Settings", subtitle: "Organization settings", icon: <Settings size={16} />, action: () => go("/dashboard/settings"), category: "Navigate" },
];

const quickActions = (go: (path: string) => void): PaletteItem[] => [
    { id: "qa-new-project", label: "New Project", subtitle: "Create a new project", icon: <Plus size={16} />, action: () => go("/dashboard/projects?new=1"), category: "Quick Actions" },
    { id: "qa-log-time", label: "Log Time", subtitle: "Open timesheet", icon: <Clock size={16} />, action: () => go("/dashboard/time"), category: "Quick Actions" },
    { id: "qa-new-invoice", label: "Create Invoice", subtitle: "New invoice", icon: <FileText size={16} />, action: () => go("/dashboard/invoices?new=1"), category: "Quick Actions" },
    { id: "qa-add-expense", label: "Add Expense", subtitle: "Track an expense", icon: <Receipt size={16} />, action: () => go("/dashboard/expenses?new=1"), category: "Quick Actions" },
];

/* ─── Fuzzy match (simple) ─── */
function fuzzyMatch(query: string, text: string): boolean {
    const q = query.toLowerCase();
    const t = text.toLowerCase();
    if (t.includes(q)) return true;
    let qi = 0;
    for (let i = 0; i < t.length && qi < q.length; i++) {
        if (t[i] === q[qi]) qi++;
    }
    return qi === q.length;
}

/* ─── Component ─── */
export default function CommandPalette({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState("");
    const [selectedIdx, setSelectedIdx] = useState(0);

    // Fetch projects + clients for search
    const { data: projects = [] } = trpc.project.list.useQuery(undefined, { enabled: open });
    const { data: clients = [] } = trpc.clients.list.useQuery(undefined, { enabled: open });

    const go = (path: string) => {
        onClose();
        router.push(path);
    };

    // Build full item list
    const allItems = useMemo(() => {
        const items: PaletteItem[] = [
            ...quickActions(go),
            ...navActions(go),
        ];

        // Add projects
        (projects as any[]).forEach((p: any) => {
            items.push({
                id: `proj-${p.id}`,
                label: p.name,
                subtitle: p.client?.name || p.status,
                icon: <FolderKanban size={16} />,
                action: () => go(`/dashboard/projects/${p.id}`),
                category: "Projects",
            });
        });

        // Add clients
        (clients as any[]).forEach((c: any) => {
            items.push({
                id: `client-${c.id}`,
                label: c.name,
                subtitle: c.email || "",
                icon: <Building2 size={16} />,
                action: () => go("/dashboard/clients"),
                category: "Clients",
            });
        });

        return items;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projects, clients, open]);

    // Filter by query
    const filtered = useMemo(() => {
        if (!query.trim()) return allItems;
        return allItems.filter(
            (item) =>
                fuzzyMatch(query, item.label) ||
                fuzzyMatch(query, item.subtitle || "") ||
                fuzzyMatch(query, item.category)
        );
    }, [allItems, query]);

    // Group by category
    const grouped = useMemo(() => {
        const map = new Map<string, PaletteItem[]>();
        for (const item of filtered) {
            const list = map.get(item.category) || [];
            list.push(item);
            map.set(item.category, list);
        }
        return map;
    }, [filtered]);

    // Reset on open/close
    useEffect(() => {
        if (open) {
            setQuery("");
            setSelectedIdx(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    // Clamp selected index
    useEffect(() => {
        if (selectedIdx >= filtered.length) setSelectedIdx(Math.max(0, filtered.length - 1));
    }, [filtered, selectedIdx]);

    // Keyboard navigation
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIdx((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && filtered[selectedIdx]) {
                e.preventDefault();
                filtered[selectedIdx].action();
            } else if (e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [open, filtered, selectedIdx, onClose]);

    if (!open) return null;

    let flatIdx = 0;

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.4)",
                    backdropFilter: "blur(4px)",
                    WebkitBackdropFilter: "blur(4px)",
                    zIndex: 9998,
                    animation: "fadeIn 0.15s ease",
                }}
            />
            {/* Palette */}
            <div
                className="scale-in"
                style={{
                    position: "fixed",
                    top: "20%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "560px",
                    maxWidth: "92vw",
                    maxHeight: "480px",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-secondary)",
                    borderRadius: "14px",
                    boxShadow: "0 20px 60px rgba(0,0,0,0.20)",
                    zIndex: 9999,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                }}
            >
                {/* Search input */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "14px 18px",
                        borderBottom: "1px solid var(--border-primary)",
                    }}
                >
                    <Search size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search pages, projects, clients, actions..."
                        value={query}
                        onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
                        style={{
                            flex: 1,
                            border: "none",
                            background: "transparent",
                            fontSize: "15px",
                            color: "var(--text-primary)",
                            outline: "none",
                            fontFamily: "inherit",
                        }}
                    />
                    <kbd
                        style={{
                            fontSize: "10px",
                            color: "var(--text-muted)",
                            background: "var(--bg-secondary)",
                            border: "1px solid var(--border-primary)",
                            borderRadius: "4px",
                            padding: "2px 6px",
                            fontFamily: "inherit",
                        }}
                    >
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
                    {filtered.length === 0 ? (
                        <div style={{ padding: "32px 16px", textAlign: "center" }}>
                            <Search size={24} style={{ color: "var(--text-muted)", opacity: 0.3, marginBottom: "8px" }} />
                            <p style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 300 }}>
                                No results for &ldquo;{query}&rdquo;
                            </p>
                        </div>
                    ) : (
                        Array.from(grouped.entries()).map(([category, items]) => (
                            <div key={category} style={{ marginBottom: "4px" }}>
                                <p
                                    style={{
                                        fontSize: "10px",
                                        fontWeight: 600,
                                        color: "var(--text-muted)",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.06em",
                                        padding: "6px 10px 4px",
                                    }}
                                >
                                    {category}
                                </p>
                                {items.map((item) => {
                                    const idx = flatIdx++;
                                    const isSelected = idx === selectedIdx;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={item.action}
                                            onMouseEnter={() => setSelectedIdx(idx)}
                                            style={{
                                                width: "100%",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "10px",
                                                padding: "10px 10px",
                                                borderRadius: "8px",
                                                border: "none",
                                                cursor: "pointer",
                                                background: isSelected ? "var(--bg-warm)" : "transparent",
                                                color: isSelected ? "var(--text-primary)" : "var(--text-secondary)",
                                                fontSize: "13px",
                                                fontFamily: "inherit",
                                                textAlign: "left",
                                                transition: "background 0.1s",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: "28px",
                                                    height: "28px",
                                                    borderRadius: "6px",
                                                    background: isSelected ? "rgba(176,122,74,0.10)" : "var(--bg-secondary)",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    color: isSelected ? "var(--accent-primary)" : "var(--text-muted)",
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {item.icon}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                    {item.label}
                                                </p>
                                                {item.subtitle && (
                                                    <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300, marginTop: "1px" }}>
                                                        {item.subtitle}
                                                    </p>
                                                )}
                                            </div>
                                            {isSelected && <ArrowRight size={14} style={{ color: "var(--accent-primary)", flexShrink: 0 }} />}
                                        </button>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer hints */}
                <div
                    style={{
                        padding: "8px 16px",
                        borderTop: "1px solid var(--border-primary)",
                        display: "flex",
                        gap: "16px",
                        alignItems: "center",
                    }}
                >
                    {[
                        { keys: "↑↓", label: "navigate" },
                        { keys: "↵", label: "open" },
                        { keys: "esc", label: "close" },
                    ].map((h) => (
                        <span key={h.label} style={{ fontSize: "10px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                            <kbd
                                style={{
                                    fontSize: "9px",
                                    background: "var(--bg-secondary)",
                                    border: "1px solid var(--border-primary)",
                                    borderRadius: "3px",
                                    padding: "1px 5px",
                                    fontFamily: "inherit",
                                }}
                            >
                                {h.keys}
                            </kbd>
                            {h.label}
                        </span>
                    ))}
                </div>
            </div>
        </>
    );
}
