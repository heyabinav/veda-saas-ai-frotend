"use client";

import { Lock, RefreshCw, ScrollText, ShieldCheck } from "lucide-react";
import { Card, SectionHeading } from "./ui";

const trustItems = [
  {
    icon: Lock,
    title: "Encrypted secrets",
    description:
      "API keys and tokens are AES-256 encrypted at rest and in transit — and never written to logs. Even our own team can't read them.",
  },
  {
    icon: ShieldCheck,
    title: "Scoped permissions",
    description:
      "Grant per-endpoint, per-user access with least-privilege by default. Revoke any scope instantly, with zero disruption.",
  },
  {
    icon: RefreshCw,
    title: "Token refresh",
    description:
      "OAuth refresh tokens rotate automatically before expiry, so connectors stay live with no downtime and no manual work.",
  },
  {
    icon: ScrollText,
    title: "Audit logs",
    description:
      "Every create, configuration change and API call is recorded — who did what, when, and why. Export-ready for compliance.",
  },
];

export function Security() {
  return (
    <section
      id="security"
      className="relative overflow-hidden py-20 lg:py-24"
    >
      <div className="pointer-events-none absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 top-10 h-96 w-96 rounded-full bg-indigo-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Security & trust"
          title="Enterprise-grade security, invisible to you"
          description="We handle the hard parts of auth so you can ship connectors without becoming a security team."
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item) => (
            <Card key={item.title} className="p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600/10 to-teal-500/10">
                <item.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </span>
              <h3 className="mt-4 text-base font-bold tracking-tight text-slate-900 dark:text-white">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {item.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
