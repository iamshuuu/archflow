"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/app/providers";
import {
    Users,
    Calendar,
    BarChart3,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Target,
    Zap,
} from "lucide-react";

/* ─── Helpers ─── */

function getCurrentIsoWeek(): string {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const yearStart = new Date(d.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((d.getTime() - yearStart.getTime()) / 86400000 - 3 + ((yearStart.getDay() + 6) % 7)) / 7);
    return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

function addWeeks(week: string, n: number): string {
    const match = week.match(/(\d{4})-W(\d{2})/);
    if (!match) return week;
    let year = parseInt(match[1]);
    let w = parseInt(match[2]) + n;
    while (w < 1) { year--; w += 52; }
    while (w > 52) { year++; w -= 52; }
    return `${year}-W${String(w).padStart(2, "0")}`;
}

function getWeekRange(start: string, count: number): string[] {
    const weeks: string[] = [];
    for (let i = 0; i < count; i++) weeks.push(addWeeks(start, i));
    return weeks;
}

function weekLabel(week: string): string {
    const match = week.match(/\d{4}-W(\d{2})/);
    return match ? `W${match[1]}` : week;
}

const WEEK_HOURS = 40;

function heatColor(hours: number, maxHours = WEEK_HOURS): string {
    const pct = Math.min(hours / maxHours, 1.5);
    if (pct === 0) return "transparent";
    if (pct <= 0.5) return `rgba(90,122,70,${0.1 + pct * 0.3})`; // green (light)
    if (pct <= 0.9) return `rgba(176,138,48,${0.15 + (pct - 0.5) * 0.4})`; // amber
    if (pct <= 1.0) return `rgba(176,122,74,${0.2 + (pct - 0.9) * 0.5})`; // brand
    return `rgba(176,80,64,${0.2 + (pct - 1.0) * 0.5})`; // over-allocated: red
}

export default function ResourcesPage() {
    const utils = trpc.useUtils();
    const [startWeek, setStartWeek] = useState(getCurrentIsoWeek());
    const [activeTab, setActiveTab] = useState<"grid" | "comparison">("grid");
    const weekCount = 8;
    const weeks = useMemo(() => getWeekRange(startWeek, weekCount), [startWeek, weekCount]);
    const weekTo = weeks[weeks.length - 1];

    const { data: capacityData = [], isLoading } = trpc.allocation.teamCapacity.useQuery(
        { weekFrom: startWeek, weekTo },
    );
    const { data: forecastData = [] } = trpc.allocation.forecast.useQuery(
        { weekFrom: startWeek, weekTo },
    );
    const { data: projects = [] } = trpc.project.list.useQuery();
    const setAllocation = trpc.allocation.set.useMutation({
        onSuccess: () => utils.allocation.invalidate(),
    });

    const totalPlanned = (capacityData as any[]).reduce((s: number, m: any) => s + (m.totalPlanned || 0), 0);
    const totalActual = (capacityData as any[]).reduce((s: number, m: any) => s + (m.totalActual || 0), 0);
    const avgUtil = (capacityData as any[]).length > 0
        ? Math.round(totalPlanned / ((capacityData as any[]).length * weekCount * WEEK_HOURS) * 100)
        : 0;

    const handleSetHours = (userId: string, projectId: string, week: string, hours: number) => {
        setAllocation.mutate({ userId, projectId, week, plannedHours: hours });
    };

    if (isLoading) return (
        <div style={{ padding: "80px 0", textAlign: "center" }}>
            <Loader2 size={20} style={{ color: "var(--text-muted)", animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    );

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Resources</h1>
                    <p style={{ marginTop: "4px", fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 300 }}>Plan team allocations and track capacity</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button onClick={() => setStartWeek(addWeeks(startWeek, -weekCount))} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", cursor: "pointer", color: "var(--text-muted)" }}>
                        <ChevronLeft size={14} />
                    </button>
                    <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", minWidth: "120px", textAlign: "center" }}>
                        {weekLabel(startWeek)} — {weekLabel(weekTo)}
                    </span>
                    <button onClick={() => setStartWeek(addWeeks(startWeek, weekCount))} style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", cursor: "pointer", color: "var(--text-muted)" }}>
                        <ChevronRight size={14} />
                    </button>
                    <button onClick={() => setStartWeek(getCurrentIsoWeek())} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", cursor: "pointer", fontSize: "11px", color: "var(--text-muted)", marginLeft: "4px" }}>
                        Today
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
                {[
                    { label: "Team Members", value: `${(capacityData as any[]).length}`, icon: Users, color: "var(--accent-primary)" },
                    { label: "Planned Hours", value: `${totalPlanned.toLocaleString()}h`, icon: Calendar, color: "var(--info)" },
                    { label: "Actual Hours", value: `${totalActual.toLocaleString()}h`, icon: BarChart3, color: "var(--success)" },
                    { label: "Avg Utilization", value: `${avgUtil}%`, icon: Target, color: avgUtil > 85 ? "var(--warning)" : "var(--accent-primary)" },
                ].map((card, i) => (
                    <div key={i} style={{ padding: "18px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <p style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{card.label}</p>
                            <card.icon size={14} style={{ color: card.color }} />
                        </div>
                        <p style={{ marginTop: "8px", fontSize: "22px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{card.value}</p>
                    </div>
                ))}
            </div>

            {/* Tab bar */}
            <div style={{ display: "flex", gap: "0", marginBottom: "24px", borderBottom: "1px solid var(--border-primary)" }}>
                {(["grid", "comparison"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{ padding: "10px 20px", fontSize: "12px", fontWeight: 500, cursor: "pointer", border: "none", background: "none", color: activeTab === tab ? "var(--accent-primary)" : "var(--text-muted)", borderBottom: activeTab === tab ? "2px solid var(--accent-primary)" : "2px solid transparent", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "6px" }}
                    >
                        {tab === "grid" && <Calendar size={13} />}
                        {tab === "comparison" && <TrendingUp size={13} />}
                        {tab === "grid" ? "Allocation Grid" : "Planned vs Actual"}
                    </button>
                ))}
            </div>

            {/* Allocation Grid */}
            {activeTab === "grid" && (
                <div style={{ borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)", overflow: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border-primary)", background: "var(--bg-warm)" }}>
                                <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", position: "sticky", left: 0, background: "var(--bg-warm)", minWidth: "160px" }}>Team Member</th>
                                {weeks.map(w => (
                                    <th key={w} style={{ padding: "10px 8px", textAlign: "center", fontSize: "10px", fontWeight: 500, color: w === getCurrentIsoWeek() ? "var(--accent-primary)" : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", minWidth: "70px", background: w === getCurrentIsoWeek() ? "rgba(176,122,74,0.04)" : "transparent" }}>
                                        {weekLabel(w)}
                                    </th>
                                ))}
                                <th style={{ padding: "10px 14px", textAlign: "center", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(capacityData as any[]).length === 0 ? (
                                <tr><td colSpan={weekCount + 2} style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)", fontWeight: 300 }}>No team members found. Add team members first.</td></tr>
                            ) : (capacityData as any[]).map((member: any) => (
                                <tr key={member.id} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                                    <td style={{ padding: "10px 14px", position: "sticky", left: 0, background: "var(--bg-card)", borderRight: "1px solid var(--border-primary)" }}>
                                        <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>{member.name}</div>
                                        <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{member.title || "Team Member"}</div>
                                    </td>
                                    {weeks.map(w => {
                                        const weekInfo = member.weeks?.[w] || { planned: 0, actual: 0 };
                                        return (
                                            <td key={w} style={{ padding: "4px", textAlign: "center", background: w === getCurrentIsoWeek() ? "rgba(176,122,74,0.02)" : "transparent" }}>
                                                <div style={{ padding: "6px 4px", borderRadius: "6px", background: heatColor(weekInfo.planned), minHeight: "32px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2px", transition: "background 0.15s" }}>
                                                    <span style={{ fontSize: "12px", fontWeight: 600, color: weekInfo.planned > 0 ? "var(--text-primary)" : "var(--text-muted)" }}>
                                                        {weekInfo.planned > 0 ? `${weekInfo.planned}h` : "—"}
                                                    </span>
                                                    {weekInfo.actual > 0 && (
                                                        <span style={{ fontSize: "9px", color: weekInfo.actual > weekInfo.planned ? "var(--danger)" : "var(--success)" }}>
                                                            {weekInfo.actual}h actual
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent-primary)" }}>{member.totalPlanned || 0}h</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Planned vs Actual Comparison */}
            {activeTab === "comparison" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {(capacityData as any[]).length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", fontSize: "13px", color: "var(--text-muted)" }}>No data to compare.</div>
                    ) : (capacityData as any[]).map((member: any) => {
                        const util = member.totalPlanned > 0
                            ? Math.round((member.totalActual / member.totalPlanned) * 100)
                            : 0;
                        const target = member.targetUtil || 75;
                        return (
                            <div key={member.id} style={{ padding: "20px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                                    <div>
                                        <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>{member.name}</span>
                                        <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "8px" }}>{member.title || "Team Member"}</span>
                                    </div>
                                    <div style={{ display: "flex", gap: "16px", fontSize: "11px" }}>
                                        <span style={{ color: "var(--info)" }}>Planned: <strong>{member.totalPlanned || 0}h</strong></span>
                                        <span style={{ color: "var(--success)" }}>Actual: <strong>{member.totalActual || 0}h</strong></span>
                                        <span style={{ color: util >= 90 ? "var(--warning)" : "var(--text-muted)" }}>
                                            Delivery: <strong>{util}%</strong>
                                        </span>
                                    </div>
                                </div>

                                {/* Dual bar */}
                                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                    <span style={{ fontSize: "9px", width: "48px", textAlign: "right", color: "var(--text-muted)", textTransform: "uppercase" }}>Planned</span>
                                    <div style={{ flex: 1, height: "10px", borderRadius: "5px", background: "var(--bg-tertiary)", overflow: "hidden" }}>
                                        <div style={{ height: "100%", borderRadius: "5px", width: `${Math.min((member.totalPlanned / (weekCount * WEEK_HOURS)) * 100, 100)}%`, background: "var(--info)", transition: "width 0.3s" }} />
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                                    <span style={{ fontSize: "9px", width: "48px", textAlign: "right", color: "var(--text-muted)", textTransform: "uppercase" }}>Actual</span>
                                    <div style={{ flex: 1, height: "10px", borderRadius: "5px", background: "var(--bg-tertiary)", overflow: "hidden", position: "relative" }}>
                                        <div style={{ height: "100%", borderRadius: "5px", width: `${Math.min((member.totalActual / (weekCount * WEEK_HOURS)) * 100, 100)}%`, background: member.totalActual > member.totalPlanned ? "var(--warning)" : "var(--success)", transition: "width 0.3s" }} />
                                        {/* Target marker */}
                                        <div style={{ position: "absolute", top: "-2px", bottom: "-2px", left: `${target}%`, width: "2px", background: "var(--accent-primary)", borderRadius: "1px" }} />
                                    </div>
                                </div>

                                {/* Weekly sparkbar */}
                                <div style={{ display: "flex", gap: "4px", marginTop: "12px" }}>
                                    {weeks.map(w => {
                                        const weekInfo = member.weeks?.[w] || { planned: 0, actual: 0 };
                                        const maxH = Math.max(weekInfo.planned, weekInfo.actual, 1);
                                        return (
                                            <div key={w} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                                                <div style={{ width: "100%", height: "30px", display: "flex", gap: "1px", alignItems: "flex-end" }}>
                                                    <div style={{ flex: 1, background: "var(--info)", borderRadius: "2px 2px 0 0", height: `${(weekInfo.planned / WEEK_HOURS) * 100}%`, minHeight: weekInfo.planned > 0 ? "2px" : "0", opacity: 0.6 }} />
                                                    <div style={{ flex: 1, background: weekInfo.actual > weekInfo.planned ? "var(--warning)" : "var(--success)", borderRadius: "2px 2px 0 0", height: `${(weekInfo.actual / WEEK_HOURS) * 100}%`, minHeight: weekInfo.actual > 0 ? "2px" : "0" }} />
                                                </div>
                                                <span style={{ fontSize: "8px", color: w === getCurrentIsoWeek() ? "var(--accent-primary)" : "var(--text-muted)" }}>{weekLabel(w)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Project Forecast */}
            {(forecastData as any[]).length > 0 && (
                <div style={{ marginTop: "24px", padding: "20px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "16px" }}>Project Resource Forecast</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
                        {(forecastData as any[]).map((proj: any) => (
                            <div key={proj.id} style={{ padding: "14px", borderRadius: "8px", background: "var(--bg-warm)" }}>
                                <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", marginBottom: "8px" }}>{proj.name}</div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                    <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Planned Hours</span>
                                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--accent-primary)" }}>{proj.totalPlannedHours}h</span>
                                </div>
                                <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                                    {proj.assignedPeople.length > 0 ? proj.assignedPeople.join(", ") : "No one assigned"}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
