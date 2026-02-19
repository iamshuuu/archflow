"use client";

import { motion } from "framer-motion";

const steps = [
    {
        number: "01",
        title: "Set up your firm",
        description:
            "Create your organization, invite team members, configure roles and billing rates. Ready in under 5 minutes.",
        visual: (
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "4px", border: "1px solid var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 500, color: "var(--accent-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                        KS
                    </div>
                    <div>
                        <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>Karan&apos;s Studio</div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Architecture & Interiors</div>
                    </div>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {["Principal", "Architect", "Engineer", "Intern"].map((role) => (
                        <span key={role} style={{ padding: "4px 10px", borderRadius: "3px", fontSize: "10px", fontWeight: 400, background: "var(--bg-warm)", color: "var(--text-tertiary)", border: "1px solid var(--border-primary)" }}>
                            {role}
                        </span>
                    ))}
                </div>
            </div>
        ),
    },
    {
        number: "02",
        title: "Create projects & phases",
        description:
            "Add projects with clients, phases, and budgets. Visualize everything on interactive Gantt timelines.",
        visual: (
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {[
                    { phase: "Schematic Design", width: "55%", color: "var(--accent-primary)", left: "5%" },
                    { phase: "Design Dev", width: "40%", color: "var(--accent-secondary)", left: "35%" },
                    { phase: "Construction Docs", width: "45%", color: "var(--accent-gold)", left: "48%" },
                ].map((item) => (
                    <div key={item.phase} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "9px", fontWeight: 400, color: "var(--text-muted)", width: "100px", textAlign: "right", flexShrink: 0 }}>{item.phase}</span>
                        <div style={{ flex: 1, height: "18px", borderRadius: "3px", background: "var(--bg-secondary)", position: "relative" }}>
                            <div style={{ position: "absolute", height: "100%", borderRadius: "3px", width: item.width, left: item.left, backgroundColor: item.color, opacity: 0.4 }} />
                        </div>
                    </div>
                ))}
            </div>
        ),
    },
    {
        number: "03",
        title: "Track time & budgets",
        description:
            "Your team logs hours against phases. Watch budgets update live. Get alerts before overspending.",
        visual: (
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "80px repeat(5, 1fr)", gap: "4px", fontSize: "9px", fontWeight: 400, color: "var(--text-muted)", marginBottom: "4px" }}>
                    <span></span>
                    {["Mon", "Tue", "Wed", "Thu", "Fri"].map((d) => (
                        <span key={d} style={{ textAlign: "center" }}>{d}</span>
                    ))}
                </div>
                {[
                    { name: "Meridian Tower", hours: [8, 7, 6, 8, 5] },
                    { name: "Harbor Res.", hours: [6, 7, 8, 5, 7] },
                ].map((proj) => (
                    <div key={proj.name} style={{ display: "grid", gridTemplateColumns: "80px repeat(5, 1fr)", gap: "4px", alignItems: "center" }}>
                        <span style={{ fontSize: "10px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{proj.name}</span>
                        {proj.hours.map((h, i) => (
                            <div key={i} style={{ height: "30px", borderRadius: "4px", background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <span style={{ fontSize: "11px", fontWeight: 400, color: "var(--text-secondary)" }}>{h}h</span>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        ),
    },
    {
        number: "04",
        title: "Invoice & get paid",
        description:
            "Generate professional invoices from tracked time. Send to clients and accept online payments.",
        visual: (
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                        <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>INV-2026-042</div>
                        <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>Meridian Tower • Feb 2026</div>
                    </div>
                    <span style={{ padding: "3px 10px", borderRadius: "3px", fontSize: "9px", fontWeight: 500, background: "rgba(90,122,70,0.08)", color: "var(--success)", letterSpacing: "0.05em", textTransform: "uppercase" }}>Paid</span>
                </div>
                <div style={{ borderTop: "1px solid var(--border-primary)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Total</span>
                    <span style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>$12,450.00</span>
                </div>
            </div>
        ),
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" style={{ position: "relative", paddingTop: "128px", paddingBottom: "128px" }}>
            <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "1px", background: "linear-gradient(to right, transparent, var(--border-secondary), transparent)" }} />

            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 24px" }}>
                <div style={{ textAlign: "center", maxWidth: "560px", margin: "0 auto" }}>
                    <motion.span initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "11px", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent-primary)" }}
                    >
                        <span style={{ width: "24px", height: "1px", background: "var(--accent-primary)" }} />
                        How it works
                        <span style={{ width: "24px", height: "1px", background: "var(--accent-primary)" }} />
                    </motion.span>
                    <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                        style={{ marginTop: "20px", fontSize: "clamp(28px, 4.5vw, 44px)", fontWeight: 400, lineHeight: 1.15 }}
                    >
                        Up and running
                        <br />
                        <span style={{ color: "var(--text-tertiary)" }}>in minutes, not months.</span>
                    </motion.h2>
                </div>

                <div style={{ marginTop: "72px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                    {steps.map((step, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
                            style={{ borderRadius: "12px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", overflow: "hidden", boxShadow: "var(--shadow-card)", transition: "box-shadow 0.3s, border-color 0.3s" }}
                            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.borderColor = "var(--border-secondary)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "var(--shadow-card)"; e.currentTarget.style.borderColor = "var(--border-primary)"; }}
                        >
                            <div style={{ padding: "24px 24px 0" }}>
                                <span style={{ fontSize: "32px", fontWeight: 400, color: "var(--border-secondary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{step.number}</span>
                                <h3 style={{ marginTop: "8px", fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{step.title}</h3>
                                <p style={{ marginTop: "8px", fontSize: "13px", color: "var(--text-tertiary)", lineHeight: 1.65, fontWeight: 300 }}>{step.description}</p>
                            </div>
                            <div style={{ margin: "16px", borderRadius: "8px", background: "var(--bg-warm)", border: "1px solid var(--border-primary)" }}>
                                {step.visual}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
