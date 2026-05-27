"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import {
  Sparkles,
  RefreshCw,
  Paperclip,
  ArrowLeft,
} from "lucide-react";

export default function CanvasGenerator({
  title,
  subtitle,
  description,
  onGenerate,
  isGenerating,
  children,
}: {
  title: string;
  subtitle: string;
  description: string;
  onGenerate: (prompt: string, file: File | null) => void | Promise<void>;
  isGenerating: boolean;
  history?: { id: string; url: string; prompt: string }[];
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDownload = () => {
    // In a real app, you would download the generated artifact from the URL
    alert("Downloading your generation...");
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAttachedFile(file);
  };

  return (
    <div className="h-screen w-full flex bg-[#F9F9F9]">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/explore-vedas" className="rounded-lg p-2 hover:bg-black/5 transition">
              <ArrowLeft className="h-5 w-5 text-foreground/60" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground/90">{title}</h1>
              <p className="text-xs text-foreground/50">{subtitle}</p>
            </div>
          </div>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-black/5 shadow-sm rounded-lg text-sm font-medium text-foreground hover:bg-black/5 transition"
          >
            Download
          </button>
        </div>

        <div className="flex flex-1 gap-6 px-8 pb-8 overflow-hidden">
          {/* Controls */}
          <div className="flex w-[350px] flex-col gap-6">
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <label className="mb-2 block text-sm font-medium text-foreground/70">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={description}
                className="h-32 w-full resize-none rounded-xl border border-black/5 bg-[#FAFAFA] p-3 text-sm focus:border-black/10 focus:outline-none"
              />
              
              <input type="file" ref={fileRef} className="hidden" onChange={handleFileChange} />
              <button
                onClick={() => fileRef.current?.click()}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-black/10 py-2 text-xs text-foreground/50 hover:bg-black/5"
              >
                <Paperclip className="h-3 w-3" />
                {attachedFile ? attachedFile.name : "Attach File"}
              </button>
              {attachedFile && (
                <button onClick={() => setAttachedFile(null)} className="text-[10px] text-red-500 mt-1">Remove file</button>
              )}

              <button
                onClick={async () => {
                   try {
                     await onGenerate(prompt, attachedFile);
                   } catch (error) {
                     console.error(error);
                     alert("Error triggering generation: " + error);
                   }
                }}

                disabled={isGenerating || !prompt.trim()}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {isGenerating ? "Processing..." : "Generate"}
              </button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 rounded-3xl border border-black/5 bg-white shadow-sm overflow-hidden p-6 relative">
            <div className="w-full h-full bg-[#FDFDFD] border border-dashed border-black/10 rounded-2xl flex items-center justify-center">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
