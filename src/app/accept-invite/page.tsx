import { Suspense } from "react";
import AcceptInviteClient from "./AcceptInviteClient";

export default function AcceptInvitePage() {
    return (
        <Suspense
            fallback={
                <InviteShell title="Checking invite..." subtitle="One small moment while we verify your onboarding link." loading />
            }
        >
            <AcceptInviteClient />
        </Suspense>
    );
}

function InviteShell({ title, subtitle, loading }: { title: string; subtitle: string; loading?: boolean }) {
    return (
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "radial-gradient(circle at top left, rgba(176,122,74,0.12), transparent 34%), var(--bg-primary)", padding: "24px" }}>
            <div style={{ width: "100%", maxWidth: "460px", padding: "30px", borderRadius: "20px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" }}>
                <div style={{ width: "46px", height: "46px", borderRadius: "14px", display: "grid", placeItems: "center", background: "rgba(176,122,74,0.12)", color: "var(--accent-primary)", marginBottom: "18px" }}>
                    {loading ? "..." : "i"}
                </div>
                <h1 style={{ fontSize: "26px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>{title}</h1>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6, marginTop: "8px" }}>{subtitle}</p>
            </div>
        </div>
    );
}
