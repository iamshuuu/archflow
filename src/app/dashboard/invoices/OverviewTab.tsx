"use client";
import { trpc } from "@/app/providers";
import { DollarSign, CheckCircle2, Clock, AlertCircle, TrendingUp, Loader2 } from "lucide-react";
import { formatCurrency, cardStyle } from "./InvoiceStyles";

export default function OverviewTab() {
    const { data: invoices = [], isLoading } = trpc.invoice.list.useQuery();
    const { data: arData } = trpc.invoice.arAging.useQuery();
    const { data: payments = [] } = trpc.invoice.listPayments.useQuery();

    if (isLoading) return <div style={{ padding: "60px", textAlign: "center" }}><Loader2 size={20} style={{ color: "var(--text-muted)", animation: "spin 1s linear infinite" }} /></div>;

    const inv = invoices as any[];
    const totalInvoiced = inv.reduce((s: number, i: any) => s + i.amount, 0);
    const paidAmount = inv.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + i.amount, 0);
    const pendingAmount = inv.filter((i: any) => ["draft", "sent", "viewed"].includes(i.status)).reduce((s: number, i: any) => s + i.amount, 0);
    const overdueAmount = inv.filter((i: any) => i.status === "overdue").reduce((s: number, i: any) => s + i.amount, 0);
    const totalPayments = (payments as any[]).reduce((s: number, p: any) => s + p.amount, 0);
    const arTotal = arData?.totals ? Object.values(arData.totals).reduce((s: number, v: any) => s + v, 0) : 0;

    const metrics = [
        { label: "Total Invoiced", value: formatCurrency(totalInvoiced), icon: DollarSign, color: "var(--accent-primary)" },
        { label: "Paid", value: formatCurrency(paidAmount), icon: CheckCircle2, color: "var(--success)" },
        { label: "Pending", value: formatCurrency(pendingAmount), icon: Clock, color: "var(--warning)" },
        { label: "Overdue", value: formatCurrency(overdueAmount), icon: AlertCircle, color: "var(--danger)" },
        { label: "Payments Received", value: formatCurrency(totalPayments), icon: TrendingUp, color: "var(--info)" },
        { label: "Outstanding AR", value: formatCurrency(arTotal), icon: DollarSign, color: "var(--accent-gold)" },
    ];

    return (
        <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "24px" }}>
                {metrics.map((m, i) => (
                    <div key={i} style={cardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <p style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{m.label}</p>
                            <m.icon size={14} style={{ color: m.color }} />
                        </div>
                        <p style={{ marginTop: "8px", fontSize: "22px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{m.value}</p>
                    </div>
                ))}
            </div>
            {/* AR Aging Summary */}
            {arData?.totals && (
                <div style={cardStyle}>
                    <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "16px" }}>Accounts Receivable Aging</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
                        {([["Current", arData.totals.current, "var(--success)"], ["1-30 Days", arData.totals.bucket30, "var(--info)"], ["31-60 Days", arData.totals.bucket60, "var(--warning)"], ["61-90 Days", arData.totals.bucket90, "var(--accent-gold)"], ["90+ Days", arData.totals.bucket90plus, "var(--danger)"]] as [string, number, string][]).map(([label, val, color]) => (
                            <div key={label} style={{ padding: "12px", borderRadius: "8px", background: "var(--bg-warm)", textAlign: "center" }}>
                                <p style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px" }}>{label}</p>
                                <p style={{ fontSize: "18px", fontWeight: 500, color, fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{formatCurrency(val)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {/* Recent invoices */}
            <div style={{ ...cardStyle, marginTop: "16px" }}>
                <h3 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>Recent Invoices</h3>
                {inv.slice(0, 5).map((invoice: any) => (
                    <div key={invoice.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border-primary)", fontSize: "12px" }}>
                        <span style={{ fontWeight: 600, color: "var(--accent-primary)" }}>{invoice.number}</span>
                        <span style={{ color: "var(--text-secondary)" }}>{invoice.client?.name}</span>
                        <span style={{ fontWeight: 500 }}>{formatCurrency(invoice.amount)}</span>
                        <span style={{ fontSize: "9px", fontWeight: 600, padding: "2px 8px", borderRadius: "3px", textTransform: "uppercase", color: invoice.status === "paid" ? "var(--success)" : invoice.status === "overdue" ? "var(--danger)" : "var(--text-muted)", background: invoice.status === "paid" ? "rgba(90,122,70,0.08)" : invoice.status === "overdue" ? "rgba(176,80,64,0.08)" : "var(--bg-secondary)" }}>{invoice.status}</span>
                    </div>
                ))}
                {inv.length === 0 && <p style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>No invoices yet.</p>}
            </div>
        </div>
    );
}
