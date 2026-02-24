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
    Clock,
    Target,
} from "lucide-react";

/* ─── Types ─── */

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
    startDate: string;
    endDate: string;
    phases: PhaseBudget[];
}

const formatCurrency = (v: number) => `$${v.toLocaleString()}`;

const statusStyles: Record<string, { color: string; bg: string; label: string }> = {
    "on-track": { color: "var(--success)", bg: "rgba(90,122,70,0.08)", label: "On Track" },
    "at-risk": { color: "var(--warning)", bg: "rgba(176,138,48,0.08)", label: "At Risk" },
    "over-budget": { color: "var(--danger)", bg: "rgba(176,80,64,0.08)", label: "Over Budget" },
    complete: { color: "var(--text-muted)", bg: "var(--bg-secondary)", label: "Complete" },
};

/* Threshold marker component */
function ThresholdMarker({ pct, label, color }: { pct: number; label: string; color: string }) {
    return (
        <div style={{ position: "absolute", left: `${pct}%`, top: "-2px", bottom: "-2px", zIndex: 2 }} title={`${label}: ${pct}%`}>
            <div style={{ width: "2px", height: "100%", background: color, opacity: 0.7 }} />
            <div style={{
                position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)",
                fontSize: "8px", fontWeight: 600, color, whiteSpace: "nowrap",
            }}>{pct}%</div>
        </div>
    );
}

