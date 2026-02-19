"use client";

import { useState } from "react";
import {
    BarChart3,
    Download,
    Calendar,
    TrendingUp,
    DollarSign,
    Clock,
    Users,
    FileText,
    ChevronDown,
} from "lucide-react";

/* ─── Mock data ─── */

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const revenueData = [42000, 38000, 55000, 48000, 62000, 58000, 51000, 67000, 72000, 65000, 78000, 48200];
const hoursData = [680, 640, 720, 700, 750, 710, 690, 780, 800, 740, 810, 186];

const projectPL = [
    { name: "Meridian Tower", revenue: 218000, cost: 156000, profit: 62000, margin: 28 },
    { name: "Harbor Residences", revenue: 145000, cost: 98000, profit: 47000, margin: 32 },
    { name: "Civic Center", revenue: 142000, cost: 108000, profit: 34000, margin: 24 },
    { name: "Park View Office", revenue: 45000, cost: 32000, profit: 13000, margin: 29 },
    { name: "Riverside Lofts", revenue: 172000, cost: 130000, profit: 42000, margin: 24 },
];

const utilizationByPerson = [
    { name: "Alex Chen", billable: 85, nonBillable: 10, pto: 5 },
    { name: "Maria Santos", billable: 82, nonBillable: 12, pto: 6 },
    { name: "Jake Williams", billable: 72, nonBillable: 15, pto: 13 },
    { name: "Priya Patel", billable: 90, nonBillable: 8, pto: 2 },
    { name: "Sam Rogers", billable: 68, nonBillable: 14, pto: 18 },
    { name: "Elena Vasquez", billable: 88, nonBillable: 10, pto: 2 },
];

const agedReceivables = [
    { range: "Current", amount: 35000 },
    { range: "1–30 days", amount: 18900 },
    { range: "31–60 days", amount: 8200 },
    { range: "61–90 days", amount: 0 },
    { range: "90+ days", amount: 0 },
];

const formatCurrency = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

type ReportType = "revenue" | "utilization" | "profitability" | "receivables";

