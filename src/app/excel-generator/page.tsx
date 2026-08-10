"use client";

import { useState } from "react";
import CanvasGenerator from "@/components/CanvasGenerator";
import { apiRequest } from "@/lib/api";

function extractSpreadsheet(data: any): string[][] | null {
  if (!data) return null;
  if (Array.isArray(data) && Array.isArray(data[0])) return data as string[][];
  if (Array.isArray(data?.rows) && Array.isArray(data.rows[0])) return data.rows as string[][];
  if (Array.isArray(data?.data)) {
    if (Array.isArray(data.data[0])) return data.data as string[][];
    if (typeof data.data[0] === "object") {
      const headers = Object.keys(data.data[0]);
      return [
        headers,
        ...data.data.map((row: Record<string, unknown>) => headers.map((h) => String(row[h] ?? ""))),
      ];
    }
  }
  return null;
}

export default function ExcelGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [data, setData] = useState<string[][] | null>(null);

  const handleGenerate = async (prompt: string, file: File | null, aspectRatio: string, shape: string) => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const response = await apiRequest("/api/v1/ai/generate/excel", {
        method: "POST",
        timeoutMs: 60000,
        body: JSON.stringify({
          prompt,
          tier: 1,
          provider: "auto",
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      let rows: string[][] | null = null;

      if (contentType.includes("application/json") || contentType.includes("+json")) {
        const body = await response.json();
        const nested = body?.data && typeof body.data === "object" ? body.data : body;
        rows = extractSpreadsheet(nested);
      } else {
        const text = await response.text();
        try {
          rows = extractSpreadsheet(JSON.parse(text));
        } catch {
          // not JSON, ignore
        }
      }

      if (!rows) {
        throw new Error("No spreadsheet data returned from generation response");
      }
      setData(rows);
    } catch (error) {
      console.error("Excel generation failed:", error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
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
