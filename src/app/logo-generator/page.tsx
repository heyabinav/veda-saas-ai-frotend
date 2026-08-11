"use client";

import { useState } from "react";
import CanvasGenerator from "@/components/CanvasGenerator";
import { apiRequest } from "@/lib/api";
import { SkeletonImage } from "@/components/ui/skeleton";

export default function LogoGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  const handleGenerate = async (prompt: string, file: File | null, aspectRatio: string, shape: string) => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const response = await apiRequest("/api/v1/ai/generate/logo", {
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
      let logoUrl: string | null = null;

      if (contentType.includes("application/json") || contentType.includes("+json")) {
        const data = await response.json();
        const nested = data?.data && typeof data.data === "object" ? data.data : data;
        logoUrl =
          nested.result ||
          nested.url ||
          nested.image_url ||
          nested.imageUrl ||
          nested.output ||
          null;
      } else if (contentType.startsWith("image/")) {
        const blob = await response.blob();
        logoUrl = URL.createObjectURL(blob);
      } else {
        const text = await response.text();
        try {
          const data = JSON.parse(text);
          logoUrl =
            data.result || data.url || data.image_url || data.output || null;
        } catch {
          logoUrl = text.trim() || null;
        }
      }

      if (!logoUrl) {
        throw new Error("No logo URL returned from generation response");
      }
      setUrl(logoUrl);
    } catch (error) {
      console.error("Logo generation failed:", error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <CanvasGenerator
      title="VedaS Branding"
      subtitle="AI LOGO GENERATOR"
      description="Enter your brand concept..."
      onGenerate={handleGenerate}
      isGenerating={isGenerating}
      history={[]}
    >
      {url ? (
        <SkeletonImage className="h-64 w-64">
          <img src={url} alt="Logo" className="h-64 w-64 rounded-xl shadow-lg" />
        </SkeletonImage>
      ) : (
        <span className="text-foreground/20">Your logo will appear here...</span>
      )}
    </CanvasGenerator>
  );
}
