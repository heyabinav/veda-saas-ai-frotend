"use client";

import { useState, useEffect } from "react";
import CanvasGenerator from "@/components/CanvasGenerator";
import { Download, Share2, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Generation = {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
};

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

  const handleGenerate = async (prompt: string) => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    
    try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;

        const response = await fetch("https://vedaapex-m77e.onrender.com/api/v1/generate", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ tool_type: "image-generator", prompt }),
        });
        
        if (!response.ok) throw new Error("Image generation failed");
        
        // Mock result for verification as the backend is a stub
        setTimeout(() => {
            const url = `https://picsum.photos/seed/${Math.random()}/800/800`;
            setGeneratedImage(url);
            saveToHistory(url, prompt);
            setIsGenerating(false);
        }, 2000);
    } catch (error) {
        console.error(error);
        alert("Generation Error");
        setIsGenerating(false);
    }
  };

  return (
    <CanvasGenerator
      title="VedaS Vision"
      subtitle="AI IMAGE GENERATOR"
      description="Describe what you want to see..."
      onGenerate={handleGenerate}
      isGenerating={isGenerating}
      history={history}
    >
      {generatedImage ? (
        <div className="relative group max-h-full max-w-full">
          <img
            src={generatedImage}
            alt="Generated"
            className="rounded-2xl shadow-2xl transition-transform duration-500 group-hover:scale-[1.01]"
          />
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
