"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { trpc } from "@/app/providers";
import { Briefcase, Check, CheckCircle, Clock, DollarSign, Edit3, FileText, Loader2, Palmtree, Play, Plus, RotateCcw, Send, Square, Target, Timer, Trash2, TrendingUp, Users, XCircle } from "lucide-react";
import { useCurrencyFormatter } from "../useCurrencyFormatter";

type TimeTab = "timesheet" | "timeoff" | "past" | "team-timesheets" | "timeoff-requests";
type EntryType = "regular" | "pto" | "holiday" | "admin";
type ActivityType = "design" | "project-mgmt" | "site-visit" | "meeting" | "admin" | "other";
type TimesheetStatus = "draft" | "submitted" | "approved" | "rejected";
type TimeDraft = {
    id?: string;
    projectId: string;
    phaseId: string;
    deliverableId: string;
    taskId: string;
    date: string;
    hours: string;
    notes: string;
    billable: boolean;
    entryType: EntryType;
    activityType: ActivityType;
};

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const entryTypeLabels: Record<EntryType, string> = { regular: "Regular", pto: "PTO", holiday: "Holiday", admin: "Admin" };
const activityTypeLabels: Record<ActivityType, string> = { design: "Design", "project-mgmt": "Project Mgmt", "site-visit": "Site Visit", meeting: "Meeting", admin: "Admin", other: "Other" };
const statusConfig: Record<TimesheetStatus, { label: string; color: string; bg: string }> = {
    draft: { label: "Draft", color: "var(--text-muted)", bg: "var(--bg-secondary)" },
    submitted: { label: "Submitted", color: "var(--info)", bg: "rgba(90,122,144,0.1)" },
    approved: { label: "Approved", color: "var(--success)", bg: "rgba(90,122,70,0.1)" },
    rejected: { label: "Rejected", color: "var(--danger)", bg: "rgba(176,80,64,0.1)" },
};

const todayIso = () => new Date().toISOString().slice(0, 10);
const getWeekDates = (offset: number) => {
    const today = new Date();
    const dow = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1) + offset * 7);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
    });
};
const getIsoWeek = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
};
const formatTimer = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};
const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";

