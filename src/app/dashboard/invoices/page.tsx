"use client";

import { useState } from "react";
import { trpc } from "@/app/providers";
import {
    Plus,
    Search,
    FileText,
    Send,
    Eye,
    DollarSign,
    Clock,
    CheckCircle2,
    AlertCircle,
    Download,
    MoreHorizontal,
    ArrowUpRight,
    X,
    Trash2,
    Calendar,
} from "lucide-react";

/* ─── Types ─── */

type InvoiceStatus = "draft" | "sent" | "viewed" | "paid" | "overdue";

interface LineItem {
    description: string;
    qty: number;
    rate: number;
}

interface Invoice {
    id: string;
    number: string;
    client: string;
    project: string;
    amount: number;
    date: string;
    dueDate: string;
    status: InvoiceStatus;
    lineItems: LineItem[];
}

/* ─── Data ─── */

const formatCurrency = (v: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

const statusConfig: Record<InvoiceStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    draft: { label: "Draft", color: "var(--text-muted)", bg: "var(--bg-secondary)", icon: <FileText size={10} /> },
    sent: { label: "Sent", color: "var(--info)", bg: "rgba(90,122,144,0.08)", icon: <Send size={10} /> },
    viewed: { label: "Viewed", color: "var(--accent-primary)", bg: "rgba(176,122,74,0.08)", icon: <Eye size={10} /> },
    paid: { label: "Paid", color: "var(--success)", bg: "rgba(90,122,70,0.08)", icon: <CheckCircle2 size={10} /> },
    overdue: { label: "Overdue", color: "var(--danger)", bg: "rgba(176,80,64,0.08)", icon: <AlertCircle size={10} /> },
};

/* ─── Shared Styles ─── */

const labelStyle: React.CSSProperties = { fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px", display: "block" };
const fieldStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-warm)", fontSize: "13px", color: "var(--text-primary)", fontFamily: "inherit", outline: "none", transition: "border-color 0.2s" };

/* ════════════════════════════════════════════════════
   Component
   ════════════════════════════════════════════════════ */

