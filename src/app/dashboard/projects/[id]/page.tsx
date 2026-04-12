"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { trpc } from "@/app/providers";
import {
    ArrowLeft,
    Clock,
    DollarSign,
    Users,
    ChevronRight,
    Plus,
    CheckCircle2,
    AlertTriangle,
    TrendingUp,
    FileText,
    Edit3,
    Loader2,
    CalendarRange,
    Receipt,
    ListTodo,
    Trash2,
    Circle,
    CircleDot,
    CircleCheck,
    Eye,
    BarChart3,
    Package,
    Paperclip,
    X,
} from "lucide-react";
import GanttChart from "@/app/components/GanttChart";
import { useCurrencyFormatter } from "../../useCurrencyFormatter";

/* ─── Types ─── */

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
    milestones: { id: string; name: string; done: boolean; date: string }[];
    assignments: { id: string; roleLabel: string; plannedHours: number; user: { id: string; name: string; title: string; billRate: number; costRate: number } }[];
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

const phaseStatusColors: Record<string, { dot: string; text: string; bg: string }> = {
    completed: { dot: "var(--success)", text: "var(--success)", bg: "rgba(90,122,70,0.06)" },
    active: { dot: "var(--accent-primary)", text: "var(--accent-primary)", bg: "rgba(176,122,74,0.06)" },
    upcoming: { dot: "var(--text-muted)", text: "var(--text-muted)", bg: "var(--bg-warm)" },
};

