import type { Metadata, Viewport } from "next";
import Providers from "./providers";
import "../styles.css";

export const metadata: Metadata = {
  title: "VedaApex",
  description: "Advanced AI-powered UI Generator",
  authors: [{ name: "VedaApex" }],
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
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
