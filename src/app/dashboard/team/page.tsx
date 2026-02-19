"use client";

import { useState } from "react";
import {
    Plus,
    Search,
    Mail,
    Phone,
    MoreHorizontal,
    Users,
    Clock,
    TrendingUp,
    BarChart3,
    X,
} from "lucide-react";

/* ─── Types ─── */

interface TeamMember {
    id: string;
    name: string;
    initials: string;
    email: string;
    phone: string;
    role: string;
    title: string;
    costRate: number;
    billRate: number;
    targetUtil: number;
    weeklyHours: number[];
    projects: string[];
}

/* ─── Data ─── */

const seedMembers: TeamMember[] = [
    { id: "t1", name: "Alex Chen", initials: "AC", email: "alex@studio.com", phone: "(503) 555-0101", role: "Admin", title: "Project Architect", costRate: 65, billRate: 175, targetUtil: 85, weeklyHours: [38.5, 41, 40, 42, 39, 38], projects: ["Meridian Tower", "Harbor Residences"] },
    { id: "t2", name: "Maria Santos", initials: "MS", email: "maria@studio.com", phone: "(503) 555-0102", role: "Manager", title: "Design Lead", costRate: 70, billRate: 185, targetUtil: 80, weeklyHours: [40, 38, 42, 41, 40, 37], projects: ["Meridian Tower", "Civic Center", "Oakwood Elementary"] },
    { id: "t3", name: "Jake Williams", initials: "JW", email: "jake@studio.com", phone: "(503) 555-0103", role: "Member", title: "Technical Lead", costRate: 60, billRate: 165, targetUtil: 85, weeklyHours: [35, 36, 38, 34, 32, 30], projects: ["Meridian Tower", "Riverside Lofts", "Maple Street"] },
    { id: "t4", name: "Priya Patel", initials: "PP", email: "priya@studio.com", phone: "(503) 555-0104", role: "Manager", title: "Project Manager", costRate: 55, billRate: 155, targetUtil: 90, weeklyHours: [40, 42, 41, 40, 44, 40], projects: ["Harbor Residences", "Park View Office"] },
    { id: "t5", name: "Sam Rogers", initials: "SR", email: "sam@studio.com", phone: "(503) 555-0105", role: "Member", title: "Design Architect", costRate: 50, billRate: 145, targetUtil: 85, weeklyHours: [32, 28, 36, 30, 34, 33], projects: ["Harbor Residences", "Riverside Lofts", "Park View Office"] },
    { id: "t6", name: "Elena Vasquez", initials: "EV", email: "elena@studio.com", phone: "(503) 555-0106", role: "Member", title: "Junior Architect", costRate: 38, billRate: 110, targetUtil: 90, weeklyHours: [40, 40, 38, 41, 40, 39], projects: ["Civic Center"] },
];

const weekLabels = ["W1", "W2", "W3", "W4", "W5", "W6"];
const roles = ["Admin", "Manager", "Member"];
const titles = ["Principal", "Project Architect", "Design Lead", "Technical Lead", "Project Manager", "Design Architect", "Junior Architect", "Intern"];

/* ─── Styles ─── */

const labelStyle: React.CSSProperties = { fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px", display: "block" };
const fieldStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-warm)", fontSize: "13px", color: "var(--text-primary)", fontFamily: "inherit", outline: "none", transition: "border-color 0.2s" };

/* ════════════════════════════════════════════════════
   Component
   ════════════════════════════════════════════════════ */

