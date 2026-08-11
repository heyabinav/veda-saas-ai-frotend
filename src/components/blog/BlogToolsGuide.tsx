import Link from "next/link";
import {
  Image,
  Eraser,
  Wand2,
  Stamp,
  Presentation,
  Megaphone,
  Heart,
  Droplets,
  FileText,
  Table,
  Clapperboard,
  Box,
  Code2,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Tool = {
  name: string;
  route: string;
  how: string;
  icon: LucideIcon;
};

const tools: Tool[] = [
  {
    name: "ApexVision — Image Generator",
    route: "/image-generator",
    how: "Type a text prompt and get a ready image — product photos, banners, festival greetings in seconds.",
    icon: Image,
  },
  {
    name: "BG Remover",
    route: "/bg-remover",
    how: "Upload a photo and the background is removed automatically — then swap in a clean or branded background.",
    icon: Eraser,
  },
  {
    name: "Image Enhancer",
    route: "/enhancer",
    how: "Restore old or blurry photos — faces and details are sharpened automatically.",
    icon: Wand2,
  },
  {
    name: "Logo Generator",
    route: "/logo-generator",
    how: "Describe your brand and get logo ideas in minutes — pick, tweak, and download.",
    icon: Stamp,
  },
  {
    name: "PPT Generator",
    route: "/ppt-generator",
    how: "Give a topic and get a client-ready presentation — slides, layout, and design all done for you.",
    icon: Presentation,
  },
  {
    name: "Ads Generator",
    route: "/ads-generator",
    how: "High-converting ad copy and visuals for Instagram, Facebook, and Google ads.",
    icon: Megaphone,
  },
  {
    name: "Wedding Card Generator",
    route: "/wedding-card-generator",
    how: "Beautiful wedding cards from a prompt — ready to print or share.",
    icon: Heart,
  },
  {
    name: "Watermark Remover",
    route: "/watermark-remover",
    how: "Cleanly removes watermarks from your images in one click.",
    icon: Droplets,
  },
  {
    name: "Docs Generator",
    route: "/docs-generator",
    how: "Proposals, reports, and documents drafted from plain text — formatted consistently.",
    icon: FileText,
  },
  {
    name: "Excel Generator",
    route: "/excel-generator",
    how: "Describe your data in plain language and get a clean spreadsheet — formulas included.",
    icon: Table,
  },
  {
    name: "Video Generator",
    route: "/video-generator",
    how: "Turn ideas into short videos without hiring a videographer.",
    icon: Clapperboard,
  },
  {
    name: "Model Generator — 3D",
    route: "/model-generator",
    how: "Turn a text prompt, photo, or video into a 3D model — preview it from every angle and download as GLB.",
    icon: Box,
  },
  {
    name: "APEXCODE",
    route: "/apexcode",
    how: "AI code generator — build small tools and scripts by typing what you need.",
    icon: Code2,
  },
];

export default function BlogToolsGuide() {
  return (
    <div className="mx-auto mt-12 max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-left">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-[#111827] sm:text-2xl">
            VedaApex AI Tools — How They Work
          </h2>
          <p className="mt-1 text-sm text-[#6D6C67]">
            Har tool kaise kaam karta hai — pick one and try it free.
          </p>
        </div>
        <Link
          href="/explore-vedas"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#7b5cff] hover:underline"
        >
          Explore all tools
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6 grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.route}
              href={t.route}
              className="group rounded-xl border border-[#E3E0D8] bg-white p-4 transition-colors hover:border-[#7b5cff]/40 hover:bg-[#F5F4F0]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#7b5cff]/10 text-[#7b5cff]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-[#111827] transition-colors group-hover:text-[#7b5cff]">
                {t.name}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-[#6D6C67]">
                {t.how}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
