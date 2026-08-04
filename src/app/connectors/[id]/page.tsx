"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import OAuthModal from "@/components/OAuthModal";
import ConnectorLogo from "@/components/ConnectorLogo";
import {
  ArrowLeft,
  Check,
  Loader2,
  Plus,
  RefreshCw,
  ExternalLink,
  Link2,
  Globe,
} from "lucide-react";
import {
  CONNECTORS,
  getConnectorById,
  loadConnections,
  saveConnections,
  type Connector,
} from "@/config/connectors";

export default function ConnectorDetailPage() {
  const params = useParams<{ id: string }>();
  const connector = getConnectorById(params.id);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [connected, setConnected] = useState<Record<string, string>>({});
  const [failed, setFailed] = useState<string[]>([]);
  const [oauthFor, setOauthFor] = useState<Connector | null>(null);

  useEffect(() => {
    setConnected(loadConnections());
  }, []);

  if (!connector) {
    return (
      <div className="h-screen w-full">
        <div className="flex h-full w-full overflow-hidden">
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          <main className="flex flex-1 items-center justify-center bg-[#f5f5f7] dark:bg-[#121310]">
            <div className="text-center">
              <p className="text-sm text-foreground/50">Connector not found.</p>
              <Link
                href="/connectors"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#3b3b3b] dark:bg-white dark:text-black px-5 py-2.5 text-sm font-medium text-white hover:opacity-85 transition-opacity"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Connectors
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const isConnected = Boolean(connected[connector.id]);
  const isFailed = failed.includes(connector.id);

  const handleOauthSuccess = (c: Connector) => {
    const next = {
      ...connected,
      [c.id]: new Date().toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    };
    setConnected(next);
    saveConnections(next);
    setFailed((prev) => prev.filter((id) => id !== c.id));
    setOauthFor(null);
  };

  const handleOauthFailed = (c: Connector) => {
    setFailed((prev) => (prev.includes(c.id) ? prev : [...prev, c.id]));
    setOauthFor(null);
  };

  const handleDisconnect = () => {
    if (!confirm(`Disconnect ${connector.name}?`)) return;
    const next = { ...connected };
    delete next[connector.id];
    setConnected(next);
    saveConnections(next);
  };

  return (
    <div className="h-screen w-full">
      <div className="flex h-full w-full overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="relative flex flex-1 flex-col min-h-0 overflow-y-auto bg-[#f5f5f7] dark:bg-[#121310]">
          <div className="flex-1 w-full overflow-y-auto px-6 md:px-12 py-8 animate-in fade-in duration-300">
            <div className="mx-auto max-w-3xl pb-10">
              <Link
                href="/connectors"
                className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-foreground/60 hover:text-foreground hover:bg-black/5 transition-colors font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Connectors
              </Link>

              <div className="mt-6 rounded-2xl border border-black/5 bg-white dark:bg-[#1a1b18] p-7 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                  <ConnectorLogo connector={connector} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold tracking-tight text-foreground">
                        {connector.name}
                      </h2>
                      {isConnected && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 dark:bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <Check className="h-3 w-3" />
                          Connected
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-foreground/50">{connector.tagline}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-foreground/45">
                      <span className="inline-flex items-center gap-1 rounded-md border border-black/5 bg-[#fafafa] dark:bg-black/10 px-2 py-0.5">
                        {connector.category}
                      </span>
                      <a
                        href={connector.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        <Globe className="h-3 w-3" />
                        {connector.url.replace("https://", "")}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isConnected ? (
                      <button
                        onClick={handleDisconnect}
                        className="inline-flex items-center gap-2 rounded-lg border border-black/10 px-5 py-2.5 text-sm font-medium text-foreground/70 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                      >
                        <Link2 className="h-4 w-4" />
                        Disconnect
                      </button>
                    ) : isFailed ? (
                      <button
                        onClick={() => setOauthFor(connector)}
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-500/15 border border-amber-500/30 px-5 py-2.5 text-sm font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-500/25 transition-colors"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Reload OAuth
                      </button>
                    ) : (
                      <button
                        onClick={() => setOauthFor(connector)}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#3b3b3b] dark:bg-white dark:text-black hover:opacity-85 px-5 py-2.5 text-sm font-semibold text-white transition-all"
                      >
                        <Plus className="h-4 w-4" />
                        Connect
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-6 border-t border-black/5 pt-6">
                  <h3 className="text-sm font-semibold text-foreground">About {connector.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-foreground/60">
                    {connector.description}
                  </p>
                </div>

                <div className="mt-6 border-t border-black/5 pt-6">
                  <h3 className="text-sm font-semibold text-foreground">What you get</h3>
                  <ul className="mt-3 space-y-2.5">
                    {connector.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground/70">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-500/15">
                          <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {isConnected && (
                  <div className="mt-6 border-t border-black/5 pt-6">
                    <p className="text-sm text-foreground/60">
                      <span className="font-semibold text-foreground">{connector.name}</span> is
                      connected to your VedaApex workspace since{" "}
                      <span className="font-semibold text-foreground">{connected[connector.id]}</span>.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <p className="text-xs font-medium uppercase tracking-wider text-foreground/40 mb-3">
                  Other connectors
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {CONNECTORS.filter((c) => c.id !== connector.id).map((c) => (
                    <Link
                      key={c.id}
                      href={`/connectors/${c.id}`}
                      className="flex items-center gap-2.5 rounded-xl border border-black/5 bg-white dark:bg-[#1a1b18] px-3.5 py-2 shadow-sm hover:border-black/10 hover:shadow-md transition-all"
                    >
                      <ConnectorLogo connector={c} size="sm" />
                      <span className="text-[13px] font-medium text-foreground/75">{c.name}</span>
                      {connected[c.id] && (
                        <Check className="h-3 w-3 text-emerald-500" />
                      )}
                    </Link>
                  ))}
                </div>
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
