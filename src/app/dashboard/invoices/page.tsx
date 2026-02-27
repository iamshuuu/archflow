"use client";

import { useState } from "react";
import { trpc } from "@/app/providers";
import {
    Plus, Search, FileText, Send, Eye, DollarSign, Clock, CheckCircle2, AlertCircle,
    Download, X, Trash2, Settings, Zap, Layers, Loader2, BarChart3, CreditCard, Users, Receipt,
} from "lucide-react";
import OverviewTab from "./OverviewTab";
import UnbilledTab from "./UnbilledTab";
import ARAgingTab from "./ARAgingTab";
import PaymentsTab from "./PaymentsTab";
import ConsultantBillsTab from "./ConsultantBillsTab";
import { formatCurrency, labelStyle, inputStyle, modalOverlay, modalBox, btnPrimary, btnSecondary } from "./InvoiceStyles";

type InvoiceStatus = "draft" | "sent" | "viewed" | "paid" | "overdue";
interface LineItem { description: string; qty: number; rate: number }

const statusConfig: Record<InvoiceStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    draft: { label: "Draft", color: "var(--text-muted)", bg: "var(--bg-secondary)", icon: <FileText size={10} /> },
    sent: { label: "Sent", color: "var(--info)", bg: "rgba(107,141,214,0.08)", icon: <Send size={10} /> },
    viewed: { label: "Viewed", color: "var(--accent-gold)", bg: "rgba(176,138,48,0.08)", icon: <Eye size={10} /> },
    paid: { label: "Paid", color: "var(--success)", bg: "rgba(90,122,70,0.08)", icon: <CheckCircle2 size={10} /> },
    overdue: { label: "Overdue", color: "var(--danger)", bg: "rgba(176,80,64,0.08)", icon: <AlertCircle size={10} /> },
};

const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "invoices", label: "All Invoices", icon: FileText },
    { id: "unbilled", label: "Unbilled Work", icon: Clock },
    { id: "ar", label: "Accounts Receivable", icon: DollarSign },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "consultant-bills", label: "Consultant Bills", icon: Users },
    { id: "expenses", label: "Expenses", icon: Receipt },
];

const paymentTermsOptions = [
    { value: "net15", label: "Net 15", days: 15 },
    { value: "net30", label: "Net 30", days: 30 },
    { value: "net45", label: "Net 45", days: 45 },
    { value: "net60", label: "Net 60", days: 60 },
    { value: "custom", label: "Custom", days: 0 },
];

