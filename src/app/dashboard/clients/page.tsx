"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Plus,
    Search,
    Building2,
    Mail,
    Phone,
    Globe,
    MapPin,
    ChevronRight,
    MoreHorizontal,
    Briefcase,
    FileText,
    DollarSign,
    Trash2,
    Edit3,
    X,
    Send,
    CheckCircle2,
    XCircle,
    Clock,
    Users,
    Loader2,
} from "lucide-react";
import { trpc } from "@/app/providers";
import { useCurrencyFormatter } from "../useCurrencyFormatter";

const clientStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: "Active", color: "var(--success)", bg: "rgba(90,122,70,0.08)" },
    inactive: { label: "Inactive", color: "var(--text-muted)", bg: "var(--bg-secondary)" },
    prospect: { label: "Prospect", color: "var(--info)", bg: "rgba(90,122,144,0.08)" },
};

const proposalStatusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ComponentType<any> }> = {
    draft: { label: "Draft", color: "var(--text-muted)", bg: "var(--bg-secondary)", icon: Clock },
    sent: { label: "Sent", color: "var(--info)", bg: "rgba(90,122,144,0.08)", icon: Send },
    accepted: { label: "Accepted", color: "var(--success)", bg: "rgba(90,122,70,0.08)", icon: CheckCircle2 },
    declined: { label: "Declined", color: "var(--danger)", bg: "rgba(176,80,64,0.08)", icon: XCircle },
};

