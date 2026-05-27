"use client";

import { useState, useEffect } from "react";
import CanvasGenerator from "@/components/CanvasGenerator";
import { Download, Share2, Video } from "lucide-react";

type VideoGeneration = {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
};

export default function VideoGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [history, setHistory] = useState<VideoGeneration[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("video_generations");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveToHistory = (url: string, p: string) => {
    const newGen: VideoGeneration = {
      id: Math.random().toString(36).substring(7),
      url,
      prompt: p,
      timestamp: Date.now(),
    };
    const newHistory = [newGen, ...history].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem("video_generations", JSON.stringify(newHistory));
  };

  const handleGenerate = (prompt: string) => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setTimeout(() => {
      const url = "https://assets.mixkit.co/videos/preview/mixkit-abstract-form-of-blue-and-purple-ink-in-water-39850-large.mp4";
      setGeneratedVideo(url);
      saveToHistory(url, prompt);
      setIsGenerating(false);
    }, 3000);
  };

  return (
    <CanvasGenerator
      title="VedaS Motion"
      subtitle="AI VIDEO GENERATOR"
      description="Describe the motion, camera movement, and scene..."
      onGenerate={handleGenerate}
      isGenerating={isGenerating}
      history={history}
    >
      {generatedVideo ? (
        <div className="relative group w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl">
          <video
            src={generatedVideo}
            controls
            autoPlay
            muted
            playsInline
            loop
            className="h-full w-full object-cover"
          />
          <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="rounded-full bg-white/90 p-2 shadow-lg hover:bg-white">
              <Download className="h-4 w-4" />
            </button>
            <button className="rounded-full bg-white/90 p-2 shadow-lg hover:bg-white">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/[0.02]">
            <Video className="h-10 w-10 text-foreground/20" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground/70">No video generated yet</h3>
            <p className="text-sm text-foreground/40 max-w-[280px]">
              Describe a scene above to generate your first AI video.
            </p>
          </div>
        </div>
      )}
    </CanvasGenerator>
  );
}
