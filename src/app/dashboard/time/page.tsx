"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/app/providers";
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    Play,
    Square,
    Send,
    Check,
    AlertCircle,
    Timer,
    Plus,
    Trash2,
    RotateCcw,
    TrendingUp,
    Target,
    Calendar,
    Briefcase,
    DollarSign,
    Users,
    Palmtree,
    FileText,
    CheckCircle,
    XCircle,
    Download,
} from "lucide-react";

type TimeTab = "timesheet" | "timeoff" | "past" | "team-timesheets" | "timeoff-requests";
const timeTabs: { key: TimeTab; label: string; icon: any; managerOnly?: boolean }[] = [
    { key: "timesheet", label: "Timesheet", icon: Clock },
    { key: "timeoff", label: "Time Off", icon: Palmtree },
    { key: "past", label: "Past Timesheets", icon: FileText },
    { key: "team-timesheets", label: "Team Timesheets", icon: Users, managerOnly: true },
    { key: "timeoff-requests", label: "Time Off Requests", icon: CheckCircle, managerOnly: true },
];

/* ─── Types ─── */

type TimesheetStatus = "draft" | "submitted" | "approved" | "rejected";
type EntryType = "regular" | "pto" | "holiday" | "admin";
type ActivityType = "design" | "project-mgmt" | "site-visit" | "meeting" | "admin" | "other";

interface ProjectOption {
    id: string;
    name: string;
    phases: string[];
}

interface TimesheetRow {
    id: string;
    projectId: string;
    projectName: string;
    phase: string;
    hours: number[];
    notes: string[];
    billable: boolean;
    entryType: EntryType;
    activityType: ActivityType;
}

const entryTypeLabels: Record<EntryType, string> = { regular: "Regular", pto: "PTO", holiday: "Holiday", admin: "Admin" };
const activityTypeLabels: Record<ActivityType, string> = { design: "Design", "project-mgmt": "Project Mgmt", "site-visit": "Site Visit", meeting: "Meeting", admin: "Admin", other: "Other" };
const entryTypeColors: Record<EntryType, string> = { regular: "var(--accent-primary)", pto: "#6B8DD6", holiday: "#8BC6A0", admin: "var(--text-muted)" };

/* ─── Data ─── */

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const initialRows: TimesheetRow[] = [];

const previousTimesheets: { week: string; hours: number; billable: number; status: TimesheetStatus }[] = [];

const statusConfig: Record<TimesheetStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    draft: { label: "Draft", color: "var(--text-muted)", bg: "var(--bg-secondary)", icon: <Clock size={11} /> },
    submitted: { label: "Submitted", color: "var(--info)", bg: "rgba(90,122,144,0.08)", icon: <Send size={11} /> },
    approved: { label: "Approved", color: "var(--success)", bg: "rgba(90,122,70,0.08)", icon: <Check size={11} /> },
    rejected: { label: "Rejected", color: "var(--danger)", bg: "rgba(176,80,64,0.08)", icon: <AlertCircle size={11} /> },
};

/* ─── Helpers ─── */

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

const formatTimer = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

/* ════════════════════════════════════════════════════
   Component
   ════════════════════════════════════════════════════ */

