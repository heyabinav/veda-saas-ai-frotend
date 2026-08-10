"use client";

import { useState } from "react";
import CanvasGenerator from "@/components/CanvasGenerator";
import { apiRequest } from "@/lib/api";

function extractText(data: any): string | null {
  if (!data) return null;
  if (typeof data === "string") return data.trim() || null;
  if (Array.isArray(data)) return data[0] && typeof data[0] === "string" ? data[0] : null;
  return (
    data.enhanced_prompt ||
    data.prompt ||
    data.result ||
    data.output ||
    data.text ||
    data.content ||
    null
  );
}

export default function PromptGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);

  const handleGenerate = async (prompt: string, file: File | null, aspectRatio: string, shape: string) => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const response = await apiRequest("/api/v1/ai/generate/prompt", {
        method: "POST",
        timeoutMs: 60000,
        body: JSON.stringify({
          prompt,
          style: shape,
          tier: 1,
          provider: "auto",
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      let text: string | null = null;

      if (contentType.includes("application/json") || contentType.includes("+json")) {
        const data = await response.json();
        const nested = data?.data && typeof data.data === "object" ? data.data : data;
        text = extractText(nested);
      } else {
        text = await response.text();
      }

      if (!text) {
        throw new Error("No prompt returned from generation response");
      }
      setEnhancedPrompt(text.trim());
    } catch (error) {
      console.error("Prompt generation failed:", error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <CanvasGenerator
      title="VedaS Prompt Master"
      subtitle="AI PROMPT GENERATOR"
      description="Enter a simple base concept..."
      onGenerate={handleGenerate}
      isGenerating={isGenerating}
      history={[]}
    >
      {enhancedPrompt ? (
        <div className="p-8 text-sm text-foreground/80 bg-black/5 rounded-xl w-full mx-4">
            <p className="font-semibold mb-2">Enhanced Prompt:</p>
            <p className="italic">{enhancedPrompt}</p>
        </div>
      ) : (
        <span className="text-foreground/20">Your enhanced prompt will appear here...</span>
      )}
    </CanvasGenerator>
  );
}
