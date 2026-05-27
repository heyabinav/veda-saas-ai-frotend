"use client";

import { useState } from "react";
import CanvasGenerator from "@/components/CanvasGenerator";

export default function PromptGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);

  const handleGenerate = (prompt: string) => {
    setIsGenerating(true);
    setTimeout(() => {
      setEnhancedPrompt(`Detailed and highly professional prompt for: "${prompt}". 
      Enhancements: Added lighting effects, cinematic depth, 8k resolution, photorealistic textures, and expert composition.`);
      setIsGenerating(false);
    }, 2000);
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
