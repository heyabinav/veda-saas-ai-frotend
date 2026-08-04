"use client";

import { useState } from "react";
import CanvasGenerator from "@/components/CanvasGenerator";
import { Sparkles, Download, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { apiRequest } from "@/lib/api";

export default function EnhancerPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleEnhance = async (prompt: string, file: File | null, aspectRatio: string, shape: string) => {
    if (!file) return alert("Please upload a file");
    setIsGenerating(true);

    try {
      const isVideo = file.type.startsWith("video/");
      const endpoint = isVideo 
        ? "/api/v1/media-processor/upload/video/enhance"
        : "/api/v1/media-processor/upload/image/enhance";

      const formData = new FormData();
      formData.append("file", file);
      
      const response = await apiRequest(endpoint, {
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
      console.error("Enhancement failed:", error);
      throw error; // Propagate error so CanvasGenerator can show the error screen and retry button
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <CanvasGenerator
      title="VedaS Enhancer"
      subtitle="AI IMAGE & VIDEO ENHANCER"
      description="Upload your media to enhance quality..."
      onGenerate={handleEnhance}
      isGenerating={isGenerating}
      history={[]}
    >
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        {result ? (
          <div className="space-y-4">
            <img src={result} alt="Enhanced" className="max-h-[400px] rounded-xl shadow-lg" />
            <button className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg" onClick={() => window.open(result)}>
              <Download className="h-4 w-4" /> Download
            </button>
          </div>
        ) : (
          <div className="text-foreground/50">
            <Sparkles className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Upload your file and click Generate to enhance.</p>
          </div>
        )}
      </div>
    </CanvasGenerator>
  );
}
