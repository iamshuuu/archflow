"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight } from "lucide-react";

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        // TODO: connect to NextAuth
        setTimeout(() => {
            window.location.href = "/dashboard";
        }, 800);
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                background: "var(--bg-primary)",
            }}
        >
            {/* Left panel — branding */}
            <div
                style={{
                    flex: "0 0 50%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "48px",
                    background: "var(--bg-secondary)",
                    borderRight: "1px solid var(--border-primary)",
                    position: "relative",
                    overflow: "hidden",
                }}
                className="hidden lg:flex"
            >
                {/* Pencil-sketch SVG lines */}
                <svg
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.04 }}
                    viewBox="0 0 800 900"
                    fill="none"
                    stroke="var(--accent-primary)"
                    strokeWidth="0.5"
                    preserveAspectRatio="none"
                >
                    <line x1="100" y1="0" x2="100" y2="900" />
                    <line x1="300" y1="0" x2="300" y2="900" />
                    <line x1="500" y1="0" x2="500" y2="900" />
                    <line x1="700" y1="0" x2="700" y2="900" />
                    <line x1="0" y1="150" x2="800" y2="150" />
                    <line x1="0" y1="350" x2="800" y2="350" />
                    <line x1="0" y1="550" x2="800" y2="550" />
                    <line x1="0" y1="750" x2="800" y2="750" />
                    <circle cx="400" cy="450" r="200" />
                    <circle cx="400" cy="450" r="120" />
                    <line x1="200" y1="250" x2="600" y2="650" />
                    <line x1="600" y1="250" x2="200" y2="650" />
                    <polygon points="400,100 650,700 150,700" />
                </svg>

                {/* Logo */}
                <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", position: "relative", zIndex: 1 }}>
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
                    <span style={{ fontSize: "20px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                        ArchFlow
                    </span>
                </Link>

                {/* Testimonial */}
                <div style={{ position: "relative", zIndex: 1, maxWidth: "440px" }}>
                    <blockquote style={{ fontSize: "22px", fontWeight: 400, lineHeight: 1.5, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                        &ldquo;ArchFlow replaced three tools we were juggling. Our timesheets, budgets, and invoices finally live in one place.&rdquo;
                    </blockquote>
                    <div style={{ marginTop: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: "14px", fontWeight: 500, fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                            SM
                        </div>
                        <div>
                            <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>Sarah Mitchell, AIA</p>
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 300 }}>Principal — Mitchell & Associates</p>
                        </div>
                    </div>
                </div>

                <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300, position: "relative", zIndex: 1 }}>
                    © {new Date().getFullYear()} ArchFlow. All rights reserved.
                </p>
            </div>

            {/* Right panel — form */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "48px 24px",
                }}
            >
                <div style={{ width: "100%", maxWidth: "400px" }}>
                    {/* Mobile logo */}
                    <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", marginBottom: "48px" }} className="lg:hidden">
                        <div style={{ width: "34px", height: "34px", borderRadius: "4px", border: "1.5px solid var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 21L12 3L21 21" />
                                <path d="M7.5 14h9" />
                            </svg>
                        </div>
                        <span style={{ fontSize: "20px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>ArchFlow</span>
                    </Link>

                    <h1 style={{ fontSize: "28px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                        Welcome back
                    </h1>
                    <p style={{ marginTop: "8px", fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 300 }}>
                        Sign in to your account to continue
                    </p>

                    {/* Social login */}
                    <div style={{ marginTop: "32px", display: "flex", gap: "12px" }}>
                        <button
                            type="button"
                            style={{
                                flex: 1,
                                padding: "12px",
                                borderRadius: "6px",
                                border: "1px solid var(--border-secondary)",
                                background: "var(--bg-card)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                fontSize: "13px",
                                fontWeight: 500,
                                color: "var(--text-secondary)",
                                transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-secondary)"; }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Google
                        </button>
                        <button
                            type="button"
                            style={{
                                flex: 1,
                                padding: "12px",
                                borderRadius: "6px",
                                border: "1px solid var(--border-secondary)",
                                background: "var(--bg-card)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                fontSize: "13px",
                                fontWeight: 500,
                                color: "var(--text-secondary)",
                                transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-secondary)"; }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M11.4 24H0V13l5.7-5.7L11.4 1h7.2l-5.7 5.7L7.2 12.3 11.4 24zM24 24h-7.2L11.1 12.6 16.8 7h7.2L18.3 12.6 24 24z" />
                            </svg>
                            Microsoft
                        </button>
                    </div>

                    {/* Divider */}
                    <div style={{ margin: "28px 0", display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ flex: 1, height: "1px", background: "var(--border-primary)" }} />
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400, letterSpacing: "0.06em", textTransform: "uppercase" }}>or</span>
                        <div style={{ flex: 1, height: "1px", background: "var(--border-primary)" }} />
                    </div>

                    {/* Email form */}
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px", letterSpacing: "0.02em" }}>
                                Email address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@yourfirm.com"
                                required
                                style={{
                                    width: "100%",
                                    padding: "12px 14px",
                                    borderRadius: "6px",
                                    border: "1px solid var(--border-secondary)",
                                    background: "var(--bg-card)",
                                    fontSize: "14px",
                                    color: "var(--text-primary)",
                                    outline: "none",
                                    transition: "border-color 0.2s",
                                    fontFamily: "inherit",
                                }}
                                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-secondary)"; }}
                            />
                        </div>

                        <div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                <label style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", letterSpacing: "0.02em" }}>
                                    Password
                                </label>
                                <Link href="#" style={{ fontSize: "12px", color: "var(--accent-primary)", textDecoration: "none", fontWeight: 400 }}>
                                    Forgot password?
                                </Link>
                            </div>
                            <div style={{ position: "relative" }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "12px 42px 12px 14px",
                                        borderRadius: "6px",
                                        border: "1px solid var(--border-secondary)",
                                        background: "var(--bg-card)",
                                        fontSize: "14px",
                                        color: "var(--text-primary)",
                                        outline: "none",
                                        transition: "border-color 0.2s",
                                        fontFamily: "inherit",
                                    }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-secondary)"; }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: "absolute",
                                        right: "12px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        color: "var(--text-muted)",
                                        padding: "2px",
                                    }}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: "100%",
                                padding: "14px",
                                borderRadius: "6px",
                                border: "none",
                                background: "var(--accent-primary)",
                                color: "white",
                                fontSize: "13px",
                                fontWeight: 500,
                                letterSpacing: "0.06em",
                                textTransform: "uppercase",
                                cursor: loading ? "default" : "pointer",
                                transition: "all 0.3s",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                opacity: loading ? 0.7 : 1,
                            }}
                            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = "0 4px 16px rgba(176,122,74,0.25)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                        >
                            {loading ? "Signing in…" : "Sign in"}
                            {!loading && <ArrowRight size={16} />}
                        </button>
                    </form>

                    <p style={{ marginTop: "32px", textAlign: "center", fontSize: "13px", color: "var(--text-tertiary)", fontWeight: 300 }}>
                        Don&apos;t have an account?{" "}
                        <Link href="/signup" style={{ color: "var(--accent-primary)", textDecoration: "none", fontWeight: 500 }}>
                            Create one
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
