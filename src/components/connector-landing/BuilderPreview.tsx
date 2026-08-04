"use client";

import { useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  FilePlus2,
  KeyRound,
  Play,
  Rocket,
  Settings2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./ui";

const steps = [
  { id: 0, label: "Create", icon: FilePlus2 },
  { id: 1, label: "Configure", icon: Settings2 },
  { id: 2, label: "Authenticate", icon: KeyRound },
  { id: 3, label: "Test", icon: Play },
  { id: 4, label: "Publish", icon: Rocket },
] as const;

const scopes = [
  { id: "orders:read", label: "Read orders", checked: true },
  { id: "orders:write", label: "Create & edit orders", checked: true },
  { id: "customers:read", label: "Read customers", checked: false },
];

function StepBody({
  step,
  published,
  onPublish,
}: {
  step: number;
  published: boolean;
  onPublish: () => void;
}) {
  switch (step) {
    case 0:
      return (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Connector name
            </label>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 dark:border-white/15 dark:bg-black/30 dark:text-slate-200">
              shopify-orders
              <span className="ml-auto rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                ✓ available
              </span>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Base URL
            </label>
            <div className="mt-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-[13px] text-slate-700 dark:border-white/15 dark:bg-black/30 dark:text-slate-300">
              https://api.shopify.com/v1
            </div>
          </div>
          <p className="rounded-xl bg-indigo-50 px-3.5 py-2.5 text-[13px] leading-relaxed text-indigo-700 dark:bg-indigo-400/10 dark:text-indigo-300">
            <Sparkles className="mr-1.5 inline h-3.5 w-3.5" />
            A starter config was generated — 9 of 14 fields pre-filled.
          </p>
        </div>
      );
    case 1:
      return (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Connection method
            </p>
            <div className="mt-1.5 grid grid-cols-2 gap-2.5">
              {["OAuth 2.0", "MCP"].map((method, i) => (
                <div
                  key={method}
                  className={cn(
                    "rounded-xl border px-3.5 py-2.5 text-sm font-semibold",
                    i === 0
                      ? "border-indigo-500 bg-indigo-50/70 text-indigo-700 dark:border-indigo-400/50 dark:bg-indigo-400/10 dark:text-indigo-300"
                      : "border-slate-300 text-slate-500 dark:border-white/15 dark:text-slate-400"
                  )}
                >
                  {method}
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Scoped permissions
            </p>
            <div className="mt-1.5 space-y-2">
              {scopes.map((scope) => (
                <div
                  key={scope.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-2.5 dark:border-white/10"
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-md border",
                      scope.checked
                        ? "border-indigo-500 bg-indigo-600 text-white"
                        : "border-slate-300 dark:border-white/20"
                    )}
                  >
                    {scope.checked && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="font-mono text-[13px] text-slate-700 dark:text-slate-300">
                    {scope.id}
                  </span>
                  <span className="ml-auto text-xs text-slate-400">
                    {scope.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    case 2:
      return (
        <div className="space-y-3">
          {[
            { title: "OAuth handshake", desc: "Redirect to shopify.com consent", state: "done" as const },
            { title: "Consent approved", desc: "orders:read, orders:write granted", state: "done" as const },
            { title: "Token exchange", desc: "PKCE verified · refresh token stored", state: "active" as const },
          ].map((row) => (
            <div
              key={row.title}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3.5 py-3",
                row.state === "active"
                  ? "border-indigo-400/50 bg-indigo-50/70 dark:border-indigo-400/40 dark:bg-indigo-400/10"
                  : "border-slate-200 dark:border-white/10"
              )}
            >
              {row.state === "done" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
              ) : (
                <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              )}
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {row.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{row.desc}</p>
              </div>
            </div>
          ))}
        </div>
      );
    case 3:
      return (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Request · GET /orders?limit=5
            </p>
            <pre className="mt-2 overflow-x-auto font-mono text-[12.5px] leading-6 text-slate-600 dark:text-slate-300">
{`{
  "headers": { "Authorization": "Bearer ···" },
  "params":  { "limit": 5 }
}`}
            </pre>
          </div>
          <div className="rounded-xl border border-emerald-400/40 bg-emerald-500/5 p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Response · 200 OK · 184ms
            </p>
            <pre className="mt-2 overflow-x-auto font-mono text-[12.5px] leading-6 text-slate-600 dark:text-slate-300">
{`{ "orders": [{ "id": "ord_1024", "total": 129.9 }] }`}
            </pre>
          </div>
        </div>
      );
    default:
      return published ? (
        <div className="flex flex-col items-center rounded-2xl border border-emerald-400/40 bg-emerald-500/5 px-6 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
            <Rocket className="h-7 w-7 text-emerald-500" />
          </span>
          <p className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
            shopify-orders is live!
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Your team can now use it in any AI agent.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {[
            { label: "Config valid", ok: true },
            { label: "Auth flow tested", ok: true },
            { label: "Sandbox: 4/4 calls passed", ok: true },
            { label: "Team access scoped to Engineering", ok: true },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 dark:border-white/10"
            >
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {item.label}
              </span>
            </div>
          ))}
          <button
            onClick={onPublish}
            className="mt-1 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition-all hover:shadow-indigo-600/50"
          >
            Publish connector
          </button>
        </div>
      );
  }
}

export function BuilderPreview() {
  const [activeStep, setActiveStep] = useState(0);
  const [published, setPublished] = useState(false);

  return (
    <section
      id="builder"
      className="relative overflow-hidden bg-white py-20 lg:py-24 dark:bg-[#0d1526]"
    >
      <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-indigo-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Live builder"
          title="Watch a connector come together"
          description="This is the real flow you'll go through — create, configure, authenticate, test, publish. Try the steps."
        />

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-1.5">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all",
                  activeStep === step.id
                    ? "border-indigo-500/60 bg-indigo-50/80 text-indigo-700 shadow-sm dark:border-indigo-400/40 dark:bg-indigo-400/10 dark:text-indigo-300"
                    : "border-transparent text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5"
                )}
              >
                <step.icon
                  className={cn(
                    "h-4.5 w-4.5",
                    activeStep === step.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
                  )}
                />
                {step.label}
                <ChevronRight
                  className={cn(
                    "ml-auto h-4 w-4 transition-all",
                    activeStep === step.id && "translate-x-0.5 text-indigo-500"
                  )}
                />
              </button>
            ))}
            <p className="px-4 pt-3 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
              Tip: every step can be re-run after publishing — config changes
              are live in seconds, never breaking existing sessions.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-[#f8fafc] p-5 shadow-lg shadow-slate-900/5 sm:p-7 dark:border-white/10 dark:bg-black/30">
            <StepBody
              step={activeStep}
              published={published}
              onPublish={() => setPublished(true)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
