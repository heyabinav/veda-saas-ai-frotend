"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, ArrowLeft, Tag, History } from "lucide-react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

type BackendPlan = {
  slug?: string;
  name?: string;
  price?: number;
  amount?: number;
  features?: string[];
  credits?: number;
  description?: string;
  popular?: boolean;
};

const fallbackPlans: BackendPlan[] = [
  {
    slug: "pro",
    name: "Pro",
    price: 200,
    amount: 20000,
    features: [
      "Apex 2.2 (Low) Model",
      "Unlimited Image Generation",
      "300 Credits/day Video Generation",
      "Unlimited Logo Generation",
      "PPT Generation",
      "Watermark Removal",
      "Image Enhancer",
      "Wedding Card Generator",
      "Excel & Word File Tools",
      "APEXCODE Access",
      "Studies Model",
    ],
  },
  {
    slug: "max",
    name: "Max",
    price: 500,
    amount: 50000,
    features: [
      "Everything in Pro",
      "Apex 2.2 (High) Model",
      "Text-to-Animation",
      "Image-to-Animation",
      "Video-to-Animation",
      "Unlimited Video Generation",
      "Thumbnail Generator",
      "Video Downloader",
      "File Converter",
    ],
  },
  {
    slug: "ultra",
    name: "Ultra",
    price: 1000,
    amount: 100000,
    features: [
      "Everything in Max",
      "ApexCode 3 (Apex 3.0) Model",
      "Home Map Generator",
      "Live Screen Share",
      "Home Design Selector",
      "Free APEXCODE CLI",
      "Home Map Generator (Coming Soon)",
    ],
  },
];

type PaymentRecord = {
  id?: string;
  order_id?: string;
  plan?: string;
  plan_slug?: string;
  amount?: number;
  status?: string;
  created_at?: string;
  timestamp?: string;
};

