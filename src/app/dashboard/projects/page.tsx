"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Plus,
    Search,
    Filter,
    LayoutGrid,
    List,
    MoreHorizontal,
    Calendar,
    Users,
    DollarSign,
    Kanban,
    Copy,
    GripVertical,
    Trash2,
} from "lucide-react";
import { trpc } from "@/app/providers";

type ProjectStatus = "active" | "pipeline" | "on-hold" | "completed" | "archived";

const statusConfig: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
    active: { label: "Active", color: "var(--success)", bg: "rgba(90,122,70,0.08)" },
    pipeline: { label: "Pipeline", color: "var(--info)", bg: "rgba(90,122,144,0.08)" },
    "on-hold": { label: "On Hold", color: "var(--warning)", bg: "rgba(176,138,48,0.08)" },
    completed: { label: "Completed", color: "var(--text-muted)", bg: "var(--bg-secondary)" },
    archived: { label: "Archived", color: "var(--text-muted)", bg: "var(--bg-secondary)" },
};

const pipelineStages = [
    { key: "lead", label: "Lead", color: "var(--info)" },
    { key: "proposal", label: "Proposal", color: "var(--accent-primary)" },
    { key: "negotiation", label: "Negotiation", color: "var(--warning)" },
    { key: "won", label: "Won", color: "var(--success)" },
    { key: "lost", label: "Lost", color: "var(--danger)" },
];

const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);

