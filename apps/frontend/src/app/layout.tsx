import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import { WebMcpProvider } from "./webmcp-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://arcpay.app";
const description =
  "ArcPay is a private, policy-controlled treasury OS for AI agents on Mantle: register agents, escrow work, enforce limits, issue USDY cards, create privacy intents, and export audits.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "ArcPay",
  title: {
    default: "ArcPay - Private Treasury OS for AI Agents on Mantle",
    template: "%s | ArcPay",
  },
  description,
  keywords: [
    "ArcPay",
    "Mantle treasury",
    "AI agent payments",
    "stablecoin payments",
    "private payments",
    "x402",
    "Mantle dashboard",
    "policy controlled wallet",
    "Mantle",
    "USDY",
    "agentic L1",
    "QVAC",
  ],
  authors: [{ name: "Henry Sam Marfo", url: "mailto:jasonneil4040@gmail.com" }],
  creator: "ArcPay",
  publisher: "ArcPay",
  category: "finance",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
    shortcut: ["/favicon.svg"],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "ArcPay",
    title: "ArcPay - Private Treasury OS for AI Agents on Mantle",
    description,
    images: [
      {
        url: "/arcpay-og.svg",
        width: 1200,
        height: 630,
        alt: "ArcPay private treasury OS for AI agents on Mantle",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    creator: "@henrysammarfo",
    title: "ArcPay - Private Treasury OS for AI Agents on Mantle",
    description,
    images: ["/arcpay-og.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#f59e0b",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: {
  readonly children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WebMcpProvider />
        <Providers>{children}</Providers>
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}
