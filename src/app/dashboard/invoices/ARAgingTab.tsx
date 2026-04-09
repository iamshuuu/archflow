"use client";
import { trpc } from "@/app/providers";
import { Loader2 } from "lucide-react";
import { cardStyle, tableWrapStyle, thStyle, tdStyle } from "./InvoiceStyles";
import { useCurrencyFormatter } from "../useCurrencyFormatter";

export default function ARAgingTab() {
    const { data: arData, isLoading } = trpc.invoice.arAging.useQuery();
    const { formatCurrency } = useCurrencyFormatter();

    if (isLoading) return <div style={{ padding: "60px", textAlign: "center" }}><Loader2 size={20} style={{ color: "var(--text-muted)", animation: "spin 1s linear infinite" }} /></div>;
    if (!arData) return null;

    const bucketConfigs = [
        { key: "current", label: "Current", color: "var(--success)", items: arData.current },
        { key: "bucket30", label: "1-30 Days Overdue", color: "var(--info)", items: arData.bucket30 },
        { key: "bucket60", label: "31-60 Days Overdue", color: "var(--warning)", items: arData.bucket60 },
        { key: "bucket90", label: "61-90 Days Overdue", color: "var(--accent-gold)", items: arData.bucket90 },
        { key: "bucket90plus", label: "90+ Days Overdue", color: "var(--danger)", items: arData.bucket90plus },
    ] as const;

    const grandTotal = Object.values(arData.totals).reduce((s: number, v: any) => s + v, 0);

    return (
        <div>
            {/* Summary bar */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "14px", marginBottom: "24px" }}>
                {bucketConfigs.map(b => (
                    <div key={b.key} style={cardStyle}>
                        <p style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{b.label}</p>
                        <p style={{ marginTop: "8px", fontSize: "20px", fontWeight: 400, color: b.color, fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{formatCurrency((arData.totals as any)[b.key])}</p>
                        <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>{(b.items as any[]).length} invoice{(b.items as any[]).length !== 1 ? "s" : ""}</p>
                    </div>
                ))}
            </div>

            <div style={{ ...cardStyle, marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>Total Outstanding</span>
                <span style={{ fontSize: "20px", fontWeight: 400, color: "var(--accent-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{formatCurrency(grandTotal)}</span>
            </div>

            {/* Bucket tables */}
            {bucketConfigs.map(b => {
                const items = b.items as any[];
                if (items.length === 0) return null;
                return (
                    <div key={b.key} style={{ marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "13px", fontWeight: 600, color: b.color, marginBottom: "10px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: b.color }} /> {b.label}
                        </h3>
                        <div style={tableWrapStyle}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead>
                                    <tr style={{ borderBottom: "1px solid var(--border-primary)", background: "var(--bg-warm)" }}>
                                        {["Invoice", "Client", "Project", "Amount", "Balance", "Due Date", "Days"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((inv: any) => (
                                        <tr key={inv.id} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                                            <td style={{ ...tdStyle, fontWeight: 600, color: "var(--accent-primary)" }}>{inv.number}</td>
                                            <td style={tdStyle}>{inv.client?.name || "—"}</td>
                                            <td style={{ ...tdStyle, color: "var(--text-secondary)" }}>{inv.project?.name || "—"}</td>
                                            <td style={tdStyle}>{formatCurrency(inv.amount)}</td>
                                            <td style={{ ...tdStyle, fontWeight: 500, color: b.color }}>{formatCurrency(inv.balance)}</td>
                                            <td style={{ ...tdStyle, color: "var(--text-muted)" }}>{inv.dueDate}</td>
                                            <td style={tdStyle}>{inv.daysOverdue > 0 ? `${inv.daysOverdue}d overdue` : "Current"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
