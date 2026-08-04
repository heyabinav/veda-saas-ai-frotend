"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirectTo");
  const destination = redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//") ? redirectTo : "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!agreeToTerms) {
      setError("Please agree to the Terms of Service and Privacy Policy");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : "",
          data: { username, full_name: username },
        },
      });
      setLoading(false);
      if (error) return setError(error.message);
      document.cookie = "guest_session=; path=/; max-age=0";
      document.cookie = "guest_expires=; path=/; max-age=0";
      const graceExpiry = Date.now() + 365 * 24 * 60 * 60 * 1000;
      document.cookie = `post_login_grace=${graceExpiry}; path=/; max-age=${365 * 24 * 60 * 60}`;
      if (email.trim()) {
        document.cookie = `user_email=${encodeURIComponent(email.trim())}; path=/; max-age=${365 * 24 * 60 * 60}`;
      }
      router.replace(destination);
    } catch (err) {
      setLoading(false);
      setError("An error occurred. Please try again.");
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      const res = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      setLoading(false);
      if (res.error) setError(res.error.message ?? "Google sign-up failed");
      else if (!res.redirected) router.replace(destination);
    } catch (err) {
      setLoading(false);
      setError("Google sign-up failed. Please try again.");
    }
  }

  async function handleGithub() {
    setError(null);
    setLoading(true);
    try {
      const res = await lovable.auth.signInWithOAuth("github" as any, {
        redirect_uri: window.location.origin,
      });
      setLoading(false);
      if (res.error) setError(res.error.message ?? "GitHub sign-up failed");
      else if (!res.redirected) router.replace(destination);
    } catch (err) {
      setLoading(false);
      setError("GitHub sign-up failed. Please try again.");
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 overflow-hidden font-sans bg-white dark:bg-[#151613]">
      {/* Left side - Decorative workspace showcase */}
      <div className="hidden lg:flex lg:col-span-5 bg-white dark:bg-[#151613] text-[#191919] dark:text-[#E8E6E0] flex-col justify-between p-12 relative overflow-hidden border-r border-[#E3E0D8] dark:border-[#2E302A]">
        {/* Subtle geometric grid background overlay */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        {/* Soft atmospheric radial gradient glows */}
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[#c8ba3b]/5 dark:bg-[#c8ba3b]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-[#306a48]/5 dark:bg-[#306a48]/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F5F4F0] dark:bg-[#1E201B] flex items-center justify-center border border-[#E3E0D8] dark:border-[#2E302A]">
            <Image src="/logo.svg" alt="VedaApex Logo" width={24} height={24} className="w-6 h-6 object-contain" />
          </div>
          <span className="font-serif text-2xl font-bold tracking-wide text-[#191919] dark:text-[#E8E6E0]">
            VedaApex
          </span>
        </div>

        <div className="relative z-10 my-auto space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl xl:text-5xl font-serif font-light leading-tight text-[#191919] dark:text-[#E8E6E0]">
              Join the <br />
              <span className="font-medium text-[#306a48] dark:text-[#c8ba3b]">creative community</span>.
            </h2>
            <p className="text-base text-[#6D6C67] dark:text-[#9A9890] font-light leading-relaxed max-w-md">
              Start building and generating with ease. Gain access to premium AI-powered editing suites, logo creation workspaces, custom design templates, and presentation assets right away.
            </p>
          </div>

          {/* Interactive Workspace Mockup Card */}
          <div className="relative rounded-2xl overflow-hidden border border-[#E3E0D8] dark:border-[#2E302A] shadow-xl bg-[#F5F4F0] dark:bg-[#1E201B] p-2.5 group transition-all duration-500 hover:shadow-2xl hover:border-[#D4D1C9] dark:hover:border-[#3E403A]" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)' }}>
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl">
              <Image
                src="/dashboard-preview.png"
                alt="VedaApex Workspace Interface"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.01]"
              />
            </div>
          </div>
        </div>

        <div className="relative z-10 flex justify-between items-center text-xs text-[#A3A29C] dark:text-[#605F5A] font-mono tracking-wider uppercase">
          <span>Creative Suite v2.0</span>
          <span>© 2026 <strong>VedaApex</strong></span>
        </div>
      </div>

      {/* Right side - Minimal signup form */}
      <div className="col-span-1 lg:col-span-7 flex items-center justify-center p-6 sm:p-12 md:p-16 lg:p-24 bg-white dark:bg-[#151613]">
        <div className="w-full max-w-[440px] space-y-8">
          
          {/* Logo & header */}
          <div className="text-center space-y-3">
            <Image
              src="/logo.svg"
              alt="VedaApex Logo"
              width={56}
              height={56}
              className="h-14 w-14 mx-auto object-contain drop-shadow-sm transition-transform duration-300 hover:scale-105"
            />
            <h1 className="text-3xl font-serif font-medium text-[#191919] dark:text-[#E8E6E0] tracking-tight">
              Create your account
            </h1>
            <p className="text-[#6D6C67] dark:text-[#9A9890] text-sm font-light">
              Start creating with <strong>VedaApex</strong> for free
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-[#1E201B] border border-[#E3E0D8] dark:border-[#2E302A] rounded-xl hover:bg-[#F5F4F0] dark:hover:bg-[#252822] text-[#191919] dark:text-[#E8E6E0] font-medium transition-all duration-200 shadow-sm hover:shadow hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.67 0 3.17.58 4.35 1.71l3.25-3.25C17.65 1.71 14.99 1 12 1 7.37 1 3.4 3.73 1.57 7.73l3.87 3C6.39 7.72 8.97 5.04 12 5.04z"/>
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.44c-.28 1.48-1.12 2.73-2.38 3.58v2.98h3.85c2.25-2.07 3.58-5.12 3.58-8.71z"/>
                <path fill="#FBBC05" d="M5.44 14.39c-.23-.69-.36-1.43-.36-2.2s.13-1.51.36-2.2l-3.87-3C.56 8.97 0 10.42 0 12s.56 3.03 1.57 5.01l3.87-2.62z"/>
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.85-2.98c-1.07.72-2.44 1.15-4.11 1.15-3.03 0-5.61-2.68-6.56-5.69l-3.87 2.62C3.4 20.27 7.37 23 12 23z"/>
              </svg>
              <span className="text-sm font-medium">Google</span>
            </button>

            <button
              onClick={handleGithub}
              disabled={loading}
              className="flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-[#1E201B] border border-[#E3E0D8] dark:border-[#2E302A] rounded-xl hover:bg-[#F5F4F0] dark:hover:bg-[#252822] text-[#191919] dark:text-[#E8E6E0] font-medium transition-all duration-200 shadow-sm hover:shadow hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span className="text-sm font-medium">GitHub</span>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#E3E0D8] dark:bg-[#2E302A]" />
            <span className="text-xs text-[#8A8984] dark:text-[#7A7974] font-medium tracking-wider font-mono">OR</span>
            <div className="flex-1 h-px bg-[#E3E0D8] dark:bg-[#2E302A]" />
          </div>

          {/* Signup form */}
          <form onSubmit={handleSignup} className="space-y-4">
            
            {/* Full Name input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6D6C67] dark:text-[#9A9890]">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-5 h-5 text-[#8A8984] dark:text-[#7A7974]" />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#1E201B] border border-[#E3E0D8] dark:border-[#2E302A] rounded-xl text-[#191919] dark:text-[#E8E6E0] placeholder-[#A3A29C] dark:placeholder-[#605F5A] focus:outline-none focus:ring-2 focus:ring-[#306a48] dark:focus:ring-[#c8ba3b] focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Email input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6D6C67] dark:text-[#9A9890]">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-[#8A8984] dark:text-[#7A7974]" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-[#1E201B] border border-[#E3E0D8] dark:border-[#2E302A] rounded-xl text-[#191919] dark:text-[#E8E6E0] placeholder-[#A3A29C] dark:placeholder-[#605F5A] focus:outline-none focus:ring-2 focus:ring-[#306a48] dark:focus:ring-[#c8ba3b] focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#6D6C67] dark:text-[#9A9890]">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-[#8A8984] dark:text-[#7A7974]" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 bg-white dark:bg-[#1E201B] border border-[#E3E0D8] dark:border-[#2E302A] rounded-xl text-[#191919] dark:text-[#E8E6E0] placeholder-[#A3A29C] dark:placeholder-[#605F5A] focus:outline-none focus:ring-2 focus:ring-[#306a48] dark:focus:ring-[#c8ba3b] focus:border-transparent transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-[#8A8984] dark:text-[#7A7974] hover:text-[#191919] dark:hover:text-[#E8E6E0] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Terms agreement */}
            <div className="flex items-start gap-3.5 pt-2">
              <input
                type="checkbox"
                id="agree"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="w-4 h-4 rounded border-[#E3E0D8] dark:border-[#2E302A] text-[#306a48] dark:text-[#c8ba3b] focus:ring-[#306a48] dark:focus:ring-[#c8ba3b] cursor-pointer mt-0.5"
              />
              <label htmlFor="agree" className="text-xs text-[#6D6C67] dark:text-[#9A9890] cursor-pointer leading-normal select-none">
                I agree to the{" "}
                <Link href="#" className="font-semibold text-[#306a48] dark:text-[#c8ba3b] hover:underline transition-colors">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="#" className="font-semibold text-[#306a48] dark:text-[#c8ba3b] hover:underline transition-colors">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Error message */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50">
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#306a48] hover:bg-[#255237] text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-emerald-950/10 dark:hover:shadow-black/20"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          {/* Footer links */}
          <div className="space-y-4 pt-2">
            <p className="text-center text-sm text-[#6D6C67] dark:text-[#9A9890]">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#306a48] dark:text-[#c8ba3b] hover:underline transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#151613]"><div className="w-8 h-8 border-2 border-[#306a48] border-t-transparent rounded-full animate-spin" /></div>}>
      <SignupContent />
    </Suspense>
  );
}
