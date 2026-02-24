"use client";

import { useState } from "react";
import { trpc } from "@/app/providers";
import {
    Plus,
    Search,
    Filter,
    DollarSign,
    Car,
    Utensils,
    Briefcase,
    Monitor,
    Package,
    MoreHorizontal,
    ChevronDown,
    X,
    Check,
    Clock,
    AlertTriangle,
    Loader2,
    Receipt,
    MapPin,
} from "lucide-react";

/* ─── Constants ─── */

const CATEGORIES = [
    { value: "travel", label: "Travel", icon: Briefcase, color: "#6B8DD6" },
    { value: "meals", label: "Meals", icon: Utensils, color: "#8BC6A0" },
    { value: "materials", label: "Materials", icon: Package, color: "#B07A4A" },
    { value: "software", label: "Software", icon: Monitor, color: "#9B6BA6" },
    { value: "mileage", label: "Mileage", icon: Car, color: "#5AA0B0" },
    { value: "other", label: "Other", icon: MoreHorizontal, color: "#7A8B6B" },
];

const STATUS_STYLES: Record<string, { color: string; bg: string; label: string }> = {
    pending: { color: "var(--warning)", bg: "rgba(176,138,48,0.08)", label: "Pending" },
    approved: { color: "var(--success)", bg: "rgba(90,122,70,0.08)", label: "Approved" },
    rejected: { color: "var(--danger)", bg: "rgba(176,80,64,0.08)", label: "Rejected" },
    reimbursed: { color: "var(--info)", bg: "rgba(107,141,214,0.08)", label: "Reimbursed" },
};

const IRS_RATE = 0.67;

