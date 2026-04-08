import Link from "next/link";

export const metadata = {
    title: "Privacy Policy — ArchFlow",
    description: "ArchFlow Privacy Policy — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "0 24px" }}>
            <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 0" }}>
                <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "10px", textDecoration: "none", marginBottom: "48px" }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "4px", border: "1.5px solid var(--accent-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 21L12 3L21 21" />
                            <path d="M7.5 14h9" />
                        </svg>
                    </div>
                    <span style={{ fontSize: "20px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>ArchFlow</span>
                </Link>

                <h1 style={{ fontSize: "32px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "8px" }}>
                    Privacy Policy
                </h1>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "40px" }}>Last updated: April 2026</p>

                <div style={{ display: "flex", flexDirection: "column", gap: "32px", fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.8, fontWeight: 300 }}>
                    <section>
                        <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "12px" }}>1. Information We Collect</h2>
                        <p><strong style={{ fontWeight: 500, color: "var(--text-primary)" }}>Account Information:</strong> When you create an account, we collect your name, email address, and organization name. We store a hashed version of your password — we never store or have access to your plaintext password.</p>
                        <p style={{ marginTop: "12px" }}><strong style={{ fontWeight: 500, color: "var(--text-primary)" }}>Business Data:</strong> Data you enter into the platform including project details, time entries, invoices, client records, expenses, and resource allocations. This data belongs to you and your organization.</p>
                        <p style={{ marginTop: "12px" }}><strong style={{ fontWeight: 500, color: "var(--text-primary)" }}>Usage Data:</strong> We may collect anonymized analytics about how you interact with the Service, including pages visited, features used, and session duration, solely to improve the product experience.</p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "12px" }}>2. How We Use Your Information</h2>
                        <p>We use your information to: (a) provide and maintain the Service; (b) authenticate your identity and manage your account; (c) process transactions and send related notices; (d) respond to your support requests; (e) improve the Service based on usage patterns; and (f) send important updates about the Service. We do not sell your personal information to third parties.</p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "12px" }}>3. Data Storage & Security</h2>
                        <p>Your data is stored securely and is isolated per organization — no other organization can access your data. We implement industry-standard security measures including encrypted connections (TLS/SSL), hashed passwords (bcrypt), and role-based access controls within each organization. We regularly review and update our security practices.</p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "12px" }}>4. Data Sharing</h2>
                        <p>We do not share your business data with third parties except: (a) with your explicit consent; (b) to comply with legal obligations or valid legal processes; (c) to protect the rights, safety, or property of ArchFlow, our users, or the public; or (d) with service providers who assist in operating the Service, bound by strict confidentiality agreements.</p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "12px" }}>5. Your Rights</h2>
                        <p>You have the right to: (a) access and review your personal data; (b) correct inaccurate information; (c) export your data in a standard format; (d) request deletion of your account and associated data; and (e) opt out of non-essential communications. Organization administrators can manage team member access and permissions within the platform.</p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "12px" }}>6. Cookies</h2>
                        <p>We use essential cookies to maintain your authenticated session and remember your preferences (such as dark mode). We do not use third-party tracking cookies or advertising cookies. Session cookies are automatically deleted when you sign out or close your browser.</p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "12px" }}>7. Data Retention</h2>
                        <p>We retain your data for as long as your account is active. If you delete your account, we will remove your personal data within 30 days, except where we are required to retain it for legal or regulatory purposes. Anonymized, aggregated data may be retained indefinitely for analytics purposes.</p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "12px" }}>8. Children&apos;s Privacy</h2>
                        <p>ArchFlow is designed for professional use by architecture and engineering firms. The Service is not intended for use by individuals under the age of 16. We do not knowingly collect personal information from children.</p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "12px" }}>9. Changes to This Policy</h2>
                        <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through the Service. The &quot;Last updated&quot; date at the top of this page indicates when the policy was last revised.</p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "12px" }}>10. Contact Us</h2>
                        <p>For privacy-related inquiries, data requests, or concerns, please contact our privacy team at <a href="mailto:privacy@archflow.io" style={{ color: "var(--accent-primary)", textDecoration: "none" }}>privacy@archflow.io</a>.</p>
                    </section>
                </div>

                <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid var(--border-primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Link href="/terms" style={{ fontSize: "13px", color: "var(--accent-primary)", textDecoration: "none" }}>← Terms of Service</Link>
                    <Link href="/" style={{ fontSize: "13px", color: "var(--accent-primary)", textDecoration: "none" }}>Back to Home →</Link>
                </div>
            </div>
        </div>
    );
}
