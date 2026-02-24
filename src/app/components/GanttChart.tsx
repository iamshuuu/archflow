"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { Diamond, GripVertical } from "lucide-react";

/* ─── Types ─── */

export interface GanttMilestone {
    id: string;
    name: string;
    date: string;
    done: boolean;
}

export interface GanttPhase {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    color: string;
    progress: number; // 0-100
    milestones: GanttMilestone[];
}

export interface GanttProject {
    id: string;
    name: string;
    client: string;
    startDate: string;
    endDate: string;
    phases: GanttPhase[];
}

interface GanttChartProps {
    projects: GanttProject[];
    onPhaseUpdate?: (phaseId: string, startDate: string, endDate: string) => void;
    zoomLevel?: "month" | "quarter" | "year";
}

/* ─── Helpers ─── */

const DAY_MS = 86400000;

function parseDate(s: string): Date {
    return new Date(s + "T00:00:00");
}

function formatDate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

function daysBetween(a: Date, b: Date): number {
    return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

function addDays(d: Date, n: number): Date {
    return new Date(d.getTime() + n * DAY_MS);
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const DEFAULT_COLORS = [
    "#B07A4A", "#5A7A46", "#6B8DD6", "#B08A30", "#8BC6A0",
    "#B05040", "#9B6BA6", "#5AA0B0", "#D4A853", "#7A8B6B",
];

/* ─── Component ─── */

export default function GanttChart({ projects, onPhaseUpdate, zoomLevel = "month" }: GanttChartProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [hoveredPhase, setHoveredPhase] = useState<string | null>(null);
    const [dragState, setDragState] = useState<{
        phaseId: string; mode: "move" | "resize-end"; startX: number;
        origStart: string; origEnd: string;
    } | null>(null);
    const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null);

    // Compute time range
    const { rangeStart, rangeEnd, totalDays, allPhases } = useMemo(() => {
        const allP: (GanttPhase & { projectName: string; projectId: string })[] = [];
        let minDate = new Date("2099-01-01");
        let maxDate = new Date("2000-01-01");

        for (const proj of projects) {
            for (const phase of proj.phases) {
                if (!phase.startDate || !phase.endDate) continue;
                const s = parseDate(phase.startDate);
                const e = parseDate(phase.endDate);
                if (s < minDate) minDate = s;
                if (e > maxDate) maxDate = e;
                allP.push({ ...phase, projectName: proj.name, projectId: proj.id });
            }
        }

        if (allP.length === 0) {
            minDate = new Date();
            maxDate = addDays(new Date(), 180);
        }

        // Add padding
        const start = addDays(minDate, -14);
        const end = addDays(maxDate, 30);

        return {
            rangeStart: start,
            rangeEnd: end,
            totalDays: daysBetween(start, end),
            allPhases: allP,
        };
    }, [projects]);

    // Layout
    const ROW_HEIGHT = 40;
    const HEADER_HEIGHT = 52;
    const LABEL_WIDTH = 220;
    const dayWidth = zoomLevel === "year" ? 2 : zoomLevel === "quarter" ? 4 : 8;
    const chartWidth = totalDays * dayWidth;
    const totalWidth = LABEL_WIDTH + chartWidth;

    // Build rows: project headers + phases
    const rows = useMemo(() => {
        const result: { type: "project" | "phase"; id: string; label: string; sub?: string; phase?: typeof allPhases[0] }[] = [];
        for (const proj of projects) {
            result.push({ type: "project", id: proj.id, label: proj.name, sub: proj.client });
            for (const phase of proj.phases) {
                const ap = allPhases.find(p => p.id === phase.id);
                if (ap) result.push({ type: "phase", id: phase.id, label: phase.name, phase: ap });
            }
        }
        return result;
    }, [projects, allPhases]);

    const totalHeight = HEADER_HEIGHT + rows.length * ROW_HEIGHT + 8;

    // Generate month columns
    const monthColumns = useMemo(() => {
        const cols: { x: number; width: number; label: string; isToday?: boolean }[] = [];
        const d = new Date(rangeStart);
        d.setDate(1);
        if (d < rangeStart) d.setMonth(d.getMonth() + 1);

        while (d <= rangeEnd) {
            const x = daysBetween(rangeStart, d) * dayWidth;
            const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
            const width = daysBetween(d, nextMonth > rangeEnd ? rangeEnd : nextMonth) * dayWidth;
            cols.push({ x, width, label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` });
            d.setMonth(d.getMonth() + 1);
        }
        return cols;
    }, [rangeStart, rangeEnd, dayWidth]);

    // Today line
    const today = new Date();
    const todayX = daysBetween(rangeStart, today) * dayWidth;

    // Phase bar position helpers
    const getBarX = useCallback((dateStr: string) => {
        return daysBetween(rangeStart, parseDate(dateStr)) * dayWidth;
    }, [rangeStart, dayWidth]);

    const getBarWidth = useCallback((start: string, end: string) => {
        return Math.max(daysBetween(parseDate(start), parseDate(end)) * dayWidth, dayWidth * 2);
    }, [dayWidth]);

    // Drag handlers
    const handleMouseDown = useCallback((e: React.MouseEvent, phaseId: string, mode: "move" | "resize-end", origStart: string, origEnd: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDragState({ phaseId, mode, startX: e.clientX, origStart, origEnd });
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!dragState || !onPhaseUpdate) return;
        const dx = e.clientX - dragState.startX;
        const daysDelta = Math.round(dx / dayWidth);
        if (daysDelta === 0) return;

        const origS = parseDate(dragState.origStart);
        const origE = parseDate(dragState.origEnd);

        if (dragState.mode === "move") {
            onPhaseUpdate(dragState.phaseId, formatDate(addDays(origS, daysDelta)), formatDate(addDays(origE, daysDelta)));
        } else {
            const newEnd = addDays(origE, daysDelta);
            if (newEnd > origS) {
                onPhaseUpdate(dragState.phaseId, dragState.origStart, formatDate(newEnd));
            }
        }
    }, [dragState, dayWidth, onPhaseUpdate]);

    const handleMouseUp = useCallback(() => {
        setDragState(null);
    }, []);

    if (allPhases.length === 0) {
        return (
            <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)" }}>
                <p style={{ fontSize: "14px", fontWeight: 300 }}>No phases with dates to display.</p>
                <p style={{ fontSize: "12px", fontWeight: 300, marginTop: "4px" }}>Set start/end dates on project phases to see the Gantt chart.</p>
            </div>
        );
    }

    return (
        <div
            style={{ width: "100%", overflowX: "auto", borderRadius: "10px", border: "1px solid var(--border-primary)", background: "var(--bg-card)" }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <svg
                ref={svgRef}
                width={totalWidth}
                height={totalHeight}
                style={{ display: "block", fontFamily: "inherit" }}
            >
                {/* Header background */}
                <rect x={0} y={0} width={totalWidth} height={HEADER_HEIGHT} fill="var(--bg-warm)" />
                <line x1={0} y1={HEADER_HEIGHT} x2={totalWidth} y2={HEADER_HEIGHT} stroke="var(--border-primary)" strokeWidth={1} />

                {/* Label column header */}
                <text x={16} y={32} fontSize={10} fontWeight={500} fill="var(--text-muted)" textAnchor="start" style={{ textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>
                    Phase
                </text>
                <line x1={LABEL_WIDTH} y1={0} x2={LABEL_WIDTH} y2={totalHeight} stroke="var(--border-primary)" strokeWidth={1} />

                {/* Month headers */}
                {monthColumns.map((col, i) => (
                    <g key={i}>
                        <line x1={LABEL_WIDTH + col.x} y1={0} x2={LABEL_WIDTH + col.x} y2={totalHeight} stroke="var(--border-primary)" strokeWidth={0.5} opacity={0.5} />
                        <text x={LABEL_WIDTH + col.x + 8} y={22} fontSize={10} fontWeight={500} fill="var(--text-muted)">
                            {col.label}
                        </text>
                    </g>
                ))}

                {/* Today line */}
                {todayX > 0 && todayX < chartWidth && (
                    <g>
                        <line x1={LABEL_WIDTH + todayX} y1={HEADER_HEIGHT} x2={LABEL_WIDTH + todayX} y2={totalHeight} stroke="var(--danger)" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.6} />
                        <rect x={LABEL_WIDTH + todayX - 16} y={HEADER_HEIGHT - 16} width={32} height={14} rx={3} fill="var(--danger)" />
                        <text x={LABEL_WIDTH + todayX} y={HEADER_HEIGHT - 6} fontSize={8} fontWeight={600} fill="white" textAnchor="middle">
                            Today
                        </text>
                    </g>
                )}

                {/* Rows */}
                {rows.map((row, i) => {
                    const y = HEADER_HEIGHT + i * ROW_HEIGHT;

                    if (row.type === "project") {
                        return (
                            <g key={row.id + "-header"}>
                                <rect x={0} y={y} width={totalWidth} height={ROW_HEIGHT} fill="rgba(176,122,74,0.04)" />
                                <line x1={0} y1={y + ROW_HEIGHT} x2={totalWidth} y2={y + ROW_HEIGHT} stroke="var(--border-primary)" strokeWidth={0.5} />
                                <text x={16} y={y + 24} fontSize={12} fontWeight={600} fill="var(--text-primary)">
                                    {row.label}
                                </text>
                                {row.sub && (
                                    <text x={16} y={y + 36} fontSize={9} fontWeight={300} fill="var(--text-muted)">
                                        {row.sub}
                                    </text>
                                )}
                            </g>
                        );
                    }

                    // Phase row
                    const phase = row.phase!;
                    const barX = getBarX(phase.startDate);
                    const barW = getBarWidth(phase.startDate, phase.endDate);
                    const barY = y + 10;
                    const barH = 20;
                    const color = phase.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length];
                    const isHovered = hoveredPhase === phase.id;
                    const isDragging = dragState?.phaseId === phase.id;

                    return (
                        <g key={phase.id}>
                            {/* Row background */}
                            <rect x={0} y={y} width={totalWidth} height={ROW_HEIGHT} fill={isHovered ? "rgba(176,122,74,0.03)" : "transparent"} />
                            <line x1={0} y1={y + ROW_HEIGHT} x2={totalWidth} y2={y + ROW_HEIGHT} stroke="var(--border-primary)" strokeWidth={0.3} />

                            {/* Label */}
                            <text x={32} y={y + 25} fontSize={12} fontWeight={400} fill="var(--text-secondary)">
                                {row.label}
                            </text>

                            {/* Bar */}
                            <g
                                onMouseEnter={() => { setHoveredPhase(phase.id); setTooltip(null); }}
                                onMouseLeave={() => { setHoveredPhase(null); setTooltip(null); }}
                                style={{ cursor: onPhaseUpdate ? (isDragging ? "grabbing" : "grab") : "default" }}
                            >
                                {/* Background bar */}
                                <rect
                                    x={LABEL_WIDTH + barX}
                                    y={barY}
                                    width={barW}
                                    height={barH}
                                    rx={4}
                                    fill={color}
                                    opacity={0.15}
                                    stroke={isHovered ? color : "none"}
                                    strokeWidth={1}
                                    onMouseDown={(e) => onPhaseUpdate && handleMouseDown(e, phase.id, "move", phase.startDate, phase.endDate)}
                                />
                                {/* Progress fill */}
                                {phase.progress > 0 && (
                                    <rect
                                        x={LABEL_WIDTH + barX}
                                        y={barY}
                                        width={barW * Math.min(phase.progress, 100) / 100}
                                        height={barH}
                                        rx={4}
                                        fill={color}
                                        opacity={0.5}
                                        onMouseDown={(e) => onPhaseUpdate && handleMouseDown(e, phase.id, "move", phase.startDate, phase.endDate)}
                                    />
                                )}

                                {/* Phase name on bar */}
                                {barW > 60 && (
                                    <text
                                        x={LABEL_WIDTH + barX + 8}
                                        y={barY + 14}
                                        fontSize={10}
                                        fontWeight={500}
                                        fill={phase.progress > 20 ? "white" : color}
                                        style={{ pointerEvents: "none" as const }}
                                    >
                                        {phase.name}
                                    </text>
                                )}

                                {/* Resize handle */}
                                {onPhaseUpdate && isHovered && (
                                    <rect
                                        x={LABEL_WIDTH + barX + barW - 6}
                                        y={barY + 2}
                                        width={6}
                                        height={barH - 4}
                                        rx={2}
                                        fill={color}
                                        opacity={0.7}
                                        style={{ cursor: "ew-resize" }}
                                        onMouseDown={(e) => handleMouseDown(e, phase.id, "resize-end", phase.startDate, phase.endDate)}
                                    />
                                )}
                            </g>

                            {/* Milestones */}
                            {phase.milestones.map((ms) => {
                                const msX = LABEL_WIDTH + daysBetween(rangeStart, parseDate(ms.date)) * dayWidth;
                                return (
                                    <g key={ms.id}
                                        onMouseEnter={(e) => setTooltip({ x: msX, y: barY - 4, text: `${ms.name} — ${ms.date}${ms.done ? " ✓" : ""}` })}
                                        onMouseLeave={() => setTooltip(null)}
                                    >
                                        <polygon
                                            points={`${msX},${barY - 2} ${msX + 5},${barY + 4} ${msX},${barY + 10} ${msX - 5},${barY + 4}`}
                                            fill={ms.done ? "var(--success)" : color}
                                            stroke="white"
                                            strokeWidth={1}
                                        />
                                    </g>
                                );
                            })}
                        </g>
                    );
                })}

                {/* Tooltip */}
                {tooltip && (
                    <g>
                        <rect x={tooltip.x - 60} y={tooltip.y - 20} width={120} height={16} rx={3} fill="var(--text-primary)" />
                        <text x={tooltip.x} y={tooltip.y - 8} fontSize={9} fill="white" textAnchor="middle" fontWeight={400}>
                            {tooltip.text}
                        </text>
                    </g>
                )}
            </svg>
        </div>
    );
}
