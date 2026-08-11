import type { MetadataRoute } from "next";
import { posts, SITE_URL } from "@/lib/blog/posts";

const BASE_URL = SITE_URL.replace(/\/$/, "");

type PageEntry = {
  path: string;
  priority: number;
  changeFrequency: "weekly" | "monthly" | "yearly";
};

const PUBLIC_PAGES: PageEntry[] = [
  { path: "", priority: 1.0, changeFrequency: "monthly" }, // Homepage
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
  { path: "/upgrade", priority: 0.8, changeFrequency: "monthly" }, // Pricing
  { path: "/explore-vedas", priority: 0.7, changeFrequency: "weekly" },
  { path: "/apexcode", priority: 0.7, changeFrequency: "weekly" },
  { path: "/image-generator", priority: 0.6, changeFrequency: "monthly" },
  { path: "/video-generator", priority: 0.6, changeFrequency: "monthly" },
  { path: "/logo-generator", priority: 0.6, changeFrequency: "monthly" },
  { path: "/model-generator", priority: 0.6, changeFrequency: "monthly" },
  { path: "/ppt-generator", priority: 0.6, changeFrequency: "monthly" },
  { path: "/prompt-generator", priority: 0.6, changeFrequency: "monthly" },
  { path: "/docs-generator", priority: 0.6, changeFrequency: "monthly" },
  { path: "/excel-generator", priority: 0.6, changeFrequency: "monthly" },
  { path: "/file-converter", priority: 0.6, changeFrequency: "monthly" },
  { path: "/bg-remover", priority: 0.6, changeFrequency: "monthly" },
  { path: "/enhancer", priority: 0.6, changeFrequency: "monthly" },
  { path: "/watermark-remover", priority: 0.6, changeFrequency: "monthly" },
  { path: "/wedding-card-generator", priority: 0.6, changeFrequency: "monthly" },
  { path: "/ads-generator", priority: 0.6, changeFrequency: "monthly" },
  { path: "/connectors", priority: 0.6, changeFrequency: "monthly" },
  { path: "/custom-connector", priority: 0.5, changeFrequency: "monthly" },
  { path: "/developer", priority: 0.5, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = PUBLIC_PAGES.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE_URL}${path}`,
    changeFrequency,
    priority,
  }));

  const blogPosts: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticPages, ...blogPosts];
}
