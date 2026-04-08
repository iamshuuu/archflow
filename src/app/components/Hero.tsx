"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function Hero() {
    return (
        <section
            style={{
                position: "relative",
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                paddingTop: "80px",
            }}
        >
            <div
                style={{
                    position: "relative",
                    zIndex: 10,
                    maxWidth: "1100px",
                    margin: "0 auto",
                    padding: "120px 24px 160px",
                    width: "100%",
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                    {/* Label */}
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span
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
                            Practice Management for A&E Firms
                            <span style={{ width: "24px", height: "1px", background: "var(--accent-primary)" }} />
                        </span>
                    </motion.div>

                    {/* Heading */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.15 }}
                        style={{
                            marginTop: "32px",
                            fontSize: "clamp(42px, 7vw, 84px)",
                            fontWeight: 400,
                            letterSpacing: "-0.01em",
                            lineHeight: 1.1,
                            color: "var(--text-primary)",
                        }}
                    >
                        Design more.
                        <br />
                        <span style={{ color: "var(--accent-primary)" }}>Manage less.</span>
                    </motion.h1>

                    {/* Sub */}
                    <motion.p
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                        style={{
                            marginTop: "28px",
                            maxWidth: "560px",
                            fontSize: "clamp(16px, 1.8vw, 19px)",
                            color: "var(--text-secondary)",
                            lineHeight: 1.7,
                            fontWeight: 300,
                        }}
                    >
                        Track projects, timesheets, budgets, and invoices in one place — built
                        specifically for the way architecture and engineering firms work.
                    </motion.p>

                    {/* CTAs */}
                    <motion.div
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.45 }}
                        style={{ marginTop: "48px", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px" }}
                    >
                        <a
                            href="/signup"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "16px 36px",
                                fontSize: "13px",
                                fontWeight: 500,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                color: "white",
                                textDecoration: "none",
                                borderRadius: "4px",
                                background: "var(--accent-primary)",
                                transition: "all 0.3s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = "var(--accent-primary-hover)";
                                e.currentTarget.style.boxShadow = "0 8px 30px rgba(176,122,74,0.2)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "var(--accent-primary)";
                                e.currentTarget.style.boxShadow = "none";
                            }}
                        >
                            Start free trial
                            <ArrowRight size={16} />
                        </a>
                        <a
                            href="#features"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "16px 36px",
                                fontSize: "13px",
                                fontWeight: 500,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                color: "var(--text-secondary)",
                                textDecoration: "none",
                                borderRadius: "4px",
                                border: "1px solid var(--border-secondary)",
                                transition: "all 0.3s",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = "var(--accent-primary)";
                                e.currentTarget.style.color = "var(--accent-primary)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = "var(--border-secondary)";
                                e.currentTarget.style.color = "var(--text-secondary)";
                            }}
                        >
                            See how it works
                        </a>
                    </motion.div>

                    {/* Trust */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.7, delay: 0.7 }}
                        style={{ marginTop: "64px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            {[...Array(5)].map((_, i) => (
                                <svg key={i} style={{ width: "14px", height: "14px", color: "var(--accent-gold)" }} fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                            <span style={{ marginLeft: "8px", fontSize: "13px", color: "var(--text-tertiary)", fontWeight: 300 }}>
                                Trusted by 200+ firms worldwide
                            </span>
                        </div>
                    </motion.div>

                    {/* Dashboard mockup */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
                        style={{ marginTop: "80px", width: "100%", maxWidth: "1000px" }}
                    >
                        <div
                            style={{
                                borderRadius: "12px",
                                overflow: "hidden",
                                border: "1px solid var(--border-secondary)",
                                boxShadow: "0 20px 60px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
                                background: "white",
                            }}
                        >
                            {/* Top bar */}
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "12px 20px",
                                    background: "var(--bg-secondary)",
                                    borderBottom: "1px solid var(--border-primary)",
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <div style={{ display: "flex", gap: "6px" }}>
                                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--danger)" }} />
                                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--warning)" }} />
                                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "var(--success)" }} />
                                    </div>
                                    <span style={{ fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.02em" }}>
                                        ArchFlow — Dashboard
                                    </span>
                                </div>
                                <div style={{ display: "flex", gap: "16px" }}>
                                    {["Overview", "Projects", "Team"].map((tab, ti) => (
                                        <span key={tab} style={{ fontSize: "11px", fontWeight: ti === 0 ? 500 : 400, color: ti === 0 ? "var(--accent-primary)" : "var(--text-muted)", letterSpacing: "0.02em" }}>
                                            {tab}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Content */}
                            <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "14px" }}>
                                {/* Stat cards */}
                                {[
                                    { label: "Active Projects", value: "24", sub: "+3 this quarter", color: "var(--accent-primary)" },
                                    { label: "Hours Logged", value: "1,248", sub: "92% utilization", color: "var(--accent-secondary)" },
                                    { label: "Revenue MTD", value: "$48.2k", sub: "+18% vs last month", color: "var(--accent-gold)" },
                                    { label: "Open Invoices", value: "$32.1k", sub: "4 pending", color: "var(--info)" },
                                ].map((s, i) => (
                                    <div key={i} style={{ padding: "16px", borderRadius: "8px", background: "var(--bg-warm)", border: "1px solid var(--border-primary)" }}>
                                        <p style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
                                        <p style={{ marginTop: "6px", fontSize: "22px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{s.value}</p>
                                        <p style={{ marginTop: "2px", fontSize: "10px", color: s.color }}>{s.sub}</p>
                                    </div>
                                ))}

                                {/* Chart */}
                                <div style={{ gridColumn: "span 2", padding: "16px", borderRadius: "8px", background: "var(--bg-warm)", border: "1px solid var(--border-primary)" }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}>Revenue vs Budget</p>
                                        <span style={{ fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>12 months</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "flex-end", gap: "5px", height: "100px", marginTop: "14px" }}>
                                        {[55, 42, 68, 52, 78, 62, 74, 58, 85, 70, 80, 65].map((h, i) => (
                                            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                                                <div style={{ width: "100%", borderRadius: "2px 2px 0 0", height: `${h}%`, background: i === 8 ? "var(--accent-primary)" : "rgba(176,122,74,0.15)", minHeight: "3px" }} />
                                                <span style={{ fontSize: "7px", color: "var(--text-muted)", marginTop: "4px" }}>{["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Projects */}
                                <div style={{ gridColumn: "span 2", padding: "16px", borderRadius: "8px", background: "var(--bg-warm)", border: "1px solid var(--border-primary)" }}>
                                    <p style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}>Active Projects</p>
                                    <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                                        {[
                                            { name: "Meridian Tower", phase: "Construction Docs", progress: 72, ok: true },
                                            { name: "Harbor Residences", phase: "Design Development", progress: 45, ok: false },
                                            { name: "Civic Center", phase: "Schematic Design", progress: 88, ok: true },
                                            { name: "Park View Office", phase: "SD Phase", progress: 31, ok: true },
                                        ].map((p, i) => (
                                            <div key={i}>
                                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                                    <div>
                                                        <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-primary)" }}>{p.name}</span>
                                                        <span style={{ fontSize: "9px", color: "var(--text-muted)", marginLeft: "6px" }}>{p.phase}</span>
                                                    </div>
                                                    <span style={{ fontSize: "8px", fontWeight: 600, padding: "2px 6px", borderRadius: "3px", color: p.ok ? "var(--success)" : "var(--warning)", background: p.ok ? "rgba(90,122,70,0.08)" : "rgba(176,138,48,0.08)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                                                        {p.ok ? "On Track" : "At Risk"}
                                                    </span>
                                                </div>
                                                <div style={{ height: "3px", borderRadius: "2px", background: "var(--border-primary)" }}>
                                                    <div style={{ height: "100%", borderRadius: "2px", width: `${p.progress}%`, background: p.ok ? "var(--accent-primary)" : "var(--warning)" }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
