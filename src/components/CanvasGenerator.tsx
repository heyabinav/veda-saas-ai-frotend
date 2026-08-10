"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import FileUploadDropzone from "@/components/ui/FileUploadDropzone";
import {
  Sparkles,
  RefreshCw,
  ArrowLeft,
  Square,
  Circle,
  Smartphone,
  Monitor,
  X,
} from "lucide-react";

export default function CanvasGenerator({
  title,
  subtitle,
  description,
  onGenerate,
  isGenerating,
  onDownload,
  children,
  loadingTitle = "Generating your image",
  loadingHint = "Your AI art is coming to life... this can take up to 30 seconds.",
}: {
  title: string;
  subtitle: string;
  description: string;
  onGenerate: (prompt: string, file: File | null, aspectRatio: string, shape: string) => void | Promise<void>;
  isGenerating: boolean;
  history?: { id: string; url: string; prompt: string }[];
  onDownload?: () => void | Promise<void>;
  loadingTitle?: string;
  loadingHint?: string;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [shape, setShape] = useState("square");
  const [model, setModel] = useState("Apex_2.2(High)");
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    try {
      await onGenerate(prompt, attachedFile, aspectRatio, shape);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
    }
  };


  const ratios = [
    { label: "1:1", value: "1:1" },
    { label: "16:9", value: "16:9" },
    { label: "9:16", value: "9:16" },
    { label: "4:3", value: "4:3" },
  ];

  const shapes = [
    { label: "Square", value: "square", icon: Square },
    { label: "Circle", value: "circle", icon: Circle },
    { label: "Portrait", value: "portrait", icon: Smartphone },
    { label: "Landscape", value: "landscape", icon: Monitor },
  ];

  const models = [
    { label: "Apex 2.2 (Low)", value: "Apex_2.2(Low)" },
    { label: "Apex 2.2 (High)", value: "Apex_2.2(High)" },
    { label: "Apex 2.2 (Beta)", value: "Apex_2.2(beta)" },
  ];

  const handleDownload = async () => {
    if (onDownload) {
      await onDownload();
      return;
    }
    // In a real app, you would download the generated artifact from the URL
    alert("Downloading your generation...");
  };


  return (
    <div className="h-screen w-full flex bg-[#F9F9F9]">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 md:px-8 py-5 md:py-6">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/explore-vedas" className="rounded-lg p-2 hover:bg-black/5 transition shrink-0">
              <ArrowLeft className="h-5 w-5 text-foreground/60" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-semibold tracking-tight text-foreground/90 truncate">{title}</h1>
              <p className="text-xs text-foreground/50 truncate">{subtitle}</p>
            </div>
          </div>
          <button 
            onClick={handleDownload}
            className="flex shrink-0 items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-black/5 shadow-sm rounded-lg text-sm font-medium text-foreground hover:bg-black/5 transition"
          >
            Download
          </button>
        </div>

        <div className="flex flex-1 flex-col lg:flex-row gap-6 px-4 lg:px-8 pb-8 overflow-y-auto scrollable-container overscroll-contain">
          {/* Controls */}
          <div className="flex w-full lg:w-[350px] flex-col gap-6 shrink-0">
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <label className="mb-2 block text-sm font-medium text-foreground/70">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                placeholder={description}
                className="h-32 w-full resize-none rounded-xl border border-black/5 bg-[#FAFAFA] p-3 text-sm focus:border-black/10 focus:outline-none"
              />
              
              <FileUploadDropzone
                onFileSelect={(file) => setAttachedFile(file)}
                onFileRemove={() => setAttachedFile(null)}
                file={attachedFile}
              />

              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-foreground/70">Aspect Ratio</label>
                <div className="grid grid-cols-4 gap-2">
                  {ratios.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setAspectRatio(r.value)}
                      className={`flex flex-col items-center justify-center rounded-lg border py-2 transition-all ${
                        aspectRatio === r.value
                          ? "border-black bg-black text-white"
                          : "border-black/5 bg-[#FAFAFA] text-foreground/50 hover:border-black/10"
                      }`}
                    >
                      <span className="text-[10px] font-bold">{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-foreground/70">Shape</label>
                <div className="grid grid-cols-4 gap-2">
                  {shapes.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setShape(s.value)}
                      title={s.label}
                      className={`flex flex-col items-center justify-center rounded-lg border py-2 transition-all ${
                        shape === s.value
                          ? "border-black bg-black text-white"
                          : "border-black/5 bg-[#FAFAFA] text-foreground/50 hover:border-black/10"
                      }`}
                    >
                      <s.icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <label className="mb-2 block text-sm font-medium text-foreground/70">Model</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full rounded-lg border border-black/5 bg-[#FAFAFA] px-3 py-2 text-sm focus:border-black/10 focus:outline-none"
                >
                  {models.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isGenerating ? "Processing..." : "Generate"}
              </button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 rounded-3xl border border-black/5 bg-white shadow-sm overflow-hidden p-4 lg:p-6 relative min-h-[400px]">
            <div className={`w-full h-full bg-[#FDFDFD] border border-dashed border-black/10 transition-all duration-500 flex items-center justify-center overflow-hidden ${
              shape === "circle" ? "rounded-full aspect-square max-w-[400px] mx-auto" : 
              shape === "portrait" ? "rounded-2xl aspect-[9/16] max-h-full" :
              shape === "landscape" ? "rounded-2xl aspect-[16/9] max-w-full" :
              "rounded-2xl aspect-square max-w-[450px]"
            }`}>
              {isGenerating ? (
                <div className="relative flex flex-col items-center justify-center p-6 text-center gap-5 animate-in fade-in duration-300 overflow-hidden">
                  {/* Animated aurora blobs */}
                  <div className="pointer-events-none absolute inset-0 blur-3xl">
                    <div className="absolute left-[15%] top-[10%] h-40 w-40 rounded-full bg-violet-300/40 apexgen-blob" />
                    <div className="absolute right-[10%] bottom-[15%] h-44 w-44 rounded-full bg-cyan-300/35 apexgen-blob" style={{ animationDelay: "-2.5s" }} />
                    <div className="absolute right-[25%] top-[20%] h-28 w-28 rounded-full bg-fuchsia-300/35 apexgen-blob" style={{ animationDelay: "-5s" }} />
                  </div>

                  {/* Rising particles */}
                  <div className="pointer-events-none absolute inset-0">
                    {[
                      { left: "18%", delay: "0s" },
                      { left: "32%", delay: "0.8s" },
                      { left: "46%", delay: "1.6s" },
                      { left: "60%", delay: "0.4s" },
                      { left: "72%", delay: "1.2s" },
                      { left: "85%", delay: "2s" },
                    ].map((p, i) => (
                      <span
                        key={i}
                        className="absolute bottom-4 h-1.5 w-1.5 rounded-full bg-foreground/40 apexgen-particle"
                        style={{ left: p.left, animationDelay: p.delay }}
                      />
                    ))}
                  </div>

                  {/* Core animation */}
                  <div className="relative flex h-32 w-32 items-center justify-center">
                    <div className="absolute inset-0 apexgen-orbit">
                      <span className="absolute left-1/2 top-0 -ml-1 h-2 w-2 rounded-full bg-foreground/80 shadow-sm" />
                    </div>
                    <div className="absolute inset-0 apexgen-orbit-reverse">
                      <span className="absolute bottom-0 left-1/2 -ml-1 h-1.5 w-1.5 rounded-full bg-foreground/40" />
                    </div>
                    <div className="absolute inset-2 rounded-full border border-dashed border-black/10 apexgen-orbit" style={{ animationDuration: "14s" }} />
                    <div className="absolute -inset-1.5 apexgen-spin-ring" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5 apexgen-pulse">
                      <img
                        src="/logo.svg"
                        alt="ApexVision"
                        draggable={false}
                        className="h-12 w-auto max-w-[60px] object-contain animate-pulse"
                      />
                    </div>
                  </div>

                  {/* Shimmer text + bouncing dots */}
                  <div className="flex items-center gap-2">
                    <h3 className="text-md font-semibold text-foreground/80 apexgen-shimmer-text">
                      {loadingTitle}
                    </h3>
                    <span className="flex items-center gap-0.5">
                      <span className="apexgen-dot" />
                      <span className="apexgen-dot" style={{ animationDelay: "0.15s" }} />
                      <span className="apexgen-dot" style={{ animationDelay: "0.3s" }} />
                    </span>
                  </div>
                  <p className="text-xs text-foreground/45 max-w-[280px] break-words">
                    {loadingHint}
                  </p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center p-6 text-center gap-4 animate-in fade-in duration-300">
                  <div className="rounded-full bg-red-50 p-3 text-red-500 border border-red-100 shadow-sm">
                    <X className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground/80">Request Failed</h3>
                  <p className="text-sm text-foreground/50 max-w-xs leading-relaxed break-words">{error}</p>
                  <button 
                    onClick={handleGenerate}
                    className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-white rounded-xl hover:opacity-95 transition shadow-sm text-sm font-medium"
                  >
                    <RefreshCw className="h-4 w-4" /> Retry
                  </button>
                </div>
              ) : (
                children
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
