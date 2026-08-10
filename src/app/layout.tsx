import type { Metadata, Viewport } from "next";
import Providers from "./providers";
import GuestBanner from "@/components/GuestBanner";
import "../styles.css";

export const metadata: Metadata = {
  title: "VedaApex",
  description: "Advanced AI-powered UI Generator",
  authors: [{ name: "VedaApex" }],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  other: {
    "twitter:card": "summary",
    "twitter:site": "@VedaApex",
    "og:title": "VedaApex",
    "og:description": "Advanced AI-powered UI Generator",
    "og:type": "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="preconnect"
          href="https://bjulbxkvpsbgwwwcenrt.supabase.co"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">
        <GuestBanner />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
