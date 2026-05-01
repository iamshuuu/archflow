"use client";

import { useMemo, useState } from "react";
import { trpc } from "@/app/providers";
import { AlertTriangle, BarChart3, Briefcase, CheckCircle, Clock, Edit3, Mail, Phone, Plus, Search, Target, TrendingUp, Users, X } from "lucide-react";
import { useCurrencyFormatter } from "../useCurrencyFormatter";

type TeamView = "directory" | "capacity" | "coverage";

type MemberForm = {
    id?: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    title: string;
    costRate: string;
    billRate: string;
    targetUtil: string;
};

const emptyForm: MemberForm = {
    name: "",
    email: "",
    phone: "",
    role: "member",
    title: "",
    costRate: "45",
    billRate: "125",
    targetUtil: "75",
};

const roles = [
    { value: "owner", label: "Owner" },
    { value: "admin", label: "Admin" },
    { value: "manager", label: "Manager" },
    { value: "member", label: "Member" },
];
const titles = ["Principal", "Project Architect", "Design Lead", "Technical Lead", "Project Manager", "Design Architect", "Junior Architect", "Intern"];

const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
const todayIso = new Date().toISOString().slice(0, 10);
const weekAgoIso = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

export default function TeamPage() {
    const { formatCurrency } = useCurrencyFormatter();
    const utils = trpc.useUtils();
    const { data: rawMembers = [], isLoading } = trpc.team.list.useQuery();
    const { data: inviteContext } = trpc.team.inviteContext.useQuery();
    const canInvite = !!inviteContext?.canInvite;
    const { data: pendingInvites = [] } = trpc.team.pendingInvites.useQuery(undefined, { enabled: canInvite });
    const inviteMember = trpc.team.invite.useMutation({ onSuccess: (result) => { utils.team.pendingInvites.invalidate(); setLastInviteLink(result.inviteUrl || ""); } });
    const resendInvite = trpc.team.resendInvite.useMutation({ onSuccess: (result) => { utils.team.pendingInvites.invalidate(); setLastInviteLink(result.inviteUrl || ""); } });
    const revokeInvite = trpc.team.revokeInvite.useMutation({ onSuccess: () => utils.team.pendingInvites.invalidate() });
    const updateMember = trpc.team.update.useMutation({ onSuccess: () => utils.team.list.invalidate() });

    const [search, setSearch] = useState("");
    const [view, setView] = useState<TeamView>("directory");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<MemberForm>(emptyForm);
    const [lastInviteLink, setLastInviteLink] = useState("");

    const members = useMemo(() => (rawMembers as any[]).map((member) => {
        const entries = member.timeEntries || [];
        const assignments = member.phaseAssignments || [];
        const assignedTasks = member.tasks || [];
        const assignedDeliverables = member.deliverables || [];
        const billableHours = entries.filter((entry: any) => entry.billable).reduce((sum: number, entry: any) => sum + entry.hours, 0);
        const approvedBillableHours = entries.filter((entry: any) => entry.billable && entry.status === "approved").reduce((sum: number, entry: any) => sum + entry.hours, 0);
        const totalHours = entries.reduce((sum: number, entry: any) => sum + entry.hours, 0);
        const weekHours = entries.filter((entry: any) => entry.date >= weekAgoIso).reduce((sum: number, entry: any) => sum + entry.hours, 0);
        const plannedHours = assignments.reduce((sum: number, assignment: any) => sum + (assignment.plannedHours || 0), 0);
        const remainingHours = Math.max(0, plannedHours - totalHours);
        const utilization = Math.round((billableHours / 40) * 100);
        const plannedUtilization = Math.round((plannedHours / 40) * 100);
        const laborCost = entries.reduce((sum: number, entry: any) => sum + entry.hours * (member.costRate || 0), 0);
        const billableValue = entries.filter((entry: any) => entry.billable).reduce((sum: number, entry: any) => sum + entry.hours * (member.billRate || 0), 0);
        const estimatedRevenue = assignments.reduce((sum: number, assignment: any) => sum + (assignment.plannedHours || 0) * (assignment.billRate || member.billRate || 0), 0);
        const activeProjects = new Map<string, string>();
        assignments.forEach((assignment: any) => {
            const project = assignment.phase?.project;
            if (project && project.status !== "archived") activeProjects.set(project.id, project.name);
        });
        entries.forEach((entry: any) => {
            if (entry.project) activeProjects.set(entry.project.id, entry.project.name);
        });
        const openTasks = assignedTasks.filter((task: any) => task.status !== "done");
        const urgentTasks = openTasks.filter((task: any) => task.priority === "urgent" || task.dueDate < todayIso);
        const openDeliverables = assignedDeliverables.filter((deliverable: any) => !["completed", "approved"].includes(deliverable.status));
        const missingRecentTime = assignments.length > 0 && weekHours === 0;
        const risk = plannedUtilization > 110 || urgentTasks.length > 0 ? "high" : plannedUtilization > 90 || missingRecentTime ? "medium" : "low";

        return {
            id: member.id,
            name: member.name,
            email: member.email,
            phone: member.phone || "",
            role: member.role || "member",
            title: member.title || "Team member",
            costRate: member.costRate || 0,
            billRate: member.billRate || 0,
            targetUtil: member.targetUtil || 75,
            initials: initials(member.name),
            assignments,
            entries,
            billableHours,
            approvedBillableHours,
            totalHours,
            weekHours,
            plannedHours,
            remainingHours,
            utilization,
            plannedUtilization,
            laborCost,
            billableValue,
            estimatedRevenue,
            margin: billableValue - laborCost,
            activeProjects: Array.from(activeProjects.values()),
            openTasks,
            urgentTasks,
            openDeliverables,
            missingRecentTime,
            risk,
        };
    }), [rawMembers]);

    const filtered = members.filter((member) => {
        const q = search.toLowerCase();
        return !q || member.name.toLowerCase().includes(q) || member.title.toLowerCase().includes(q) || member.role.toLowerCase().includes(q) || member.activeProjects.some((project) => project.toLowerCase().includes(q));
    });

    const phaseCoverage = useMemo(() => {
        const phases = new Map<string, any>();
        members.forEach((member) => {
            member.assignments.forEach((assignment: any) => {
                const phase = assignment.phase;
                if (!phase?.project) return;
                const key = phase.id;
                const existing = phases.get(key) || {
                    id: phase.id,
                    phaseName: phase.name,
                    projectName: phase.project.name,
                    projectStatus: phase.project.status,
                    budgetHours: phase.budgetHours || 0,
                    plannedHours: 0,
                    assigned: [],
                    openTasks: 0,
                    openDeliverables: 0,
                };
                existing.plannedHours += assignment.plannedHours || 0;
                existing.assigned.push({ name: member.name, role: assignment.roleLabel || member.title, hours: assignment.plannedHours || 0 });
                existing.openTasks += (phase.tasks || []).filter((task: any) => task.assigneeId === member.id && task.status !== "done").length;
                existing.openDeliverables += (phase.deliverables || []).filter((deliverable: any) => deliverable.assigneeId === member.id && !["completed", "approved"].includes(deliverable.status)).length;
                phases.set(key, existing);
            });
        });
        return Array.from(phases.values()).sort((a, b) => a.projectName.localeCompare(b.projectName));
    }, [members]);

    const totals = {
        teamSize: members.length,
        plannedHours: members.reduce((sum, member) => sum + member.plannedHours, 0),
        weekHours: members.reduce((sum, member) => sum + member.weekHours, 0),
        billableValue: members.reduce((sum, member) => sum + member.billableValue, 0),
        laborCost: members.reduce((sum, member) => sum + member.laborCost, 0),
        highRisk: members.filter((member) => member.risk === "high").length,
        missingTime: members.filter((member) => member.missingRecentTime).length,
        unstaffedPhases: phaseCoverage.filter((phase) => phase.assigned.length === 0).length,
    };
    const avgUtilization = members.length > 0 ? Math.round(members.reduce((sum, member) => sum + member.utilization, 0) / members.length) : 0;
    const avgBillRate = members.length > 0 ? Math.round(members.reduce((sum, member) => sum + member.billRate, 0) / members.length) : 0;

    const riskColor = (risk: string) => risk === "high" ? "var(--danger)" : risk === "medium" ? "var(--warning)" : "var(--success)";
    const utilColor = (pct: number) => pct > 110 ? "var(--danger)" : pct >= 75 ? "var(--success)" : pct >= 50 ? "var(--accent-primary)" : "var(--warning)";

    const resetForm = () => setForm(emptyForm);
    const openCreate = () => { resetForm(); setShowForm(true); };
    const openEdit = (member: any) => {
        setForm({
            id: member.id,
            name: member.name,
            email: member.email,
            phone: member.phone,
            role: member.role,
            title: member.title,
            costRate: String(member.costRate),
            billRate: String(member.billRate),
            targetUtil: String(member.targetUtil),
        });
        setShowForm(true);
    };
    const saveMember = () => {
        if (!form.name.trim() || !form.email.trim() || !form.title.trim()) return;
        const payload = {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            role: form.role as "owner" | "admin" | "manager" | "member",
            title: form.title.trim(),
            costRate: Number(form.costRate || 0),
            billRate: Number(form.billRate || 0),
            targetUtil: Number(form.targetUtil || 0),
        };
        if (form.id) {
            updateMember.mutate({ id: form.id, name: payload.name, role: payload.role, title: payload.title, costRate: payload.costRate, billRate: payload.billRate, targetUtil: payload.targetUtil });
        } else {
            inviteMember.mutate(payload);
        }
        setShowForm(false);
        resetForm();
    };

    if (isLoading) {
        return <div style={{ padding: "80px 0", textAlign: "center", color: "var(--text-muted)" }}>Loading team...</div>;
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
                <div>
                    <h1 style={{ fontSize: "25px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Team</h1>
                    <p style={{ marginTop: "5px", fontSize: "13px", color: "var(--text-tertiary)", fontWeight: 300 }}>
                        People, phase staffing, capacity, bill rates, and execution ownership.
                    </p>
                </div>
                {canInvite && (
                    <button onClick={openCreate} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 18px", borderRadius: "8px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "12px", fontWeight: 700, cursor: "pointer", boxShadow: "var(--shadow-sm)" }}>
                        <Plus size={15} /> Invite Member
                    </button>
                )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "12px" }}>
                {[
                    { label: "Team Size", value: totals.teamSize, meta: `${(pendingInvites as any[]).length} pending invites`, icon: Users, color: "var(--accent-primary)" },
                    { label: "Avg Utilization", value: `${avgUtilization}%`, meta: `Target driven by billable time`, icon: Target, color: utilColor(avgUtilization) },
                    { label: "Planned Hours", value: `${totals.plannedHours}h`, meta: `${totals.weekHours}h logged this week`, icon: Clock, color: "var(--accent-gold)" },
                    { label: "Billable Value", value: formatCurrency(totals.billableValue), meta: `${formatCurrency(totals.laborCost)} labor cost`, icon: BarChart3, color: "var(--success)" },
                    { label: "Avg Bill Rate", value: formatCurrency(avgBillRate), meta: "Per hour", icon: Briefcase, color: "var(--info)" },
                    { label: "Risk Flags", value: totals.highRisk + totals.missingTime, meta: `${totals.highRisk} high risk / ${totals.missingTime} missing time`, icon: AlertTriangle, color: totals.highRisk > 0 ? "var(--danger)" : "var(--warning)" },
                ].map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} style={{ padding: "17px", borderRadius: "14px", background: "linear-gradient(135deg, var(--bg-card), var(--bg-warm))", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                <p style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{card.label}</p>
                                <Icon size={15} style={{ color: card.color }} />
                            </div>
                            <p style={{ fontSize: "21px", fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{card.value}</p>
                            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "5px" }}>{card.meta}</p>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "9px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", borderRadius: "10px", padding: "10px 12px", minWidth: "280px" }}>
                    <Search size={15} style={{ color: "var(--text-muted)" }} />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search people, roles, projects..." style={{ flex: 1, border: "none", background: "transparent", outline: "none", color: "var(--text-primary)", fontFamily: "inherit", fontSize: "13px" }} />
                </div>
                <div style={{ display: "flex", gap: "3px", padding: "3px", borderRadius: "10px", background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
                    {[
                        { key: "directory" as const, label: "Directory" },
                        { key: "capacity" as const, label: "Capacity" },
                        { key: "coverage" as const, label: "Project Coverage" },
                    ].map((tab) => (
                        <button key={tab.key} onClick={() => setView(tab.key)} style={{ padding: "8px 13px", borderRadius: "8px", border: "none", background: view === tab.key ? "var(--bg-card)" : "transparent", color: view === tab.key ? "var(--accent-primary)" : "var(--text-muted)", cursor: "pointer", fontSize: "12px", fontWeight: view === tab.key ? 700 : 500 }}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {lastInviteLink && (
                <div style={{ padding: "12px 14px", borderRadius: "12px", background: "rgba(176,138,48,0.1)", border: "1px solid rgba(176,138,48,0.25)", color: "var(--warning)", display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600 }}>Email provider is not configured, so use this dev invite link:</span>
                    <span style={{ fontSize: "11px", color: "var(--text-primary)", wordBreak: "break-all" }}>{lastInviteLink}</span>
                    <button onClick={() => navigator.clipboard?.writeText(lastInviteLink)} style={{ padding: "7px 10px", borderRadius: "8px", border: "none", background: "var(--accent-primary)", color: "white", cursor: "pointer", fontSize: "11px", fontWeight: 700 }}>Copy</button>
                </div>
            )}

            {view === "directory" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: "14px" }}>
                    {filtered.map((member) => (
                        <div key={member.id} style={{ padding: "20px", borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                                <div style={{ display: "flex", gap: "12px" }}>
                                    <div style={{ width: "46px", height: "46px", borderRadius: "14px", background: "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))", color: "white", display: "grid", placeItems: "center", fontWeight: 700 }}>{member.initials}</div>
                                    <div>
                                        <h3 style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 700 }}>{member.name}</h3>
                                        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{member.title}</p>
                                        <div style={{ display: "flex", gap: "7px", alignItems: "center", marginTop: "7px", flexWrap: "wrap" }}>
                                            <span style={{ fontSize: "10px", fontWeight: 700, padding: "4px 8px", borderRadius: "999px", color: "var(--accent-primary)", background: "rgba(176,122,74,0.1)", textTransform: "uppercase" }}>{member.role}</span>
                                            <a href={`mailto:${member.email}`} style={{ color: "var(--text-muted)", display: "flex" }}><Mail size={13} /></a>
                                            {member.phone && <span title={member.phone} style={{ color: "var(--text-muted)", display: "flex" }}><Phone size={13} /></span>}
                                        </div>
                                    </div>
                                </div>
                                {canInvite && <button onClick={() => openEdit(member)} style={{ padding: "8px", borderRadius: "8px", border: "1px solid var(--border-secondary)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}><Edit3 size={14} /></button>}
                            </div>

                            <div style={{ marginTop: "18px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "9px" }}>
                                {[
                                    { label: "Planned", value: `${member.plannedHours}h` },
                                    { label: "Actual", value: `${member.totalHours}h` },
                                    { label: "Billable", value: `${member.billableHours}h` },
                                    { label: "Util", value: `${member.utilization}%`, color: utilColor(member.utilization) },
                                ].map((metric) => (
                                    <div key={metric.label} style={{ padding: "10px", borderRadius: "10px", background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
                                        <p style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "5px" }}>{metric.label}</p>
                                        <p style={{ fontSize: "13px", fontWeight: 700, color: metric.color || "var(--text-primary)" }}>{metric.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div style={{ marginTop: "14px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                    <span>Capacity</span>
                                    <span>{member.plannedUtilization}% planned / target {member.targetUtil}%</span>
                                </div>
                                <div style={{ height: "8px", borderRadius: "999px", background: "var(--bg-tertiary)", overflow: "hidden" }}>
                                    <div style={{ width: `${Math.min(member.plannedUtilization, 130)}%`, height: "100%", background: utilColor(member.plannedUtilization), borderRadius: "999px" }} />
                                </div>
                            </div>

                            <div style={{ marginTop: "14px", display: "flex", justifyContent: "space-between", gap: "10px", alignItems: "center" }}>
                                <div>
                                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Projects</p>
                                    <p style={{ fontSize: "12px", color: "var(--text-primary)", marginTop: "3px" }}>{member.activeProjects.slice(0, 2).join(", ") || "No assignments"}{member.activeProjects.length > 2 ? ` +${member.activeProjects.length - 2}` : ""}</p>
                                </div>
                                <span style={{ fontSize: "10px", fontWeight: 800, color: riskColor(member.risk), background: `${riskColor(member.risk)}12`, padding: "5px 9px", borderRadius: "999px", textTransform: "uppercase" }}>{member.risk} risk</span>
                            </div>
                        </div>
                    ))}
                    {(pendingInvites as any[])
                        .filter((invite: any) => {
                            const q = search.toLowerCase();
                            return !q || invite.name.toLowerCase().includes(q) || invite.email.toLowerCase().includes(q) || invite.title.toLowerCase().includes(q);
                        })
                        .map((invite: any) => (
                            <div key={invite.id} style={{ padding: "20px", borderRadius: "16px", background: "var(--bg-card)", border: "1px dashed var(--border-secondary)", boxShadow: "var(--shadow-sm)", opacity: 0.68 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                                    <div style={{ display: "flex", gap: "12px" }}>
                                        <div style={{ width: "46px", height: "46px", borderRadius: "14px", background: "var(--bg-secondary)", color: "var(--accent-primary)", display: "grid", placeItems: "center", fontWeight: 800 }}>{initials(invite.name)}</div>
                                        <div>
                                            <h3 style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 700 }}>{invite.name}</h3>
                                            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>{invite.title || "Invited team member"}</p>
                                            <div style={{ display: "flex", gap: "7px", alignItems: "center", marginTop: "7px", flexWrap: "wrap" }}>
                                                <span style={{ fontSize: "10px", fontWeight: 800, padding: "4px 8px", borderRadius: "999px", color: "var(--warning)", background: "rgba(176,138,48,0.12)", textTransform: "uppercase" }}>Pending invite</span>
                                                <span style={{ fontSize: "10px", fontWeight: 700, padding: "4px 8px", borderRadius: "999px", color: "var(--accent-primary)", background: "rgba(176,122,74,0.1)", textTransform: "uppercase" }}>{invite.role}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: "16px", padding: "12px", borderRadius: "12px", background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
                                    <p style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{invite.email}</p>
                                    <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>Expires {new Date(invite.expiresAt).toLocaleDateString()}</p>
                                </div>
                                <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "14px" }}>
                                    <button onClick={() => resendInvite.mutate({ id: invite.id })} style={{ padding: "8px 11px", borderRadius: "8px", border: "1px solid var(--border-secondary)", background: "transparent", color: "var(--accent-primary)", cursor: "pointer", fontSize: "11px", fontWeight: 700 }}>Resend</button>
                                    <button onClick={() => revokeInvite.mutate({ id: invite.id })} style={{ padding: "8px 11px", borderRadius: "8px", border: "1px solid var(--border-secondary)", background: "transparent", color: "var(--danger)", cursor: "pointer", fontSize: "11px", fontWeight: 700 }}>Revoke</button>
                                </div>
                            </div>
                        ))}
                </div>
            )}

            {view === "capacity" && (
                <div style={{ borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ background: "var(--bg-warm)", borderBottom: "1px solid var(--border-primary)" }}>
                                {["Member", "Planned", "Actual", "Remaining", "Open Work", "Financials", "Health"].map((head) => <th key={head} style={{ padding: "12px 14px", textAlign: "left", fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{head}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((member) => (
                                <tr key={member.id} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                                    <td style={{ padding: "14px" }}><div style={{ display: "flex", gap: "10px", alignItems: "center" }}><div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--bg-warm)", color: "var(--accent-primary)", display: "grid", placeItems: "center", fontSize: "11px", fontWeight: 800 }}>{member.initials}</div><div><p style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>{member.name}</p><p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>{member.title}</p></div></div></td>
                                    <td style={{ padding: "14px", fontSize: "12px", color: "var(--text-primary)", fontWeight: 700 }}>{member.plannedHours}h <span style={{ color: utilColor(member.plannedUtilization), fontSize: "10px" }}>({member.plannedUtilization}%)</span></td>
                                    <td style={{ padding: "14px", fontSize: "12px", color: "var(--text-primary)" }}>{member.totalHours}h total<br /><span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{member.weekHours}h this week</span></td>
                                    <td style={{ padding: "14px", fontSize: "12px", color: member.remainingHours === 0 ? "var(--success)" : "var(--text-primary)", fontWeight: 700 }}>{member.remainingHours}h</td>
                                    <td style={{ padding: "14px", fontSize: "11px", color: "var(--text-secondary)" }}>{member.openTasks.length} tasks<br />{member.openDeliverables.length} deliverables</td>
                                    <td style={{ padding: "14px", fontSize: "11px", color: "var(--text-secondary)" }}>{formatCurrency(member.billableValue)} value<br /><span style={{ color: member.margin >= 0 ? "var(--success)" : "var(--danger)" }}>{formatCurrency(member.margin)} margin</span></td>
                                    <td style={{ padding: "14px" }}><span style={{ fontSize: "10px", fontWeight: 800, color: riskColor(member.risk), background: `${riskColor(member.risk)}12`, padding: "5px 9px", borderRadius: "999px", textTransform: "uppercase" }}>{member.risk}</span>{member.missingRecentTime && <p style={{ fontSize: "10px", color: "var(--warning)", marginTop: "5px" }}>Missing recent time</p>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {view === "coverage" && (
                <div style={{ display: "grid", gap: "12px" }}>
                    {phaseCoverage.length === 0 && <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", background: "var(--bg-card)", border: "1px dashed var(--border-secondary)", borderRadius: "16px" }}>No phase assignments yet. Assign members inside a project overview phase to build coverage.</div>}
                    {phaseCoverage.map((phase) => {
                        const coveragePct = phase.budgetHours > 0 ? Math.round((phase.plannedHours / phase.budgetHours) * 100) : 0;
                        const color = coveragePct > 110 ? "var(--danger)" : coveragePct >= 70 ? "var(--success)" : "var(--warning)";
                        return (
                            <div key={phase.id} style={{ padding: "18px", borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", alignItems: "flex-start", flexWrap: "wrap" }}>
                                    <div>
                                        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{phase.projectName}</p>
                                        <h3 style={{ fontSize: "15px", color: "var(--text-primary)", fontWeight: 700, marginTop: "3px" }}>{phase.phaseName}</h3>
                                    </div>
                                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                        <span style={{ fontSize: "10px", color, background: `${color}12`, borderRadius: "999px", padding: "5px 9px", fontWeight: 800 }}>{coveragePct}% covered</span>
                                        <span style={{ fontSize: "10px", color: "var(--text-muted)", background: "var(--bg-secondary)", borderRadius: "999px", padding: "5px 9px" }}>{phase.openTasks} open tasks / {phase.openDeliverables} deliverables</span>
                                    </div>
                                </div>
                                <div style={{ marginTop: "14px", height: "8px", borderRadius: "999px", background: "var(--bg-tertiary)", overflow: "hidden" }}>
                                    <div style={{ height: "100%", width: `${Math.min(coveragePct, 130)}%`, background: color, borderRadius: "999px" }} />
                                </div>
                                <div style={{ marginTop: "14px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                    {phase.assigned.map((person: any, index: number) => (
                                        <span key={`${person.name}-${index}`} style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "7px 10px", borderRadius: "999px", background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)", fontSize: "11px" }}>
                                            <span style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(176,122,74,0.12)", color: "var(--accent-primary)", display: "grid", placeItems: "center", fontSize: "9px", fontWeight: 800 }}>{initials(person.name)}</span>
                                            {person.name} / {person.role || "Team"} / {person.hours}h
                                        </span>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showForm && (
                <div style={{ position: "fixed", inset: 0, zIndex: 220, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowForm(false)}>
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.32)", backdropFilter: "blur(7px)" }} />
                    <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "560px", maxWidth: "calc(100vw - 32px)", maxHeight: "86vh", overflow: "auto", background: "var(--bg-card)", borderRadius: "16px", border: "1px solid var(--border-secondary)", boxShadow: "0 24px 70px rgba(0,0,0,0.18)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "22px 26px", borderBottom: "1px solid var(--border-primary)" }}>
                            <div><h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{form.id ? "Edit Team Member" : "Invite Team Member"}</h2><p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>Invitees receive a 7-day onboarding link and can only set their password/profile basics.</p></div>
                            <button onClick={() => setShowForm(false)} style={{ width: "32px", height: "32px", borderRadius: "8px", border: "1px solid var(--border-primary)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}><X size={15} /></button>
                        </div>
                        <div style={{ padding: "24px 26px", display: "grid", gap: "14px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Full name" style={fieldStyle} />
                                <input value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="Email" disabled={!!form.id} style={{ ...fieldStyle, opacity: form.id ? 0.55 : 1 }} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                <input value={form.phone} onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))} placeholder="Phone" style={fieldStyle} />
                                <select value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))} style={fieldStyle}>{roles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</select>
                            </div>
                            <select value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} style={fieldStyle}><option value="">Select title...</option>{titles.map((title) => <option key={title} value={title}>{title}</option>)}</select>
                            <div style={{ padding: "16px", borderRadius: "12px", background: "var(--bg-warm)", border: "1px solid var(--border-primary)" }}>
                                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "12px" }}>Billing & Capacity</p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                                    <input type="number" min="0" value={form.costRate} onChange={(e) => setForm((prev) => ({ ...prev, costRate: e.target.value }))} placeholder="Cost/hr" style={fieldStyle} />
                                    <input type="number" min="0" value={form.billRate} onChange={(e) => setForm((prev) => ({ ...prev, billRate: e.target.value }))} placeholder="Bill/hr" style={fieldStyle} />
                                    <input type="number" min="0" max="100" value={form.targetUtil} onChange={(e) => setForm((prev) => ({ ...prev, targetUtil: e.target.value }))} placeholder="Target %" style={fieldStyle} />
                                </div>
                            </div>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                                <button onClick={() => setShowForm(false)} style={{ padding: "10px 16px", borderRadius: "8px", border: "1px solid var(--border-secondary)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}>Cancel</button>
                                <button onClick={saveMember} disabled={!form.name.trim() || !form.email.trim() || !form.title.trim() || inviteMember.isPending || updateMember.isPending} style={{ padding: "10px 18px", borderRadius: "8px", border: "none", background: "var(--accent-primary)", color: "white", fontWeight: 700, cursor: "pointer", opacity: !form.name.trim() || !form.email.trim() || !form.title.trim() ? 0.55 : 1 }}>{form.id ? "Save Member" : "Send Invite"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid var(--border-secondary)",
    background: "var(--bg-card)",
    color: "var(--text-primary)",
    fontSize: "13px",
    fontFamily: "inherit",
    outline: "none",
};
