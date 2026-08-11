"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { init } from "pptx-preview";
import type { PPTXPreviewer } from "pptx-preview/dist/previewer/PPTXPreviewer";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Download,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function fetchAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const match = document.cookie
      .split("; ")
      .find((c) => c.startsWith("auth_token="));
    if (match) {
      return decodeURIComponent(match.slice("auth_token=".length));
    }
  } catch {
    // ignore
  }
  try {
    return (
      localStorage.getItem("accessToken") || localStorage.getItem("token") || null
    );
  } catch {
    return null;
  }
}

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_BASE_URL || "https://vedaapex-saas-ai.onrender.com").replace(/\/$/, "");

export async function fetchFileBytes(source: string): Promise<ArrayBuffer> {
  const token = fetchAuthToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  if (source.startsWith("blob:")) {
    const res = await fetch(source);
    if (!res.ok) throw new Error("Failed to read generated file");
    return res.arrayBuffer();
  }

  try {
    const res = await fetch(source, { headers });
    if (res.ok) return await res.arrayBuffer();
  } catch {
    // fall through to proxy attempt
  }

  try {
    const u = new URL(source);
    if (u.origin === API_ORIGIN) {
      const res = await fetch(`/api/proxy${u.pathname}${u.search}`, { headers });
      if (res.ok) return await res.arrayBuffer();
    }
  } catch {
    // fall through
  }

  throw new Error("Could not load the generated file for preview");
}

export function getFileName(base: string): string {
  try {
    const u = new URL(base);
    const name = u.pathname.split("/").pop();
    if (name && name.includes(".")) return name;
  } catch {
    // not a URL
  }
  return base.split("/").pop() || "presentation.pptx";
}

export default function PptPreview({
  source,
  onDownload,
}: {
  source: string;
  onDownload: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<PPTXPreviewer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [total, setTotal] = useState(0);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!scaleRef.current) return;
    const el = scaleRef.current;
    const observer = new ResizeObserver(() => {
      setScale(Math.min(1, el.clientWidth / 1280));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let viewer: PPTXPreviewer | null = null;

    async function render() {
      if (!containerRef.current) return;
      setLoading(true);
      setError(null);
      try {
        const bytes = await fetchFileBytes(source);
        if (cancelled) return;
        viewer = init(containerRef.current, {
          width: 1280,
          height: 720,
          mode: "slide",
        });
        viewerRef.current = viewer;
        await viewer.preview(bytes);
        containerRef.current
          .querySelectorAll(".pptx-preview-wrapper-next, .pptx-preview-wrapper-pagination")
          .forEach((el) => el.remove());
        if (cancelled) return;
        setCurrent(viewer.currentIndex + 1);
        setTotal(viewer.slideCount);
      } catch (err: any) {
        console.error("PPT preview failed:", err);
        if (!cancelled) setError(err.message || "Failed to render preview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    render();

    return () => {
      cancelled = true;
      viewerRef.current = null;
      try {
        viewer?.destroy();
      } catch {
        // ignore destroy errors
      }
    };
  }, [source]);

  const goTo = useCallback(
    (next: number) => {
      const viewer = viewerRef.current;
      if (!viewer || !total) return;
      if (next < 1 || next > total) return;
      viewer.renderSingleSlide(next - 1);
      setCurrent(next);
    },
    [total]
  );

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="flex-1 overflow-auto flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 p-3 lg:p-6">
        {loading ? (
          <div className="flex w-full flex-col items-center gap-4" aria-busy="true">
            <div className="relative aspect-[16/9] w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-2xl">
              <Skeleton rounded="none" className="absolute inset-0" />
              <div className="absolute inset-0 p-10 sm:p-14 space-y-6">
                <Skeleton rounded="sm" className="h-6 w-2/5" />
                <div className="space-y-3">
                  <Skeleton rounded="sm" className="h-3.5 w-3/4" />
                  <Skeleton rounded="sm" className="h-3.5 w-2/3" />
                  <Skeleton rounded="sm" className="h-3.5 w-5/6" />
                  <Skeleton rounded="sm" className="h-3.5 w-1/2" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground/50">
              <Loader2 className="h-4 w-4 animate-spin" />
              <p>Rendering slides...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 text-center max-w-sm">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={onDownload}
              className="flex items-center gap-2 bg-foreground text-white px-5 py-2 rounded-lg text-sm hover:opacity-90"
            >
              <Download className="h-4 w-4" /> Download .pptx
            </button>
          </div>
        ) : (
          <div ref={scaleRef} className="w-full flex justify-center overflow-hidden">
            <div
              className="shadow-2xl rounded-lg bg-white overflow-hidden shrink-0"
              style={{ width: Math.round(1280 * scale), height: Math.round(720 * scale) }}
            >
              <div
                className="origin-top-left"
                style={{ transform: `scale(${scale})`, width: 1280, height: 720 }}
              >
                <div ref={containerRef} className="pptx-preview-root" />
              </div>
            </div>
          </div>
        )}
      </div>

      {!loading && !error && total > 0 && (
        <div className="flex items-center justify-center gap-4 px-4 py-3 border-t border-black/5 bg-white">
          <button
            onClick={() => goTo(current - 1)}
            disabled={current <= 1}
            className="flex items-center gap-1 rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium text-foreground/70 hover:bg-black/5 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </button>
          <span className="text-sm text-foreground/60 tabular-nums">
            Slide {current} of {total}
          </span>
          <button
            onClick={() => goTo(current + 1)}
            disabled={current >= total}
            className="flex items-center gap-1 rounded-lg border border-black/10 px-3 py-1.5 text-sm font-medium text-foreground/70 hover:bg-black/5 disabled:opacity-40"
          >
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
