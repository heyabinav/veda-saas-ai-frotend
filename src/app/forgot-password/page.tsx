"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, ArrowLeft, Sparkles, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/proxy/api/v1/email/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setLoading(false);
        setSent(true);
        return;
      }

      // Fallback to Supabase password reset if backend endpoint isn't available
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/reset-password`,
      });
      setLoading(false);
      if (error) return setError(error.message || data?.detail || "An error occurred. Please try again.");
      setSent(true);
    } catch (err) {
      setLoading(false);
      setError("An error occurred. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#151613] px-4 py-12 flex items-center justify-center">
      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Back button */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </Link>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 p-8 backdrop-blur-sm">
          {!sent ? (
            <>
              {/* Logo + Brand */}
              <div className="flex flex-col items-center mb-7">
                <div className="w-16 h-16 rounded-2xl bg-[#F5F4F0] dark:bg-[#1E201B] border border-[#E3E0D8] dark:border-[#2E302A] flex items-center justify-center mb-3 shadow-sm">
                  <img
                    src="/logo.svg"
                    alt="VedaApex Logo"
                    className="w-10 h-10 object-contain"
                    style={{ filter: "drop-shadow(0 2px 6px rgba(48,106,72,0.18))" }}
                  />
                </div>
                <span className="font-serif text-xl font-bold tracking-wide text-[#191919] dark:text-[#E8E6E0]">
                  VedaApex
                </span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                Forgot Password?
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-8 leading-relaxed">
                No worries! Enter your email and we&apos;ll send you a secure link to reset your password.
              </p>

              <form onSubmit={handleReset} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#6D6C67] dark:text-[#9A9890] mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 border border-[#E3E0D8] dark:border-[#2E302A] rounded-xl bg-white dark:bg-[#1E201B] text-[#191919] dark:text-[#E8E6E0] placeholder-[#A3A29C] dark:placeholder-[#605F5A] focus:outline-none focus:ring-2 focus:ring-[#306a48] dark:focus:ring-[#c8ba3b] focus:border-transparent transition-all duration-200 text-sm"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#306a48] hover:bg-[#255237] text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending link...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Logo in success state too */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-[#F5F4F0] dark:bg-[#1E201B] border border-[#E3E0D8] dark:border-[#2E302A] flex items-center justify-center mb-3 shadow-sm">
                  <img
                    src="/logo.svg"
                    alt="VedaApex Logo"
                    className="w-10 h-10 object-contain"
                    style={{ filter: "drop-shadow(0 2px 6px rgba(48,106,72,0.18))" }}
                  />
                </div>
                <span className="font-serif text-xl font-bold tracking-wide text-[#191919] dark:text-[#E8E6E0]">
                  VedaApex
                </span>
              </div>

              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/40 mx-auto mb-5">
                <CheckCircle className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                Check Your Email
              </h1>
              <p className="text-gray-500 dark:text-gray-400 text-center text-sm mb-4 leading-relaxed">
                We&apos;ve sent a password reset link to:
              </p>
              <p className="font-semibold text-[#191919] dark:text-[#E8E6E0] text-center mb-5 break-all text-sm">
                {email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-7 leading-relaxed">
                Click the link in the email to reset your password. If you don&apos;t see it, check your spam folder.
              </p>

              <Link
                href="/login"
                className="block w-full py-3 px-4 bg-[#306a48] hover:bg-[#255237] text-white font-medium rounded-xl transition-all duration-200 text-center shadow-md hover:shadow-lg text-sm"
              >
                Back to Login
              </Link>
            </>
          )}

          {!sent && (
            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Remember your password?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#306a48] dark:text-[#c8ba3b] hover:underline transition-colors"
              >
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Custom animation keyframes */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
