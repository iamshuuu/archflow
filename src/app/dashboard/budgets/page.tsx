"use client";

import { useState } from "react";
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

const projects: ProjectBudget[] = [
    {
        id: "p1", name: "Meridian Tower", client: "Apex Development Corp", contractValue: 285000, totalEarned: 218000, totalBudgetHours: 1720, totalUsedHours: 1210,
        phases: [
            { name: "Pre-Design", feeType: "fixed", fee: 18000, earned: 18000, hoursbudget: 120, hoursUsed: 115, status: "complete" },
            { name: "Schematic Design", feeType: "fixed", fee: 45000, earned: 45000, hoursbudget: 280, hoursUsed: 295, status: "complete" },
            { name: "Design Development", feeType: "fixed", fee: 65000, earned: 65000, hoursbudget: 400, hoursUsed: 388, status: "complete" },
            { name: "Construction Docs", feeType: "fixed", fee: 95000, earned: 62000, hoursbudget: 600, hoursUsed: 412, status: "on-track" },
            { name: "Construction Admin", feeType: "hourly", fee: 62000, earned: 0, hoursbudget: 320, hoursUsed: 0, status: "on-track" },
        ],
    },
    {
        id: "p2", name: "Harbor Residences", client: "Coastal Properties LLC", contractValue: 420000, totalEarned: 145000, totalBudgetHours: 1280, totalUsedHours: 421,
        phases: [
            { name: "Pre-Design", feeType: "fixed", fee: 15000, earned: 15000, hoursbudget: 80, hoursUsed: 76, status: "complete" },
            { name: "Schematic Design", feeType: "fixed", fee: 40000, earned: 40000, hoursbudget: 200, hoursUsed: 210, status: "complete" },
            { name: "Design Development", feeType: "fixed", fee: 60000, earned: 27000, hoursbudget: 300, hoursUsed: 135, status: "at-risk" },
            { name: "Construction Docs", feeType: "nte", fee: 155000, earned: 0, hoursbudget: 500, hoursUsed: 0, status: "on-track" },
            { name: "Construction Admin", feeType: "hourly", fee: 50000, earned: 0, hoursbudget: 200, hoursUsed: 0, status: "on-track" },
        ],
    },
    {
        id: "p3", name: "Civic Center", client: "City of Portland", contractValue: 175000, totalEarned: 142000, totalBudgetHours: 820, totalUsedHours: 685,
        phases: [
            { name: "Pre-Design", feeType: "fixed", fee: 12000, earned: 12000, hoursbudget: 60, hoursUsed: 55, status: "complete" },
            { name: "Schematic Design", feeType: "fixed", fee: 30000, earned: 30000, hoursbudget: 160, hoursUsed: 172, status: "complete" },
            { name: "Design Development", feeType: "fixed", fee: 48000, earned: 48000, hoursbudget: 260, hoursUsed: 278, status: "complete" },
            { name: "Construction Docs", feeType: "fixed", fee: 55000, earned: 52000, hoursbudget: 240, hoursUsed: 180, status: "on-track" },
            { name: "Construction Admin", feeType: "hourly", fee: 30000, earned: 0, hoursbudget: 100, hoursUsed: 0, status: "on-track" },
        ],
    },
];

const formatCurrency = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

const statusStyles: Record<string, { color: string; bg: string; label: string }> = {
    "on-track": { color: "var(--success)", bg: "rgba(90,122,70,0.08)", label: "On Track" },
    "at-risk": { color: "var(--warning)", bg: "rgba(176,138,48,0.08)", label: "At Risk" },
    "over-budget": { color: "var(--danger)", bg: "rgba(176,80,64,0.08)", label: "Over Budget" },
    complete: { color: "var(--text-muted)", bg: "var(--bg-secondary)", label: "Complete" },
};

export default function BudgetsPage() {
    const [expanded, setExpanded] = useState<string | null>("p1");

    const totalContract = projects.reduce((s, p) => s + p.contractValue, 0);
    const totalEarned = projects.reduce((s, p) => s + p.totalEarned, 0);
    const totalHoursBudget = projects.reduce((s, p) => s + p.totalBudgetHours, 0);
    const totalHoursUsed = projects.reduce((s, p) => s + p.totalUsedHours, 0);
    const overallBurnPct = Math.round((totalEarned / totalContract) * 100);

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
                    const isExpanded = expanded === proj.id;
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
