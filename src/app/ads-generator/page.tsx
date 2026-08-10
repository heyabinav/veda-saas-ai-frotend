"use client";

import { useState } from "react";
import CanvasGenerator from "@/components/CanvasGenerator";
import { apiRequest } from "@/lib/api";

function extractText(data: any): string | null {
  if (!data) return null;
  if (typeof data === "string") return data.trim() || null;
  if (Array.isArray(data)) return data[0] && typeof data[0] === "string" ? data[0] : null;
  return (
    data.ad_copy ||
    data.copy ||
    data.content ||
    data.text ||
    data.result ||
    data.output ||
    null
  );
}

export default function AdsGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copy, setCopy] = useState<string | null>(null);

  const handleGenerate = async (prompt: string, file: File | null, aspectRatio: string, shape: string) => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const response = await apiRequest("/api/v1/ai/generate/text-to-text", {
        method: "POST",
        timeoutMs: 60000,
        body: JSON.stringify({
          prompt,
          task: "ad_copy",
          tier: 1,
          provider: "auto",
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      let text: string | null = null;

      if (contentType.includes("application/json") || contentType.includes("+json")) {
        const body = await response.json();
        const nested = body?.data && typeof body.data === "object" ? body.data : body;
        text = extractText(nested);
      } else {
        text = await response.text();
      }

      if (!text) {
        throw new Error("No ad copy returned from generation response");
      }
      setCopy(text.trim());
    } catch (error) {
      console.error("Ads generation failed:", error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <CanvasGenerator
      title="VedaS Ads"
      subtitle="AI APEX ADS GENERATOR"
      description="Enter product details for ad..."
      onGenerate={handleGenerate}
      isGenerating={isGenerating}
      history={[]}
    >
      {copy ? (
        <div className="p-12 text-center">
            <h2 className="text-2xl font-bold mb-4">Ad Copy Preview</h2>
            <p className="text-lg italic text-blue-600">{copy}</p>
        </div>
      ) : (
        <span className="text-foreground/20">Your ad copy will appear here...</span>
      )}
    </CanvasGenerator>
  );
}
