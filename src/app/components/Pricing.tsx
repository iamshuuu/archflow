"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
    {
        name: "Starter",
        price: "Free",
        period: "forever",
        description: "For solo architects and small studios getting started.",
        features: ["1 user", "3 active projects", "Time tracking", "Basic invoicing", "5 GB storage"],
        cta: "Get started free",
        highlighted: false,
    },
    {
        name: "Professional",
        price: "$15",
        period: "per user / month",
        description: "For growing firms that need full project visibility and control.",
        features: ["Unlimited projects", "Phase-based budgets", "Custom billing rates", "Advanced invoicing + Stripe", "Resource planning heatmaps", "Custom reports & exports", "25 GB storage", "Priority support"],
        cta: "Start 14-day trial",
        highlighted: true,
    },
    {
        name: "Business",
        price: "$30",
        period: "per user / month",
        description: "For established firms needing power, compliance, and integrations.",
        features: ["Everything in Professional", "Multi-office support", "Advanced permissions & roles", "Audit trails & compliance", "API access", "Custom integrations", "100 GB storage", "Dedicated account manager"],
        cta: "Contact sales",
        highlighted: false,
    },
];

export default function Pricing() {
    return (
        <section id="pricing" style={{ position: "relative", paddingTop: "128px", paddingBottom: "128px" }}>
            <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "1px", background: "linear-gradient(to right, transparent, var(--border-secondary), transparent)" }} />

            <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
                <div style={{ textAlign: "center", maxWidth: "560px", margin: "0 auto" }}>
                    <motion.span initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                        style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "11px", fontWeight: 500, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--accent-primary)" }}
                    >
                        <span style={{ width: "24px", height: "1px", background: "var(--accent-primary)" }} />
                        Pricing
                        <span style={{ width: "24px", height: "1px", background: "var(--accent-primary)" }} />
                    </motion.span>
                    <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
                        style={{ marginTop: "20px", fontSize: "clamp(28px, 4.5vw, 44px)", fontWeight: 400, lineHeight: 1.15 }}
                    >
                        Simple, transparent pricing.
                    </motion.h2>
                    <motion.p initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
                        style={{ marginTop: "16px", fontSize: "16px", color: "var(--text-tertiary)", lineHeight: 1.7, fontWeight: 300 }}
                    >
                        Start free and scale as you grow. Every plan includes a 14-day trial of Professional features.
                    </motion.p>
                </div>

                <div style={{ marginTop: "64px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", alignItems: "start" }}>
                    {plans.map((plan, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}
                            style={{
                                position: "relative",
                                borderRadius: "12px",
                                padding: "36px",
                                background: "var(--bg-card)",
                                border: plan.highlighted ? "1px solid var(--accent-primary)" : "1px solid var(--border-primary)",
                                boxShadow: plan.highlighted ? "0 8px 30px rgba(176,122,74,0.08)" : "var(--shadow-card)",
                            }}
                        >
                            {plan.highlighted && (
                                <div style={{ position: "absolute", top: "-11px", left: "50%", transform: "translateX(-50%)", padding: "4px 18px", borderRadius: "3px", fontSize: "10px", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: "white", background: "var(--accent-primary)" }}>
                                    Most popular
                                </div>
                            )}

                            <h3 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{plan.name}</h3>
                            <div style={{ marginTop: "20px", display: "flex", alignItems: "baseline", gap: "4px" }}>
                                <span style={{ fontSize: "40px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{plan.price}</span>
                                <span style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 300 }}>{plan.period}</span>
                            </div>
                            <p style={{ marginTop: "8px", fontSize: "13px", color: "var(--text-tertiary)", fontWeight: 300, lineHeight: 1.5 }}>{plan.description}</p>

                            <a href="#"
                                style={{
                                    display: "block", marginTop: "28px", padding: "14px", borderRadius: "4px",
                                    fontSize: "12px", fontWeight: 500, textAlign: "center", textDecoration: "none",
                                    letterSpacing: "0.06em", textTransform: "uppercase", transition: "all 0.3s",
                                    color: plan.highlighted ? "white" : "var(--text-primary)",
                                    background: plan.highlighted ? "var(--accent-primary)" : "transparent",
                                    border: plan.highlighted ? "none" : "1px solid var(--border-secondary)",
                                }}
                                onMouseEnter={(e) => {
                                    if (plan.highlighted) { e.currentTarget.style.boxShadow = "0 4px 20px rgba(176,122,74,0.2)"; }
                                    else { e.currentTarget.style.borderColor = "var(--accent-primary)"; e.currentTarget.style.color = "var(--accent-primary)"; }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = "none";
                                    if (!plan.highlighted) { e.currentTarget.style.borderColor = "var(--border-secondary)"; e.currentTarget.style.color = "var(--text-primary)"; }
                                }}
                            >
                                {plan.cta}
                            </a>

                            <div style={{ marginTop: "28px", paddingTop: "24px", borderTop: "1px solid var(--border-primary)", display: "flex", flexDirection: "column", gap: "12px" }}>
                                {plan.features.map((f, fi) => (
                                    <div key={fi} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <Check size={13} style={{ color: plan.highlighted ? "var(--accent-primary)" : "var(--text-muted)", flexShrink: 0 }} />
                                        <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 300 }}>{f}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Enterprise */}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    style={{ marginTop: "40px", padding: "32px 36px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}
                >
                    <div>
                        <h3 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Enterprise</h3>
                        <p style={{ marginTop: "4px", fontSize: "13px", color: "var(--text-tertiary)", fontWeight: 300 }}>Custom contracts, SSO, SLAs, dedicated infrastructure, and white-glove onboarding.</p>
                    </div>
                    <a href="#"
                        style={{ padding: "12px 28px", borderRadius: "4px", fontSize: "12px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-primary)", textDecoration: "none", border: "1px solid var(--border-secondary)", transition: "all 0.3s", whiteSpace: "nowrap" }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; e.currentTarget.style.color = "var(--accent-primary)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-secondary)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                    >
                        Talk to sales
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
