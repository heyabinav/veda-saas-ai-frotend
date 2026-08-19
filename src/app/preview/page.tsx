"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ExternalLink, Copy, Check, Download } from "lucide-react";

const STORAGE_KEY = "vedaapex_preview_html";

function decodeSrc(raw: string | null): string {
  if (raw) {
    try {
      const b64 = raw.replace(/-/g, "+").replace(/_/g, "/");
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder().decode(bytes);
    } catch {
      // fall through to localStorage
    }
  }
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function PreviewPageInner() {
  const searchParams = useSearchParams();
  const [copied, setCopied] = useState(false);
  const html = useMemo(() => decodeSrc(searchParams.get("src")), [searchParams]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  };

  const handleOpenInNewTab = () => {
    try {
      const blob = new Blob([html], { type: "text/html" });
      window.open(URL.createObjectURL(blob), "_blank");
    } catch {
      // blob URLs unavailable
    }
  };

  const handleDownload = () => {
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "preview.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="flex h-screen w-full flex-col bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-black/10 px-4 py-2.5">
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-foreground/70 hover:bg-black/5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <span className="truncate text-sm font-semibold text-foreground/80">
          Live Preview
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleOpenInNewTab}
            title="Open in new tab"
            className="flex items-center gap-1.5 rounded-lg border border-black/10 px-2.5 py-1.5 text-xs font-medium text-foreground/70 hover:bg-black/5 transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            New tab
          </button>
          <button
            onClick={handleCopy}
            title="Copy code"
            className="flex items-center gap-1.5 rounded-lg border border-black/10 px-2.5 py-1.5 text-xs font-medium text-foreground/70 hover:bg-black/5 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={handleDownload}
            title="Download HTML"
            className="flex items-center gap-1.5 rounded-lg bg-foreground px-2.5 py-1.5 text-xs font-medium text-white hover:opacity-90 transition-opacity"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        {html.trim() ? (
          <iframe
            srcDoc={html}
            title="Live preview"
            className="h-full w-full border-0"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-foreground/50">
              No code to preview. Generate some HTML from the chat first.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-white" />}>
      <PreviewPageInner />
    </Suspense>
  );
}