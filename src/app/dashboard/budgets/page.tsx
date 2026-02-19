"use client";

import { useState } from "react";
import { trpc } from "@/app/providers";
import {
    DollarSign,
    TrendingUp,
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    ArrowUpRight,
} from "lucide-react";

/* ─── Mock data ─── */

interface PhaseBudget {
    name: string;
    feeType: "fixed" | "hourly" | "nte";
    fee: number;
    earned: number;
    hoursbudget: number;
    hoursUsed: number;
    status: "on-track" | "at-risk" | "over-budget" | "complete";
}

interface ProjectBudget {
    id: string;
    name: string;
    client: string;
    contractValue: number;
    totalEarned: number;
    totalBudgetHours: number;
    totalUsedHours: number;
    phases: PhaseBudget[];
}



const formatCurrency = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

const statusStyles: Record<string, { color: string; bg: string; label: string }> = {
    "on-track": { color: "var(--success)", bg: "rgba(90,122,70,0.08)", label: "On Track" },
    "at-risk": { color: "var(--warning)", bg: "rgba(176,138,48,0.08)", label: "At Risk" },
    "over-budget": { color: "var(--danger)", bg: "rgba(176,80,64,0.08)", label: "Over Budget" },
    complete: { color: "var(--text-muted)", bg: "var(--bg-secondary)", label: "Complete" },
};

