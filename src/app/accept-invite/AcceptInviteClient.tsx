"use client";

import type { ReactNode } from "react";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, Lock, UserRound } from "lucide-react";
import { trpc } from "@/app/providers";

type InviteData = {
    name: string;
    email: string;
    role: string;
    title: string;
    expired: boolean;
    org?: { name: string | null };
    invitedBy?: { name: string | null };
};

export default function AcceptInviteClient() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";
    const { data: invite, isLoading } = trpc.team.getInviteByToken.useQuery({ token }, { enabled: !!token });
    const acceptInvite = trpc.team.acceptInvite.useMutation();
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    const inviteData = invite as InviteData | null;
    const inviteReady = !!inviteData && !inviteData.expired;
    const displayName = name || inviteData?.name || "";

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setError("");
        if (!token || !inviteReady) return;
        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        await acceptInvite.mutateAsync({
            token,
            name: displayName,
            phone,
            password,
        });
    };

    if (!token) {
        return <InviteShell title="Invite link missing" subtitle="Please open the invite link from your email." />;
    }

    if (isLoading) {
        return <InviteShell title="Checking invite..." subtitle="One small moment while we verify your onboarding link." loading />;
    }

    if (!inviteReady) {
        return <InviteShell title="Invite expired or invalid" subtitle="Ask your manager to resend your ArchFlow invite." />;
    }

    if (acceptInvite.isSuccess) {
        return (
            <InviteShell title="You're in" subtitle="Your ArchFlow account is ready. Sign in with your email and new password.">
                <Link href="/login" style={primaryButton}>Go to Login</Link>
            </InviteShell>
        );
    }

    return (
        <InviteShell title={`Join ${inviteData?.org?.name || "ArchFlow"}`} subtitle={`${inviteData?.invitedBy?.name || "Your team"} invited you as ${inviteData?.role}. Your role and access are already set.`}>
            <form onSubmit={submit} style={{ display: "grid", gap: "12px" }}>
                <div style={{ padding: "14px", borderRadius: "12px", background: "var(--bg-warm)", border: "1px solid var(--border-primary)" }}>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Invite Details</p>
                    <p style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 700 }}>{inviteData?.email}</p>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>{inviteData?.title || "Team member"} / {inviteData?.role}</p>
                </div>
                <label style={labelStyle}>Confirm Name</label>
                <input value={displayName} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={fieldStyle} />
                <label style={labelStyle}>Phone Optional</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" style={fieldStyle} />
                <label style={labelStyle}>Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" style={fieldStyle} />
                <label style={labelStyle}>Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" style={fieldStyle} />
                {(error || acceptInvite.error?.message) && <p style={{ color: "var(--danger)", fontSize: "12px" }}>{error || acceptInvite.error?.message}</p>}
                <button type="submit" disabled={acceptInvite.isPending} style={primaryButton}>
                    {acceptInvite.isPending ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <CheckCircle size={15} />}
                    Create Account
                </button>
            </form>
        </InviteShell>
    );
}

function InviteShell({ title, subtitle, loading, children }: { title: string; subtitle: string; loading?: boolean; children?: ReactNode }) {
    return (
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "radial-gradient(circle at top left, rgba(176,122,74,0.12), transparent 34%), var(--bg-primary)", padding: "24px" }}>
            <div style={{ width: "100%", maxWidth: "460px", padding: "30px", borderRadius: "20px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                <div style={{ width: "46px", height: "46px", borderRadius: "14px", display: "grid", placeItems: "center", background: "rgba(176,122,74,0.12)", color: "var(--accent-primary)", marginBottom: "18px" }}>
                    {loading ? <Loader2 size={21} style={{ animation: "spin 1s linear infinite" }} /> : <UserRound size={21} />}
                </div>
                <h1 style={{ fontSize: "26px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{title}</h1>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6, marginTop: "8px", marginBottom: children ? "22px" : 0 }}>{subtitle}</p>
                {children}
                <div style={{ display: "flex", gap: "7px", alignItems: "center", marginTop: "18px", color: "var(--text-muted)", fontSize: "11px" }}>
                    <Lock size={12} /> Role, access, bill rate, and cost rate are controlled by your firm.
                </div>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

const labelStyle: React.CSSProperties = {
    fontSize: "10px",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    fontWeight: 700,
};

const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "11px 12px",
    borderRadius: "9px",
    border: "1px solid var(--border-secondary)",
    background: "var(--bg-card)",
    color: "var(--text-primary)",
    fontFamily: "inherit",
    fontSize: "13px",
    outline: "none",
};

const primaryButton: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    width: "100%",
    padding: "12px 16px",
    borderRadius: "10px",
    border: "none",
    background: "var(--accent-primary)",
    color: "white",
    fontWeight: 700,
    fontSize: "13px",
    cursor: "pointer",
    textDecoration: "none",
};
