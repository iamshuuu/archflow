"use client";

import { useState } from "react";
import { trpc } from "@/app/providers";
import {
    Building2,
    Globe,
    DollarSign,
    Shield,
    Calendar,
    Plug,
    Save,
    Plus,
    Trash2,
    Loader2,
    Check,
    MapPin,
    Mail,
    Phone,
    Clock,
    Target,
    Percent,
    X,
} from "lucide-react";

/* ─── Types ─── */
type SettingsTab = "organization" | "regional" | "financial" | "permissions" | "timeoff" | "integrations";

const tabs: { key: SettingsTab; label: string; icon: any }[] = [
    { key: "organization", label: "Organization", icon: Building2 },
    { key: "regional", label: "Regional", icon: Globe },
    { key: "financial", label: "Financial", icon: DollarSign },
    { key: "permissions", label: "Permissions", icon: Shield },
    { key: "timeoff", label: "Time Off", icon: Calendar },
    { key: "integrations", label: "Integrations", icon: Plug },
];

const currencyOptions = ["USD", "EUR", "GBP", "CAD", "AUD", "INR", "JPY", "CHF"];
const timezones = [
    "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
    "America/Toronto", "Europe/London", "Europe/Paris", "Europe/Berlin",
    "Asia/Tokyo", "Asia/Shanghai", "Asia/Kolkata", "Australia/Sydney",
    "Pacific/Auckland",
];
const localeOptions = ["en-US", "en-GB", "fr-FR", "de-DE", "es-ES", "ja-JP", "zh-CN", "hi-IN"];

const roleFeatures = [
    { key: "viewFinancials", label: "View firm financials" },
    { key: "manageInvoices", label: "Create & send invoices" },
    { key: "manageProjects", label: "Create & edit projects" },
    { key: "manageBudgets", label: "Manage project budgets" },
    { key: "manageTeam", label: "Add & remove team members" },
    { key: "viewReports", label: "View analytics & reports" },
    { key: "approveTimesheets", label: "Approve timesheets" },
    { key: "manageSettings", label: "Manage settings" },
    { key: "manageExpenses", label: "Approve expenses" },
];

const defaultPerms: Record<string, Record<string, boolean>> = {
    owner: Object.fromEntries(roleFeatures.map(f => [f.key, true])),
    admin: Object.fromEntries(roleFeatures.map(f => [f.key, true])),
    manager: {
        viewFinancials: false, manageInvoices: true, manageProjects: true,
        manageBudgets: true, manageTeam: false, viewReports: true,
        approveTimesheets: true, manageSettings: false, manageExpenses: true,
    },
    member: {
        viewFinancials: false, manageInvoices: false, manageProjects: false,
        manageBudgets: false, manageTeam: false, viewReports: false,
        approveTimesheets: false, manageSettings: false, manageExpenses: false,
    },
};

/* ─── Shared styles ─── */
const cardStyle: React.CSSProperties = {
    padding: "24px", borderRadius: "10px", background: "var(--bg-card)",
    border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)",
};
const labelStyle: React.CSSProperties = {
    fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)",
    marginBottom: "6px", display: "block",
};
const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", borderRadius: "6px",
    border: "1px solid var(--border-primary)", background: "var(--bg-secondary)",
    fontSize: "13px", color: "var(--text-primary)", fontFamily: "inherit", outline: "none",
};
const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };
const sectionTitle: React.CSSProperties = {
    fontSize: "14px", fontWeight: 500, color: "var(--text-primary)",
    marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px",
};