export default function ReportsPage() {
    const [activeReport, setActiveReport] = useState<ReportType>("revenue");
    const [period, setPeriod] = useState("12-months");
    const [showToast, setShowToast] = useState(false);

    const exportCSV = () => {
        let csvContent = "";
        let filename = "";

        if (activeReport === "revenue") {
            csvContent = "Month,Revenue,Hours\n" + months.map((m, i) => `${m},${revenueData[i]},${hoursData[i]}`).join("\n");
            filename = "archflow_revenue_report.csv";
        } else if (activeReport === "utilization") {
            csvContent = "Name,Billable %,Non-Billable %,PTO %\n" + utilizationByPerson.map((u) => `${u.name},${u.billable},${u.nonBillable},${u.pto}`).join("\n");
            filename = "archflow_utilization_report.csv";
        } else if (activeReport === "profitability") {
            csvContent = "Project,Revenue,Cost,Profit,Margin %\n" + projectPL.map((p) => `${p.name},${p.revenue},${p.cost},${p.profit},${p.margin}`).join("\n");
            filename = "archflow_profitability_report.csv";
        } else {
            csvContent = "Age Range,Amount\n" + agedReceivables.map((a) => `${a.range},${a.amount}`).join("\n");
            filename = "archflow_receivables_report.csv";
        }

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const totalRevenue = revenueData.reduce((s, v) => s + v, 0);
    const totalHours = hoursData.reduce((s, v) => s + v, 0);
    const avgUtil = Math.round(utilizationByPerson.reduce((s, u) => s + u.billable, 0) / utilizationByPerson.length);
    const totalAR = agedReceivables.reduce((s, a) => s + a.amount, 0);

    const reports: { key: ReportType; label: string; icon: typeof BarChart3 }[] = [
        { key: "revenue", label: "Revenue", icon: DollarSign },
        { key: "utilization", label: "Utilization", icon: Clock },
        { key: "profitability", label: "Profitability", icon: TrendingUp },
        { key: "receivables", label: "Receivables", icon: FileText },
    ];

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Reports</h1>
                    <p style={{ marginTop: "4px", fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 300 }}>Analytics and insights for your firm</p>
                </div>
                <button
                    onClick={exportCSV}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", color: "var(--text-secondary)", fontSize: "12px", cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; e.currentTarget.style.color = "var(--accent-primary)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-secondary)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                >
                    <Download size={14} /> Export CSV
                </button>
            </div>

            {/* Summary row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
                {[
                    { label: "Annual Revenue", value: formatCurrency(totalRevenue), icon: DollarSign, color: "var(--accent-primary)" },
                    { label: "Total Hours", value: `${totalHours.toLocaleString()}h`, icon: Clock, color: "var(--accent-secondary)" },
                    { label: "Avg Utilization", value: `${avgUtil}%`, icon: Users, color: "var(--accent-gold)" },
                    { label: "Accounts Receivable", value: formatCurrency(totalAR), icon: FileText, color: "var(--info)" },
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

            {/* Report tabs */}
            <div style={{ display: "flex", gap: "2px", background: "var(--bg-secondary)", borderRadius: "8px", padding: "3px", width: "fit-content", marginBottom: "20px" }}>
                {reports.map((r) => (
                    <button key={r.key} onClick={() => setActiveReport(r.key)}
                        style={{ padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: activeReport === r.key ? 500 : 400, background: activeReport === r.key ? "var(--bg-card)" : "transparent", color: activeReport === r.key ? "var(--text-primary)" : "var(--text-muted)", boxShadow: activeReport === r.key ? "var(--shadow-sm)" : "none", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "6px" }}>
                        <r.icon size={13} /> {r.label}
                    </button>
                ))}
            </div>

            {/* Revenue report */}
            {activeReport === "revenue" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div style={{ gridColumn: "span 2", padding: "24px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3 style={{ fontSize: "15px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Monthly Revenue</h3>
                            <span style={{ fontSize: "10px", color: "var(--text-muted)", padding: "4px 10px", borderRadius: "4px", border: "1px solid var(--border-primary)" }}>FY 2026</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "200px" }}>
                            {revenueData.map((v, i) => {
                                const maxVal = Math.max(...revenueData);
                                const h = (v / maxVal) * 100;
                                return (
                                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", gap: "6px" }}>
                                        <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>{formatCurrency(v)}</span>
                                        <div style={{ width: "100%", borderRadius: "3px 3px 0 0", height: `${h}%`, background: i === revenueData.length - 1 ? "var(--accent-primary)" : "rgba(176,122,74,0.15)", transition: "height 0.4s", minHeight: "4px" }} />
                                        <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>{months[i]}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Utilization report */}
            {activeReport === "utilization" && (
                <div style={{ padding: "24px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "20px" }}>Team Utilization Breakdown</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {utilizationByPerson.map((person, i) => (
                            <div key={i}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                    <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{person.name}</span>
                                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{person.billable}% billable</span>
                                </div>
                                <div style={{ display: "flex", height: "20px", borderRadius: "4px", overflow: "hidden", background: "var(--bg-secondary)" }}>
                                    <div style={{ width: `${person.billable}%`, background: "var(--accent-primary)", transition: "width 0.4s" }} />
                                    <div style={{ width: `${person.nonBillable}%`, background: "rgba(176,122,74,0.25)", transition: "width 0.4s" }} />
                                    <div style={{ width: `${person.pto}%`, background: "var(--bg-tertiary)", transition: "width 0.4s" }} />
                                </div>
                            </div>
                        ))}
                        <div style={{ display: "flex", gap: "20px", paddingTop: "12px", borderTop: "1px solid var(--border-primary)" }}>
                            {[
                                { label: "Billable", color: "var(--accent-primary)" },
                                { label: "Non-Billable", color: "rgba(176,122,74,0.25)" },
                                { label: "PTO", color: "var(--bg-tertiary)" },
                            ].map((legend) => (
                                <div key={legend.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: legend.color }} />
                                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{legend.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Profitability report */}
            {activeReport === "profitability" && (
                <div style={{ borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
                    <div style={{ padding: "20px 20px 0" }}>
                        <h3 style={{ fontSize: "15px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>P&L by Project</h3>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "16px" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border-primary)", background: "var(--bg-warm)" }}>
                                {["Project", "Revenue", "Cost", "Profit", "Margin", ""].map((h) => (
                                    <th key={h} style={{ padding: "10px 14px", textAlign: h === "Project" ? "left" : "right", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {projectPL.map((p, i) => (
                                <tr key={i} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                                    <td style={{ padding: "14px", fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{p.name}</td>
                                    <td style={{ padding: "14px", fontSize: "12px", color: "var(--text-secondary)", textAlign: "right" }}>{formatCurrency(p.revenue)}</td>
                                    <td style={{ padding: "14px", fontSize: "12px", color: "var(--text-tertiary)", textAlign: "right" }}>{formatCurrency(p.cost)}</td>
                                    <td style={{ padding: "14px", fontSize: "13px", fontWeight: 500, color: "var(--success)", textAlign: "right" }}>{formatCurrency(p.profit)}</td>
                                    <td style={{ padding: "14px", textAlign: "right" }}>
                                        <span style={{ fontSize: "11px", fontWeight: 500, padding: "3px 8px", borderRadius: "3px", background: p.margin >= 30 ? "rgba(90,122,70,0.08)" : "rgba(176,138,48,0.08)", color: p.margin >= 30 ? "var(--success)" : "var(--warning)" }}>
                                            {p.margin}%
                                        </span>
                                    </td>
                                    <td style={{ padding: "14px" }}>
                                        <div style={{ width: "60px", height: "4px", borderRadius: "2px", background: "var(--bg-tertiary)" }}>
                                            <div style={{ height: "100%", borderRadius: "2px", width: `${Math.min(p.margin * 2.5, 100)}%`, background: p.margin >= 30 ? "var(--success)" : "var(--warning)" }} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: "var(--bg-warm)" }}>
                                <td style={{ padding: "14px", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Total</td>
                                <td style={{ padding: "14px", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", textAlign: "right" }}>{formatCurrency(projectPL.reduce((s, p) => s + p.revenue, 0))}</td>
                                <td style={{ padding: "14px", fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)", textAlign: "right" }}>{formatCurrency(projectPL.reduce((s, p) => s + p.cost, 0))}</td>
                                <td style={{ padding: "14px", fontSize: "13px", fontWeight: 600, color: "var(--success)", textAlign: "right" }}>{formatCurrency(projectPL.reduce((s, p) => s + p.profit, 0))}</td>
                                <td style={{ padding: "14px", textAlign: "right" }}>
                                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--success)" }}>{Math.round(projectPL.reduce((s, p) => s + p.profit, 0) / projectPL.reduce((s, p) => s + p.revenue, 0) * 100)}%</span>
                                </td>
                                <td />
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {/* Receivables report */}
            {activeReport === "receivables" && (
                <div style={{ padding: "24px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "20px" }}>Aged Receivables</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {agedReceivables.map((ar, i) => {
                            const maxAR = Math.max(...agedReceivables.map((a) => a.amount), 1);
                            const widthPct = (ar.amount / maxAR) * 100;
                            const isOverdue = i >= 2;
                            return (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                    <span style={{ fontSize: "12px", color: "var(--text-secondary)", minWidth: "80px" }}>{ar.range}</span>
                                    <div style={{ flex: 1, height: "28px", borderRadius: "4px", background: "var(--bg-secondary)", position: "relative" }}>
                                        {ar.amount > 0 && (
                                            <div style={{
                                                height: "100%", borderRadius: "4px", width: `${widthPct}%`,
                                                background: isOverdue ? "rgba(176,80,64,0.15)" : "rgba(176,122,74,0.12)",
                                                display: "flex", alignItems: "center", paddingLeft: "10px",
                                                transition: "width 0.4s",
                                            }}>
                                                <span style={{ fontSize: "12px", fontWeight: 500, color: isOverdue ? "var(--danger)" : "var(--text-primary)" }}>{formatCurrency(ar.amount)}</span>
                                            </div>
                                        )}
                                        {ar.amount === 0 && (
                                            <div style={{ height: "100%", display: "flex", alignItems: "center", paddingLeft: "10px" }}>
                                                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>$0</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border-primary)", display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>Total Outstanding</span>
                        <span style={{ fontSize: "16px", fontWeight: 400, color: "var(--accent-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{formatCurrency(totalAR)}</span>
                    </div>
                </div>
            )}

            {/* Export toast */}
            {showToast && (
                <div style={{
                    position: "fixed", bottom: "24px", right: "24px", zIndex: 300,
                    padding: "14px 22px", borderRadius: "10px",
                    background: "var(--bg-card)", border: "1px solid rgba(90,122,70,0.25)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                    display: "flex", alignItems: "center", gap: "10px",
                    animation: "slideUp 0.3s ease-out",
                }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(90,122,70,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Download size={12} style={{ color: "var(--success)" }} />
                    </div>
                    <div>
                        <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>Export complete</p>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>{activeReport.charAt(0).toUpperCase() + activeReport.slice(1)} report downloaded</p>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