export default function TimePage() {
    const { formatCurrency } = useCurrencyFormatter();
    const utils = trpc.useUtils();
    const [weekOffset, setWeekOffset] = useState(0);
    const [activeTab, setActiveTab] = useState<TimeTab>("timesheet");
    const [showForm, setShowForm] = useState(false);
    const [showTimeOffForm, setShowTimeOffForm] = useState(false);
    const [timerRunning, setTimerRunning] = useState(false);
    const [timerSec, setTimerSec] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const [draft, setDraft] = useState<TimeDraft>({ projectId: "", phaseId: "", deliverableId: "", taskId: "", date: todayIso(), hours: "", notes: "", billable: true, entryType: "regular", activityType: "design" });
    const [newTimeOff, setNewTimeOff] = useState({ type: "pto", startDate: "", endDate: "", hours: 8, notes: "" });

    const weekDates = getWeekDates(weekOffset);
    const weekStart = weekDates[0].toISOString().slice(0, 10);
    const weekEnd = weekDates[6].toISOString().slice(0, 10);
    const weekKey = getIsoWeek(weekDates[0]);
    const weekLabel = `${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

    const { data: approvalContext } = trpc.time.approvalContext.useQuery();
    const canApprove = !!approvalContext?.canApprove;
    const { data: projectOptions = [] } = trpc.time.projectOptions.useQuery();
    const { data: entries = [], isLoading: entriesLoading } = trpc.time.getEntries.useQuery({ startDate: weekStart, endDate: weekEnd });
    const { data: metrics } = trpc.time.weekMetrics.useQuery({ startDate: weekStart, endDate: weekEnd });
    const { data: mySubmissions = [] } = trpc.time.getMySubmissions.useQuery();
    const { data: teamSubmissions = [] } = trpc.time.getTeamSubmissions.useQuery(undefined, { enabled: canApprove });
    const { data: myTimeOffRequests = [] } = trpc.time.getMyTimeOffRequests.useQuery();
    const { data: teamTimeOffRequests = [] } = trpc.time.getTeamTimeOffRequests.useQuery(undefined, { enabled: canApprove });

    const refreshTime = () => {
        utils.time.getEntries.invalidate();
        utils.time.weekMetrics.invalidate();
        utils.time.getMySubmissions.invalidate();
        utils.time.getTeamSubmissions.invalidate();
        utils.time.getMyTimeOffRequests.invalidate();
        utils.time.getTeamTimeOffRequests.invalidate();
        utils.project.budgetControl.invalidate();
        utils.invoice.projectInvoicePreview.invalidate();
    };

    const logEntry = trpc.time.logEntry.useMutation({ onSuccess: () => { refreshTime(); resetDraft(); setShowForm(false); } });
    const deleteEntry = trpc.time.deleteEntry.useMutation({ onSuccess: refreshTime });
    const submitWeek = trpc.time.submitWeek.useMutation({ onSuccess: refreshTime });
    const approveWeek = trpc.time.approveWeek.useMutation({ onSuccess: refreshTime });
    const rejectWeek = trpc.time.rejectWeek.useMutation({ onSuccess: refreshTime });
    const requestTimeOff = trpc.time.requestTimeOff.useMutation({ onSuccess: () => { refreshTime(); setShowTimeOffForm(false); setNewTimeOff({ type: "pto", startDate: "", endDate: "", hours: 8, notes: "" }); } });
    const approveTimeOff = trpc.time.approveTimeOff.useMutation({ onSuccess: refreshTime });
    const rejectTimeOff = trpc.time.rejectTimeOff.useMutation({ onSuccess: refreshTime });

    const tabs = useMemo(() => [
        { key: "timesheet" as const, label: "Timesheet", icon: Clock },
        { key: "timeoff" as const, label: "Time Off", icon: Palmtree },
        { key: "past" as const, label: "Past Timesheets", icon: FileText },
        ...(canApprove ? [
            { key: "team-timesheets" as const, label: "Team Review", icon: Users },
            { key: "timeoff-requests" as const, label: "PTO Review", icon: CheckCircle },
        ] : []),
    ], [canApprove]);

    const selectedProject = (projectOptions as any[]).find((project) => project.id === draft.projectId);
    const selectedPhase = selectedProject?.phases?.find((phase: any) => phase.id === draft.phaseId);
    const selectedDeliverable = selectedPhase?.deliverables?.find((deliverable: any) => deliverable.id === draft.deliverableId);
    const selectedTask = selectedDeliverable?.tasks?.find((task: any) => task.id === draft.taskId);

    useEffect(() => {
        if (draft.projectId || (projectOptions as any[]).length === 0) return;
        const firstProject = (projectOptions as any[])[0];
        const firstPhase = firstProject?.phases?.[0];
        setDraft((prev) => ({ ...prev, projectId: firstProject?.id || "", phaseId: firstPhase?.id || "" }));
    }, [projectOptions, draft.projectId]);

    useEffect(() => {
        if (timerRunning) intervalRef.current = setInterval(() => setTimerSec((prev) => prev + 1), 1000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [timerRunning]);

    function resetDraft() {
        const firstProject = (projectOptions as any[])[0];
        const firstPhase = firstProject?.phases?.[0];
        setDraft({ projectId: firstProject?.id || "", phaseId: firstPhase?.id || "", deliverableId: "", taskId: "", date: todayIso(), hours: "", notes: "", billable: true, entryType: "regular", activityType: "design" });
    }

    const saveDraft = () => {
        if (!draft.projectId || !draft.phaseId || !draft.date || !Number(draft.hours)) return;
        logEntry.mutate({ ...draft, deliverableId: draft.deliverableId || undefined, taskId: draft.taskId || undefined, hours: Number(draft.hours) });
    };

    const editEntry = (entry: any) => {
        setDraft({ id: entry.id, projectId: entry.projectId, phaseId: entry.phaseId, deliverableId: entry.deliverableId || "", taskId: entry.taskId || "", date: entry.date, hours: String(entry.hours), notes: entry.notes || "", billable: entry.billable, entryType: entry.entryType, activityType: entry.activityType });
        setShowForm(true);
    };

    const toggleTimer = () => {
        if (!timerRunning) {
            setTimerRunning(true);
            return;
        }
        setTimerRunning(false);
        const hours = Math.round((timerSec / 3600) * 4) / 4;
        setTimerSec(0);
        if (hours <= 0 || !draft.projectId || !draft.phaseId) return;
        logEntry.mutate({ projectId: draft.projectId, phaseId: draft.phaseId, deliverableId: draft.deliverableId || undefined, taskId: draft.taskId || undefined, date: todayIso(), hours, notes: selectedTask ? `Timer: ${selectedTask.title}` : "Timer entry", billable: draft.billable, entryType: draft.entryType, activityType: draft.activityType });
    };

    const personal = metrics?.personal || { totalHours: 0, billableHours: 0, nonBillableHours: 0, approvedBillableHours: 0, draftHours: 0, submittedHours: 0, approvedHours: 0, rejectedHours: 0, utilization: 0, laborCost: 0, billableValue: 0, realization: 0 };
    const dayTotals = weekDates.map((date) => (entries as any[]).filter((entry) => entry.date === date.toISOString().slice(0, 10)).reduce((sum, entry) => sum + entry.hours, 0));
    const draftEntryIds = (entries as any[]).filter((entry) => entry.status === "draft" || entry.status === "rejected").map((entry) => entry.id);
    const weekSubmission = (mySubmissions as any[]).find((submission) => submission.week === weekKey);
    const groupedEntries = weekDates.map((date) => ({ date, iso: date.toISOString().slice(0, 10), entries: (entries as any[]).filter((entry) => entry.date === date.toISOString().slice(0, 10)) }));

    const statusBadge = (status: TimesheetStatus) => {
        const config = statusConfig[status] || statusConfig.draft;
        return <span style={{ fontSize: "10px", fontWeight: 700, padding: "4px 9px", borderRadius: "999px", textTransform: "uppercase", color: config.color, background: config.bg }}>{config.label}</span>;
    };

    const fieldStyle: React.CSSProperties = { width: "100%", padding: "10px 11px", borderRadius: "8px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", color: "var(--text-primary)", fontSize: "12px", fontFamily: "inherit", outline: "none" };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
                <div>
                    <h1 style={{ fontSize: "25px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Time Tracking</h1>
                    <p style={{ marginTop: "5px", fontSize: "13px", color: "var(--text-tertiary)", fontWeight: 300 }}>Work hours, budget burn, approvals, and invoice-ready WIP in one place.</p>
                </div>
                {activeTab === "timesheet" && (
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                        {weekSubmission ? statusBadge(weekSubmission.status) : statusBadge("draft")}
                        <button onClick={() => submitWeek.mutate({ week: weekKey, totalHours: personal.totalHours })} disabled={draftEntryIds.length === 0 || submitWeek.isPending} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "10px 16px", borderRadius: "8px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "12px", fontWeight: 700, cursor: draftEntryIds.length === 0 ? "not-allowed" : "pointer", opacity: draftEntryIds.length === 0 ? 0.55 : 1 }}>
                            {submitWeek.isPending ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={14} />} Submit Week
                        </button>
                    </div>
                )}
            </div>

            <div style={{ display: "flex", gap: "2px", borderBottom: "1px solid var(--border-primary)", overflowX: "auto" }}>
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "11px 16px", border: "none", cursor: "pointer", background: "transparent", color: activeTab === tab.key ? "var(--accent-primary)" : "var(--text-tertiary)", fontSize: "13px", fontWeight: activeTab === tab.key ? 600 : 400, fontFamily: "inherit", borderBottom: activeTab === tab.key ? "2px solid var(--accent-primary)" : "2px solid transparent", whiteSpace: "nowrap" }}><Icon size={14} /> {tab.label}</button>;
                })}
            </div>

            {activeTab === "timesheet" && (
                <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))", gap: "12px" }}>
                        {[
                            { label: "Hours Logged", value: `${personal.totalHours}h`, meta: "Target 40h", icon: Clock, color: personal.totalHours >= 32 ? "var(--success)" : "var(--warning)" },
                            { label: "Billable", value: `${personal.billableHours}h`, meta: `${personal.nonBillableHours}h non-billable`, icon: Briefcase, color: "var(--accent-primary)" },
                            { label: "Utilization", value: `${personal.utilization}%`, meta: "Billable / 40h", icon: Target, color: personal.utilization >= 75 ? "var(--success)" : "var(--warning)" },
                            { label: "Submitted", value: `${personal.submittedHours}h`, meta: `${personal.approvedHours}h approved`, icon: CheckCircle, color: "var(--info)" },
                            { label: "Unbilled WIP", value: `${personal.approvedBillableHours}h`, meta: "Approved billable", icon: TrendingUp, color: "var(--accent-secondary)" },
                            { label: "Billable Value", value: formatCurrency(personal.billableValue), meta: `${formatCurrency(personal.laborCost)} labor cost`, icon: DollarSign, color: "var(--accent-gold)" },
                        ].map((card) => {
                            const Icon = card.icon;
                            return <div key={card.label} style={{ padding: "17px", borderRadius: "14px", background: "linear-gradient(135deg, var(--bg-card), var(--bg-warm))", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}><p style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{card.label}</p><Icon size={15} style={{ color: card.color }} /></div><p style={{ fontSize: "22px", fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{card.value}</p><p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{card.meta}</p></div>;
                        })}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 0.85fr) minmax(420px, 1.4fr)", gap: "16px", alignItems: "start" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div style={{ padding: "18px", borderRadius: "14px", border: `1.5px solid ${timerRunning ? "rgba(176,122,74,0.35)" : "var(--border-primary)"}`, background: timerRunning ? "linear-gradient(135deg, rgba(176,122,74,0.08), var(--bg-card))" : "var(--bg-card)", boxShadow: "var(--shadow-card)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", alignItems: "center", marginBottom: "14px" }}><div style={{ display: "flex", alignItems: "center", gap: "10px" }}><div style={{ width: "36px", height: "36px", borderRadius: "50%", display: "grid", placeItems: "center", background: "rgba(176,122,74,0.1)", color: "var(--accent-primary)" }}><Timer size={17} /></div><div><p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>Quick Timer</p><p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Stops into today's timesheet.</p></div></div><span style={{ fontSize: "18px", fontWeight: 600, color: timerRunning ? "var(--accent-primary)" : "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>{formatTimer(timerSec)}</span></div>
                                <div style={{ display: "flex", gap: "8px" }}><button onClick={toggleTimer} disabled={!draft.projectId || !draft.phaseId || logEntry.isPending} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", padding: "10px", borderRadius: "8px", border: "none", background: timerRunning ? "rgba(176,80,64,0.1)" : "var(--accent-primary)", color: timerRunning ? "var(--danger)" : "white", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>{timerRunning ? <Square size={14} /> : <Play size={14} />} {timerRunning ? "Stop & Log" : "Start Timer"}</button><button onClick={() => { setTimerRunning(false); setTimerSec(0); }} style={{ padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-secondary)", background: "transparent", color: "var(--text-muted)", cursor: "pointer" }}><RotateCcw size={14} /></button></div>
                            </div>

                            <div style={{ padding: "18px", borderRadius: "14px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}><div><p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>Log Work</p><p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Project, phase, optional deliverable/task.</p></div><button onClick={() => { resetDraft(); setShowForm(!showForm); }} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 11px", borderRadius: "8px", border: "none", background: "var(--accent-primary)", color: "white", cursor: "pointer", fontSize: "11px", fontWeight: 700 }}><Plus size={13} /> Add</button></div>
                                {showForm && (
                                    <div style={{ display: "grid", gap: "10px" }}>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}><input type="date" value={draft.date} onChange={(e) => setDraft((prev) => ({ ...prev, date: e.target.value }))} min={selectedPhase?.startDate || undefined} max={selectedPhase?.endDate || undefined} style={fieldStyle} /><input type="number" min="0" max="24" step="0.25" value={draft.hours} onChange={(e) => setDraft((prev) => ({ ...prev, hours: e.target.value }))} placeholder="Hours" style={fieldStyle} /></div>
                                        <select value={draft.projectId} onChange={(e) => { const project = (projectOptions as any[]).find((item) => item.id === e.target.value); setDraft((prev) => ({ ...prev, projectId: e.target.value, phaseId: project?.phases?.[0]?.id || "", deliverableId: "", taskId: "" })); }} style={fieldStyle}><option value="">Select project...</option>{(projectOptions as any[]).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>
                                        <select value={draft.phaseId} onChange={(e) => setDraft((prev) => ({ ...prev, phaseId: e.target.value, deliverableId: "", taskId: "" }))} style={fieldStyle}><option value="">Select phase...</option>{(selectedProject?.phases || []).map((phase: any) => <option key={phase.id} value={phase.id}>{phase.name}</option>)}</select>
                                        <select value={draft.deliverableId} onChange={(e) => setDraft((prev) => ({ ...prev, deliverableId: e.target.value, taskId: "" }))} style={fieldStyle}><option value="">Optional deliverable...</option>{(selectedPhase?.deliverables || []).map((deliverable: any) => <option key={deliverable.id} value={deliverable.id}>{deliverable.title}</option>)}</select>
                                        <select value={draft.taskId} onChange={(e) => setDraft((prev) => ({ ...prev, taskId: e.target.value }))} disabled={!draft.deliverableId} style={{ ...fieldStyle, opacity: !draft.deliverableId ? 0.6 : 1 }}><option value="">Optional task...</option>{(selectedDeliverable?.tasks || []).map((task: any) => <option key={task.id} value={task.id}>{task.title}</option>)}</select>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}><select value={draft.entryType} onChange={(e) => setDraft((prev) => ({ ...prev, entryType: e.target.value as EntryType, billable: e.target.value === "regular" ? prev.billable : false }))} style={fieldStyle}>{Object.entries(entryTypeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><select value={draft.activityType} onChange={(e) => setDraft((prev) => ({ ...prev, activityType: e.target.value as ActivityType }))} style={fieldStyle}>{Object.entries(activityTypeLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
                                        <input value={draft.notes} onChange={(e) => setDraft((prev) => ({ ...prev, notes: e.target.value }))} placeholder="What did you work on?" style={fieldStyle} />
                                        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-secondary)" }}><input type="checkbox" checked={draft.billable} disabled={draft.entryType !== "regular"} onChange={(e) => setDraft((prev) => ({ ...prev, billable: e.target.checked }))} /> Billable after approval</label>
                                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}><button onClick={() => { resetDraft(); setShowForm(false); }} style={{ padding: "9px 13px", borderRadius: "8px", border: "1px solid var(--border-secondary)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", fontSize: "12px" }}>Cancel</button><button onClick={saveDraft} disabled={!draft.projectId || !draft.phaseId || !Number(draft.hours) || logEntry.isPending} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 14px", borderRadius: "8px", border: "none", background: "var(--accent-primary)", color: "white", cursor: "pointer", opacity: !draft.projectId || !draft.phaseId || !Number(draft.hours) ? 0.55 : 1, fontSize: "12px", fontWeight: 700 }}>{logEntry.isPending && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}{draft.id ? "Save Entry" : "Log Time"}</button></div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ borderRadius: "14px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", borderBottom: "1px solid var(--border-primary)", background: "linear-gradient(135deg, var(--bg-card), var(--bg-warm))" }}><div><h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)" }}>Weekly Work Ledger</h3><p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>{weekLabel}</p></div><div style={{ display: "flex", gap: "8px", alignItems: "center" }}><button onClick={() => setWeekOffset((prev) => prev - 1)} style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border-secondary)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}>Prev</button><button onClick={() => setWeekOffset(0)} style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border-secondary)", background: weekOffset === 0 ? "var(--bg-warm)" : "transparent", color: "var(--text-secondary)", cursor: "pointer" }}>This Week</button><button onClick={() => setWeekOffset((prev) => prev + 1)} style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid var(--border-secondary)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}>Next</button></div></div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(95px, 1fr))", borderBottom: "1px solid var(--border-primary)", overflowX: "auto" }}>{weekDays.map((day, index) => <div key={day} style={{ padding: "12px", borderRight: index < 6 ? "1px solid var(--border-primary)" : "none", background: index >= 5 ? "var(--bg-secondary)" : "transparent" }}><p style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{day}</p><p style={{ fontSize: "18px", color: "var(--text-primary)", fontWeight: 600, marginTop: "3px" }}>{dayTotals[index]}h</p><p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "3px" }}>{weekDates[index].toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p></div>)}</div>
                            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
                                {entriesLoading && <div style={{ padding: "44px", textAlign: "center", color: "var(--text-muted)" }}><Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} /> Loading time...</div>}
                                {!entriesLoading && groupedEntries.every((group) => group.entries.length === 0) && <div style={{ padding: "42px", textAlign: "center", color: "var(--text-muted)", borderRadius: "12px", background: "var(--bg-secondary)", border: "1px dashed var(--border-secondary)" }}><Clock size={24} style={{ marginBottom: "8px" }} /><p style={{ fontSize: "13px" }}>No time logged this week yet.</p></div>}
                                {groupedEntries.map((group) => group.entries.length > 0 && <div key={group.iso} style={{ display: "grid", gap: "8px" }}><p style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>{group.date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>{group.entries.map((entry: any) => { const config = statusConfig[entry.status as TimesheetStatus] || statusConfig.draft; const locked = entry.status === "approved" || entry.status === "submitted"; return <div key={entry.id} style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1.2fr) minmax(130px, 0.7fr) auto auto", gap: "12px", alignItems: "center", padding: "13px 14px", borderRadius: "12px", background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}><div><p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{entry.project?.name}</p><p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>{entry.phase?.name}{entry.deliverable?.title ? ` / ${entry.deliverable.title}` : ""}{entry.task?.title ? ` / ${entry.task.title}` : ""}</p>{entry.notes && <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "5px" }}>{entry.notes}</p>}</div><div><p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{entry.hours}h {entry.billable ? "billable" : "non-billable"}</p><p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "3px" }}>{activityTypeLabels[entry.activityType as ActivityType]} / {entryTypeLabels[entry.entryType as EntryType]}</p></div><span style={{ fontSize: "10px", fontWeight: 700, padding: "4px 9px", borderRadius: "999px", color: config.color, background: config.bg, textTransform: "uppercase" }}>{config.label}</span><div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}><button onClick={() => editEntry(entry)} disabled={locked} style={{ padding: "7px", borderRadius: "7px", border: "1px solid var(--border-secondary)", background: "transparent", color: "var(--text-muted)", cursor: locked ? "not-allowed" : "pointer", opacity: locked ? 0.45 : 1 }}><Edit3 size={13} /></button><button onClick={() => deleteEntry.mutate({ id: entry.id })} disabled={locked} style={{ padding: "7px", borderRadius: "7px", border: "1px solid var(--border-secondary)", background: "transparent", color: "var(--danger)", cursor: locked ? "not-allowed" : "pointer", opacity: locked ? 0.45 : 1 }}><Trash2 size={13} /></button></div></div>; })}</div>)}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {activeTab === "timeoff" && <SimpleTimeOff showForm={showTimeOffForm} setShowForm={setShowTimeOffForm} newTimeOff={newTimeOff} setNewTimeOff={setNewTimeOff} requestTimeOff={requestTimeOff} requests={myTimeOffRequests as any[]} fieldStyle={fieldStyle} statusBadge={statusBadge} />}
            {activeTab === "past" && <SubmissionList submissions={mySubmissions as any[]} statusBadge={statusBadge} />}
            {activeTab === "team-timesheets" && canApprove && <TeamSubmissions submissions={teamSubmissions as any[]} approveWeek={approveWeek} rejectWeek={rejectWeek} statusBadge={statusBadge} />}
            {activeTab === "timeoff-requests" && canApprove && <TeamTimeOff requests={teamTimeOffRequests as any[]} approveTimeOff={approveTimeOff} rejectTimeOff={rejectTimeOff} statusBadge={statusBadge} />}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

function SimpleTimeOff({ showForm, setShowForm, newTimeOff, setNewTimeOff, requestTimeOff, requests, fieldStyle, statusBadge }: any) {
    return <div style={{ maxWidth: "820px", display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)" }}>My Time Off</h3><p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>Request PTO, sick leave, or personal time.</p></div><button onClick={() => setShowForm(!showForm)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 14px", borderRadius: "8px", border: "none", background: "var(--accent-primary)", color: "white", cursor: "pointer", fontSize: "12px", fontWeight: 700 }}><Plus size={14} /> Request</button></div>
        {showForm && <div style={{ padding: "18px", borderRadius: "14px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)", display: "grid", gap: "12px" }}><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}><select value={newTimeOff.type} onChange={(e) => setNewTimeOff((prev: any) => ({ ...prev, type: e.target.value }))} style={fieldStyle}><option value="pto">PTO</option><option value="sick">Sick</option><option value="personal">Personal</option><option value="other">Other</option></select><input type="date" value={newTimeOff.startDate} onChange={(e) => setNewTimeOff((prev: any) => ({ ...prev, startDate: e.target.value }))} style={fieldStyle} /><input type="date" value={newTimeOff.endDate} onChange={(e) => setNewTimeOff((prev: any) => ({ ...prev, endDate: e.target.value }))} style={fieldStyle} /><input type="number" value={newTimeOff.hours} onChange={(e) => setNewTimeOff((prev: any) => ({ ...prev, hours: Number(e.target.value) || 0 }))} style={fieldStyle} /></div><input value={newTimeOff.notes} onChange={(e) => setNewTimeOff((prev: any) => ({ ...prev, notes: e.target.value }))} placeholder="Optional notes" style={fieldStyle} /><div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}><button onClick={() => setShowForm(false)} style={{ padding: "9px 13px", borderRadius: "8px", border: "1px solid var(--border-secondary)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer" }}>Cancel</button><button onClick={() => { if (newTimeOff.startDate && newTimeOff.endDate) requestTimeOff.mutate(newTimeOff); }} style={{ padding: "9px 14px", borderRadius: "8px", border: "none", background: "var(--accent-primary)", color: "white", cursor: "pointer", fontWeight: 700 }}>Submit Request</button></div></div>}
        {requests.map((request: any) => <div key={request.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-sm)" }}><div><p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{(request.type || "pto").toUpperCase()} / {request.hours}h</p><p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>{request.startDate} to {request.endDate}{request.notes ? ` / ${request.notes}` : ""}</p></div>{statusBadge(request.status)}</div>)}
        {requests.length === 0 && <p style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center", padding: "24px" }}>No time off requests yet.</p>}
    </div>;
}

function SubmissionList({ submissions, statusBadge }: any) {
    return <div style={{ maxWidth: "860px", display: "flex", flexDirection: "column", gap: "10px" }}>{submissions.map((submission: any) => <div key={submission.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 16px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-sm)" }}><div><p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{submission.week}</p><p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>{submission.totalHours}h submitted{submission.reviewedBy ? ` / Reviewed by ${submission.reviewedBy}` : ""}</p></div>{statusBadge(submission.status)}</div>)}{submissions.length === 0 && <p style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center", padding: "24px" }}>No submitted timesheets yet.</p>}</div>;
}

function TeamSubmissions({ submissions, approveWeek, rejectWeek, statusBadge }: any) {
    return <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>{submissions.map((submission: any) => <div key={submission.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "15px 16px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-sm)" }}><div style={{ display: "flex", alignItems: "center", gap: "12px" }}><div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "var(--bg-warm)", display: "grid", placeItems: "center", color: "var(--accent-primary)", fontWeight: 700 }}>{initials(submission.user?.name || "?")}</div><div><p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{submission.user?.name}</p><p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>{submission.week} / {submission.totalHours}h</p></div></div><div style={{ display: "flex", alignItems: "center", gap: "8px" }}>{statusBadge(submission.status)}{submission.status === "submitted" && <><button onClick={() => approveWeek.mutate({ id: submission.id })} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 11px", borderRadius: "8px", border: "none", background: "rgba(90,122,70,0.1)", color: "var(--success)", cursor: "pointer", fontWeight: 700 }}><Check size={13} /> Approve</button><button onClick={() => rejectWeek.mutate({ id: submission.id, notes: "" })} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 11px", borderRadius: "8px", border: "none", background: "rgba(176,80,64,0.08)", color: "var(--danger)", cursor: "pointer", fontWeight: 700 }}><XCircle size={13} /> Reject</button></>}</div></div>)}{submissions.length === 0 && <p style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center", padding: "24px" }}>No team timesheets yet.</p>}</div>;
}

function TeamTimeOff({ requests, approveTimeOff, rejectTimeOff, statusBadge }: any) {
    return <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>{requests.map((request: any) => <div key={request.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "15px 16px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-sm)" }}><div style={{ display: "flex", alignItems: "center", gap: "12px" }}><div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "var(--bg-warm)", display: "grid", placeItems: "center", color: "var(--accent-primary)", fontWeight: 700 }}>{initials(request.user?.name || "?")}</div><div><p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>{request.user?.name} / {(request.type || "pto").toUpperCase()}</p><p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "3px" }}>{request.startDate} to {request.endDate} / {request.hours}h{request.notes ? ` / ${request.notes}` : ""}</p></div></div><div style={{ display: "flex", alignItems: "center", gap: "8px" }}>{statusBadge(request.status)}{request.status === "pending" && <><button onClick={() => approveTimeOff.mutate({ id: request.id })} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 11px", borderRadius: "8px", border: "none", background: "rgba(90,122,70,0.1)", color: "var(--success)", cursor: "pointer", fontWeight: 700 }}><Check size={13} /> Approve</button><button onClick={() => rejectTimeOff.mutate({ id: request.id })} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "7px 11px", borderRadius: "8px", border: "none", background: "rgba(176,80,64,0.08)", color: "var(--danger)", cursor: "pointer", fontWeight: 700 }}><XCircle size={13} /> Reject</button></>}</div></div>)}{requests.length === 0 && <p style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center", padding: "24px" }}>No time off requests to review.</p>}</div>;
}
