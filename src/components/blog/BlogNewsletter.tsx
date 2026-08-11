"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export default function BlogNewsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setDone(true);
  };

  return (
    <section className="border-y border-black/5 bg-[#F5F4F0]">
      <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:px-6">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#111827] sm:text-3xl">
          Get the VedaApex newsletter
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-[#6D6C67]">
          Product updates, how-tos, and AI tips for business owners. Delivered
          monthly to your inbox.
        </p>
        {done ? (
          <div className="mx-auto mt-6 flex max-w-md items-center justify-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Thank you! You&apos;re subscribed.
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              aria-label="Email address"
              className="w-full flex-1 rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#8A8984] focus:border-[#7b5cff]"
            />
            <button
              type="submit"
              className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              Subscribe
            </button>
          </form>
        )}
        <p className="mt-3 text-xs text-[#8A8984]">
          You can unsubscribe at any time.
        </p>
      </div>
    </section>
  );
}
