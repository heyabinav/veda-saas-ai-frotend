"use client";

import { useState } from "react";
import CanvasGenerator from "@/components/CanvasGenerator";
import { ImageIcon, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { apiRequest } from "@/lib/api";
import { SkeletonImage } from "@/components/ui/skeleton";

export default function BGRemoverPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleRemoveBG = async (prompt: string, file: File | null, aspectRatio: string, shape: string) => {
    if (!file) return alert("Please upload an image");
    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await apiRequest("/api/v1/media-processor/upload/image/background-removal", {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await response.json();
        const outputUrl = data.result || data.url || data.output;
        if (outputUrl) {
          setResult(outputUrl);
          return;
        }
      }

      const blob = await response.blob();
      setResult(URL.createObjectURL(blob));
    } catch (error) {
      console.error("BG removal failed:", error);
      throw error; // Propagate error so CanvasGenerator can show the error screen and retry button
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <CanvasGenerator
      title="VedaS BG Remover"
      subtitle="AI BACKGROUND REMOVER"
      description="Upload image to remove background..."
      onGenerate={handleRemoveBG}
      isGenerating={isGenerating}
      history={[]}
    >
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        {result ? (
          <div className="space-y-4">
            <SkeletonImage className="min-h-[300px] min-w-[200px]">
              <img src={result} alt="Background Removed" className="max-h-[400px] rounded-xl shadow-lg" />
            </SkeletonImage>
            <button className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg" onClick={() => window.open(result)}>
              <Download className="h-4 w-4" /> Download
            </button>
          </div>
        ) : (
          <div className="text-foreground/50">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Upload an image and click Generate to remove background.</p>
          </div>
        )}
      </div>
    </CanvasGenerator>
  );
}
