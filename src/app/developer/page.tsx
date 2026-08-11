"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import { Key, Plus, Trash2, RefreshCw, EyeOff, Activity, Gauge } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { Skeleton, SkeletonList } from "@/components/ui/skeleton";

type ApiKey = {
  key_id?: string;
  id?: string;
  name?: string;
  description?: string;
  prefix?: string;
  created_at?: string;
  last_used?: string;
  usages?: number;
  status?: string;
};

type Usage = {
  total_calls?: number;
  total_credits?: number;
  by_model?: Record<string, number>;
  by_day?: Record<string, number>;
};

type Limits = {
  daily_limit?: number;
  monthly_limit?: number;
  credits_used?: number;
  credits_remaining?: number;
  requests_remaining?: number;
  rate_limit_rpm?: number;
};

export default function DeveloperPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [limits, setLimits] = useState<Limits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyName, setKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const [keysRes, usageRes, limitsRes] = await Promise.all([
        apiRequest("/api/v1/api-keys/list"),
        apiRequest("/api/v1/api-keys/usage"),
        apiRequest("/api/v1/api-keys/limits"),
      ]);

      const keysData = await keysRes.json();
      const nestedKeys = keysData?.data && Array.isArray(keysData.data) ? keysData.data : Array.isArray(keysData) ? keysData : keysData?.keys;
      setKeys(Array.isArray(nestedKeys) ? nestedKeys : []);

      const usageData = await usageRes.json();
      const nestedUsage = usageData?.data && typeof usageData.data === "object" ? usageData.data : usageData;
      setUsage(nestedUsage);

      const limitsData = await limitsRes.json();
      const nestedLimits = limitsData?.data && typeof limitsData.data === "object" ? limitsData.data : limitsData;
      setLimits(nestedLimits);
    } catch (err: any) {
      console.error("Developer data load failed:", err);
      if (err?.message?.includes("401") || err?.message?.toLowerCase().includes("auth")) {
        setError("Authentication required. Please log in to manage your API keys.");
      } else {
        setError(err?.message || "Failed to load API key data.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const createKey = async () => {
    setCreating(true);
    setError(null);
    try {
      const res = await apiRequest("/api/v1/api-keys/generate", {
        method: "POST",
        body: JSON.stringify({ name: keyName.trim() || "Default Key" }),
      });
      const data = await res.json();
      const nested = data?.data && typeof data.data === "object" ? data.data : data;
      const fullKey =
        nested?.api_key ||
        nested?.key ||
        nested?.token ||
        (nested?.id && nested.prefix ? `${nested.prefix}...` : null);
      setRevealedKey(fullKey || null);
      setKeyName("");
      await loadAll();
    } catch (err: any) {
      console.error("Key generation failed:", err);
      setError(err?.message || "Failed to generate API key.");
    } finally {
      setCreating(false);
    }
  };

  const revokeKey = async (keyId: string) => {
    if (!confirm("Revoke this API key? Applications using it will immediately lose access.")) return;
    setError(null);
    try {
      await apiRequest(`/api/v1/api-keys/revoke/${keyId}`, { method: "POST" });
      await loadAll();
    } catch (err: any) {
      setError(err?.message || "Failed to revoke API key.");
    }
  };

  const copyKey = (k: string) => {
    navigator.clipboard?.writeText(k).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const idOf = (k: ApiKey) => k.id ?? k.key_id ?? "";

  return (
    <div className="h-screen w-full">
      <div className="flex h-full w-full overflow-hidden bg-white">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto bg-[#F9F9F9] p-4 sm:p-8">
          <div className="mx-auto w-full max-w-5xl space-y-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground/90">API Keys</h1>
              <p className="text-sm text-foreground/50">Manage developer keys, usage, and limits</p>
            </div>

            {error && (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                <span>{error}</span>
                <button onClick={() => void loadAll()} className="flex shrink-0 items-center gap-1.5 font-medium text-amber-700 hover:underline">
                  <RefreshCw className="h-4 w-4" /> Retry
                </button>
              </div>
            )}

            {/* Limits panel */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-busy={loading}>
              <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-foreground/50 mb-2">
                  <Activity className="h-4 w-4" /> Total Usage
                </div>
                {loading ? (
                  <Skeleton rounded="sm" className="h-9 w-24" />
                ) : (
                  <p className="text-3xl font-bold text-foreground">
                    {(usage?.total_calls ?? 0).toLocaleString("en-US")}
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-foreground/50 mb-2">
                  <Gauge className="h-4 w-4" /> Remaining Credits
                </div>
                {loading ? (
                  <Skeleton rounded="sm" className="h-9 w-28" />
                ) : (
                  <p className="text-3xl font-bold text-foreground">
                    {(limits?.credits_used !== undefined || limits?.requests_remaining !== undefined ? (limits?.requests_remaining ?? limits?.credits_used ?? 0) : (limits?.daily_limit ?? 0)).toLocaleString("en-US")}
                  </p>
                )}
              </div>
              <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-foreground/50 mb-2">
                  <Gauge className="h-4 w-4" /> Daily Limit
                </div>
                {loading ? (
                  <Skeleton rounded="sm" className="h-9 w-20" />
                ) : (
                  <p className="text-3xl font-bold text-foreground">
                    {(limits?.daily_limit ?? 0).toLocaleString("en-US")}
                  </p>
                )}
              </div>
            </div>

            {/* Create key */}
            <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <h2 className="mb-3 font-semibold text-foreground">Create a new API key</h2>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="Key name (e.g. Production)"
                  className="flex-1 rounded-xl border border-black/10 bg-[#FAFAFA] px-4 py-2.5 text-sm focus:outline-none"
                />
                <button
                  onClick={() => void createKey()}
                  disabled={creating}
                  className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" /> {creating ? "Creating..." : "Generate Key"}
                </button>
              </div>

              {revealedKey && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-medium text-emerald-700 mb-1">Your new API key (copy now, it won&apos;t be shown again):</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 overflow-x-auto whitespace-nowrap text-sm text-emerald-800">{revealedKey}</code>
                    <button onClick={() => copyKey(revealedKey)} className="shrink-0 rounded-lg border border-emerald-300 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100">
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <button onClick={() => setRevealedKey(null)} className="shrink-0 rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-100">
                      <EyeOff className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Keys list */}
            <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm" aria-busy={loading}>
              <h2 className="mb-4 font-semibold text-foreground">Your API keys</h2>
              {loading ? (
                <SkeletonList count={3} className="py-2" trailing={false} />
              ) : keys.length === 0 ? (
                <p className="py-8 text-center text-sm text-foreground/40">No API keys yet. Generate one above.</p>
              ) : (
                <div className="divide-y divide-black/5">
                  {keys.map((k) => (
                    <div key={idOf(k)} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-50">
                          <Key className="h-4 w-4 text-indigo-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{k.name || k.description || `Key ${idOf(k).slice(0, 8)}`}</p>
                          <p className="text-xs text-foreground/45">
                            {k.prefix ? `${k.prefix}•••••` : idOf(k).slice(0, 12) + "..."} {k.usages !== undefined ? `· ${k.usages} calls` : ""}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => idOf(k) && revokeKey(idOf(k))}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-100 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Revoke
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}