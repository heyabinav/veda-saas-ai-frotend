import type { BlogPostMeta } from "@/lib/blog/posts";
import BlogPostsGrid from "./BlogPostsGrid";

export default function BlogIndexContent({
  posts,
}: {
  posts: BlogPostMeta[];
}) {
  return (
    <div>
      <p className="mx-auto max-w-xl text-center text-[15px] leading-relaxed text-[#6D6C67]">
        Product news and best practices for teams building with VedaApex.
      </p>
      <div className="mt-8 sm:mt-10">
        <BlogPostsGrid posts={posts} />
      </div>
    </div>
  );
}
