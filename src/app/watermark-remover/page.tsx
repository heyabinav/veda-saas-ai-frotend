"use client";

import { useState } from "react";
import CanvasGenerator from "@/components/CanvasGenerator";
import { Trash2, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function EraserPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleErase = async (prompt: string, file: File | null) => {
    if (!file) return alert("Please upload a file");
    setIsGenerating(true);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("https://vedaapex-m77e.onrender.com/api/v1/media/watermark/remove", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error("Eraser failed");

      const blob = await response.blob();
      setResult(URL.createObjectURL(blob));
    } catch (error) {
      console.error(error);
      alert("Error removing watermark");
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
