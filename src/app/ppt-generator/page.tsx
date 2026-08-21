"use client";

import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import PptPreview, { fetchFileBytes, getFileName } from "@/components/PptPreview";
import {
  FileText,
  Download,
  RefreshCw,
  Presentation,
} from "lucide-react";
import { apiRequest } from "@/lib/api";

type PPTGeneration = {
  id: string;
  topic: string;
  slideCount: number;
  theme: string;
  timestamp: number;
};

export default function PPTGenerator() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPPT, setGeneratedPPT] = useState<boolean>(false);
  const [pptUrl, setPptUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [slideCount, setSlideCount] = useState(10);
  const [theme, setTheme] = useState("Professional");
  const [history, setHistory] = useState<PPTGeneration[]>([]);
  const [activeModel, setActiveModel] = useState("VedaS Deck v1.0");
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
  };

  const themes = ["Professional", "Creative", "Minimalist", "Academic", "Corporate"];
  const models = ["VedaS Deck v1.0", "VedaS Deck Pro"];

  useEffect(() => {
    const saved = localStorage.getItem("ppt_generations");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveToHistory = (t: string, sc: number, th: string) => {
    const newGen: PPTGeneration = {
      id: Math.random().toString(36).substring(7),
      topic: t,
      slideCount: sc,
      theme: th,
      timestamp: Date.now(),
    };
    const newHistory = [newGen, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem("ppt_generations", JSON.stringify(newHistory));
  };

  const handleDownload = async () => {
    if (!pptUrl || isDownloading) return;
    setIsDownloading(true);
    try {
      if (pptUrl.startsWith("blob:")) {
        const a = document.createElement("a");
        a.href = pptUrl;
        a.download = "presentation.pptx";
        a.click();
      } else {
        const bytes = await fetchFileBytes(pptUrl);
        const blob = new Blob([bytes], {
          type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = getFileName(pptUrl);
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
    } catch (error) {
      console.error("PPT download failed:", error);
      window.open(pptUrl, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    try {
      // Use the legacy endpoint path from config
      const requestBody = {
        topic: topic.trim(),
        slides: slideCount,
        theme: theme,
      };
      console.log("[PPT Generator] Sending request:", requestBody);
      
      const response = await apiRequest("/ai/generate/ppt", {
        method: "POST",
        timeoutMs: 120000,
        body: JSON.stringify(requestBody),
      });

      const contentType = response.headers.get("content-type") || "";
      let pptUrl: string | null = null;

      if (contentType.includes("application/json") || contentType.includes("+json")) {
        const data = await response.json();
        const nested = data?.data && typeof data.data === "object" ? data.data : data;
        pptUrl =
          nested.result ||
          nested.url ||
          nested.file_url ||
          nested.download_url ||
          nested.output ||
          null;
      } else {
        const blob = await response.blob();
        if (blob.size > 0) {
          pptUrl = URL.createObjectURL(blob);
        }
      }

      if (!pptUrl) {
        throw new Error("No presentation returned from generation response");
      }

      setGeneratedPPT(true);
      setPptUrl(pptUrl);
      saveToHistory(topic, slideCount, theme);
    } catch (error: any) {
      console.error("PPT generation failed:", error);
      // Show user-friendly error
      const message = error?.message || "Failed to generate presentation";
      alert(message);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen w-full flex bg-[#F9F9F9] overflow-hidden">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-6 pb-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground/90">PPT Generator</h1>
            <p className="text-sm text-foreground/50">Create professional presentations with Apex VedaS Deck</p>
          </div>
          {generatedPPT && pptUrl && (
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {isDownloading ? "Downloading..." : "Download .pptx"}
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col lg:flex-row gap-6 px-4 lg:px-8 pb-8 overflow-y-auto lg:overflow-hidden">
          {/* Left Column - Controls */}
          <div className="flex w-full lg:w-[350px] flex-col gap-6 shrink-0">
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <label className="mb-2 block text-sm font-medium text-foreground/70">Presentation Topic</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What is your presentation about?"
                className="h-32 w-full resize-none rounded-xl border border-black/5 bg-[#FAFAFA] p-3 text-sm focus:border-black/10 focus:outline-none focus:ring-0"
              />
              
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim()}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Presentation className="h-4 w-4" />}
                {isGenerating ? "Designing Slides..." : "Generate PPT"}
              </button>
            </div>
          </div>

          {/* Right Column - Preview Area */}
          <div className="flex-1 rounded-3xl border border-black/5 bg-white shadow-sm overflow-hidden flex flex-col min-h-[400px]">
             {generatedPPT && pptUrl ? (
                <PptPreview source={pptUrl} onDownload={handleDownload} />
             ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-foreground/30 font-medium bg-[#FDFDFD]">
                  <FileText className="h-12 w-12 mb-4 opacity-20" />
                  Preview will appear here after generation
                </div>
             )}
          </div>
        </div>
      </main>
    </div>
  );
}
