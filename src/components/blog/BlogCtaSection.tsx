import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

export default function BlogCtaSection() {
  return (
    <section className="relative overflow-hidden bg-[#0f0d1a] py-16 text-center">
      <div className="pointer-events-none absolute -left-20 top-0 h-72 w-72 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-indigo-600/20 blur-3xl" />
      <div className="relative mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
          Transform how your business operates with VedaApex
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/70">
          AI-powered tools that make your marketing, content, and design work
          easy. Start today.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/upgrade"
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-[#111827] shadow-lg transition-transform hover:scale-[1.03]"
          >
            See pricing
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            <MessageCircle className="h-4 w-4" />
            Start free
          </Link>
        </div>
      </div>
    </section>
  );
}
