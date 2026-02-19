"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import { signIn } from "next-auth/react";

export default function SignupPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        firmName: "",
        fullName: "",
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const update = (k: string, v: string) =>
        setFormData((prev) => ({ ...prev, [k]: v }));

    const passwordChecks = [
        { label: "8+ characters", ok: formData.password.length >= 8 },
        { label: "Uppercase letter", ok: /[A-Z]/.test(formData.password) },
        { label: "Number", ok: /\d/.test(formData.password) },
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: formData.fullName, email: formData.email, password: formData.password }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Signup failed"); setLoading(false); return; }
            // Auto-login after signup
            const signInRes = await signIn("credentials", { email: formData.email, password: formData.password, redirect: false });
            if (signInRes?.error) { setError("Account created but login failed. Try signing in."); setLoading(false); return; }
            window.location.href = "/dashboard";
        } catch { setError("Something went wrong"); setLoading(false); }
    };

    const inputStyle: React.CSSProperties = {
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
    };

    return (
        <div style={{ minHeight: "100vh", display: "flex", background: "var(--bg-primary)" }}>
            {/* Left panel */}
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
                {/* Blueprint grid */}
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
                    <rect x="150" y="200" width="500" height="500" />
                    <line x1="150" y1="200" x2="650" y2="700" />
                    <line x1="650" y1="200" x2="150" y2="700" />
                    <circle cx="400" cy="450" r="180" />
                </svg>

                {/* Logo */}
                <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", position: "relative", zIndex: 1 }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "4px", border: "1.5px solid var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 21L12 3L21 21" />
                            <path d="M7.5 14h9" />
                        </svg>
                    </div>
                    <span style={{ fontSize: "20px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>ArchFlow</span>
                </Link>

                {/* Value props */}
                <div style={{ position: "relative", zIndex: 1 }}>
                    <h2 style={{ fontSize: "26px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", lineHeight: 1.3 }}>
                        Everything your firm needs,
                        <br />
                        <span style={{ color: "var(--accent-primary)" }}>nothing it doesn&apos;t.</span>
                    </h2>
                    <div style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "16px" }}>
                        {[
                            "Phase-based project management",
                            "Weekly timesheets with approval workflows",
                            "Real-time budget tracking & alerts",
                            "Professional invoicing with online payments",
                            "Team resource planning & utilization",
                        ].map((feature) => (
                            <div key={feature} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ width: "20px", height: "20px", borderRadius: "4px", background: "rgba(176,122,74,0.08)", border: "1px solid rgba(176,122,74,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Check size={11} style={{ color: "var(--accent-primary)" }} />
                                </div>
                                <span style={{ fontSize: "14px", color: "var(--text-secondary)", fontWeight: 300 }}>{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300, position: "relative", zIndex: 1 }}>
                    Free forever for solo architects · No credit card required
                </p>
            </div>

            {/* Right panel — form */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 24px" }}>
                <div style={{ width: "100%", maxWidth: "420px" }}>
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
                        Create your account
                    </h1>
                    <p style={{ marginTop: "8px", fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 300 }}>
                        Start managing your firm in minutes
                    </p>

                    {/* Social signup */}
                    <div style={{ marginTop: "32px", display: "flex", gap: "12px" }}>
                        {[
                            { name: "Google", icon: <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg> },
                            { name: "Microsoft", icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.4 24H0V13l5.7-5.7L11.4 1h7.2l-5.7 5.7L7.2 12.3 11.4 24zM24 24h-7.2L11.1 12.6 16.8 7h7.2L18.3 12.6 24 24z" /></svg> },
                        ].map((provider) => (
                            <button key={provider.name} type="button"
                                style={{ flex: 1, padding: "12px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", transition: "all 0.2s" }}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border-secondary)"; }}
                            >
                                {provider.icon}
                                {provider.name}
                            </button>
                        ))}
                    </div>

                    <div style={{ margin: "28px 0", display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ flex: 1, height: "1px", background: "var(--border-primary)" }} />
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400, letterSpacing: "0.06em", textTransform: "uppercase" }}>or</span>
                        <div style={{ flex: 1, height: "1px", background: "var(--border-primary)" }} />
                    </div>

                    {error && (
                        <div style={{ padding: "12px 14px", borderRadius: "6px", background: "rgba(176,80,64,0.08)", border: "1px solid rgba(176,80,64,0.2)", color: "var(--danger)", fontSize: "13px", fontWeight: 400, marginBottom: "4px" }}>
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>
                                    Firm name
                                </label>
                                <input type="text" value={formData.firmName} onChange={(e) => update("firmName", e.target.value)} placeholder="Studio Name" required style={inputStyle}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-secondary)"; }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>
                                    Full name
                                </label>
                                <input type="text" value={formData.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="John Smith" required style={inputStyle}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-secondary)"; }}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>
                                Work email
                            </label>
                            <input type="email" value={formData.email} onChange={(e) => update("email", e.target.value)} placeholder="you@yourfirm.com" required style={inputStyle}
                                onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; }}
                                onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-secondary)"; }}
                            />
                        </div>

                        <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)", marginBottom: "6px" }}>
                                Password
                            </label>
                            <div style={{ position: "relative" }}>
                                <input type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => update("password", e.target.value)} placeholder="••••••••" required
                                    style={{ ...inputStyle, paddingRight: "42px" }}
                                    onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; }}
                                    onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border-secondary)"; }}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "2px" }}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {/* Password strength */}
                            {formData.password.length > 0 && (
                                <div style={{ marginTop: "10px", display: "flex", gap: "12px" }}>
                                    {passwordChecks.map((check) => (
                                        <div key={check.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                            <div style={{ width: "12px", height: "12px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: check.ok ? "rgba(90,122,70,0.1)" : "var(--bg-secondary)", border: check.ok ? "1px solid var(--success)" : "1px solid var(--border-primary)" }}>
                                                {check.ok && <Check size={7} style={{ color: "var(--success)" }} />}
                                            </div>
                                            <span style={{ fontSize: "10px", color: check.ok ? "var(--success)" : "var(--text-muted)", fontWeight: 300 }}>{check.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button type="submit" disabled={loading}
                            style={{
                                width: "100%", padding: "14px", borderRadius: "6px", border: "none",
                                background: "var(--accent-primary)", color: "white", fontSize: "13px",
                                fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase",
                                cursor: loading ? "default" : "pointer", transition: "all 0.3s",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                opacity: loading ? 0.7 : 1,
                            }}
                            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = "0 4px 16px rgba(176,122,74,0.25)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                        >
                            {loading ? "Creating account…" : "Create account"}
                            {!loading && <ArrowRight size={16} />}
                        </button>

                        <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300, lineHeight: 1.5, textAlign: "center" }}>
                            By creating an account, you agree to our{" "}
                            <Link href="#" style={{ color: "var(--accent-primary)", textDecoration: "none" }}>Terms</Link>{" "}and{" "}
                            <Link href="#" style={{ color: "var(--accent-primary)", textDecoration: "none" }}>Privacy Policy</Link>.
                        </p>
                    </form>

                    <p style={{ marginTop: "28px", textAlign: "center", fontSize: "13px", color: "var(--text-tertiary)", fontWeight: 300 }}>
                        Already have an account?{" "}
                        <Link href="/login" style={{ color: "var(--accent-primary)", textDecoration: "none", fontWeight: 500 }}>
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