/* Budget bar with threshold markers */
function BudgetBar({ burnPct, width, height }: { burnPct: number; width: string; height: string }) {
    const barColor = burnPct > 100 ? "var(--danger)" : burnPct > 90 ? "var(--danger)" : burnPct > 75 ? "var(--warning)" : "var(--accent-primary)";
    return (
        <div style={{ width, position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Budget</span>
                <span style={{ fontSize: "10px", fontWeight: 500, color: burnPct > 90 ? "var(--danger)" : "var(--text-secondary)" }}>{burnPct}%</span>
            </div>
            <div style={{ height, borderRadius: parseInt(height) > 5 ? "3px" : "2px", background: "var(--bg-tertiary)", position: "relative", overflow: "visible" }}>
                <div style={{ height: "100%", borderRadius: "inherit", width: `${Math.min(burnPct, 100)}%`, background: barColor, transition: "width 0.4s", position: "relative", zIndex: 1 }} />
                {/* Threshold markers */}
                <ThresholdMarker pct={75} label="Alert" color="var(--warning)" />
                <ThresholdMarker pct={90} label="Warning" color="var(--danger)" />
            </div>
        </div>
    );
}

/* Phase-level budget bar */
function PhaseBurnBar({ phBurn }: { phBurn: number }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "60px", height: "4px", borderRadius: "2px", background: "var(--bg-tertiary)", position: "relative", overflow: "visible" }}>
                <div style={{ height: "100%", borderRadius: "2px", width: `${Math.min(phBurn, 100)}%`, background: phBurn > 100 ? "var(--danger)" : phBurn > 80 ? "var(--warning)" : "var(--accent-primary)", position: "relative", zIndex: 1 }} />
                {/* Threshold ticks */}
                <div style={{ position: "absolute", left: "75%", top: "-1px", bottom: "-1px", width: "1px", background: "var(--warning)", opacity: 0.5, zIndex: 2 }} />
                <div style={{ position: "absolute", left: "90%", top: "-1px", bottom: "-1px", width: "1px", background: "var(--danger)", opacity: 0.5, zIndex: 2 }} />
            </div>
            <span style={{ fontSize: "11px", color: phBurn > 100 ? "var(--danger)" : "var(--text-muted)", fontWeight: 400 }}>{phBurn}%</span>
        </div>
    );
}

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
            startDate: p.startDate || "",
            endDate: p.endDate || "",
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
    const avgBurnRate = totalHoursBudget > 0 ? Math.round((totalHoursUsed / totalHoursBudget) * 100) : 0;

    // Forecasting
    const computeForecast = (proj: ProjectBudget) => {
        const remaining = proj.totalBudgetHours - proj.totalUsedHours;
        if (remaining <= 0) return { remaining: 0, weeksLeft: 0, burnPerWeek: 0, projectedEnd: "Over budget" };
        // Estimate burn rate: if project has dates, calculate weeks elapsed
        const start = proj.startDate ? new Date(proj.startDate) : null;
        const now = new Date();
        if (start && proj.totalUsedHours > 0) {
            const elapsed = Math.max(1, (now.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
            const burnPerWeek = proj.totalUsedHours / elapsed;
            const weeksLeft = burnPerWeek > 0 ? remaining / burnPerWeek : Infinity;
            const projEnd = new Date(now.getTime() + weeksLeft * 7 * 24 * 60 * 60 * 1000);
            return {
                remaining: Math.round(remaining),
                weeksLeft: Math.round(weeksLeft * 10) / 10,
                burnPerWeek: Math.round(burnPerWeek * 10) / 10,
                projectedEnd: projEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
            };
        }
        return { remaining: Math.round(remaining), weeksLeft: 0, burnPerWeek: 0, projectedEnd: "No data" };
    };

    if (isLoading) return <div style={{ padding: "80px 0", textAlign: "center" }}><p style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 300 }}>Loading budgets...</p></div>;

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                    Budgets
                </h1>
                <p style={{ marginTop: "4px", fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 300 }}>
                    Phase-level budget tracking, burn rate monitoring, and forecasting
                </p>
            </div>

            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
                {[
                    { label: "Total Contract Value", value: formatCurrency(totalContract), sub: `${projects.length} projects` },
                    { label: "Revenue Earned", value: formatCurrency(totalEarned), sub: `${overallBurnPct}% of contract` },
                    { label: "Hours Budget", value: `${totalHoursBudget.toLocaleString()}h`, sub: `${totalHoursUsed.toLocaleString()}h used` },
                    { label: "Average Burn Rate", value: `${avgBurnRate}%`, sub: "across all projects" },
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
                    const burnPct = proj.contractValue > 0 ? Math.round((proj.totalEarned / proj.contractValue) * 100) : 0;
                    const hoursPct = proj.totalBudgetHours > 0 ? Math.round((proj.totalUsedHours / proj.totalBudgetHours) * 100) : 0;
                    const forecast = computeForecast(proj);

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
                                    {/* Budget bar with thresholds */}
                                    <BudgetBar burnPct={burnPct} width="120px" height="6px" />
                                    {/* Hours */}
                                    <div style={{ textAlign: "right", minWidth: "80px" }}>
                                        <p style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.04em" }}>Hours</p>
                                        <p style={{ fontSize: "14px", fontWeight: 400, color: hoursPct > 90 ? "var(--danger)" : "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginTop: "2px" }}>
                                            {proj.totalUsedHours} / {proj.totalBudgetHours}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Expanded phases + forecast */}
                            {isExpanded && (
                                <div style={{ borderTop: "1px solid var(--border-primary)" }}>
                                    {/* Forecast row */}
                                    <div style={{ padding: "14px 20px", background: "rgba(176,122,74,0.03)", borderBottom: "1px solid var(--border-primary)", display: "flex", gap: "32px", alignItems: "center" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <Target size={13} style={{ color: "var(--accent-primary)" }} />
                                            <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Forecast</span>
                                        </div>
                                        <div style={{ display: "flex", gap: "24px" }}>
                                            <div>
                                                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Remaining</span>
                                                <p style={{ fontSize: "13px", fontWeight: 500, color: forecast.remaining <= 0 ? "var(--danger)" : "var(--text-primary)" }}>
                                                    {forecast.remaining <= 0 ? "0h (over)" : `${forecast.remaining}h`}
                                                </p>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Burn Rate</span>
                                                <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>
                                                    {forecast.burnPerWeek > 0 ? `${forecast.burnPerWeek}h/wk` : "—"}
                                                </p>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Weeks Left</span>
                                                <p style={{ fontSize: "13px", fontWeight: 500, color: forecast.weeksLeft <= 2 ? "var(--danger)" : forecast.weeksLeft <= 4 ? "var(--warning)" : "var(--text-primary)" }}>
                                                    {forecast.weeksLeft > 0 ? `${forecast.weeksLeft} wks` : "—"}
                                                </p>
                                            </div>
                                            <div>
                                                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Projected Exhaustion</span>
                                                <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{forecast.projectedEnd}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Phase table */}
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
                                                            <PhaseBurnBar phBurn={phBurn} />
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
