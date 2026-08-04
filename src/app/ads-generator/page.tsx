"use client";

import { useState } from "react";
import CanvasGenerator from "@/components/CanvasGenerator";

export default function AdsGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [copy, setCopy] = useState<string | null>(null);

  const handleGenerate = (prompt: string, file: File | null, aspectRatio: string, shape: string) => {
    setIsGenerating(true);
    setTimeout(() => {
      setCopy(`🚀 Boost your sales with ${prompt}! Limited time offer - 50% OFF!`);
      setIsGenerating(false);
    }, 2000);
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
