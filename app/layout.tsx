import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
// Font di-host sendiri (paket `geist`), jadi build tidak bergantung pada Google Fonts.
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { siteConfig } from "@/lib/config/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
  },
  twitter: { card: "summary_large_image" },
  // Nomor di teks biasa tidak otomatis diubah jadi link oleh Safari iOS (link telepon sudah eksplisit).
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#080a19" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="id"
      className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
