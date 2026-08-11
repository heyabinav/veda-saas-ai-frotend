"use client";

import { useState, useEffect } from "react";
import CanvasGenerator from "@/components/CanvasGenerator";
import { Download, Share2, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { apiRequest } from "@/lib/api";
import { SkeletonImage } from "@/components/ui/skeleton";

type Generation = {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
};

function extractImageUrl(data: any): string | null {
  if (!data) return null;
  if (typeof data === "string") return data.trim() || null;
  if (Array.isArray(data)) {
    const first = data[0];
    return typeof first === "string" ? first.trim() || null : first?.url ?? first?.result ?? null;
  }

  return (
    data.result ||
    data.url ||
    data.image_url ||
    data.imageUrl ||
    data.output ||
    null
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert generated image to a data URL"));
      }
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error("Failed to convert generated image to a data URL"));
    };

    reader.readAsDataURL(blob);
  });
}

export default function ImageGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<Generation[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("image_generations");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  const saveToHistory = (url: string, p: string) => {
    const newGen: Generation = {
      id: Math.random().toString(36).substring(7),
      url,
      prompt: p,
      timestamp: Date.now(),
    };
    const newHistory = [newGen, ...history].slice(0, 20);
    setHistory(newHistory);
    localStorage.setItem("image_generations", JSON.stringify(newHistory));
  };

  const handleGenerate = async (prompt: string, file: File | null, aspectRatio: string, shape: string) => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    
    try {
        const response = await apiRequest("/api/v1/ai/generate/image", {
            method: "POST",
            timeoutMs: 60000,
            body: JSON.stringify({ 
              prompt,
              aspect_ratio: aspectRatio,
              tier: 1,
              provider: "auto" 
            }),
        });

        const contentType = response.headers.get("content-type") || "";
        let imageUrl: string | null = null;

        if (contentType.includes("application/json") || contentType.includes("+json")) {
          const data = await response.json();
          imageUrl = extractImageUrl(data);
        } else if (contentType.startsWith("image/")) {
          const blob = await response.blob();
          imageUrl = await blobToDataUrl(blob);
        } else {
          const text = await response.text();
          try {
            imageUrl = extractImageUrl(JSON.parse(text));
          } catch {
            imageUrl = text.trim() || null;
          }
        }

        if (!imageUrl) {
          throw new Error("No image URL returned from generation response");
        }
        
        setGeneratedImage(imageUrl);
        saveToHistory(imageUrl, prompt);
    } catch (error) {
        console.error("Image generation failed:", error);
        throw error; // Propagate error so CanvasGenerator can show the error screen and retry button
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <CanvasGenerator
      title="ApexVision"
      subtitle="AI IMAGE GENERATOR"
      description="Describe what you want to see..."
      onGenerate={handleGenerate}
      isGenerating={isGenerating}
      history={history}
    >
      {generatedImage ? (
        <div className="relative group max-h-full max-w-full">
          <SkeletonImage className="min-h-[320px] min-w-[280px]">
            <img
              src={generatedImage}
              alt="Generated"
              className="rounded-2xl shadow-2xl transition-transform duration-500 group-hover:scale-[1.01]"
            />
          </SkeletonImage>
          <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
            <ImageIcon className="h-10 w-10 text-foreground/20" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground/70">No image generated yet</h3>
            <p className="text-sm text-foreground/40 max-w-[280px]">
              Enter a prompt on the left to start creating amazing AI art.
            </p>
          </div>
        </div>
      )}
    </CanvasGenerator>
  );
}
