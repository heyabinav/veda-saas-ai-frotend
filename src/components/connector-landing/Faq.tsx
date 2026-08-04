"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./ui";

const faqs = [
  {
    q: "Do I need to write any code?",
    a: "No. Point the builder at your base URL, pick MCP or OAuth, and we generate everything — tool schemas, auth flows and configs. If you do want full control, every connector is just a JSON config you can edit and commit to git.",
  },
  {
    q: "What's the difference between MCP and OAuth?",
    a: "MCP is how AI agents call your API as a tool (like a plugin for AI). OAuth is how a user securely grants your app access to their account — the same flow behind 'Sign in with Google'. Many connectors use both: OAuth to log in, MCP to expose the API.",
  },
  {
    q: "Where are my API keys stored?",
    a: "In a hardware-backed key vault, encrypted with AES-256. Keys are never written to logs, never exposed to clients, and even VedaApex staff can't decrypt them. You can rotate or revoke any secret in one click.",
  },
  {
    q: "Can I revoke a user's access?",
    a: "Anytime, instantly. Kill a single session, a scope, or the whole connector — existing tokens are invalidated immediately and the change is written to the audit log.",
  },
  {
    q: "How long does publishing take?",
    a: "Most connectors pass validation in seconds and are live immediately for your workspace. Team-wide review and public listing take a few business days, with human review for safety.",
  },
  {
    q: "What happens when my API changes?",
    a: "Our schema checker detects drift and flags affected tools before agents break. Update endpoints in the builder and the new version is live in seconds — old sessions keep working via graceful fallback.",
  },
];

export function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="bg-white py-20 lg:py-24 dark:bg-[#0d1526]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="FAQ"
          title="Questions, answered"
          description="The things builders ask us most — if yours isn't here, ask in the docs."
        />

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = open === index;
            return (
              <div
                key={faq.q}
                className={cn(
                  "overflow-hidden rounded-2xl border transition-colors",
                  isOpen
                    ? "border-indigo-300/70 bg-indigo-50/40 dark:border-indigo-400/30 dark:bg-indigo-400/5"
                    : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/5"
                )}
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left"
                >
                  <span className="flex-1 text-[15px] font-semibold text-slate-900 dark:text-white">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 shrink-0 text-slate-400 transition-transform duration-300",
                      isOpen && "rotate-180 text-indigo-500"
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "grid transition-all duration-300 ease-in-out",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
