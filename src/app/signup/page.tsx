"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState<File | null>(null);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : "",
        data: { username }
      },
    });
    setLoading(false);
    if (error) return setError(error.message);
    router.push("/");
  }

  async function handleGoogle() {
    setError(null);
    const res = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (res.error) setError(res.error.message ?? "Google sign-in failed");
    else if (!res.redirected) router.push("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--sidebar-bg)] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-center text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="mb-6 text-center text-sm text-foreground/60">Sign up for Apex</p>

        <button
          onClick={handleGoogle}
          className="mb-4 w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm font-medium hover:bg-black/5"
        >
          Continue with Google
        </button>

        <div className="mb-4 flex items-center gap-3 text-xs text-foreground/40">
          <div className="h-px flex-1 bg-black/10" />
          or
          <div className="h-px flex-1 bg-black/10" />
        </div>

        <form onSubmit={handleSignup} className="space-y-3">
          <input
            type="text"
            required
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-foreground/60">Profile Photo</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
              className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm text-foreground/60 file:mr-4 file:rounded-md file:border-0 file:bg-black/5 file:px-2 file:py-1 file:text-xs file:text-foreground/70"
            />
          </div>
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-foreground/60">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
