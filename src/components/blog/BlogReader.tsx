import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ImageIcon } from "lucide-react";
import type { Article } from "@/lib/blog/posts";
import { cn } from "@/lib/utils";

function BlogVisual({
  image,
}: {
  image: { alt: string; caption?: string; src?: string };
}) {
  return (
    <figure className="my-8">
      <div
        className={cn(
          "overflow-hidden rounded-2xl border border-[#E3E0D8]",
          image.src
            ? "bg-white shadow-sm"
            : "relative flex h-48 items-center justify-center bg-gradient-to-br from-[#F5F4F0] via-white to-[#F1EDFF] sm:h-56"
        )}
      >
        {image.src ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        ) : (
          <>
            <div
              className="pointer-events-none absolute inset-0 opacity-60"
              style={{
                backgroundImage:
                  "radial-gradient(#d9d4ff 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            />
            <ImageIcon className="h-10 w-10 text-[#7b5cff]/70" />
            <span className="absolute bottom-3 left-4 right-4 text-center text-xs font-medium text-[#8A8984]">
              {image.alt}
            </span>
          </>
        )}
      </div>
      {image.caption && (
        <figcaption className="mt-3 text-center text-xs italic text-[#8A8984]">
          {image.caption}
        </figcaption>
      )}
    </figure>
  );
}

export default function BlogReader({ content }: { content: Article }) {
  const images = content.images ?? [];
  const imageSlots = [1, 3, 5].slice(0, images.length);

  return (
    <div>
      <div className="space-y-8 text-[15px] leading-[1.9] text-[#374151] sm:text-base">
        {content.sections.map((section, i) => (
          <section key={i}>
            <h2 className="mb-3 font-serif text-2xl font-semibold tracking-tight text-[#111827]">
              {section.heading}
            </h2>
            {section.paragraphs.map((p, j) => (
              <p key={j} className={j > 0 ? "mt-4" : ""}>
                {p}
              </p>
            ))}
            {section.list && section.list.length > 0 && (
              <ul className="mt-4 space-y-3">
                {section.list.map((item, k) => (
                  <li key={k} className="flex gap-2.5">
                    <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7b5cff]" />
                    <span>
                      {item.lead && (
                        <strong className="font-semibold text-[#111827]">
                          {item.lead}{" "}
                        </strong>
                      )}
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {imageSlots.includes(i) && (
              <BlogVisual image={images[imageSlots.indexOf(i)]} />
            )}
          </section>
        ))}

        {content.faqs && (
          <section>
            <h2 className="mb-3 font-serif text-2xl font-semibold tracking-tight text-[#111827]">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {content.faqs.map((f, i) => (
                <div key={i}>
                  <h3 className="mb-1 font-semibold text-[#111827]">{f.q}</h3>
                  <p className="text-[#6D6C67]">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {content.sources && content.sources.length > 0 && (
          <section>
            <h2 className="mb-3 font-serif text-2xl font-semibold tracking-tight text-[#111827]">
              Sources &amp; Further Reading
            </h2>
            <ul className="space-y-2 text-sm">
              {content.sources.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7b5cff]" />
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[#7b5cff] underline-offset-2 hover:underline"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CTA */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 p-8 text-center shadow-lg sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <h2 className="relative font-serif text-xl font-semibold text-white sm:text-2xl">
            Ready to grow your business with AI?
          </h2>
          <p className="relative mx-auto mt-2 max-w-lg text-sm text-white/80">
            Create a free account and see how easy AI can make your everyday
            work.
          </p>
          <div className="relative mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-violet-700 shadow transition-transform hover:scale-[1.03]"
            >
              Start Free Now
            </Link>
            <Link
              href="/explore-vedas"
              className="rounded-full border border-white/40 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Explore All Tools
            </Link>
          </div>
        </div>

        <p className="border-t border-[#E3E0D8] pt-6 text-xs leading-relaxed text-[#8A8984]">
          Disclaimer: This blog is written for general information. For exact
          details about VedaApex features, pricing, and use-cases, check the
          product pages.
        </p>
      </div>
    </div>
  );
}