export default function SettingsPage() {
    const [tab, setTab] = useState<SettingsTab>("organization");
    const [saved, setSaved] = useState(false);

    // Org settings data
    const { data: org, isLoading, refetch } = trpc.settings.get.useQuery();
    const updateOrg = trpc.settings.update.useMutation({
        onSuccess: () => { refetch(); setSaved(true); setTimeout(() => setSaved(false), 2000); },
    });

    // Time off policies
    const { data: policies = [], refetch: refetchPolicies } = trpc.settings.getTimeOffPolicies.useQuery();
    const createPolicy = trpc.settings.createTimeOffPolicy.useMutation({ onSuccess: () => refetchPolicies() });
    const deletePolicy = trpc.settings.deleteTimeOffPolicy.useMutation({ onSuccess: () => refetchPolicies() });

    // Holidays
    const { data: holidays = [], refetch: refetchHolidays } = trpc.settings.getHolidays.useQuery();
    const createHoliday = trpc.settings.createHoliday.useMutation({ onSuccess: () => refetchHolidays() });
    const deleteHoliday = trpc.settings.deleteHoliday.useMutation({ onSuccess: () => refetchHolidays() });

    // Default roles
    const { data: defaultRoles = [], refetch: refetchRoles } = trpc.settings.getDefaultRoles.useQuery();
    const createRole = trpc.settings.createDefaultRole.useMutation({ onSuccess: () => refetchRoles() });
    const updateRole = trpc.settings.updateDefaultRole.useMutation({ onSuccess: () => refetchRoles() });
    const deleteRole = trpc.settings.deleteDefaultRole.useMutation({ onSuccess: () => refetchRoles() });

    // Local form state
    const [form, setForm] = useState<Record<string, any>>({});
    const [perms, setPerms] = useState<Record<string, Record<string, boolean>>>(defaultPerms);
    const [newPolicy, setNewPolicy] = useState({ name: "", type: "pto", daysPerYear: 15 });
    const [newHoliday, setNewHoliday] = useState({ name: "", date: "" });
    const [newRole, setNewRole] = useState({ name: "", defaultBillRate: 0, defaultCostRate: 0 });
    const [showNewPolicy, setShowNewPolicy] = useState(false);
    const [showNewHoliday, setShowNewHoliday] = useState(false);
    const [showNewRole, setShowNewRole] = useState(false);

    // Sync org data to local form
    const getVal = (key: string) => form[key] ?? (org as any)?.[key] ?? "";
    const setVal = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }));

    // Load permissions from org
    const getPerms = (): Record<string, Record<string, boolean>> => {
        try {
            const raw = (org as any)?.permissionsJson;
            if (raw && raw !== "{}") return JSON.parse(raw);
        } catch { /* ignore */ }
        return defaultPerms;
    };

    const handleSave = () => {
        const data: any = {};
        for (const key of Object.keys(form)) {
            if (form[key] !== (org as any)?.[key]) data[key] = form[key];
        }
        if (Object.keys(data).length > 0) updateOrg.mutate(data);
        else { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    };

    const handleSavePerms = () => {
        updateOrg.mutate({ permissionsJson: JSON.stringify(perms) });
    };

    if (isLoading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "400px", gap: "12px", color: "var(--text-muted)" }}>
                <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                <span style={{ fontSize: "14px", fontWeight: 300 }}>Loading settings…</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div style={{ marginBottom: "24px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                        Settings
                    </h1>
                    <p style={{ marginTop: "4px", fontSize: "14px", color: "var(--text-tertiary)", fontWeight: 300 }}>
                        Organization configuration, billing, permissions, and policies.
                    </p>
                </div>
                {(tab === "organization" || tab === "regional" || tab === "financial") && (
                    <button
                        onClick={handleSave}
                        disabled={updateOrg.isPending}
                        style={{
                            display: "flex", alignItems: "center", gap: "6px",
                            padding: "8px 16px", borderRadius: "6px",
                            background: saved ? "var(--success)" : "var(--accent-primary)",
                            color: "white", border: "none", cursor: "pointer",
                            fontSize: "13px", fontWeight: 500, fontFamily: "inherit",
                            transition: "all 0.2s",
                        }}
                    >
                        {saved ? <><Check size={14} /> Saved</> : updateOrg.isPending ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Saving…</> : <><Save size={14} /> Save Changes</>}
                    </button>
                )}
            </div>

            {/* Tab navigation */}
            <div style={{ display: "flex", gap: "2px", marginBottom: "24px", borderBottom: "1px solid var(--border-primary)", paddingBottom: "0" }}>
                {tabs.map(t => {
                    const active = tab === t.key;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setTab(t.key)}
                            style={{
                                display: "flex", alignItems: "center", gap: "6px",
                                padding: "10px 16px", borderRadius: "6px 6px 0 0",
                                border: "none", cursor: "pointer",
                                background: active ? "var(--bg-card)" : "transparent",
                                color: active ? "var(--accent-primary)" : "var(--text-tertiary)",
                                fontSize: "13px", fontWeight: active ? 500 : 400, fontFamily: "inherit",
                                borderBottom: active ? "2px solid var(--accent-primary)" : "2px solid transparent",
                                transition: "all 0.15s",
                            }}
                        >
                            <t.icon size={14} />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {/* ─── Organization Tab ─── */}
            {tab === "organization" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "720px" }}>
                    <div style={cardStyle}>
                        <p style={sectionTitle}><Building2 size={16} /> Firm Information</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div>
                                <label style={labelStyle}>Firm Name</label>
                                <input style={inputStyle} value={getVal("name")} onChange={e => setVal("name", e.target.value)} placeholder="Your firm name" />
                            </div>
                            <div>
                                <label style={labelStyle}>Website</label>
                                <input style={inputStyle} value={getVal("website")} onChange={e => setVal("website", e.target.value)} placeholder="https://yourfirm.com" />
                            </div>
                            <div>
                                <label style={labelStyle}>Email</label>
                                <div style={{ position: "relative" }}>
                                    <Mail size={14} style={{ position: "absolute", left: "10px", top: "11px", color: "var(--text-muted)" }} />
                                    <input style={{ ...inputStyle, paddingLeft: "32px" }} value={getVal("email")} onChange={e => setVal("email", e.target.value)} placeholder="office@yourfirm.com" />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Phone</label>
                                <div style={{ position: "relative" }}>
                                    <Phone size={14} style={{ position: "absolute", left: "10px", top: "11px", color: "var(--text-muted)" }} />
                                    <input style={{ ...inputStyle, paddingLeft: "32px" }} value={getVal("phone")} onChange={e => setVal("phone", e.target.value)} placeholder="+1 (555) 123-4567" />
                                </div>
                            </div>
                        </div>
                        <div style={{ marginTop: "16px" }}>
                            <label style={labelStyle}>Address</label>
                            <div style={{ position: "relative" }}>
                                <MapPin size={14} style={{ position: "absolute", left: "10px", top: "11px", color: "var(--text-muted)" }} />
                                <textarea
                                    style={{ ...inputStyle, paddingLeft: "32px", minHeight: "60px", resize: "vertical" }}
                                    value={getVal("address")}
                                    onChange={e => setVal("address", e.target.value)}
                                    placeholder="123 Architecture St, Suite 100, New York, NY 10001"
                                />
                            </div>
                        </div>
                    </div>

                    <div style={cardStyle}>
                        <p style={sectionTitle}><Mail size={16} /> Client Email Signature</p>
                        <label style={labelStyle}>Signature (shown on outgoing invoices and emails)</label>
                        <textarea
                            style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                            value={getVal("clientEmailSignature")}
                            onChange={e => setVal("clientEmailSignature", e.target.value)}
                            placeholder="Thank you for your business.&#10;&#10;Best regards,&#10;Your Firm Name"
                        />
                    </div>
                </div>
            )}

            {/* ─── Regional Tab ─── */}
            {tab === "regional" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "720px" }}>
                    <div style={cardStyle}>
                        <p style={sectionTitle}><Globe size={16} /> Regional Preferences</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div>
                                <label style={labelStyle}><Clock size={12} style={{ marginRight: "4px", verticalAlign: "text-bottom" }} />Timezone</label>
                                <select style={selectStyle} value={getVal("timezone")} onChange={e => setVal("timezone", e.target.value)}>
                                    {timezones.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, " ")}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Locale</label>
                                <select style={selectStyle} value={getVal("locale")} onChange={e => setVal("locale", e.target.value)}>
                                    {localeOptions.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}><DollarSign size={12} style={{ marginRight: "4px", verticalAlign: "text-bottom" }} />Currency</label>
                                <select style={selectStyle} value={getVal("currency")} onChange={e => setVal("currency", e.target.value)}>
                                    {currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Unit of Measurement</label>
                                <select style={selectStyle} value={getVal("unitOfMeasurement")} onChange={e => setVal("unitOfMeasurement", e.target.value)}>
                                    <option value="feet">Imperial (Feet)</option>
                                    <option value="meters">Metric (Meters)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Preview card */}
                    <div style={cardStyle}>
                        <p style={sectionTitle}><Globe size={16} /> Format Preview</p>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 300, marginBottom: "16px" }}>
                            Preview of how values will be displayed across the platform.
                        </p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                            <div style={{ padding: "14px", borderRadius: "8px", background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
                                <p style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Currency</p>
                                <p style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                                    {(() => {
                                        try {
                                            return new Intl.NumberFormat(getVal("locale") || "en-US", {
                                                style: "currency",
                                                currency: getVal("currency") || "USD",
                                            }).format(12450.00);
                                        } catch { return "$12,450.00"; }
                                    })()}
                                </p>
                            </div>
                            <div style={{ padding: "14px", borderRadius: "8px", background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
                                <p style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Date Format</p>
                                <p style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                                    {new Date().toLocaleDateString(getVal("locale") || "en-US", { year: "numeric", month: "short", day: "numeric" })}
                                </p>
                            </div>
                            <div style={{ padding: "14px", borderRadius: "8px", background: "var(--bg-secondary)", border: "1px solid var(--border-primary)" }}>
                                <p style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Measurement</p>
                                <p style={{ fontSize: "18px", fontWeight: 400, color: "var(--text-primary)", fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                                    {getVal("unitOfMeasurement") === "meters" ? "1,200 m²" : "12,916 ft²"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Financial Tab ─── */}
            {tab === "financial" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "720px" }}>
                    <div style={cardStyle}>
                        <p style={sectionTitle}><DollarSign size={16} /> Financial Configuration</p>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div>
                                <label style={labelStyle}>Annual Overhead Costs ($)</label>
                                <input style={inputStyle} type="number" value={getVal("overheadCosts") || 0} onChange={e => setVal("overheadCosts", parseFloat(e.target.value) || 0)} />
                            </div>
                            <div>
                                <label style={labelStyle}>Working Hours / Year</label>
                                <input style={inputStyle} type="number" value={getVal("workingHoursPerYear") || 2087} onChange={e => setVal("workingHoursPerYear", parseInt(e.target.value) || 2087)} />
                            </div>
                            <div>
                                <label style={labelStyle}><Target size={12} style={{ marginRight: "4px", verticalAlign: "text-bottom" }} />Target Utilization %</label>
                                <input style={inputStyle} type="number" min={0} max={100} value={getVal("targetUtilization") || 75} onChange={e => setVal("targetUtilization", parseFloat(e.target.value) || 75)} />
                            </div>
                            <div>
                                <label style={labelStyle}><Percent size={12} style={{ marginRight: "4px", verticalAlign: "text-bottom" }} />Target Realization %</label>
                                <input style={inputStyle} type="number" min={0} max={100} value={getVal("targetRealization") || 65} onChange={e => setVal("targetRealization", parseFloat(e.target.value) || 65)} />
                            </div>
                        </div>
                    </div>

                    {/* Default Roles & Rates */}
                    <div style={cardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <p style={{ ...sectionTitle, marginBottom: 0 }}><Shield size={16} /> Default Roles & Billing Rates</p>
                            <button
                                onClick={() => setShowNewRole(true)}
                                style={{
                                    display: "flex", alignItems: "center", gap: "4px",
                                    padding: "6px 12px", borderRadius: "6px",
                                    background: "var(--accent-primary)", color: "white",
                                    border: "none", cursor: "pointer", fontSize: "12px", fontFamily: "inherit",
                                }}
                            >
                                <Plus size={12} /> Add Role
                            </button>
                        </div>

                        {/* Role list */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {/* Header */}
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 40px", gap: "12px", padding: "0 4px" }}>
                                <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Role</span>
                                <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Bill Rate</span>
                                <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Cost Rate</span>
                                <span />
                            </div>

                            {(defaultRoles as any[]).map((role: any) => (
                                <div key={role.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 40px", gap: "12px", alignItems: "center", padding: "8px 4px", borderRadius: "6px", background: "var(--bg-secondary)" }}>
                                    <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 500 }}>{role.name}</span>
                                    <input
                                        style={{ ...inputStyle, padding: "6px 8px", fontSize: "12px" }}
                                        type="number" defaultValue={role.defaultBillRate}
                                        onBlur={e => updateRole.mutate({ id: role.id, defaultBillRate: parseFloat(e.target.value) || 0 })}
                                    />
                                    <input
                                        style={{ ...inputStyle, padding: "6px 8px", fontSize: "12px" }}
                                        type="number" defaultValue={role.defaultCostRate}
                                        onBlur={e => updateRole.mutate({ id: role.id, defaultCostRate: parseFloat(e.target.value) || 0 })}
                                    />
                                    <button onClick={() => deleteRole.mutate({ id: role.id })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            ))}

                            {defaultRoles.length === 0 && !showNewRole && (
                                <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 300, padding: "12px 4px" }}>No default roles configured. Add roles to set standard billing and cost rates.</p>
                            )}

                            {/* New role form */}
                            {showNewRole && (
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 40px", gap: "12px", alignItems: "center", padding: "8px 4px", borderRadius: "6px", border: "1px dashed var(--border-secondary)" }}>
                                    <input style={{ ...inputStyle, padding: "6px 8px", fontSize: "12px" }} placeholder="Role name" value={newRole.name} onChange={e => setNewRole(p => ({ ...p, name: e.target.value }))} />
                                    <input style={{ ...inputStyle, padding: "6px 8px", fontSize: "12px" }} type="number" placeholder="Bill $" value={newRole.defaultBillRate || ""} onChange={e => setNewRole(p => ({ ...p, defaultBillRate: parseFloat(e.target.value) || 0 }))} />
                                    <input style={{ ...inputStyle, padding: "6px 8px", fontSize: "12px" }} type="number" placeholder="Cost $" value={newRole.defaultCostRate || ""} onChange={e => setNewRole(p => ({ ...p, defaultCostRate: parseFloat(e.target.value) || 0 }))} />
                                    <div style={{ display: "flex", gap: "4px" }}>
                                        <button
                                            onClick={() => {
                                                if (newRole.name.trim()) {
                                                    createRole.mutate(newRole);
                                                    setNewRole({ name: "", defaultBillRate: 0, defaultCostRate: 0 });
                                                    setShowNewRole(false);
                                                }
                                            }}
                                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--success)", padding: "2px" }}
                                        >
                                            <Check size={14} />
                                        </button>
                                        <button onClick={() => setShowNewRole(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "2px" }}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Permissions Tab ─── */}
            {tab === "permissions" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "800px" }}>
                    <div style={cardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                            <p style={{ ...sectionTitle, marginBottom: 0 }}><Shield size={16} /> Role-Based Permissions</p>
                            <button
                                onClick={handleSavePerms}
                                disabled={updateOrg.isPending}
                                style={{
                                    display: "flex", alignItems: "center", gap: "6px",
                                    padding: "8px 16px", borderRadius: "6px",
                                    background: saved ? "var(--success)" : "var(--accent-primary)",
                                    color: "white", border: "none", cursor: "pointer",
                                    fontSize: "13px", fontWeight: 500, fontFamily: "inherit",
                                }}
                            >
                                {saved ? <><Check size={14} /> Saved</> : <><Save size={14} /> Save Permissions</>}
                            </button>
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 300, marginBottom: "16px" }}>
                            Configure which features each role can access. Owner and Admin always have full access.
                        </p>

                        {/* Permission matrix table */}
                        <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--border-primary)" }}>Feature</th>
                                        {["Owner", "Admin", "Manager", "Member"].map(role => (
                                            <th key={role} style={{ textAlign: "center", padding: "8px 12px", fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--border-primary)", width: "100px" }}>{role}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {roleFeatures.map((feat, i) => (
                                        <tr key={feat.key} style={{ background: i % 2 === 0 ? "transparent" : "var(--bg-secondary)" }}>
                                            <td style={{ padding: "10px 12px", color: "var(--text-primary)", fontWeight: 400 }}>{feat.label}</td>
                                            {["owner", "admin", "manager", "member"].map(role => {
                                                const locked = role === "owner" || role === "admin";
                                                const checked = locked ? true : (perms[role]?.[feat.key] ?? defaultPerms[role]?.[feat.key] ?? false);
                                                return (
                                                    <td key={role} style={{ textAlign: "center", padding: "10px 12px" }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            disabled={locked}
                                                            onChange={e => {
                                                                setPerms(p => ({
                                                                    ...p,
                                                                    [role]: { ...p[role], [feat.key]: e.target.checked },
                                                                }));
                                                            }}
                                                            style={{ accentColor: "var(--accent-primary)", cursor: locked ? "not-allowed" : "pointer", width: "16px", height: "16px" }}
                                                        />
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Time Off Tab ─── */}
            {tab === "timeoff" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    {/* Policies */}
                    <div style={cardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <p style={{ ...sectionTitle, marginBottom: 0 }}><Calendar size={16} /> Time Off Policies</p>
                            <button onClick={() => setShowNewPolicy(true)} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", borderRadius: "6px", background: "var(--accent-primary)", color: "white", border: "none", cursor: "pointer", fontSize: "12px", fontFamily: "inherit" }}>
                                <Plus size={12} /> Add Policy
                            </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {(policies as any[]).map((p: any) => (
                                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: "6px", background: "var(--bg-secondary)" }}>
                                    <div>
                                        <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{p.name}</p>
                                        <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300 }}>{p.type.toUpperCase()} · {p.daysPerYear} days / year</p>
                                    </div>
                                    <button onClick={() => deletePolicy.mutate({ id: p.id })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            ))}

                            {policies.length === 0 && !showNewPolicy && (
                                <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 300, padding: "12px 0" }}>No time off policies. Add policies to track PTO, sick leave, etc.</p>
                            )}

                            {showNewPolicy && (
                                <div style={{ padding: "12px", borderRadius: "6px", border: "1px dashed var(--border-secondary)", display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <input style={inputStyle} placeholder="Policy name (e.g. Annual PTO)" value={newPolicy.name} onChange={e => setNewPolicy(p => ({ ...p, name: e.target.value }))} />
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                        <select style={selectStyle} value={newPolicy.type} onChange={e => setNewPolicy(p => ({ ...p, type: e.target.value }))}>
                                            <option value="pto">PTO</option>
                                            <option value="sick">Sick Leave</option>
                                            <option value="personal">Personal</option>
                                            <option value="other">Other</option>
                                        </select>
                                        <input style={inputStyle} type="number" placeholder="Days per year" value={newPolicy.daysPerYear || ""} onChange={e => setNewPolicy(p => ({ ...p, daysPerYear: parseFloat(e.target.value) || 0 }))} />
                                    </div>
                                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                        <button onClick={() => setShowNewPolicy(false)} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-card)", cursor: "pointer", fontSize: "12px", fontFamily: "inherit", color: "var(--text-secondary)" }}>Cancel</button>
                                        <button
                                            onClick={() => {
                                                if (newPolicy.name.trim()) {
                                                    createPolicy.mutate(newPolicy);
                                                    setNewPolicy({ name: "", type: "pto", daysPerYear: 15 });
                                                    setShowNewPolicy(false);
                                                }
                                            }}
                                            style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", color: "white", cursor: "pointer", fontSize: "12px", fontFamily: "inherit" }}
                                        >
                                            Add Policy
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Holidays */}
                    <div style={cardStyle}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                            <p style={{ ...sectionTitle, marginBottom: 0 }}><Calendar size={16} /> Holiday Calendar</p>
                            <button onClick={() => setShowNewHoliday(true)} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px", borderRadius: "6px", background: "var(--accent-primary)", color: "white", border: "none", cursor: "pointer", fontSize: "12px", fontFamily: "inherit" }}>
                                <Plus size={12} /> Add Holiday
                            </button>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {(holidays as any[]).map((h: any) => (
                                <div key={h.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: "6px", background: "var(--bg-secondary)" }}>
                                    <div>
                                        <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)" }}>{h.name}</p>
                                        <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 300 }}>{h.date}</p>
                                    </div>
                                    <button onClick={() => deleteHoliday.mutate({ id: h.id })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}>
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            ))}

                            {holidays.length === 0 && !showNewHoliday && (
                                <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 300, padding: "12px 0" }}>No holidays configured. Add company holidays to exclude from capacity calculations.</p>
                            )}

                            {showNewHoliday && (
                                <div style={{ padding: "12px", borderRadius: "6px", border: "1px dashed var(--border-secondary)", display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <input style={inputStyle} placeholder="Holiday name (e.g. Independence Day)" value={newHoliday.name} onChange={e => setNewHoliday(p => ({ ...p, name: e.target.value }))} />
                                    <input style={inputStyle} type="date" value={newHoliday.date} onChange={e => setNewHoliday(p => ({ ...p, date: e.target.value }))} />
                                    <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                        <button onClick={() => setShowNewHoliday(false)} style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-card)", cursor: "pointer", fontSize: "12px", fontFamily: "inherit", color: "var(--text-secondary)" }}>Cancel</button>
                                        <button
                                            onClick={() => {
                                                if (newHoliday.name.trim() && newHoliday.date) {
                                                    createHoliday.mutate(newHoliday);
                                                    setNewHoliday({ name: "", date: "" });
                                                    setShowNewHoliday(false);
                                                }
                                            }}
                                            style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", color: "white", cursor: "pointer", fontSize: "12px", fontFamily: "inherit" }}
                                        >
                                            Add Holiday
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Integrations Tab ─── */}
            {tab === "integrations" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", maxWidth: "800px" }}>
                    {[
                        { name: "QuickBooks Online", desc: "Two-way accounting sync for invoices, payments, and expenses", status: "Coming Soon", color: "var(--success)" },
                        { name: "Stripe", desc: "Collect invoice payments online via credit card or ACH transfer", status: "Coming Soon", color: "#635BFF" },
                        { name: "Gmail", desc: "Smart Inbox — track project-related emails automatically", status: "Planned", color: "#EA4335" },
                        { name: "Outlook", desc: "Smart Inbox — track project-related emails automatically", status: "Planned", color: "#0078D4" },
                    ].map(int => (
                        <div key={int.name} style={{ ...cardStyle, display: "flex", flexDirection: "column", gap: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                <div>
                                    <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>{int.name}</p>
                                    <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 300, marginTop: "4px", lineHeight: 1.4 }}>{int.desc}</p>
                                </div>
                                <span style={{
                                    fontSize: "10px", fontWeight: 500, padding: "3px 8px", borderRadius: "4px",
                                    background: "var(--bg-secondary)", color: "var(--text-muted)",
                                    whiteSpace: "nowrap",
                                }}>{int.status}</span>
                            </div>
                            <button
                                disabled
                                style={{
                                    padding: "8px 16px", borderRadius: "6px",
                                    border: "1px solid var(--border-primary)",
                                    background: "var(--bg-secondary)", color: "var(--text-muted)",
                                    cursor: "not-allowed", fontSize: "12px", fontFamily: "inherit",
                                    fontWeight: 500, opacity: 0.6,
                                }}
                            >
                                Connect
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