export default function BudgetsPage() {
    const { data: rawProjects = [], isLoading } = trpc.project.budgets.useQuery();
    const [expanded, setExpanded] = useState<string | null>(null);

    // Adapt DB data to budget view shape
    const projects: ProjectBudget[] = rawProjects.map((p: any) => {
        const phases: PhaseBudget[] = (p.phases || []).map((ph: any) => {
            const hoursUsed = (ph.timeEntries || []).reduce((s: number, te: any) => s + te.hours, 0);
            const burnPct = ph.budgetHours > 0 ? hoursUsed / ph.budgetHours : 0;
            const earned = Math.round(ph.budgetAmount * Math.min(burnPct, 1));
            let status: PhaseBudget["status"] = "on-track";
            if (burnPct >= 1.0) status = hoursUsed > 0 ? "over-budget" : "complete";
            else if (burnPct >= 0.85) status = "at-risk";
            return {
                name: ph.name,
                feeType: (ph.feeType === "not-to-exceed" ? "nte" : ph.feeType || "hourly") as PhaseBudget["feeType"],
                fee: ph.budgetAmount || 0,
                earned,
                hoursbudget: ph.budgetHours || 0,
                hoursUsed,
                status,
            };
        });
        return {
            id: p.id,
            name: p.name,
            client: p.client?.name || "Unknown",
            contractValue: p.contractValue || 0,
            totalEarned: phases.reduce((s, ph) => s + ph.earned, 0),
            totalBudgetHours: phases.reduce((s, ph) => s + ph.hoursbudget, 0),
            totalUsedHours: phases.reduce((s, ph) => s + ph.hoursUsed, 0),
            phases,
        };
    });

    // Auto-expand first project
    const effectiveExpanded = expanded ?? (projects.length > 0 ? projects[0].id : null);

    const totalContract = projects.reduce((s, p) => s + p.contractValue, 0);
    const totalEarned = projects.reduce((s, p) => s + p.totalEarned, 0);
    const totalHoursBudget = projects.reduce((s, p) => s + p.totalBudgetHours, 0);
    const totalHoursUsed = projects.reduce((s, p) => s + p.totalUsedHours, 0);
    const overallBurnPct = totalContract > 0 ? Math.round((totalEarned / totalContract) * 100) : 0;

    if (isLoading) return <div style={{ padding: "80px 0", textAlign: "center" }}><p style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 300 }}>Loading budgets...</p></div>;

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                    Budgets
                </h1>
                <p style={{ marginTop: "4px", fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 300 }}>
                    Phase-level budget tracking and burn rate monitoring
                </p>
            </div>

            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
                {[
                    { label: "Total Contract Value", value: formatCurrency(totalContract), sub: `${projects.length} projects` },
                    { label: "Revenue Earned", value: formatCurrency(totalEarned), sub: `${overallBurnPct}% of contract` },
                    { label: "Hours Budget", value: `${totalHoursBudget.toLocaleString()}h`, sub: `${totalHoursUsed.toLocaleString()}h used` },
                    { label: "Average Burn Rate", value: `${Math.round((totalHoursUsed / totalHoursBudget) * 100)}%`, sub: "across all projects" },
                ].map((card, i) => (
                    <div key={i} style={{ padding: "18px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                        <p style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{card.label}</p>
                        <p style={{ marginTop: "8px", fontSize: "22px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{card.value}</p>
                        <p style={{ marginTop: "4px", fontSize: "11px", color: "var(--text-muted)", fontWeight: 300 }}>{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* Budget breakdown by project */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {projects.map((proj) => {
                    const isExpanded = effectiveExpanded === proj.id;
                    const burnPct = Math.round((proj.totalEarned / proj.contractValue) * 100);
                    const hoursPct = Math.round((proj.totalUsedHours / proj.totalBudgetHours) * 100);

                    return (
                        <div key={proj.id} style={{ borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
                            {/* Project header */}
                            <div
                                onClick={() => setExpanded(isExpanded ? null : proj.id)}
                                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", cursor: "pointer", transition: "background 0.15s" }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-warm)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    {isExpanded ? <ChevronDown size={16} style={{ color: "var(--text-muted)" }} /> : <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />}
                                    <div>
                                        <h3 style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)" }}>{proj.name}</h3>
                                        <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300, marginTop: "1px" }}>{proj.client}</p>
                                    </div>
                                </div>

                                <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
                                    {/* Contract */}
                                    <div style={{ textAlign: "right" }}>
                                        <p style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.04em" }}>Contract</p>
                                        <p style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginTop: "2px" }}>{formatCurrency(proj.contractValue)}</p>
                                    </div>
                                    {/* Earned */}
                                    <div style={{ textAlign: "right" }}>
                                        <p style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.04em" }}>Earned</p>
                                        <p style={{ fontSize: "14px", fontWeight: 400, color: "var(--accent-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginTop: "2px" }}>{formatCurrency(proj.totalEarned)}</p>
                                    </div>
                                    {/* Burn bar */}
                                    <div style={{ width: "120px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Budget</span>
                                            <span style={{ fontSize: "10px", fontWeight: 500, color: burnPct > 90 ? "var(--danger)" : "var(--text-secondary)" }}>{burnPct}%</span>
                                        </div>
                                        <div style={{ height: "6px", borderRadius: "3px", background: "var(--bg-tertiary)" }}>
                                            <div style={{ height: "100%", borderRadius: "3px", width: `${Math.min(burnPct, 100)}%`, background: burnPct > 90 ? "var(--danger)" : burnPct > 75 ? "var(--warning)" : "var(--accent-primary)", transition: "width 0.4s" }} />
                                        </div>
                                    </div>
                                    {/* Hours */}
                                    <div style={{ textAlign: "right", minWidth: "80px" }}>
                                        <p style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.04em" }}>Hours</p>
                                        <p style={{ fontSize: "14px", fontWeight: 400, color: hoursPct > 90 ? "var(--danger)" : "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginTop: "2px" }}>
                                            {proj.totalUsedHours} / {proj.totalBudgetHours}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded phases */}
                            {isExpanded && (
                                <div style={{ borderTop: "1px solid var(--border-primary)" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ borderBottom: "1px solid var(--border-primary)", background: "var(--bg-warm)" }}>
                                                {["Phase", "Fee Type", "Fee", "Earned", "Budget Hrs", "Used Hrs", "Burn Rate", "Status"].map((h) => (
                                                    <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {proj.phases.map((phase, i) => {
                                                const phBurn = phase.hoursbudget > 0 ? Math.round((phase.hoursUsed / phase.hoursbudget) * 100) : 0;
                                                const ss = statusStyles[phase.status];
                                                return (
                                                    <tr key={i} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                                                        <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{phase.name}</td>
                                                        <td style={{ padding: "12px 14px" }}>
                                                            <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "3px", background: "var(--bg-secondary)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                                                {phase.feeType === "nte" ? "NTE" : phase.feeType}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: "12px 14px", fontSize: "12px", color: "var(--text-secondary)" }}>{formatCurrency(phase.fee)}</td>
                                                        <td style={{ padding: "12px 14px", fontSize: "12px", color: "var(--accent-primary)", fontWeight: 500 }}>{formatCurrency(phase.earned)}</td>
                                                        <td style={{ padding: "12px 14px", fontSize: "12px", color: "var(--text-secondary)" }}>{phase.hoursbudget}h</td>
                                                        <td style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 500, color: phBurn > 100 ? "var(--danger)" : "var(--text-primary)" }}>
                                                            {phase.hoursUsed}h
                                                            {phBurn > 100 && <AlertTriangle size={10} style={{ color: "var(--danger)", marginLeft: "4px", verticalAlign: "text-bottom" }} />}
                                                        </td>
                                                        <td style={{ padding: "12px 14px" }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                <div style={{ width: "60px", height: "4px", borderRadius: "2px", background: "var(--bg-tertiary)" }}>
                                                                    <div style={{ height: "100%", borderRadius: "2px", width: `${Math.min(phBurn, 100)}%`, background: phBurn > 100 ? "var(--danger)" : phBurn > 80 ? "var(--warning)" : "var(--accent-primary)" }} />
                                                                </div>
                                                                <span style={{ fontSize: "11px", color: phBurn > 100 ? "var(--danger)" : "var(--text-muted)", fontWeight: 400 }}>{phBurn}%</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: "12px 14px" }}>
                                                            <span style={{ fontSize: "9px", fontWeight: 600, padding: "3px 8px", borderRadius: "3px", textTransform: "uppercase", letterSpacing: "0.04em", color: ss.color, background: ss.bg }}>
                                                                {ss.label}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