export default function InvoicesPage() {
    const utils = trpc.useUtils();
    const { data: rawInvoices = [], isLoading } = trpc.invoice.list.useQuery();
    const { data: projects = [] } = trpc.project.list.useQuery();
    const { data: template } = trpc.invoice.getTemplate.useQuery();
    const createInvoice = trpc.invoice.create.useMutation({ onSuccess: () => utils.invoice.invalidate() });
    const updateStatus = trpc.invoice.updateStatus.useMutation({ onSuccess: () => utils.invoice.invalidate() });
    const generateFromTime = trpc.invoice.generateFromTime.useMutation({ onSuccess: () => utils.invoice.invalidate() });
    const batchCreate = trpc.invoice.batchCreate.useMutation({ onSuccess: () => utils.invoice.invalidate() });
    const saveTemplate = trpc.invoice.saveTemplate.useMutation({ onSuccess: () => utils.invoice.invalidate() });

    const [activeTab, setActiveTab] = useState("overview");
    const [showCreate, setShowCreate] = useState(false);
    const [showGenerate, setShowGenerate] = useState(false);
    const [showBatch, setShowBatch] = useState(false);
    const [showTemplate, setShowTemplate] = useState(false);
    const [showPdf, setShowPdf] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    // Create form
    const [createProject, setCreateProject] = useState("");
    const [createDate, setCreateDate] = useState(new Date().toISOString().slice(0, 10));
    const [createDueDate, setCreateDueDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
    const [createNotes, setCreateNotes] = useState("");
    const [createLines, setCreateLines] = useState<LineItem[]>([{ description: "", qty: 1, rate: 150 }]);
    const [createTerms, setCreateTerms] = useState("net30");

    // Generate from time
    const [genProject, setGenProject] = useState("");
    const [genFromDate, setGenFromDate] = useState("");
    const [genToDate, setGenToDate] = useState("");
    const [genRate, setGenRate] = useState("150");

    // Batch
    const [batchProjects, setBatchProjects] = useState<string[]>([]);
    const [batchFromDate, setBatchFromDate] = useState("");
    const [batchToDate, setBatchToDate] = useState("");
    const [batchRate, setBatchRate] = useState("150");

    // Template
    const [tplCompanyName, setTplCompanyName] = useState(template?.companyName || "");
    const [tplAddress, setTplAddress] = useState(template?.address || "");
    const [tplPhone, setTplPhone] = useState(template?.phone || "");
    const [tplEmail, setTplEmail] = useState(template?.email || "");
    const [tplHeader, setTplHeader] = useState(template?.headerText || "");
    const [tplFooter, setTplFooter] = useState(template?.footerText || "Payment is due within 30 days.");
    const [tplAccent, setTplAccent] = useState(template?.accentColor || "#B07A4A");

    const invoices = (rawInvoices as any[]).map((inv: any) => ({
        id: inv.id, number: inv.number, client: inv.client?.name || "—", project: inv.project?.name || "—",
        amount: inv.amount, date: inv.date, dueDate: inv.dueDate, status: inv.status as InvoiceStatus,
        lineItems: inv.lineItems || [], notes: inv.notes || "", paymentUrl: inv.paymentUrl || "", clientId: inv.clientId,
    }));

    const filtered = invoices.filter((inv) => {
        if (filterStatus && inv.status !== filterStatus) return false;
        if (searchQuery && !inv.number.toLowerCase().includes(searchQuery.toLowerCase()) && !inv.client.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const handleCreate = async () => {
        const proj = (projects as any[]).find((p: any) => p.id === createProject);
        if (!proj) return;
        await createInvoice.mutateAsync({
            clientId: proj.clientId, projectId: createProject, date: createDate, dueDate: createDueDate,
            notes: createNotes, paymentTerms: createTerms, lineItems: createLines.filter(l => l.description),
        });
        setShowCreate(false); setCreateLines([{ description: "", qty: 1, rate: 150 }]); setCreateNotes("");
    };

    const handleTermsChange = (terms: string) => {
        setCreateTerms(terms);
        const opt = paymentTermsOptions.find(o => o.value === terms);
        if (opt && opt.days > 0) {
            const due = new Date(createDate);
            due.setDate(due.getDate() + opt.days);
            setCreateDueDate(due.toISOString().slice(0, 10));
        }
    };

    const handleGenerate = async () => {
        await generateFromTime.mutateAsync({ projectId: genProject, fromDate: genFromDate, toDate: genToDate, rate: parseFloat(genRate) || 150 });
        setShowGenerate(false);
    };

    const handleBatch = async () => {
        await batchCreate.mutateAsync({ projectIds: batchProjects, fromDate: batchFromDate, toDate: batchToDate, rate: parseFloat(batchRate) || 150 });
        setShowBatch(false); setBatchProjects([]);
    };

    const handleSaveTemplate = async () => {
        await saveTemplate.mutateAsync({ id: template?.id, companyName: tplCompanyName, address: tplAddress, phone: tplPhone, email: tplEmail, headerText: tplHeader, footerText: tplFooter, accentColor: tplAccent });
        setShowTemplate(false);
    };

    const updateLine = (idx: number, field: keyof LineItem, value: string | number) => {
        const newLines = [...createLines]; (newLines[idx] as any)[field] = value; setCreateLines(newLines);
    };

    const tabStyle = (id: string) => ({
        padding: "8px 16px", fontSize: "12px", cursor: "pointer", border: "none",
        borderBottom: activeTab === id ? "2px solid var(--accent-primary)" : "2px solid transparent",
        background: "transparent", color: activeTab === id ? "var(--accent-primary)" : "var(--text-muted)",
        fontWeight: activeTab === id ? 600 : 400, display: "flex", alignItems: "center", gap: "6px",
        transition: "all 0.15s",
    });

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Money</h1>
                    <p style={{ marginTop: "4px", fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 300 }}>Invoices, payments, billing, and consultant costs</p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => setShowTemplate(true)} style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)" }}><Settings size={13} /> Template</button>
                    <button onClick={() => setShowBatch(true)} style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)" }}><Layers size={13} /> Batch</button>
                    <button onClick={() => setShowGenerate(true)} style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)" }}><Zap size={13} /> From Time</button>
                    <button onClick={() => setShowCreate(true)} style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: "6px", fontSize: "12px" }}><Plus size={13} /> New Invoice</button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: "flex", gap: "0", borderBottom: "1px solid var(--border-primary)", marginBottom: "24px" }}>
                {tabs.map(t => (
                    <button key={t.id} onClick={() => setActiveTab(t.id)} style={tabStyle(t.id)}>
                        <t.icon size={13} /> {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "unbilled" && <UnbilledTab />}
            {activeTab === "ar" && <ARAgingTab />}
            {activeTab === "payments" && <PaymentsTab />}
            {activeTab === "consultant-bills" && <ConsultantBillsTab />}
            {activeTab === "expenses" && (
                <div style={{ padding: "40px", textAlign: "center", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
                    <Receipt size={32} style={{ color: "var(--text-muted)", marginBottom: "12px" }} />
                    <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "8px" }}>Expenses are managed on a dedicated page.</p>
                    <a href="/dashboard/expenses" style={{ fontSize: "13px", color: "var(--accent-primary)", textDecoration: "none", fontWeight: 500 }}>Go to Expenses →</a>
                </div>
            )}

            {/* All Invoices Tab */}
            {activeTab === "invoices" && (
                <div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
                        {[
                            { label: "Total Invoiced", value: formatCurrency(invoices.reduce((s, i) => s + i.amount, 0)), icon: DollarSign, color: "var(--accent-primary)" },
                            { label: "Paid", value: formatCurrency(invoices.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0)), icon: CheckCircle2, color: "var(--success)" },
                            { label: "Pending", value: formatCurrency(invoices.filter(i => ["draft", "sent", "viewed"].includes(i.status)).reduce((s, i) => s + i.amount, 0)), icon: Clock, color: "var(--warning)" },
                            { label: "Overdue", value: formatCurrency(invoices.filter(i => i.status === "overdue").reduce((s, i) => s + i.amount, 0)), icon: AlertCircle, color: "var(--danger)" },
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
                    <div style={{ display: "flex", gap: "10px", marginBottom: "20px", alignItems: "center" }}>
                        <div style={{ flex: 1, position: "relative" }}>
                            <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                            <input placeholder="Search invoices..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: "100%", padding: "8px 12px 8px 34px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", outline: "none" }} />
                        </div>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", cursor: "pointer" }}>
                            <option value="">All Statuses</option>
                            {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                    </div>
                    <div style={{ borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border-primary)", background: "var(--bg-warm)" }}>
                                    {["Invoice", "Client", "Project", "Amount", "Date", "Due", "Status", ""].map((h) => (
                                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={8} style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)", fontWeight: 300 }}>No invoices yet.</td></tr>
                                ) : filtered.map((inv) => {
                                    const sc = statusConfig[inv.status];
                                    return (
                                        <tr key={inv.id} style={{ borderBottom: "1px solid var(--border-primary)", transition: "background 0.1s" }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg-warm)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                            <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 600, color: "var(--accent-primary)" }}>{inv.number}</td>
                                            <td style={{ padding: "12px 14px", fontSize: "12px", color: "var(--text-primary)" }}>{inv.client}</td>
                                            <td style={{ padding: "12px 14px", fontSize: "12px", color: "var(--text-secondary)" }}>{inv.project}</td>
                                            <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{formatCurrency(inv.amount)}</td>
                                            <td style={{ padding: "12px 14px", fontSize: "12px", color: "var(--text-muted)" }}>{inv.date}</td>
                                            <td style={{ padding: "12px 14px", fontSize: "12px", color: "var(--text-muted)" }}>{inv.dueDate}</td>
                                            <td style={{ padding: "12px 14px" }}>
                                                <span style={{ fontSize: "9px", fontWeight: 600, padding: "3px 8px", borderRadius: "3px", textTransform: "uppercase", letterSpacing: "0.04em", color: sc.color, background: sc.bg, display: "inline-flex", alignItems: "center", gap: "4px" }}>{sc.icon} {sc.label}</span>
                                            </td>
                                            <td style={{ padding: "12px 14px" }}>
                                                <div style={{ display: "flex", gap: "4px" }}>
                                                    <button onClick={() => setShowPdf(inv.id)} title="Download PDF" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }} onMouseEnter={e => e.currentTarget.style.color = "var(--accent-primary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}><Download size={14} /></button>
                                                    {inv.status === "draft" && <button onClick={() => updateStatus.mutate({ id: inv.id, status: "sent" })} title="Mark Sent" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }} onMouseEnter={e => e.currentTarget.style.color = "var(--info)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}><Send size={14} /></button>}
                                                    {["sent", "viewed", "overdue"].includes(inv.status) && <button onClick={() => updateStatus.mutate({ id: inv.id, status: "paid" })} title="Mark Paid" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }} onMouseEnter={e => e.currentTarget.style.color = "var(--success)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}><CheckCircle2 size={14} /></button>}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Invoice Modal */}
            {showCreate && (
                <div style={modalOverlay} onClick={() => setShowCreate(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ ...modalBox, width: "560px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>New Invoice</h2>
                            <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={labelStyle}>Project</label>
                                <select value={createProject} onChange={e => setCreateProject(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                                    <option value="">Select project...</option>
                                    {(projects as any[]).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Payment Terms</label>
                                <select value={createTerms} onChange={e => handleTermsChange(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                                    {paymentTermsOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div><label style={labelStyle}>Issue Date</label><input type="date" value={createDate} onChange={e => setCreateDate(e.target.value)} style={inputStyle} /></div>
                                <div><label style={labelStyle}>Due Date</label><input type="date" value={createDueDate} onChange={e => setCreateDueDate(e.target.value)} style={inputStyle} /></div>
                            </div>
                            <div>
                                <label style={{ ...labelStyle, marginBottom: "8px" }}>Line Items</label>
                                {createLines.map((line, idx) => (
                                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "8px", marginBottom: "8px" }}>
                                        <input placeholder="Description" value={line.description} onChange={e => updateLine(idx, "description", e.target.value)} style={{ padding: "8px 10px", borderRadius: "5px", border: "1px solid var(--border-primary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", outline: "none" }} />
                                        <input type="number" placeholder="Qty" value={line.qty} onChange={e => updateLine(idx, "qty", parseFloat(e.target.value) || 0)} style={{ padding: "8px 10px", borderRadius: "5px", border: "1px solid var(--border-primary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", outline: "none" }} />
                                        <input type="number" placeholder="Rate" value={line.rate} onChange={e => updateLine(idx, "rate", parseFloat(e.target.value) || 0)} style={{ padding: "8px 10px", borderRadius: "5px", border: "1px solid var(--border-primary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", outline: "none" }} />
                                        <button onClick={() => setCreateLines(createLines.filter((_, i) => i !== idx))} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}><Trash2 size={14} /></button>
                                    </div>
                                ))}
                                <button onClick={() => setCreateLines([...createLines, { description: "", qty: 1, rate: 150 }])} style={{ padding: "6px 12px", borderRadius: "4px", border: "1px dashed var(--border-secondary)", background: "transparent", cursor: "pointer", fontSize: "11px", color: "var(--text-muted)", width: "100%" }}>+ Add line</button>
                            </div>
                            <div><label style={labelStyle}>Notes (optional)</label><textarea value={createNotes} onChange={e => setCreateNotes(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} /></div>
                            <div style={{ padding: "12px", borderRadius: "6px", background: "var(--bg-warm)", textAlign: "right", fontSize: "16px", fontWeight: 500, color: "var(--accent-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                                Total: {formatCurrency(createLines.reduce((s, l) => s + l.qty * l.rate, 0))}
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                <button onClick={() => setShowCreate(false)} style={btnSecondary}>Cancel</button>
                                <button onClick={handleCreate} disabled={!createProject} style={{ ...btnPrimary, opacity: !createProject ? 0.5 : 1 }}>Create Invoice</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Generate from Time Modal */}
            {showGenerate && (
                <div style={modalOverlay} onClick={() => setShowGenerate(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ ...modalBox, width: "440px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Zap size={18} style={{ color: "var(--accent-primary)" }} /><h2 style={{ fontSize: "18px", fontWeight: 400, fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Generate from Time</h2></div>
                            <button onClick={() => setShowGenerate(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div><label style={labelStyle}>Project</label><select value={genProject} onChange={e => setGenProject(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}><option value="">Select project...</option>{(projects as any[]).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div><label style={labelStyle}>From</label><input type="date" value={genFromDate} onChange={e => setGenFromDate(e.target.value)} style={inputStyle} /></div>
                                <div><label style={labelStyle}>To</label><input type="date" value={genToDate} onChange={e => setGenToDate(e.target.value)} style={inputStyle} /></div>
                            </div>
                            <div><label style={labelStyle}>Hourly Rate</label><input type="number" value={genRate} onChange={e => setGenRate(e.target.value)} style={inputStyle} /></div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                <button onClick={() => setShowGenerate(false)} style={btnSecondary}>Cancel</button>
                                <button onClick={handleGenerate} disabled={!genProject || !genFromDate || !genToDate} style={{ ...btnPrimary, opacity: !genProject ? 0.5 : 1 }}><Zap size={13} style={{ marginRight: "4px", verticalAlign: "text-bottom" }} /> Generate</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Batch Modal */}
            {showBatch && (
                <div style={modalOverlay} onClick={() => setShowBatch(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ ...modalBox, width: "480px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Layers size={18} style={{ color: "var(--accent-primary)" }} /><h2 style={{ fontSize: "18px", fontWeight: 400, fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Batch Invoicing</h2></div>
                            <button onClick={() => setShowBatch(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div><label style={{ ...labelStyle, marginBottom: "8px" }}>Select Projects</label>
                                <div style={{ maxHeight: "180px", overflow: "auto", display: "flex", flexDirection: "column", gap: "4px" }}>
                                    {(projects as any[]).map((p: any) => {
                                        const sel = batchProjects.includes(p.id);
                                        return <button key={p.id} onClick={() => setBatchProjects(sel ? batchProjects.filter(id => id !== p.id) : [...batchProjects, p.id])} style={{ padding: "8px 12px", borderRadius: "6px", border: sel ? "2px solid var(--accent-primary)" : "1px solid var(--border-primary)", background: sel ? "rgba(176,122,74,0.04)" : "var(--bg-card)", cursor: "pointer", textAlign: "left", fontSize: "12px", color: sel ? "var(--accent-primary)" : "var(--text-secondary)", fontWeight: sel ? 500 : 400, display: "flex", alignItems: "center", gap: "8px" }}>
                                            <div style={{ width: "16px", height: "16px", borderRadius: "4px", border: sel ? "2px solid var(--accent-primary)" : "1px solid var(--border-secondary)", display: "flex", alignItems: "center", justifyContent: "center", background: sel ? "var(--accent-primary)" : "transparent" }}>{sel && <CheckCircle2 size={10} style={{ color: "white" }} />}</div>{p.name}
                                        </button>;
                                    })}
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div><label style={labelStyle}>From</label><input type="date" value={batchFromDate} onChange={e => setBatchFromDate(e.target.value)} style={inputStyle} /></div>
                                <div><label style={labelStyle}>To</label><input type="date" value={batchToDate} onChange={e => setBatchToDate(e.target.value)} style={inputStyle} /></div>
                            </div>
                            <div><label style={labelStyle}>Hourly Rate</label><input type="number" value={batchRate} onChange={e => setBatchRate(e.target.value)} style={inputStyle} /></div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{batchProjects.length} project{batchProjects.length !== 1 ? "s" : ""} selected</span>
                                <div style={{ display: "flex", gap: "8px" }}>
                                    <button onClick={() => setShowBatch(false)} style={btnSecondary}>Cancel</button>
                                    <button onClick={handleBatch} disabled={batchProjects.length === 0 || !batchFromDate} style={{ ...btnPrimary, opacity: batchProjects.length === 0 ? 0.5 : 1 }}><Layers size={13} style={{ marginRight: "4px", verticalAlign: "text-bottom" }} /> Generate {batchProjects.length} Invoice{batchProjects.length !== 1 ? "s" : ""}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Template Modal */}
            {showTemplate && (
                <div style={modalOverlay} onClick={() => setShowTemplate(false)}>
                    <div onClick={e => e.stopPropagation()} style={{ ...modalBox, width: "480px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Settings size={18} style={{ color: "var(--accent-primary)" }} /><h2 style={{ fontSize: "18px", fontWeight: 400, fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Invoice Template</h2></div>
                            <button onClick={() => setShowTemplate(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div><label style={labelStyle}>Company Name</label><input value={tplCompanyName} onChange={e => setTplCompanyName(e.target.value)} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Address</label><textarea value={tplAddress} onChange={e => setTplAddress(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} /></div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div><label style={labelStyle}>Phone</label><input value={tplPhone} onChange={e => setTplPhone(e.target.value)} style={inputStyle} /></div>
                                <div><label style={labelStyle}>Email</label><input value={tplEmail} onChange={e => setTplEmail(e.target.value)} style={inputStyle} /></div>
                            </div>
                            <div><label style={labelStyle}>Header Text</label><input value={tplHeader} onChange={e => setTplHeader(e.target.value)} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Footer Text</label><input value={tplFooter} onChange={e => setTplFooter(e.target.value)} style={inputStyle} /></div>
                            <div><label style={labelStyle}>Accent Color</label>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <input type="color" value={tplAccent} onChange={e => setTplAccent(e.target.value)} style={{ width: "40px", height: "40px", border: "none", cursor: "pointer", borderRadius: "6px" }} />
                                    <input value={tplAccent} onChange={e => setTplAccent(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                                </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                <button onClick={() => setShowTemplate(false)} style={btnSecondary}>Cancel</button>
                                <button onClick={handleSaveTemplate} style={btnPrimary}>Save Template</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Preview */}
            {showPdf && <PdfPreviewModal invoiceId={showPdf} onClose={() => setShowPdf(null)} />}
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    );
}

function PdfPreviewModal({ invoiceId, onClose }: { invoiceId: string; onClose: () => void }) {
    const { data, isLoading } = trpc.invoice.generatePdf.useQuery({ id: invoiceId });
    const handleDownload = () => { if (!data?.html) return; const blob = new Blob([data.html], { type: "text/html" }); const url = URL.createObjectURL(blob); const win = window.open(url, "_blank"); if (win) setTimeout(() => win.print(), 500); };
    return (
        <div style={modalOverlay} onClick={onClose}>
            <div onClick={e => e.stopPropagation()} style={{ width: "660px", maxHeight: "85vh", overflow: "hidden", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)", display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 400, fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Invoice Preview</h3>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={handleDownload} style={{ ...btnPrimary, padding: "6px 14px", fontSize: "11px", display: "flex", alignItems: "center", gap: "6px" }}><Download size={13} /> Print / Save PDF</button>
                        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
                    </div>
                </div>
                <div style={{ flex: 1, overflow: "auto", background: "#f5f5f0" }}>
                    {isLoading ? <div style={{ padding: "60px", textAlign: "center" }}><Loader2 size={20} style={{ color: "var(--text-muted)", animation: "spin 1s linear infinite" }} /></div>
                        : data?.html ? <iframe srcDoc={data.html} style={{ width: "100%", height: "600px", border: "none", background: "white" }} />
                            : <p style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>Failed to generate PDF</p>}
                </div>
            </div>
        </div>
    );
}
