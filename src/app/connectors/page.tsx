"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import OAuthModal from "@/components/OAuthModal";
import ConnectorLogo from "@/components/ConnectorLogo";
import { Search, X, ArrowLeft, Check, Loader2, Plus, RefreshCw, Link2 } from "lucide-react";
import {
  CONNECTORS,
  loadConnections,
  saveConnections,
  type Connector,
} from "@/config/connectors";

export default function ConnectorsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [connected, setConnected] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<string[]>([]);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [oauthFor, setOauthFor] = useState<Connector | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setConnected(loadConnections());
  }, []);

  const persist = (next: Record<string, string>) => {
    setConnected(next);
    saveConnections(next);
  };

  const handleOauthSuccess = (connector: Connector) => {
    persist({
      ...connected,
      [connector.id]: new Date().toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    });
    setFailed((prev) => prev.filter((id) => id !== connector.id));
    setOauthFor(null);
  };

  const handleOauthFailed = (connector: Connector) => {
    setFailed((prev) => (prev.includes(connector.id) ? prev : [...prev, connector.id]));
    setOauthFor(null);
  };

  const handleDisconnect = (connector: Connector) => {
    if (!confirm(`Disconnect ${connector.name}?`)) return;
    const next = { ...connected };
    delete next[connector.id];
    persist(next);
    setFailed((prev) => prev.filter((id) => id !== connector.id));
  };

  const connectedCount = Object.keys(connected).length;
  const connectedConnectors = CONNECTORS.filter((c) => connected[c.id]);

  const filteredConnectors = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return CONNECTORS;
    return CONNECTORS.filter(
      (c) =>
        c.name.toLowerCase().includes(needle) ||
        c.tagline.toLowerCase().includes(needle) ||
        c.description.toLowerCase().includes(needle)
    );
  }, [search]);

  return (
    <div className="h-screen w-full">
      <div className="flex h-full w-full overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="relative flex flex-1 flex-col min-h-0 overflow-y-auto bg-[#f5f5f7] dark:bg-[#121310]">
          <div className="flex-1 w-full overflow-y-auto px-6 md:px-10 py-6 animate-in fade-in duration-300">
            <div className="mx-auto max-w-5xl">
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-foreground/60 hover:text-foreground hover:bg-black/5 transition-colors font-medium"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Link>
              </div>

              <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                    Connectors
                  </h2>
                  <p className="text-[15px] text-foreground/50 mt-1">
                    Connect and launch integrations directly inside VedaApex workspace.
                  </p>
                </div>

                <div className="relative w-full md:w-80 shrink-0">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/45" />
                  <input
                    type="text"
                    placeholder="Search connectors..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white dark:bg-black/15 border border-black/10 rounded-lg py-2.5 pl-10 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#d97757]/30 text-foreground"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/75"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {connectedConnectors.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wider text-foreground/40">
                      Connected services
                    </p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      {connectedCount} connected
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {connectedConnectors.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-3 rounded-xl border border-emerald-200 dark:border-emerald-500/25 bg-white dark:bg-[#1a1b18] px-4 py-3 shadow-sm"
                      >
                        <ConnectorLogo connector={c} size="md" />
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-sm font-semibold text-foreground">{c.name}</h4>
                          <p className="truncate text-xs text-foreground/50">
                            Connected since {connected[c.id]}
                          </p>
                        </div>
                        <span className="flex shrink-0 items-center gap-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <Check className="h-3 w-3" />
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wider text-foreground/40">
                  Available connectors
                </p>
                <p className="text-xs text-foreground/45">
                  {connectedCount} of {CONNECTORS.length} connected
                </p>
              </div>

              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 pb-10">
                {filteredConnectors.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-sm text-foreground/40 italic bg-white dark:bg-[#1a1b18] border border-black/5 rounded-xl">
                    No connectors found
                  </div>
                ) : (
                  filteredConnectors.map((c) => {
                    const isConnected = Boolean(connected[c.id]);
                    const isFailed = failed.includes(c.id);
                    const isConnecting = connecting === c.id;

                    return (
                      <div
                        key={c.id}
                        className={`flex items-center gap-4 rounded-xl border bg-white dark:bg-[#1a1b18] px-4 py-3 shadow-sm transition-all ${
                          isConnected
                            ? "border-emerald-200 dark:border-emerald-500/25"
                            : "border-black/5 hover:border-black/10"
                        }`}
                      >
                        <Link
                          href={`/connectors/${c.id}`}
                          className="group/logo shrink-0"
                          aria-label={`Open ${c.name} details`}
                        >
                          <ConnectorLogo connector={c} size="md" />
                        </Link>

                        <Link href={`/connectors/${c.id}`} className="min-w-0 flex-1">
                          <h3 className="truncate text-[15px] font-semibold text-foreground hover:underline">
                            {c.name}
                          </h3>
                          <p className="truncate text-[13px] text-foreground/50">
                            {c.tagline}
                          </p>
                        </Link>

                        <div className="shrink-0">
                          {isConnected ? (
                            <button
                              onClick={() => handleDisconnect(c)}
                              className="inline-flex items-center gap-2 rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                            >
                              <Link2 className="h-3.5 w-3.5" />
                              Disconnect
                            </button>
                          ) : isFailed ? (
                            <button
                              onClick={() => setOauthFor(c)}
                              className="inline-flex items-center gap-2 rounded-lg bg-amber-500/15 border border-amber-500/30 px-4 py-2 text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 transition-colors"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              Reload
                            </button>
                          ) : isConnecting ? (
                            <button
                              disabled
                              className="inline-flex items-center gap-2 rounded-lg bg-[#3b3b3b] dark:bg-white dark:text-black px-4 py-2 text-sm font-medium text-white opacity-70"
                            >
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Connecting
                            </button>
                          ) : (
                            <button
                              onClick={() => setOauthFor(c)}
                              className="inline-flex items-center gap-2 rounded-lg bg-[#3b3b3b] dark:bg-white dark:text-black hover:opacity-85 px-4 py-2 text-sm font-medium text-white transition-all"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Connect
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <OAuthModal
        connector={oauthFor}
        onClose={() => setOauthFor(null)}
        onSuccess={handleOauthSuccess}
        onFailed={handleOauthFailed}
      />
    </div>
  );
}
