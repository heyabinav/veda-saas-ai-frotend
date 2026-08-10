"use client";

import { useState, useEffect } from "react";
import CanvasGenerator from "@/components/CanvasGenerator";
import { Download, Share2, Video } from "lucide-react";
import { apiRequest } from "@/lib/api";

type VideoGeneration = {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
};

function extractVideoUrl(data: any): string | null {
  if (!data) return null;
  if (typeof data === "string") return data.trim() || null;
  if (Array.isArray(data)) {
    const first = data[0];
    return typeof first === "string" ? first.trim() || null : first?.url ?? first?.result ?? null;
  }
  return (
    data.result ||
    data.url ||
    data.video_url ||
    data.videoUrl ||
    data.output ||
    null
  );
}

function blobToObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob);
}

export default function VideoGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [history, setHistory] = useState<VideoGeneration[]>([]);
  const [generationStatus, setGenerationStatus] = useState<string | null>(null);

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

  const handleGenerate = async (prompt: string, file: File | null, aspectRatio: string, shape: string) => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGenerationStatus(null);

    // The backend generates video synchronously, which can take 2+ minutes.
    // Wait up to ~5 minutes per attempt (must stay just above the proxy's
    // 290s window), and auto-retry on 504/timeout so a cold start or a busy
    // server doesn't kill the generation.
    const MAX_ATTEMPTS = 3;

    try {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const response = await apiRequest("/api/v1/ai/generate/video", {
            method: "POST",
            timeoutMs: 295000,
            body: JSON.stringify({
              prompt,
              aspect_ratio: aspectRatio,
              tier: 1,
              provider: "auto",
            }),
          });

          const contentType = response.headers.get("content-type") || "";
          let videoUrl: string | null = null;

          if (contentType.includes("application/json") || contentType.includes("+json")) {
            const data = await response.json();
            videoUrl = extractVideoUrl(data);
          } else if (contentType.startsWith("video/")) {
            const blob = await response.blob();
            videoUrl = blobToObjectUrl(blob);
          } else {
            const text = await response.text();
            try {
              videoUrl = extractVideoUrl(JSON.parse(text));
            } catch {
              videoUrl = text.trim() || null;
            }
          }

          if (!videoUrl) {
            throw new Error("No video URL returned from generation response");
          }

          setGeneratedVideo(videoUrl);
          saveToHistory(videoUrl, prompt);
          return;
        } catch (err: any) {
          const message = err?.message ?? "";
          const retriable =
            (typeof err?.status === "number" && err.status >= 500) ||
            message.includes("timed out") ||
            err?.name === "AbortError";

          if (!retriable || attempt >= MAX_ATTEMPTS) {
            if (attempt >= MAX_ATTEMPTS && retriable) {
              throw new Error(
                "Video generation timed out after multiple attempts. The hosting gateway (Render) kills requests that take longer than its limit — raise the 'Request Timeout' to 300s for the backend service in the Render dashboard, or try again later."
              );
            }
            throw err;
          }

          const delay = Math.min(2000 * 2 ** (attempt - 1), 8000);
          setGenerationStatus(
            `Attempt ${attempt} of ${MAX_ATTEMPTS} timed out. Retrying in ${Math.round(delay / 1000)}s — keeping this tab open...`
          );
          console.warn(`[Video Generation] Attempt ${attempt} timed out, retrying in ${delay / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <CanvasGenerator
      title="ApexMotion"
      subtitle="AI VIDEO GENERATOR"
      description="Describe the motion, camera movement, and scene..."
      onGenerate={handleGenerate}
      isGenerating={isGenerating}
      history={history}
      loadingTitle="Generating your video"
      loadingHint={
        generationStatus ??
        "This can take a few minutes. Please keep this tab open — generation continues automatically."
      }
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
