"use client";

import {
  AlertTriangle,
  ArrowRight,
  KeyRound,
  Loader2,
  Network,
  Plus,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, SectionHeading } from "./ui";

const connectors = [
  {
    name: "Shopify Orders",
    type: "OAuth",
    icon: ShoppingBag,
    iconClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    status: "Live",
    statusClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    meta: "Updated 2m ago · 4,812 calls today",
  },
  {
    name: "GitHub Issues",
    type: "MCP",
    icon: Network,
    iconClass: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    status: "In review",
    statusClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    meta: "Awaiting schema check · v2.1",
  },
  {
    name: "Notion Pages",
    type: "MCP",
    icon: KeyRound,
    iconClass: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
    status: "Setup needed",
    statusClass: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
    meta: "Complete step 2 of 4",
  },
  {
    name: "Stripe Events",
    type: "OAuth",
    icon: AlertTriangle,
    iconClass: "bg-red-500/10 text-red-600 dark:text-red-400",
    status: "Error",
    statusClass: "bg-red-500/10 text-red-600 dark:text-red-400",
    meta: "Token refresh failed · Retry",
  },
];

function StatusCard({
  connector,
}: {
  connector: (typeof connectors)[number];
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            connector.iconClass
          )}
        >
          <connector.icon className="h-5 w-5" />
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
            connector.statusClass
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {connector.status}
        </span>
      </div>
      <h3 className="mt-4 text-sm font-bold tracking-tight text-slate-900 dark:text-white">
        {connector.name}
      </h3>
      <p className="mt-0.5 text-xs font-medium text-slate-400">
        {connector.type} connector
      </p>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        {connector.meta}
      </p>
    </Card>
  );
}

function StateShowcase() {
  return (
    <div className="mt-14">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
          Designed for every state
        </p>
        <h3 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Empty, loading, error — handled
        </h3>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 p-7 text-center dark:border-white/15 dark:bg-white/[0.03]">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/10">
            <Plus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </span>
          <h4 className="mt-4 text-sm font-bold text-slate-900 dark:text-white">
            Empty state
          </h4>
          <p className="mx-auto mt-1.5 max-w-[220px] text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            No connectors yet. Create your first one &mdash; it takes 2 minutes.
          </p>
          <button className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/25">
            Create connector
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-7 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Loading state
            </h4>
          </div>
          <div className="mt-4 space-y-3">
            <div className="h-10 w-full animate-pulse rounded-xl bg-slate-200/80 dark:bg-white/10" />
            <div className="h-10 w-3/4 animate-pulse rounded-xl bg-slate-200/80 dark:bg-white/10" />
            <div className="h-10 w-1/2 animate-pulse rounded-xl bg-slate-200/80 dark:bg-white/10" />
          </div>
        </div>

        <div className="rounded-2xl border border-red-200/70 bg-red-50/60 p-7 dark:border-red-400/20 dark:bg-red-400/5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h4 className="text-sm font-bold text-red-700 dark:text-red-400">
              Error state
            </h4>
          </div>
          <p className="mt-2.5 text-xs leading-relaxed text-red-600/90 dark:text-red-300/80">
            Couldn&apos;t load your connectors. Check your connection and try again.
          </p>
          <button className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-red-600/25 transition-all hover:bg-red-500">
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

export function RecentConnectors() {
  return (
    <section id="connectors" className="py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <SectionHeading
            align="left"
            eyebrow="Workspace"
            title="Your connectors at a glance"
            description="Status, activity and health for every connector in your workspace — failures surface here first."
          />
          <a
            href="#builder"
            className="mb-12 inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:border-indigo-400 hover:text-indigo-600 dark:border-white/15 dark:text-slate-300 dark:hover:border-indigo-400/50 dark:hover:text-indigo-400"
          >
            <Plus className="h-4 w-4" />
            New connector
          </a>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {connectors.map((connector) => (
            <StatusCard key={connector.name} connector={connector} />
          ))}
        </div>

        <StateShowcase />
      </div>
    </section>
  );
}
