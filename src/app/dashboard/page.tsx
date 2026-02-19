"use client";

import { TrendingUp, TrendingDown, ArrowUpRight, Clock, DollarSign, FolderKanban, Users } from "lucide-react";

// Mock data
const stats = [
    { label: "Active Projects", value: "24", change: "+3", up: true, icon: FolderKanban, color: "var(--accent-primary)" },
    { label: "Hours This Week", value: "186", change: "+12%", up: true, icon: Clock, color: "var(--accent-secondary)" },
    { label: "Revenue MTD", value: "$48.2k", change: "+18%", up: true, icon: DollarSign, color: "var(--accent-gold)" },
    { label: "Team Utilization", value: "87%", change: "-3%", up: false, icon: Users, color: "var(--info)" },
];

const recentProjects = [
    { name: "Meridian Tower", client: "Apex Development", phase: "Construction Docs", progress: 72, budget: 85, status: "on-track" },
    { name: "Harbor Residences", client: "Coastal Properties", phase: "Design Development", progress: 45, budget: 102, status: "at-risk" },
    { name: "Civic Center", client: "City of Portland", phase: "Schematic Design", progress: 88, budget: 67, status: "on-track" },
    { name: "Park View Office", client: "Metro Commercial", phase: "SD Phase", progress: 31, budget: 29, status: "on-track" },
    { name: "Riverside Lofts", client: "Urban Living Co.", phase: "Construction Admin", progress: 95, budget: 91, status: "on-track" },
];

const recentTimesheets = [
    { person: "Alex Chen", initials: "AC", hours: 38.5, submitted: true },
    { person: "Maria Santos", initials: "MS", hours: 41.0, submitted: true },
    { person: "Jake Williams", initials: "JW", hours: 35.0, submitted: false },
    { person: "Priya Patel", initials: "PP", hours: 40.0, submitted: true },
    { person: "Sam Rogers", initials: "SR", hours: 32.5, submitted: false },
];

const upcomingDeadlines = [
    { project: "Meridian Tower", milestone: "CD Set 90%", date: "Feb 18", daysLeft: 4 },
    { project: "Harbor Residences", milestone: "DD Review", date: "Feb 22", daysLeft: 8 },
    { project: "Civic Center", milestone: "SD Presentation", date: "Feb 25", daysLeft: 11 },
];

const revenueData = [55, 42, 68, 52, 78, 62, 74, 58, 85, 70, 80, 65];
const months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