export default function ProjectDetailPage() {
    const params = useParams();
    const projectId = params?.id as string;
    const { formatCurrency } = useCurrencyFormatter();
    const { data: rawProject, isLoading } = trpc.project.getById.useQuery({ id: projectId }, { enabled: !!projectId });

    const [activePhase, setActivePhase] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"overview" | "gantt" | "budget" | "tasks" | "deliverables" | "files" | "expenses">("overview");
    const [ganttZoom, setGanttZoom] = useState<"day" | "week" | "month" | "quarter" | "year">("month");
    const [showNewTask, setShowNewTask] = useState(false);
    const [showEditProject, setShowEditProject] = useState(false);
    const [showAddPhase, setShowAddPhase] = useState(false);
    const [showAddFile, setShowAddFile] = useState(false);
    const [showAddDeliverable, setShowAddDeliverable] = useState(false);
    const [newPhase, setNewPhase] = useState({ name: "", budgetHours: "", budgetAmount: "", feeType: "hourly", startDate: "", endDate: "" });
    const [newFile, setNewFile] = useState({ name: "", url: "", fileType: "other", phaseId: "" });
    const [newDeliverable, setNewDeliverable] = useState({ title: "", description: "", dueDate: "", phaseId: "", assigneeId: "" });
    const [editForm, setEditForm] = useState({ name: "", type: "", contractValue: "", startDate: "", endDate: "", status: "" });
    const [newTask, setNewTask] = useState({ title: "", phaseId: "", assigneeId: "", dueDate: "" });
    const [budgetDrafts, setBudgetDrafts] = useState<Record<string, { name: string; budgetHours: string; budgetAmount: string; feeType: string; startDate: string; endDate: string }>>({});
    const [savingBudgetPhaseId, setSavingBudgetPhaseId] = useState<string | null>(null);
    const [milestoneDrafts, setMilestoneDrafts] = useState<Record<string, { name: string; date: string }>>({});
    const [phaseStaffDrafts, setPhaseStaffDrafts] = useState<Record<string, { userId: string; roleLabel: string; plannedHours: string }>>({});

    const utils = trpc.useUtils();

    // Fetch project expenses
    const { data: projectExpenses = [] } = trpc.expense.list.useQuery(
        { projectId: projectId },
        { enabled: !!projectId }
    );

    // Fetch tasks
    const { data: tasks = [] } = trpc.project.listTasks.useQuery({ projectId }, { enabled: !!projectId });
    const { data: teamMembers = [] } = trpc.team.list.useQuery();
    const { data: budgetData } = trpc.project.budgetControl.useQuery({ projectId }, { enabled: !!projectId });
    const { data: files = [] } = trpc.project.listFiles.useQuery({ projectId }, { enabled: !!projectId });
    const { data: deliverables = [] } = trpc.project.listDeliverables.useQuery({ projectId }, { enabled: !!projectId });

    const createTask = trpc.project.createTask.useMutation({ onSuccess: () => { utils.project.listTasks.invalidate(); setNewTask({ title: "", phaseId: "", assigneeId: "", dueDate: "" }); setShowNewTask(false); } });
    const updateTask = trpc.project.updateTask.useMutation({ onSuccess: () => utils.project.listTasks.invalidate() });
    const deleteTask = trpc.project.deleteTask.useMutation({ onSuccess: () => utils.project.listTasks.invalidate() });
    const addPhaseMut = trpc.project.addPhase.useMutation({ onSuccess: () => { utils.project.getById.invalidate(); setNewPhase({ name: "", budgetHours: "", budgetAmount: "", feeType: "hourly", startDate: "", endDate: "" }); setShowAddPhase(false); } });
    const deletePhaseMut = trpc.project.deletePhase.useMutation({ onSuccess: () => utils.project.getById.invalidate() });
    const updatePhaseMut = trpc.project.updatePhase.useMutation({
        onSuccess: () => {
            utils.project.getById.invalidate();
            utils.project.schedule.invalidate();
            utils.project.budgetControl.invalidate();
        },
    });
    const updateProject = trpc.project.update.useMutation({ onSuccess: () => { utils.project.getById.invalidate(); setShowEditProject(false); } });
    const addFileMut = trpc.project.addFile.useMutation({ onSuccess: () => { utils.project.listFiles.invalidate(); setNewFile({ name: "", url: "", fileType: "other", phaseId: "" }); setShowAddFile(false); } });
    const deleteFileMut = trpc.project.deleteFile.useMutation({ onSuccess: () => utils.project.listFiles.invalidate() });
    const createDeliverableMut = trpc.project.createDeliverable.useMutation({ onSuccess: () => { utils.project.listDeliverables.invalidate(); setNewDeliverable({ title: "", description: "", dueDate: "", phaseId: "", assigneeId: "" }); setShowAddDeliverable(false); } });
    const updateDeliverableMut = trpc.project.updateDeliverable.useMutation({ onSuccess: () => utils.project.listDeliverables.invalidate() });
    const deleteDeliverableMut = trpc.project.deleteDeliverable.useMutation({ onSuccess: () => utils.project.listDeliverables.invalidate() });
    const addMilestoneMut = trpc.project.addMilestone.useMutation({
        onSuccess: () => {
            utils.project.getById.invalidate();
            utils.project.schedule.invalidate();
        },
    });
    const updateMilestoneMut = trpc.project.updateMilestone.useMutation({
        onSuccess: () => {
            utils.project.getById.invalidate();
            utils.project.schedule.invalidate();
        },
    });
    const deleteMilestoneMut = trpc.project.deleteMilestone.useMutation({
        onSuccess: () => {
            utils.project.getById.invalidate();
            utils.project.schedule.invalidate();
        },
    });
    const assignPhaseMemberMut = trpc.project.assignPhaseMember.useMutation({
        onSuccess: () => utils.project.getById.invalidate(),
    });
    const removePhaseAssignmentMut = trpc.project.removePhaseAssignment.useMutation({
        onSuccess: () => utils.project.getById.invalidate(),
    });

    const taskStatusCycle = ["todo", "in-progress", "review", "done"] as const;
    const taskStatusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
        "todo": { label: "To Do", color: "var(--text-muted)", bg: "var(--bg-secondary)", icon: <Circle size={12} /> },
        "in-progress": { label: "In Progress", color: "var(--info)", bg: "rgba(90,122,144,0.08)", icon: <CircleDot size={12} /> },
        "review": { label: "Review", color: "var(--warning)", bg: "rgba(176,138,48,0.08)", icon: <Eye size={12} /> },
        "done": { label: "Done", color: "var(--success)", bg: "rgba(90,122,70,0.08)", icon: <CircleCheck size={12} /> },
    };

    // Adapt DB data to UI shape
    const project: ProjectDetail | null = useMemo(() => rawProject ? {
        id: rawProject.id,
        name: rawProject.name,
        client: (rawProject as any).client?.name || "—",
        type: (rawProject as any).type || "Commercial",
        status: rawProject.status,
        contractValue: (rawProject as any).contractValue || 0,
        startDate: (rawProject as any).startDate || "—",
        endDate: (rawProject as any).endDate || "—",
        description: (rawProject as any).description || "",
        team: [],
        phases: ((rawProject as any).phases || []).map((p: any, i: number, arr: any[]) => {
            const totalHours = (p.timeEntries || []).reduce((s: number, te: any) => s + te.hours, 0);
            const budgetHours = p.budgetHours || 0;
            const progress = budgetHours > 0 ? Math.min(100, Math.round((totalHours / budgetHours) * 100)) : 0;
            const isComplete = progress >= 100;
            return {
                id: p.id,
                name: p.name,
                status: isComplete ? "completed" as const : (i === 0 || arr.slice(0, i).every((prev: any) => {
                    const prevHrs = (prev.timeEntries || []).reduce((s: number, te: any) => s + te.hours, 0);
                    const prevBudget = prev.budgetHours || 0;
                    return prevBudget > 0 ? prevHrs >= prevBudget : true;
                })) ? "active" as const : "upcoming" as const,
                progress,
                budgetHours,
                usedHours: totalHours,
                fee: typeof p.budgetAmount === "number" ? p.budgetAmount : 0,
                startDate: p.startDate || "—",
                endDate: p.endDate || "—",
                milestones: (p.milestones || []).map((ms: any) => ({
                    id: ms.id || `${p.id}-ms-${ms.name || "milestone"}-${ms.date || "date"}`,
                    name: ms.name,
                    done: ms.done,
                    date: ms.date,
                })),
                assignments: (p.assignments || []).map((assignment: any) => ({
                    id: assignment.id,
                    roleLabel: assignment.roleLabel || "",
                    plannedHours: assignment.plannedHours || 0,
                    user: {
                        id: assignment.user?.id || "",
                        name: assignment.user?.name || "Unknown",
                        title: assignment.user?.title || "",
                        billRate: assignment.user?.billRate || 0,
                        costRate: assignment.user?.costRate || 0,
                    },
                })),
            };
        }),
    } : null, [rawProject]);

    useEffect(() => {
        if (!budgetData?.phases) return;
        setBudgetDrafts(
            Object.fromEntries(
                budgetData.phases.map((phase: any) => [
                    phase.id,
                    {
                        name: phase.name || "",
                        budgetHours: String(phase.budgetHours ?? 0),
                        budgetAmount: String(phase.budgetAmount ?? 0),
                        feeType: phase.feeType || "hourly",
                        startDate: phase.startDate || "",
                        endDate: phase.endDate || "",
                    },
                ]),
            ),
        );
    }, [budgetData]);

    useEffect(() => {
        if (!project) return;
        setMilestoneDrafts(Object.fromEntries(project.phases.map((phase) => [phase.id, { name: "", date: "" }])));
        setPhaseStaffDrafts(Object.fromEntries(project.phases.map((phase) => [phase.id, { userId: "", roleLabel: "", plannedHours: "" }])));
    }, [project]);

    if (isLoading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px", gap: "12px", color: "var(--text-muted)" }}>
                <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: "14px", fontWeight: 300 }}>Loading project…</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        );
    }

    if (!project) {
        return (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
                <p style={{ fontSize: "16px", color: "var(--text-muted)", fontWeight: 300 }}>Project not found.</p>
                <Link href="/dashboard/projects" style={{ marginTop: "16px", display: "inline-block", fontSize: "13px", color: "var(--accent-primary)", textDecoration: "none" }}>
                    ← Back to Projects
                </Link>
            </div>
        );
    }

    const totalBudgetHours = project.phases.reduce((s, p) => s + p.budgetHours, 0);
    const totalUsedHours = project.phases.reduce((s, p) => s + p.usedHours, 0);
    const totalFee = project.phases.reduce((s, p) => s + p.fee, 0);
    const overallProgress = totalBudgetHours > 0
        ? Math.max(0, Math.min(100, Math.round((totalUsedHours / totalBudgetHours) * 100)))
        : (project.phases.length > 0 ? Math.round(project.phases.reduce((s, p) => s + p.progress, 0) / project.phases.length) : 0);
    const todayIso = new Date().toISOString().slice(0, 10);
    const sevenDaysIso = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const taskRows = tasks as any[];
    const deliverableRows = deliverables as any[];
    const overdueTasks = taskRows.filter((t) => t.status !== "done" && t.dueDate && t.dueDate < todayIso).length;
    const dueSoonTasks = taskRows.filter((t) => t.status !== "done" && t.dueDate && t.dueDate >= todayIso && t.dueDate <= sevenDaysIso).length;
    const unassignedTasks = taskRows.filter((t) => t.status !== "done" && !t.assigneeId).length;
    const overdueDeliverables = deliverableRows.filter((d) => !["completed", "approved"].includes(d.status) && d.dueDate && d.dueDate < todayIso).length;
    const dueSoonDeliverables = deliverableRows.filter((d) => !["completed", "approved"].includes(d.status) && d.dueDate && d.dueDate >= todayIso && d.dueDate <= sevenDaysIso).length;
    const totalMilestones = project.phases.reduce((sum, phase) => sum + phase.milestones.length, 0);
    const totalAssignedMembers = new Set(project.phases.flatMap((phase) => phase.assignments.map((assignment) => assignment.user.id))).size;
    const unstaffedPhases = project.phases.filter((phase) => phase.assignments.length === 0).length;
    const phasesWithoutMilestones = project.phases.filter((phase) => phase.milestones.length === 0).length;
    const upcomingMilestones = project.phases
        .flatMap((ph) => ph.milestones)
        .filter((ms) => !ms.done && ms.date && ms.date >= todayIso && ms.date <= sevenDaysIso).length;
    const budgetSummary = budgetData?.summary;
    const budgetFinances = budgetData?.finances;
    const budgetForecast = budgetData?.forecast;
    const budgetPhases = (budgetData?.phases ?? []) as any[];
    const budgetBurn = budgetSummary?.overallBurn ?? overallProgress;
    const scheduleVariance = budgetSummary?.scheduleVariance ?? 0;
    const cashCollectedPct = project.contractValue > 0 && budgetFinances ? Math.round((budgetFinances.collectedAmount / project.contractValue) * 100) : 0;
    const budgetRisk: "low" | "medium" | "high" = budgetBurn > 100 ? "high" : budgetBurn > 85 ? "medium" : "low";
    const scheduleRisk: "low" | "medium" | "high" = scheduleVariance < -15 ? "high" : scheduleVariance < -5 ? "medium" : "low";
    const workRisk: "low" | "medium" | "high" = (overdueTasks + overdueDeliverables) > 4 ? "high" : (overdueTasks + overdueDeliverables) > 0 ? "medium" : "low";
    const cashRisk: "low" | "medium" | "high" = cashCollectedPct < 30 ? "high" : cashCollectedPct < 60 ? "medium" : "low";
    const budgetAlerts = [
        budgetSummary && budgetSummary.overBudgetPhaseCount > 0 ? { tone: "danger", text: `${budgetSummary.overBudgetPhaseCount} phase${budgetSummary.overBudgetPhaseCount > 1 ? "s are" : " is"} over budget.` } : null,
        budgetSummary && budgetSummary.atRiskPhaseCount > 0 ? { tone: "warning", text: `${budgetSummary.atRiskPhaseCount} phase${budgetSummary.atRiskPhaseCount > 1 ? "s are" : " is"} trending at risk.` } : null,
        budgetSummary && budgetSummary.unallocatedContract > 0 ? { tone: "info", text: `${formatCurrency(budgetSummary.unallocatedContract)} is still unallocated from the contract.` } : null,
        budgetSummary && budgetSummary.unallocatedContract < 0 ? { tone: "danger", text: `Phase budgets exceed the contract by ${formatCurrency(Math.abs(budgetSummary.unallocatedContract))}.` } : null,
        budgetFinances && budgetFinances.overdueAmount > 0 ? { tone: "danger", text: `${formatCurrency(budgetFinances.overdueAmount)} is overdue and needs collection follow-up.` } : null,
        budgetForecast && budgetForecast.projectedOverallBurn > 100 ? { tone: "warning", text: `Current pace projects ${budgetForecast.projectedOverallBurn}% total budget burn by completion.` } : null,
    ].filter(Boolean) as { tone: "danger" | "warning" | "info"; text: string }[];
    const riskBadge = (label: string, level: "low" | "medium" | "high") => {
        const color = level === "high" ? "var(--danger)" : level === "medium" ? "var(--warning)" : "var(--success)";
        const bg = level === "high" ? "rgba(176,80,64,0.08)" : level === "medium" ? "rgba(176,138,48,0.08)" : "rgba(90,122,70,0.08)";
        return <span key={label} style={{ fontSize: "10px", fontWeight: 600, color, background: bg, padding: "4px 8px", borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}: {level}</span>;
    };
    const getInitials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "?";

    const handleGanttPhaseUpdate = async (phaseId: string, startDate: string, endDate: string) => {
        await updatePhaseMut.mutateAsync({ id: phaseId, startDate, endDate });
    };

    const updateMilestoneDraft = (phaseId: string, field: "name" | "date", value: string) => {
        setMilestoneDrafts((prev) => ({
            ...prev,
            [phaseId]: {
                ...(prev[phaseId] || { name: "", date: "" }),
                [field]: value,
            },
        }));
    };

    const addPhaseMilestone = async (phaseId: string) => {
        const draft = milestoneDrafts[phaseId];
        if (!draft?.name || !draft?.date) return;
        await addMilestoneMut.mutateAsync({ projectId, phaseId, name: draft.name, date: draft.date });
        setMilestoneDrafts((prev) => ({
            ...prev,
            [phaseId]: { name: "", date: "" },
        }));
    };

    const updatePhaseStaffDraft = (phaseId: string, field: "userId" | "roleLabel" | "plannedHours", value: string) => {
        setPhaseStaffDrafts((prev) => ({
            ...prev,
            [phaseId]: {
                ...(prev[phaseId] || { userId: "", roleLabel: "", plannedHours: "" }),
                [field]: value,
            },
        }));
    };

    const assignMemberToPhase = async (phaseId: string) => {
        const draft = phaseStaffDrafts[phaseId];
        if (!draft?.userId) return;
        await assignPhaseMemberMut.mutateAsync({
            phaseId,
            userId: draft.userId,
            roleLabel: draft.roleLabel,
            plannedHours: Number(draft.plannedHours || 0),
        });
        setPhaseStaffDrafts((prev) => ({
            ...prev,
            [phaseId]: { userId: "", roleLabel: "", plannedHours: "" },
        }));
    };

    const updateBudgetDraft = (phaseId: string, field: "name" | "budgetHours" | "budgetAmount" | "feeType" | "startDate" | "endDate", value: string) => {
        setBudgetDrafts((prev) => ({
            ...prev,
            [phaseId]: {
                ...prev[phaseId],
                [field]: value,
            },
        }));
    };

    const resetBudgetDraft = (phase: any) => {
        setBudgetDrafts((prev) => ({
            ...prev,
            [phase.id]: {
                name: phase.name || "",
                budgetHours: String(phase.budgetHours ?? 0),
                budgetAmount: String(phase.budgetAmount ?? 0),
                feeType: phase.feeType || "hourly",
                startDate: phase.startDate || "",
                endDate: phase.endDate || "",
            },
        }));
    };

    const isBudgetDraftDirty = (phase: any) => {
        const draft = budgetDrafts[phase.id];
        if (!draft) return false;
        return draft.name !== (phase.name || "")
            || Number(draft.budgetHours || 0) !== Number(phase.budgetHours || 0)
            || Number(draft.budgetAmount || 0) !== Number(phase.budgetAmount || 0)
            || draft.feeType !== (phase.feeType || "hourly")
            || draft.startDate !== (phase.startDate || "")
            || draft.endDate !== (phase.endDate || "");
    };

    const saveBudgetPhase = async (phaseId: string) => {
        const draft = budgetDrafts[phaseId];
        if (!draft) return;
        setSavingBudgetPhaseId(phaseId);
        try {
            await updatePhaseMut.mutateAsync({
                id: phaseId,
                name: draft.name.trim() || "Untitled phase",
                budgetHours: Number(draft.budgetHours || 0),
                budgetAmount: Number(draft.budgetAmount || 0),
                feeType: draft.feeType as "hourly" | "fixed" | "not-to-exceed",
                startDate: draft.startDate,
                endDate: draft.endDate,
            });
        } finally {
            setSavingBudgetPhaseId(null);
        }
    };

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
                        <button onClick={() => { setEditForm({ name: project.name, type: project.type, contractValue: String(project.contractValue), startDate: project.startDate === "—" ? "" : project.startDate, endDate: project.endDate === "—" ? "" : project.endDate, status: project.status }); setShowEditProject(true); }} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)" }}>
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
                    { label: "Phases", value: `${project.phases.length}`, icon: Users, color: "var(--info)" },
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

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "20px" }}>
                {riskBadge("Budget", budgetRisk)}
                {riskBadge("Schedule", scheduleRisk)}
                {riskBadge("Cash", cashRisk)}
                {riskBadge("Execution", workRisk)}
            </div>

            <div style={{ display: "flex", gap: "0", marginBottom: "24px", borderBottom: "1px solid var(--border-primary)" }}>
                {(["overview", "gantt", "budget", "tasks", "deliverables", "files", "expenses"] as const).map((tab) => {
                    const icons: Record<string, React.ReactNode> = { gantt: <CalendarRange size={13} />, budget: <BarChart3 size={13} />, tasks: <ListTodo size={13} />, deliverables: <Package size={13} />, files: <Paperclip size={13} />, expenses: <Receipt size={13} /> };
                    return (
                        <button key={tab} onClick={() => setActiveTab(tab)} style={{
                            padding: "10px 16px", fontSize: "12px", fontWeight: 500, cursor: "pointer",
                            border: "none", background: "none",
                            color: activeTab === tab ? "var(--accent-primary)" : "var(--text-muted)",
                            borderBottom: activeTab === tab ? "2px solid var(--accent-primary)" : "2px solid transparent",
                            transition: "all 0.15s", display: "flex", alignItems: "center", gap: "6px",
                        }}>
                            {icons[tab] || null}
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    );
                })}
            </div>

            {/* Overview tab */}
            {activeTab === "overview" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "16px" }}>
                    {/* Phases */}
                    <div style={{ padding: "24px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <h3 style={{ fontSize: "15px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Phases & Milestones</h3>
                            <button onClick={() => setShowAddPhase(true)} style={{ padding: "6px 12px", borderRadius: "4px", border: "1px solid var(--border-primary)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--text-muted)" }}>
                                <Plus size={12} /> Add Phase
                            </button>
                        </div>

                        {project.phases.length === 0 ? (
                            <div style={{ padding: "30px 0", textAlign: "center" }}>
                                <p style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 300 }}>No phases defined yet.</p>
                            </div>
                        ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                                {project.phases.map((phase, i) => {
                                    const sc = phaseStatusColors[phase.status];
                                    const expanded = activePhase === phase.id;
                                    const hoursPercent = phase.budgetHours > 0 ? Math.round((phase.usedHours / phase.budgetHours) * 100) : 0;
                                    const isOverBudget = hoursPercent > 100;

                                    return (
                                        <div key={phase.id}>
                                            <div
                                                onClick={() => setActivePhase(expanded ? null : phase.id)}
                                                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", cursor: "pointer", borderRadius: "6px", transition: "background 0.15s", background: expanded ? (sc?.bg || "var(--bg-warm)") : "transparent" }}
                                                onMouseEnter={(e) => { if (!expanded) e.currentTarget.style.background = "var(--bg-warm)"; }}
                                                onMouseLeave={(e) => { if (!expanded) e.currentTarget.style.background = "transparent"; }}
                                            >
                                                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: sc?.dot || "var(--text-muted)" }} />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{phase.name}</span>
                                                        <span style={{ fontSize: "10px", fontWeight: 500, color: sc?.text || "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{phase.status}</span>
                                                    </div>
                                                    <div style={{ marginTop: "8px", height: "3px", borderRadius: "2px", background: "var(--bg-tertiary)" }}>
                                                        <div style={{ height: "100%", borderRadius: "2px", width: `${Math.min(phase.progress, 100)}%`, background: sc?.dot || "var(--accent-primary)", transition: "width 0.3s" }} />
                                                    </div>
                                                </div>
                                                <ChevronRight size={14} style={{ color: "var(--text-muted)", transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
                                            </div>

                                            {expanded && (
                                                <div style={{ padding: "12px 16px 16px 36px", fontSize: "12px", color: "var(--text-secondary)" }}>
                                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "10px", marginBottom: "14px" }}>
                                                        <div>
                                                            <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Phase Budget</span>
                                                            <p style={{ fontWeight: 500, marginTop: "2px" }}>{formatCurrency(phase.fee)}</p>
                                                        </div>
                                                        <div>
                                                            <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Hours</span>
                                                            <p style={{ fontWeight: 500, marginTop: "2px", color: isOverBudget ? "var(--danger)" : "var(--text-primary)" }}>
                                                                {phase.usedHours} / {phase.budgetHours}
                                                                {isOverBudget && <AlertTriangle size={10} style={{ color: "var(--danger)", marginLeft: "4px", verticalAlign: "text-bottom" }} />}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Dates</span>
                                                            <p style={{ fontWeight: 500, marginTop: "2px" }}>{phase.startDate} — {phase.endDate}</p>
                                                        </div>
                                                        <div>
                                                            <span style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Progress</span>
                                                            <p style={{ fontWeight: 500, marginTop: "2px" }}>{phase.progress}%</p>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "14px" }}>
                                                        <div style={{ padding: "14px", borderRadius: "8px", background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                                                <p style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Milestones</p>
                                                                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{phase.milestones.length} total</span>
                                                            </div>
                                                            {phase.milestones.length === 0 ? (
                                                                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px" }}>No milestones yet. Add key approvals, submissions, or deadlines for this phase.</p>
                                                            ) : (
                                                                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
                                                                    {phase.milestones.map((ms) => (
                                                                        <div key={ms.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", borderRadius: "6px", background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
                                                                            <button
                                                                                onClick={() => updateMilestoneMut.mutate({ id: ms.id, done: !ms.done })}
                                                                                style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center" }}
                                                                            >
                                                                                {ms.done ? <CheckCircle2 size={14} style={{ color: "var(--success)" }} /> : <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "1.5px solid var(--border-secondary)" }} />}
                                                                            </button>
                                                                            <div style={{ flex: 1 }}>
                                                                                <p style={{ fontSize: "11px", color: "var(--text-primary)", textDecoration: ms.done ? "line-through" : "none" }}>{ms.name}</p>
                                                                                <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>{ms.date || "No date"}</p>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => deleteMilestoneMut.mutate({ id: ms.id })}
                                                                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "2px" }}
                                                                            >
                                                                                <Trash2 size={12} />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr auto", gap: "8px", alignItems: "end" }}>
                                                                <div>
                                                                    <label style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Milestone</label>
                                                                    <input
                                                                        type="text"
                                                                        value={milestoneDrafts[phase.id]?.name || ""}
                                                                        onChange={(e) => updateMilestoneDraft(phase.id, "name", e.target.value)}
                                                                        placeholder="Concept sign-off"
                                                                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", fontFamily: "inherit", outline: "none" }}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Date</label>
                                                                    <input
                                                                        type="date"
                                                                        value={milestoneDrafts[phase.id]?.date || ""}
                                                                        onChange={(e) => updateMilestoneDraft(phase.id, "date", e.target.value)}
                                                                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", fontFamily: "inherit" }}
                                                                    />
                                                                </div>
                                                                <button
                                                                    onClick={() => addPhaseMilestone(phase.id)}
                                                                    disabled={!milestoneDrafts[phase.id]?.name || !milestoneDrafts[phase.id]?.date || addMilestoneMut.isPending}
                                                                    style={{ padding: "8px 12px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "11px", fontWeight: 500, cursor: "pointer", opacity: !milestoneDrafts[phase.id]?.name || !milestoneDrafts[phase.id]?.date ? 0.5 : 1 }}
                                                                >
                                                                    Add
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div style={{ padding: "14px", borderRadius: "8px", background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
                                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                                                                <p style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Phase Team</p>
                                                                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{phase.assignments.length} assigned</span>
                                                            </div>
                                                            {phase.assignments.length === 0 ? (
                                                                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px" }}>No team assigned yet. Add people so this phase has clear ownership.</p>
                                                            ) : (
                                                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                                                                    {phase.assignments.map((assignment) => (
                                                                        <div key={assignment.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "6px", background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
                                                                            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "rgba(176,122,74,0.14)", color: "var(--accent-primary)", display: "grid", placeItems: "center", fontSize: "10px", fontWeight: 600 }}>
                                                                                {getInitials(assignment.user.name)}
                                                                            </div>
                                                                            <div style={{ flex: 1 }}>
                                                                                <p style={{ fontSize: "11px", color: "var(--text-primary)", fontWeight: 500 }}>{assignment.user.name}</p>
                                                                                <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                                                                                    {assignment.roleLabel || assignment.user.title || "Team member"}
                                                                                    {assignment.plannedHours > 0 ? ` · ${assignment.plannedHours}h planned` : ""}
                                                                                </p>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => removePhaseAssignmentMut.mutate({ id: assignment.id })}
                                                                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "2px" }}
                                                                            >
                                                                                <X size={12} />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 0.8fr auto", gap: "8px", alignItems: "end" }}>
                                                                <div>
                                                                    <label style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Team Member</label>
                                                                    <select
                                                                        value={phaseStaffDrafts[phase.id]?.userId || ""}
                                                                        onChange={(e) => updatePhaseStaffDraft(phase.id, "userId", e.target.value)}
                                                                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", cursor: "pointer", fontFamily: "inherit" }}
                                                                    >
                                                                        <option value="">Select team member...</option>
                                                                        {(teamMembers as any[])
                                                                            .filter((member: any) => !phase.assignments.some((assignment) => assignment.user.id === member.id))
                                                                            .map((member: any) => (
                                                                                <option key={member.id} value={member.id}>{member.name}</option>
                                                                            ))}
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Role On Phase</label>
                                                                    <input
                                                                        type="text"
                                                                        value={phaseStaffDrafts[phase.id]?.roleLabel || ""}
                                                                        onChange={(e) => updatePhaseStaffDraft(phase.id, "roleLabel", e.target.value)}
                                                                        placeholder="Lead designer"
                                                                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", fontFamily: "inherit", outline: "none" }}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label style={{ display: "block", fontSize: "10px", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Planned Hrs</label>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="1"
                                                                        value={phaseStaffDrafts[phase.id]?.plannedHours || ""}
                                                                        onChange={(e) => updatePhaseStaffDraft(phase.id, "plannedHours", e.target.value)}
                                                                        placeholder="12"
                                                                        style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", fontFamily: "inherit", outline: "none" }}
                                                                    />
                                                                </div>
                                                                <button
                                                                    onClick={() => assignMemberToPhase(phase.id)}
                                                                    disabled={!phaseStaffDrafts[phase.id]?.userId || assignPhaseMemberMut.isPending}
                                                                    style={{ padding: "8px 12px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "11px", fontWeight: 500, cursor: "pointer", opacity: !phaseStaffDrafts[phase.id]?.userId ? 0.5 : 1 }}
                                                                >
                                                                    Assign
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Right sidebar */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {/* Project details */}
                        <div style={{ padding: "20px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                            <h3 style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "16px" }}>Details</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {[
                                    { label: "Status", value: project.status.charAt(0).toUpperCase() + project.status.slice(1) },
                                    { label: "Type", value: project.type },
                                    { label: "Start Date", value: project.startDate },
                                    { label: "End Date", value: project.endDate },
                                    { label: "Total Phase Budget", value: formatCurrency(totalFee) },
                                ].map((detail, i) => (
                                    <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{detail.label}</span>
                                        <span style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 400 }}>{detail.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        {project.description && (
                            <div style={{ padding: "20px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                                <h3 style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "10px" }}>Description</h3>
                                <p style={{ fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 300, lineHeight: 1.6 }}>{project.description}</p>
                            </div>
                        )}

                        <div style={{ padding: "20px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                            <h3 style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "16px" }}>Phase Team Map</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {project.phases.map((phase) => (
                                    <div key={phase.id} style={{ paddingBottom: "12px", borderBottom: "1px solid var(--border-primary)" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
                                            <span style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 500 }}>{phase.name}</span>
                                            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{phase.assignments.length} assigned</span>
                                        </div>
                                        {phase.assignments.length === 0 ? (
                                            <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>No one assigned yet.</p>
                                        ) : (
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                                {phase.assignments.map((assignment) => (
                                                    <span key={assignment.id} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 8px", borderRadius: "999px", background: "var(--bg-secondary)", color: "var(--text-secondary)", fontSize: "10px" }}>
                                                        <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: "rgba(176,122,74,0.14)", color: "var(--accent-primary)", display: "grid", placeItems: "center", fontSize: "9px", fontWeight: 600 }}>
                                                            {getInitials(assignment.user.name)}
                                                        </span>
                                                        {assignment.user.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: "14px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <div style={{ padding: "10px 12px", borderRadius: "8px", background: "var(--bg-secondary)" }}>
                                    <p style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Assigned Team</p>
                                    <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)" }}>{totalAssignedMembers}</p>
                                </div>
                                <div style={{ padding: "10px 12px", borderRadius: "8px", background: "var(--bg-secondary)" }}>
                                    <p style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Milestones</p>
                                    <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)" }}>{totalMilestones}</p>
                                </div>
                            </div>
                        </div>

                        {/* Budget overview */}
                        {project.phases.length > 0 && (
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
                        )}

                        <div style={{ padding: "20px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                            <h3 style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "12px" }}>Action Queue</h3>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {[
                                    { label: "Overdue tasks", value: overdueTasks, critical: overdueTasks > 0 },
                                    { label: "Tasks due in 7 days", value: dueSoonTasks, critical: false },
                                    { label: "Unassigned open tasks", value: unassignedTasks, critical: unassignedTasks > 0 },
                                    { label: "Overdue deliverables", value: overdueDeliverables, critical: overdueDeliverables > 0 },
                                    { label: "Deliverables due in 7 days", value: dueSoonDeliverables, critical: false },
                                    { label: "Upcoming milestones (7d)", value: upcomingMilestones, critical: false },
                                    { label: "Phases without team", value: unstaffedPhases, critical: unstaffedPhases > 0 },
                                    { label: "Phases without milestones", value: phasesWithoutMilestones, critical: phasesWithoutMilestones > 0 },
                                ].map((item) => (
                                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "var(--text-secondary)" }}>
                                        <span>{item.label}</span>
                                        <span style={{ fontWeight: 600, color: item.critical ? "var(--danger)" : "var(--text-primary)" }}>{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Gantt tab */}
            {activeTab === "gantt" && (
                <div style={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
                    <GanttChart
                        projects={[{
                            id: project.id,
                            name: project.name,
                            client: project.client,
                            startDate: project.startDate,
                            endDate: project.endDate,
                            phases: project.phases.map((ph: Phase) => ({
                                id: ph.id,
                                name: ph.name,
                                startDate: ph.startDate,
                                endDate: ph.endDate,
                                color: "",
                                progress: ph.progress,
                                milestones: ph.milestones,
                            })),
                        }]}
                        zoomLevel={ganttZoom}
                        onZoomChange={setGanttZoom}
                        onPhaseUpdate={handleGanttPhaseUpdate}
                    />
                    {updatePhaseMut.isPending && (
                        <p style={{ marginTop: "8px", fontSize: "11px", color: "var(--text-muted)" }}>Updating timeline...</p>
                    )}
                </div>
            )}

            {/* Expenses tab */}
            {activeTab === "expenses" && (
                <div style={{ borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Project Expenses</h3>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {(projectExpenses as any[]).length} expense{(projectExpenses as any[]).length !== 1 ? "s" : ""}
                            {" · "}
                            {formatCurrency((projectExpenses as any[]).reduce((s: number, e: any) => s + e.amount, 0))}
                        </span>
                    </div>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border-primary)", background: "var(--bg-warm)" }}>
                                {["Date", "Category", "Description", "Amount", "Status"].map((h) => (
                                    <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {(projectExpenses as any[]).length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: "30px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)", fontWeight: 300 }}>No expenses for this project yet.</td></tr>
                            ) : (projectExpenses as any[]).map((exp: any) => (
                                <tr key={exp.id} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                                    <td style={{ padding: "10px 14px", fontSize: "12px", color: "var(--text-secondary)" }}>{exp.date}</td>
                                    <td style={{ padding: "10px 14px", fontSize: "12px", color: "var(--text-secondary)" }}>{exp.category}</td>
                                    <td style={{ padding: "10px 14px", fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>{exp.description}</td>
                                    <td style={{ padding: "10px 14px", fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>{formatCurrency(exp.amount)}</td>
                                    <td style={{ padding: "10px 14px" }}>
                                        <span style={{
                                            fontSize: "9px", fontWeight: 600, padding: "3px 8px", borderRadius: "3px", textTransform: "uppercase",
                                            color: exp.status === "approved" ? "var(--success)" : exp.status === "rejected" ? "var(--danger)" : "var(--warning)",
                                            background: exp.status === "approved" ? "rgba(90,122,70,0.08)" : exp.status === "rejected" ? "rgba(176,80,64,0.08)" : "rgba(176,138,48,0.08)"
                                        }}>{exp.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Tasks tab */}
            {activeTab === "tasks" && (
                <div style={{ borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h3 style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Tasks</h3>
                            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{(tasks as any[]).length} tasks · {(tasks as any[]).filter((t: any) => t.status === "done").length} completed</p>
                        </div>
                        <button onClick={() => setShowNewTask(!showNewTask)}
                            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "11px", fontWeight: 500, cursor: "pointer" }}>
                            <Plus size={13} /> Add Task
                        </button>
                    </div>

                    {/* New task form */}
                    {showNewTask && (
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-primary)", background: "var(--bg-warm)" }}>
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
                                <div style={{ flex: 2, minWidth: "180px" }}>
                                    <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Title *</label>
                                    <input type="text" value={newTask.title} onChange={(e) => setNewTask(p => ({ ...p, title: e.target.value }))} placeholder="Task title" style={{ width: "100%", padding: "8px 10px", borderRadius: "5px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", outline: "none", fontFamily: "inherit" }} />
                                </div>
                                <div style={{ flex: 1, minWidth: "120px" }}>
                                    <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Phase *</label>
                                    <select value={newTask.phaseId} onChange={(e) => setNewTask(p => ({ ...p, phaseId: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: "5px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", cursor: "pointer", fontFamily: "inherit" }}>
                                        <option value="">Select phase...</option>
                                        {project.phases.map((ph: any) => <option key={ph.id} value={ph.id}>{ph.name}</option>)}
                                    </select>
                                </div>
                                <div style={{ flex: 1, minWidth: "120px" }}>
                                    <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Assignee</label>
                                    <select value={newTask.assigneeId} onChange={(e) => setNewTask(p => ({ ...p, assigneeId: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: "5px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", cursor: "pointer", fontFamily: "inherit" }}>
                                        <option value="">Unassigned</option>
                                        {(teamMembers as any[]).map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                                    </select>
                                </div>
                                <div style={{ flex: 1, minWidth: "120px" }}>
                                    <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Due Date</label>
                                    <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask(p => ({ ...p, dueDate: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: "5px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", fontFamily: "inherit" }} />
                                </div>
                                <button onClick={() => { if (!newTask.title || !newTask.phaseId) return; createTask.mutate({ projectId, phaseId: newTask.phaseId, title: newTask.title, assigneeId: newTask.assigneeId || undefined, dueDate: newTask.dueDate }); }}
                                    disabled={!newTask.title || !newTask.phaseId || createTask.isPending}
                                    style={{ padding: "8px 16px", borderRadius: "5px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "11px", fontWeight: 500, cursor: "pointer", opacity: !newTask.title || !newTask.phaseId ? 0.5 : 1, whiteSpace: "nowrap" }}>
                                    {createTask.isPending ? "Adding..." : "Add"}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Task list */}
                    {(tasks as any[]).length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center" }}>
                            <ListTodo size={24} style={{ color: "var(--text-muted)", marginBottom: "8px" }} />
                            <p style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 300 }}>No tasks yet. Add your first task above.</p>
                        </div>
                    ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border-primary)", background: "var(--bg-warm)" }}>
                                    {["Status", "Task", "Phase", "Assignee", "Due Date", ""].map(h => (
                                        <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(tasks as any[]).map((task: any) => {
                                    const tsc = taskStatusConfig[task.status] || taskStatusConfig["todo"];
                                    return (
                                        <tr key={task.id} style={{ borderBottom: "1px solid var(--border-primary)" }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-warm)"; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                                            <td style={{ padding: "10px 14px" }}>
                                                <button onClick={() => { const idx = taskStatusCycle.indexOf(task.status); const next = taskStatusCycle[(idx + 1) % taskStatusCycle.length]; updateTask.mutate({ id: task.id, status: next }); }}
                                                    style={{ border: "none", cursor: "pointer", color: tsc.color, display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "3px", background: tsc.bg }}>
                                                    {tsc.icon} {tsc.label}
                                                </button>
                                            </td>
                                            <td style={{ padding: "10px 14px", fontSize: "12px", fontWeight: 500, color: task.status === "done" ? "var(--text-muted)" : "var(--text-primary)", textDecoration: task.status === "done" ? "line-through" : "none" }}>{task.title}</td>
                                            <td style={{ padding: "10px 14px", fontSize: "11px", color: "var(--text-muted)" }}>{task.phase?.name || "—"}</td>
                                            <td style={{ padding: "10px 14px" }}>
                                                {task.assignee ? (
                                                    <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "10px", background: "rgba(176,122,74,0.08)", color: "var(--accent-primary)", fontWeight: 500 }}>{task.assignee.name}</span>
                                                ) : (
                                                    <span style={{ fontSize: "10px", color: "var(--text-muted)", fontStyle: "italic" }}>Unassigned</span>
                                                )}
                                            </td>
                                            <td style={{ padding: "10px 14px", fontSize: "11px", color: "var(--text-muted)" }}>{task.dueDate || "—"}</td>
                                            <td style={{ padding: "10px 14px" }}>
                                                <button onClick={() => deleteTask.mutate({ id: task.id })}
                                                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--danger)"; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}>
                                                    <Trash2 size={13} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
            {/* Budget tab */}
            {activeTab === "budget" && (
                <div style={{ display: "grid", gap: "16px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
                        {[
                            { label: "Hours Burn", value: `${budgetSummary?.totalUsedHours ?? 0}h / ${budgetSummary?.totalBudgetHours ?? 0}h`, meta: `${budgetSummary?.overallBurn ?? 0}% used`, icon: Clock, color: "var(--accent-gold)" },
                            { label: "Phase Budget", value: formatCurrency(budgetSummary?.totalBudgetAmount ?? 0), meta: `${budgetSummary?.budgetCoveragePct ?? 0}% of contract allocated`, icon: DollarSign, color: "var(--accent-primary)" },
                            { label: "Cash Collected", value: formatCurrency(budgetFinances?.collectedAmount ?? 0), meta: `${cashCollectedPct}% of contract recovered`, icon: Receipt, color: "var(--success)" },
                            {
                                label: "Forecast Burn",
                                value: budgetForecast?.forecastHoursAtCompletion ? `${budgetForecast.forecastHoursAtCompletion}h` : "Not enough data",
                                meta: budgetForecast?.projectedOverallBurn ? `${budgetForecast.projectedOverallBurn}% at completion` : "Waiting on schedule data",
                                icon: TrendingUp,
                                color: budgetForecast && budgetForecast.projectedOverallBurn > 100 ? "var(--danger)" : "var(--info)",
                            },
                        ].map((card) => {
                            const Icon = card.icon;
                            return (
                                <div key={card.label} style={{ padding: "18px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
                                        <div>
                                            <p style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>{card.label}</p>
                                            <p style={{ fontSize: "18px", color: "var(--text-primary)", fontWeight: 500 }}>{card.value}</p>
                                        </div>
                                        <div style={{ width: "32px", height: "32px", borderRadius: "8px", display: "grid", placeItems: "center", background: `${card.color}15`, color: card.color }}>
                                            <Icon size={16} />
                                        </div>
                                    </div>
                                    <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>{card.meta}</p>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px", alignItems: "start" }}>
                        <div style={{ padding: "24px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", marginBottom: "20px", flexWrap: "wrap" }}>
                                <div>
                                    <h3 style={{ fontSize: "15px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Budget Control</h3>
                                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Tune each phase budget, fee type, and schedule here. The metrics below refresh from actual time, invoices, payments, and expenses.</p>
                                </div>
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                    {riskBadge("Budget", budgetRisk)}
                                    {riskBadge("Cash", cashRisk)}
                                </div>
                            </div>

                            {budgetPhases.length === 0 && (
                                <p style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 300, textAlign: "center", padding: "24px 0" }}>No phases yet. Add phases first to control budget.</p>
                            )}

                            {budgetPhases.map((phase) => {
                                const draft = budgetDrafts[phase.id] || {
                                    name: phase.name || "",
                                    budgetHours: String(phase.budgetHours ?? 0),
                                    budgetAmount: String(phase.budgetAmount ?? 0),
                                    feeType: phase.feeType || "hourly",
                                    startDate: phase.startDate || "",
                                    endDate: phase.endDate || "",
                                };
                                const burnColor = phase.burnPct > 100 ? "var(--danger)" : phase.burnPct > 85 ? "var(--warning)" : "var(--accent-primary)";
                                const scheduleColor = phase.scheduleVariance < -10 ? "var(--danger)" : phase.scheduleVariance < -3 ? "var(--warning)" : "var(--success)";
                                const isDirty = isBudgetDraftDirty(phase);
                                const isSaving = savingBudgetPhaseId === phase.id;

                                return (
                                    <div key={phase.id} style={{ padding: "18px", borderRadius: "10px", border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", marginBottom: "14px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "flex-start", flexWrap: "wrap", marginBottom: "14px" }}>
                                            <div>
                                                <p style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 500 }}>{phase.name}</p>
                                                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                                                    {phase.status === "over-budget" ? "Over budget" : phase.status === "at-risk" ? "At risk" : phase.status === "active" ? "Active" : phase.status === "complete" ? "Complete" : "Planned"}
                                                    {phase.projectedBurnPct ? ` · Forecast ${phase.projectedBurnPct}% burn` : ""}
                                                </p>
                                            </div>
                                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                                <span style={{ fontSize: "10px", fontWeight: 600, color: burnColor, background: `${burnColor}14`, padding: "4px 8px", borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                                    {phase.burnPct}% burn
                                                </span>
                                                <span style={{ fontSize: "10px", fontWeight: 600, color: scheduleColor, background: `${scheduleColor}14`, padding: "4px 8px", borderRadius: "999px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                                                    {phase.scheduleVariance >= 0 ? "+" : ""}{phase.scheduleVariance}% schedule
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", marginBottom: "14px" }}>
                                            <div>
                                                <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Phase Name</label>
                                                <input type="text" value={draft.name} onChange={(e) => updateBudgetDraft(phase.id, "name", e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", outline: "none", fontFamily: "inherit" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Fee Type</label>
                                                <select value={draft.feeType} onChange={(e) => updateBudgetDraft(phase.id, "feeType", e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", cursor: "pointer", fontFamily: "inherit" }}>
                                                    <option value="hourly">Hourly</option>
                                                    <option value="fixed">Fixed Fee</option>
                                                    <option value="not-to-exceed">Not to Exceed</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Budget Hours</label>
                                                <input type="number" min="0" step="0.5" value={draft.budgetHours} onChange={(e) => updateBudgetDraft(phase.id, "budgetHours", e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", outline: "none", fontFamily: "inherit" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Budget Amount</label>
                                                <input type="number" min="0" step="1000" value={draft.budgetAmount} onChange={(e) => updateBudgetDraft(phase.id, "budgetAmount", e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", outline: "none", fontFamily: "inherit" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Start</label>
                                                <input type="date" value={draft.startDate} onChange={(e) => updateBudgetDraft(phase.id, "startDate", e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", fontFamily: "inherit" }} />
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>End</label>
                                                <input type="date" value={draft.endDate} onChange={(e) => updateBudgetDraft(phase.id, "endDate", e.target.value)} style={{ width: "100%", padding: "9px 10px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", fontFamily: "inherit" }} />
                                            </div>
                                        </div>

                                        <div style={{ height: "7px", borderRadius: "999px", background: "var(--bg-tertiary)", overflow: "hidden", marginBottom: "14px" }}>
                                            <div style={{ height: "100%", width: `${Math.min(phase.burnPct, 100)}%`, background: burnColor, transition: "width 0.3s" }} />
                                        </div>

                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px", marginBottom: "14px" }}>
                                            {[
                                                { label: "Used", value: `${phase.usedHours}h`, meta: `Remaining ${phase.remainingHours}h` },
                                                { label: "Recent 30 Days", value: `${phase.recentHours}h`, meta: "Current burn pace" },
                                                { label: "Labor Cost", value: formatCurrency(phase.laborCost), meta: `Avg ${formatCurrency(phase.avgCostRate)}/h` },
                                                { label: "Billable Value", value: formatCurrency(phase.billableValue), meta: `Avg ${formatCurrency(phase.avgBillRate)}/h` },
                                                { label: "Budget Rate", value: draft.budgetHours && Number(draft.budgetHours) > 0 ? formatCurrency(Number(draft.budgetAmount || 0) / Number(draft.budgetHours || 1)) : "—", meta: "Fee per budgeted hour" },
                                                { label: "Planned Progress", value: `${phase.plannedProgress}%`, meta: `Actual ${phase.actualProgress}%` },
                                            ].map((metric) => (
                                                <div key={metric.label} style={{ padding: "12px", borderRadius: "8px", background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
                                                    <p style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>{metric.label}</p>
                                                    <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>{metric.value}</p>
                                                    <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{metric.meta}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                                            <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                                {phase.forecastHoursAtCompletion
                                                    ? `Projected finish at ${phase.forecastHoursAtCompletion}h based on current pace.`
                                                    : "Forecast will improve once this phase has both schedule dates and logged time."}
                                            </p>
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                <button onClick={() => resetBudgetDraft(phase)} disabled={!isDirty || isSaving}
                                                    style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "transparent", color: "var(--text-secondary)", fontSize: "11px", fontWeight: 500, cursor: "pointer", opacity: !isDirty || isSaving ? 0.5 : 1 }}>
                                                    Reset
                                                </button>
                                                <button onClick={() => saveBudgetPhase(phase.id)} disabled={!isDirty || isSaving}
                                                    style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "11px", fontWeight: 500, cursor: "pointer", opacity: !isDirty || isSaving ? 0.55 : 1 }}>
                                                    {isSaving && <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />}
                                                    {isSaving ? "Saving..." : "Save Budget"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ padding: "20px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                                <h3 style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "16px" }}>Budget Health</h3>
                                {budgetAlerts.length === 0 ? (
                                    <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 300 }}>No urgent budget flags right now. Allocation and cash flow look healthy.</p>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        {budgetAlerts.map((alert, index) => {
                                            const color = alert.tone === "danger" ? "var(--danger)" : alert.tone === "warning" ? "var(--warning)" : "var(--info)";
                                            return (
                                                <div key={index} style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px 12px", borderRadius: "8px", background: `${color}12`, color }}>
                                                    <AlertTriangle size={14} style={{ marginTop: "2px", flexShrink: 0 }} />
                                                    <span style={{ fontSize: "12px", lineHeight: 1.5 }}>{alert.text}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div style={{ padding: "20px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                                <h3 style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "16px" }}>Money Flow</h3>
                                {[
                                    { label: "Contract", value: formatCurrency(project.contractValue) },
                                    { label: "Phase Budget", value: formatCurrency(budgetSummary?.totalBudgetAmount ?? 0) },
                                    { label: "Invoiced", value: formatCurrency(budgetFinances?.invoicedAmount ?? 0) },
                                    { label: "Collected", value: formatCurrency(budgetFinances?.collectedAmount ?? 0) },
                                    { label: "Outstanding", value: formatCurrency(budgetFinances?.outstandingAmount ?? 0) },
                                    { label: "Draft Invoices", value: formatCurrency(budgetFinances?.draftAmount ?? 0) },
                                    { label: "Labor Cost", value: formatCurrency(budgetFinances?.laborCost ?? 0) },
                                    { label: "Expenses", value: formatCurrency(budgetFinances?.expenseCost ?? 0) },
                                    { label: "Gross Profit", value: formatCurrency(budgetFinances?.grossProfit ?? 0) },
                                    { label: "Cash Position", value: formatCurrency(budgetFinances?.cashPosition ?? 0) },
                                ].map((row) => (
                                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--border-primary)" }}>
                                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{row.label}</span>
                                        <span style={{ fontSize: "12px", fontWeight: 500, color: row.label === "Gross Profit" || row.label === "Cash Position" ? ((budgetFinances?.[row.label === "Gross Profit" ? "grossProfit" : "cashPosition"] ?? 0) >= 0 ? "var(--success)" : "var(--danger)") : "var(--text-primary)" }}>{row.value}</span>
                                    </div>
                                ))}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "14px" }}>
                                    <div style={{ padding: "12px", borderRadius: "8px", background: "var(--bg-secondary)" }}>
                                        <p style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Margin</p>
                                        <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)" }}>{budgetFinances?.margin ?? 0}%</p>
                                    </div>
                                    <div style={{ padding: "12px", borderRadius: "8px", background: "var(--bg-secondary)" }}>
                                        <p style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Multiplier</p>
                                        <p style={{ fontSize: "15px", fontWeight: 500, color: "var(--text-primary)" }}>{budgetFinances?.multiplier ?? 0}x</p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: "20px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                                <h3 style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "16px" }}>Forecast & Allocation</h3>
                                {[
                                    { label: "Remaining Hours", value: `${budgetSummary?.totalRemainingHours ?? 0}h` },
                                    { label: "Recent Burn / Week", value: `${budgetSummary?.recentBurnRateHoursPerWeek ?? 0}h` },
                                    { label: "Projected Depletion", value: budgetForecast?.projectedDepletionDate || "No pace yet" },
                                    { label: "Schedule Variance", value: `${(budgetSummary?.scheduleVariance ?? 0) >= 0 ? "+" : ""}${budgetSummary?.scheduleVariance ?? 0}%` },
                                    { label: "Unallocated Contract", value: formatCurrency(budgetSummary?.unallocatedContract ?? 0) },
                                    { label: "Overdue Receivables", value: formatCurrency(budgetFinances?.overdueAmount ?? 0) },
                                ].map((row) => (
                                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--border-primary)" }}>
                                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{row.label}</span>
                                        <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>{row.value}</span>
                                    </div>
                                ))}
                                <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "14px", lineHeight: 1.6 }}>
                                    Budget is strongest when contract allocation, burn pace, and collections move together. This panel shows where they are drifting apart so you can rebalance phase budgets before the project gets noisy.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Deliverables tab */}
            {activeTab === "deliverables" && (
                <div style={{ borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                            <h3 style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Deliverables</h3>
                            <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{(deliverables as any[]).length} deliverables · {(deliverables as any[]).filter((d: any) => d.status === "completed" || d.status === "approved").length} completed</p>
                        </div>
                        <button onClick={() => setShowAddDeliverable(!showAddDeliverable)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "11px", fontWeight: 500, cursor: "pointer" }}><Plus size={13} /> Add</button>
                    </div>
                    {showAddDeliverable && (
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-primary)", background: "var(--bg-warm)" }}>
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
                                <div style={{ flex: 2, minWidth: "160px" }}>
                                    <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Title *</label>
                                    <input type="text" value={newDeliverable.title} onChange={(e) => setNewDeliverable(p => ({ ...p, title: e.target.value }))} placeholder="Deliverable title" style={{ width: "100%", padding: "8px 10px", borderRadius: "5px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", outline: "none", fontFamily: "inherit" }} />
                                </div>
                                <div style={{ flex: 1, minWidth: "120px" }}>
                                    <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Phase *</label>
                                    <select value={newDeliverable.phaseId} onChange={(e) => setNewDeliverable(p => ({ ...p, phaseId: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: "5px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", cursor: "pointer", fontFamily: "inherit" }}>
                                        <option value="">Select phase...</option>
                                        {project.phases.map((ph: any) => <option key={ph.id} value={ph.id}>{ph.name}</option>)}
                                    </select>
                                </div>
                                <div style={{ flex: 1, minWidth: "120px" }}>
                                    <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Due Date</label>
                                    <input type="date" value={newDeliverable.dueDate} onChange={(e) => setNewDeliverable(p => ({ ...p, dueDate: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: "5px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", fontFamily: "inherit" }} />
                                </div>
                                <button onClick={() => { if (!newDeliverable.title || !newDeliverable.phaseId) return; createDeliverableMut.mutate({ projectId, phaseId: newDeliverable.phaseId, title: newDeliverable.title, description: newDeliverable.description, dueDate: newDeliverable.dueDate, assigneeId: newDeliverable.assigneeId || undefined }); }}
                                    disabled={!newDeliverable.title || !newDeliverable.phaseId} style={{ padding: "8px 16px", borderRadius: "5px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "11px", fontWeight: 500, cursor: "pointer", opacity: !newDeliverable.title || !newDeliverable.phaseId ? 0.5 : 1, whiteSpace: "nowrap" }}>Add</button>
                            </div>
                        </div>
                    )}
                    {(deliverables as any[]).length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center" }}><Package size={24} style={{ color: "var(--text-muted)", marginBottom: "8px" }} /><p style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 300 }}>No deliverables yet.</p></div>
                    ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead><tr style={{ borderBottom: "1px solid var(--border-primary)", background: "var(--bg-warm)" }}>
                                {["Status", "Deliverable", "Phase", "Assignee", "Due Date", ""].map(h => <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>)}
                            </tr></thead>
                            <tbody>
                                {(deliverables as any[]).map((d: any) => {
                                    const dsc: Record<string, { label: string; color: string; bg: string }> = { pending: { label: "Pending", color: "var(--text-muted)", bg: "var(--bg-secondary)" }, "in-progress": { label: "In Progress", color: "var(--info)", bg: "rgba(90,122,144,0.08)" }, completed: { label: "Completed", color: "var(--success)", bg: "rgba(90,122,70,0.08)" }, approved: { label: "Approved", color: "var(--accent-primary)", bg: "rgba(176,122,74,0.08)" } };
                                    const ds = dsc[d.status] || dsc.pending;
                                    const statusCycle = ["pending", "in-progress", "completed", "approved"] as const;
                                    return (
                                        <tr key={d.id} style={{ borderBottom: "1px solid var(--border-primary)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-warm)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                                            <td style={{ padding: "10px 14px" }}>
                                                <button onClick={() => { const idx = statusCycle.indexOf(d.status); const next = statusCycle[(idx + 1) % statusCycle.length]; updateDeliverableMut.mutate({ id: d.id, status: next, completedDate: next === "completed" || next === "approved" ? new Date().toISOString().slice(0, 10) : "" }); }}
                                                    style={{ border: "none", cursor: "pointer", color: ds.color, display: "flex", alignItems: "center", gap: "6px", fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "3px", background: ds.bg }}>{ds.label}</button>
                                            </td>
                                            <td style={{ padding: "10px 14px", fontSize: "12px", fontWeight: 500, color: d.status === "approved" ? "var(--text-muted)" : "var(--text-primary)", textDecoration: d.status === "approved" ? "line-through" : "none" }}>{d.title}</td>
                                            <td style={{ padding: "10px 14px", fontSize: "11px", color: "var(--text-muted)" }}>{d.phase?.name || "—"}</td>
                                            <td style={{ padding: "10px 14px" }}>{d.assignee ? <span style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "10px", background: "rgba(176,122,74,0.08)", color: "var(--accent-primary)", fontWeight: 500 }}>{d.assignee.name}</span> : <span style={{ fontSize: "10px", color: "var(--text-muted)", fontStyle: "italic" }}>—</span>}</td>
                                            <td style={{ padding: "10px 14px", fontSize: "11px", color: "var(--text-muted)" }}>{d.dueDate || "—"}</td>
                                            <td style={{ padding: "10px 14px" }}><button onClick={() => deleteDeliverableMut.mutate({ id: d.id })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }} onMouseEnter={(e) => { e.currentTarget.style.color = "var(--danger)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}><Trash2 size={13} /></button></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Files tab */}
            {activeTab === "files" && (
                <div style={{ borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <h3 style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Project Files</h3>
                        <button onClick={() => setShowAddFile(!showAddFile)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "11px", fontWeight: 500, cursor: "pointer" }}><Plus size={13} /> Add File</button>
                    </div>
                    {showAddFile && (
                        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-primary)", background: "var(--bg-warm)" }}>
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
                                <div style={{ flex: 2, minWidth: "160px" }}>
                                    <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>File Name *</label>
                                    <input type="text" value={newFile.name} onChange={(e) => setNewFile(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Floor Plan v3" style={{ width: "100%", padding: "8px 10px", borderRadius: "5px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", outline: "none", fontFamily: "inherit" }} />
                                </div>
                                <div style={{ flex: 2, minWidth: "160px" }}>
                                    <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>URL</label>
                                    <input type="text" value={newFile.url} onChange={(e) => setNewFile(p => ({ ...p, url: e.target.value }))} placeholder="https://..." style={{ width: "100%", padding: "8px 10px", borderRadius: "5px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", outline: "none", fontFamily: "inherit" }} />
                                </div>
                                <div style={{ flex: 1, minWidth: "100px" }}>
                                    <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase" }}>Type</label>
                                    <select value={newFile.fileType} onChange={(e) => setNewFile(p => ({ ...p, fileType: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: "5px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-primary)", cursor: "pointer", fontFamily: "inherit" }}>
                                        {["drawing", "contract", "spec", "photo", "report", "other"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                                    </select>
                                </div>
                                <button onClick={() => { if (!newFile.name) return; addFileMut.mutate({ projectId, name: newFile.name, url: newFile.url, fileType: newFile.fileType, phaseId: newFile.phaseId || undefined }); }}
                                    disabled={!newFile.name} style={{ padding: "8px 16px", borderRadius: "5px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "11px", fontWeight: 500, cursor: "pointer", opacity: !newFile.name ? 0.5 : 1, whiteSpace: "nowrap" }}>Add</button>
                            </div>
                        </div>
                    )}
                    {(files as any[]).length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center" }}><Paperclip size={24} style={{ color: "var(--text-muted)", marginBottom: "8px" }} /><p style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 300 }}>No files attached yet.</p></div>
                    ) : (
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead><tr style={{ borderBottom: "1px solid var(--border-primary)", background: "var(--bg-warm)" }}>
                                {["Name", "Type", "Phase", "Uploaded By", "Date", ""].map(h => <th key={h} style={{ padding: "8px 14px", textAlign: "left", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>)}
                            </tr></thead>
                            <tbody>
                                {(files as any[]).map((f: any) => (
                                    <tr key={f.id} style={{ borderBottom: "1px solid var(--border-primary)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-warm)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                                        <td style={{ padding: "10px 14px" }}>{f.url ? <a href={f.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "12px", fontWeight: 500, color: "var(--accent-primary)", textDecoration: "none" }}>{f.name}</a> : <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>{f.name}</span>}</td>
                                        <td style={{ padding: "10px 14px" }}><span style={{ fontSize: "9px", fontWeight: 600, padding: "3px 8px", borderRadius: "3px", textTransform: "uppercase", color: "var(--text-muted)", background: "var(--bg-secondary)" }}>{f.fileType}</span></td>
                                        <td style={{ padding: "10px 14px", fontSize: "11px", color: "var(--text-muted)" }}>{f.phase?.name || "—"}</td>
                                        <td style={{ padding: "10px 14px", fontSize: "11px", color: "var(--text-muted)" }}>{f.uploadedBy?.name || "—"}</td>
                                        <td style={{ padding: "10px 14px", fontSize: "11px", color: "var(--text-muted)" }}>{new Date(f.createdAt).toLocaleDateString()}</td>
                                        <td style={{ padding: "10px 14px" }}><button onClick={() => deleteFileMut.mutate({ id: f.id })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }} onMouseEnter={(e) => { e.currentTarget.style.color = "var(--danger)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}><Trash2 size={13} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Add Phase modal */}
            {showAddPhase && (
                <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowAddPhase(false)}>
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} />
                    <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: "480px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-secondary)", boxShadow: "0 20px 60px rgba(0,0,0,0.12)", padding: "24px" }}>
                        <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "16px" }}>Add Phase</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <input type="text" value={newPhase.name} onChange={(e) => setNewPhase(p => ({ ...p, name: e.target.value }))} placeholder="Phase name *" style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", outline: "none", fontFamily: "inherit" }} />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                                <input type="number" value={newPhase.budgetHours} onChange={(e) => setNewPhase(p => ({ ...p, budgetHours: e.target.value }))} placeholder="Budget hours" style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", outline: "none", fontFamily: "inherit" }} />
                                <input type="number" value={newPhase.budgetAmount} onChange={(e) => setNewPhase(p => ({ ...p, budgetAmount: e.target.value }))} placeholder="Budget amount" style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", outline: "none", fontFamily: "inherit" }} />
                                <select value={newPhase.feeType} onChange={(e) => setNewPhase(p => ({ ...p, feeType: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", cursor: "pointer", fontFamily: "inherit" }}>
                                    <option value="hourly">Hourly</option><option value="fixed">Fixed</option><option value="not-to-exceed">NTE</option>
                                </select>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <input type="date" value={newPhase.startDate} onChange={(e) => setNewPhase(p => ({ ...p, startDate: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", fontFamily: "inherit" }} />
                                <input type="date" value={newPhase.endDate} onChange={(e) => setNewPhase(p => ({ ...p, endDate: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", fontFamily: "inherit" }} />
                            </div>
                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                                <button onClick={() => setShowAddPhase(false)} style={{ padding: "10px 20px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "transparent", fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer" }}>Cancel</button>
                                <button onClick={() => { if (!newPhase.name) return; addPhaseMut.mutate({ projectId, name: newPhase.name, budgetHours: parseFloat(newPhase.budgetHours) || 0, budgetAmount: parseFloat(newPhase.budgetAmount) || 0, feeType: newPhase.feeType, startDate: newPhase.startDate, endDate: newPhase.endDate }); }}
                                    disabled={!newPhase.name || addPhaseMut.isPending} style={{ padding: "10px 20px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "13px", fontWeight: 500, cursor: "pointer", opacity: !newPhase.name ? 0.5 : 1 }}>{addPhaseMut.isPending ? "Adding..." : "Add Phase"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Project modal */}
            {showEditProject && (
                <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowEditProject(false)}>
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }} />
                    <div onClick={(e) => e.stopPropagation()} style={{ position: "relative", width: "100%", maxWidth: "480px", background: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-secondary)", boxShadow: "0 20px 60px rgba(0,0,0,0.12)", padding: "24px" }}>
                        <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "16px" }}>Edit Project</h2>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            <input type="text" value={editForm.name} onChange={(e) => setEditForm(p => ({ ...p, name: e.target.value }))} placeholder="Project name" style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", outline: "none", fontFamily: "inherit" }} />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <select value={editForm.type} onChange={(e) => setEditForm(p => ({ ...p, type: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", cursor: "pointer", fontFamily: "inherit" }}>
                                    {["Commercial", "Residential", "Civic", "Healthcare", "Education", "Industrial", "Mixed-Use", "Interior"].map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <select value={editForm.status} onChange={(e) => setEditForm(p => ({ ...p, status: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", cursor: "pointer", fontFamily: "inherit" }}>
                                    {["active", "pipeline", "on-hold", "completed", "archived"].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}</option>)}
                                </select>
                            </div>
                            <input type="text" value={editForm.contractValue} onChange={(e) => setEditForm(p => ({ ...p, contractValue: e.target.value }))} placeholder="Contract value" style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", outline: "none", fontFamily: "inherit" }} />
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                                <input type="date" value={editForm.startDate} onChange={(e) => setEditForm(p => ({ ...p, startDate: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", fontFamily: "inherit" }} />
                                <input type="date" value={editForm.endDate} onChange={(e) => setEditForm(p => ({ ...p, endDate: e.target.value }))} style={{ width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", fontFamily: "inherit" }} />
                            </div>
                            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                                <button onClick={() => setShowEditProject(false)} style={{ padding: "10px 20px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "transparent", fontSize: "13px", color: "var(--text-secondary)", cursor: "pointer" }}>Cancel</button>
                                <button onClick={() => updateProject.mutate({ id: projectId, name: editForm.name, type: editForm.type, status: editForm.status as "active" | "pipeline" | "on-hold" | "completed" | "archived", contractValue: parseFloat(editForm.contractValue.replace(/[^0-9.]/g, "")) || 0, startDate: editForm.startDate, endDate: editForm.endDate })}
                                    disabled={updateProject.isPending} style={{ padding: "10px 20px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>{updateProject.isPending ? "Saving..." : "Save Changes"}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
