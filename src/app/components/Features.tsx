"use client";

import { motion } from "framer-motion";
import {
    Clock,
    BarChart3,
    FileText,
    Users,
    Layers,
    PieChart,
    TrendingUp,
    Zap,
} from "lucide-react";

const features = [
    {
        icon: Layers,
        title: "Phase-Based Projects",
        description:
            "Organize by architectural phases — schematics through construction docs. Interactive Gantt charts for every timeline.",
        color: "var(--accent-primary)",
    },
    {
        icon: Clock,
        title: "Effortless Time Tracking",
        description:
            "Weekly timesheets designed for how architects actually work. Quick entry, timers, approvals, and auto-reminders.",
        color: "var(--accent-secondary)",
    },
    {
        icon: TrendingUp,
        title: "Real-Time Budgets",
        description:
            "See every project's financial health at a glance. Budget vs. actual overlays, burn rates, and smart alerts.",
        color: "var(--accent-gold)",
    },
    {
        icon: FileText,
        title: "Beautiful Invoicing",
        description:
            "Generate invoices from tracked time or milestones. Customizable templates, Stripe payments, and PDF exports.",
        color: "var(--accent-primary)",
    },
    {
        icon: Users,
        title: "Resource Planning",
        description:
            "See who's overloaded and who's available. Visual heatmaps for staffing across projects and weeks.",
        color: "var(--accent-secondary)",
    },
    {
        icon: BarChart3,
        title: "Powerful Dashboards",
        description:
            "Firm-level, project-level, and team views. Utilization rates, revenue forecasts, and P&L — all exportable.",
        color: "var(--accent-gold)",
    },
    {
        icon: PieChart,
        title: "Custom Reports",
        description:
            "Build exact reports you need. Filter by project type, client, team member — export CSV or PDF with one click.",
        color: "var(--accent-primary)",
    },
    {
        icon: Zap,
        title: "AI-Powered Insights",
        description:
            "Smart budget estimation, auto-generated status reports, anomaly detection, and staffing suggestions.",
        color: "var(--accent-secondary)",
    },
];

export default function Features() {
    return (
        <section
            id="features"
            style={{
                position: "relative",
                paddingTop: "128px",
                paddingBottom: "128px",
            }}
        >
            <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "1px", background: "linear-gradient(to right, transparent, var(--border-secondary), transparent)" }} />

            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
                {/* Header */}
                <div style={{ textAlign: "center", maxWidth: "600px", margin: "0 auto" }}>
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "11px",
                            fontWeight: 500,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            color: "var(--accent-primary)",
                        }}
                    >
                        <span style={{ width: "24px", height: "1px", background: "var(--accent-primary)" }} />
                        Features
                        <span style={{ width: "24px", height: "1px", background: "var(--accent-primary)" }} />
                    </motion.span>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        style={{ marginTop: "20px", fontSize: "clamp(28px, 4.5vw, 44px)", fontWeight: 400, lineHeight: 1.15, color: "var(--text-primary)" }}
                    >
                        Everything your firm needs.
                        <br />
                        <span style={{ color: "var(--text-tertiary)" }}>Nothing it doesn&apos;t.</span>
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        style={{ marginTop: "20px", fontSize: "16px", color: "var(--text-tertiary)", lineHeight: 1.7, fontWeight: 300 }}
                    >
                        Built from the ground up for architecture and engineering firms — not adapted from generic project tools.
                    </motion.p>
                </div>

                {/* Grid */}
                <div
                    style={{
                        marginTop: "72px",
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                        gap: "1px",
                        background: "var(--border-primary)",
                        borderRadius: "12px",
                        overflow: "hidden",
                        border: "1px solid var(--border-primary)",
                        boxShadow: "var(--shadow-card)",
                    }}
                >
                    {features.map((feature, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05, duration: 0.4 }}
                            style={{
                                padding: "32px",
                                background: "var(--bg-card)",
                                cursor: "default",
                                transition: "background 0.3s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-card-hover)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--bg-card)"; }}
                        >
                            <div
                                style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "6px",
                                    border: `1px solid ${feature.color}`,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    opacity: 0.8,
                                }}
                            >
                                <feature.icon size={18} style={{ color: feature.color }} />
                            </div>

                            <h3 style={{ marginTop: "20px", fontSize: "16px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                                {feature.title}
                            </h3>
                            <p style={{ marginTop: "10px", fontSize: "13px", lineHeight: 1.65, color: "var(--text-tertiary)", fontWeight: 300 }}>
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
