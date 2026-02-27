"use client";
import { useState } from "react";
import { trpc } from "@/app/providers";
import { Plus, Loader2, CreditCard, X } from "lucide-react";
import { formatCurrency, cardStyle, tableWrapStyle, thStyle, tdStyle, modalOverlay, modalBox, labelStyle, inputStyle, selectStyle, btnPrimary, btnSecondary } from "./InvoiceStyles";

const methodLabels: Record<string, string> = { check: "Check", ach: "ACH Transfer", wire: "Wire Transfer", credit_card: "Credit Card", cash: "Cash", other: "Other" };

export default function PaymentsTab() {
    const utils = trpc.useUtils();
    const { data: payments = [], isLoading } = trpc.invoice.listPayments.useQuery();
    const { data: invoices = [] } = trpc.invoice.list.useQuery();
    const recordPayment = trpc.invoice.recordPayment.useMutation({ onSuccess: () => utils.invoice.invalidate() });
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ invoiceId: "", amount: "", date: new Date().toISOString().slice(0, 10), method: "check", reference: "", notes: "" });
    const up = (k: string, v: string) => setForm({ ...form, [k]: v });

    const handleSubmit = async () => {
        await recordPayment.mutateAsync({ ...form, amount: parseFloat(form.amount) || 0 });
        setShowAdd(false);
        setForm({ invoiceId: "", amount: "", date: new Date().toISOString().slice(0, 10), method: "check", reference: "", notes: "" });
    };

    if (isLoading) return <div style={{ padding: "60px", textAlign: "center" }}><Loader2 size={20} style={{ color: "var(--text-muted)", animation: "spin 1s linear infinite" }} /></div>;

    const pay = payments as any[];
    const totalReceived = pay.reduce((s: number, p: any) => s + p.amount, 0);
    const unpaid = (invoices as any[]).filter((i: any) => i.status !== "paid" && i.status !== "draft");

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div style={cardStyle}>
                    <p style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Payments Received</p>
                    <p style={{ marginTop: "8px", fontSize: "22px", fontWeight: 400, color: "var(--success)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{formatCurrency(totalReceived)}</p>
                </div>
                <button onClick={() => setShowAdd(true)} style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: "6px" }}><Plus size={13} /> Record Payment</button>
            </div>

            <div style={tableWrapStyle}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-primary)", background: "var(--bg-warm)" }}>
                            {["Date", "Invoice", "Client", "Amount", "Method", "Reference"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {pay.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>No payments recorded yet.</td></tr>
                        ) : pay.map((p: any) => (
                            <tr key={p.id} style={{ borderBottom: "1px solid var(--border-primary)" }} onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-warm)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                <td style={{ ...tdStyle, color: "var(--text-muted)" }}>{p.date}</td>
                                <td style={{ ...tdStyle, fontWeight: 600, color: "var(--accent-primary)" }}>{p.invoice?.number || "—"}</td>
                                <td style={tdStyle}>{p.invoice?.client?.name || "—"}</td>
                                <td style={{ ...tdStyle, fontWeight: 500, color: "var(--success)" }}>{formatCurrency(p.amount)}</td>
                                <td style={tdStyle}>{methodLabels[p.method] || p.method}</td>
                                <td style={{ ...tdStyle, color: "var(--text-muted)" }}>{p.reference || "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showAdd && (
                <div style={modalOverlay} onClick={() => setShowAdd(false)}>
                    <div onClick={e => e.stopPropagation()} style={modalBox}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <CreditCard size={18} style={{ color: "var(--accent-primary)" }} />
                                <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Record Payment</h2>
                            </div>
                            <button onClick={() => setShowAdd(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div>
                                <label style={labelStyle}>Invoice</label>
                                <select value={form.invoiceId} onChange={e => up("invoiceId", e.target.value)} style={selectStyle}>
                                    <option value="">Select invoice...</option>
                                    {unpaid.map((inv: any) => <option key={inv.id} value={inv.id}>{inv.number} — {inv.client?.name} ({formatCurrency(inv.amount)})</option>)}
                                </select>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div><label style={labelStyle}>Amount</label><input type="number" value={form.amount} onChange={e => up("amount", e.target.value)} style={inputStyle} placeholder="0.00" /></div>
                                <div><label style={labelStyle}>Date</label><input type="date" value={form.date} onChange={e => up("date", e.target.value)} style={inputStyle} /></div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div><label style={labelStyle}>Method</label>
                                    <select value={form.method} onChange={e => up("method", e.target.value)} style={selectStyle}>
                                        {Object.entries(methodLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                                <div><label style={labelStyle}>Reference</label><input value={form.reference} onChange={e => up("reference", e.target.value)} style={inputStyle} placeholder="Check #, Transaction ID..." /></div>
                            </div>
                            <div><label style={labelStyle}>Notes</label><textarea value={form.notes} onChange={e => up("notes", e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} /></div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                <button onClick={() => setShowAdd(false)} style={btnSecondary}>Cancel</button>
                                <button onClick={handleSubmit} disabled={!form.invoiceId || !form.amount} style={{ ...btnPrimary, opacity: !form.invoiceId ? 0.5 : 1 }}>Record Payment</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
