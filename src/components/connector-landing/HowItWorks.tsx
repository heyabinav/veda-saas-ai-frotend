"use client";

import { FilePlus2, KeyRound, Rocket, Settings2 } from "lucide-react";
import { SectionHeading } from "./ui";

const steps = [
  {
    icon: FilePlus2,
    step: "Step 1",
    title: "Create",
    description:
      "Name your connector and paste your app's base URL. We generate a starter config for you instantly.",
  },
  {
    icon: Settings2,
    step: "Step 2",
    title: "Configure",
    description:
      "Choose MCP or OAuth, map your endpoints, and define permissions in plain English — no YAML wrestling.",
  },
  {
    icon: KeyRound,
    step: "Step 3",
    title: "Authenticate",
    description:
      "Connect your account with a one-click OAuth flow, or a secure MCP handshake for agent access.",
  },
  {
    icon: Rocket,
    step: "Step 4",
    title: "Test & publish",
    description:
      "Make live calls in the sandbox, watch them succeed, then hit publish. Your connector goes live for your team.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative bg-white py-20 lg:py-24 dark:bg-[#0d1526]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="From zero to live in four steps"
          description="Built so a product manager can do it, with enough control for a staff engineer."
        />

        <div className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          <div className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent lg:block" />

          {steps.map((step, index) => (
            <div key={step.title} className="relative text-center lg:text-left">
              <div className="relative mx-auto flex h-14 w-14 items-center justify-center lg:mx-0">
                <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-600 to-teal-500 opacity-10" />
                <span className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#101a2e]">
                  <step.icon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </span>
                <span className="absolute -right-2.5 -top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 text-[11px] font-bold text-white shadow-md shadow-indigo-600/30">
                  {index + 1}
                </span>
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                {step.step}
              </p>
              <h3 className="mt-1.5 text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {step.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
