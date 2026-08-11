import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  Clock,
  Tag,
  ArrowRight,
  Rocket,
  Megaphone,
  Wallet,
} from "lucide-react";
import { getPost, postMeta, posts, SITE_URL } from "@/lib/blog/posts";
import BlogHeader from "@/components/blog/BlogHeader";
import BlogFooter from "@/components/blog/BlogFooter";
import BlogReader from "@/components/blog/BlogReader";
import BlogCtaSection from "@/components/blog/BlogCtaSection";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Blog Not Found | VedaApex" };

  return {
    title: `${post.seo.title} | VedaApex`,
    description: post.seo.description,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.seo.title,
      description: post.seo.description,
      type: "article",
      siteName: "VedaApex",
      url: `/blog/${post.slug}`,
      publishedTime: post.publishedAt,
      authors: ["VedaApex Editorial Team"],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.seo.title,
      description: post.seo.description,
    },
  };
}

const relatedThumbs = [Rocket, Megaphone, Wallet];
const relatedGrads = [
  "from-violet-600 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
];

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const article = post.content.en;
  const related = postMeta.filter((p) => p.slug !== slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: post.seo.description,
    datePublished: post.publishedAt,
    author: {
      "@type": "Person",
      name: "VedaApex Editorial Team",
      url: `${SITE_URL}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: "VedaApex",
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
    keywords: post.tags.join(", "),
    inLanguage: "en",
  };

  const faqJsonLd = article.faqs
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: article.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.a,
          },
        })),
      }
    : null;

  return (
    <>
      <BlogHeader />

      <main className="bg-white">
        {/* Breadcrumb */}
        <div className="border-b border-[#E3E0D8]">
          <div className="mx-auto flex max-w-3xl items-center gap-1.5 px-4 py-3 text-xs text-[#8A8984] sm:px-6">
            <Link
              href="/blog"
              className="transition-colors hover:text-[#191919]"
            >
              Blog
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="truncate text-[#6D6C67]">{article.title}</span>
          </div>
        </div>

        {/* Article header — single H1 on the page */}
        <div className="border-b border-[#E3E0D8]">
          <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-[#E3E0D8] bg-[#F5F4F0] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#6D6C67]"
                >
                  <Tag className="h-3 w-3" />
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-[#111827] sm:text-4xl">
              {article.title}
            </h1>
            <p className="mt-4 text-[15px] leading-relaxed text-[#6D6C67]">
              {article.excerpt}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#8A8984]">
              <span className="font-semibold text-[#111827]">
                VedaApex Editorial Team
              </span>
              <span>·</span>
              <span>
                <time dateTime={post.publishedAt}>{post.date}</time>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {post.readTime} read
              </span>
            </div>
          </div>
        </div>

        {/* Article content */}
        <div className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6">
          <BlogReader content={post.content.en} />

          {/* Author bio — E-E-A-T signal */}
          <div className="mt-10 flex items-start gap-4 rounded-2xl border border-[#E3E0D8] bg-[#F5F4F0] p-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 font-serif text-sm font-bold text-white">
              VT
            </span>
            <div>
              <p className="text-sm font-semibold text-[#111827]">
                Written by VedaApex Editorial Team
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[#6D6C67]">
                The VedaApex team writes practical, tested guides on AI,
                marketing, and growth for small business owners. We use every
                tool we write about before we publish.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="border-t border-[#E3E0D8] bg-white">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="text-center font-serif text-2xl font-semibold tracking-tight text-[#111827]">
              Related posts
            </h2>
            <p className="mt-2 text-center text-sm text-[#6D6C67]">
              Explore more product news and best practices for teams building
              with VedaApex.
            </p>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p, i) => {
                const Icon = relatedThumbs[i % relatedThumbs.length];
                return (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="group overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div
                      className={`flex h-28 items-center justify-center bg-gradient-to-br ${relatedGrads[i % relatedGrads.length]}`}
                    >
                      <Icon className="h-10 w-10 text-white/90 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <div className="p-5">
                      <div className="mb-2 flex items-center gap-3 text-xs text-[#8A8984]">
                        <span className="rounded-full border border-[#E3E0D8] bg-[#F5F4F0] px-2.5 py-0.5 font-semibold uppercase tracking-wide text-[#6D6C67]">
                          {p.tags[0]}
                        </span>
                        <span>{p.date}</span>
                      </div>
                      <h3 className="font-serif text-base font-semibold leading-snug tracking-tight text-[#111827] transition-colors group-hover:text-[#7b5cff]">
                        {p.title}
                      </h3>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#7b5cff]">
                        Read more
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <BlogCtaSection />
      <BlogFooter />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
    </>
  );
}
