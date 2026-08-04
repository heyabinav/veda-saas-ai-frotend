"use client";

import { useState } from "react";
import CanvasGenerator from "@/components/CanvasGenerator";
import { Trash2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { apiRequest } from "@/lib/api";

export default function EraserPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleErase = async (prompt: string, file: File | null, aspectRatio: string, shape: string) => {
    if (!file) return alert("Please upload a file");
    setIsGenerating(true);

    try {
      const isVideo = file.type.startsWith("video/");
      const uploadEndpoint = isVideo
        ? "/api/v1/media/upload/video"
        : "/api/v1/media/upload/image";

      const uploadFormData = new FormData();
      uploadFormData.append("file", file);
      
      const uploadResponse = await apiRequest(uploadEndpoint, {
        method: "POST",
        body: uploadFormData,
      });
      
      const uploadData = await uploadResponse.json();
      const filename = uploadData.filename || uploadData.name || file.name;

      const removeEndpoint = isVideo
        ? `/api/v1/media/remove-watermark/video?filename=${encodeURIComponent(filename)}&mask_filename=${encodeURIComponent(filename)}&algorithm=telea`
        : `/api/v1/media/remove-watermark/image?filename=${encodeURIComponent(filename)}&mask_filename=${encodeURIComponent(filename)}&algorithm=telea`;
        
      const response = await apiRequest(removeEndpoint, {
        method: "POST",
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
      console.error("Watermark removal failed:", error);
      throw error; // Propagate error so CanvasGenerator can show the error screen and retry button
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <CanvasGenerator
      title="VedaS Eraser"
      subtitle="WATERMARK REMOVER"
      description="Upload file to remove watermark..."
      onGenerate={handleErase}
      isGenerating={isGenerating}
      history={[]}
    >
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        {result ? (
          <div className="space-y-4">
            <img src={result} alt="Cleaned" className="max-h-[400px] rounded-xl shadow-lg" />
            <button className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg" onClick={() => window.open(result)}>
              <Download className="h-4 w-4" /> Download
            </button>
          </div>
        ) : (
          <div className="text-foreground/50">
            <Trash2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>Upload your file and click Generate to remove watermark.</p>
          </div>
        )}
      </div>
    </CanvasGenerator>
  );
}
