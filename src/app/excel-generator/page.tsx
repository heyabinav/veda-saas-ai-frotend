"use client";

import { useState } from "react";
import CanvasGenerator from "@/components/CanvasGenerator";

export default function ExcelGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [data, setData] = useState<string[][] | null>(null);

  const handleGenerate = (prompt: string, file: File | null, aspectRatio: string, shape: string) => {
    setIsGenerating(true);
    setTimeout(() => {
      setData([
        ["Item", "Quantity", "Price"],
        ["Product A", "10", "$5.00"],
        ["Product B", "20", "$10.00"],
      ]);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <CanvasGenerator
      title="VedaS Sheets"
      subtitle="AI EXCEL GENERATOR"
      description="Enter your data requirements..."
      onGenerate={handleGenerate}
      isGenerating={isGenerating}
      history={[]}
    >
      {data ? (
        <table className="w-full text-sm border-collapse">
          {data.map((row, i) => (
            <tr key={i} className="border-b border-black/5">
              {row.map((cell, j) => <td key={j} className="p-3 border-r border-black/5">{cell}</td>)}
            </tr>
          ))}
        </table>
      ) : (
        <span className="text-foreground/20">Your data sheet will appear here...</span>
      )}
    </CanvasGenerator>
  );
}
