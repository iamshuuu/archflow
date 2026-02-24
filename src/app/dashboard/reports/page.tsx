"use client";

import { useState, useMemo } from "react";
import { trpc } from "@/app/providers";
import {
    BarChart3,
    Download,
    TrendingUp,
    DollarSign,
    Clock,
    Users,
    FileText,
    Percent,
    Target,
    Filter,
    Printer,
    Loader2,
} from "lucide-react";

const formatCurrency = (v: number) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

type ReportType = "revenue" | "utilization" | "profitability" | "receivables" | "realization" | "profit-drivers";

export default function ReportsPage() {
    const [activeReport, setActiveReport] = useState<ReportType>("revenue");
    const [showToast, setShowToast] = useState(false);

    // Filters
    const [filterProject, setFilterProject] = useState("");
    const [filterTeamMember, setFilterTeamMember] = useState("");

    const { data: rawProjects = [] } = trpc.project.budgets.useQuery();
    const { data: rawTeam = [] } = trpc.team.list.useQuery();
    const { data: rawInvoices = [] } = trpc.invoice.list.useQuery();
    const { data: rawExpenses = [] } = trpc.expense.list.useQuery();

    // Apply filters — only to data that has relevant dimension
    const projects = useMemo(() => {
        if (!filterProject) return rawProjects as any[];
        return (rawProjects as any[]).filter((p: any) => p.id === filterProject);
    }, [rawProjects, filterProject]);

    const teamMembers = useMemo(() => {
        if (!filterTeamMember) return rawTeam as any[];
        return (rawTeam as any[]).filter((m: any) => m.id === filterTeamMember);
    }, [rawTeam, filterTeamMember]);

    // Revenue
    const totalRevenue = projects.reduce((s: number, p: any) => s + (p.contractValue || 0), 0);

    // Project P&L
    const projectPL = projects.map((p: any) => {
        const revenue = p.contractValue || 0;
        const totalHours = (p.phases || []).reduce((s: number, ph: any) =>
            s + (ph.timeEntries || []).reduce((hs: number, te: any) => hs + te.hours, 0), 0);
        const cost = Math.round(totalHours * 55);
        const profit = revenue - cost;
        const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;
        return { name: p.name, revenue, cost, profit, margin, hours: totalHours };
    });

    // Utilization
    const utilizationByPerson = teamMembers.map((m: any) => {
        const entries = m.timeEntries || [];
        const totalHours = entries.reduce((s: number, te: any) => s + te.hours, 0);
        const billableHours = entries.filter((te: any) => te.billable !== false).reduce((s: number, te: any) => s + te.hours, 0);
        const nonBillableHours = entries.filter((te: any) => te.billable === false && te.entryType !== "pto").reduce((s: number, te: any) => s + te.hours, 0);
        const ptoHours = entries.filter((te: any) => te.entryType === "pto").reduce((s: number, te: any) => s + te.hours, 0);
        const capacity = 40 * 6;
        return {
            name: m.name, title: m.title || "",
            billable: capacity > 0 ? Math.round((billableHours / capacity) * 100) : 0,
            nonBillable: capacity > 0 ? Math.round((nonBillableHours / capacity) * 100) : 0,
            pto: capacity > 0 ? Math.round((ptoHours / capacity) * 100) : 0,
            billableHours, nonBillableHours, ptoHours, totalHours,
            billRate: m.billRate || 0, costRate: m.costRate || 0,
        };
    });

    // Realization rate: billed $ vs potential (billable hours × bill rate)
    const realizationData = teamMembers.map((m: any) => {
        const entries = m.timeEntries || [];
        const billableHours = entries.filter((te: any) => te.billable !== false).reduce((s: number, te: any) => s + te.hours, 0);
        const billRate = m.billRate || 150;
        const potential = billableHours * billRate;
        // Match invoiced amounts for this member's projects
        const invoiced = (rawInvoices as any[])
            .filter((inv: any) => inv.status === "paid")
            .reduce((s: number, inv: any) => s + inv.amount, 0);
        const perPersonInvoiced = teamMembers.length > 0 ? invoiced / teamMembers.length : 0;
        const rate = potential > 0 ? Math.round((perPersonInvoiced / potential) * 100) : 0;
        return { name: m.name, title: m.title || "", billableHours, potential, invoiced: Math.round(perPersonInvoiced), rate };
    });

    // Profit drivers
    const profitDrivers = projects.map((p: any) => {
        const rev = p.contractValue || 0;
        const hours = (p.phases || []).reduce((s: number, ph: any) =>
            s + (ph.timeEntries || []).reduce((hs: number, te: any) => hs + te.hours, 0), 0);
        const laborCost = Math.round(hours * 55);
        const expenses = (rawExpenses as any[]).filter((e: any) => e.projectId === p.id).reduce((s: number, e: any) => s + e.amount, 0);
        const totalCost = laborCost + expenses;
        const profit = rev - totalCost;
        const margin = rev > 0 ? Math.round((profit / rev) * 100) : 0;
        return { name: p.name, revenue: rev, laborCost, expenses, totalCost, profit, margin, hours };
    }).sort((a, b) => b.profit - a.profit);

    // Aged receivables
    const now = new Date();
    const unpaidInvoices = (rawInvoices as any[]).filter((inv: any) => inv.status !== "paid");
    const agedReceivables = [
        { range: "Current", amount: unpaidInvoices.filter((i: any) => new Date(i.dueDate) >= now).reduce((s: number, i: any) => s + i.amount, 0) },
        { range: "1–30 days", amount: unpaidInvoices.filter((i: any) => { const d = (now.getTime() - new Date(i.dueDate).getTime()) / 86400000; return d > 0 && d <= 30; }).reduce((s: number, i: any) => s + i.amount, 0) },
        { range: "31–60 days", amount: unpaidInvoices.filter((i: any) => { const d = (now.getTime() - new Date(i.dueDate).getTime()) / 86400000; return d > 30 && d <= 60; }).reduce((s: number, i: any) => s + i.amount, 0) },
        { range: "61–90 days", amount: unpaidInvoices.filter((i: any) => { const d = (now.getTime() - new Date(i.dueDate).getTime()) / 86400000; return d > 60 && d <= 90; }).reduce((s: number, i: any) => s + i.amount, 0) },
        { range: "90+ days", amount: unpaidInvoices.filter((i: any) => (now.getTime() - new Date(i.dueDate).getTime()) / 86400000 > 90).reduce((s: number, i: any) => s + i.amount, 0) },
    ];

    // Summary stats
    const avgUtil = utilizationByPerson.length > 0 ? Math.round(utilizationByPerson.reduce((s, u) => s + u.billable, 0) / utilizationByPerson.length) : 0;
    const totalProfit = projectPL.reduce((s, p) => s + p.profit, 0);
    const totalOutstanding = agedReceivables.reduce((s, a) => s + a.amount, 0);
    const avgRealization = realizationData.length > 0 ? Math.round(realizationData.reduce((s, r) => s + r.rate, 0) / realizationData.length) : 0;

    const exportCSV = () => {
        let csv = "", filename = "";
        if (activeReport === "revenue") {
            csv = "Project,Revenue,Cost,Profit,Margin %\n" + projectPL.map(p => `${p.name},${p.revenue},${p.cost},${p.profit},${p.margin}`).join("\n");
            filename = "archflow_revenue.csv";
        } else if (activeReport === "utilization") {
            csv = "Name,Billable %,Non-Billable %,PTO %,Billable Hours,Total Hours\n" + utilizationByPerson.map(u => `${u.name},${u.billable},${u.nonBillable},${u.pto},${u.billableHours},${u.totalHours}`).join("\n");
            filename = "archflow_utilization.csv";
        } else if (activeReport === "profitability" || activeReport === "profit-drivers") {
            csv = "Project,Revenue,Labor Cost,Expenses,Total Cost,Profit,Margin %\n" + profitDrivers.map(p => `${p.name},${p.revenue},${p.laborCost},${p.expenses},${p.totalCost},${p.profit},${p.margin}`).join("\n");
            filename = "archflow_profitability.csv";
        } else if (activeReport === "realization") {
            csv = "Name,Billable Hours,Potential,Invoiced,Rate %\n" + realizationData.map(r => `${r.name},${r.billableHours},${r.potential},${r.invoiced},${r.rate}`).join("\n");
            filename = "archflow_realization.csv";
        } else {
            csv = "Age Range,Amount\n" + agedReceivables.map(a => `${a.range},${a.amount}`).join("\n");
            filename = "archflow_receivables.csv";
        }
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url; link.download = filename;
        document.body.appendChild(link); link.click();
        document.body.removeChild(link); URL.revokeObjectURL(url);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    const exportPDF = () => {
        // Build HTML report
        const title = reportTabs.find(t => t.key === activeReport)?.label || "Report";
        let bodyHtml = "";

        if (activeReport === "revenue" || activeReport === "profitability") {
            const data = activeReport === "revenue" ? projectPL : profitDrivers;
            bodyHtml = `<table style="width:100%;border-collapse:collapse;margin-top:20px"><thead><tr style="border-bottom:2px solid #B07A4A"><th style="text-align:left;padding:8px">Project</th><th style="text-align:right;padding:8px">Revenue</th><th style="text-align:right;padding:8px">Cost</th><th style="text-align:right;padding:8px">Profit</th><th style="text-align:right;padding:8px">Margin</th></tr></thead><tbody>${data.map(p => `<tr style="border-bottom:1px solid #eee"><td style="padding:8px">${p.name}</td><td style="text-align:right;padding:8px">${formatCurrency(p.revenue)}</td><td style="text-align:right;padding:8px">${formatCurrency(p.cost)}</td><td style="text-align:right;padding:8px;color:${p.profit >= 0 ? '#5a7a46' : '#b05040'}">${formatCurrency(p.profit)}</td><td style="text-align:right;padding:8px">${p.margin}%</td></tr>`).join("")}</tbody></table>`;
        } else if (activeReport === "utilization") {
            bodyHtml = `<table style="width:100%;border-collapse:collapse;margin-top:20px"><thead><tr style="border-bottom:2px solid #B07A4A"><th style="text-align:left;padding:8px">Name</th><th style="text-align:right;padding:8px">Billable %</th><th style="text-align:right;padding:8px">Billable Hrs</th><th style="text-align:right;padding:8px">Total Hrs</th></tr></thead><tbody>${utilizationByPerson.map(u => `<tr style="border-bottom:1px solid #eee"><td style="padding:8px">${u.name}</td><td style="text-align:right;padding:8px">${u.billable}%</td><td style="text-align:right;padding:8px">${u.billableHours}h</td><td style="text-align:right;padding:8px">${u.totalHours}h</td></tr>`).join("")}</tbody></table>`;
        } else if (activeReport === "realization") {
            bodyHtml = `<table style="width:100%;border-collapse:collapse;margin-top:20px"><thead><tr style="border-bottom:2px solid #B07A4A"><th style="text-align:left;padding:8px">Name</th><th style="text-align:right;padding:8px">Billable Hrs</th><th style="text-align:right;padding:8px">Potential</th><th style="text-align:right;padding:8px">Invoiced</th><th style="text-align:right;padding:8px">Rate</th></tr></thead><tbody>${realizationData.map(r => `<tr style="border-bottom:1px solid #eee"><td style="padding:8px">${r.name}</td><td style="text-align:right;padding:8px">${r.billableHours}h</td><td style="text-align:right;padding:8px">${formatCurrency(r.potential)}</td><td style="text-align:right;padding:8px">${formatCurrency(r.invoiced)}</td><td style="text-align:right;padding:8px">${r.rate}%</td></tr>`).join("")}</tbody></table>`;
        } else if (activeReport === "profit-drivers") {
            bodyHtml = `<table style="width:100%;border-collapse:collapse;margin-top:20px"><thead><tr style="border-bottom:2px solid #B07A4A"><th style="text-align:left;padding:8px">Project</th><th style="text-align:right;padding:8px">Revenue</th><th style="text-align:right;padding:8px">Labor</th><th style="text-align:right;padding:8px">Expenses</th><th style="text-align:right;padding:8px">Profit</th><th style="text-align:right;padding:8px">Margin</th></tr></thead><tbody>${profitDrivers.map(p => `<tr style="border-bottom:1px solid #eee"><td style="padding:8px">${p.name}</td><td style="text-align:right;padding:8px">${formatCurrency(p.revenue)}</td><td style="text-align:right;padding:8px">${formatCurrency(p.laborCost)}</td><td style="text-align:right;padding:8px">${formatCurrency(p.expenses)}</td><td style="text-align:right;padding:8px;color:${p.profit >= 0 ? '#5a7a46' : '#b05040'}">${formatCurrency(p.profit)}</td><td style="text-align:right;padding:8px">${p.margin}%</td></tr>`).join("")}</tbody></table>`;
        } else {
            bodyHtml = `<table style="width:100%;border-collapse:collapse;margin-top:20px"><thead><tr style="border-bottom:2px solid #B07A4A"><th style="text-align:left;padding:8px">Age Range</th><th style="text-align:right;padding:8px">Amount</th></tr></thead><tbody>${agedReceivables.map(a => `<tr style="border-bottom:1px solid #eee"><td style="padding:8px">${a.range}</td><td style="text-align:right;padding:8px">${formatCurrency(a.amount)}</td></tr>`).join("")}</tbody></table>`;
        }

        const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title} — ArchFlow</title><style>body{font-family:'Segoe UI',system-ui,sans-serif;padding:40px;color:#333}h1{color:#B07A4A;font-size:24px;margin-bottom:4px}p{color:#999;font-size:12px;margin-bottom:20px}</style></head><body><h1>${title}</h1><p>Generated on ${new Date().toLocaleDateString()}</p>${bodyHtml}</body></html>`;

        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const win = window.open(url, "_blank");
        if (win) setTimeout(() => win.print(), 500);
    };

    const reportTabs: { key: ReportType; label: string; icon: React.ReactNode }[] = [
        { key: "revenue", label: "Revenue", icon: <DollarSign size={13} /> },
        { key: "utilization", label: "Utilization", icon: <Clock size={13} /> },
        { key: "profitability", label: "Profitability", icon: <TrendingUp size={13} /> },
        { key: "realization", label: "Realization", icon: <Percent size={13} /> },
        { key: "profit-drivers", label: "Profit Drivers", icon: <Target size={13} /> },
        { key: "receivables", label: "Receivables", icon: <FileText size={13} /> },
    ];

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Reports</h1>
                    <p style={{ marginTop: "4px", fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 300 }}>Analyze performance, profitability, and realization</p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={exportPDF} style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)" }}>
                        <Printer size={13} /> PDF
                    </button>
                    <button onClick={exportCSV} style={{ padding: "8px 14px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "white", fontWeight: 500 }}>
                        <Download size={13} /> CSV
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
                {[
                    { label: "Total Revenue", value: formatCurrency(totalRevenue), icon: DollarSign, color: "var(--accent-primary)" },
                    { label: "Avg Utilization", value: `${avgUtil}%`, icon: Clock, color: avgUtil >= 75 ? "var(--success)" : "var(--warning)" },
                    { label: "Net Profit", value: formatCurrency(totalProfit), icon: TrendingUp, color: totalProfit >= 0 ? "var(--success)" : "var(--danger)" },
                    { label: "Avg Realization", value: `${avgRealization}%`, icon: Percent, color: avgRealization >= 80 ? "var(--success)" : "var(--warning)" },
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

            {/* Filters */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px", alignItems: "center" }}>
                <Filter size={14} style={{ color: "var(--text-muted)" }} />
                <select value={filterProject} onChange={e => setFilterProject(e.target.value)} style={{ padding: "7px 10px", borderRadius: "5px", border: "1px solid var(--border-primary)", background: "var(--bg-card)", fontSize: "11px", color: "var(--text-primary)", cursor: "pointer" }}>
                    <option value="">All Projects</option>
                    {(rawProjects as any[]).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select value={filterTeamMember} onChange={e => setFilterTeamMember(e.target.value)} style={{ padding: "7px 10px", borderRadius: "5px", border: "1px solid var(--border-primary)", background: "var(--bg-card)", fontSize: "11px", color: "var(--text-primary)", cursor: "pointer" }}>
                    <option value="">All Team Members</option>
                    {(rawTeam as any[]).map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                {(filterProject || filterTeamMember) && (
                    <button onClick={() => { setFilterProject(""); setFilterTeamMember(""); }} style={{ padding: "6px 12px", borderRadius: "5px", border: "1px solid var(--border-secondary)", background: "transparent", cursor: "pointer", fontSize: "10px", color: "var(--text-muted)" }}>Clear</button>
                )}
            </div>

            {/* Report tabs */}
            <div style={{ display: "flex", gap: "0", marginBottom: "24px", borderBottom: "1px solid var(--border-primary)", overflowX: "auto" }}>
                {reportTabs.map(tab => (
                    <button key={tab.key} onClick={() => setActiveReport(tab.key)} style={{ padding: "10px 16px", fontSize: "11px", fontWeight: 500, cursor: "pointer", border: "none", background: "none", color: activeReport === tab.key ? "var(--accent-primary)" : "var(--text-muted)", borderBottom: activeReport === tab.key ? "2px solid var(--accent-primary)" : "2px solid transparent", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Report content */}
            <div style={{ borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
                {/* Revenue */}
                {activeReport === "revenue" && (
                    <div>
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-primary)" }}>
                            <h3 style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Revenue by Project</h3>
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead><tr style={{ borderBottom: "1px solid var(--border-primary)", background: "var(--bg-warm)" }}>
                                {["Project", "Revenue", "Hours", "Cost", "Profit", "Margin"].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: h === "Project" ? "left" : "right", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>)}
                            </tr></thead>
                            <tbody>
                                {projectPL.length === 0 ? <tr><td colSpan={6} style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>No data</td></tr> : projectPL.map((p, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                                        <td style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>{p.name}</td>
                                        <td style={{ padding: "12px 14px", fontSize: "12px", textAlign: "right" }}>{formatCurrency(p.revenue)}</td>
                                        <td style={{ padding: "12px 14px", fontSize: "12px", textAlign: "right", color: "var(--text-muted)" }}>{p.hours}h</td>
                                        <td style={{ padding: "12px 14px", fontSize: "12px", textAlign: "right", color: "var(--text-muted)" }}>{formatCurrency(p.cost)}</td>
                                        <td style={{ padding: "12px 14px", fontSize: "12px", textAlign: "right", fontWeight: 600, color: p.profit >= 0 ? "var(--success)" : "var(--danger)" }}>{formatCurrency(p.profit)}</td>
                                        <td style={{ padding: "12px 14px", fontSize: "12px", textAlign: "right" }}><span style={{ padding: "2px 8px", borderRadius: "3px", background: p.margin >= 30 ? "rgba(90,122,70,0.08)" : "rgba(176,80,64,0.08)", color: p.margin >= 30 ? "var(--success)" : "var(--danger)", fontSize: "10px", fontWeight: 600 }}>{p.margin}%</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Utilization */}
                {activeReport === "utilization" && (
                    <div>
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-primary)" }}>
                            <h3 style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Team Utilization</h3>
                        </div>
                        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                            {utilizationByPerson.length === 0 ? <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>No data</p> : utilizationByPerson.map((u, i) => (
                                <div key={i}>
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>{u.name}</span>
                                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{u.billableHours}h billable · {u.totalHours}h total</span>
                                    </div>
                                    <div style={{ display: "flex", height: "12px", borderRadius: "6px", overflow: "hidden", background: "var(--bg-tertiary)" }}>
                                        <div style={{ width: `${u.billable}%`, background: "var(--success)", transition: "width 0.3s" }} />
                                        <div style={{ width: `${u.nonBillable}%`, background: "var(--warning)", transition: "width 0.3s" }} />
                                        <div style={{ width: `${u.pto}%`, background: "var(--info)", transition: "width 0.3s" }} />
                                    </div>
                                    <div style={{ display: "flex", gap: "16px", marginTop: "4px", fontSize: "9px", color: "var(--text-muted)" }}>
                                        <span>● Billable {u.billable}%</span>
                                        <span>● Non-Bill {u.nonBillable}%</span>
                                        <span>● PTO {u.pto}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Profitability */}
                {activeReport === "profitability" && (
                    <div>
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-primary)" }}>
                            <h3 style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Project Profitability</h3>
                        </div>
                        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            {projectPL.length === 0 ? <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>No data</p> : projectPL.map((p, i) => {
                                const maxRev = Math.max(...projectPL.map(x => x.revenue), 1);
                                return (
                                    <div key={i} style={{ padding: "14px", borderRadius: "8px", background: "var(--bg-warm)" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                                            <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>{p.name}</span>
                                            <span style={{ fontSize: "12px", fontWeight: 600, color: p.profit >= 0 ? "var(--success)" : "var(--danger)" }}>{formatCurrency(p.profit)}</span>
                                        </div>
                                        <div style={{ position: "relative", height: "8px", borderRadius: "4px", background: "var(--bg-tertiary)", overflow: "hidden" }}>
                                            <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${(p.revenue / maxRev) * 100}%`, background: "rgba(90,122,70,0.3)", borderRadius: "4px" }} />
                                            <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${(p.cost / maxRev) * 100}%`, background: "rgba(176,80,64,0.3)", borderRadius: "4px" }} />
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "9px", color: "var(--text-muted)" }}>
                                            <span>Rev: {formatCurrency(p.revenue)}</span>
                                            <span>Cost: {formatCurrency(p.cost)}</span>
                                            <span>Margin: {p.margin}%</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Realization Rate */}
                {activeReport === "realization" && (
                    <div>
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-primary)" }}>
                            <h3 style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Realization Rate</h3>
                            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>Percentage of billable potential actually collected through paid invoices</p>
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead><tr style={{ borderBottom: "1px solid var(--border-primary)", background: "var(--bg-warm)" }}>
                                {["Name", "Billable Hours", "Potential ($)", "Invoiced ($)", "Realization"].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: h === "Name" ? "left" : "right", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>)}
                            </tr></thead>
                            <tbody>
                                {realizationData.length === 0 ? <tr><td colSpan={5} style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>No data</td></tr> : realizationData.map((r, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                                        <td style={{ padding: "12px 14px" }}><div style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>{r.name}</div><div style={{ fontSize: "10px", color: "var(--text-muted)" }}>{r.title}</div></td>
                                        <td style={{ padding: "12px 14px", fontSize: "12px", textAlign: "right" }}>{r.billableHours}h</td>
                                        <td style={{ padding: "12px 14px", fontSize: "12px", textAlign: "right" }}>{formatCurrency(r.potential)}</td>
                                        <td style={{ padding: "12px 14px", fontSize: "12px", textAlign: "right" }}>{formatCurrency(r.invoiced)}</td>
                                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                                                <div style={{ width: "60px", height: "6px", borderRadius: "3px", background: "var(--bg-tertiary)", overflow: "hidden" }}>
                                                    <div style={{ height: "100%", width: `${Math.min(r.rate, 100)}%`, background: r.rate >= 80 ? "var(--success)" : r.rate >= 60 ? "var(--warning)" : "var(--danger)", borderRadius: "3px" }} />
                                                </div>
                                                <span style={{ fontSize: "12px", fontWeight: 600, color: r.rate >= 80 ? "var(--success)" : r.rate >= 60 ? "var(--warning)" : "var(--danger)" }}>{r.rate}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Profit Drivers */}
                {activeReport === "profit-drivers" && (
                    <div>
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-primary)" }}>
                            <h3 style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Profit Drivers</h3>
                            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>Projects ranked by profit contribution — includes labor and expense costs</p>
                        </div>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead><tr style={{ borderBottom: "1px solid var(--border-primary)", background: "var(--bg-warm)" }}>
                                {["Project", "Revenue", "Labor", "Expenses", "Profit", "Margin"].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: h === "Project" ? "left" : "right", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>)}
                            </tr></thead>
                            <tbody>
                                {profitDrivers.length === 0 ? <tr><td colSpan={6} style={{ padding: "30px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>No data</td></tr> : profitDrivers.map((p, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                                        <td style={{ padding: "12px 14px", fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>{p.name}</td>
                                        <td style={{ padding: "12px 14px", fontSize: "12px", textAlign: "right" }}>{formatCurrency(p.revenue)}</td>
                                        <td style={{ padding: "12px 14px", fontSize: "12px", textAlign: "right", color: "var(--text-muted)" }}>{formatCurrency(p.laborCost)}</td>
                                        <td style={{ padding: "12px 14px", fontSize: "12px", textAlign: "right", color: "var(--text-muted)" }}>{formatCurrency(p.expenses)}</td>
                                        <td style={{ padding: "12px 14px", fontSize: "12px", textAlign: "right", fontWeight: 600, color: p.profit >= 0 ? "var(--success)" : "var(--danger)" }}>{formatCurrency(p.profit)}</td>
                                        <td style={{ padding: "12px 14px", textAlign: "right" }}>
                                            <span style={{ padding: "2px 8px", borderRadius: "3px", background: p.margin >= 30 ? "rgba(90,122,70,0.08)" : "rgba(176,80,64,0.08)", color: p.margin >= 30 ? "var(--success)" : "var(--danger)", fontSize: "10px", fontWeight: 600 }}>{p.margin}%</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Receivables */}
                {activeReport === "receivables" && (
                    <div>
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-primary)" }}>
                            <h3 style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Aged Receivables</h3>
                        </div>
                        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            {agedReceivables.map((a, i) => {
                                const max = Math.max(...agedReceivables.map(x => x.amount), 1);
                                const colors = ["var(--success)", "var(--info)", "var(--warning)", "var(--accent-primary)", "var(--danger)"];
                                return (
                                    <div key={i}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                            <span style={{ fontSize: "12px", color: "var(--text-primary)" }}>{a.range}</span>
                                            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{formatCurrency(a.amount)}</span>
                                        </div>
                                        <div style={{ height: "8px", borderRadius: "4px", background: "var(--bg-tertiary)", overflow: "hidden" }}>
                                            <div style={{ height: "100%", width: `${(a.amount / max) * 100}%`, background: colors[i], borderRadius: "4px", transition: "width 0.3s" }} />
                                        </div>
                                    </div>
                                );
                            })}
                            <div style={{ padding: "12px", borderRadius: "6px", background: "var(--bg-warm)", textAlign: "right", marginTop: "8px" }}>
                                <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", marginRight: "8px" }}>Total Outstanding</span>
                                <span style={{ fontSize: "16px", fontWeight: 500, color: "var(--accent-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{formatCurrency(totalOutstanding)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Toast */}
            {showToast && (
                <div style={{ position: "fixed", bottom: "24px", right: "24px", padding: "12px 20px", borderRadius: "8px", background: "var(--success)", color: "white", fontSize: "12px", fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", zIndex: 1000, animation: "fadeIn 0.2s" }}>
                    Report exported successfully
                </div>
            )}
        </div>
    );
}
