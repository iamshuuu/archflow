import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { DM_Serif_Display } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ArchFlow — Design More. Manage Less.",
  description:
    "The modern practice management platform for architecture & engineering firms. Track projects, time, budgets, and invoices — all in one beautiful place.",
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
    title: "ArchFlow — Design More. Manage Less.",
    description:
      "The modern practice management platform for architecture & engineering firms.",
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
      <body className={`${inter.variable} ${dmSerif.variable} grain`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
