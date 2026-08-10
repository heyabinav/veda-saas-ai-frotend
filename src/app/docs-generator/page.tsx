"use client";

import { useState } from "react";
import CanvasGenerator from "@/components/CanvasGenerator";
import DocPreview from "@/components/DocPreview";
import { apiRequest } from "@/lib/api";
import { fetchFileBytes, getFileName } from "@/components/PptPreview";

function extractText(data: any): string | null {
  if (!data) return null;
  if (typeof data === "string") return data.trim() || null;
  if (Array.isArray(data)) return data[0] && typeof data[0] === "string" ? data[0] : null;
  return (
    data.content ||
    data.text ||
    data.result ||
    data.output ||
    data.document ||
    null
  );
}

export default function DocsGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [docxSource, setDocxSource] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!docxSource || isDownloading) return;
    setIsDownloading(true);
    try {
      if (docxSource.startsWith("blob:")) {
        const a = document.createElement("a");
        a.href = docxSource;
        a.download = "document.docx";
        a.click();
      } else {
        const bytes = await fetchFileBytes(docxSource);
        const blob = new Blob([bytes], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = getFileName(docxSource);
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      }
    } catch (error) {
      console.error("DOCX download failed:", error);
      window.open(docxSource, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerate = async (prompt: string, file: File | null, aspectRatio: string, shape: string) => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setContent(null);
    setDocxSource(null);
    try {
      const response = await apiRequest("/api/v1/ai/generate/word", {
        method: "POST",
        timeoutMs: 60000,
        body: JSON.stringify({
          prompt,
          format: "docx",
          tier: 1,
          provider: "auto",
        }),
      });

      const contentType = response.headers.get("content-type") || "";
      let text: string | null = null;
      let nextSource: string | null = null;

      if (contentType.includes("application/json") || contentType.includes("+json")) {
        const body = await response.json();
        const nested = body?.data && typeof body.data === "object" ? body.data : body;
        text = extractText(nested);
        const nestedUrl =
          nested.result ||
          nested.url ||
          nested.file_url ||
          nested.download_url ||
          nested.output ||
          null;
        if (typeof nestedUrl === "string" && nestedUrl.startsWith("http")) {
          nextSource = nestedUrl;
        }
      } else if (contentType.startsWith("application/") && contentType.includes("word")) {
        const blob = await response.blob();
        if (blob.size > 0) {
          nextSource = URL.createObjectURL(blob);
        }
      } else {
        text = await response.text();
      }

      setDocxSource(nextSource);
      if (text) {
        setContent(text.trim());
      } else if (!nextSource) {
        throw new Error("No document content returned from generation response");
      }
    } catch (error) {
      console.error("Document generation failed:", error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <CanvasGenerator
      title="VedaS Docs"
      subtitle="AI DOCUMENT GENERATOR"
      description="Enter your document topic..."
      onGenerate={handleGenerate}
      isGenerating={isGenerating}
      history={[]}
      onDownload={handleDownload}
    >
      {content || docxSource ? (
        <DocPreview
          source={docxSource}
          textContent={content}
          onDownload={handleDownload}
        />
      ) : (
        <span className="text-foreground/20">Your document will appear here...</span>
      )}
    </CanvasGenerator>
  );
}
