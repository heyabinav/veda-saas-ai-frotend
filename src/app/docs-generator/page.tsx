"use client";

import { useState } from "react";
import CanvasGenerator from "@/components/CanvasGenerator";

export default function DocsGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState<string | null>(null);

  const handleGenerate = (prompt: string) => {
    setIsGenerating(true);
    setTimeout(() => {
      setContent(`Generated Doc Content for: ${prompt}\n\n1. Introduction\n2. Key Findings\n3. Conclusion`);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <CanvasGenerator
      title="VedaS Docs"
      subtitle="AI DOCUMENT GENERATOR"
      description="Enter your document topic..."
      onGenerate={handleGenerate}
      isGenerating={isGenerating}
      history={[]}
    >
      {content ? (
        <div className="p-8 whitespace-pre-line text-sm text-foreground/80">{content}</div>
      ) : (
        <span className="text-foreground/20">Your document will appear here...</span>
      )}
    </CanvasGenerator>
  );
}
