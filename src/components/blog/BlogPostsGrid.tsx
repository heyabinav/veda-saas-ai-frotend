"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  LayoutGrid,
  List,
  ArrowRight,
  Clock,
  Rocket,
  Megaphone,
  Wallet,
  LayoutList,
} from "lucide-react";
import type { BlogPostMeta } from "@/lib/blog/posts";
import { cn } from "@/lib/utils";

const thumbStyles = [
  { grad: "from-violet-600 to-indigo-600", icon: Rocket },
  { grad: "from-emerald-500 to-teal-600", icon: Megaphone },
  { grad: "from-amber-500 to-orange-600", icon: Wallet },
];

type SortKey = "newest" | "az";

export default function BlogPostsGrid({ posts }: { posts: BlogPostMeta[] }) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("newest");
  const [view, setView] = useState<"grid" | "list">("grid");

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(posts.flatMap((p) => p.tags)))],
    [posts]
  );

  const filtered = useMemo(() => {
    let list = posts.filter(
      (p) => category === "All" || p.tags.includes(category)
    );
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }
    if (sort === "az") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [posts, category, query, sort]);

  return (
    <div>
      {/* Category chips */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
              category === cat
                ? "border-[#111827] bg-[#111827] text-white"
                : "border-black/10 text-[#6D6C67] hover:border-black/20 hover:text-[#111827]"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Controls: search, sort, grid/list toggle */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-black/5 py-4">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8984]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search blogs..."
            aria-label="Search blogs"
            className="w-full rounded-full border border-black/10 bg-white py-2 pl-9 pr-4 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#8A8984] focus:border-[#7b5cff]"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort blogs"
            className="rounded-full border border-black/10 bg-white px-3.5 py-2 text-sm text-[#111827] outline-none transition-colors focus:border-[#7b5cff]"
          >
            <option value="newest">Newest</option>
            <option value="az">Alphabetically (A to Z)</option>
          </select>
          <div className="flex overflow-hidden rounded-full border border-black/10">
            <button
              onClick={() => setView("grid")}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
              className={cn(
                "flex h-9 w-10 items-center justify-center transition-colors",
                view === "grid"
                  ? "bg-[#111827] text-white"
                  : "bg-white text-[#6D6C67] hover:text-[#111827]"
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              aria-label="List view"
              aria-pressed={view === "list"}
              className={cn(
                "flex h-9 w-10 items-center justify-center border-l border-black/10 transition-colors",
                view === "list"
                  ? "bg-[#111827] text-white"
                  : "bg-white text-[#6D6C67] hover:text-[#111827]"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-[#8A8984]">
            No posts for those filters.
          </p>
          <button
            onClick={() => {
              setCategory("All");
              setQuery("");
              setSort("newest");
            }}
            className="mt-3 text-sm font-semibold text-[#7b5cff] underline-offset-2 hover:underline"
          >
            Clear all filters
          </button>
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-6 pt-8 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post, i) => {
            const thumb = thumbStyles[i % thumbStyles.length];
            const Icon = thumb.icon;
            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div
                  className={cn(
                    "flex h-40 items-center justify-center bg-gradient-to-br",
                    thumb.grad
                  )}
                >
                  <Icon className="h-12 w-12 text-white/90 transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div className="p-5">
                  <div className="mb-3 flex items-center gap-3 text-xs text-[#8A8984]">
                    <span className="rounded-full border border-[#E3E0D8] bg-[#F5F4F0] px-2.5 py-0.5 font-semibold uppercase tracking-wide text-[#6D6C67]">
                      {post.tags[0]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-semibold leading-snug tracking-tight text-[#111827] transition-colors group-hover:text-[#7b5cff]">
                    {post.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#6D6C67]">
                    {post.excerpt}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#7b5cff]">
                    Read more
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="divide-y divide-black/5 pt-4">
          {filtered.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-wrap items-center justify-between gap-3 py-6"
            >
              <div className="min-w-0">
                <span className="rounded-full border border-[#E3E0D8] bg-[#F5F4F0] px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-[#6D6C67]">
                  {post.tags[0]}
                </span>
                <h3 className="mt-2 max-w-2xl font-serif text-xl font-semibold tracking-tight text-[#111827] transition-colors group-hover:text-[#7b5cff]">
                  {post.title}
                </h3>
                <p className="mt-1 max-w-2xl line-clamp-1 text-sm text-[#6D6C67]">
                  {post.excerpt}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <span className="hidden text-sm text-[#8A8984] sm:block">
                  {post.date}
                </span>
                <LayoutList className="hidden h-4 w-4 text-[#8A8984] transition-colors group-hover:text-[#7b5cff]" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
