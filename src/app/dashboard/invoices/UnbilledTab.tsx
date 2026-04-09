"use client";
import { trpc } from "@/app/providers";
import { Clock, Loader2, DollarSign } from "lucide-react";
import { cardStyle, tableWrapStyle, thStyle, tdStyle } from "./InvoiceStyles";
import { useCurrencyFormatter } from "../useCurrencyFormatter";

export default function UnbilledTab() {
    const { data: unbilled = [], isLoading } = trpc.invoice.unbilledWork.useQuery();
    const { formatCurrency } = useCurrencyFormatter();

    if (isLoading) return <div style={{ padding: "60px", textAlign: "center" }}><Loader2 size={20} style={{ color: "var(--text-muted)", animation: "spin 1s linear infinite" }} /></div>;

    const items = unbilled as any[];
    const totalHours = items.reduce((s, p) => s + p.totalHours, 0);
    const totalValue = items.reduce((s, p) => s + p.totalValue, 0);

    return (
        <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "24px" }}>
                <div style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Projects with Unbilled Work</p>
                    </div>
                    <p style={{ marginTop: "8px", fontSize: "22px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{items.length}</p>
                </div>
                <div style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Unbilled Hours</p>
                        <Clock size={14} style={{ color: "var(--warning)" }} />
                    </div>
                    <p style={{ marginTop: "8px", fontSize: "22px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{totalHours.toFixed(1)}h</p>
                </div>
                <div style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <p style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Unbilled Value</p>
                        <DollarSign size={14} style={{ color: "var(--accent-primary)" }} />
                    </div>
                    <p style={{ marginTop: "8px", fontSize: "22px", fontWeight: 400, color: "var(--accent-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{formatCurrency(totalValue)}</p>
                </div>
            </div>

            <div style={tableWrapStyle}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-primary)", background: "var(--bg-warm)" }}>
                            {["Project", "Hours", "Avg Rate", "Unbilled Value"].map(h => <th key={h} style={thStyle}>{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>No unbilled work found. All time has been invoiced!</td></tr>
                        ) : items.map((p: any) => (
                            <tr key={p.projectId} style={{ borderBottom: "1px solid var(--border-primary)" }} onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-warm)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                <td style={{ ...tdStyle, fontWeight: 600, color: "var(--accent-primary)" }}>{p.projectName}</td>
                                <td style={tdStyle}>{p.totalHours.toFixed(1)}h</td>
                                <td style={tdStyle}>{formatCurrency(p.totalHours > 0 ? p.totalValue / p.totalHours : 0)}/hr</td>
                                <td style={{ ...tdStyle, fontWeight: 500, color: "var(--accent-primary)" }}>{formatCurrency(p.totalValue)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