export default function DashboardPage() {
    return (
        <div>
            {/* Page header */}
            <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                    Good afternoon, Karan
                </h1>
                <p style={{ marginTop: "4px", fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 300 }}>
                    Here&apos;s how your firm is doing this week.
                </p>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
                {stats.map((stat, i) => (
                    <div key={i} style={{ padding: "20px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <p style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</p>
                            <div style={{ width: "32px", height: "32px", borderRadius: "6px", background: `color-mix(in srgb, ${stat.color} 8%, transparent)`, border: `1px solid color-mix(in srgb, ${stat.color} 12%, transparent)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <stat.icon size={14} style={{ color: stat.color }} />
                            </div>
                        </div>
                        <p style={{ marginTop: "10px", fontSize: "28px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{stat.value}</p>
                        <div style={{ marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                            {stat.up ? <TrendingUp size={12} style={{ color: "var(--success)" }} /> : <TrendingDown size={12} style={{ color: "var(--danger)" }} />}
                            <span style={{ fontSize: "11px", color: stat.up ? "var(--success)" : "var(--danger)", fontWeight: 500 }}>{stat.change}</span>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300 }}>vs last week</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {/* Revenue chart */}
                <div style={{ padding: "24px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <div>
                            <h3 style={{ fontSize: "15px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Revenue</h3>
                            <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300, marginTop: "2px" }}>Monthly breakdown — FY 2026</p>
                        </div>
                        <span style={{ fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase", padding: "4px 10px", borderRadius: "4px", border: "1px solid var(--border-primary)" }}>12 Months</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "140px" }}>
                        {revenueData.map((h, i) => (
                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                                <div
                                    style={{
                                        width: "100%",
                                        borderRadius: "3px 3px 0 0",
                                        height: `${h}%`,
                                        background: i === 8 ? "var(--accent-primary)" : "rgba(176,122,74,0.12)",
                                        transition: "height 0.6s ease",
                                        minHeight: "4px",
                                    }}
                                />
                                <span style={{ fontSize: "8px", color: "var(--text-muted)", marginTop: "6px", fontWeight: 400 }}>{months[i]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming deadlines */}
                <div style={{ padding: "24px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <div>
                            <h3 style={{ fontSize: "15px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Upcoming Deadlines</h3>
                            <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300, marginTop: "2px" }}>Next 14 days</p>
                        </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {upcomingDeadlines.map((dl, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: "6px", background: "var(--bg-warm)", border: "1px solid var(--border-primary)" }}>
                                <div>
                                    <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{dl.milestone}</p>
                                    <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300, marginTop: "1px" }}>{dl.project}</p>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <p style={{ fontSize: "12px", fontWeight: 500, color: dl.daysLeft <= 5 ? "var(--danger)" : "var(--text-secondary)" }}>{dl.date}</p>
                                    <p style={{ fontSize: "10px", color: dl.daysLeft <= 5 ? "var(--danger)" : "var(--text-muted)", fontWeight: 300 }}>{dl.daysLeft}d left</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Projects table */}
                <div style={{ gridColumn: "span 2", padding: "24px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <div>
                            <h3 style={{ fontSize: "15px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Active Projects</h3>
                            <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300, marginTop: "2px" }}>Budget and progress overview</p>
                        </div>
                        <a href="/dashboard/projects" style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "var(--accent-primary)", textDecoration: "none", fontWeight: 500 }}>
                            View all <ArrowUpRight size={12} />
                        </a>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                                    {["Project", "Client", "Phase", "Progress", "Budget Used", "Status"].map((h) => (
                                        <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {recentProjects.map((proj, i) => (
                                    <tr key={i} style={{ borderBottom: "1px solid var(--border-primary)", cursor: "pointer" }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-warm)"; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                                    >
                                        <td style={{ padding: "14px 12px" }}>
                                            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{proj.name}</span>
                                        </td>
                                        <td style={{ padding: "14px 12px", fontSize: "12px", color: "var(--text-tertiary)", fontWeight: 300 }}>{proj.client}</td>
                                        <td style={{ padding: "14px 12px", fontSize: "12px", color: "var(--text-secondary)" }}>{proj.phase}</td>
                                        <td style={{ padding: "14px 12px" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                <div style={{ flex: 1, height: "4px", borderRadius: "2px", background: "var(--bg-tertiary)", maxWidth: "80px" }}>
                                                    <div style={{ height: "100%", borderRadius: "2px", width: `${proj.progress}%`, background: "var(--accent-primary)" }} />
                                                </div>
                                                <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400, width: "32px" }}>{proj.progress}%</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: "14px 12px" }}>
                                            <span style={{ fontSize: "12px", fontWeight: 500, color: proj.budget > 95 ? "var(--danger)" : proj.budget > 80 ? "var(--warning)" : "var(--text-secondary)" }}>{proj.budget}%</span>
                                        </td>
                                        <td style={{ padding: "14px 12px" }}>
                                            <span style={{
                                                fontSize: "9px", fontWeight: 600, padding: "3px 8px", borderRadius: "3px",
                                                textTransform: "uppercase", letterSpacing: "0.04em",
                                                color: proj.status === "on-track" ? "var(--success)" : "var(--danger)",
                                                background: proj.status === "on-track" ? "rgba(90,122,70,0.08)" : "rgba(176,80,64,0.08)",
                                            }}>
                                                {proj.status === "on-track" ? "On Track" : "At Risk"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Timesheets */}
                <div style={{ padding: "24px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                        <div>
                            <h3 style={{ fontSize: "15px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Timesheets</h3>
                            <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300, marginTop: "2px" }}>This week&apos;s submissions</p>
                        </div>
                        <span style={{ fontSize: "11px", color: "var(--accent-primary)", fontWeight: 500 }}>3/5 submitted</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {recentTimesheets.map((ts, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px", borderRadius: "6px", background: "var(--bg-warm)", border: "1px solid var(--border-primary)" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: ts.submitted ? "rgba(90,122,70,0.08)" : "var(--bg-secondary)", border: ts.submitted ? "1px solid rgba(90,122,70,0.15)" : "1px solid var(--border-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 600, color: ts.submitted ? "var(--success)" : "var(--text-muted)" }}>
                                        {ts.initials}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)" }}>{ts.person}</p>
                                        <p style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 300 }}>{ts.hours}h logged</p>
                                    </div>
                                </div>
                                <span style={{ fontSize: "9px", fontWeight: 600, padding: "3px 8px", borderRadius: "3px", textTransform: "uppercase", letterSpacing: "0.04em", color: ts.submitted ? "var(--success)" : "var(--warning)", background: ts.submitted ? "rgba(90,122,70,0.08)" : "rgba(176,138,48,0.08)" }}>
                                    {ts.submitted ? "Submitted" : "Pending"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick actions */}
                <div style={{ padding: "24px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "20px" }}>Quick Actions</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {[
                            { label: "New Project", desc: "Create a new project with phases", icon: FolderKanban, href: "/dashboard/projects" },
                            { label: "Log Time", desc: "Open your weekly timesheet", icon: Clock, href: "/dashboard/time" },
                            { label: "Create Invoice", desc: "Generate from tracked time", icon: DollarSign, href: "/dashboard/invoices" },
                            { label: "View Reports", desc: "Analytics and exports", icon: TrendingUp, href: "/dashboard/reports" },
                        ].map((action) => (
                            <a key={action.label} href={action.href}
                                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "6px", background: "var(--bg-warm)", border: "1px solid var(--border-primary)", textDecoration: "none", transition: "all 0.15s" }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-secondary)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-primary)"; e.currentTarget.style.boxShadow = "none"; }}
                            >
                                <div style={{ width: "36px", height: "36px", borderRadius: "6px", background: "rgba(176,122,74,0.06)", border: "1px solid rgba(176,122,74,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <action.icon size={16} style={{ color: "var(--accent-primary)" }} />
                                </div>
                                <div>
                                    <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{action.label}</p>
                                    <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300 }}>{action.desc}</p>
                                </div>
                                <ArrowUpRight size={14} style={{ color: "var(--text-muted)", marginLeft: "auto" }} />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
