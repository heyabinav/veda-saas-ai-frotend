"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import {
  PanelLeft,
  Image as ImageIcon,
  Video,
  Presentation,
  ArrowRight,
  Sparkles,
  Compass,
  ArrowUpRight,
  FileText,
  Box,
  Code,
  Trash2,
} from "lucide-react";

export default function ExploreVedas() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [search, setSearch] = useState("");

  const tools = [
    {
      title: "VedaS Vision",
      subtitle: "AI IMAGE GENERATOR",
      description: "Generate stunning high-fidelity images from text prompts using advanced AI models.",
      icon: ImageIcon,
      href: "/image-generator",
      accent: "text-blue-600",
      bg: "bg-blue-500/5",
      border: "hover:border-blue-500/20",
    },
    {
      title: "VedaS Enhancer",
      subtitle: "AI IMAGE & VIDEO ENHANCER",
      description: "Upgrade your images and videos with AI-powered upscaling and enhancement.",
      icon: Sparkles,
      href: "/enhancer",
      accent: "text-blue-600",
      bg: "bg-blue-500/5",
      border: "hover:border-blue-500/20",
    },
    {
      title: "VedaS Eraser",
      subtitle: "WATERMARK REMOVER",
      description: "Remove watermarks from images and videos using advanced AI object removal.",
      icon: Trash2,
      href: "/watermark-remover",
      accent: "text-red-600",
      bg: "bg-red-500/5",
      border: "hover:border-red-500/20",
    },
    {
      title: "VedaS BG Remover",
      subtitle: "AI BACKGROUND REMOVER",
      description: "Instant, professional background removal for your images with one click.",
      icon: ImageIcon,
      href: "/bg-remover",
      accent: "text-emerald-600",
      bg: "bg-emerald-500/5",
      border: "hover:border-emerald-500/20",
    },
    {
      title: "VedaS Motion",
      subtitle: "AI VIDEO GENERATOR",
      description: "Transform your concepts into high-quality cinematic videos with fluid motion and AI consistency.",
      icon: Video,
      href: "/video-generator",
      accent: "text-purple-600",
      bg: "bg-purple-500/5",
      border: "hover:border-purple-500/20",
    },
    {
      title: "VedaS Deck",
      subtitle: "AI PPT GENERATOR",
      description: "Create structured, professional presentation decks with AI-powered layouts and content generation.",
      icon: Presentation,
      href: "/ppt-generator",
      accent: "text-orange-600",
      bg: "bg-orange-500/5",
      border: "hover:border-orange-500/20",
    },
    {
      title: "KodiXapex",
      subtitle: "AI CODE GENERATOR",
      description: "Generate, preview, and execute code snippets directly within the browser.",
      icon: Code,
      href: "/kodixapex",
      accent: "text-emerald-600",
      bg: "bg-emerald-500/5",
      border: "hover:border-emerald-500/20",
    },
    {
      title: "VedaS Prompt Master",
      subtitle: "AI PROMPT GENERATOR",
      description: "Expand your basic concepts into highly detailed and professional AI prompts.",
      icon: Sparkles,
      href: "/prompt-generator",
      accent: "text-violet-600",
      bg: "bg-violet-500/5",
      border: "hover:border-violet-500/20",
    },
    {
      title: "VedaS Invitations",
      subtitle: "WEDDING CARD GENERATOR",
      description: "Design elegant, personalized wedding invitations with AI-powered customization.",
      icon: FileText,
      href: "/wedding-card-generator",
      accent: "text-pink-600",
      bg: "bg-pink-500/5",
      border: "hover:border-pink-500/20",
    },
    {
      title: "VedaS Docs",
      subtitle: "AI DOCS GENERATOR",
      description: "Generate structured documents and research papers with AI-powered content and formatting.",
      icon: FileText,
      href: "/docs-generator",
      accent: "text-amber-600",
      bg: "bg-amber-500/5",
      border: "hover:border-amber-500/20",
    },
    {
      title: "VedaS Sheets",
      subtitle: "AI EXCEL GENERATOR",
      description: "Automatically create data-driven Excel sheets and structured reports from your input.",
      icon: FileText,
      href: "/excel-generator",
      accent: "text-green-600",
      bg: "bg-green-500/5",
      border: "hover:border-green-500/20",
    },
    {
      title: "VedaS Branding",
      subtitle: "LOGO GENERATOR",
      description: "Create professional branding and unique logos with our advanced AI branding assistant.",
      icon: Box,
      href: "/logo-generator",
      accent: "text-red-600",
      bg: "bg-red-500/5",
      border: "hover:border-red-500/20",
    },
    {
      title: "VedaS Ads",
      subtitle: "APEX ADS GENERATOR",
      description: "Generate high-converting ad copy and visuals optimized for your target audience.",
      icon: Sparkles,
      href: "/ads-generator",
      accent: "text-orange-600",
      bg: "bg-orange-500/5",
      border: "hover:border-orange-500/20",
    },
    {
      title: "Vedaa Pex",
      subtitle: "FILE CONVERTER",
      description: "Convert your files into various formats effortlessly with our high-speed AI-powered conversion tool.",
      icon: FileText,
      href: "/file-converter",
      accent: "text-emerald-600",
      bg: "bg-emerald-500/5",
      border: "hover:border-emerald-500/20",
    },
    {
      title: "Vedaa Pex 3D",
      subtitle: "3D MODEL GENERATOR",
      description: "Generate and customize 3D models using advanced AI and Three.js rendering.",
      icon: Box,
      href: "/model-generator",
      accent: "text-indigo-600",
      bg: "bg-indigo-500/5",
      border: "hover:border-indigo-500/20",
    },
  ];

  return (
    <div className="h-screen w-full bg-white">
      <div className="flex h-full w-full overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="relative flex flex-1 flex-col overflow-y-auto bg-[#F9F9F9]">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="absolute left-6 top-6 z-20 rounded-md border border-black/5 bg-white p-1.5 text-foreground/60 shadow-sm transition-colors hover:bg-black/5"
              aria-label="Show sidebar"
            >
              <PanelLeft className="h-[18px] w-[18px]" />
            </button>
          )}

          {/* Header */}
          <div className="flex flex-col items-center justify-center px-8 pt-24 pb-16 text-center">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-black/5">
              <Compass className="h-7 w-7 text-foreground/80" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground/90 sm:text-5xl">
              Explore Apex
            </h1>
            <p className="mt-4 max-w-2xl text-base text-foreground/50 font-medium mb-8">
              A comprehensive suite of next-generation AI tools designed for professional workflows. 
            </p>
            <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tools..."
                className="w-full max-w-md px-6 py-3 rounded-full border border-black/10 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Tools Grid */}
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-8 pb-24 sm:grid-cols-2 lg:grid-cols-3 w-full">
            {tools.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.subtitle.toLowerCase().includes(search.toLowerCase())).map((tool) => (
              <Link
                key={tool.title}
                href={tool.href}
                className={`group relative flex flex-col rounded-[24px] border border-black/5 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-md ${tool.border}`}
              >
                <div className={`mb-6 flex h-10 w-10 items-center justify-center rounded-xl ${tool.bg} ${tool.accent}`}>
                  <tool.icon className="h-5 w-5" />
                </div>
                
                <div className="mb-2 flex items-center gap-2">
                  <span className={`text-[10px] font-bold tracking-[0.1em] ${tool.accent} uppercase`}>
                    {tool.subtitle}
                  </span>
                </div>
                
                <h3 className="mb-2 text-xl font-bold tracking-tight text-foreground/80">
                  {tool.title}
                </h3>
                
                <p className="mb-6 text-sm leading-relaxed text-foreground/50">
                  {tool.description}
                </p>
                
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70 transition-colors group-hover:text-foreground">
                    Launch Tool
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-foreground/20 transition-all group-hover:text-foreground/40 group-hover:rotate-45" />
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
