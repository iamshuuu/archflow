"use client";

import { useState } from "react";
import { trpc } from "@/app/providers";
import GanttChart, { GanttProject } from "@/app/components/GanttChart";
import { Calendar, ZoomIn, ZoomOut, Loader2 } from "lucide-react";

type ZoomLevel = "month" | "quarter" | "year";

export default function SchedulePage() {
    const { data: rawProjects = [], isLoading } = trpc.project.schedule.useQuery();
    const updatePhase = trpc.project.updatePhase.useMutation();
    const utils = trpc.useUtils();
    const [zoom, setZoom] = useState<ZoomLevel>("month");

    const projects: GanttProject[] = rawProjects.map((p: any) => ({
        id: p.id,
        name: p.name,
        client: p.client?.name || "—",
        startDate: p.startDate || "",
        endDate: p.endDate || "",
        phases: (p.phases || []).map((ph: any, i: number) => {
            const usedHours = (ph.timeEntries || []).reduce((s: number, te: any) => s + te.hours, 0);
            const budgetHours = ph.budgetHours || 0;
            return {
                id: ph.id,
                name: ph.name,
                startDate: ph.startDate || "",
                endDate: ph.endDate || "",
                color: ph.color || "",
                progress: budgetHours > 0 ? Math.min(100, Math.round((usedHours / budgetHours) * 100)) : 0,
                milestones: (ph.milestones || []).map((ms: any) => ({
                    id: ms.id,
                    name: ms.name,
                    date: ms.date,
                    done: ms.done,
                })),
            };
        }),
    }));

    // Filter out projects with no phases that have dates
    const projectsWithDates = projects.filter(p => p.phases.some(ph => ph.startDate && ph.endDate));

    const handlePhaseUpdate = async (phaseId: string, startDate: string, endDate: string) => {
        await updatePhase.mutateAsync({ id: phaseId, startDate, endDate });
        utils.project.schedule.invalidate();
    };

    const zoomOrder: ZoomLevel[] = ["year", "quarter", "month"];
    const zoomIn = () => { const idx = zoomOrder.indexOf(zoom); if (idx < zoomOrder.length - 1) setZoom(zoomOrder[idx + 1]); };
    const zoomOut = () => { const idx = zoomOrder.indexOf(zoom); if (idx > 0) setZoom(zoomOrder[idx - 1]); };

    if (isLoading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px", gap: "12px", color: "var(--text-muted)" }}>
                <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: "14px", fontWeight: 300 }}>Loading schedule…</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                        Schedule
                    </h1>
                    <p style={{ marginTop: "4px", fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 300 }}>
                        Firm-wide project timeline — drag bars to adjust dates
                    </p>
                </div>
                <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <button
                        onClick={zoomOut}
                        disabled={zoom === "year"}
                        style={{
                            width: "32px", height: "32px", borderRadius: "6px",
                            border: "1px solid var(--border-primary)", background: "var(--bg-card)",
                            cursor: zoom === "year" ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: zoom === "year" ? "var(--border-secondary)" : "var(--text-muted)",
                            opacity: zoom === "year" ? 0.5 : 1,
                        }}
                    >
                        <ZoomOut size={14} />
                    </button>
                    <span style={{
                        fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)",
                        padding: "4px 10px", borderRadius: "4px", background: "var(--bg-secondary)",
                        textTransform: "uppercase", letterSpacing: "0.04em", minWidth: "60px", textAlign: "center",
                    }}>
                        {zoom}
                    </span>
                    <button
                        onClick={zoomIn}
                        disabled={zoom === "month"}
                        style={{
                            width: "32px", height: "32px", borderRadius: "6px",
                            border: "1px solid var(--border-primary)", background: "var(--bg-card)",
                            cursor: zoom === "month" ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: zoom === "month" ? "var(--border-secondary)" : "var(--text-muted)",
                            opacity: zoom === "month" ? 0.5 : 1,
                        }}
                    >
                        <ZoomIn size={14} />
                    </button>
                </div>
            </div>

            {/* Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "24px" }}>
                {[
                    { label: "Active Projects", value: projectsWithDates.length.toString(), sub: "with scheduled phases" },
                    { label: "Total Phases", value: projectsWithDates.reduce((s, p) => s + p.phases.filter(ph => ph.startDate && ph.endDate).length, 0).toString(), sub: "across all projects" },
                    { label: "Zoom Level", value: zoom.charAt(0).toUpperCase() + zoom.slice(1), sub: "Use +/- to adjust" },
                ].map((card, i) => (
                    <div key={i} style={{ padding: "16px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                        <p style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{card.label}</p>
                        <p style={{ marginTop: "6px", fontSize: "20px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{card.value}</p>
                        <p style={{ marginTop: "2px", fontSize: "11px", color: "var(--text-muted)", fontWeight: 300 }}>{card.sub}</p>
                    </div>
                ))}
            </div>

            {/* Gantt */}
            {projectsWithDates.length > 0 ? (
                <GanttChart
                    projects={projectsWithDates}
                    onPhaseUpdate={handlePhaseUpdate}
                    zoomLevel={zoom}
                />
            ) : (
                <div style={{ padding: "60px", textAlign: "center", borderRadius: "10px", border: "1px solid var(--border-primary)", background: "var(--bg-card)" }}>
                    <Calendar size={32} style={{ color: "var(--text-muted)", opacity: 0.4, marginBottom: "12px" }} />
                    <p style={{ fontSize: "14px", color: "var(--text-muted)", fontWeight: 300 }}>No projects with scheduled phases yet.</p>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 300, marginTop: "4px" }}>Set start and end dates on project phases to see them here.</p>
                </div>
            )}
        </div>
    );
}
