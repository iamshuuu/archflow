export default function SettingsPage() {
    return (
        <div>
            <div style={{ marginBottom: "28px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                    Settings
                </h1>
                <p style={{ marginTop: "4px", fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 300 }}>
                    Organization and account settings.
                </p>
            </div>
            <div style={{ padding: "48px", borderRadius: "10px", background: "var(--bg-card)", border: "1px dashed var(--border-secondary)", textAlign: "center" }}>
                <p style={{ fontSize: "16px", fontWeight: 400, color: "var(--text-secondary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>Settings</p>
                <p style={{ marginTop: "8px", fontSize: "13px", color: "var(--text-muted)", fontWeight: 300 }}>Organization branding, billing rates, team management, and integrations — coming next.</p>
            </div>
        </div>
    );
}