const formatCurrency = (v: number) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ExpensesPage() {
    const utils = trpc.useUtils();
    const { data: expenses = [], isLoading } = trpc.expense.list.useQuery();
    const { data: summary } = trpc.expense.summary.useQuery();
    const { data: projects = [] } = trpc.project.list.useQuery();
    const createExpense = trpc.expense.create.useMutation({ onSuccess: () => utils.expense.invalidate() });
    const updateExpense = trpc.expense.update.useMutation({ onSuccess: () => utils.expense.invalidate() });
    const deleteExpense = trpc.expense.delete.useMutation({ onSuccess: () => utils.expense.invalidate() });

    const [showModal, setShowModal] = useState(false);
    const [filterCategory, setFilterCategory] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [showMileageCalc, setShowMileageCalc] = useState(false);

    // Mileage calculator state
    const [mileageDistance, setMileageDistance] = useState("");
    const [mileageDate, setMileageDate] = useState(new Date().toISOString().slice(0, 10));
    const [mileageProject, setMileageProject] = useState("");
    const [mileageDescription, setMileageDescription] = useState("");

    // Create form state
    const [formCategory, setFormCategory] = useState("travel");
    const [formDescription, setFormDescription] = useState("");
    const [formAmount, setFormAmount] = useState("");
    const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
    const [formProject, setFormProject] = useState("");
    const [formBillable, setFormBillable] = useState(true);
    const [formNotes, setFormNotes] = useState("");

    // Filter expenses
    const filtered = (expenses as any[]).filter((e: any) => {
        if (filterCategory && e.category !== filterCategory) return false;
        if (filterStatus && e.status !== filterStatus) return false;
        if (searchQuery && !e.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const handleCreate = async () => {
        await createExpense.mutateAsync({
            category: formCategory,
            description: formDescription,
            amount: parseFloat(formAmount) || 0,
            date: formDate,
            projectId: formProject || undefined,
            billable: formBillable,
            notes: formNotes,
        });
        setShowModal(false);
        resetForm();
    };

    const handleMileageSubmit = async () => {
        const miles = parseFloat(mileageDistance) || 0;
        await createExpense.mutateAsync({
            category: "mileage",
            description: mileageDescription || "Mileage reimbursement",
            amount: miles * IRS_RATE,
            date: mileageDate,
            projectId: mileageProject || undefined,
            billable: true,
            mileage: miles,
            mileageRate: IRS_RATE,
        });
        setShowMileageCalc(false);
        setMileageDistance("");
        setMileageDescription("");
    };

    const resetForm = () => {
        setFormCategory("travel");
        setFormDescription("");
        setFormAmount("");
        setFormDate(new Date().toISOString().slice(0, 10));
        setFormProject("");
        setFormBillable(true);
        setFormNotes("");
    };

    if (isLoading) return (
        <div style={{ padding: "80px 0", textAlign: "center" }}>
            <Loader2 size={20} style={{ color: "var(--text-muted)", animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    );

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                        Expenses
                    </h1>
                    <p style={{ marginTop: "4px", fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 300 }}>
                        Track project expenses, mileage, and reimbursements
                    </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        onClick={() => setShowMileageCalc(true)}
                        style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)" }}
                    >
                        <Car size={13} /> Mileage Calculator
                    </button>
                    <button
                        onClick={() => setShowModal(true)}
                        style={{ padding: "8px 14px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "white", fontWeight: 500 }}
                    >
                        <Plus size={13} /> Add Expense
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
                {[
                    { label: "Total Expenses", value: formatCurrency(summary?.total || 0), icon: DollarSign, color: "var(--accent-primary)" },
                    { label: "Pending", value: formatCurrency(summary?.pending || 0), icon: Clock, color: "var(--warning)" },
                    { label: "Approved", value: formatCurrency(summary?.approved || 0), icon: Check, color: "var(--success)" },
                    { label: "Total Mileage", value: `${(summary?.mileage || 0).toLocaleString()} mi`, icon: Car, color: "var(--info)" },
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

            {/* Filters bar */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px", alignItems: "center" }}>
                <div style={{ flex: 1, position: "relative" }}>
                    <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                    <input
                        placeholder="Search expenses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px 8px 34px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", outline: "none" }}
                    />
                </div>
                <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", cursor: "pointer" }}
                >
                    <option value="">All Categories</option>
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", cursor: "pointer" }}
                >
                    <option value="">All Statuses</option>
                    {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
            </div>

            {/* Expense list */}
            <div style={{ borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-primary)", background: "var(--bg-warm)" }}>
                            {["Date", "Category", "Description", "Project", "Amount", "Status", ""].map((h) => (
                                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr><td colSpan={7} style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)", fontWeight: 300 }}>No expenses found. Click "Add Expense" to get started.</td></tr>
                        ) : filtered.map((exp: any) => {
                            const cat = CATEGORIES.find(c => c.value === exp.category);
                            const CatIcon = cat?.icon || MoreHorizontal;
                            const ss = STATUS_STYLES[exp.status] || STATUS_STYLES.pending;
                            return (
                                <tr key={exp.id} style={{ borderBottom: "1px solid var(--border-primary)", transition: "background 0.1s" }} onMouseEnter={e => e.currentTarget.style.background = "var(--bg-warm)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                    <td style={{ padding: "12px 14px", fontSize: "12px", color: "var(--text-secondary)" }}>{exp.date}</td>
                                    <td style={{ padding: "12px 14px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <CatIcon size={13} style={{ color: cat?.color || "var(--text-muted)" }} />
                                            <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{cat?.label || exp.category}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: "12px 14px" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>{exp.description}</span>
                                        {exp.category === "mileage" && <span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: "6px" }}>{exp.mileage} mi</span>}
                                    </td>
                                    <td style={{ padding: "12px 14px", fontSize: "12px", color: "var(--text-muted)" }}>{exp.project?.name || "—"}</td>
                                    <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{formatCurrency(exp.amount)}</td>
                                    <td style={{ padding: "12px 14px" }}>
                                        <span style={{ fontSize: "9px", fontWeight: 600, padding: "3px 8px", borderRadius: "3px", textTransform: "uppercase", letterSpacing: "0.04em", color: ss.color, background: ss.bg }}>{ss.label}</span>
                                    </td>
                                    <td style={{ padding: "12px 14px" }}>
                                        <button
                                            onClick={() => { if (confirm("Delete this expense?")) deleteExpense.mutate({ id: exp.id }); }}
                                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: "11px", padding: "4px 8px", borderRadius: "4px" }}
                                            onMouseEnter={e => e.currentTarget.style.color = "var(--danger)"}
                                            onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
                                        >✕</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Category breakdown */}
            {summary && Object.keys(summary.byCategory).length > 0 && (
                <div style={{ marginTop: "24px", padding: "20px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                    <h3 style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "16px" }}>By Category</h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                        {CATEGORIES.filter(c => (summary.byCategory as any)[c.value] > 0).map((cat) => {
                            const amt = (summary.byCategory as any)[cat.value] || 0;
                            const pct = summary.total > 0 ? Math.round((amt / summary.total) * 100) : 0;
                            return (
                                <div key={cat.value} style={{ padding: "12px", borderRadius: "8px", background: "var(--bg-warm)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                            <cat.icon size={13} style={{ color: cat.color }} />
                                            <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}>{cat.label}</span>
                                        </div>
                                        <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>{formatCurrency(amt)}</span>
                                    </div>
                                    <div style={{ height: "3px", borderRadius: "2px", background: "var(--bg-tertiary)" }}>
                                        <div style={{ height: "100%", borderRadius: "2px", width: `${pct}%`, background: cat.color, transition: "width 0.3s" }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Create Expense Modal */}
            {showModal && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowModal(false)}>
                    <div onClick={(e) => e.stopPropagation()} style={{ width: "500px", maxHeight: "80vh", overflow: "auto", padding: "28px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Add Expense</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {/* Category */}
                            <div>
                                <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px", display: "block" }}>Category</label>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                                    {CATEGORIES.map((cat) => (
                                        <button
                                            key={cat.value}
                                            onClick={() => setFormCategory(cat.value)}
                                            style={{
                                                padding: "8px", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontWeight: 500, transition: "all 0.15s",
                                                border: formCategory === cat.value ? `2px solid ${cat.color}` : "1px solid var(--border-primary)",
                                                background: formCategory === cat.value ? `${cat.color}10` : "var(--bg-card)",
                                                color: formCategory === cat.value ? cat.color : "var(--text-secondary)",
                                            }}
                                        >
                                            <cat.icon size={13} /> {cat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px", display: "block" }}>Description</label>
                                <input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="What was this expense for?" style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", outline: "none" }} />
                            </div>

                            {/* Amount + Date row */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px", display: "block" }}>Amount</label>
                                    <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0.00" style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", outline: "none" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px", display: "block" }}>Date</label>
                                    <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", outline: "none" }} />
                                </div>
                            </div>

                            {/* Project */}
                            <div>
                                <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px", display: "block" }}>Project (optional)</label>
                                <select value={formProject} onChange={(e) => setFormProject(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", cursor: "pointer" }}>
                                    <option value="">No project</option>
                                    {(projects as any[]).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            {/* Billable toggle */}
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <button
                                    onClick={() => setFormBillable(!formBillable)}
                                    style={{ width: "36px", height: "20px", borderRadius: "10px", border: "none", cursor: "pointer", background: formBillable ? "var(--accent-primary)" : "var(--bg-tertiary)", transition: "background 0.2s", position: "relative" }}
                                >
                                    <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: "white", position: "absolute", top: "2px", left: formBillable ? "18px" : "2px", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                                </button>
                                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Billable to client</span>
                            </div>

                            {/* Notes */}
                            <div>
                                <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px", display: "block" }}>Notes (optional)</label>
                                <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} placeholder="Any additional notes..." style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", outline: "none", resize: "vertical" }} />
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
                                <button onClick={() => setShowModal(false)} style={{ padding: "10px 18px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", cursor: "pointer", fontSize: "12px", color: "var(--text-secondary)" }}>Cancel</button>
                                <button onClick={handleCreate} disabled={!formDescription || !formAmount} style={{ padding: "10px 18px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", cursor: "pointer", fontSize: "12px", color: "white", fontWeight: 500, opacity: !formDescription || !formAmount ? 0.5 : 1 }}>Add Expense</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mileage Calculator Modal */}
            {showMileageCalc && (
                <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowMileageCalc(false)}>
                    <div onClick={(e) => e.stopPropagation()} style={{ width: "420px", padding: "28px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Car size={18} style={{ color: "var(--accent-primary)" }} />
                                <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Mileage Calculator</h2>
                            </div>
                            <button onClick={() => setShowMileageCalc(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={18} /></button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {/* Distance */}
                            <div>
                                <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px", display: "block" }}>Distance (miles)</label>
                                <input type="number" value={mileageDistance} onChange={(e) => setMileageDistance(e.target.value)} placeholder="0" style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", outline: "none" }} />
                            </div>

                            {/* Calculated amount */}
                            <div style={{ padding: "16px", borderRadius: "8px", background: "rgba(176,122,74,0.04)", border: "1px solid var(--border-primary)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>IRS Rate (2024)</span>
                                    <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>${IRS_RATE}/mile</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Reimbursement</span>
                                    <span style={{ fontSize: "20px", fontWeight: 400, color: "var(--accent-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                                        {formatCurrency((parseFloat(mileageDistance) || 0) * IRS_RATE)}
                                    </span>
                                </div>
                            </div>

                            {/* Date + Project */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <div>
                                    <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px", display: "block" }}>Date</label>
                                    <input type="date" value={mileageDate} onChange={(e) => setMileageDate(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", outline: "none" }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px", display: "block" }}>Project</label>
                                    <select value={mileageProject} onChange={(e) => setMileageProject(e.target.value)} style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", cursor: "pointer" }}>
                                        <option value="">No project</option>
                                        {(projects as any[]).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px", display: "block" }}>Description</label>
                                <input value={mileageDescription} onChange={(e) => setMileageDescription(e.target.value)} placeholder="e.g. Site visit to client office" style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", outline: "none" }} />
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "4px" }}>
                                <button onClick={() => setShowMileageCalc(false)} style={{ padding: "10px 18px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", cursor: "pointer", fontSize: "12px", color: "var(--text-secondary)" }}>Cancel</button>
                                <button onClick={handleMileageSubmit} disabled={!mileageDistance} style={{ padding: "10px 18px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", cursor: "pointer", fontSize: "12px", color: "white", fontWeight: 500, opacity: !mileageDistance ? 0.5 : 1 }}>
                                    <MapPin size={13} style={{ marginRight: "4px", verticalAlign: "text-bottom" }} /> Log Mileage
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
