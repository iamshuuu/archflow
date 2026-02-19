"use client";

import { Twitter, Linkedin, Github, Youtube } from "lucide-react";

const footerLinks = {
    Product: [
        { label: "Features", href: "#features" },
        { label: "Pricing", href: "#pricing" },
        { label: "Integrations", href: "#" },
        { label: "Changelog", href: "#" },
        { label: "Roadmap", href: "#" },
    ],
    Resources: [
        { label: "Documentation", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Templates", href: "#" },
        { label: "Webinars", href: "#" },
    ],
    Company: [
        { label: "About", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Contact", href: "#" },
    ],
    Legal: [
        { label: "Privacy", href: "#" },
        { label: "Terms", href: "#" },
        { label: "Security", href: "#" },
    ],
};

const socials = [
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Github, href: "#", label: "GitHub" },
    { icon: Youtube, href: "#", label: "YouTube" },
];

export default function Footer() {
    return (
        <footer style={{ borderTop: "1px solid var(--border-secondary)", background: "var(--bg-secondary)" }}>
            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "64px 24px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr repeat(4, 1fr)", gap: "40px" }}>
                    {/* Brand */}
                    <div>
                        <a href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
                            <div style={{ width: "30px", height: "30px", borderRadius: "4px", border: "1.5px solid var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 21L12 3L21 21" />
                                    <path d="M7.5 14h9" />
                                </svg>
                            </div>
                            <span style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>ArchFlow</span>
                        </a>
                        <p style={{ marginTop: "16px", fontSize: "13px", color: "var(--text-muted)", maxWidth: "240px", lineHeight: 1.65, fontWeight: 300 }}>
                            The modern practice management platform for architecture & engineering firms.
                        </p>
                        <div style={{ marginTop: "24px", display: "flex", gap: "8px" }}>
                            {socials.map((social) => (
                                <a key={social.label} href={social.href} aria-label={social.label}
                                    style={{ width: "32px", height: "32px", borderRadius: "4px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", textDecoration: "none", transition: "all 0.3s" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-primary)"; e.currentTarget.style.borderColor = "var(--border-secondary)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border-primary)"; }}
                                >
                                    <social.icon size={14} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title}>
                            <h4 style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-secondary)" }}>{title}</h4>
                            <ul style={{ marginTop: "16px", listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <a href={link.href}
                                            style={{ fontSize: "13px", color: "var(--text-muted)", textDecoration: "none", fontWeight: 300, transition: "color 0.3s" }}
                                            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-primary)")}
                                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                                        >
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom */}
                <div style={{ marginTop: "56px", paddingTop: "24px", borderTop: "1px solid var(--border-primary)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300 }}>© {new Date().getFullYear()} ArchFlow. All rights reserved.</p>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300 }}>Designed for architects, by architects</p>
                </div>
            </div>
        </footer>
    );
}