export default function TimePage() {
    /* ─── tRPC data ─── */
    const { data: rawProjects = [] } = trpc.project.list.useQuery();
    const allProjects: ProjectOption[] = rawProjects.map((p: any) => ({
        id: p.id,
        name: p.name,
        phases: (p.phases || []).map((ph: any) => ph.name),
    }));
    // Fallback to default phases if no phases in DB
    const getProjectPhases = (projId: string) => {
        const proj = allProjects.find(p => p.id === projId);
        return proj?.phases?.length ? proj.phases : ["General"];
    };

    /* ─── State ─── */
    const [rows, setRows] = useState<TimesheetRow[]>(initialRows);
    const [weekOffset, setWeekOffset] = useState(0);
    const [status, setStatus] = useState<TimesheetStatus>("draft");
    const [activeTab, setActiveTab] = useState<TimeTab>("timesheet");

    // Time Off requests
    const [newTimeOff, setNewTimeOff] = useState({ type: "pto", startDate: "", endDate: "", hours: 8, notes: "" });
    const [showTimeOffForm, setShowTimeOffForm] = useState(false);
    const { data: myTimeOffRequests = [] } = trpc.time.getMyTimeOffRequests.useQuery();
    const { data: teamTimeOffRequests = [], refetch: refetchTeamTimeOff } = trpc.time.getTeamTimeOffRequests.useQuery();
    const requestTimeOff = trpc.time.requestTimeOff.useMutation({ onSuccess: () => { setShowTimeOffForm(false); setNewTimeOff({ type: "pto", startDate: "", endDate: "", hours: 8, notes: "" }); } });
    const approveTimeOff = trpc.time.approveTimeOff.useMutation({ onSuccess: () => refetchTeamTimeOff() });
    const rejectTimeOff = trpc.time.rejectTimeOff.useMutation({ onSuccess: () => refetchTeamTimeOff() });

    // Past / Team timesheets
    const { data: mySubmissions = [] } = trpc.time.getMySubmissions.useQuery();
    const { data: teamSubmissions = [], refetch: refetchTeamSubs } = trpc.time.getTeamSubmissions.useQuery();
    const submitWeek = trpc.time.submitWeek.useMutation();
    const approveWeek = trpc.time.approveWeek.useMutation({ onSuccess: () => refetchTeamSubs() });
    const rejectWeek = trpc.time.rejectWeek.useMutation({ onSuccess: () => refetchTeamSubs() });

    // Timer
    const [timerRunning, setTimerRunning] = useState(false);
    const [timerSec, setTimerSec] = useState(0);
    const [timerProjectId, setTimerProjectId] = useState("p1");
    const [timerPhase, setTimerPhase] = useState("Construction Docs");
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Add-row picker
    const [showAddRow, setShowAddRow] = useState(false);
    const [newRowProjectId, setNewRowProjectId] = useState("");
    const [newRowPhase, setNewRowPhase] = useState("");

    // Tooltip for cells (optional note)
    const [activeNote, setActiveNote] = useState<{ row: number; day: number } | null>(null);

    /* ─── Timer logic ─── */
    useEffect(() => {
        if (timerRunning) {
            intervalRef.current = setInterval(() => setTimerSec((p) => p + 1), 1000);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [timerRunning]);

    const toggleTimer = useCallback(() => {
        if (timerRunning) {
            setTimerRunning(false);
            // Auto-add the time to today's column for matching row
            const todayIdx = new Date().getDay();
            const dayCol = todayIdx === 0 ? 6 : todayIdx - 1;
            const hoursToAdd = Math.round((timerSec / 3600) * 4) / 4; // round to nearest 0.25
            if (hoursToAdd > 0) {
                setRows((prev) => {
                    const match = prev.findIndex((r) => r.projectId === timerProjectId);
                    if (match >= 0) {
                        const copy = [...prev];
                        copy[match] = { ...copy[match], hours: [...copy[match].hours] };
                        copy[match].hours[dayCol] = Math.round((copy[match].hours[dayCol] + hoursToAdd) * 4) / 4;
                        return copy;
                    }
                    return prev;
                });
            }
            setTimerSec(0);
        } else {
            setTimerRunning(true);
        }
    }, [timerRunning, timerSec, timerProjectId]);

    const resetTimer = () => {
        setTimerRunning(false);
        setTimerSec(0);
    };

    /* ─── Row operations ─── */
    const updateHour = (rowIdx: number, dayIdx: number, value: string) => {
        const v = value === "" ? 0 : parseFloat(value);
        if (isNaN(v) || v < 0 || v > 24) return;
        setRows((prev) => {
            const copy = [...prev];
            copy[rowIdx] = { ...copy[rowIdx], hours: [...copy[rowIdx].hours] };
            copy[rowIdx].hours[dayIdx] = v;
            return copy;
        });
    };

    const addRow = () => {
        if (!newRowProjectId || !newRowPhase) return;
        const proj = allProjects.find((p) => p.id === newRowProjectId);
        if (!proj) return;
        setRows((prev) => [
            ...prev,
            {
                id: `r${Date.now()}`,
                projectId: newRowProjectId,
                projectName: proj.name,
                phase: newRowPhase,
                hours: [0, 0, 0, 0, 0, 0, 0],
                notes: ["", "", "", "", "", "", ""],
                billable: true,
                entryType: "regular" as EntryType,
                activityType: "design" as ActivityType,
            },
        ]);
        setShowAddRow(false);
        setNewRowProjectId("");
        setNewRowPhase("");
    };

    const toggleBillable = (idx: number) => setRows((prev) => prev.map((r, i) => i === idx ? { ...r, billable: !r.billable } : r));
    const setEntryType = (idx: number, t: EntryType) => setRows((prev) => prev.map((r, i) => i === idx ? { ...r, entryType: t, billable: t === "regular" } : r));
    const setActivityType = (idx: number, t: ActivityType) => setRows((prev) => prev.map((r, i) => i === idx ? { ...r, activityType: t } : r));

    const removeRow = (idx: number) => setRows((prev) => prev.filter((_, i) => i !== idx));

    /* ─── Computed ─── */
    const weekDates = getWeekDates(weekOffset);
    const weekLabel = `${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

    const dayTotals = weekDays.map((_, di) => rows.reduce((s, r) => s + r.hours[di], 0));
    const weekTotal = dayTotals.reduce((s, v) => s + v, 0);
    const billableHours = rows.filter((r) => r.billable).reduce((s, r) => s + r.hours.reduce((a, b) => a + b, 0), 0);
    const nonBillableHours = weekTotal - billableHours;
    const ptoHours = rows.filter((r) => r.entryType === "pto").reduce((s, r) => s + r.hours.reduce((a, b) => a + b, 0), 0);
    const utilization = weekTotal > 0 ? Math.round((billableHours / 40) * 100) : 0;

    const sc = statusConfig[status];
    const timerProject = allProjects.find((p) => p.id === timerProjectId);

    const inputStyle = (hasValue: boolean, isWeekend: boolean, disabled: boolean): React.CSSProperties => ({
        width: "54px",
        padding: "8px 4px",
        borderRadius: "5px",
        border: `1.5px solid ${hasValue ? "rgba(176,122,74,0.2)" : "var(--border-primary)"}`,
        background: hasValue ? "rgba(176,122,74,0.04)" : isWeekend ? "var(--bg-secondary)" : "var(--bg-card)",
        fontSize: "13px",
        fontWeight: hasValue ? 500 : 400,
        color: hasValue ? "var(--text-primary)" : "var(--text-muted)",
        textAlign: "center" as const,
        outline: "none",
        fontFamily: "inherit",
        transition: "all 0.2s",
        cursor: disabled ? "not-allowed" : "text",
        opacity: disabled ? 0.6 : 1,
    });

    /* ─── Render ─── */
    return (
        <div>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Time Tracking</h1>
                    <p style={{ marginTop: "4px", fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 300 }}>
                        {activeTab === "timesheet" ? `Weekly timesheet · ${weekLabel}` : activeTab === "timeoff" ? "Request and track time off" : activeTab === "past" ? "Previously submitted timesheets" : activeTab === "team-timesheets" ? "Review team timesheet submissions" : "Review team time off requests"}
                    </p>
                </div>
                {activeTab === "timesheet" && (
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "10px", fontWeight: 600, padding: "5px 12px", borderRadius: "4px", textTransform: "uppercase", letterSpacing: "0.04em", color: sc.color, background: sc.bg }}>{sc.icon} {sc.label}</span>
                        {status === "draft" && (
                            <button onClick={() => setStatus("submitted")} style={{ padding: "10px 20px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", color: "white", fontSize: "13px", fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", transition: "all 0.2s" }}><Send size={14} /> Submit Timesheet</button>
                        )}
                        {status === "submitted" && (
                            <button onClick={() => setStatus("draft")} style={{ padding: "10px 16px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", color: "var(--text-secondary)", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}><RotateCcw size={13} /> Recall</button>
                        )}
                    </div>
                )}
            </div>

            {/* Tab navigation */}
            <div style={{ display: "flex", gap: "2px", marginBottom: "20px", borderBottom: "1px solid var(--border-primary)" }}>
                {timeTabs.map(t => (
                    <button key={t.key} onClick={() => setActiveTab(t.key)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "6px 6px 0 0", border: "none", cursor: "pointer", background: activeTab === t.key ? "var(--bg-card)" : "transparent", color: activeTab === t.key ? "var(--accent-primary)" : "var(--text-tertiary)", fontSize: "13px", fontWeight: activeTab === t.key ? 500 : 400, fontFamily: "inherit", borderBottom: activeTab === t.key ? "2px solid var(--accent-primary)" : "2px solid transparent", transition: "all 0.15s" }}>
                        <t.icon size={14} />{t.label}
                    </button>
                ))}
            </div>

            {activeTab === "timesheet" && (<>

                {/* Summary stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", marginBottom: "20px" }}>
                    {[
                        { label: "Hours Logged", value: `${weekTotal}h`, target: "/ 40h", icon: Clock, color: "var(--accent-primary)", warn: weekTotal < 32 },
                        { label: "Billable Hours", value: `${billableHours}h`, target: `${weekTotal > 0 ? Math.round((billableHours / weekTotal) * 100) : 0}% of total`, icon: Briefcase, color: "var(--accent-secondary)", warn: false },
                        { label: "Utilization", value: `${utilization}%`, target: "target: 85%", icon: Target, color: utilization >= 85 ? "var(--success)" : utilization >= 70 ? "var(--accent-gold)" : "var(--warning)", warn: utilization < 70 },
                        { label: "Working Days", value: `${dayTotals.filter((d) => d > 0).length}`, target: "of 5 days", icon: Calendar, color: "var(--info)", warn: false },
                    ].map((card, i) => (
                        <div key={i} style={{ padding: "16px 18px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <p style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{card.label}</p>
                                <card.icon size={14} style={{ color: card.color }} />
                            </div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "6px" }}>
                                <p style={{ fontSize: "22px", fontWeight: 400, color: card.warn ? card.color : "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{card.value}</p>
                                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300 }}>{card.target}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Timer bar */}
                <div style={{
                    padding: "14px 20px", borderRadius: "10px", marginBottom: "16px",
                    background: timerRunning ? "rgba(176,122,74,0.04)" : "var(--bg-card)",
                    border: `1.5px solid ${timerRunning ? "rgba(176,122,74,0.25)" : "var(--border-primary)"}`,
                    boxShadow: "var(--shadow-card)", display: "flex", alignItems: "center", justifyContent: "space-between",
                    transition: "all 0.3s",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: timerRunning ? "rgba(176,122,74,0.1)" : "var(--bg-warm)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Timer size={16} style={{ color: timerRunning ? "var(--accent-primary)" : "var(--text-muted)" }} />
                        </div>
                        <div>
                            <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}>Quick Timer</span>
                            <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                                <select
                                    value={timerProjectId}
                                    onChange={(e) => {
                                        setTimerProjectId(e.target.value);
                                        const proj = allProjects.find((p) => p.id === e.target.value);
                                        if (proj) setTimerPhase(proj.phases[0]);
                                    }}
                                    disabled={timerRunning}
                                    style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--border-primary)", background: "var(--bg-warm)", fontSize: "11px", color: "var(--text-secondary)", fontFamily: "inherit", cursor: timerRunning ? "not-allowed" : "pointer" }}
                                >
                                    {allProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <select
                                    value={timerPhase}
                                    onChange={(e) => setTimerPhase(e.target.value)}
                                    disabled={timerRunning}
                                    style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid var(--border-primary)", background: "var(--bg-warm)", fontSize: "11px", color: "var(--text-muted)", fontFamily: "inherit", cursor: timerRunning ? "not-allowed" : "pointer" }}
                                >
                                    {(timerProject?.phases || []).map((ph) => <option key={ph} value={ph}>{ph}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        {timerRunning && (
                            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--accent-primary)", animation: "pulse 1.5s infinite" }} />
                        )}
                        <span style={{
                            fontSize: "24px", fontWeight: 400,
                            color: timerRunning ? "var(--accent-primary)" : "var(--text-muted)",
                            fontFamily: "var(--font-dm-serif), Georgia, serif",
                            fontVariantNumeric: "tabular-nums", minWidth: "110px", textAlign: "center",
                            letterSpacing: "1px",
                        }}>
                            {formatTimer(timerSec)}
                        </span>
                        <div style={{ display: "flex", gap: "6px" }}>
                            <button
                                onClick={toggleTimer}
                                style={{
                                    width: "38px", height: "38px", borderRadius: "50%", border: "none",
                                    background: timerRunning ? "rgba(176,80,64,0.08)" : "var(--accent-primary)",
                                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                    color: timerRunning ? "var(--danger)" : "white",
                                    transition: "all 0.2s",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                            >
                                {timerRunning ? <Square size={14} /> : <Play size={14} style={{ marginLeft: "2px" }} />}
                            </button>
                            {timerSec > 0 && (
                                <button onClick={resetTimer} title="Reset timer"
                                    style={{ width: "38px", height: "38px", borderRadius: "50%", border: "1px solid var(--border-primary)", background: "var(--bg-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                                    <RotateCcw size={13} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Week navigation */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <button onClick={() => setWeekOffset((w) => w - 1)} style={{ width: "32px", height: "32px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                            <ChevronLeft size={16} />
                        </button>
                        <button onClick={() => setWeekOffset(0)} style={{ padding: "6px 14px", borderRadius: "6px", border: `1px solid ${weekOffset === 0 ? "rgba(176,122,74,0.3)" : "var(--border-primary)"}`, background: weekOffset === 0 ? "rgba(176,122,74,0.06)" : "var(--bg-card)", cursor: "pointer", fontSize: "12px", color: weekOffset === 0 ? "var(--accent-primary)" : "var(--text-muted)", fontWeight: weekOffset === 0 ? 500 : 400, transition: "all 0.15s" }}>
                            This Week
                        </button>
                        <button onClick={() => setWeekOffset((w) => w + 1)} style={{ width: "32px", height: "32px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {weekTotal < 40 && <span style={{ fontSize: "10px", color: "var(--warning)", fontWeight: 500, padding: "3px 8px", borderRadius: "3px", background: "rgba(176,138,48,0.06)" }}>{40 - weekTotal}h remaining</span>}
                        {weekTotal >= 40 && <span style={{ fontSize: "10px", color: "var(--success)", fontWeight: 500, padding: "3px 8px", borderRadius: "3px", background: "rgba(90,122,70,0.06)" }}>Target met ✓</span>}
                    </div>
                </div>

                {/* ═══ Timesheet Grid ═══ */}
                <div style={{ borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", minWidth: "280px" }}>
                                    Project / Phase
                                </th>
                                {weekDays.map((day, i) => {
                                    const d = weekDates[i];
                                    const isToday = d.toDateString() === new Date().toDateString();
                                    const isWeekend = i >= 5;
                                    return (
                                        <th key={day} style={{ padding: "10px 6px", textAlign: "center", width: "72px" }}>
                                            <div style={{ fontSize: "9px", fontWeight: 500, color: isWeekend ? "var(--text-muted)" : "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{day}</div>
                                            <div style={{
                                                fontSize: "15px", fontWeight: isToday ? 600 : 400,
                                                color: isToday ? "white" : "var(--text-secondary)",
                                                fontFamily: "var(--font-dm-serif), Georgia, serif",
                                                marginTop: "3px",
                                                ...(isToday ? {
                                                    background: "var(--accent-primary)", borderRadius: "50%",
                                                    width: "28px", height: "28px", display: "inline-flex",
                                                    alignItems: "center", justifyContent: "center",
                                                } : {}),
                                            }}>
                                                {d.getDate()}
                                            </div>
                                        </th>
                                    );
                                })}
                                <th style={{ padding: "10px 8px", textAlign: "center", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", width: "56px" }}>Total</th>
                                <th style={{ width: "40px" }} />
                            </tr>
                        </thead>

                        <tbody>
                            {rows.map((row, ri) => {
                                const rowTotal = row.hours.reduce((s, h) => s + h, 0);
                                return (
                                    <tr key={row.id} style={{ borderBottom: "1px solid var(--border-primary)" }}>
                                        <td style={{ padding: "10px 16px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                <div style={{ width: "4px", height: "46px", borderRadius: "2px", background: entryTypeColors[row.entryType], flexShrink: 0, opacity: row.billable ? 1 : 0.4 }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                        <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.3 }}>{row.projectName}</p>
                                                        {/* Billable toggle */}
                                                        <button
                                                            onClick={() => status === "draft" && toggleBillable(ri)}
                                                            title={row.billable ? "Billable" : "Non-billable"}
                                                            style={{
                                                                display: "inline-flex", alignItems: "center", gap: "2px",
                                                                padding: "1px 6px", borderRadius: "3px", border: "none",
                                                                background: row.billable ? "rgba(90,122,70,0.1)" : "rgba(150,150,150,0.1)",
                                                                color: row.billable ? "var(--success)" : "var(--text-muted)",
                                                                fontSize: "9px", fontWeight: 600, cursor: status === "draft" ? "pointer" : "default",
                                                                textTransform: "uppercase", letterSpacing: "0.04em",
                                                                transition: "all 0.15s",
                                                            }}
                                                        >
                                                            <DollarSign size={9} />
                                                            {row.billable ? "Billable" : "Non-bill"}
                                                        </button>
                                                    </div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                                                        <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 300 }}>{row.phase}</span>
                                                        <span style={{ fontSize: "8px", color: "var(--text-muted)" }}>•</span>
                                                        {status === "draft" ? (
                                                            <select value={row.entryType} onChange={(e) => setEntryType(ri, e.target.value as EntryType)}
                                                                style={{ padding: "0 4px", border: "none", background: "none", fontSize: "10px", color: entryTypeColors[row.entryType], fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
                                                            >
                                                                {Object.entries(entryTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                                            </select>
                                                        ) : (
                                                            <span style={{ fontSize: "10px", color: entryTypeColors[row.entryType], fontWeight: 500 }}>{entryTypeLabels[row.entryType]}</span>
                                                        )}
                                                        <span style={{ fontSize: "8px", color: "var(--text-muted)" }}>•</span>
                                                        {status === "draft" ? (
                                                            <select value={row.activityType} onChange={(e) => setActivityType(ri, e.target.value as ActivityType)}
                                                                style={{ padding: "0 4px", border: "none", background: "none", fontSize: "10px", color: "var(--text-muted)", fontWeight: 400, cursor: "pointer", fontFamily: "inherit" }}
                                                            >
                                                                {Object.entries(activityTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                                            </select>
                                                        ) : (
                                                            <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{activityTypeLabels[row.activityType]}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        {weekDays.map((_, di) => (
                                            <td key={di} style={{ padding: "5px 3px", textAlign: "center" }}>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="24"
                                                    step="0.25"
                                                    value={row.hours[di] || ""}
                                                    onChange={(e) => updateHour(ri, di, e.target.value)}
                                                    disabled={status !== "draft"}
                                                    style={inputStyle(row.hours[di] > 0, di >= 5, status !== "draft")}
                                                    onFocus={(e) => { if (status === "draft") { e.currentTarget.style.borderColor = "var(--accent-primary)"; e.currentTarget.style.boxShadow = "0 0 0 2px rgba(176,122,74,0.1)"; } }}
                                                    onBlur={(e) => { e.currentTarget.style.borderColor = row.hours[di] > 0 ? "rgba(176,122,74,0.2)" : "var(--border-primary)"; e.currentTarget.style.boxShadow = "none"; }}
                                                    placeholder="–"
                                                />
                                            </td>
                                        ))}
                                        <td style={{ padding: "10px 8px", textAlign: "center" }}>
                                            <span style={{
                                                fontSize: "14px", fontWeight: 600,
                                                color: rowTotal > 0 ? "var(--text-primary)" : "var(--text-muted)",
                                                fontFamily: "var(--font-dm-serif), Georgia, serif",
                                            }}>{rowTotal || "–"}</span>
                                        </td>
                                        <td style={{ padding: "4px 8px" }}>
                                            {status === "draft" && (
                                                <button onClick={() => removeRow(ri)} title="Remove row"
                                                    style={{ width: "24px", height: "24px", borderRadius: "4px", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(176,80,64,0.06)"; e.currentTarget.style.color = "var(--danger)"; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-muted)"; }}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>

                        <tfoot>
                            <tr style={{ background: "var(--bg-warm)" }}>
                                <td style={{ padding: "12px 16px" }}>
                                    <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}>Daily Total</div>
                                    <div style={{ display: "flex", gap: "10px", marginTop: "3px" }}>
                                        <span style={{ fontSize: "10px", color: "var(--success)" }}>Billable: {billableHours}h</span>
                                        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Non-bill: {nonBillableHours}h</span>
                                        {ptoHours > 0 && <span style={{ fontSize: "10px", color: "#6B8DD6" }}>PTO: {ptoHours}h</span>}
                                    </div>
                                </td>
                                {dayTotals.map((total, i) => (
                                    <td key={i} style={{ padding: "12px 6px", textAlign: "center" }}>
                                        <span style={{
                                            fontSize: "13px", fontWeight: 600,
                                            color: total > 10 ? "var(--danger)" : total > 8 ? "var(--warning)" : total > 0 ? "var(--text-primary)" : "var(--text-muted)",
                                            fontFamily: "var(--font-dm-serif), Georgia, serif",
                                        }}>{total || "–"}</span>
                                    </td>
                                ))}
                                <td style={{ padding: "12px 8px", textAlign: "center" }}>
                                    <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--accent-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{weekTotal}</span>
                                </td>
                                <td />
                            </tr>
                        </tfoot>
                    </table>

                    {/* Add row */}
                    {status === "draft" && !showAddRow && (
                        <button onClick={() => setShowAddRow(true)}
                            style={{ width: "100%", padding: "14px", border: "none", borderTop: "1px dashed var(--border-primary)", background: "transparent", cursor: "pointer", fontSize: "12px", color: "var(--accent-primary)", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "background 0.15s" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-warm)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        >
                            <Plus size={14} /> Add project row
                        </button>
                    )}

                    {/* Add row picker */}
                    {status === "draft" && showAddRow && (
                        <div style={{ padding: "14px 16px", borderTop: "1px dashed var(--border-primary)", background: "var(--bg-warm)", display: "flex", alignItems: "center", gap: "10px" }}>
                            <select
                                value={newRowProjectId}
                                onChange={(e) => {
                                    setNewRowProjectId(e.target.value);
                                    const proj = allProjects.find((p) => p.id === e.target.value);
                                    if (proj) setNewRowPhase(proj.phases[0]);
                                }}
                                style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-secondary)", fontFamily: "inherit", cursor: "pointer", flex: 1 }}
                            >
                                <option value="">Select project…</option>
                                {allProjects.filter((p) => !rows.some((r) => r.projectId === p.id && r.phase === (allProjects.find((ap) => ap.id === p.id)?.phases[0] || ""))).map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            {newRowProjectId && (
                                <select
                                    value={newRowPhase}
                                    onChange={(e) => setNewRowPhase(e.target.value)}
                                    style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", fontSize: "12px", color: "var(--text-muted)", fontFamily: "inherit", cursor: "pointer", flex: 1 }}
                                >
                                    {(allProjects.find((p) => p.id === newRowProjectId)?.phases || []).map((ph) => (
                                        <option key={ph} value={ph}>{ph}</option>
                                    ))}
                                </select>
                            )}
                            <button onClick={addRow} disabled={!newRowProjectId || !newRowPhase}
                                style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: newRowProjectId ? "var(--accent-primary)" : "var(--bg-tertiary)", color: newRowProjectId ? "white" : "var(--text-muted)", fontSize: "12px", fontWeight: 500, cursor: newRowProjectId ? "pointer" : "not-allowed", transition: "all 0.2s" }}>
                                Add
                            </button>
                            <button onClick={() => { setShowAddRow(false); setNewRowProjectId(""); setNewRowPhase(""); }}
                                style={{ padding: "8px", borderRadius: "4px", border: "none", background: "transparent", color: "var(--text-muted)", cursor: "pointer", fontSize: "14px", lineHeight: 1 }}>
                                ×
                            </button>
                        </div>
                    )}
                </div>

                {/* ═══ Recent Timesheets ═══ */}
                <div style={{ marginTop: "24px", padding: "24px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "16px" }}>Recent Timesheets</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {previousTimesheets.map((entry, i) => {
                            const es = statusConfig[entry.status];
                            const billPct = Math.round((entry.billable / entry.hours) * 100);
                            return (
                                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: "8px", background: "var(--bg-warm)", border: "1px solid var(--border-primary)", transition: "all 0.15s", cursor: "pointer" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-secondary)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-primary)"; }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                        <span style={{ fontSize: "12px", color: "var(--text-secondary)", minWidth: "160px" }}>{entry.week}</span>
                                        <div style={{ width: "1px", height: "20px", background: "var(--border-primary)" }} />
                                        <div style={{ display: "flex", gap: "16px" }}>
                                            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Total: <strong style={{ color: "var(--text-primary)", fontWeight: 500 }}>{entry.hours}h</strong></span>
                                            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Billable: <strong style={{ color: "var(--accent-primary)", fontWeight: 500 }}>{entry.billable}h</strong></span>
                                            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Rate: <strong style={{ color: billPct >= 85 ? "var(--success)" : "var(--warning)", fontWeight: 500 }}>{billPct}%</strong></span>
                                        </div>
                                    </div>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "9px", fontWeight: 600, padding: "3px 10px", borderRadius: "3px", textTransform: "uppercase", letterSpacing: "0.04em", color: es.color, background: es.bg }}>
                                        {es.icon} {es.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Pulse animation for timer */}
                <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
            </>)}

            {/* ═══ Time Off Tab ═══ */}
            {activeTab === "timeoff" && (
                <div style={{ maxWidth: "720px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                        <h3 style={{ fontSize: "15px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>My Time Off Requests</h3>
                        <button onClick={() => setShowTimeOffForm(true)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "6px", background: "var(--accent-primary)", color: "white", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 500, fontFamily: "inherit" }}><Plus size={14} /> Request Time Off</button>
                    </div>
                    {showTimeOffForm && (
                        <div style={{ padding: "20px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", marginBottom: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
                                <div><label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500, marginBottom: "4px", display: "block" }}>Type</label><select value={newTimeOff.type} onChange={e => setNewTimeOff(p => ({ ...p, type: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", fontSize: "13px", fontFamily: "inherit" }}><option value="pto">PTO</option><option value="sick">Sick</option><option value="personal">Personal</option><option value="other">Other</option></select></div>
                                <div><label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500, marginBottom: "4px", display: "block" }}>Start Date</label><input type="date" value={newTimeOff.startDate} onChange={e => setNewTimeOff(p => ({ ...p, startDate: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", fontSize: "13px", fontFamily: "inherit" }} /></div>
                                <div><label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500, marginBottom: "4px", display: "block" }}>End Date</label><input type="date" value={newTimeOff.endDate} onChange={e => setNewTimeOff(p => ({ ...p, endDate: e.target.value }))} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", fontSize: "13px", fontFamily: "inherit" }} /></div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                                <div><label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500, marginBottom: "4px", display: "block" }}>Hours</label><input type="number" value={newTimeOff.hours} onChange={e => setNewTimeOff(p => ({ ...p, hours: parseFloat(e.target.value) || 0 }))} style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", fontSize: "13px", fontFamily: "inherit" }} /></div>
                                <div><label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 500, marginBottom: "4px", display: "block" }}>Notes</label><input value={newTimeOff.notes} onChange={e => setNewTimeOff(p => ({ ...p, notes: e.target.value }))} placeholder="Optional notes" style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-secondary)", fontSize: "13px", fontFamily: "inherit" }} /></div>
                            </div>
                            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                <button onClick={() => setShowTimeOffForm(false)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-card)", cursor: "pointer", fontSize: "12px", fontFamily: "inherit", color: "var(--text-secondary)" }}>Cancel</button>
                                <button onClick={() => { if (newTimeOff.startDate && newTimeOff.endDate) requestTimeOff.mutate(newTimeOff); }} style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", color: "white", cursor: "pointer", fontSize: "12px", fontFamily: "inherit", fontWeight: 500 }}>Submit Request</button>
                            </div>
                        </div>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {(myTimeOffRequests as any[]).map((r: any) => (
                            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderRadius: "8px", background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ width: "4px", height: "36px", borderRadius: "2px", background: r.status === "approved" ? "var(--success)" : r.status === "rejected" ? "var(--danger)" : "var(--accent-primary)" }} />
                                    <div>
                                        <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{(r.type || "pto").toUpperCase()} · {r.hours}h</p>
                                        <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300, marginTop: "2px" }}>{r.startDate} → {r.endDate}{r.notes ? ` · ${r.notes}` : ""}</p>
                                    </div>
                                </div>
                                <span style={{ fontSize: "10px", fontWeight: 600, padding: "4px 10px", borderRadius: "4px", textTransform: "uppercase", color: r.status === "approved" ? "var(--success)" : r.status === "rejected" ? "var(--danger)" : "var(--accent-primary)", background: r.status === "approved" ? "rgba(90,122,70,0.08)" : r.status === "rejected" ? "rgba(176,80,64,0.08)" : "rgba(176,122,74,0.08)" }}>{r.status}</span>
                            </div>
                        ))}
                        {myTimeOffRequests.length === 0 && <p style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 300, padding: "20px 0", textAlign: "center" }}>No time off requests yet.</p>}
                    </div>
                </div>
            )}

            {/* ═══ Past Timesheets Tab ═══ */}
            {activeTab === "past" && (
                <div style={{ maxWidth: "720px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {(mySubmissions as any[]).map((s: any) => (
                            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderRadius: "8px", background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                    <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", minWidth: "100px" }}>{s.week}</span>
                                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{s.totalHours}h total</span>
                                    {s.reviewedBy && <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300 }}>Reviewed by {s.reviewedBy}</span>}
                                </div>
                                <span style={{ fontSize: "10px", fontWeight: 600, padding: "4px 10px", borderRadius: "4px", textTransform: "uppercase", color: s.status === "approved" ? "var(--success)" : s.status === "rejected" ? "var(--danger)" : s.status === "submitted" ? "var(--info)" : "var(--text-muted)", background: s.status === "approved" ? "rgba(90,122,70,0.08)" : s.status === "rejected" ? "rgba(176,80,64,0.08)" : s.status === "submitted" ? "rgba(90,122,144,0.08)" : "var(--bg-secondary)" }}>{s.status}</span>
                            </div>
                        ))}
                        {mySubmissions.length === 0 && <p style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 300, padding: "20px 0", textAlign: "center" }}>No submitted timesheets yet. Submit your weekly timesheet from the Timesheet tab.</p>}
                    </div>
                </div>
            )}

            {/* ═══ Team Timesheets Tab (Manager) ═══ */}
            {activeTab === "team-timesheets" && (
                <div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {(teamSubmissions as any[]).filter((s: any) => s.status === "submitted").length === 0 && <p style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 300, padding: "20px 0", textAlign: "center" }}>No timesheets pending review.</p>}
                        {(teamSubmissions as any[]).map((s: any) => (
                            <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderRadius: "8px", background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--bg-warm)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600, color: "var(--accent-primary)" }}>{(s.user?.name || "?")[0]}</div>
                                    <div>
                                        <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{s.user?.name}</p>
                                        <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300 }}>{s.week} · {s.totalHours}h</p>
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "10px", fontWeight: 600, padding: "4px 10px", borderRadius: "4px", textTransform: "uppercase", color: s.status === "approved" ? "var(--success)" : s.status === "rejected" ? "var(--danger)" : "var(--info)", background: s.status === "approved" ? "rgba(90,122,70,0.08)" : s.status === "rejected" ? "rgba(176,80,64,0.08)" : "rgba(90,122,144,0.08)" }}>{s.status}</span>
                                    {s.status === "submitted" && (<>
                                        <button onClick={() => approveWeek.mutate({ id: s.id })} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "rgba(90,122,70,0.1)", color: "var(--success)", cursor: "pointer", fontSize: "11px", fontWeight: 500, fontFamily: "inherit", display: "flex", alignItems: "center", gap: "4px" }}><Check size={12} /> Approve</button>
                                        <button onClick={() => rejectWeek.mutate({ id: s.id, notes: "" })} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "rgba(176,80,64,0.06)", color: "var(--danger)", cursor: "pointer", fontSize: "11px", fontWeight: 500, fontFamily: "inherit", display: "flex", alignItems: "center", gap: "4px" }}><XCircle size={12} /> Reject</button>
                                    </>)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══ Time Off Requests Tab (Manager) ═══ */}
            {activeTab === "timeoff-requests" && (
                <div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {(teamTimeOffRequests as any[]).length === 0 && <p style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 300, padding: "20px 0", textAlign: "center" }}>No time off requests to review.</p>}
                        {(teamTimeOffRequests as any[]).map((r: any) => (
                            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", borderRadius: "8px", background: "var(--bg-card)", border: "1px solid var(--border-primary)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--bg-warm)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600, color: "var(--accent-primary)" }}>{(r.user?.name || "?")[0]}</div>
                                    <div>
                                        <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{r.user?.name} · {(r.type || "pto").toUpperCase()}</p>
                                        <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300, marginTop: "2px" }}>{r.startDate} → {r.endDate} · {r.hours}h{r.notes ? ` · ${r.notes}` : ""}</p>
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "10px", fontWeight: 600, padding: "4px 10px", borderRadius: "4px", textTransform: "uppercase", color: r.status === "approved" ? "var(--success)" : r.status === "rejected" ? "var(--danger)" : "var(--accent-primary)", background: r.status === "approved" ? "rgba(90,122,70,0.08)" : r.status === "rejected" ? "rgba(176,80,64,0.08)" : "rgba(176,122,74,0.08)" }}>{r.status}</span>
                                    {r.status === "pending" && (<>
                                        <button onClick={() => approveTimeOff.mutate({ id: r.id })} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "rgba(90,122,70,0.1)", color: "var(--success)", cursor: "pointer", fontSize: "11px", fontWeight: 500, fontFamily: "inherit", display: "flex", alignItems: "center", gap: "4px" }}><Check size={12} /> Approve</button>
                                        <button onClick={() => rejectTimeOff.mutate({ id: r.id })} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "rgba(176,80,64,0.06)", color: "var(--danger)", cursor: "pointer", fontSize: "11px", fontWeight: 500, fontFamily: "inherit", display: "flex", alignItems: "center", gap: "4px" }}><XCircle size={12} /> Reject</button>
                                    </>)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
