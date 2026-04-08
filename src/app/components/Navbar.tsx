"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navLinks = [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <nav
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                transition: "all 0.4s",
                background: scrolled ? "rgba(250,248,245,0.92)" : "transparent",
                backdropFilter: scrolled ? "blur(20px)" : "none",
                WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
                borderBottom: scrolled ? "1px solid var(--border-primary)" : "1px solid transparent",
            }}
        >
            <div
                style={{
                    maxWidth: "1200px",
                    margin: "0 auto",
                    padding: "0 24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: "72px",
                }}
            >
                {/* Logo */}
                <a href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
                    <div
                        style={{
                            width: "34px",
                            height: "34px",
                            borderRadius: "4px",
                            border: "1.5px solid var(--accent-primary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 21L12 3L21 21" />
                            <path d="M7.5 14h9" />
                        </svg>
                    </div>
                    <span style={{ fontSize: "20px", fontWeight: 400, letterSpacing: "0.02em", color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                        ArchFlow
                    </span>
                </a>

                {/* Desktop links */}
                <div style={{ display: "flex", alignItems: "center", gap: "36px" }} className="hidden md:flex">
                    {navLinks.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            style={{
                                fontSize: "14px",
                                fontWeight: 400,
                                color: "var(--text-tertiary)",
                                textDecoration: "none",
                                letterSpacing: "0.02em",
                                transition: "color 0.3s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-primary)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                {/* Desktop CTAs */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }} className="hidden md:flex">
                    <a
                        href="/login"
                        style={{ fontSize: "14px", fontWeight: 400, color: "var(--text-tertiary)", textDecoration: "none", transition: "color 0.3s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-tertiary)")}
                    >
                        Log in
                    </a>
                    <a
                        href="/signup"
                        style={{
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "white",
                            textDecoration: "none",
                            padding: "10px 24px",
                            borderRadius: "4px",
                            background: "var(--accent-primary)",
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                            transition: "all 0.3s",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--accent-primary-hover)";
                            e.currentTarget.style.boxShadow = "0 4px 16px rgba(176,122,74,0.2)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "var(--accent-primary)";
                            e.currentTarget.style.boxShadow = "none";
                        }}
                    >
                        Get Started
                    </a>
                </div>

                {/* Mobile */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="md:hidden"
                    style={{ background: "none", border: "none", color: "var(--text-primary)", cursor: "pointer", padding: "4px" }}
                >
                    {mobileOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                            background: "rgba(250,248,245,0.98)",
                            borderTop: "1px solid var(--border-primary)",
                            overflow: "hidden",
                        }}
                    >
                        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                            {navLinks.map((link) => (
                                <a key={link.label} href={link.href} onClick={() => setMobileOpen(false)} style={{ fontSize: "16px", fontWeight: 400, color: "var(--text-secondary)", textDecoration: "none" }}>
                                    {link.label}
                                </a>
                            ))}
                            <div style={{ borderTop: "1px solid var(--border-primary)", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                                <a href="/login" style={{ fontSize: "16px", color: "var(--text-secondary)", textDecoration: "none" }}>Log in</a>
                                <a href="/signup" style={{ fontSize: "13px", fontWeight: 500, color: "white", textAlign: "center", padding: "14px", borderRadius: "4px", background: "var(--accent-primary)", letterSpacing: "0.04em", textTransform: "uppercase", textDecoration: "none" }}>
                                    Get Started
                                </a>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
