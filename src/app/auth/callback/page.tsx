"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Processing login...");

  function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
      const part = token.split(".")[1];
      if (!part) return null;
      const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
      const json = decodeURIComponent(
        atob(padded)
          .split("")
          .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join(""),
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  async function waitForSupabaseSession(maxMs = 7000) {
    const startedAt = Date.now();

    while (Date.now() - startedAt < maxMs) {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!error && data.session?.access_token) {
          return data.session.access_token;
        }
      } catch {
        // Ignore transient session polling failures; retry until timeout.
      }

      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    return null;
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        let token = searchParams.get("token");
        let hashParams: URLSearchParams | null = null;

        if (!token && window.location.hash) {
          const hash = window.location.hash.replace(/^#/, "");
          hashParams = new URLSearchParams(hash);
          token = hashParams.get("token") || hashParams.get("access_token");
        }

        if (!token) {
          const code = searchParams.get("code") || hashParams?.get("code");
          if (code) {
            try {
              setMessage("Finishing OAuth exchange...");
              const codeRes = await fetch(`/api/proxy/auth/callback?code=${encodeURIComponent(code)}`, {
                credentials: "same-origin",
              });
              const codeData = await codeRes.json().catch(() => null);
              token =
                codeData?.token ||
                codeData?.access_token ||
                codeData?.auth_token ||
                codeData?.data?.token ||
                codeData?.data?.access_token ||
                "";
            } catch (codeErr) {
              console.warn("Code exchange failed:", codeErr);
            }
          }
        }

        if (!token) {
          try {
            const meRes = await fetch("/api/proxy/api/v1/auth/me", {
              cache: "no-store",
              credentials: "same-origin",
            });
            if (meRes.ok) {
              const me = await meRes.json();
              const mePayload = me?.data && typeof me.data === "object" ? me.data : me;
              const user = mePayload?.user && typeof mePayload.user === "object" ? mePayload.user : mePayload;
              const userName = user?.name || user?.full_name || user?.username || user?.display_name || "";
              const userEmail = user?.email || mePayload?.email || "";
              const userId = user?.id || user?.user_id || mePayload?.user_id || "";
              const userPlan =
                user?.plan ||
                user?.user_metadata?.plan ||
                mePayload?.plan ||
                mePayload?.user_metadata?.plan ||
                "";
              const avatar = user?.avatar || user?.avatar_url || user?.picture || user?.image || "";

              const savedUser: Record<string, unknown> = {
                id: userId,
                name: userName,
                email: userEmail,
                plan: userPlan,
                avatar,
                provider: user?.provider || mePayload?.provider || "oauth",
                raw: user,
              };

              localStorage.setItem("vedaapex_user", JSON.stringify(savedUser));
              if (savedUser.id) localStorage.setItem("vedaapex_user_id", String(savedUser.id));
              if (avatar) localStorage.setItem("vedaapex-avatar", avatar);
              if (userEmail) document.cookie = `user_email=${encodeURIComponent(userEmail)}; path=/; max-age=${365 * 24 * 60 * 60}`;
              if (userName) document.cookie = `user_name=${encodeURIComponent(userName)}; path=/; max-age=${365 * 24 * 60 * 60}`;
              if (userPlan) document.cookie = `user_plan=${encodeURIComponent(userPlan)}; path=/; max-age=${365 * 24 * 60 * 60}`;

              window.dispatchEvent(new Event("vedaapex-user-updated"));
              window.dispatchEvent(new Event("vedaapex-avatar-updated"));

              if (cancelled) return;
              setMessage("Login successful. Redirecting to dashboard...");
              setTimeout(() => router.replace("/dashboard"), 400);
              return;
            }
          } catch (backendSessionErr) {
            console.warn("Backend session probe failed:", backendSessionErr);
          }

          const supabaseToken = await waitForSupabaseSession();
          if (supabaseToken) token = supabaseToken;
        }

        if (!token) {
          setMessage("The login callback completed, but no session was detected yet. Please wait a moment and try refreshing the page.");
          return;
        }

        try {
          localStorage.setItem("token", token);
          localStorage.setItem("accessToken", token);
        } catch (e) {
          console.warn("localStorage error", e);
        }

        document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
        document.cookie = "guest_session=; path=/; max-age=0";
        document.cookie = "post_login_grace=; path=/; max-age=0";

        let userName = "";
        let userEmail = "";
        let userId = "";
        let userPlan = "";
        let avatar = "";
        let provider = "oauth";
        let rawUser: unknown = null;

        try {
          const meRes = await fetch("/api/proxy/api/v1/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (meRes.ok) {
            const me = await meRes.json();
            const mePayload = me?.data && typeof me.data === "object" ? me.data : me;
            const user = mePayload?.user && typeof mePayload.user === "object" ? mePayload.user : mePayload;
            userName = user?.name || user?.full_name || user?.username || user?.display_name || "";
            userEmail = user?.email || mePayload?.email || "";
            userId = user?.id || user?.user_id || mePayload?.user_id || "";
            userPlan =
              user?.plan ||
              user?.user_metadata?.plan ||
              mePayload?.plan ||
              mePayload?.user_metadata?.plan ||
              "";
            avatar = user?.avatar || user?.avatar_url || user?.picture || user?.image || "";
            provider = user?.provider || mePayload?.provider || "oauth";
            rawUser = user;
          }
        } catch (profileError) {
          console.warn("Could not hydrate profile from callback:", profileError);
        }

        const claims = decodeJwtPayload(token);
        if (!userEmail && claims) {
          userEmail = String(claims?.email || claims?.user_email || "");
        }
        if (!userId && claims) {
          userId = String(claims?.sub || claims?.user_id || claims?.id || "");
        }
        if (!userName && claims) {
          userName = String(claims?.name || claims?.full_name || claims?.username || "");
        }
        if (!userPlan && claims) {
          userPlan = String(claims?.plan || "");
        }
        if (!userName) userName = userEmail.split("@")[0] || "User";

        if (userName) {
          document.cookie = `user_name=${encodeURIComponent(userName)}; path=/; max-age=${365 * 24 * 60 * 60}`;
        }
        if (userEmail) {
          document.cookie = `user_email=${encodeURIComponent(userEmail)}; path=/; max-age=${365 * 24 * 60 * 60}`;
        }
        if (userPlan) {
          document.cookie = `user_plan=${encodeURIComponent(userPlan)}; path=/; max-age=${365 * 24 * 60 * 60}`;
        }

        try {
          const savedUser: Record<string, unknown> = {
            id: userId,
            name: userName,
            email: userEmail,
            plan: userPlan,
            avatar,
            provider,
            raw: rawUser,
          };
          localStorage.setItem("vedaapex_user", JSON.stringify(savedUser));
          if (savedUser.id) {
            localStorage.setItem("vedaapex_user_id", String(savedUser.id));
          }
          if (avatar) {
            localStorage.setItem("vedaapex-avatar", avatar);
          }
          window.dispatchEvent(new Event("vedaapex-user-updated"));
          window.dispatchEvent(new Event("vedaapex-avatar-updated"));
        } catch (e) {
          console.warn("Could not persist user record:", e);
        }

        if (cancelled) return;
        setMessage("Login successful. Redirecting to dashboard...");
        setTimeout(() => router.replace("/dashboard"), 400);
      } catch (err) {
        if (cancelled) return;
        setMessage("There was a problem completing your login. Please try again.");
        console.error(err);
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#151613] p-6">
      <div className="max-w-xl text-center">
        <h1 className="text-xl font-medium text-[#191919] dark:text-[#E8E6E0] mb-4">{message}</h1>
      </div>
    </div>
  );
}
