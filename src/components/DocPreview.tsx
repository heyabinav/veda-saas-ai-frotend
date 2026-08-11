"use client";

import { useRef, useState, useEffect } from "react";
import { renderAsync } from "docx-preview";
import { Loader2, AlertCircle, Download, FileText } from "lucide-react";
import { fetchFileBytes, getFileName } from "./PptPreview";
import { Skeleton } from "@/components/ui/skeleton";

export default function DocPreview({
  source,
  textContent,
  onDownload,
}: {
  source: string | null;
  textContent: string | null;
  onDownload: () => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLStyleElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderDocx() {
      if (!source) return;
      if (!bodyRef.current || !styleRef.current) return;
      setLoading(true);
      setError(null);
      try {
        const bytes = await fetchFileBytes(source);
        if (cancelled) return;
        if (bodyRef.current) bodyRef.current.innerHTML = "";
        if (styleRef.current) styleRef.current.textContent = "";
        await renderAsync(bytes, bodyRef.current, styleRef.current, {
          inWrapper: true,
          ignoreWidth: false,
          ignoreHeight: false,
          breakPages: true,
        });
      } catch (err: any) {
        console.error("DOCX preview failed:", err);
        if (!cancelled) setError(err.message || "Failed to render document");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    renderDocx();

    return () => {
      cancelled = true;
    };
  }, [source]);

  if (textContent) {
    return (
      <div className="w-full h-full overflow-auto bg-[#EDE7DA] p-4 sm:p-8">
        <div className="mx-auto max-w-3xl bg-white shadow-lg rounded-sm p-6 sm:p-12 min-h-full">
          <div className="whitespace-pre-line text-sm sm:text-base leading-relaxed text-gray-800 font-serif">
            {textContent}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 h-full bg-[#EDE7DA] p-4 sm:p-8" aria-busy="true">
        <div className="w-full max-w-3xl bg-white shadow-lg rounded-sm min-h-full">
          <div className="p-6 sm:p-12 space-y-5">
            <Skeleton rounded="sm" className="h-7 w-1/2" />
            <Skeleton rounded="sm" className="h-4 w-full" />
            <Skeleton rounded="sm" className="h-4 w-11/12" />
            <Skeleton rounded="sm" className="h-4 w-4/5" />
            <Skeleton rounded="sm" className="h-4 w-full" />
            <Skeleton rounded="sm" className="h-4 w-2/3" />
            <Skeleton rounded="sm" className="h-4 w-9/12" />
            <Skeleton rounded="sm" className="h-4 w-3/4" />
            <Skeleton rounded="sm" className="h-4 w-1/2" />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-foreground/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p>Rendering document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center h-full p-6">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="text-sm text-red-500">{error}</p>
        <button
          onClick={onDownload}
          className="flex items-center gap-2 bg-foreground text-white px-5 py-2 rounded-lg text-sm hover:opacity-90"
        >
          <Download className="h-4 w-4" /> Download .docx
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#EDE7DA] p-4 sm:p-8 overflow-auto">
      <div className="mx-auto max-w-3xl bg-white shadow-lg rounded-sm min-h-full">
        <style ref={styleRef} />
        <div ref={bodyRef} className="p-6 sm:p-12" />
      </div>
    </div>
  );
}