export default function InvoicesPage() {
    const { data: rawInvoices = [], isLoading } = trpc.invoice.list.useQuery();
    const { data: dbClients = [] } = trpc.project.clients.useQuery();
    const { data: dbProjects = [] } = trpc.project.list.useQuery();
    const utils = trpc.useUtils();
    const createMutation = trpc.invoice.create.useMutation({ onSuccess: () => utils.invoice.list.invalidate() });
    const updateStatusMutation = trpc.invoice.updateStatus.useMutation({ onSuccess: () => utils.invoice.list.invalidate() });

    // Adapt DB invoices to UI shape
    const invoiceList: Invoice[] = rawInvoices.map((inv: any) => ({
        id: inv.id,
        number: inv.number,
        client: inv.client?.name || "Unknown",
        project: inv.project?.name || "—",
        amount: inv.amount,
        date: inv.date || "",
        dueDate: inv.dueDate || "",
        status: (inv.status || "draft") as InvoiceStatus,
        lineItems: (inv.lineItems || []).map((li: any) => ({ description: li.description, qty: li.qty, rate: li.rate })),
    }));

    const clients = dbClients.map((c: any) => ({
        id: c.id, name: c.name,
        projects: dbProjects.filter((p: any) => p.clientId === c.id).map((p: any) => ({ id: p.id, name: p.name })),
    }));

    const [filter, setFilter] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [previewId, setPreviewId] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);

    // Create invoice form state
    const [newClientId, setNewClientId] = useState("");
    const [newProjectId, setNewProjectId] = useState("");
    const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
    const [newDueDate, setNewDueDate] = useState("");
    const [newLines, setNewLines] = useState<LineItem[]>([{ description: "", qty: 1, rate: 0 }]);

    const filtered = invoiceList.filter((inv) => {
        if (filter !== "all" && inv.status !== filter) return false;
        if (search && !inv.number.toLowerCase().includes(search.toLowerCase()) && !inv.client.toLowerCase().includes(search.toLowerCase()) && !inv.project.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const totalOutstanding = invoiceList.filter((i) => i.status !== "paid").reduce((s, i) => s + i.amount, 0);
    const totalPaid = invoiceList.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);
    const totalOverdue = invoiceList.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0);

    const previewInvoice = previewId ? invoiceList.find((i) => i.id === previewId) : null;

    const selectedClientObj = clients.find((c: any) => c.id === newClientId);
    const newTotal = newLines.reduce((s, li) => s + li.qty * li.rate, 0);

    if (isLoading) return <div style={{ padding: "80px 0", textAlign: "center" }}><p style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 300 }}>Loading invoices...</p></div>;

    /* ─── Actions ─── */

    const resetCreateForm = () => {
        setNewClientId(""); setNewProjectId(""); setNewDate(new Date().toISOString().split("T")[0]); setNewDueDate("");
        setNewLines([{ description: "", qty: 1, rate: 0 }]);
    };

    const handleCreateInvoice = () => {
        if (!newClientId || !newProjectId || newLines.every((l) => !l.description)) return;
        createMutation.mutate({
            clientId: newClientId,
            projectId: newProjectId,
            date: newDate,
            dueDate: newDueDate || newDate,
            lineItems: newLines.filter((l) => l.description),
        });
        setShowCreate(false);
        resetCreateForm();
    };

    const updateLine = (idx: number, field: keyof LineItem, value: string | number) => {
        setNewLines((prev) => {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], [field]: value };
            return copy;
        });
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Invoices</h1>
                    <p style={{ marginTop: "4px", fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 300 }}>
                        {invoiceList.length} invoices · {formatCurrency(totalOutstanding)} outstanding
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "13px", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(176,122,74,0.2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                >
                    <Plus size={16} /> New Invoice
                </button>
            </div>

            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "24px" }}>
                {[
                    { label: "Total Paid", value: formatCurrency(totalPaid), color: "var(--success)", icon: CheckCircle2 },
                    { label: "Outstanding", value: formatCurrency(totalOutstanding), color: "var(--accent-primary)", icon: Clock },
                    { label: "Overdue", value: formatCurrency(totalOverdue), color: "var(--danger)", icon: AlertCircle },
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ display: "flex", gap: "2px", background: "var(--bg-secondary)", borderRadius: "8px", padding: "3px" }}>
                    {["all", "draft", "sent", "viewed", "paid", "overdue"].map((f) => (
                        <button key={f} onClick={() => setFilter(f)}
                            style={{ padding: "7px 14px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: filter === f ? 500 : 400, background: filter === f ? "var(--bg-card)" : "transparent", color: filter === f ? "var(--text-primary)" : "var(--text-muted)", boxShadow: filter === f ? "var(--shadow-sm)" : "none", transition: "all 0.15s", textTransform: "capitalize" }}>
                            {f}
                        </button>
                    ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", borderRadius: "6px", padding: "8px 12px", maxWidth: "260px" }}>
                    <Search size={14} style={{ color: "var(--text-muted)" }} />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoices..." style={{ flex: 1, border: "none", background: "transparent", fontSize: "13px", color: "var(--text-primary)", outline: "none", fontFamily: "inherit" }} />
                </div>
            </div>

            {/* Invoice table */}
            <div style={{ borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                            {["Invoice", "Client", "Project", "Amount", "Date", "Due", "Status", ""].map((h) => (
                                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map((inv) => {
                            const sc = statusConfig[inv.status];
                            return (
                                <tr key={inv.id} style={{ borderBottom: "1px solid var(--border-primary)", cursor: "pointer" }}
                                    onClick={() => setPreviewId(inv.id)}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-warm)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                >
                                    <td style={{ padding: "14px" }}>
                                        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--accent-primary)" }}>{inv.number}</span>
                                    </td>
                                    <td style={{ padding: "14px", fontSize: "12px", color: "var(--text-secondary)" }}>{inv.client}</td>
                                    <td style={{ padding: "14px", fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 300 }}>{inv.project}</td>
                                    <td style={{ padding: "14px", fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{formatCurrency(inv.amount)}</td>
                                    <td style={{ padding: "14px", fontSize: "12px", color: "var(--text-muted)" }}>{inv.date}</td>
                                    <td style={{ padding: "14px", fontSize: "12px", color: inv.status === "overdue" ? "var(--danger)" : "var(--text-muted)", fontWeight: inv.status === "overdue" ? 500 : 400 }}>{inv.dueDate}</td>
                                    <td style={{ padding: "14px" }}>
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "9px", fontWeight: 600, padding: "3px 8px", borderRadius: "3px", textTransform: "uppercase", letterSpacing: "0.04em", color: sc.color, background: sc.bg }}>
                                            {sc.icon} {sc.label}
                                        </span>
                                    </td>
                                    <td style={{ padding: "14px" }}>
                                        <button onClick={(e) => e.stopPropagation()} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><MoreHorizontal size={14} /></button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* ═══ Invoice preview slide-over ═══ */}
            {previewInvoice && (
                <div style={{ position: "fixed", inset: 0, zIndex: 100 }} onClick={() => setPreviewId(null)}>
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)", backdropFilter: "blur(4px)" }} />
                    <div onClick={(e) => e.stopPropagation()}
                        style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "520px", background: "var(--bg-card)", borderLeft: "1px solid var(--border-secondary)", boxShadow: "-8px 0 30px rgba(0,0,0,0.08)", overflow: "auto" }}
                    >
                        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{previewInvoice.number}</h2>
                                <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 300, marginTop: "2px" }}>{previewInvoice.project}</p>
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button style={{ padding: "6px 12px", borderRadius: "4px", border: "1px solid var(--border-primary)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--text-muted)" }}>
                                    <Download size={12} /> PDF
                                </button>
                                <button onClick={() => setPreviewId(null)} style={{ width: "28px", height: "28px", borderRadius: "4px", border: "1px solid var(--border-primary)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                        <div style={{ padding: "28px 24px" }}>
                            <div style={{ padding: "28px", borderRadius: "10px", border: "1px solid var(--border-primary)", background: "var(--bg-primary)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <div style={{ width: "28px", height: "28px", borderRadius: "4px", border: "1.5px solid var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2"><path d="M3 21L12 3L21 21" /><path d="M7.5 14h9" /></svg>
                                        </div>
                                        <span style={{ fontSize: "16px", fontFamily: "var(--font-dm-serif), Georgia, serif", color: "var(--text-primary)" }}>ArchFlow</span>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <p style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>INVOICE</p>
                                        <p style={{ fontSize: "11px", color: "var(--accent-primary)", fontWeight: 500, marginTop: "2px" }}>{previewInvoice.number}</p>
                                    </div>
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
                                    <div>
                                        <p style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>Bill To</p>
                                        <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", marginTop: "4px" }}>{previewInvoice.client}</p>
                                        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{previewInvoice.project}</p>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Date: {previewInvoice.date}</p>
                                        <p style={{ fontSize: "11px", color: previewInvoice.status === "overdue" ? "var(--danger)" : "var(--text-muted)", marginTop: "2px", fontWeight: previewInvoice.status === "overdue" ? 500 : 400 }}>Due: {previewInvoice.dueDate}</p>
                                    </div>
                                </div>
                                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "2px solid var(--border-secondary)" }}>
                                            {["Description", "Qty", "Rate", "Amount"].map((h) => (
                                                <th key={h} style={{ padding: "6px 0", fontSize: "9px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: h === "Description" ? "left" : "right" }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewInvoice.lineItems.map((li, i) => (
                                            <tr key={i} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                                                <td style={{ padding: "10px 0", fontSize: "12px", color: "var(--text-primary)" }}>{li.description}</td>
                                                <td style={{ padding: "10px 0", fontSize: "12px", color: "var(--text-secondary)", textAlign: "right" }}>{li.qty}</td>
                                                <td style={{ padding: "10px 0", fontSize: "12px", color: "var(--text-secondary)", textAlign: "right" }}>{formatCurrency(li.rate)}</td>
                                                <td style={{ padding: "10px 0", fontSize: "12px", fontWeight: 500, color: "var(--text-primary)", textAlign: "right" }}>{formatCurrency(li.qty * li.rate)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                    <div style={{ width: "200px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: "2px solid var(--border-secondary)" }}>
                                            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Total</span>
                                            <span style={{ fontSize: "16px", fontWeight: 400, color: "var(--accent-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{formatCurrency(previewInvoice.amount)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ marginTop: "20px", display: "flex", gap: "8px" }}>
                                {previewInvoice.status === "draft" && (
                                    <button style={{ flex: 1, padding: "12px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "13px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                        <Send size={14} /> Send Invoice
                                    </button>
                                )}
                                <button style={{ flex: previewInvoice.status !== "draft" ? 1 : 0, padding: "12px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "transparent", fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                                    <Download size={14} /> Download PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Create Invoice Modal ═══ */}
            {showCreate && (
                <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => { setShowCreate(false); resetCreateForm(); }}>
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(6px)" }} />
                    <div onClick={(e) => e.stopPropagation()}
                        style={{ position: "relative", width: "620px", maxHeight: "85vh", overflow: "auto", background: "var(--bg-card)", borderRadius: "14px", border: "1px solid var(--border-secondary)", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
                    >
                        {/* Modal header */}
                        <div style={{ padding: "22px 28px", borderBottom: "1px solid var(--border-primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>New Invoice</h2>
                                <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 300, marginTop: "2px" }}>Create a new draft invoice</p>
                            </div>
                            <button onClick={() => { setShowCreate(false); resetCreateForm(); }}
                                style={{ width: "30px", height: "30px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                                <X size={14} />
                            </button>
                        </div>

                        {/* Modal body */}
                        <div style={{ padding: "24px 28px" }}>
                            {/* Client & Project */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "18px" }}>
                                <div>
                                    <label style={labelStyle}>Client</label>
                                    <select value={newClientId} onChange={(e) => { setNewClientId(e.target.value); const cl = clients.find((c: any) => c.id === e.target.value); if (cl && cl.projects.length > 0) setNewProjectId(cl.projects[0].id); else setNewProjectId(""); }}
                                        style={{ ...fieldStyle, cursor: "pointer" }}>
                                        <option value="">Select client…</option>
                                        {clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Project</label>
                                    <select value={newProjectId} onChange={(e) => setNewProjectId(e.target.value)} disabled={!newClientId}
                                        style={{ ...fieldStyle, cursor: newClientId ? "pointer" : "not-allowed", opacity: newClientId ? 1 : 0.5 }}>
                                        <option value="">Select project…</option>
                                        {(selectedClientObj?.projects || []).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Dates */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "22px" }}>
                                <div>
                                    <label style={labelStyle}>Invoice Date</label>
                                    <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} style={fieldStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Due Date</label>
                                    <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} style={fieldStyle} />
                                </div>
                            </div>

                            {/* Line items */}
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ ...labelStyle, marginBottom: "10px" }}>Line Items</label>
                                <div style={{ borderRadius: "8px", border: "1px solid var(--border-primary)", overflow: "hidden" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <thead>
                                            <tr style={{ background: "var(--bg-warm)", borderBottom: "1px solid var(--border-primary)" }}>
                                                {["Description", "Qty", "Rate", "Amount", ""].map((h) => (
                                                    <th key={h} style={{ padding: "8px 10px", fontSize: "9px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: h === "Description" ? "left" : "right" }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {newLines.map((li, idx) => (
                                                <tr key={idx} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                                                    <td style={{ padding: "6px 8px" }}>
                                                        <input type="text" value={li.description} onChange={(e) => updateLine(idx, "description", e.target.value)} placeholder="Service description…"
                                                            style={{ width: "100%", padding: "8px", border: "1px solid var(--border-primary)", borderRadius: "4px", fontSize: "12px", color: "var(--text-primary)", background: "var(--bg-card)", fontFamily: "inherit", outline: "none" }}
                                                            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; }}
                                                            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-primary)"; }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: "6px 4px", width: "70px" }}>
                                                        <input type="number" min="1" value={li.qty} onChange={(e) => updateLine(idx, "qty", parseInt(e.target.value) || 0)}
                                                            style={{ width: "56px", padding: "8px 4px", border: "1px solid var(--border-primary)", borderRadius: "4px", fontSize: "12px", color: "var(--text-primary)", background: "var(--bg-card)", textAlign: "center", fontFamily: "inherit", outline: "none" }} />
                                                    </td>
                                                    <td style={{ padding: "6px 4px", width: "100px" }}>
                                                        <input type="number" min="0" value={li.rate || ""} onChange={(e) => updateLine(idx, "rate", parseFloat(e.target.value) || 0)} placeholder="0"
                                                            style={{ width: "80px", padding: "8px 4px", border: "1px solid var(--border-primary)", borderRadius: "4px", fontSize: "12px", color: "var(--text-primary)", background: "var(--bg-card)", textAlign: "right", fontFamily: "inherit", outline: "none" }} />
                                                    </td>
                                                    <td style={{ padding: "6px 10px", textAlign: "right", fontSize: "12px", fontWeight: 500, color: "var(--text-primary)", width: "90px" }}>
                                                        {formatCurrency(li.qty * li.rate)}
                                                    </td>
                                                    <td style={{ padding: "6px 6px", width: "30px" }}>
                                                        {newLines.length > 1 && (
                                                            <button onClick={() => setNewLines((prev) => prev.filter((_, i) => i !== idx))}
                                                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
                                                                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--danger)"; }}
                                                                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button onClick={() => setNewLines((prev) => [...prev, { description: "", qty: 1, rate: 0 }])}
                                        style={{ width: "100%", padding: "10px", border: "none", borderTop: "1px dashed var(--border-primary)", background: "transparent", cursor: "pointer", fontSize: "12px", color: "var(--accent-primary)", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-warm)"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                    >
                                        <Plus size={13} /> Add line item
                                    </button>
                                </div>
                            </div>

                            {/* Total */}
                            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "24px" }}>
                                <div style={{ textAlign: "right" }}>
                                    <p style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Invoice Total</p>
                                    <p style={{ fontSize: "24px", fontWeight: 400, color: "var(--accent-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginTop: "4px" }}>{formatCurrency(newTotal)}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                                <button onClick={() => { setShowCreate(false); resetCreateForm(); }}
                                    style={{ padding: "11px 20px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "transparent", fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer" }}>
                                    Cancel
                                </button>
                                <button onClick={handleCreateInvoice}
                                    disabled={!newClientId || !newProjectId || newLines.every((l) => !l.description)}
                                    style={{ padding: "11px 24px", borderRadius: "6px", border: "none", background: (!newClientId || !newProjectId) ? "var(--bg-tertiary)" : "var(--accent-primary)", color: (!newClientId || !newProjectId) ? "var(--text-muted)" : "white", fontSize: "13px", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", cursor: (!newClientId || !newProjectId) ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
                                    Create Invoice
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
