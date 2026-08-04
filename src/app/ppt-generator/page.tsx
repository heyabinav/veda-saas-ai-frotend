"use client";

import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  PanelLeft,
  FileText,
  Download,
  Share2,
  RefreshCw,
  Info,
  ChevronDown,
  Plus,
  Presentation,
  X,
} from "lucide-react";

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

  const handleGenerate = () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedPPT(true);
      saveToHistory(topic, slideCount, theme);
      setIsGenerating(false);
    }, 4000);
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
             {generatedPPT ? (
                <div className="flex-1 p-4 lg:p-8 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
                   <div className="w-full max-w-lg aspect-video bg-white rounded-xl shadow-xl flex flex-col items-center justify-center p-4 lg:p-8 border border-black/10 text-center">
                      <h2 className="text-xl lg:text-3xl font-bold text-foreground mb-4">{topic}</h2>
                      <div className="text-xs lg:text-sm text-foreground/60">Professional Theme</div>
                   </div>
                   <button className="mt-8 flex items-center gap-2 bg-foreground text-white px-6 py-2 rounded-lg hover:opacity-90">
                      <Download className="h-4 w-4" /> Download .pptx
                   </button>
                </div>
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
