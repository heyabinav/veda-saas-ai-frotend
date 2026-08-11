import type { Metadata } from "next";
import Link from "next/link";
import { postMeta } from "@/lib/blog/posts";
import BlogHeader from "@/components/blog/BlogHeader";
import BlogFooter from "@/components/blog/BlogFooter";
import BlogIndexContent from "@/components/blog/BlogIndexContent";
import BlogNewsletter from "@/components/blog/BlogNewsletter";
import BlogCtaSection from "@/components/blog/BlogCtaSection";
import BlogToolsGuide from "@/components/blog/BlogToolsGuide";

export const metadata: Metadata = {
  title: "Blog — VedaApex News, AI Tips and Business Guides",
  description:
    "VedaApex product news and best practices for business owners — AI tools, marketing tips, and plan guides to help your business grow.",
  keywords: [
    "VedaApex blog",
    "AI tools blog",
    "small business AI guide",
    "VedaApex plans guide",
    "AI marketing tips",
    "business growth tools",
  ],
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "VedaApex Blog — News, AI Tips and Guides",
    description:
      "Read all VedaApex blogs — product news, business, marketing, and AI tools guides.",
    type: "website",
    siteName: "VedaApex",
    url: "/blog",
  },
};

export default function BlogIndexPage() {
  return (
    <>
      <BlogHeader />

      {/* Hero */}
      <div className="border-b border-[#E3E0D8] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-[#111827] sm:text-5xl">
            Blog
          </h1>
          <div className="mt-7 flex justify-center">
            <Link
              href="/signup"
              className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-[1.03]"
            >
              Try VedaApex
            </Link>
          </div>

          {/* AI Tools Guide — how each VedaApex tool works */}
          <BlogToolsGuide />
        </div>
      </div>

      {/* Posts: language switcher + chips + search + sort + grid/list */}
      <main className="bg-white">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 sm:px-6 sm:pb-14">
          <BlogIndexContent posts={postMeta} />
        </div>
      </main>

      <BlogNewsletter />
      <BlogCtaSection />
      <BlogFooter />
    </>
  );
}
