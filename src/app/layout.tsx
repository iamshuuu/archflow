import type { Metadata } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
    title: "ArchFlow - Design More. Manage Less.",
    description:
        "The modern practice management platform for architecture and engineering firms. Track projects, time, budgets, and invoices - all in one beautiful place.",
    keywords: [
        "architecture",
        "project management",
        "time tracking",
        "invoicing",
        "architecture firm",
        "engineering",
        "practice management",
        "AEC",
    ],
    icons: {
        icon: "/favicon.svg",
        apple: "/favicon.svg",
    },
    openGraph: {
        title: "ArchFlow - Design More. Manage Less.",
        description:
            "The modern practice management platform for architecture and engineering firms.",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className="grain"
                style={
                    {
                        "--font-inter": "Inter, system-ui, sans-serif",
                        "--font-dm-serif": "Inter, system-ui, sans-serif",
                    } as React.CSSProperties
                }
            >
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