export default function ProjectsPage() {
    const [viewMode, setViewMode] = useState<"list" | "grid" | "pipeline">("list");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [search, setSearch] = useState("");
    const [showNewProject, setShowNewProject] = useState(false);
    const [showFromTemplate, setShowFromTemplate] = useState(false);
    const [showTemplateManager, setShowTemplateManager] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [filterTypes, setFilterTypes] = useState<string[]>([]);
    const [activeRowMenu, setActiveRowMenu] = useState<string | null>(null);

    const utils = trpc.useUtils();
    const { data: rawProjects = [], isLoading } = trpc.project.list.useQuery();
    const updateStage = trpc.project.updatePipelineStage.useMutation({
        onSuccess: () => utils.project.list.invalidate(),
    });

    const projects = rawProjects.map((p: any) => ({
        id: p.id,
        name: p.name,
        client: p.client?.name || "Unknown",
        type: p.type || "Commercial",
        status: (p.status || "active") as ProjectStatus,
        phase: p.phases?.[0]?.name || p.phase || "—",
        progress: p.progress ?? 0,
        budgetUsed: p.budgetUsed ?? 0,
        contractValue: p.contractValue ?? 0,
        startDate: p.startDate || "",
        endDate: p.endDate || "",
        pipelineStage: (p as any).pipelineStage || "lead",
    }));

    const allTypes = Array.from(new Set(projects.map((p: any) => p.type)));
    const toggleType = (t: string) => setFilterTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

    const filtered = projects.filter((p: any) => {
        if (statusFilter !== "all" && p.status !== statusFilter) return false;
        if (filterTypes.length > 0 && !filterTypes.includes(p.type)) return false;
        if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.client.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
    });

    const statusCounts = {
        all: projects.length,
        active: projects.filter((p: any) => p.status === "active").length,
        pipeline: projects.filter((p: any) => p.status === "pipeline").length,
        "on-hold": projects.filter((p: any) => p.status === "on-hold").length,
        completed: projects.filter((p: any) => p.status === "completed").length,
    };

    if (isLoading) {
        return (
            <div style={{ padding: "80px 0", textAlign: "center" }}>
                <p style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 300 }}>Loading projects...</p>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Projects</h1>
                    <p style={{ marginTop: "4px", fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 300 }}>
                        {projects.length} projects · {statusCounts.active} active
                    </p>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                    <button onClick={() => setShowFromTemplate(true)}
                        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", color: "var(--text-secondary)", fontSize: "12px", fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}>
                        <Copy size={14} /> From Template
                    </button>
                    <button onClick={() => setShowTemplateManager(true)}
                        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", color: "var(--text-secondary)", fontSize: "12px", fontWeight: 500, cursor: "pointer", transition: "all 0.2s" }}>
                        Templates
                    </button>
                    <button onClick={() => setShowNewProject(true)}
                        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "13px", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s" }}
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(176,122,74,0.2)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}>
                        <Plus size={16} /> New Project
                    </button>
                </div>
            </div>

            {/* Status tabs */}
            <div style={{ display: "flex", gap: "2px", marginBottom: "20px", background: "var(--bg-secondary)", borderRadius: "8px", padding: "3px", width: "fit-content" }}>
                {Object.entries(statusCounts).map(([key, count]) => (
                    <button key={key} onClick={() => setStatusFilter(key)}
                        style={{ padding: "7px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: statusFilter === key ? 500 : 400, background: statusFilter === key ? "var(--bg-card)" : "transparent", color: statusFilter === key ? "var(--text-primary)" : "var(--text-muted)", boxShadow: statusFilter === key ? "var(--shadow-sm)" : "none", transition: "all 0.15s", display: "flex", alignItems: "center", gap: "6px", textTransform: "capitalize" }}>
                        {key === "all" ? "All" : key.replace("-", " ")}
                        <span style={{ fontSize: "10px", color: statusFilter === key ? "var(--accent-primary)" : "var(--text-muted)", fontWeight: 500 }}>{count}</span>
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", borderRadius: "6px", padding: "8px 12px", maxWidth: "300px", flex: 1 }}>
                        <Search size={14} style={{ color: "var(--text-muted)" }} />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects or clients..." style={{ flex: 1, border: "none", background: "transparent", fontSize: "13px", color: "var(--text-primary)", outline: "none", fontFamily: "inherit" }} />
                    </div>
                    <div style={{ position: "relative" }}>
                        <button onClick={() => setShowFilter(!showFilter)}
                            style={{ padding: "8px 14px", borderRadius: "6px", border: `1px solid ${showFilter || filterTypes.length > 0 ? "var(--accent-primary)" : "var(--border-primary)"}`, background: "var(--bg-card)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: showFilter || filterTypes.length > 0 ? "var(--accent-primary)" : "var(--text-tertiary)", transition: "all 0.15s" }}>
                            <Filter size={13} /> Filter {filterTypes.length > 0 && <span style={{ fontSize: "9px", background: "var(--accent-primary)", color: "white", borderRadius: "50%", width: "16px", height: "16px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600 }}>{filterTypes.length}</span>}
                        </button>
                        {showFilter && (
                            <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50, minWidth: "200px", background: "var(--bg-card)", borderRadius: "8px", border: "1px solid var(--border-secondary)", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: "10px" }}>
                                <p style={{ fontSize: "9px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px", padding: "0 4px" }}>Project Type</p>
                                {allTypes.map((t) => (
                                    <label key={t} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 4px", borderRadius: "4px", cursor: "pointer", fontSize: "12px", color: "var(--text-secondary)" }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-warm)"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                                        <input type="checkbox" checked={filterTypes.includes(t)} onChange={() => toggleType(t)} style={{ accentColor: "var(--accent-primary)", cursor: "pointer" }} />
                                        {t}
                                    </label>
                                ))}
                                {filterTypes.length > 0 && (
                                    <button onClick={() => setFilterTypes([])} style={{ marginTop: "6px", width: "100%", padding: "6px", borderRadius: "4px", border: "none", background: "var(--bg-secondary)", fontSize: "11px", color: "var(--text-muted)", cursor: "pointer" }}>Clear filters</button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ display: "flex", gap: "2px", background: "var(--bg-secondary)", borderRadius: "6px", padding: "2px" }}>
                    {[
                        { mode: "list" as const, icon: List },
                        { mode: "grid" as const, icon: LayoutGrid },
                        { mode: "pipeline" as const, icon: Kanban },
                    ].map(({ mode, icon: Icon }) => (
                        <button key={mode} onClick={() => setViewMode(mode)}
                            style={{ padding: "6px 8px", borderRadius: "4px", border: "none", cursor: "pointer", background: viewMode === mode ? "var(--bg-card)" : "transparent", color: viewMode === mode ? "var(--text-primary)" : "var(--text-muted)", boxShadow: viewMode === mode ? "var(--shadow-sm)" : "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Icon size={15} />
                        </button>
                    ))}
                </div>
            </div>

            {/* List view */}
            {viewMode === "list" && (
                <div style={{ borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                                {["Project", "Client", "Type", "Phase", "Progress", "Budget", "Contract", "Status", ""].map((h) => (
                                    <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((proj: any) => {
                                const sc = statusConfig[proj.status as ProjectStatus] || statusConfig.active;
                                return (
                                    <tr key={proj.id} style={{ borderBottom: "1px solid var(--border-primary)", cursor: "pointer" }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-warm)"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                                        <td style={{ padding: "14px" }}><Link href={`/dashboard/projects/${proj.id}`} style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", textDecoration: "none" }}>{proj.name}</Link></td>
                                        <td style={{ padding: "14px", fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 300 }}>{proj.client}</td>
                                        <td style={{ padding: "14px" }}><span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "3px", background: "var(--bg-secondary)", color: "var(--text-muted)", fontWeight: 400 }}>{proj.type}</span></td>
                                        <td style={{ padding: "14px", fontSize: "12px", color: "var(--text-secondary)" }}>{proj.phase}</td>
                                        <td style={{ padding: "14px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <div style={{ width: "64px", height: "4px", borderRadius: "2px", background: "var(--bg-tertiary)" }}>
                                                    <div style={{ height: "100%", borderRadius: "2px", width: `${proj.progress}%`, background: "var(--accent-primary)" }} />
                                                </div>
                                                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400, width: "28px" }}>{proj.progress}%</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: "14px" }}><span style={{ fontSize: "12px", fontWeight: 500, color: proj.budgetUsed > 95 ? "var(--danger)" : proj.budgetUsed > 80 ? "var(--warning)" : "var(--text-secondary)" }}>{proj.budgetUsed}%</span></td>
                                        <td style={{ padding: "14px", fontSize: "12px", color: "var(--text-secondary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{formatCurrency(proj.contractValue)}</td>
                                        <td style={{ padding: "14px" }}><span style={{ fontSize: "9px", fontWeight: 600, padding: "3px 8px", borderRadius: "3px", textTransform: "uppercase", letterSpacing: "0.04em", color: sc.color, background: sc.bg }}>{sc.label}</span></td>
                                        <td style={{ padding: "14px", position: "relative" }}>
                                            <button onClick={(e) => { e.stopPropagation(); setActiveRowMenu(activeRowMenu === proj.id ? null : proj.id); }}
                                                style={{ background: "none", border: "none", cursor: "pointer", color: activeRowMenu === proj.id ? "var(--accent-primary)" : "var(--text-muted)", padding: "4px" }}>
                                                <MoreHorizontal size={14} />
                                            </button>
                                            {activeRowMenu === proj.id && (
                                                <div style={{ position: "absolute", right: "14px", top: "42px", zIndex: 50, minWidth: "150px", background: "var(--bg-card)", borderRadius: "8px", border: "1px solid var(--border-secondary)", boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: "4px" }}>
                                                    {["View Details", "Edit Project", "Archive", "Delete"].map((action) => (
                                                        <button key={action} onClick={(e) => { e.stopPropagation(); setActiveRowMenu(null); }}
                                                            style={{ width: "100%", padding: "8px 12px", border: "none", background: "transparent", textAlign: "left", cursor: "pointer", fontSize: "12px", color: action === "Delete" ? "var(--danger)" : "var(--text-secondary)", borderRadius: "4px" }}
                                                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-warm)"; }}
                                                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>{action}</button>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filtered.length === 0 && <div style={{ padding: "48px", textAlign: "center" }}><p style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 300 }}>No projects match your filters.</p></div>}
                </div>
            )}

            {/* Grid view */}
            {viewMode === "grid" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                    {filtered.map((proj: any) => {
                        const sc = statusConfig[proj.status as ProjectStatus] || statusConfig.active;
                        return (
                            <Link key={proj.id} href={`/dashboard/projects/${proj.id}`} style={{ textDecoration: "none" }}>
                                <div style={{ padding: "20px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)", transition: "all 0.2s", cursor: "pointer" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.borderColor = "var(--border-secondary)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-card)"; e.currentTarget.style.borderColor = "var(--border-primary)"; }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div>
                                            <h3 style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)" }}>{proj.name}</h3>
                                            <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 300, marginTop: "2px" }}>{proj.client}</p>
                                        </div>
                                        <span style={{ fontSize: "9px", fontWeight: 600, padding: "3px 8px", borderRadius: "3px", textTransform: "uppercase", color: sc.color, background: sc.bg, flexShrink: 0 }}>{sc.label}</span>
                                    </div>
                                    <div style={{ marginTop: "16px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{proj.phase}</span>
                                            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>{proj.progress}%</span>
                                        </div>
                                        <div style={{ height: "4px", borderRadius: "2px", background: "var(--bg-tertiary)" }}>
                                            <div style={{ height: "100%", borderRadius: "2px", width: `${proj.progress}%`, background: "var(--accent-primary)", transition: "width 0.6s" }} />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: "16px", display: "flex", gap: "16px", borderTop: "1px solid var(--border-primary)", paddingTop: "14px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                            <DollarSign size={12} style={{ color: "var(--text-muted)" }} />
                                            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{formatCurrency(proj.contractValue)}</span>
                                        </div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                            <Calendar size={12} style={{ color: "var(--text-muted)" }} />
                                            <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{proj.endDate || "—"}</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Pipeline / Kanban view */}
            {viewMode === "pipeline" && (
                <div style={{ display: "flex", gap: "14px", overflowX: "auto", paddingBottom: "16px" }}>
                    {pipelineStages.map(stage => {
                        const stageProjects = filtered.filter((p: any) => p.pipelineStage === stage.key);
                        const stageTotal = stageProjects.reduce((s: number, p: any) => s + p.contractValue, 0);
                        return (
                            <div key={stage.key} style={{ minWidth: "260px", flex: "1", display: "flex", flexDirection: "column" }}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => {
                                    const id = e.dataTransfer.getData("projectId");
                                    if (id) updateStage.mutate({ id, pipelineStage: stage.key });
                                }}>
                                <div style={{ padding: "12px 14px", borderRadius: "8px 8px 0 0", background: "var(--bg-card)", border: "1px solid var(--border-primary)", borderBottom: `2px solid ${stage.color}` }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{stage.label}</span>
                                        <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 500 }}>{stageProjects.length}</span>
                                    </div>
                                    <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{formatCurrency(stageTotal)}</p>
                                </div>
                                <div style={{ flex: 1, padding: "8px", background: "var(--bg-warm)", borderRadius: "0 0 8px 8px", border: "1px solid var(--border-primary)", borderTop: "none", display: "flex", flexDirection: "column", gap: "8px", minHeight: "200px" }}>
                                    {stageProjects.map((proj: any) => {
                                        const sc = statusConfig[proj.status as ProjectStatus] || statusConfig.active;
                                        return (
                                            <div key={proj.id} draggable
                                                onDragStart={e => e.dataTransfer.setData("projectId", proj.id)}
                                                style={{ padding: "14px", borderRadius: "8px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", cursor: "grab", transition: "all 0.15s" }}
                                                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.06)"; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                                    <Link href={`/dashboard/projects/${proj.id}`} style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)", textDecoration: "none" }}>{proj.name}</Link>
                                                    <GripVertical size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                                                </div>
                                                <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>{proj.client}</p>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                                                    <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{formatCurrency(proj.contractValue)}</span>
                                                    <span style={{ fontSize: "9px", fontWeight: 600, padding: "2px 6px", borderRadius: "3px", textTransform: "uppercase", color: sc.color, background: sc.bg }}>{sc.label}</span>
                                                </div>
                                                <div style={{ marginTop: "8px", height: "3px", borderRadius: "2px", background: "var(--bg-tertiary)" }}>
                                                    <div style={{ height: "100%", borderRadius: "2px", width: `${proj.progress}%`, background: stage.color, transition: "width 0.3s" }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {stageProjects.length === 0 && (
                                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
                                            <p style={{ fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>Drop projects here</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} />}
            {showFromTemplate && <CreateFromTemplateModal onClose={() => setShowFromTemplate(false)} />}
            {showTemplateManager && <TemplateManagerModal onClose={() => setShowTemplateManager(false)} />}
        </div>
    );
}

/* ─── New Project Modal ─── */

function NewProjectModal({ onClose }: { onClose: () => void }) {
    const [form, setForm] = useState({ name: "", clientId: "", type: "Commercial", contractValue: "", startDate: "", endDate: "", description: "" });
    const up = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));
    const { data: clients = [] } = trpc.project.clients.useQuery();
    const utils = trpc.useUtils();
    const createProject = trpc.project.create.useMutation({ onSuccess: () => { utils.project.list.invalidate(); onClose(); } });
    const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", outline: "none", transition: "border-color 0.2s", fontFamily: "inherit" };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} />
            <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: "520px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-secondary)", boxShadow: "0 20px 60px rgba(0,0,0,0.12)", maxHeight: "90vh", overflow: "auto" }}>
                <div style={{ padding: "24px 24px 0" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>New Project</h2>
                    <p style={{ marginTop: "4px", fontSize: "13px", color: "var(--text-muted)", fontWeight: 300 }}>Create a new project and add phases later.</p>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); createProject.mutate({ name: form.name, clientId: form.clientId, type: form.type, contractValue: parseFloat(form.contractValue.replace(/[^0-9.]/g, "")) || 0, startDate: form.startDate, endDate: form.endDate }); }} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Project Name *</label>
                        <input type="text" value={form.name} onChange={(e) => up("name", e.target.value)} placeholder="e.g. Meridian Tower" required style={inputStyle} onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-secondary)"; }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Client *</label>
                            <select value={form.clientId} onChange={(e) => up("clientId", e.target.value)} required style={{ ...inputStyle, cursor: "pointer" }}><option value="">Select client...</option>{clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Project Type</label>
                            <select value={form.type} onChange={(e) => up("type", e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>{["Commercial", "Residential", "Civic", "Healthcare", "Education", "Industrial", "Mixed-Use", "Interior"].map((t) => <option key={t} value={t}>{t}</option>)}</select>
                        </div>
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Contract Value</label>
                        <input type="text" value={form.contractValue} onChange={(e) => up("contractValue", e.target.value)} placeholder="$0" style={inputStyle} onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; }} onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-secondary)"; }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                        <div><label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Start Date</label><input type="date" value={form.startDate} onChange={(e) => up("startDate", e.target.value)} style={inputStyle} /></div>
                        <div><label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>End Date</label><input type="date" value={form.endDate} onChange={(e) => up("endDate", e.target.value)} style={inputStyle} /></div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "8px", borderTop: "1px solid var(--border-primary)" }}>
                        <button type="button" onClick={onClose} style={{ padding: "10px 20px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "transparent", fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer" }}>Cancel</button>
                        <button type="submit" disabled={createProject.isPending} style={{ padding: "10px 24px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "13px", fontWeight: 500, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.04em", opacity: createProject.isPending ? 0.7 : 1 }}>{createProject.isPending ? "Creating..." : "Create Project"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Create From Template Modal ─── */

function CreateFromTemplateModal({ onClose }: { onClose: () => void }) {
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const [form, setForm] = useState({ name: "", clientId: "", contractValue: "", startDate: "", endDate: "" });
    const up = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));
    const { data: templates = [] } = trpc.project.listTemplates.useQuery();
    const { data: clients = [] } = trpc.project.clients.useQuery();
    const utils = trpc.useUtils();
    const createFromTemplate = trpc.project.createFromTemplate.useMutation({ onSuccess: () => { utils.project.list.invalidate(); onClose(); } });
    const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", outline: "none", fontFamily: "inherit" };
    const selectedTpl = (templates as any[]).find((t: any) => t.id === selectedTemplate);

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} />
            <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: "520px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-secondary)", boxShadow: "0 20px 60px rgba(0,0,0,0.12)", maxHeight: "90vh", overflow: "auto" }}>
                <div style={{ padding: "24px 24px 0" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Create from Template</h2>
                    <p style={{ marginTop: "4px", fontSize: "13px", color: "var(--text-muted)", fontWeight: 300 }}>Start with pre-configured phases from a template.</p>
                </div>
                <form onSubmit={(e) => { e.preventDefault(); if (!selectedTemplate) return; createFromTemplate.mutate({ templateId: selectedTemplate, name: form.name, clientId: form.clientId, contractValue: parseFloat(form.contractValue.replace(/[^0-9.]/g, "")) || 0, startDate: form.startDate, endDate: form.endDate }); }} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Template *</label>
                        <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} required style={{ ...inputStyle, cursor: "pointer" }}>
                            <option value="">Select a template...</option>
                            {(templates as any[]).map((t: any) => <option key={t.id} value={t.id}>{t.name} — {t.defaultType}</option>)}
                        </select>
                        {selectedTpl && (
                            <div style={{ marginTop: "8px", padding: "10px", borderRadius: "6px", background: "var(--bg-warm)", fontSize: "11px", color: "var(--text-muted)" }}>
                                <p style={{ marginBottom: "4px" }}>{selectedTpl.description || "No description"}</p>
                                <p><strong>Phases:</strong> {(() => { try { return JSON.parse(selectedTpl.defaultPhases).join(", ") || "None"; } catch { return "None"; } })()}</p>
                            </div>
                        )}
                    </div>
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Project Name *</label>
                        <input type="text" value={form.name} onChange={(e) => up("name", e.target.value)} placeholder="e.g. Meridian Tower" required style={inputStyle} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Client *</label>
                            <select value={form.clientId} onChange={(e) => up("clientId", e.target.value)} required style={{ ...inputStyle, cursor: "pointer" }}><option value="">Select client...</option>{clients.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Contract Value</label>
                            <input type="text" value={form.contractValue} onChange={(e) => up("contractValue", e.target.value)} placeholder="$0" style={inputStyle} />
                        </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                        <div><label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>Start Date</label><input type="date" value={form.startDate} onChange={(e) => up("startDate", e.target.value)} style={inputStyle} /></div>
                        <div><label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>End Date</label><input type="date" value={form.endDate} onChange={(e) => up("endDate", e.target.value)} style={inputStyle} /></div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "8px", borderTop: "1px solid var(--border-primary)" }}>
                        <button type="button" onClick={onClose} style={{ padding: "10px 20px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "transparent", fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer" }}>Cancel</button>
                        <button type="submit" disabled={createFromTemplate.isPending || !selectedTemplate} style={{ padding: "10px 24px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "13px", fontWeight: 500, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.04em", opacity: createFromTemplate.isPending || !selectedTemplate ? 0.5 : 1 }}>{createFromTemplate.isPending ? "Creating..." : "Create from Template"}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ─── Template Manager Modal ─── */

function TemplateManagerModal({ onClose }: { onClose: () => void }) {
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newPhases, setNewPhases] = useState("");
    const [newType, setNewType] = useState("Commercial");
    const { data: templates = [] } = trpc.project.listTemplates.useQuery();
    const utils = trpc.useUtils();
    const createTemplate = trpc.project.createTemplate.useMutation({ onSuccess: () => { utils.project.listTemplates.invalidate(); setNewName(""); setNewDesc(""); setNewPhases(""); } });
    const deleteTemplate = trpc.project.deleteTemplate.useMutation({ onSuccess: () => utils.project.listTemplates.invalidate() });
    const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", outline: "none", fontFamily: "inherit" };

    return (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} />
            <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: "580px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-secondary)", boxShadow: "0 20px 60px rgba(0,0,0,0.12)", maxHeight: "90vh", overflow: "auto" }}>
                <div style={{ padding: "24px 24px 0" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Project Templates</h2>
                    <p style={{ marginTop: "4px", fontSize: "13px", color: "var(--text-muted)", fontWeight: 300 }}>Manage reusable project templates with pre-configured phases.</p>
                </div>
                <div style={{ padding: "24px" }}>
                    {/* Existing templates */}
                    {(templates as any[]).length > 0 && (
                        <div style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                            {(templates as any[]).map((t: any) => {
                                let phases: string[] = [];
                                try { phases = JSON.parse(t.defaultPhases); } catch { }
                                return (
                                    <div key={t.id} style={{ padding: "14px", borderRadius: "8px", background: "var(--bg-warm)", border: "1px solid var(--border-primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div>
                                            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{t.name}</p>
                                            <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>{t.description || "No description"} · {t.defaultType} · {phases.length} phases</p>
                                            {phases.length > 0 && <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>Phases: {phases.join(", ")}</p>}
                                        </div>
                                        <button onClick={() => deleteTemplate.mutate({ id: t.id })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", padding: "4px" }}><Trash2 size={14} /></button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {/* Create new template */}
                    <div style={{ padding: "16px", borderRadius: "8px", border: "1px dashed var(--border-secondary)", background: "var(--bg-secondary)" }}>
                        <p style={{ fontSize: "11px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "12px" }}>New Template</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Template name" style={inputStyle} />
                            <input type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)" style={inputStyle} />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <input type="text" value={newPhases} onChange={(e) => setNewPhases(e.target.value)} placeholder="Phases: SD, DD, CD, CA" style={inputStyle} />
                                <select value={newType} onChange={(e) => setNewType(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>{["Commercial", "Residential", "Civic", "Healthcare", "Education", "Industrial", "Mixed-Use", "Interior"].map((t) => <option key={t} value={t}>{t}</option>)}</select>
                            </div>
                            <button onClick={() => { if (!newName.trim()) return; const phaseArr = newPhases.split(",").map(s => s.trim()).filter(Boolean); createTemplate.mutate({ name: newName, description: newDesc, defaultPhases: JSON.stringify(phaseArr), defaultType: newType }); }}
                                disabled={!newName.trim() || createTemplate.isPending}
                                style={{ padding: "10px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "12px", fontWeight: 500, cursor: "pointer", opacity: !newName.trim() ? 0.5 : 1 }}>
                                {createTemplate.isPending ? "Creating..." : "Create Template"}
                            </button>
                        </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
                        <button onClick={onClose} style={{ padding: "10px 20px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "transparent", fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer" }}>Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
