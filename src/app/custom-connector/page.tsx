import type { Metadata } from "next";
import { Navbar, Footer } from "@/components/connector-landing/Chrome";
import { Hero } from "@/components/connector-landing/Hero";
import { HowItWorks } from "@/components/connector-landing/HowItWorks";
import { Security } from "@/components/connector-landing/Security";
import { BuilderPreview } from "@/components/connector-landing/BuilderPreview";
import { RecentConnectors } from "@/components/connector-landing/RecentConnectors";
import { Faq } from "@/components/connector-landing/Faq";

export const metadata: Metadata = {
  title: "Custom Connectors — VedaApex",
  description:
    "Create a custom connector for your website or app with MCP or OAuth. Secure secrets, scoped permissions, live sandbox and one-click publish.",
};

export default function CustomConnectorLanding() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased dark:bg-[#0b1220] dark:text-white">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Security />
        <BuilderPreview />
        <RecentConnectors />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}