export default function UpgradePage() {
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [plans, setPlans] = useState<BackendPlan[]>(fallbackPlans);
  const [plansLoading, setPlansLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<{ plan?: string; slug?: string; status?: string } | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoMsg, setPromoMsg] = useState<{ text: string; kind: "success" | "error" } | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);
  const [history, setHistory] = useState<PaymentRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => setRazorpayLoaded(true);
    document.body.appendChild(script);
  }, []);

  const loadPlans = useCallback(async () => {
    try {
      const res = await apiRequest("/api/v1/subscriptions/plans");
      const data = await res.json();
      const nested = data?.data && typeof data.data === "object" ? data.data : data;
      const list = nested?.plans ?? data?.plans ?? (Array.isArray(nested) ? nested : null);
      if (Array.isArray(list) && list.length > 0) {
        setPlans(list.map((p: any) => ({
          slug: p?.slug ?? p?.id ?? p?.name?.toLowerCase(),
          name: p?.name ?? p?.title ?? "Plan",
          price: p?.price ?? p?.amount ?? 0,
          amount: Math.round((p?.price ?? p?.amount ?? 0) * 100),
          features: Array.isArray(p?.features) ? p.features : Array.isArray(p?.credits) ? p.credits : [],
          popular: p?.popular,
        })));
      }
    } catch (e) {
      console.warn("Plans fetch failed, using fallback:", e);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  const loadCurrentPlan = useCallback(async () => {
    try {
      const res = await apiRequest("/api/v1/subscriptions/current");
      const data = await res.json();
      const nested = data?.data && typeof data.data === "object" ? data.data : data;
      setCurrentPlan(nested?.plan ? { plan: nested.plan, slug: nested.slug ?? nested.plan, status: nested.status } : null);
    } catch (e) {
      setCurrentPlan(null);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const res = await apiRequest("/api/v1/payments/history");
      const data = await res.json();
      const nested = data?.data && Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : data?.payments ?? data?.items;
      setHistory(Array.isArray(nested) ? nested : []);
    } catch (e) {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
    void loadCurrentPlan();
    void loadHistory();
  }, [loadPlans, loadCurrentPlan, loadHistory]);

  const redeemPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoBusy(true);
    setPromoMsg(null);
    try {
      const res = await apiRequest("/api/v1/promo/redeem", {
        method: "POST",
        timeoutMs: 30000,
        body: JSON.stringify({ code: promoCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      const nested = data?.data && typeof data.data === "object" ? data.data : data;
      if ((res.ok || nested?.success) && !nested?.error && !nested?.message?.includes("invalid")) {
        setPromoMsg({ text: typeof nested?.message === "string" ? nested.message : nested?.credits_added ? `${nested.credits_added} credits added!` : "Promo code applied!", kind: "success" });
        setPromoCode("");
        void loadCurrentPlan();
      } else {
        setPromoMsg({ text: nested?.message ?? nested?.error ?? "Invalid promo code.", kind: "error" });
      }
    } catch (err: any) {
      setPromoMsg({ text: err?.message || "Could not redeem promo code.", kind: "error" });
    } finally {
      setPromoBusy(false);
    }
  };

  const handlePayment = async (plan: BackendPlan) => {
    setProcessing(true);
    try {
      if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
        alert("Razorpay Key ID is missing. Please add it to your .env.local file.");
        return;
      }

      if (!(window as any).Razorpay) {
        alert("Razorpay SDK not loaded.");
        return;
      }

      const planSlug = plan.slug || (plan.name ?? "Plan").toLowerCase();

      // 1) Create backend order first (plan_slug is required by the backend)
      const orderRes = await apiRequest("/api/v1/payments/orders", {
        method: "POST",
        timeoutMs: 30000,
        body: JSON.stringify({
          plan_slug: planSlug,
        }),
      });
      const orderData = await orderRes.json();
      const order = orderData?.data && typeof orderData.data === "object" ? orderData.data : orderData;
      const orderId = order?.order_id || order?.id;

      if (!orderId) {
        throw new Error(order?.message || order?.error || "Failed to create payment order");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: plan.amount,
        currency: "INR",
        name: "VedaApex",
        description: `${plan.name ?? "VedaApex"} Plan Subscription`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await apiRequest("/api/v1/payments/verify-payment", {
              method: "POST",
              timeoutMs: 30000,
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            if (verifyRes.ok) {
              const verifyData = await verifyRes.json().catch(() => ({}));
              const payload = verifyData?.data && typeof verifyData.data === "object" ? verifyData.data : verifyData;
              const userPlan = payload?.plan || (plan.name ?? "Plan").toLowerCase();
              document.cookie = `user_plan=${encodeURIComponent(userPlan)}; path=/; max-age=${365 * 24 * 60 * 60}`;
              alert(`Success! You are now on the ${plan.name ?? "VedaApex"} plan.`);
              void loadPlans();
              void loadCurrentPlan();
              void loadHistory();
              window.location.href = "/";
            } else {
              alert("Payment verified, but plan update failed.");
            }
          } catch (error) {
            console.error(error);
            alert("Error confirming payment.");
          }
        },
        prefill: { name: "User", email: "user@example.com" },
        theme: { color: "#3399cc" },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Could not start payment. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 w-fit">
          <ArrowLeft className="h-4 w-4" /> Go Back
        </Link>
        <h1 className="text-4xl font-bold text-center mb-2">Choose your plan</h1>
        {currentPlan?.plan && (
          <p className="text-center text-sm text-muted-foreground mb-12">
            Current plan: <span className="font-semibold text-foreground">{currentPlan.plan}</span>
          </p>
        )}
        {!currentPlan?.plan && <p className="text-center text-sm text-muted-foreground mb-12">You are on the Free Plan</p>}

        {/* Promo code */}
        <div className="mx-auto mb-12 flex max-w-md flex-col sm:flex-row items-center gap-2">
          <label htmlFor="promo" className="flex items-center gap-2 text-sm text-muted-foreground sr-only">
            <Tag className="h-4 w-4" /> Promo code
          </label>
          <div className="flex w-full items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2.5 shadow-sm">
            <Tag className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              id="promo"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void redeemPromo(); }}
              placeholder="Enter promo code"
              className="w-full bg-transparent text-sm focus:outline-none"
            />
            <button
              onClick={() => void redeemPromo()}
              disabled={promoBusy || !promoCode.trim()}
              className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {promoBusy ? "Applying..." : "Apply"}
            </button>
          </div>
        </div>
        {promoMsg && (
          <p className={`mx-auto mb-10 max-w-md text-center text-sm ${promoMsg.kind === "success" ? "text-emerald-600" : "text-red-500"}`}>
            {promoMsg.text}
          </p>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {plansLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-96 animate-pulse rounded-3xl border border-border bg-card/50" />
              ))
            : plans.map((plan) => (
                <div key={plan.slug ?? plan.name} className="border rounded-3xl p-8 flex flex-col hover:border-primary transition-all shadow-sm">
                  <h2 className="text-2xl font-bold mb-4">{plan.name}</h2>
                  <p className="text-4xl font-bold mb-8">
                    ₹{plan.price}
                    <span className="text-lg font-normal text-muted-foreground">/mo</span>
                  </p>
                  <ul className="space-y-4 mb-8 flex-1">
                    {(plan.features?.length ?? 0) === 0 ? (
                      <li className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary" /> {plan.description ?? "Everything you need to create"}
                      </li>
                    ) : (
                      (plan.features ?? []).map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary" /> {feature}
                        </li>
                      ))
                    )}
                  </ul>
                  <button
                    onClick={() => handlePayment(plan)}
                    disabled={processing}
                    className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-full hover:opacity-90 disabled:opacity-50"
                  >
                    {processing ? "Processing..." : "Get Started"}
                  </button>
                </div>
              ))}
        </div>

        {/* Payment history */}
        <div className="mt-14 rounded-3xl border border-border bg-card/60 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-4">
            <History className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-xl font-bold">Payment history</h2>
          </div>
          {historyLoading ? (
            <p className="py-4 text-sm text-muted-foreground animate-pulse">Loading payments...</p>
          ) : history.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">No payments yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {history.map((p, i) => (
                <div key={p.id ?? p.order_id ?? i} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">{p.plan ?? p.plan_slug ?? "Plan"}</p>
                    <p className="text-xs text-muted-foreground">{p.created_at ?? p.timestamp ?? p.order_id ?? ""}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {p.status && (
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize text-muted-foreground">
                        {p.status}
                      </span>
                    )}
                    {p.amount != null && <span className="font-semibold">₹{p.amount}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}