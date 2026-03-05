"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";

/* ─── Types ─── */
type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastItem {
    id: number;
    message: string;
    variant: ToastVariant;
    exiting?: boolean;
}

/* ─── Context ─── */
interface ToastContextValue {
    addToast: (message: string, variant?: ToastVariant) => void;
}
const ToastContext = createContext<ToastContextValue>({ addToast: () => { } });
export const useToast = () => useContext(ToastContext);

/* ─── Config ─── */
const DURATION = 4000;
const variantConfig: Record<ToastVariant, { icon: typeof CheckCircle2; color: string; bg: string }> = {
    success: { icon: CheckCircle2, color: "var(--success)", bg: "rgba(90,122,70,0.10)" },
    error: { icon: XCircle, color: "var(--danger)", bg: "rgba(176,80,64,0.10)" },
    warning: { icon: AlertTriangle, color: "var(--warning)", bg: "rgba(176,138,48,0.10)" },
    info: { icon: Info, color: "var(--info)", bg: "rgba(90,122,144,0.10)" },
};

/* ─── Provider ─── */
let _nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const addToast = useCallback((message: string, variant: ToastVariant = "success") => {
        const id = _nextId++;
        setToasts((prev) => [...prev, { id, message, variant }]);
        setTimeout(() => {
            setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 260);
        }, DURATION);
    }, []);

    const dismiss = useCallback((id: number) => {
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 260);
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            {/* Toast Container */}
            <div
                style={{
                    position: "fixed",
                    bottom: "24px",
                    right: "24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    zIndex: 9999,
                    pointerEvents: "none",
                }}
            >
                {toasts.map((toast) => {
                    const cfg = variantConfig[toast.variant];
                    const Icon = cfg.icon;
                    return (
                        <div
                            key={toast.id}
                            className={toast.exiting ? "toast-exit" : "toast-enter"}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "12px 16px",
                                borderRadius: "10px",
                                background: "var(--bg-card)",
                                border: "1px solid var(--border-secondary)",
                                boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                                pointerEvents: "auto",
                                minWidth: "280px",
                                maxWidth: "400px",
                                position: "relative",
                                overflow: "hidden",
                            }}
                        >
                            <div
                                style={{
                                    width: "28px",
                                    height: "28px",
                                    borderRadius: "6px",
                                    background: cfg.bg,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <Icon size={14} style={{ color: cfg.color }} />
                            </div>
                            <p style={{ flex: 1, fontSize: "13px", color: "var(--text-primary)", fontWeight: 400, lineHeight: 1.4 }}>
                                {toast.message}
                            </p>
                            <button
                                onClick={() => dismiss(toast.id)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    color: "var(--text-muted)",
                                    padding: "2px",
                                    flexShrink: 0,
                                }}
                            >
                                <X size={14} />
                            </button>
                            {/* Progress bar */}
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: 0,
                                    left: 0,
                                    height: "2px",
                                    background: cfg.color,
                                    animation: `progressShrink ${DURATION}ms linear forwards`,
                                    borderRadius: "0 0 0 10px",
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}
