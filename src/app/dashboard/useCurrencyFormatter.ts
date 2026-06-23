"use client";

import { useMemo } from "react";
import { trpc } from "@/app/providers";

const FALLBACK_LOCALE = "en-US";
const FALLBACK_CURRENCY = "USD";

type CurrencyFormatOverrides = Omit<Intl.NumberFormatOptions, "style" | "currency">;

export function useCurrencyFormatter() {
    const { data: orgSettings } = trpc.settings.get.useQuery();

    const locale = orgSettings?.locale || FALLBACK_LOCALE;
    const currency = orgSettings?.currency || FALLBACK_CURRENCY;

    const formatCurrency = useMemo(() => {
        return (value: number, overrides?: CurrencyFormatOverrides) => {
            const safeValue = Number.isFinite(value) ? value : 0;
            try {
                return new Intl.NumberFormat(locale, {
                    style: "currency",
                    currency,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                    ...overrides,
                }).format(safeValue);
            } catch {
                return new Intl.NumberFormat(FALLBACK_LOCALE, {
                    style: "currency",
                    currency: FALLBACK_CURRENCY,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                    ...overrides,
                }).format(safeValue);
            }
        };
    }, [currency, locale]);

    const formatCompactCurrency = useMemo(() => {
        return (value: number) => formatCurrency(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }, [formatCurrency]);

    return { locale, currency, formatCurrency, formatCompactCurrency };
}