export default function TeamPage() {
    const [members, setMembers] = useState<TeamMember[]>(seedMembers);
    const [search, setSearch] = useState("");
    const [view, setView] = useState<"directory" | "utilization">("directory");
    const [showAdd, setShowAdd] = useState(false);

    // Add member form
    const [formName, setFormName] = useState("");
    const [formEmail, setFormEmail] = useState("");
    const [formPhone, setFormPhone] = useState("");
    const [formRole, setFormRole] = useState("Member");
    const [formTitle, setFormTitle] = useState("");
    const [formCostRate, setFormCostRate] = useState<number>(45);
    const [formBillRate, setFormBillRate] = useState<number>(125);
    const [formTargetUtil, setFormTargetUtil] = useState<number>(85);

    const filtered = members.filter((m) =>
        !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.title.toLowerCase().includes(search.toLowerCase())
    );

    const avgUtil = Math.round(members.reduce((s, m) => {
        const avg = m.weeklyHours.reduce((a, b) => a + b, 0) / m.weeklyHours.length;
        return s + (avg / 40) * 100;
    }, 0) / members.length);

    const getUtilColor = (pct: number) => {
        if (pct >= 100) return "var(--danger)";
        if (pct >= 85) return "var(--success)";
        if (pct >= 70) return "var(--accent-primary)";
        return "var(--warning)";
    };

    /* ─── Actions ─── */

    const resetForm = () => {
        setFormName(""); setFormEmail(""); setFormPhone(""); setFormRole("Member"); setFormTitle(""); setFormCostRate(45); setFormBillRate(125); setFormTargetUtil(85);
    };

    const getInitials = (name: string) => {
        const parts = name.trim().split(" ");
        if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        return name.slice(0, 2).toUpperCase();
    };

    const handleAdd = () => {
        if (!formName.trim() || !formEmail.trim() || !formTitle) return;
        const member: TeamMember = {
            id: `t-${Date.now()}`,
            name: formName.trim(),
            initials: getInitials(formName),
            email: formEmail.trim(),
            phone: formPhone.trim(),
            role: formRole,
            title: formTitle,
            costRate: formCostRate,
            billRate: formBillRate,
            targetUtil: formTargetUtil,
            weeklyHours: [0, 0, 0, 0, 0, 0],
            projects: [],
        };
        setMembers((prev) => [...prev, member]);
        setShowAdd(false);
        resetForm();
    };

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Team</h1>
                    <p style={{ marginTop: "4px", fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 300 }}>
                        {members.length} members · {avgUtil}% avg utilization
                    </p>
                </div>
                <button
                    onClick={() => setShowAdd(true)}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "13px", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s" }}
                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(176,122,74,0.2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                >
                    <Plus size={16} /> Add Member
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
                {[
                    { label: "Team Size", value: `${members.length}`, icon: Users, color: "var(--accent-primary)" },
                    { label: "Avg Utilization", value: `${avgUtil}%`, icon: TrendingUp, color: "var(--accent-secondary)" },
                    { label: "Total Weekly Hours", value: `${Math.round(members.reduce((s, m) => s + m.weeklyHours[m.weeklyHours.length - 1], 0))}h`, icon: Clock, color: "var(--accent-gold)" },
                    { label: "Avg Bill Rate", value: `$${Math.round(members.reduce((s, m) => s + m.billRate, 0) / members.length)}`, icon: BarChart3, color: "var(--info)" },
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

            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", borderRadius: "6px", padding: "8px 12px", maxWidth: "280px", flex: 1 }}>
                    <Search size={14} style={{ color: "var(--text-muted)" }} />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search team..." style={{ flex: 1, border: "none", background: "transparent", fontSize: "13px", color: "var(--text-primary)", outline: "none", fontFamily: "inherit" }} />
                </div>
                <div style={{ display: "flex", gap: "2px", background: "var(--bg-secondary)", borderRadius: "6px", padding: "2px" }}>
                    {[
                        { key: "directory" as const, label: "Directory" },
                        { key: "utilization" as const, label: "Utilization" },
                    ].map(({ key, label }) => (
                        <button key={key} onClick={() => setView(key)}
                            style={{ padding: "7px 14px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: view === key ? 500 : 400, background: view === key ? "var(--bg-card)" : "transparent", color: view === key ? "var(--text-primary)" : "var(--text-muted)", boxShadow: view === key ? "var(--shadow-sm)" : "none" }}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Directory view */}
            {view === "directory" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "14px" }}>
                    {filtered.map((m) => {
                        const avgHours = m.weeklyHours.reduce((a, b) => a + b, 0) / m.weeklyHours.length;
                        const utilPct = Math.round((avgHours / 40) * 100);
                        return (
                            <div key={m.id} style={{ padding: "20px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)", transition: "all 0.2s" }}
                                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-card)"; }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                    <div style={{ display: "flex", gap: "12px" }}>
                                        <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "14px", fontWeight: 600, flexShrink: 0 }}>
                                            {m.initials}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>{m.name}</h3>
                                            <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 300, marginTop: "1px" }}>{m.title}</p>
                                            <div style={{ marginTop: "6px", display: "flex", gap: "8px", alignItems: "center" }}>
                                                <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "3px", background: "var(--bg-secondary)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{m.role}</span>
                                                <a href={`mailto:${m.email}`} style={{ color: "var(--text-muted)", display: "flex" }} title={m.email}><Mail size={11} /></a>
                                                {m.phone && <span style={{ color: "var(--text-muted)", display: "flex" }} title={m.phone}><Phone size={11} /></span>}
                                            </div>
                                        </div>
                                    </div>
                                    <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><MoreHorizontal size={14} /></button>
                                </div>

                                <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid var(--border-primary)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <p style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Cost Rate</p>
                                        <p style={{ fontSize: "13px", color: "var(--text-primary)", marginTop: "2px" }}>${m.costRate}/hr</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Bill Rate</p>
                                        <p style={{ fontSize: "13px", color: "var(--text-primary)", marginTop: "2px" }}>${m.billRate}/hr</p>
                                    </div>
                                    <div>
                                        <p style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Utilization</p>
                                        <p style={{ fontSize: "13px", color: getUtilColor(utilPct), fontWeight: 500, marginTop: "2px" }}>{utilPct}%</p>
                                    </div>
                                </div>

                                <div style={{ marginTop: "12px" }}>
                                    <p style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>Projects</p>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                                        {m.projects.length > 0 ? m.projects.map((p) => (
                                            <span key={p} style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "3px", background: "var(--bg-warm)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" }}>{p}</span>
                                        )) : (
                                            <span style={{ fontSize: "10px", color: "var(--text-muted)", fontStyle: "italic" }}>No projects assigned</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Utilization heatmap view */}
            {view === "utilization" && (
                <div style={{ borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                                <th style={{ padding: "10px 14px", textAlign: "left", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", minWidth: "180px" }}>Team Member</th>
                                <th style={{ padding: "10px 14px", textAlign: "center", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Target</th>
                                {weekLabels.map((w) => (
                                    <th key={w} style={{ padding: "10px 8px", textAlign: "center", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "70px" }}>{w}</th>
                                ))}
                                <th style={{ padding: "10px 14px", textAlign: "center", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Avg</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((m) => {
                                const avgHours = m.weeklyHours.reduce((a, b) => a + b, 0) / m.weeklyHours.length;
                                const avgPct = Math.round((avgHours / 40) * 100);
                                return (
                                    <tr key={m.id} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                                        <td style={{ padding: "12px 14px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "10px", fontWeight: 600 }}>{m.initials}</div>
                                                <div>
                                                    <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>{m.name}</p>
                                                    <p style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 300 }}>{m.title}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px 14px", textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>{m.targetUtil}%</td>
                                        {m.weeklyHours.map((h, wi) => {
                                            const pct = Math.round((h / 40) * 100);
                                            return (
                                                <td key={wi} style={{ padding: "6px 4px", textAlign: "center" }}>
                                                    <div style={{
                                                        padding: "8px 4px", borderRadius: "4px",
                                                        background: pct >= 100 ? "rgba(176,80,64,0.1)" : pct >= 85 ? "rgba(90,122,70,0.1)" : pct >= 70 ? "rgba(176,122,74,0.08)" : "rgba(176,138,48,0.08)",
                                                        color: getUtilColor(pct),
                                                        fontSize: "12px", fontWeight: 500,
                                                    }}>
                                                        {h}h
                                                    </div>
                                                </td>
                                            );
                                        })}
                                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                                            <span style={{ fontSize: "13px", fontWeight: 600, color: getUtilColor(avgPct), fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{avgPct}%</span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ═══ Add Member Modal ═══ */}
            {showAdd && (
                <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => { setShowAdd(false); resetForm(); }}>
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(6px)" }} />
                    <div onClick={(e) => e.stopPropagation()}
                        style={{ position: "relative", width: "520px", maxHeight: "85vh", overflow: "auto", background: "var(--bg-card)", borderRadius: "14px", border: "1px solid var(--border-secondary)", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
                    >
                        {/* Header */}
                        <div style={{ padding: "22px 28px", borderBottom: "1px solid var(--border-primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                                <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Add Team Member</h2>
                                <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 300, marginTop: "2px" }}>Invite a new member to your firm</p>
                            </div>
                            <button onClick={() => { setShowAdd(false); resetForm(); }}
                                style={{ width: "30px", height: "30px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                                <X size={14} />
                            </button>
                        </div>

                        {/* Body */}
                        <div style={{ padding: "24px 28px" }}>
                            {/* Name & Email */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                                <div>
                                    <label style={labelStyle}>Full Name *</label>
                                    <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Jordan Lee"
                                        style={fieldStyle}
                                        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; }}
                                        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-secondary)"; }} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Email *</label>
                                    <input type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="jordan@studio.com"
                                        style={fieldStyle}
                                        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; }}
                                        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-secondary)"; }} />
                                </div>
                            </div>

                            {/* Phone & Role */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                                <div>
                                    <label style={labelStyle}>Phone</label>
                                    <input type="tel" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="(503) 555-0000"
                                        style={fieldStyle}
                                        onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; }}
                                        onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-secondary)"; }} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Role</label>
                                    <select value={formRole} onChange={(e) => setFormRole(e.target.value)}
                                        style={{ ...fieldStyle, cursor: "pointer" }}>
                                        {roles.map((r) => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Title */}
                            <div style={{ marginBottom: "18px" }}>
                                <label style={labelStyle}>Title *</label>
                                <select value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                                    style={{ ...fieldStyle, cursor: "pointer" }}>
                                    <option value="">Select title…</option>
                                    {titles.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>

                            {/* Rates */}
                            <div style={{ padding: "18px", borderRadius: "8px", background: "var(--bg-warm)", border: "1px solid var(--border-primary)", marginBottom: "22px" }}>
                                <p style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "14px" }}>Billing & Rates</p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" }}>
                                    <div>
                                        <label style={labelStyle}>Cost Rate ($/hr)</label>
                                        <input type="number" min="0" value={formCostRate} onChange={(e) => setFormCostRate(parseInt(e.target.value) || 0)}
                                            style={{ ...fieldStyle, background: "var(--bg-card)", textAlign: "center" }} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Bill Rate ($/hr)</label>
                                        <input type="number" min="0" value={formBillRate} onChange={(e) => setFormBillRate(parseInt(e.target.value) || 0)}
                                            style={{ ...fieldStyle, background: "var(--bg-card)", textAlign: "center" }} />
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Target Util %</label>
                                        <input type="number" min="0" max="100" value={formTargetUtil} onChange={(e) => setFormTargetUtil(parseInt(e.target.value) || 0)}
                                            style={{ ...fieldStyle, background: "var(--bg-card)", textAlign: "center" }} />
                                    </div>
                                </div>
                                {formCostRate > 0 && formBillRate > 0 && (
                                    <p style={{ marginTop: "10px", fontSize: "11px", color: "var(--text-muted)" }}>
                                        Multiplier: <strong style={{ color: "var(--accent-primary)" }}>{(formBillRate / formCostRate).toFixed(2)}x</strong> · Margin: <strong style={{ color: "var(--success)" }}>{Math.round(((formBillRate - formCostRate) / formBillRate) * 100)}%</strong>
                                    </p>
                                )}
                            </div>

                            {/* Actions */}
                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                                <button onClick={() => { setShowAdd(false); resetForm(); }}
                                    style={{ padding: "11px 20px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "transparent", fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer" }}>
                                    Cancel
                                </button>
                                <button onClick={handleAdd}
                                    disabled={!formName.trim() || !formEmail.trim() || !formTitle}
                                    style={{ padding: "11px 24px", borderRadius: "6px", border: "none", background: (formName.trim() && formEmail.trim() && formTitle) ? "var(--accent-primary)" : "var(--bg-tertiary)", color: (formName.trim() && formEmail.trim() && formTitle) ? "white" : "var(--text-muted)", fontSize: "13px", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", cursor: (formName.trim() && formEmail.trim() && formTitle) ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
                                    Add Member
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
