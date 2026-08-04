"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Processing...");

  useEffect(() => {
    try {
      console.log("OAuth callback URL:", window.location.href);
      // Try query param first: /auth/callback?token=xxxxx
      const searchParams = new URLSearchParams(window.location.search);
      let token = searchParams.get("token");

      // If not present, check URL hash: /auth/callback#token=xxxxx or #access_token=xxxxx
      if (!token && window.location.hash) {
        const hash = window.location.hash.replace(/^#/, "");
        const hashParams = new URLSearchParams(hash);
        token = hashParams.get("token") || hashParams.get("access_token");
      }

      if (token) {
        console.log("Found callback token", token);
        try {
          localStorage.setItem("token", token);
          localStorage.setItem("accessToken", token);
        } catch (e) {
          console.warn("localStorage error", e);
        }

        // Persist login — 1 year session + saved token cookie
        const graceExpiry = Date.now() + 365 * 24 * 60 * 60 * 1000;
        document.cookie = `post_login_grace=${graceExpiry}; path=/; max-age=${365 * 24 * 60 * 60}`;
        document.cookie = `auth_token=${encodeURIComponent(token)}; path=/; max-age=${365 * 24 * 60 * 60}`;
        document.cookie = "guest_session=; path=/; max-age=0";

        setMessage("Login successful. Redirecting to dashboard...");
        setTimeout(() => router.replace("/dashboard"), 400);
        return;
      }

      // If no token and this page is served from the backend domain, attempt to forward tokenless request
      setMessage("No token found in callback URL. If the backend returned the token on its own domain, please configure the backend to redirect to your frontend's /auth/callback with ?token=...\nOr copy the token from the backend URL and paste it into the app.");
    } catch (err) {
      setMessage("Error processing callback. Open console for details.");
      console.error(err);
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#151613] p-6">
      <div className="max-w-xl text-center">
        <h1 className="text-xl font-medium text-[#191919] dark:text-[#E8E6E0] mb-4">{message}</h1>
        <p className="text-sm text-[#6D6C67] dark:text-[#9A9890]">If you see a token in the URL but automatic saving didn&apos;t happen, copy it and run the following in the console:</p>
        <pre className="mt-3 p-3 rounded bg-[#F5F4F0] dark:bg-[#1E201B] text-sm text-[#191919] dark:text-[#E8E6E0]">{"localStorage.setItem('token', 'PASTE_TOKEN_HERE');window.location.replace('/dashboard');"}</pre>
      </div>
    </div>
  );
}
