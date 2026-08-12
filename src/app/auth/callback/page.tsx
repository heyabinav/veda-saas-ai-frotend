"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Processing...");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        console.log("OAuth callback URL:", window.location.href);
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
              const codeRes = await fetch(`/api/proxy/auth/callback?code=${encodeURIComponent(code)}`);
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
          setMessage(
            "No token found in callback URL. If the backend returned the token on its own domain, please configure the backend to redirect to your frontend's /auth/callback with ?token=...\nOr copy the token from the backend URL and paste it into the app."
          );
          return;
        }

        console.log("Found callback token", token);
        try {
          localStorage.setItem("token", token);
          localStorage.setItem("accessToken", token);
        } catch (e) {
          console.warn("localStorage error", e);
        }

        document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; max-age=${365 * 24 * 60 * 60}`;
        document.cookie = "guest_session=; path=/; max-age=0";

        try {
          const meRes = await fetch("/api/proxy/api/v1/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (meRes.ok) {
            const me = await meRes.json();
            const mePayload = me?.data && typeof me.data === "object" ? me.data : me;
            const user = mePayload?.user && typeof mePayload.user === "object" ? mePayload.user : mePayload;
            const userName =
              user?.name ||
              user?.full_name ||
              user?.username ||
              user?.display_name ||
              user?.email?.split("@")?.[0] ||
              "User";
            const userEmail = user?.email || mePayload?.email || "";
            const userId = user?.id || user?.user_id || mePayload?.user_id || "";
            const userPlan =
              user?.plan ||
              user?.user_metadata?.plan ||
              mePayload?.plan ||
              mePayload?.user_metadata?.plan ||
              "";
            const avatar = user?.avatar || user?.avatar_url || user?.picture || user?.image || "";

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
                id: user?.id || user?.user_id || mePayload?.user_id || mePayload?.id || "",
                name: userName,
                email: userEmail,
                plan: userPlan,
                avatar,
                provider: user?.provider || mePayload?.provider || "oauth",
                raw: user,
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
          }
        } catch (profileError) {
          console.warn("Could not hydrate profile from callback:", profileError);
        }

        if (cancelled) return;
        setMessage("Login successful. Redirecting to dashboard...");
        setTimeout(() => router.replace("/dashboard"), 400);
      } catch (err) {
        if (cancelled) return;
        setMessage("Error processing callback. Open console for details.");
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
        <p className="text-sm text-[#6D6C67] dark:text-[#9A9890]">
          If you see a token in the URL but automatic saving didn&apos;t happen, copy it and run the following in the console:
        </p>
        <pre className="mt-3 p-3 rounded bg-[#F5F4F0] dark:bg-[#1E201B] text-sm text-[#191919] dark:text-[#E8E6E0]">
          {"localStorage.setItem('token', 'PASTE_TOKEN_HERE');window.location.replace('/dashboard');"}
        </pre>
      </div>
    </div>
  );
}
