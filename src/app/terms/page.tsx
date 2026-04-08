import Link from "next/link";

export const metadata = {
    title: "Terms of Service — ArchFlow",
    description: "ArchFlow Terms of Service agreement.",
};

export default function TermsPage() {
    return (
        <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "0 24px" }}>
            {/* Header */}
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
                    Terms of Service
                </h1>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "40px" }}>Last updated: April 2026</p>

                <div style={{ display: "flex", flexDirection: "column", gap: "32px", fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.8, fontWeight: 300 }}>
                    <section>
                        <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "12px" }}>1. Acceptance of Terms</h2>
                        <p>By accessing or using ArchFlow (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. These terms apply to all users, including firm administrators, team members, and any visitors.</p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "12px" }}>2. Description of Service</h2>
                        <p>ArchFlow is a practice management platform designed for architecture and engineering firms. The Service provides project management, time tracking, invoicing, resource allocation, budgeting, and reporting tools. We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time.</p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "12px" }}>3. User Accounts</h2>
                        <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate and complete information when creating an account. Each organization account is isolated — data is not shared between organizations. You must notify us immediately of any unauthorized use of your account.</p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "12px" }}>4. Data Ownership</h2>
                        <p>You retain full ownership of all data you enter into ArchFlow, including project information, time entries, financial data, client records, and any uploaded files. We do not claim any intellectual property rights over your content. You grant us a limited license to store, process, and display your data solely for the purpose of providing the Service.</p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "12px" }}>5. Acceptable Use</h2>
                        <p>You agree not to use the Service to: (a) violate any applicable laws or regulations; (b) transmit malicious code or interfere with the Service&apos;s infrastructure; (c) attempt to gain unauthorized access to other accounts or systems; (d) use the Service for any purpose other than legitimate business management; or (e) resell or redistribute the Service without written permission.</p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "12px" }}>6. Payment Terms</h2>
                        <p>Paid subscriptions are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by law. We may change our pricing with 30 days notice. Failure to pay may result in suspension of your account. Free tier accounts are subject to usage limitations as described on our pricing page.</p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "12px" }}>7. Limitation of Liability</h2>
                        <p>ArchFlow is provided &quot;as is&quot; without warranties of any kind. To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities, arising from your use of the Service.</p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "12px" }}>8. Termination</h2>
                        <p>Either party may terminate this agreement at any time. Upon termination, you may request an export of your data within 30 days. After this period, we reserve the right to delete your data. We may suspend or terminate accounts that violate these terms without prior notice.</p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "12px" }}>9. Changes to Terms</h2>
                        <p>We may update these Terms of Service from time to time. We will notify you of material changes via email or through the Service. Continued use of the Service after changes constitutes acceptance of the revised terms.</p>
                    </section>

                    <section>
                        <h2 style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif", marginBottom: "12px" }}>10. Contact</h2>
                        <p>If you have questions about these Terms, please contact us at <a href="mailto:legal@archflow.io" style={{ color: "var(--accent-primary)", textDecoration: "none" }}>legal@archflow.io</a>.</p>
                    </section>
                </div>

                <div style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid var(--border-primary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Link href="/" style={{ fontSize: "13px", color: "var(--accent-primary)", textDecoration: "none" }}>← Back to Home</Link>
                    <Link href="/privacy" style={{ fontSize: "13px", color: "var(--accent-primary)", textDecoration: "none" }}>Privacy Policy →</Link>
                </div>
            </div>
        </div>
    );
}