export default function ClientsPage() {
    const [pageTab, setPageTab] = useState<"clients" | "consultants">("clients");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const [showNewClient, setShowNewClient] = useState(false);
    const [showNewProposal, setShowNewProposal] = useState(false);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const { formatCurrency } = useCurrencyFormatter();

    const utils = trpc.useUtils();
    const { data: rawClients = [], isLoading } = trpc.clients.list.useQuery();
    const deleteClient = trpc.clients.delete.useMutation({ onSuccess: () => { utils.clients.list.invalidate(); setSelectedClient(null); } });

    const clients = (rawClients as any[]).map((c: any) => ({
        ...c,
        totalRevenue: (c.invoices || []).filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + i.amount, 0),
        activeProjects: (c.projects || []).filter((p: any) => p.status === "active").length,
        totalProposals: (c.proposals || []).length,
        pendingProposals: (c.proposals || []).filter((p: any) => p.status === "sent").length,
    }));

    const filtered = clients.filter((c: any) => {
        if (statusFilter !== "all" && c.status !== statusFilter) return false;
        if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.email.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const statusCounts = {
        all: clients.length,
        active: clients.filter((c: any) => c.status === "active").length,
        prospect: clients.filter((c: any) => c.status === "prospect").length,
        inactive: clients.filter((c: any) => c.status === "inactive").length,
    };

    const selected = selectedClient ? clients.find((c: any) => c.id === selectedClient) : null;

    if (isLoading) {
        return <div style={{ padding: "80px 0", textAlign: "center" }}><p style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 300 }}>Loading clients...</p></div>;
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Contacts</h1>
                    <p style={{ marginTop: "4px", fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 300 }}>
                        Clients, consultants, and business relationships
                    </p>
                </div>
                <button onClick={() => pageTab === "clients" ? setShowNewClient(true) : undefined}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "13px", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", cursor: "pointer" }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(176,122,74,0.2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}>
                    <Plus size={16} /> {pageTab === "clients" ? "New Client" : "New Consultant"}
                </button>
            </div>

            {/* Page Tabs */}
            <div style={{ display: "flex", gap: "0", borderBottom: "1px solid var(--border-primary)", marginBottom: "24px" }}>
                {([{ id: "clients", label: "Clients", icon: Building2 }, { id: "consultants", label: "Consultants", icon: Users }] as const).map(t => (
                    <button key={t.id} onClick={() => setPageTab(t.id)}
                        style={{ padding: "8px 16px", fontSize: "12px", cursor: "pointer", border: "none", borderBottom: pageTab === t.id ? "2px solid var(--accent-primary)" : "2px solid transparent", background: "transparent", color: pageTab === t.id ? "var(--accent-primary)" : "var(--text-muted)", fontWeight: pageTab === t.id ? 600 : 400, display: "flex", alignItems: "center", gap: "6px", transition: "all 0.15s" }}>
                        <t.icon size={13} /> {t.label}
                    </button>
                ))}
            </div>

            {pageTab === "consultants" && <ConsultantsView />}

            {pageTab === "clients" && <>
                {/* Summary cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
                    {[
                        { label: "Total Clients", value: clients.length, icon: Building2, color: "var(--accent-primary)" },
                        { label: "Active Projects", value: clients.reduce((s: number, c: any) => s + c.activeProjects, 0), icon: Briefcase, color: "var(--success)" },
                        { label: "Total Revenue", value: formatCurrency(clients.reduce((s: number, c: any) => s + c.totalRevenue, 0)), icon: DollarSign, color: "var(--accent-gold)" },
                        { label: "Pending Proposals", value: clients.reduce((s: number, c: any) => s + c.pendingProposals, 0), icon: FileText, color: "var(--info)" },
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

                {/* Tabs + Search */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <div style={{ display: "flex", gap: "2px", background: "var(--bg-secondary)", borderRadius: "8px", padding: "3px" }}>
                        {Object.entries(statusCounts).map(([key, count]) => (
                            <button key={key} onClick={() => setStatusFilter(key)}
                                style={{ padding: "7px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: statusFilter === key ? 500 : 400, background: statusFilter === key ? "var(--bg-card)" : "transparent", color: statusFilter === key ? "var(--text-primary)" : "var(--text-muted)", boxShadow: statusFilter === key ? "var(--shadow-sm)" : "none", textTransform: "capitalize", display: "flex", alignItems: "center", gap: "6px" }}>
                                {key === "all" ? "All" : key}
                                <span style={{ fontSize: "10px", color: statusFilter === key ? "var(--accent-primary)" : "var(--text-muted)", fontWeight: 500 }}>{count}</span>
                            </button>
                        ))}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", borderRadius: "6px", padding: "8px 12px", maxWidth: "280px", flex: 1 }}>
                        <Search size={14} style={{ color: "var(--text-muted)" }} />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search clients..." style={{ flex: 1, border: "none", background: "transparent", fontSize: "13px", color: "var(--text-primary)", outline: "none", fontFamily: "inherit" }} />
                    </div>
                </div>

                {/* Main layout: list + detail */}
                <div style={{ display: "grid", gridTemplateColumns: selectedClient ? "1fr 1.4fr" : "1fr", gap: "16px" }}>
                    {/* Client list */}
                    <div style={{ borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                                    {["Client", "Industry", "Projects", "Revenue", "Status", ""].map(h => (
                                        <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((c: any) => {
                                    const sc = clientStatusConfig[c.status] || clientStatusConfig.active;
                                    return (
                                        <tr key={c.id} onClick={() => setSelectedClient(c.id)}
                                            style={{ borderBottom: "1px solid var(--border-primary)", cursor: "pointer", background: selectedClient === c.id ? "var(--bg-warm)" : "transparent" }}
                                            onMouseEnter={(e) => { if (selectedClient !== c.id) e.currentTarget.style.background = "var(--bg-warm)"; }}
                                            onMouseLeave={(e) => { if (selectedClient !== c.id) e.currentTarget.style.background = "transparent"; }}>
                                            <td style={{ padding: "12px 14px" }}>
                                                <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{c.name}</p>
                                                {c.contactName && <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>{c.contactName}</p>}
                                            </td>
                                            <td style={{ padding: "12px 14px" }}>
                                                {c.industry ? <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "3px", background: "var(--bg-secondary)", color: "var(--text-muted)" }}>{c.industry}</span> : <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>—</span>}
                                            </td>
                                            <td style={{ padding: "12px 14px", fontSize: "12px", color: "var(--text-secondary)" }}>{c.activeProjects}</td>
                                            <td style={{ padding: "12px 14px", fontSize: "12px", color: "var(--text-secondary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{formatCurrency(c.totalRevenue)}</td>
                                            <td style={{ padding: "12px 14px" }}><span style={{ fontSize: "9px", fontWeight: 600, padding: "3px 8px", borderRadius: "3px", textTransform: "uppercase", color: sc.color, background: sc.bg }}>{sc.label}</span></td>
                                            <td style={{ padding: "12px 14px" }}>
                                                <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {filtered.length === 0 && <div style={{ padding: "40px", textAlign: "center" }}><p style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 300 }}>No clients found.</p></div>}
                    </div>

                    {/* Client detail panel */}
                    {selected && (
                        <div style={{ borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
                            {/* Detail header */}
                            <div style={{ padding: "20px", borderBottom: "1px solid var(--border-primary)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div>
                                        <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{selected.name}</h2>
                                        {selected.contactName && <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{selected.contactName}</p>}
                                    </div>
                                    <div style={{ display: "flex", gap: "6px" }}>
                                        <button onClick={() => { setSelectedClient(null); }}
                                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}><X size={16} /></button>
                                    </div>
                                </div>
                                {/* Contact info */}
                                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "14px" }}>
                                    {selected.email && <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><Mail size={11} style={{ color: "var(--text-muted)" }} /><span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{selected.email}</span></div>}
                                    {selected.phone && <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><Phone size={11} style={{ color: "var(--text-muted)" }} /><span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{selected.phone}</span></div>}
                                    {selected.website && <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><Globe size={11} style={{ color: "var(--text-muted)" }} /><span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{selected.website}</span></div>}
                                    {selected.address && <div style={{ display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={11} style={{ color: "var(--text-muted)" }} /><span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{selected.address}</span></div>}
                                </div>
                            </div>

                            <div style={{ maxHeight: "520px", overflowY: "auto" }}>
                                {/* Projects */}
                                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-primary)" }}>
                                    <p style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>Projects ({(selected.projects || []).length})</p>
                                    {(selected.projects || []).length === 0 ? (
                                        <p style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>No projects yet.</p>
                                    ) : (selected.projects || []).map((p: any) => (
                                        <Link key={p.id} href={`/dashboard/projects/${p.id}`} style={{ textDecoration: "none", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border-primary)" }}>
                                            <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>{p.name}</span>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{formatCurrency(p.contractValue)}</span>
                                                <span style={{ fontSize: "9px", fontWeight: 600, padding: "2px 6px", borderRadius: "3px", textTransform: "uppercase", color: p.status === "active" ? "var(--success)" : "var(--text-muted)", background: p.status === "active" ? "rgba(90,122,70,0.08)" : "var(--bg-secondary)" }}>{p.status}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                {/* Proposals */}
                                <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-primary)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                        <p style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Proposals ({selected.totalProposals})</p>
                                        <button onClick={() => setShowNewProposal(true)} style={{ fontSize: "10px", color: "var(--accent-primary)", background: "none", border: "none", cursor: "pointer", fontWeight: 500, display: "flex", alignItems: "center", gap: "3px" }}><Plus size={11} /> New</button>
                                    </div>
                                    {(selected.proposals || []).length === 0 ? (
                                        <p style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>No proposals yet.</p>
                                    ) : (selected.proposals || []).map((prop: any) => {
                                        const ps = proposalStatusConfig[prop.status] || proposalStatusConfig.draft;
                                        return (
                                            <div key={prop.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border-primary)" }}>
                                                <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>{prop.title}</span>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{formatCurrency(prop.amount)}</span>
                                                    <span style={{ fontSize: "9px", fontWeight: 600, padding: "2px 6px", borderRadius: "3px", textTransform: "uppercase", color: ps.color, background: ps.bg }}>{ps.label}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Invoices */}
                                <div style={{ padding: "16px 20px" }}>
                                    <p style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>Invoices ({(selected.invoices || []).length})</p>
                                    {(selected.invoices || []).length === 0 ? (
                                        <p style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>No invoices yet.</p>
                                    ) : (selected.invoices || []).map((inv: any) => (
                                        <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border-primary)" }}>
                                            <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>#{inv.number || inv.id.slice(0, 6)}</span>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{formatCurrency(inv.amount)}</span>
                                                <span style={{ fontSize: "9px", fontWeight: 600, padding: "2px 6px", borderRadius: "3px", textTransform: "uppercase", color: inv.status === "paid" ? "var(--success)" : inv.status === "overdue" ? "var(--danger)" : "var(--text-muted)", background: inv.status === "paid" ? "rgba(90,122,70,0.08)" : inv.status === "overdue" ? "rgba(176,80,64,0.08)" : "var(--bg-secondary)" }}>{inv.status}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Notes */}
                                {selected.notes && (
                                    <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border-primary)" }}>
                                        <p style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Notes</p>
                                        <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5, fontWeight: 300 }}>{selected.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Footer actions */}
                            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--border-primary)", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                                <button onClick={() => deleteClient.mutate({ id: selected.id })}
                                    style={{ padding: "7px 14px", borderRadius: "5px", border: "1px solid var(--border-secondary)", background: "transparent", fontSize: "11px", color: "var(--danger)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                                    <Trash2 size={12} /> Delete
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* New Client Modal */}
                {showNewClient && <NewClientModal onClose={() => setShowNewClient(false)} />}

                {/* New Proposal Modal */}
                {showNewProposal && selectedClient && <NewProposalModal clientId={selectedClient} onClose={() => setShowNewProposal(false)} />}
            </>}
        </div>
    );
}

/* ─── New Client Modal ─── */

function NewClientModal({ onClose }: { onClose: () => void }) {
    const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", website: "", notes: "", industry: "", status: "active", contactName: "" });
    const up = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));
    const utils = trpc.useUtils();
    const create = trpc.clients.create.useMutation({ onSuccess: () => { utils.clients.list.invalidate(); onClose(); } });
    const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", outline: "none", fontFamily: "inherit" };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} />
            <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: "520px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-secondary)", boxShadow: "0 20px 60px rgba(0,0,0,0.12)", maxHeight: "90vh", overflow: "auto" }}>
                <div style={{ padding: "24px 24px 0" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>New Client</h2>
                    <p style={{ marginTop: "4px", fontSize: "13px", color: "var(--text-muted)", fontWeight: 300 }}>Add a new client to your directory.</p>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); create.mutate(form); }} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                        <div><label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Company Name *</label><input type="text" value={form.name} onChange={(e) => up("name", e.target.value)} required placeholder="Acme Corp" style={inputStyle} /></div>
                        <div><label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Contact Person</label><input type="text" value={form.contactName} onChange={(e) => up("contactName", e.target.value)} placeholder="John Doe" style={inputStyle} /></div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                        <div><label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Email</label><input type="email" value={form.email} onChange={(e) => up("email", e.target.value)} placeholder="email@company.com" style={inputStyle} /></div>
                        <div><label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Phone</label><input type="text" value={form.phone} onChange={(e) => up("phone", e.target.value)} placeholder="+1 (555) 000-0000" style={inputStyle} /></div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                        <div><label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Industry</label><select value={form.industry} onChange={(e) => up("industry", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}><option value="">Select...</option>{["Real Estate", "Hospitality", "Healthcare", "Education", "Government", "Retail", "Technology", "Finance", "Construction", "Other"].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                        <div><label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Status</label><select value={form.status} onChange={(e) => up("status", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>{["active", "prospect", "inactive"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select></div>
                    </div>
                    <div><label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Address</label><input type="text" value={form.address} onChange={(e) => up("address", e.target.value)} placeholder="123 Main St, City, State" style={inputStyle} /></div>
                    <div><label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Website</label><input type="text" value={form.website} onChange={(e) => up("website", e.target.value)} placeholder="https://company.com" style={inputStyle} /></div>
                    <div><label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Notes</label><textarea value={form.notes} onChange={(e) => up("notes", e.target.value)} rows={2} placeholder="Internal notes..." style={{ ...inputStyle, resize: "vertical" }} /></div>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "8px", borderTop: "1px solid var(--border-primary)" }}>
                        <button type="button" onClick={onClose} style={{ padding: "10px 20px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "transparent", fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer" }}>Cancel</button>
                        <button type="submit" disabled={create.isPending} style={{ padding: "10px 24px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "13px", fontWeight: 500, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.04em", opacity: create.isPending ? 0.7 : 1 }}>{create.isPending ? "Saving..." : "Add Client"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── New Proposal Modal ─── */

function NewProposalModal({ clientId, onClose }: { clientId: string; onClose: () => void }) {
    const [form, setForm] = useState({ title: "", amount: "", status: "draft", sentDate: "", notes: "" });
    const up = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));
    const utils = trpc.useUtils();
    const create = trpc.clients.createProposal.useMutation({ onSuccess: () => { utils.clients.list.invalidate(); onClose(); } });
    const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", outline: "none", fontFamily: "inherit" };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} />
            <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: "480px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-secondary)", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
                <div style={{ padding: "24px 24px 0" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>New Proposal</h2>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); create.mutate({ clientId, title: form.title, amount: parseFloat(form.amount) || 0, status: form.status, sentDate: form.sentDate, notes: form.notes }); }} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div><label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Title *</label><input type="text" value={form.title} onChange={(e) => up("title", e.target.value)} required placeholder="Interior Renovation Phase 2" style={inputStyle} /></div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                        <div><label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Amount</label><input type="number" value={form.amount} onChange={(e) => up("amount", e.target.value)} placeholder="0" style={inputStyle} /></div>
                        <div><label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Status</label><select value={form.status} onChange={(e) => up("status", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>{["draft", "sent", "accepted", "declined"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select></div>
                    </div>
                    <div><label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Sent Date</label><input type="date" value={form.sentDate} onChange={(e) => up("sentDate", e.target.value)} style={inputStyle} /></div>
                    <div><label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Notes</label><textarea value={form.notes} onChange={(e) => up("notes", e.target.value)} rows={2} placeholder="Proposal notes..." style={{ ...inputStyle, resize: "vertical" }} /></div>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "8px", borderTop: "1px solid var(--border-primary)" }}>
                        <button type="button" onClick={onClose} style={{ padding: "10px 20px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "transparent", fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer" }}>Cancel</button>
                        <button type="submit" disabled={create.isPending} style={{ padding: "10px 24px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "13px", fontWeight: 500, cursor: "pointer", opacity: create.isPending ? 0.7 : 1 }}>{create.isPending ? "Saving..." : "Create Proposal"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Consultants View ─── */

function ConsultantsView() {
    const utils = trpc.useUtils();
    const { data: consultants = [], isLoading } = trpc.consultant.list.useQuery();
    const createConsultant = trpc.consultant.create.useMutation({ onSuccess: () => utils.consultant.invalidate() });
    const updateConsultant = trpc.consultant.update.useMutation({ onSuccess: () => utils.consultant.invalidate() });
    const deleteConsultant = trpc.consultant.delete.useMutation({ onSuccess: () => utils.consultant.invalidate() });
    const [showAdd, setShowAdd] = useState(false);
    const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", specialty: "", markupPct: "0" });
    const up = (k: string, v: string) => setForm({ ...form, [k]: v });
    const iStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", outline: "none", fontFamily: "inherit" };

    const handleCreate = async () => {
        await createConsultant.mutateAsync({ ...form, markupPct: parseFloat(form.markupPct) || 0 });
        setShowAdd(false);
        setForm({ name: "", company: "", email: "", phone: "", specialty: "", markupPct: "0" });
    };

    if (isLoading) return <div style={{ padding: "60px", textAlign: "center" }}><Loader2 size={20} style={{ color: "var(--text-muted)", animation: "spin 1s linear infinite" }} /><style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style></div>;

    const list = consultants as any[];

    return (
        <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>{list.length} consultant{list.length !== 1 ? "s" : ""}</p>
                <button onClick={() => setShowAdd(true)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "12px", fontWeight: 500, cursor: "pointer" }}><Plus size={13} /> Add Consultant</button>
            </div>

            <div style={{ borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-primary)", background: "var(--bg-warm)" }}>
                            {["Name", "Company", "Email", "Specialty", "Markup %", "Bills", "Status", ""].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {list.length === 0 ? (
                            <tr><td colSpan={8} style={{ padding: "40px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)", fontWeight: 300 }}>No consultants yet. Add your first sub-consultant.</td></tr>
                        ) : list.map((c: any) => (
                            <tr key={c.id} style={{ borderBottom: "1px solid var(--border-primary)" }} onMouseEnter={e => (e.currentTarget.style.background = "var(--bg-warm)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                                <td style={{ padding: "12px 14px", fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{c.name}</td>
                                <td style={{ padding: "12px 14px", fontSize: "12px", color: "var(--text-secondary)" }}>{c.company || "—"}</td>
                                <td style={{ padding: "12px 14px", fontSize: "12px", color: "var(--text-secondary)" }}>{c.email || "—"}</td>
                                <td style={{ padding: "12px 14px" }}>{c.specialty ? <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "3px", background: "var(--bg-secondary)", color: "var(--text-muted)" }}>{c.specialty}</span> : "—"}</td>
                                <td style={{ padding: "12px 14px", fontSize: "12px", color: "var(--text-secondary)" }}>{c.markupPct}%</td>
                                <td style={{ padding: "12px 14px", fontSize: "12px", color: "var(--text-muted)" }}>{(c.bills || []).length}</td>
                                <td style={{ padding: "12px 14px" }}>
                                    <span style={{ fontSize: "9px", fontWeight: 600, padding: "3px 8px", borderRadius: "3px", textTransform: "uppercase", color: c.status === "active" ? "var(--success)" : "var(--text-muted)", background: c.status === "active" ? "rgba(90,122,70,0.08)" : "var(--bg-secondary)" }}>{c.status}</span>
                                </td>
                                <td style={{ padding: "12px 14px" }}>
                                    <div style={{ display: "flex", gap: "4px" }}>
                                        <button onClick={() => updateConsultant.mutate({ id: c.id, status: c.status === "active" ? "inactive" : "active" })} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "10px", color: "var(--text-muted)", fontWeight: 500 }}>{c.status === "active" ? "Deactivate" : "Activate"}</button>
                                        <button onClick={() => deleteConsultant.mutate({ id: c.id })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", padding: "4px" }}><Trash2 size={12} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showAdd && (
                <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowAdd(false)}>
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} />
                    <div onClick={e => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: "480px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-secondary)", boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
                        <div style={{ padding: "24px 24px 0" }}>
                            <h2 style={{ fontSize: "20px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Add Consultant</h2>
                        </div>
                        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                                <div><label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Name *</label><input value={form.name} onChange={e => up("name", e.target.value)} placeholder="Jane Smith" style={iStyle} /></div>
                                <div><label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Company</label><input value={form.company} onChange={e => up("company", e.target.value)} placeholder="Smith Engineering" style={iStyle} /></div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                                <div><label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Email</label><input value={form.email} onChange={e => up("email", e.target.value)} placeholder="jane@smith.com" style={iStyle} /></div>
                                <div><label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Phone</label><input value={form.phone} onChange={e => up("phone", e.target.value)} placeholder="+1 555..." style={iStyle} /></div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "14px" }}>
                                <div><label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Specialty</label><input value={form.specialty} onChange={e => up("specialty", e.target.value)} placeholder="Structural, MEP, Landscape..." style={iStyle} /></div>
                                <div><label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Markup %</label><input type="number" value={form.markupPct} onChange={e => up("markupPct", e.target.value)} style={iStyle} /></div>
                            </div>
                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "8px", borderTop: "1px solid var(--border-primary)" }}>
                                <button onClick={() => setShowAdd(false)} style={{ padding: "10px 20px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "transparent", fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer" }}>Cancel</button>
                                <button onClick={handleCreate} disabled={!form.name} style={{ padding: "10px 24px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "13px", fontWeight: 500, cursor: "pointer", opacity: !form.name ? 0.5 : 1 }}>Add Consultant</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
