"use client";

import { useState } from "react";
import CanvasGenerator from "@/components/CanvasGenerator";

export default function LogoGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [url, setUrl] = useState<string | null>(null);

  const handleGenerate = (prompt: string) => {
    setIsGenerating(true);
    setTimeout(() => {
      setUrl("https://picsum.photos/seed/logo/400/400");
      setIsGenerating(false);
    }, 2000);
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
        <img src={url} alt="Logo" className="h-64 w-64 rounded-xl shadow-lg" />
      ) : (
        <span className="text-foreground/20">Your logo will appear here...</span>
      )}
    </CanvasGenerator>
  );
}
