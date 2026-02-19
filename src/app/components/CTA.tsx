"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function CTA() {
    return (
        <section style={{ position: "relative", paddingTop: "128px", paddingBottom: "128px" }}>
            <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "1px", background: "linear-gradient(to right, transparent, var(--border-secondary), transparent)" }} />

            <div style={{ position: "relative", maxWidth: "720px", margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
                <motion.div initial={{ opacity: 0, y: 25 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
                    <h2 style={{ fontSize: "clamp(28px, 4.5vw, 44px)", fontWeight: 400, lineHeight: 1.15, color: "var(--text-primary)" }}>
                        Ready to run your firm
                        <br />
                        <span style={{ color: "var(--accent-primary)" }}>like a well-designed building?</span>
                    </h2>
                    <p style={{ marginTop: "24px", fontSize: "16px", color: "var(--text-tertiary)", lineHeight: 1.7, fontWeight: 300, maxWidth: "500px", margin: "24px auto 0" }}>
                        Join hundreds of architecture and engineering firms who&apos;ve already made the switch. Start free — no credit card required.
                    </p>

                    <div style={{ marginTop: "48px", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "16px" }}>
                        <a href="#"
                            style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "16px 36px", fontSize: "13px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "white", textDecoration: "none", borderRadius: "4px", background: "var(--accent-primary)", transition: "all 0.3s" }}
                            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 30px rgba(176,122,74,0.2)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                        >
                            Get started for free
                            <ArrowRight size={16} />
                        </a>
                        <a href="#"
                            style={{ display: "inline-flex", alignItems: "center", padding: "16px 36px", fontSize: "13px", fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-secondary)", textDecoration: "none", borderRadius: "4px", border: "1px solid var(--border-secondary)", transition: "all 0.3s" }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; e.currentTarget.style.color = "var(--accent-primary)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-secondary)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                        >
                            Book a demo
                        </a>
                    </div>

                    <p style={{ marginTop: "32px", fontSize: "12px", color: "var(--text-muted)", fontWeight: 300, letterSpacing: "0.02em" }}>
                        Free forever for solo architects · No credit card · Cancel anytime
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
