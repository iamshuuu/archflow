"use client";
import { useState } from "react";
import { trpc } from "@/app/providers";
import { Plus, Loader2, X, Users } from "lucide-react";
import { formatCurrency, cardStyle, tableWrapStyle, thStyle, tdStyle, modalOverlay, modalBox, labelStyle, inputStyle, btnPrimary, btnSecondary, badgeStyle } from "./InvoiceStyles";

const statusColors: Record<string, [string, string]> = {
    pending: ["var(--warning)", "rgba(209,163,67,0.08)"],
    approved: ["var(--info)", "rgba(107,141,214,0.08)"],
    paid: ["var(--success)", "rgba(90,122,70,0.08)"],
};

export default function ConsultantBillsTab() {
    const utils = trpc.useUtils();
    const { data: consultants = [], isLoading: loadingC } = trpc.consultant.list.useQuery();
    const { data: bills = [], isLoading: loadingB } = trpc.consultant.listBills.useQuery();
    const { data: projects = [] } = trpc.project.list.useQuery();
    const { data: summary } = trpc.consultant.billSummary.useQuery();
    const createBill = trpc.consultant.createBill.useMutation({ onSuccess: () => utils.consultant.invalidate() });
    const updateStatus = trpc.consultant.updateBillStatus.useMutation({ onSuccess: () => utils.consultant.invalidate() });

    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ consultantId: "", projectId: "", amount: "", date: new Date().toISOString().slice(0, 10), description: "", invoiceRef: "" });
    const up = (k: string, v: string) => setForm({ ...form, [k]: v });

    const handleSubmit = async () => {
        await createBill.mutateAsync({ ...form, amount: parseFloat(form.amount) || 0 });
        setShowAdd(false);
        setForm({ consultantId: "", projectId: "", amount: "", date: new Date().toISOString().slice(0, 10), description: "", invoiceRef: "" });
    };

    if (loadingC || loadingB) return <div style={{ padding: "60px", textAlign: "center" }}><Loader2 size={20} style={{ color: "var(--text-muted)", animation: "spin 1s linear infinite" }} /></div>;

    const billsList = bills as any[];

    return (
        <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
                {[
                    { label: "Total Billed", value: formatCurrency(summary?.total || 0), color: "var(--accent-primary)" },
                    { label: "Pending", value: formatCurrency(summary?.pending || 0), color: "var(--warning)" },
                    { label: "Approved", value: formatCurrency(summary?.approved || 0), color: "var(--info)" },
                    { label: "Paid", value: formatCurrency(summary?.paid || 0), color: "var(--success)" },
                ].map((m, i) => (
                    <div key={i} style={cardStyle}>
                        <p style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</p>
                        <p style={{ marginTop: "8px", fontSize: "20px", fontWeight: 400, color: m.color, fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{m.value}</p>
                    </div>
                ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                <button onClick={() => setShowAdd(true)} style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: "6px" }}><Plus size={13} /> New Bill</button>
            </div>

            <div style={tableWrapStyle}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-primary)", background: "var(--bg-warm)" }}>
                            {["Date", "Consultant", "Project", "Description", "Amount", "Ref #", "Status", ""].map(h => <th key={h} style={thStyle}>{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {billsList.length === 0 ? (
                            <tr><td colSpan={8} style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>No consultant bills yet.</td></tr>
                        ) : billsList.map((b: any) => {
                            const [c, bg] = statusColors[b.status] || statusColors.pending;
                            return (
                                <tr key={b.id} style={{ borderBottom: "1px solid var(--border-primary)" }} onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-warm)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                    <td style={{ ...tdStyle, color: "var(--text-muted)" }}>{b.date}</td>
                                    <td style={{ ...tdStyle, fontWeight: 600 }}>{b.consultant?.name || "—"}</td>
                                    <td style={tdStyle}>{b.project?.name || "—"}</td>
                                    <td style={{ ...tdStyle, color: "var(--text-secondary)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.description || "—"}</td>
                                    <td style={{ ...tdStyle, fontWeight: 500 }}>{formatCurrency(b.amount)}</td>
                                    <td style={{ ...tdStyle, color: "var(--text-muted)" }}>{b.invoiceRef || "—"}</td>
                                    <td style={tdStyle}><span style={badgeStyle(c, bg)}>{b.status}</span></td>
                                    <td style={tdStyle}>
                                        <div style={{ display: "flex", gap: "4px" }}>
                                            {b.status === "pending" && <button onClick={() => updateStatus.mutate({ id: b.id, status: "approved" })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "10px", color: "var(--info)", fontWeight: 600 }}>Approve</button>}
                                            {b.status === "approved" && <button onClick={() => updateStatus.mutate({ id: b.id, status: "paid" })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "10px", color: "var(--success)", fontWeight: 600 }}>Mark Paid</button>}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {showAdd && (
                <div style={modalOverlay} onClick={() => setShowAdd(false)}>
                    <div onClick={e => e.stopPropagation()} style={modalBox}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Users size={18} style={{ color: "var(--accent-primary)" }} />
                                <h2 style={{ fontSize: "18px", fontWeight: 400, fontFamily: "var(--font-dm-serif), Georgia, serif" }}>New Consultant Bill</h2>
                            </div>
                            <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div><label style={labelStyle}>Consultant</label>
                                    <select value={form.consultantId} onChange={e => up("consultantId", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                                        <option value="">Select...</option>
                                        {(consultants as any[]).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div><label style={labelStyle}>Project</label>
                                    <select value={form.projectId} onChange={e => up("projectId", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                                        <option value="">Select...</option>
                                        {(projects as any[]).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                                <div><label style={labelStyle}>Amount</label><input type="number" value={form.amount} onChange={e => up("amount", e.target.value)} style={inputStyle} /></div>
                                <div><label style={labelStyle}>Date</label><input type="date" value={form.date} onChange={e => up("date", e.target.value)} style={inputStyle} /></div>
                                <div><label style={labelStyle}>Invoice Ref #</label><input value={form.invoiceRef} onChange={e => up("invoiceRef", e.target.value)} style={inputStyle} /></div>
                            </div>
                            <div><label style={labelStyle}>Description</label><textarea value={form.description} onChange={e => up("description", e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} /></div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                <button onClick={() => setShowAdd(false)} style={btnSecondary}>Cancel</button>
                                <button onClick={handleSubmit} disabled={!form.consultantId || !form.projectId} style={{ ...btnPrimary, opacity: !form.consultantId ? 0.5 : 1 }}>Add Bill</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
