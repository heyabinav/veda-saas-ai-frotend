"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { Wallet as WalletIcon, Gift, Flame, ArrowDownLeft, ArrowUpRight, RefreshCw, TrendingUp, CheckCircle2, Info, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/api";

type PlanTier = "free" | "200" | "500" | "1000";

function getPlanLabel(plan?: string | null): string {
  if (plan === "1000") return "Ultra Plan";
  if (plan === "500") return "Max Plan";
  if (plan === "200") return "Pro Plan";
  return "Free Plan";
}

type Transaction = {
  id: string;
  type?: string;
  amount?: number;
  credits?: number;
  description?: string;
  reason?: string;
  label?: string;
  created_at?: string;
  timestamp?: string;
};

type StreakInfo = {
  current_streak?: number;
  streak_days?: number;
  last_claim?: string;
  next_claim_in_hours?: number;
};

type ReferralStats = {
  referral_code?: string;
  code?: string;
  total_referrals?: number;
  referral_count?: number;
  total_earned?: number;
  rewards?: number;
  reward_per_referral?: number | string;
};

export default function WalletPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [streak, setStreak] = useState<StreakInfo | null>(null);
  const [referrals, setReferrals] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rewardMsg, setRewardMsg] = useState<{ text: string; kind: "success" | "info" | "error" } | null>(null);
  const [copied, setCopied] = useState(false);
  const [plan] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const match = document.cookie.split("; ").find((c) => c.startsWith("user_plan="));
    if (!match) return null;
    try {
      return decodeURIComponent(match.slice("user_plan=".length));
    } catch {
      return match.slice("user_plan=".length);
    }
  });

  const loadAll = useCallback(async () => {
    setError(null);
    try {
      const [balanceRes, txRes, streakRes, refRes] = await Promise.all([
        apiRequest("/api/v1/wallet/balance"),
        apiRequest("/api/v1/wallet/transactions"),
        apiRequest("/api/v1/wallet/streak"),
        apiRequest("/api/v1/wallet/referrals"),
      ]);

      const balanceData = await balanceRes.json();
      const nestedBalance = balanceData?.data && typeof balanceData.data === "object" ? balanceData.data : balanceData;
      setBalance(
        nestedBalance?.balance ??
        nestedBalance?.credits ??
        nestedBalance?.total_credits ??
        null
      );

      const txData = await txRes.json();
      const nestedTx = txData?.data && Array.isArray(txData.data) ? txData.data : Array.isArray(txData) ? txData : txData?.transactions;
      setTransactions(Array.isArray(nestedTx) ? nestedTx : []);

      const streakData = await streakRes.json();
      const nestedStreak = streakData?.data && typeof streakData.data === "object" ? streakData.data : streakData;
      setStreak(nestedStreak);

      const refData = await refRes.json();
      const nestedRef = refData?.data && typeof refData.data === "object" ? refData.data : refData;
      setReferrals(nestedRef);
    } catch (err: any) {
      console.error("Wallet load failed:", err);
      if (err?.status === 401 || err?.message?.toLowerCase().includes("authentication required")) {
        router.replace(`/login?redirectTo=${encodeURIComponent("/wallet")}`);
        return;
      }
      setError(err?.message || "Failed to load wallet data.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const claimDailyReward = async () => {
    setRewardMsg(null);
    try {
      const res = await apiRequest("/api/v1/wallet/daily-reward", {
        method: "POST",
      });
      const data = await res.json();
      const nested = data?.data && typeof data.data === "object" ? data.data : data;
      const msg = nested?.message || nested?.reward || "Daily reward claimed!";
      setRewardMsg({ text: typeof msg === "string" ? msg : `+${nested?.credits ?? ""} credits earned!`, kind: "success" });
      await loadAll();
    } catch (err: any) {
      if (err?.status === 401 || err?.message?.toLowerCase().includes("authentication required")) {
        router.replace(`/login?redirectTo=${encodeURIComponent("/wallet")}`);
        return;
      }
      const alreadyClaimed = err?.message?.includes("already") || err?.message?.includes("claimed");
      setRewardMsg({
        text: alreadyClaimed ? "Daily reward already claimed today." : `Failed: ${err?.message || "could not claim today"}`,
        kind: alreadyClaimed ? "info" : "error",
      });
      if (alreadyClaimed) {
        void loadAll();
      }
    }
  };

  const alreadyClaimedToday = (() => {
    if (!streak) return false;
    if (typeof streak.next_claim_in_hours === "number" && streak.next_claim_in_hours > 0) return true;
    if (streak.last_claim) {
      const last = new Date(streak.last_claim);
      const now = new Date();
      return (
        last.getUTCFullYear() === now.getUTCFullYear() &&
        last.getUTCMonth() === now.getUTCMonth() &&
        last.getUTCDate() === now.getUTCDate()
      );
    }
    return false;
  })();

  const copyReferralCode = () => {
    const code = referrals?.referral_code || referrals?.code || "";
    if (!code) return;
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-screen w-full">
      <div className="flex h-full w-full overflow-hidden bg-white">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto bg-[#F9F9F9] p-4 sm:p-8">
          <div className="mx-auto w-full max-w-5xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground/90">Wallet & Credits</h1>
                <p className="text-sm text-foreground/50">Your credits, rewards, and referrals</p>
              </div>
              <span className="rounded-full bg-black/5 px-4 py-1.5 text-sm font-medium capitalize">{getPlanLabel(plan)}</span>
            </div>

            {error && (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                <span>{error}</span>
                <button onClick={() => void loadAll()} className="flex shrink-0 items-center gap-1.5 font-medium text-amber-700 hover:underline">
                  <RefreshCw className="h-4 w-4" /> Retry
                </button>
              </div>
            )}

            {/* Balance cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-foreground/50 mb-2">
                  <WalletIcon className="h-4 w-4" /> Total Balance
                </div>
                {loading ? (
                  <div className="h-8 w-24 animate-pulse rounded-lg bg-black/5" />
                ) : (
                  <p className="text-3xl font-bold text-foreground">{balance !== null ? balance.toLocaleString("en-US") : "—"}</p>
                )}
              </div>

              <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-foreground/50 mb-2">
                  <Flame className="h-4 w-4" /> Current Streak
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {loading ? "—" : `${streak?.current_streak ?? streak?.streak_days ?? 0} days`}
                </p>
              </div>

              <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-sm text-foreground/50 mb-2">
                  <TrendingUp className="h-4 w-4" /> Referrals
                </div>
                <p className="text-3xl font-bold text-foreground">
                  {loading ? "—" : (referrals?.total_referrals ?? referrals?.referral_count ?? 0)}
                </p>
              </div>
            </div>

            {/* Daily reward */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                  <Gift className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">Daily Reward</h2>
                  <p className="text-sm text-foreground/50">Claim free credits every day</p>
                </div>
              </div>
              <button
                onClick={() => void claimDailyReward()}
                disabled={alreadyClaimedToday || loading}
                className="rounded-xl bg-foreground px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
              >
                {alreadyClaimedToday ? "Claimed today" : "Claim"}
              </button>
              {rewardMsg && (
                <div
                  className={`flex w-full items-center gap-2.5 rounded-xl border px-4 py-3 text-sm sm:w-auto ${
                    rewardMsg.kind === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : rewardMsg.kind === "info"
                        ? "border-amber-200 bg-amber-50 text-amber-700"
                        : "border-red-200 bg-red-50 text-red-600"
                  }`}
                  role="status"
                >
                  {rewardMsg.kind === "success" ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : rewardMsg.kind === "info" ? (
                    <Info className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{rewardMsg.text}</span>
                </div>
              )}
            </div>

            {/* Referral */}
            {referrals?.referral_code || referrals?.code ? (
              <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
                <h2 className="mb-1 font-semibold text-foreground">Referral Link</h2>
                <p className="mb-3 text-sm text-foreground/50">Earn {referrals?.reward_per_referral ?? ""} credits for every friend who joins</p>
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <input
                    readOnly
                    value={`${typeof window !== "undefined" ? window.location.origin : ""}/signup?ref=${referrals.referral_code || referrals.code}`}
                    className="flex-1 rounded-xl border border-black/10 bg-[#FAFAFA] px-4 py-2.5 text-sm focus:outline-none"
                  />
                  <button
                    onClick={copyReferralCode}
                    className="shrink-0 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium hover:bg-black/5"
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            ) : null}

            {/* Transactions */}
            <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-foreground">Transactions</h2>
              {transactions.length === 0 ? (
                <p className="py-8 text-center text-sm text-foreground/40">No transactions yet.</p>
              ) : (
                <div className="divide-y divide-black/5">
                  {transactions.map((tx, i) => {
                    const isCredit = (tx.type === "credit") || (tx.type === "reward") || ((tx.credits ?? 0) > 0) || (tx.amount ?? 0) > 0;
                    const desc = tx.description || tx.reason || tx.label || "Transaction";
                    const date = tx.created_at || tx.timestamp || "";
                    return (
                      <div key={tx.id || i} className="flex items-center justify-between gap-3 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isCredit ? "bg-emerald-50" : "bg-red-50"}`}>
                            {isCredit ? (
                              <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{desc}</p>
                            {date && <p className="text-xs text-foreground/45">{new Date(date).toLocaleString()}</p>}
                          </div>
                        </div>
                        <span className={`shrink-0 text-sm font-semibold ${isCredit ? "text-emerald-600" : "text-red-500"}`}>
                          {isCredit ? "+" : "−"}{(tx.credits ?? tx.amount ?? 0).toLocaleString("en-US")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}