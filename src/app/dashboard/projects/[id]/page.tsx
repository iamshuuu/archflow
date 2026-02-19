"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    ArrowLeft,
    Clock,
    DollarSign,
    Users,
    Calendar,
    ChevronRight,
    MoreHorizontal,
    Plus,
    CheckCircle2,
    AlertTriangle,
    TrendingUp,
    FileText,
    Edit3,
} from "lucide-react";

/* ─── Mock data ─── */

interface Phase {
    id: string;
    name: string;
    status: "completed" | "active" | "upcoming";
    progress: number;
    budgetHours: number;
    usedHours: number;
    fee: number;
    startDate: string;
    endDate: string;
    milestones: { name: string; done: boolean; date: string }[];
}

interface ProjectDetail {
    id: string;
    name: string;
    client: string;
    type: string;
    status: string;
    contractValue: number;
    startDate: string;
    endDate: string;
    description: string;
    team: { name: string; initials: string; role: string; hours: number }[];
    phases: Phase[];
}

const projectData: Record<string, ProjectDetail> = {
    p1: {
        id: "p1",
        name: "Meridian Tower",
        client: "Apex Development Corp",
        type: "Commercial",
        status: "active",
        contractValue: 285000,
        startDate: "2025-06-01",
        endDate: "2026-08-15",
        description: "32-story mixed-use tower with retail podium and 280 residential units in downtown Portland. LEED Gold target.",
        team: [
            { name: "Alex Chen", initials: "AC", role: "Project Architect", hours: 420 },
            { name: "Maria Santos", initials: "MS", role: "Design Lead", hours: 310 },
            { name: "Jake Williams", initials: "JW", role: "Technical Lead", hours: 280 },
        ],
        phases: [
            { id: "ph1", name: "Pre-Design", status: "completed", progress: 100, budgetHours: 120, usedHours: 115, fee: 18000, startDate: "2025-06-01", endDate: "2025-07-15", milestones: [{ name: "Site analysis complete", done: true, date: "2025-06-20" }, { name: "Program approved", done: true, date: "2025-07-10" }] },
            { id: "ph2", name: "Schematic Design", status: "completed", progress: 100, budgetHours: 280, usedHours: 295, fee: 45000, startDate: "2025-07-16", endDate: "2025-10-01", milestones: [{ name: "SD presentation", done: true, date: "2025-09-15" }, { name: "Client approval", done: true, date: "2025-09-28" }] },
            { id: "ph3", name: "Design Development", status: "completed", progress: 100, budgetHours: 400, usedHours: 388, fee: 65000, startDate: "2025-10-02", endDate: "2026-01-15", milestones: [{ name: "DD 50% review", done: true, date: "2025-11-20" }, { name: "DD final package", done: true, date: "2026-01-10" }] },
            { id: "ph4", name: "Construction Documents", status: "active", progress: 65, budgetHours: 600, usedHours: 412, fee: 95000, startDate: "2026-01-16", endDate: "2026-05-30", milestones: [{ name: "CD 50% set", done: true, date: "2026-03-01" }, { name: "CD 90% set", done: false, date: "2026-04-15" }, { name: "Permit set", done: false, date: "2026-05-20" }] },
            { id: "ph5", name: "Construction Admin", status: "upcoming", progress: 0, budgetHours: 320, usedHours: 0, fee: 62000, startDate: "2026-06-01", endDate: "2026-08-15", milestones: [{ name: "Substantial completion", done: false, date: "2026-08-01" }] },
        ],
    },
};

// Default fallback for any project ID
const defaultProject: ProjectDetail = {
    id: "px",
    name: "Harbor Residences",
    client: "Coastal Properties LLC",
    type: "Residential",
    status: "active",
    contractValue: 420000,
    startDate: "2025-09-15",
    endDate: "2026-12-01",
    description: "Luxury waterfront residential complex — 4 buildings, 120 units, underground parking, and marina access.",
    team: [
        { name: "Priya Patel", initials: "PP", role: "Project Manager", hours: 200 },
        { name: "Sam Rogers", initials: "SR", role: "Design Architect", hours: 180 },
    ],
    phases: [
        { id: "ph1", name: "Pre-Design", status: "completed", progress: 100, budgetHours: 80, usedHours: 76, fee: 15000, startDate: "2025-09-15", endDate: "2025-10-30", milestones: [{ name: "Site survey", done: true, date: "2025-10-01" }] },
        { id: "ph2", name: "Schematic Design", status: "completed", progress: 100, budgetHours: 200, usedHours: 210, fee: 40000, startDate: "2025-11-01", endDate: "2026-02-01", milestones: [{ name: "SD review", done: true, date: "2026-01-15" }] },
        { id: "ph3", name: "Design Development", status: "active", progress: 45, budgetHours: 300, usedHours: 135, fee: 60000, startDate: "2026-02-02", endDate: "2026-06-30", milestones: [{ name: "DD 50%", done: false, date: "2026-04-15" }, { name: "DD final", done: false, date: "2026-06-20" }] },
        { id: "ph4", name: "Construction Documents", status: "upcoming", progress: 0, budgetHours: 500, usedHours: 0, fee: 95000, startDate: "2026-07-01", endDate: "2026-10-30", milestones: [] },
        { id: "ph5", name: "Construction Admin", status: "upcoming", progress: 0, budgetHours: 200, usedHours: 0, fee: 50000, startDate: "2026-11-01", endDate: "2026-12-01", milestones: [] },
    ],
};

