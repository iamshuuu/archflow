// Shared styles for invoice components
export const labelStyle: React.CSSProperties = { fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "6px", display: "block" };
export const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", borderRadius: "6px", border: "1px solid var(--border-primary)", background: "var(--bg-card)", fontSize: "13px", color: "var(--text-primary)", outline: "none" };
export const selectStyle: React.CSSProperties = { ...inputStyle, cursor: "pointer" };
export const cardStyle: React.CSSProperties = { padding: "18px", borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)" };
export const tableWrapStyle: React.CSSProperties = { borderRadius: "10px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "var(--shadow-card)", overflow: "hidden" };
export const thStyle: React.CSSProperties = { padding: "10px 14px", textAlign: "left" as const, fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" };
export const tdStyle: React.CSSProperties = { padding: "12px 14px", fontSize: "12px", color: "var(--text-primary)" };
export const modalOverlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" };
export const modalBox: React.CSSProperties = { width: "520px", maxHeight: "80vh", overflow: "auto", padding: "28px", borderRadius: "12px", background: "var(--bg-card)", border: "1px solid var(--border-primary)", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" };
export const btnPrimary: React.CSSProperties = { padding: "10px 18px", borderRadius: "6px", border: "none", background: "var(--accent-primary)", cursor: "pointer", fontSize: "12px", color: "white", fontWeight: 500 };
export const btnSecondary: React.CSSProperties = { padding: "10px 18px", borderRadius: "6px", border: "1px solid var(--border-secondary)", background: "var(--bg-card)", cursor: "pointer", fontSize: "12px", color: "var(--text-secondary)" };
export const emptyTd = (cols: number): React.CSSProperties => ({ padding: "40px", textAlign: "center", fontSize: "13px", color: "var(--text-muted)", fontWeight: 300 });
export const formatCurrency = (v: number) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const badgeStyle = (color: string, bg: string): React.CSSProperties => ({ fontSize: "9px", fontWeight: 600, padding: "3px 8px", borderRadius: "3px", textTransform: "uppercase", letterSpacing: "0.04em", color, background: bg, display: "inline-flex", alignItems: "center", gap: "4px" });
