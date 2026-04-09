"use client";

import { useState } from "react";
import {
    TrendingUp,
    TrendingDown,
    ArrowUpRight,
    Clock,
    DollarSign,
    FolderKanban,
    Users,
    Inbox,
    FileText,
    Send,
    AlertTriangle,
    Activity,
    Target,
    ChevronDown,
    ChevronRight,
    CheckCircle2,
    Circle,
    Zap,
    BarChart3,
} from "lucide-react";
import { trpc } from "@/app/providers";
import { useSession } from "next-auth/react";
import { useCurrencyFormatter } from "./useCurrencyFormatter";

export default function DashboardPage() {
    const { data: session } = useSession();
    const { data: kpis } = trpc.analytics.firmKPIs.useQuery();
    const { data: rawProjects = [] } = trpc.project.list.useQuery();
    const { data: rawInvoices = [] } = trpc.invoice.list.useQuery();
    const { data: rawTime = [] } = trpc.time.list.useQuery();
    const { data: rawClients = [] } = trpc.clients.list.useQuery();
    const { formatCompactCurrency } = useCurrencyFormatter();

    const [onboardingOpen, setOnboardingOpen] = useState(true);

    // Greeting
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
    const userName = session?.user?.name?.split(" ")[0] || "there";

    const fmt = (v: number) => formatCompactCurrency(v, 1);

    // Recent projects
    const recentProjects = rawProjects.slice(0, 5).map((p: any) => ({
        name: p.name,
        client: p.client?.name || "—",
        phase: p.phases?.[0]?.name || p.phase || "—",
        progress: p.progress ?? 0,
        budget: Math.round(((p.budgetUsed ?? 0) / Math.max(p.contractValue || 1, 1)) * 100),
        status: p.status === "active" ? "on-track" : "at-risk",
    }));

    // Smart Inbox items
    const inboxItems: { type: string; label: string; badge: string; color: string; bg: string; href: string }[] = [];
    (rawInvoices as any[]).filter((i: any) => i.status === "overdue").forEach((i: any) => inboxItems.push({ type: "Invoice", label: `Invoice #${i.number || i.id.slice(0, 6)} is overdue`, badge: "Overdue", color: "var(--danger)", bg: "rgba(176,80,64,0.08)", href: "/dashboard/invoices" }));
    (rawTime as any[]).filter((t: any) => t.status === "submitted").forEach((t: any) => inboxItems.push({ type: "Timesheet", label: `${t.user?.name || "Team member"} submitted ${t.hours}h for review`, badge: "Review", color: "var(--warning)", bg: "rgba(176,138,48,0.08)", href: "/dashboard/time" }));
    (rawClients as any[]).forEach((c: any) => (c.proposals || []).filter((p: any) => p.status === "draft").forEach((p: any) => inboxItems.push({ type: "Proposal", label: `Draft proposal "${p.title}" for ${c.name}`, badge: "Draft", color: "var(--info)", bg: "rgba(90,122,144,0.08)", href: "/dashboard/clients" })));
    (rawInvoices as any[]).filter((i: any) => i.status === "sent" || i.status === "viewed").forEach((i: any) => inboxItems.push({ type: "Invoice", label: `Invoice #${i.number || i.id.slice(0, 6)} awaiting payment`, badge: "Pending", color: "var(--text-muted)", bg: "var(--bg-secondary)", href: "/dashboard/invoices" }));

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

            {/* ─── KPI Row (5 cards) ─── */}
            <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "14px", marginBottom: "24px" }}>
                {/* Operating Profit */}
                <div className="card-hover" style={{ padding: "18px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <p style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Operating Profit</p>
                        <div style={{ width: "30px", height: "30px", borderRadius: "6px", background: (kpis?.operatingProfit ?? 0) >= 0 ? "rgba(90,122,70,0.08)" : "rgba(176,80,64,0.08)", border: `1px solid ${(kpis?.operatingProfit ?? 0) >= 0 ? "rgba(90,122,70,0.12)" : "rgba(176,80,64,0.12)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <DollarSign size={13} style={{ color: (kpis?.operatingProfit ?? 0) >= 0 ? "var(--success)" : "var(--danger)" }} />
                        </div>
                    </div>
                    <p style={{ marginTop: "8px", fontSize: "24px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                        {fmt(kpis?.operatingProfit ?? 0)}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                        {(kpis?.operatingProfit ?? 0) >= 0 ? <TrendingUp size={10} style={{ color: "var(--success)" }} /> : <TrendingDown size={10} style={{ color: "var(--danger)" }} />}
                        <span style={{ fontSize: "10px", color: (kpis?.operatingProfit ?? 0) >= 0 ? "var(--success)" : "var(--danger)", fontWeight: 500 }}>
                            {(kpis?.operatingProfit ?? 0) >= 0 ? "Profitable" : "Loss"}
                        </span>
                    </div>
                </div>

                {/* Utilization Rate */}
                <div className="card-hover" style={{ padding: "18px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <p style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Utilization Rate</p>
                        <div style={{ width: "30px", height: "30px", borderRadius: "6px", background: "rgba(90,122,144,0.08)", border: "1px solid rgba(90,122,144,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Target size={13} style={{ color: "var(--info)" }} />
                        </div>
                    </div>
                    <p style={{ marginTop: "8px", fontSize: "24px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                        {kpis?.utilization ?? 0}%
                    </p>
                    {/* Mini gauge bar */}
                    <div style={{ marginTop: "6px", height: "4px", borderRadius: "2px", background: "var(--bg-tertiary)", overflow: "hidden" }}>
                        <div style={{
                            height: "100%", borderRadius: "2px", transition: "width 0.6s ease",
                            width: `${Math.min(kpis?.utilization ?? 0, 100)}%`,
                            background: (kpis?.utilization ?? 0) >= 75 ? "var(--success)" : (kpis?.utilization ?? 0) >= 50 ? "var(--warning)" : "var(--danger)",
                        }} />
                    </div>
                    <p style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "3px" }}>Target: 75%</p>
                </div>

                {/* Projected Profit */}
                <div className="card-hover" style={{ padding: "18px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <p style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Projected Profit</p>
                        <div style={{ width: "30px", height: "30px", borderRadius: "6px", background: "rgba(176,122,74,0.08)", border: "1px solid rgba(176,122,74,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <TrendingUp size={13} style={{ color: "var(--accent-primary)" }} />
                        </div>
                    </div>
                    <p style={{ marginTop: "8px", fontSize: "24px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                        {fmt(kpis?.projectedProfit ?? 0)}
                    </p>
                    <p style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "4px" }}>
                        Based on {kpis?.activeProjects ?? 0} active projects
                    </p>
                </div>

                {/* Firm Capacity */}
                <div className="card-hover" style={{ padding: "18px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <p style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Firm Capacity</p>
                        <div style={{ width: "30px", height: "30px", borderRadius: "6px", background: "rgba(90,122,70,0.08)", border: "1px solid rgba(90,122,70,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Users size={13} style={{ color: "var(--success)" }} />
                        </div>
                    </div>
                    <p style={{ marginTop: "8px", fontSize: "24px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                        {kpis?.availableHours ?? 0}h
                    </p>
                    <p style={{ fontSize: "9px", color: "var(--text-muted)", marginTop: "4px" }}>
                        of {kpis?.weeklyCapacity ?? 0}h available this week
                    </p>
                </div>

                {/* Hours This Week */}
                <div className="card-hover" style={{ padding: "18px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <p style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Hours This Week</p>
                        <div style={{ width: "30px", height: "30px", borderRadius: "6px", background: "rgba(176,122,74,0.08)", border: "1px solid rgba(176,122,74,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Clock size={13} style={{ color: "var(--accent-primary)" }} />
                        </div>
                    </div>
                    <p style={{ marginTop: "8px", fontSize: "24px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                        {kpis?.hoursThisWeek ?? 0}h
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                        {(kpis?.weekOverWeekDelta ?? 0) >= 0 ? <TrendingUp size={10} style={{ color: "var(--success)" }} /> : <TrendingDown size={10} style={{ color: "var(--danger)" }} />}
                        <span style={{ fontSize: "10px", color: (kpis?.weekOverWeekDelta ?? 0) >= 0 ? "var(--success)" : "var(--danger)", fontWeight: 500 }}>
                            {(kpis?.weekOverWeekDelta ?? 0) >= 0 ? "+" : ""}{kpis?.weekOverWeekDelta ?? 0}% vs last week
                        </span>
                    </div>
                </div>
            </div>

            {/* ─── Main grid ─── */}
            <div className="grid-mobile-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

                {/* Revenue chart (real monthly data) */}
                <div style={{ padding: "24px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <div>
                            <h3 style={{ fontSize: "15px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Revenue</h3>
                            <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300, marginTop: "2px" }}>Monthly invoiced vs paid — FY 2026</p>
                        </div>
                        <div style={{ display: "flex", gap: "12px", fontSize: "9px", color: "var(--text-muted)" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "6px", height: "6px", borderRadius: "1px", background: "rgba(176,122,74,0.3)" }} />Invoiced</span>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "6px", height: "6px", borderRadius: "1px", background: "var(--accent-primary)" }} />Paid</span>
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "140px" }}>
                        {(kpis?.monthlyRevenue ?? Array.from({ length: 12 }, (_, i) => ({ month: new Date(2026, i).toLocaleString("en", { month: "short" }), invoiced: 0, paid: 0 }))).map((m: any, i: number) => {
                            const maxVal = Math.max(...(kpis?.monthlyRevenue ?? []).map((r: any) => Math.max(r.invoiced, r.paid)), 1);
                            const invoicedH = maxVal > 0 ? Math.max(4, (m.invoiced / maxVal) * 100) : 4;
                            const paidH = maxVal > 0 ? Math.max(4, (m.paid / maxVal) * 100) : 4;
                            const isCurrentMonth = i === new Date().getMonth();
                            return (
                                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", gap: "1px" }}>
                                    <div style={{ width: "100%", display: "flex", gap: "1px", alignItems: "flex-end", justifyContent: "center", height: "100%" }}>
                                        <div style={{ flex: 1, borderRadius: "2px 2px 0 0", height: `${invoicedH}%`, background: "rgba(176,122,74,0.15)", transition: "height 0.6s", minHeight: "2px" }} />
                                        <div style={{ flex: 1, borderRadius: "2px 2px 0 0", height: `${paidH}%`, background: isCurrentMonth ? "var(--accent-primary)" : "rgba(176,122,74,0.4)", transition: "height 0.6s", minHeight: "2px" }} />
                                    </div>
                                    <span style={{ fontSize: "8px", color: isCurrentMonth ? "var(--accent-primary)" : "var(--text-muted)", marginTop: "4px", fontWeight: isCurrentMonth ? 600 : 400 }}>{m.month?.[0] || ""}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Team Workload Balance */}
                <div style={{ padding: "24px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <div>
                            <h3 style={{ fontSize: "15px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Team Workload</h3>
                            <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300, marginTop: "2px" }}>This week&apos;s hours by person</p>
                        </div>
                        <a href="/dashboard/resources" style={{ fontSize: "11px", color: "var(--accent-primary)", textDecoration: "none", fontWeight: 500, display: "flex", alignItems: "center", gap: "3px" }}>
                            View all <ArrowUpRight size={10} />
                        </a>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {(kpis?.teamWorkload ?? []).length === 0 ? (
                            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "13px", padding: "20px 0", fontWeight: 300 }}>No team data yet.</p>
                        ) : (kpis?.teamWorkload ?? []).slice(0, 5).map((m: any, i: number) => (
                            <div key={i}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: m.utilization >= (m.targetUtil || 75) ? "rgba(90,122,70,0.08)" : "var(--bg-secondary)", border: "1px solid var(--border-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", fontWeight: 600, color: "var(--text-muted)" }}>
                                            {m.name.split(" ").map((p: string) => p[0]).join("").slice(0, 2)}
                                        </div>
                                        <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>{m.name}</span>
                                    </div>
                                    <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{m.hoursThisWeek}h / 40h</span>
                                </div>
                                <div style={{ height: "6px", borderRadius: "3px", background: "var(--bg-tertiary)", overflow: "hidden" }}>
                                    <div style={{
                                        height: "100%", borderRadius: "3px", transition: "width 0.4s",
                                        width: `${Math.min((m.hoursThisWeek / 40) * 100, 100)}%`,
                                        background: m.utilization >= (m.targetUtil || 75) ? "var(--success)" : m.utilization >= 50 ? "var(--warning)" : "rgba(176,122,74,0.4)",
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ─── Onboarding Checklist ─── */}
                {kpis?.onboarding && kpis.onboarding.completedCount < kpis.onboarding.totalCount && (
                    <div style={{ gridColumn: "span 2", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
                        <button
                            onClick={() => setOnboardingOpen(!onboardingOpen)}
                            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", border: "none", background: "none", cursor: "pointer", textAlign: "left" }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, rgba(176,122,74,0.1), rgba(176,122,74,0.05))", border: "1px solid rgba(176,122,74,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Zap size={14} style={{ color: "var(--accent-primary)" }} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", margin: 0 }}>Get Started with ArchFlow</h3>
                                    <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300, marginTop: "2px" }}>
                                        {kpis.onboarding.completedCount} of {kpis.onboarding.totalCount} steps completed
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                {/* Progress bar */}
                                <div style={{ width: "120px", height: "5px", borderRadius: "3px", background: "var(--bg-tertiary)", overflow: "hidden" }}>
                                    <div style={{ height: "100%", borderRadius: "3px", background: "var(--accent-primary)", width: `${(kpis.onboarding.completedCount / kpis.onboarding.totalCount) * 100}%`, transition: "width 0.4s" }} />
                                </div>
                                {onboardingOpen ? <ChevronDown size={14} style={{ color: "var(--text-muted)" }} /> : <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />}
                            </div>
                        </button>
                        {onboardingOpen && (
                            <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: "4px" }}>
                                {kpis.onboarding.steps.map((step: any) => (
                                    <a
                                        key={step.key}
                                        href={step.href}
                                        style={{
                                            display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "6px",
                                            background: step.done ? "transparent" : "var(--bg-warm)", border: step.done ? "1px solid transparent" : "1px solid var(--border-primary)",
                                            textDecoration: "none", transition: "all 0.15s", opacity: step.done ? 0.5 : 1,
                                        }}
                                        onMouseEnter={(e) => { if (!step.done) e.currentTarget.style.borderColor = "var(--border-secondary)"; }}
                                        onMouseLeave={(e) => { if (!step.done) e.currentTarget.style.borderColor = "var(--border-primary)"; }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            {step.done
                                                ? <CheckCircle2 size={15} style={{ color: "var(--success)", flexShrink: 0 }} />
                                                : <Circle size={15} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                                            }
                                            <span style={{ fontSize: "12px", fontWeight: step.done ? 400 : 500, color: step.done ? "var(--text-muted)" : "var(--text-primary)", textDecoration: step.done ? "line-through" : "none" }}>
                                                {step.label}
                                            </span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            {!step.done && <span style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 400 }}>~{step.est}</span>}
                                            {!step.done && <ArrowUpRight size={11} style={{ color: "var(--text-muted)" }} />}
                                        </div>
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Active Projects table */}
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
                    {inboxItems.length === 0 ? (
                        <div style={{ padding: "20px 0", textAlign: "center" }}>
                            <p style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 300 }}>All clear — no pending items.</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {inboxItems.slice(0, 8).map((item, i) => (
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
                    )}
                </div>

                {/* Quick Actions */}
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

                {/* Deadlines */}
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
                            {rawProjects.slice(0, 4).map((p: any, i: number) => (
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
            </div>
        </div>
    );
}