const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

const phaseStatusColors: Record<string, { dot: string; text: string; bg: string }> = {
    completed: { dot: "var(--success)", text: "var(--success)", bg: "rgba(90,122,70,0.06)" },
    active: { dot: "var(--accent-primary)", text: "var(--accent-primary)", bg: "rgba(176,122,74,0.06)" },
    upcoming: { dot: "var(--text-muted)", text: "var(--text-muted)", bg: "var(--bg-warm)" },
};

export default function ProjectDetailPage() {
    const params = useParams();
    const projectId = params?.id as string;
    const project = projectData[projectId] || defaultProject;

    const totalBudgetHours = project.phases.reduce((s, p) => s + p.budgetHours, 0);
    const totalUsedHours = project.phases.reduce((s, p) => s + p.usedHours, 0);
    const totalFee = project.phases.reduce((s, p) => s + p.fee, 0);
    const overallProgress = Math.round(project.phases.reduce((s, p) => s + p.progress, 0) / project.phases.length);
    const [activePhase, setActivePhase] = useState<string | null>(null);

    return (
        <div>
            {/* Breadcrumb & header */}
            <div style={{ marginBottom: "24px" }}>
                <Link href="/dashboard/projects" style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-muted)", textDecoration: "none", marginBottom: "12px" }}>
                    <ArrowLeft size={14} /> Back to Projects
                </Link>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                        <h1 style={{ fontSize: "26px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                            {project.name}
                        </h1>
                        <p style={{ marginTop: "4px", fontSize: "13px", color: "var(--text-tertiary)", fontWeight: 300 }}>
                            {project.client} · {project.type}
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        <button style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)" }}>
                            <Edit3 size={13} /> Edit
                        </button>
                        <button style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "white", fontWeight: 500 }}>
                            <FileText size={13} /> Invoice
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "24px" }}>
                {[
                    { label: "Contract Value", value: formatCurrency(project.contractValue), icon: DollarSign, color: "var(--accent-primary)" },
                    { label: "Overall Progress", value: `${overallProgress}%`, icon: TrendingUp, color: "var(--accent-secondary)" },
                    { label: "Hours Used", value: `${totalUsedHours} / ${totalBudgetHours}`, icon: Clock, color: "var(--accent-gold)" },
                    { label: "Team Members", value: `${project.team.length}`, icon: Users, color: "var(--info)" },
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

            {/* Two-column layout */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px" }}>
                {/* Phases */}
                <div style={{ padding: "24px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <h3 style={{ fontSize: "15px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Phases & Milestones</h3>
                        <button style={{ padding: "6px 12px", borderRadius: "4px", border: "1px solid var(--border-primary)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--text-muted)" }}>
                            <Plus size={12} /> Add Phase
                        </button>
                    </div>

                    {/* Phase timeline */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                        {project.phases.map((phase, i) => {
                            const sc = phaseStatusColors[phase.status];
                            const expanded = activePhase === phase.id;
                            const hoursPercent = phase.budgetHours > 0 ? Math.round((phase.usedHours / phase.budgetHours) * 100) : 0;
                            const isOverBudget = hoursPercent > 100;

                            return (
                                <div key={phase.id}>
                                    {/* Phase row */}
                                    <div
                                        onClick={() => setActivePhase(expanded ? null : phase.id)}
                                        style={{
                                            display: "flex", alignItems: "center", gap: "12px", padding: "14px",
                                            borderRadius: expanded ? "8px 8px 0 0" : "8px",
                                            background: expanded ? sc.bg : "transparent",
                                            cursor: "pointer", transition: "all 0.15s",
                                        }}
                                        onMouseEnter={(e) => { if (!expanded) e.currentTarget.style.background = "var(--bg-warm)"; }}
                                        onMouseLeave={(e) => { if (!expanded) e.currentTarget.style.background = "transparent"; }}
                                    >
                                        {/* Timeline dot & line */}
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0", alignSelf: "stretch", width: "20px" }}>
                                            <div style={{ width: "10px", height: "10px", borderRadius: "50%", border: `2px solid ${sc.dot}`, background: phase.status === "completed" ? sc.dot : "var(--bg-card)", flexShrink: 0 }} />
                                            {i < project.phases.length - 1 && <div style={{ width: "2px", flex: 1, background: phase.status === "completed" ? "var(--success)" : "var(--border-primary)", marginTop: "2px" }} />}
                                        </div>

                                        {/* Phase info */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{phase.name}</p>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <span style={{ fontSize: "11px", color: sc.text, fontWeight: 400 }}>{phase.progress}%</span>
                                                    <ChevronRight size={12} style={{ color: "var(--text-muted)", transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                                                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{phase.startDate} → {phase.endDate}</span>
                                                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{formatCurrency(phase.fee)}</span>
                                            </div>
                                            {/* Progress bar */}
                                            <div style={{ marginTop: "8px", height: "3px", borderRadius: "2px", background: "var(--bg-tertiary)" }}>
                                                <div style={{ height: "100%", borderRadius: "2px", width: `${Math.min(phase.progress, 100)}%`, background: sc.dot, transition: "width 0.4s" }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded detail */}
                                    {expanded && (
                                        <div style={{ marginLeft: "32px", padding: "0 14px 14px 14px", background: sc.bg, borderRadius: "0 0 8px 8px" }}>
                                            {/* Hours */}
                                            <div style={{ display: "flex", gap: "24px", padding: "12px 0", borderBottom: "1px solid var(--border-primary)" }}>
                                                <div>
                                                    <p style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Hours</p>
                                                    <p style={{ fontSize: "14px", color: isOverBudget ? "var(--danger)" : "var(--text-primary)", fontWeight: 500, marginTop: "2px" }}>
                                                        {phase.usedHours} / {phase.budgetHours}
                                                        {isOverBudget && <AlertTriangle size={12} style={{ color: "var(--danger)", marginLeft: "4px", verticalAlign: "text-bottom" }} />}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Fee</p>
                                                    <p style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500, marginTop: "2px" }}>{formatCurrency(phase.fee)}</p>
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em" }}>Budget Used</p>
                                                    <p style={{ fontSize: "14px", color: isOverBudget ? "var(--danger)" : "var(--text-primary)", fontWeight: 500, marginTop: "2px" }}>{hoursPercent}%</p>
                                                </div>
                                            </div>

                                            {/* Milestones */}
                                            {phase.milestones.length > 0 && (
                                                <div style={{ paddingTop: "12px" }}>
                                                    <p style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "8px" }}>Milestones</p>
                                                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                        {phase.milestones.map((m, mi) => (
                                                            <div key={mi} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                <CheckCircle2 size={14} style={{ color: m.done ? "var(--success)" : "var(--border-secondary)", flexShrink: 0 }} />
                                                                <span style={{ fontSize: "12px", color: m.done ? "var(--text-secondary)" : "var(--text-primary)", fontWeight: m.done ? 300 : 400, textDecoration: m.done ? "line-through" : "none", flex: 1 }}>{m.name}</span>
                                                                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{m.date}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right sidebar */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Team */}
                    <div style={{ padding: "20px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <h3 style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Team</h3>
                            <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "2px" }}><Plus size={14} /></button>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {project.team.map((member, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "10px", fontWeight: 600 }}>
                                            {member.initials}
                                        </div>
                                        <div>
                                            <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>{member.name}</p>
                                            <p style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 300 }}>{member.role}</p>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{member.hours}h</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Project details */}
                    <div style={{ padding: "20px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                        <h3 style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "16px" }}>Details</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {[
                                { label: "Status", value: project.status.charAt(0).toUpperCase() + project.status.slice(1) },
                                { label: "Type", value: project.type },
                                { label: "Start Date", value: project.startDate },
                                { label: "End Date", value: project.endDate },
                                { label: "Total Fee", value: formatCurrency(totalFee) },
                            ].map((detail, i) => (
                                <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{detail.label}</span>
                                    <span style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 400 }}>{detail.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div style={{ padding: "20px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                        <h3 style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "10px" }}>Description</h3>
                        <p style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 300, lineHeight: 1.6 }}>{project.description}</p>
                    </div>

                    {/* Budget overview */}
                    <div style={{ padding: "20px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                        <h3 style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "16px" }}>Budget by Phase</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            {project.phases.map((phase) => {
                                const pct = phase.budgetHours > 0 ? Math.round((phase.usedHours / phase.budgetHours) * 100) : 0;
                                return (
                                    <div key={phase.id}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{phase.name}</span>
                                            <span style={{ fontSize: "10px", color: pct > 100 ? "var(--danger)" : "var(--text-muted)", fontWeight: 500 }}>{pct}%</span>
                                        </div>
                                        <div style={{ height: "4px", borderRadius: "2px", background: "var(--bg-tertiary)" }}>
                                            <div style={{ height: "100%", borderRadius: "2px", width: `${Math.min(pct, 100)}%`, background: pct > 100 ? "var(--danger)" : pct > 80 ? "var(--warning)" : "var(--accent-primary)" }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
