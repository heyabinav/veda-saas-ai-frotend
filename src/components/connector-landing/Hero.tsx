"use client";

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  KeyRound,
  Lock,
  Network,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Badge, GradientText } from "./ui";

const configLines = [
  { key: "name", value: "shopify-orders", muted: false },
  { key: "type", value: "OAuth 2.0", muted: false },
  { key: "base_url", value: "https://api.shopify.com/v1", muted: true },
  { key: "scopes", value: '["orders:read", "customers:read"]', muted: true },
  { key: "auth", value: "PKCE + refresh", muted: true },
  { key: "status", value: "connected", muted: false, accent: true },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-indigo-50 via-white to-white dark:from-indigo-950/40 dark:via-[#0b1220] dark:to-[#0b1220]" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-400/25 via-blue-400/20 to-teal-400/25 blur-3xl dark:from-indigo-600/20 dark:via-blue-600/15 dark:to-teal-500/20" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-28">
        <div>
          <Badge>
            <Sparkles className="h-3.5 w-3.5" />
            New — bring your own API in minutes
          </Badge>

          <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white">
            Your API, connected to{" "}
            <GradientText>AI agents</GradientText> in minutes.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            Create a custom connector for your website or app, then let AI
            agents use it safely. Pick <strong className="font-semibold text-slate-800 dark:text-slate-200">MCP</strong>{" "}
            for tool-style access or{" "}
            <strong className="font-semibold text-slate-800 dark:text-slate-200">OAuth</strong> for
            user-approved sign-in &mdash; no code required, full control when
            you need it.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#builder"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 bg-[length:200%_100%] px-6 py-3.5 text-base font-semibold text-white shadow-xl shadow-indigo-600/30 transition-all duration-300 hover:bg-right hover:shadow-indigo-600/50"
            >
              Create Custom Connector
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            >
              <BookOpen className="h-5 w-5" />
              View Docs
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-teal-500" />
              Free during beta
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-teal-500" />
              No credit card required
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-teal-500" />
              Publish in under 5 minutes
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute -inset-6 rounded-3xl bg-gradient-to-br from-indigo-500/15 via-transparent to-teal-500/15 blur-2xl" />

          <div className="relative rounded-2xl border border-slate-200/80 bg-white/90 p-2 shadow-2xl shadow-indigo-950/10 backdrop-blur dark:border-white/10 dark:bg-[#101a2e]/90">
            <div className="flex items-center gap-1.5 px-3 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <span className="ml-3 rounded-md bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-white/10 dark:text-slate-400">
                connector.shopify.json
              </span>
            </div>

            <div className="rounded-xl bg-slate-950 p-5 font-mono text-[13px] leading-7 dark:bg-black/40">
              {configLines.map((line) => (
                <div key={line.key} className="flex gap-3">
                  <span className="select-none text-slate-600">{"{"}</span>
                  <span className={line.muted ? "text-slate-500" : "text-sky-300"}>
                    &quot;{line.key}&quot;
                  </span>
                  <span className="text-slate-500">:</span>
                  <span
                    className={
                      line.accent
                        ? "text-emerald-400"
                        : line.muted
                          ? "text-slate-400"
                          : "text-amber-300"
                    }
                  >
                    {line.value}
                  </span>
                </div>
              ))}
              <div className="mt-2 flex gap-3">
                <span className="select-none text-slate-600">{"}"}</span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Connected · 24ms
                </span>
              </div>
            </div>
          </div>

          <div className="absolute -left-4 top-16 hidden rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-lg dark:border-white/10 dark:bg-[#101a2e] sm:flex sm:items-center sm:gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/10">
              <Network className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </span>
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">MCP ready</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Tool schema auto-generated</p>
            </div>
          </div>

          <div className="absolute -right-3 bottom-16 hidden rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 shadow-lg sm:flex sm:items-center sm:gap-2.5 dark:border-white/10 dark:bg-[#101a2e]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600/10">
              <Lock className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            </span>
            <div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white">Secrets encrypted</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">AES-256 at rest</p>
            </div>
          </div>

          <div className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-2 shadow-lg dark:border-white/10 dark:bg-[#101a2e]">
            <ShieldCheck className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <KeyRound className="h-4 w-4 text-teal-600 dark:text-teal-400" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              OAuth 2.0 + MCP · PKCE · Scoped permissions
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
