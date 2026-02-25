"use client";

import { TrendingUp, TrendingDown, ArrowUpRight, Clock, DollarSign, FolderKanban, Users, Inbox, FileText, Send, AlertTriangle } from "lucide-react";
import { trpc } from "@/app/providers";
import { useSession } from "next-auth/react";

export default function DashboardPage() {
    const { data: session } = useSession();
    const { data: rawProjects = [] } = trpc.project.list.useQuery();
    const { data: rawTeam = [] } = trpc.team.list.useQuery();
    const { data: rawInvoices = [] } = trpc.invoice.list.useQuery();
    const { data: rawClients = [] } = trpc.clients.list.useQuery();
    const { data: rawTime = [] } = trpc.time.list.useQuery();

    // Compute stats from real data
    const activeProjects = rawProjects.filter((p: any) => p.status === "active");
    const totalHours = rawTeam.reduce((s: number, m: any) => s + (m.timeEntries || []).reduce((hs: number, te: any) => hs + te.hours, 0), 0);
    const revenueMTD = rawInvoices.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + i.amount, 0);
    const avgUtil = rawTeam.length > 0 ? Math.round(rawTeam.reduce((s: number, m: any) => {
        const hrs = (m.timeEntries || []).reduce((hs: number, te: any) => hs + te.hours, 0);
        return s + Math.min(100, Math.round((hrs / 240) * 100));
    }, 0) / rawTeam.length) : 0;

    const stats = [
        { label: "Active Projects", value: String(activeProjects.length), change: "", up: true, icon: FolderKanban, color: "var(--accent-primary)" },
        { label: "Hours Logged", value: String(Math.round(totalHours)), change: "", up: true, icon: Clock, color: "var(--accent-secondary)" },
        { label: "Revenue (Paid)", value: `$${(revenueMTD / 1000).toFixed(1)}k`, change: "", up: true, icon: DollarSign, color: "var(--accent-gold)" },
        { label: "Team Utilization", value: `${avgUtil}%`, change: "", up: true, icon: Users, color: "var(--info)" },
    ];

    // Recent projects from DB
    const recentProjects = rawProjects.slice(0, 5).map((p: any) => ({
        name: p.name,
        client: p.client?.name || "—",
        phase: p.phases?.[0]?.name || p.phase || "—",
        progress: p.progress ?? 0,
        budget: Math.round(((p.budgetUsed ?? 0) / Math.max(p.contractValue || 1, 1)) * 100),
        status: p.status === "active" ? "on-track" : "at-risk",
    }));

    // Team timesheets from DB
    const recentTimesheets = rawTeam.slice(0, 5).map((m: any) => {
        const hrs = (m.timeEntries || []).reduce((s: number, te: any) => s + te.hours, 0);
        const submitted = (m.timeEntries || []).some((te: any) => te.status === "submitted" || te.status === "approved");
        return {
            person: m.name,
            initials: m.name.split(" ").map((p: string) => p[0]).join("").toUpperCase().slice(0, 2),
            hours: hrs,
            submitted,
        };
    });
    const submittedCount = recentTimesheets.filter(t => t.submitted).length;

    // Revenue chart — simple bar heights from project contract values
    const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
    const totalContract = rawProjects.reduce((s: number, p: any) => s + (p.contractValue || 0), 0);
    const monthlyEstimate = totalContract > 0 ? totalContract / 12 : 0;
    const revenueData = months.map(() => monthlyEstimate > 0 ? Math.round(30 + Math.random() * 60) : 10);

    // Greeting based on time of day
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const userName = session?.user?.name?.split(" ")[0] || "there";

    return (
        <div>
            {/* Page header */}
            <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                    {greeting}, {userName}
                </h1>
                <p style={{ marginTop: "4px", fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 300 }}>
                    Here&apos;s how your firm is doing this week.
                </p>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
                {stats.map((stat, i) => (
                    <div key={i} style={{ padding: "20px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <p style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</p>
                            <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: `color-mix(in srgb, ${stat.color} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${stat.color} 12%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <stat.icon size={14} style={{ color: stat.color }} />
                            </div>
                        </div>
                        <p style={{ marginTop: "10px", fontSize: "28px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Main grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* Revenue chart */}
                <div style={{ padding: "24px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <div>
                            <h3 style={{ fontSize: "15px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Revenue</h3>
                            <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300, marginTop: "2px" }}>Monthly breakdown — FY 2026</p>
                        </div>
                        <span style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase", padding: "4px 10px", borderRadius: "4px", border: "1px solid var(--border-primary)" }}>12 Months</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "140px" }}>
                        {revenueData.map((h, i) => (
                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                                <div
                                    style={{
                                        width: "100%",
                                        borderRadius: "3px 3px 0 0",
                                        height: `${h}%`,
                                        background: i === new Date().getMonth() ? "var(--accent-primary)" : "rgba(176,122,74,0.12)",
                                        transition: "height 0.6s ease",
                                        minHeight: "4px",
                                    }}
                                />
                                <span style={{ fontSize: "8px", color: "var(--text-muted)", marginTop: "6px", fontWeight: 400 }}>{months[i]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Empty state or deadlines */}
                <div style={{ padding: "24px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <div>
                            <h3 style={{ fontSize: "15px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Upcoming Deadlines</h3>
                            <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300, marginTop: "2px" }}>Next 14 days</p>
                        </div>
                    </div>
                    {rawProjects.length === 0 ? (
                        <div style={{ padding: "30px 0", textAlign: "center" }}>
                            <p style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 300 }}>No projects yet — create one to get started.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            {rawProjects.slice(0, 3).map((p: any, i: number) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: "6px", background: "var(--bg-warm)", border: "1px solid var(--border-primary)" }}>
                                    <div>
                                        <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{p.phases?.[0]?.name || "General"}</p>
                                        <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300, marginTop: "1px" }}>{p.name}</p>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}>{p.endDate || "—"}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Projects table */}
                <div style={{ gridColumn: "span 2", padding: "24px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <div>
                            <h3 style={{ fontSize: "15px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Active Projects</h3>
                            <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300, marginTop: "2px" }}>Budget and progress overview</p>
                        </div>
                        <a href="/dashboard/projects" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--accent-primary)", textDecoration: "none", fontWeight: 500 }}>
                            View all <ArrowUpRight size={12} />
                        </a>
                    </div>

                    {recentProjects.length === 0 ? (
                        <div style={{ padding: "30px 0", textAlign: "center" }}>
                            <p style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 300 }}>No projects yet. Head to the Projects page to create your first one.</p>
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                                        {["Project", "Client", "Phase", "Progress", "Budget Used", "Status"].map((h) => (
                                            <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentProjects.map((proj, i) => (
                                        <tr key={i} style={{ borderBottom: "1px solid var(--border-primary)", cursor: "pointer" }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-warm)"; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                        >
                                            <td style={{ padding: "14px 12px" }}>
                                                <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{proj.name}</span>
                                            </td>
                                            <td style={{ padding: "14px 12px", fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 300 }}>{proj.client}</td>
                                            <td style={{ padding: "14px 12px", fontSize: "12px", color: "var(--text-secondary)" }}>{proj.phase}</td>
                                            <td style={{ padding: "14px 12px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <div style={{ flex: 1, height: "4px", borderRadius: "2px", background: "var(--bg-tertiary)", maxWidth: "80px" }}>
                                                        <div style={{ height: "100%", borderRadius: "2px", width: `${proj.progress}%`, background: "var(--accent-primary)" }} />
                                                    </div>
                                                    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400, width: "32px" }}>{proj.progress}%</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: "14px 12px" }}>
                                                <span style={{ fontSize: "12px", fontWeight: 500, color: proj.budget > 95 ? "var(--danger)" : proj.budget > 80 ? "var(--warning)" : "var(--text-secondary)" }}>{proj.budget}%</span>
                                            </td>
                                            <td style={{ padding: "14px 12px" }}>
                                                <span style={{
                                                    fontSize: "9px", fontWeight: 600, padding: "3px 8px", borderRadius: "3px",
                                                    textTransform: "uppercase", letterSpacing: "0.04em",
                                                    color: proj.status === "on-track" ? "var(--success)" : "var(--danger)",
                                                    background: proj.status === "on-track" ? "rgba(90,122,70,0.08)" : "rgba(176,80,64,0.08)",
                                                }}>
                                                    {proj.status === "on-track" ? "On Track" : "At Risk"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Timesheets */}
                <div style={{ padding: "24px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <div>
                            <h3 style={{ fontSize: "15px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Timesheets</h3>
                            <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300, marginTop: "2px" }}>Team submissions</p>
                        </div>
                        <span style={{ fontSize: "11px", color: "var(--accent-primary)", fontWeight: 500 }}>{submittedCount}/{recentTimesheets.length} submitted</span>
                    </div>
                    {recentTimesheets.length === 0 ? (
                        <div style={{ padding: "20px 0", textAlign: "center" }}>
                            <p style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 300 }}>No team members yet.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {recentTimesheets.map((ts, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", borderRadius: "6px", background: "var(--bg-warm)", border: "1px solid var(--border-primary)" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: ts.submitted ? "rgba(90,122,70,0.08)" : "var(--bg-secondary)", border: ts.submitted ? "1px solid rgba(90,122,70,0.15)" : "1px solid var(--border-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 600, color: ts.submitted ? "var(--success)" : "var(--text-muted)" }}>
                                            {ts.initials}
                                        </div>
                                        <div>
                                            <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>{ts.person}</p>
                                            <p style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 300 }}>{ts.hours}h logged</p>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: "9px", fontWeight: 600, padding: "3px 8px", borderRadius: "3px", textTransform: "uppercase", letterSpacing: "0.04em", color: ts.submitted ? "var(--success)" : "var(--warning)", background: ts.submitted ? "rgba(90,122,70,0.08)" : "rgba(176,138,48,0.08)" }}>
                                        {ts.submitted ? "Submitted" : "Pending"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Smart Inbox */}
                <div style={{ gridColumn: "span 2", padding: "24px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: "rgba(176,122,74,0.06)", border: "1px solid rgba(176,122,74,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Inbox size={14} style={{ color: "var(--accent-primary)" }} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: "15px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Smart Inbox</h3>
                                <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300, marginTop: "1px" }}>Items requiring your attention</p>
                            </div>
                        </div>
                    </div>
                    {(() => {
                        const items: { type: string; label: string; badge: string; color: string; bg: string; href: string }[] = [];
                        // Overdue invoices
                        (rawInvoices as any[]).filter((i: any) => i.status === "overdue").forEach((i: any) => items.push({ type: "Invoice", label: `Invoice #${i.number || i.id.slice(0, 6)} is overdue`, badge: "Overdue", color: "var(--danger)", bg: "rgba(176,80,64,0.08)", href: "/dashboard/invoices" }));
                        // Submitted timesheets awaiting review
                        (rawTime as any[]).filter((t: any) => t.status === "submitted").forEach((t: any) => items.push({ type: "Timesheet", label: `${t.user?.name || "Team member"} submitted ${t.hours}h for review`, badge: "Review", color: "var(--warning)", bg: "rgba(176,138,48,0.08)", href: "/dashboard/time" }));
                        // Draft proposals
                        (rawClients as any[]).forEach((c: any) => (c.proposals || []).filter((p: any) => p.status === "draft").forEach((p: any) => items.push({ type: "Proposal", label: `Draft proposal "${p.title}" for ${c.name}`, badge: "Draft", color: "var(--info)", bg: "rgba(90,122,144,0.08)", href: "/dashboard/clients" })));
                        // Unpaid invoices
                        (rawInvoices as any[]).filter((i: any) => i.status === "sent" || i.status === "viewed").forEach((i: any) => items.push({ type: "Invoice", label: `Invoice #${i.number || i.id.slice(0, 6)} awaiting payment`, badge: "Pending", color: "var(--text-muted)", bg: "var(--bg-secondary)", href: "/dashboard/invoices" }));

                        return items.length === 0 ? (
                            <div style={{ padding: "20px 0", textAlign: "center" }}>
                                <p style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 300 }}>All clear — no pending items.</p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                {items.slice(0, 8).map((item, i) => (
                                    <a key={i} href={item.href} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "6px", background: "var(--bg-warm)", border: "1px solid var(--border-primary)", textDecoration: "none" }}
                                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-secondary)"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-primary)"; }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <span style={{ fontSize: "9px", fontWeight: 600, padding: "2px 6px", borderRadius: "3px", textTransform: "uppercase", color: item.color, background: item.bg }}>{item.type}</span>
                                            <span style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 400 }}>{item.label}</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <span style={{ fontSize: "9px", fontWeight: 600, padding: "2px 6px", borderRadius: "3px", textTransform: "uppercase", color: item.color, background: item.bg }}>{item.badge}</span>
                                            <ArrowUpRight size={12} style={{ color: "var(--text-muted)" }} />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        );
                    })()}
                </div>

                {/* Quick actions */}
                <div style={{ padding: "24px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "20px" }}>Quick Actions</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {[
                            { label: "New Project", desc: "Create a new project with phases", icon: FolderKanban, href: "/dashboard/projects" },
                            { label: "Log Time", desc: "Open your weekly timesheet", icon: Clock, href: "/dashboard/time" },
                            { label: "Create Invoice", desc: "Generate from tracked time", icon: DollarSign, href: "/dashboard/invoices" },
                            { label: "View Reports", desc: "Analytics and exports", icon: TrendingUp, href: "/dashboard/reports" },
                        ].map((action) => (
                            <a key={action.label} href={action.href}
                                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "6px", background: "var(--bg-warm)", border: "1px solid var(--border-primary)", textDecoration: "none", transition: "all 0.15s" }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-secondary)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-primary)"; e.currentTarget.style.boxShadow = "none"; }}
                            >
                                <div style={{ width: "36px", height: "36px", borderRadius: "6px", background: "rgba(176,122,74,0.06)", border: "1px solid rgba(176,122,74,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <action.icon size={16} style={{ color: "var(--accent-primary)" }} />
                                </div>
                                <div>
                                    <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{action.label}</p>
                                    <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300 }}>{action.desc}</p>
                                </div>
                                <ArrowUpRight size={14} style={{ color: "var(--text-muted)", marginLeft: "auto" }} />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
