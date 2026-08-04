"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/integrations/supabase/client";
import {
  Settings,
  Code,
  CheckCircle2,
  Loader2,
  Copy,
  Check,
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Eye,
  Files,
  RefreshCw,
  Monitor,
  Tablet,
  Smartphone,
  PenLine,
  ChevronRight,
} from "lucide-react";
import ApexCodeSearchBar from "@/components/ApexCodeSearchBar";
import CodeSyntaxLine from "@/components/CodeSyntaxLine";
import { THINKING_MESSAGES } from "@/lib/thinking-messages";

/* ─── types ─── */
type GeneratedFile = { path: string; content: string };

type TreeNode = {
  name: string;
  path: string;
  type: "file" | "folder";
  children?: TreeNode[];
};

/* ─── constants ─── */
const APP_BUILD_SYSTEM_PROMPT = `You are an expert full-stack developer. Build a complete, production-quality web application based on the user's prompt.

Respond with ONLY a single valid JSON object (no markdown fences, no commentary, nothing else). The JSON shape is exactly:
{
  "files": {
    "index.html": "complete self-contained HTML page with inline <style> and <script>",
    "src/App.js": "main application logic",
    "README.md": "short project overview"
  }
}

Rules:
- "index.html" is REQUIRED and must be a complete, self-contained, working HTML page with inline styles and scripts.
- It must render a beautiful, modern, fully interactive UI matching the user's prompt (gradients, glassmorphism, responsive layout, nice typography).
- Every file value must be plain text code with all quotes and special characters escaped so the whole response is valid JSON.
- Do not include any text outside the JSON object.`;

const buildCodePreview = (prompt: string) => `// Generated Application Component
import React from 'react';

export default function AppWorkspace() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-bold">App Workspace</h1>
      <p className="text-slate-400 mt-2">${prompt}</p>
    </div>
  );
}`;

const buildFallbackHtml = (prompt: string) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>App Workspace</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { min-height: 100vh; display: flex; align-items: center; justify-content: center;
         background: #0f172a; color: #fff; font-family: system-ui, sans-serif; padding: 24px; }
  .card { max-width: 560px; text-align: center; }
  .badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 999px;
           background: rgba(59,130,246,.15); color: #93c5fd; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
  h1 { font-size: 32px; margin-bottom: 10px; background: linear-gradient(90deg,#3b82f6,#8b5cf6);
       -webkit-background-clip: text; background-clip: text; color: transparent; }
  p { color: #94a3b8; font-size: 15px; line-height: 1.6; }
</style>
</head>
<body>
  <div class="card">
    <span class="badge">&#9889; AI Generated</span>
    <h1>App Workspace</h1>
    <p>${prompt}</p>
  </div>
</body>
</html>`;

const STORAGE_KEY = "apexcode_active_prompt";

/* ─── helpers ─── */
function extractJsonObject(text: string): any {
  const cleaned = text.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

function buildTree(files: GeneratedFile[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const file of files) {
    const parts = file.path.split("/").filter(Boolean);
    let level = root;
    let acc = "";
    parts.forEach((part, i) => {
      acc = acc ? `${acc}/${part}` : part;
      const isLast = i === parts.length - 1;
      let node = level.find(
        (n) => n.name === part && n.type === (isLast ? "file" : "folder")
      );
      if (!node) {
        node = {
          name: part,
          path: acc,
          type: isLast ? "file" : "folder",
          children: isLast ? undefined : [],
        };
        level.push(node);
      }
      if (!isLast && node.children) level = node.children;
    });
  }
  return root;
}

const FILE_ICONS: Record<string, any> = {
  ".html": FileCode,
  ".js": FileCode,
  ".jsx": FileCode,
  ".ts": FileCode,
  ".tsx": FileCode,
  ".css": FileCode,
  ".json": FileCode,
  ".md": FileText,
};

function iconForPath(path: string) {
  const ext = "." + path.split(".").pop()?.toLowerCase();
  return FILE_ICONS[ext] ?? FileCode;
}

/* ─── File tree item (dark theme) ─── */
function TreeItem({
  node,
  depth,
  activePath,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  activePath: string | null;
  onSelect: (path: string) => void;
}) {
  const [open, setOpen] = useState(depth < 2);
  const isActive = node.type === "file" && node.path === activePath;

  if (node.type === "folder") {
    const FolderIcon = open ? FolderOpen : Folder;
    return (
      <div>
        <button
          onClick={() => setOpen((v) => !v)}
          style={{ paddingLeft: 10 + depth * 14 }}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] font-medium text-[#94a3b8] hover:bg-white/[0.04] hover:text-[#e2e8f0] transition-colors"
        >
          <ChevronRight
            className={`h-3 w-3 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
          />
          <FolderIcon className="h-4 w-4 shrink-0 text-[#60a5fa]" />
          <span className="truncate">{node.name}</span>
        </button>
        {open &&
          node.children?.map((child) => (
            <TreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              activePath={activePath}
              onSelect={onSelect}
            />
          ))}
      </div>
    );
  }

  const FileIcon = iconForPath(node.path);
  const ext = node.name.split(".").pop()?.toLowerCase();
  const iconColor =
    ext === "html"
      ? "text-orange-400"
      : ext === "js" || ext === "jsx"
        ? "text-yellow-400"
        : ext === "ts" || ext === "tsx"
          ? "text-blue-400"
          : ext === "css"
            ? "text-purple-400"
            : ext === "md"
              ? "text-[#94a3b8]"
              : "text-[#64748b]";

  return (
    <button
      onClick={() => onSelect(node.path)}
      style={{ paddingLeft: 10 + depth * 14 }}
      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition-all duration-150 ${
        isActive
          ? "bg-[#7c3aed]/15 text-[#c4b5fd] font-semibold"
          : "text-[#94a3b8] hover:bg-white/[0.04] hover:text-[#e2e8f0]"
      }`}
    >
      <FileIcon
        className={`h-4 w-4 shrink-0 ${isActive ? "text-[#a78bfa]" : iconColor}`}
      />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

/* ─── Typing dots ─── */
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-label="AI is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot"
          style={{
            animationDelay: `${i * 160}ms`,
            background: "#a78bfa",
          }}
        />
      ))}
    </span>
  );
}

/* ══════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ══════════════════════════════════════════════ */
export default function ApexCodePage() {
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [buildStep, setBuildStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [filesOpen, setFilesOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(420);
  const [viewMode, setViewMode] = useState<"code" | "preview">("code");
  const [previewKey, setPreviewKey] = useState(0);
  const [device, setDevice] = useState<"laptop" | "tablet" | "phone">("laptop");
  const isResizing = useRef(false);
  const [typingMessage, setTypingMessage] = useState(THINKING_MESSAGES[0]);
  const [typedCode, setTypedCode] = useState("");
  const [responseText, setResponseText] = useState("");
  const [filesVisible, setFilesVisible] = useState(false);
  const codeTypeTimerRef = useRef<number | null>(null);

  /* ─── Restore from session ─── */
  useEffect(() => {
    try {
      const nav = window.performance.getEntriesByType("navigation")[0] as
        | PerformanceNavigationTiming
        | undefined;
      if (nav && nav.type === "reload") {
        sessionStorage.removeItem(STORAGE_KEY);
        return;
      }
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as {
          prompt: string;
          files?: GeneratedFile[];
          activeFile?: string | null;
        };
        if (parsed?.prompt) {
          setActivePrompt(parsed.prompt);
          if (parsed.files?.length) {
            setGeneratedFiles(parsed.files);
            setActiveFile(parsed.activeFile ?? parsed.files[0].path);
          }
          setBuildStep(3);
        }
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  /* ─── Rotating thinking message ─── */
  useEffect(() => {
    if (!isGenerating) return;
    let index = Math.floor(Math.random() * THINKING_MESSAGES.length);
    setTypingMessage(THINKING_MESSAGES[index]);
    const interval = window.setInterval(() => {
      index = (index + 1) % THINKING_MESSAGES.length;
      setTypingMessage(THINKING_MESSAGES[index]);
    }, 2400);
    return () => window.clearInterval(interval);
  }, [isGenerating]);

  /* ─── Typewriter effect ─── */
  useEffect(() => {
    if (!activeFile) return;
    const file = generatedFiles.find((f) => f.path === activeFile);
    if (!file) return;
    const full = file.content;
    if (codeTypeTimerRef.current !== null) {
      window.clearInterval(codeTypeTimerRef.current);
      codeTypeTimerRef.current = null;
    }
    setTypedCode("");
    let i = 0;
    const step = Math.max(1, Math.ceil(full.length / 300));
    const interval = window.setInterval(() => {
      i += step;
      setTypedCode(full.slice(0, i));
      if (i >= full.length) {
        window.clearInterval(interval);
        codeTypeTimerRef.current = null;
      }
    }, 14);
    codeTypeTimerRef.current = interval;
    return () => {
      if (codeTypeTimerRef.current !== null) {
        window.clearInterval(codeTypeTimerRef.current);
        codeTypeTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFile]);

  /* ─── AI response reveal (line by line) ─── */
  useEffect(() => {
    if (generatedFiles.length === 0 || isGenerating) return;
    const full = `Generated ${generatedFiles.length} files successfully. Check the code editor →`;
    setResponseText("");
    setFilesVisible(false);
    let i = 0;
    const interval = window.setInterval(() => {
      i += 2;
      setResponseText(full.slice(0, i));
      if (i >= full.length) {
        window.clearInterval(interval);
        setFilesVisible(true);
      }
    }, 20);
    return () => window.clearInterval(interval);
  }, [generatedFiles, isGenerating]);

  /* ─── Resize handler ─── */
  const startResize = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    const onMove = (ev: PointerEvent) => {
      if (!isResizing.current) return;
      const next = Math.min(640, Math.max(300, startWidth + (ev.clientX - startX)));
      setSidebarWidth(next);
    };

    const onUp = () => {
      isResizing.current = false;
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  /* ─── Generate app ─── */
  const generateApp = async (promptText: string) => {
    setBuildStep(1);
    setIsGenerating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          message: promptText,
          model: "Apex_2.2(High)",
          intent: "build_app",
          responseMode: "raw",
          system_prompt: APP_BUILD_SYSTEM_PROMPT,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error ?? "AI request failed");

      const raw =
        typeof data?.response === "string"
          ? data.response
          : typeof data?.assistant_response === "string"
            ? data.assistant_response
            : "";
      const parsed = extractJsonObject(raw);
      const filesMap = parsed?.files;
      let files: GeneratedFile[] = [];
      if (filesMap && typeof filesMap === "object") {
        files = Object.entries(filesMap)
          .filter(([, content]) => typeof content === "string")
          .map(([path, content]) => ({ path, content: content as string }));
      }
      if (files.length === 0) {
        throw new Error("Model did not return valid application files");
      }
      setGeneratedFiles(files);
      setActiveFile(files.find((f) => f.path.endsWith(".html"))?.path ?? files[0].path);
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ prompt: promptText, files, activeFile: files[0].path })
      );
    } catch (error: any) {
      console.error("App generation failed", error);
      const fallback: GeneratedFile[] = [
        { path: "index.html", content: buildFallbackHtml(promptText) },
        { path: "src/App.js", content: buildCodePreview(promptText) },
      ];
      setGeneratedFiles(fallback);
      setActiveFile("index.html");
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ prompt: promptText, files: fallback, activeFile: "index.html" })
      );
    } finally {
      setBuildStep(3);
      setIsGenerating(false);
    }
  };

  const handleGenerate = (promptText: string) => {
    setActivePrompt(promptText);
    setGeneratedFiles([]);
    setActiveFile(null);
    setViewMode("code");
    setBuildStep(1);
    setTypedCode("");
    setResponseText("");
    setFilesVisible(false);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ prompt: promptText }));
    setTimeout(() => setBuildStep(2), 900);
    generateApp(promptText);
  };

  const resetApp = () => {
    setActivePrompt(null);
    setBuildStep(0);
    setGeneratedFiles([]);
    setActiveFile(null);
    setViewMode("code");
    setTypedCode("");
    setResponseText("");
    setFilesVisible(false);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const tree = useMemo(() => buildTree(generatedFiles), [generatedFiles]);

  const activeFileContent = useMemo(
    () => generatedFiles.find((f) => f.path === activeFile)?.content ?? "",
    [generatedFiles, activeFile]
  );

  const previewHtml = useMemo(() => {
    const htmlFile = generatedFiles.find((f) =>
      f.path.toLowerCase().endsWith(".html")
    );
    if (htmlFile) return htmlFile.content;
    return buildFallbackHtml(activePrompt ?? "App Workspace");
  }, [generatedFiles, activePrompt]);

  const displayedCode = typedCode || activeFileContent;

  const copyActiveFile = async () => {
    try {
      await navigator.clipboard.writeText(displayedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable
    }
  };

  /* ══════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════ */
  return (
    <div className="h-screen w-full bg-[#0a0a14] relative overflow-hidden">
      {/* ─── HERO (no prompt yet) ─── */}
      {!activePrompt ? (
        <div className="h-full w-full flex flex-col items-center justify-center px-4 md:px-6 relative">
          {/* Subtle background gradient orbs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-[#7c3aed]/[0.06] blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-[#3b82f6]/[0.06] blur-[100px]" />
          </div>

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8 relative z-10">
            <div className="relative h-12 w-12">
              <Image
                src="/proper_octopus_transparent.png"
                alt="ApexCode logo"
                fill
                sizes="48px"
                className="object-contain"
              />
            </div>
            <span className="bg-gradient-to-r from-[#a78bfa] via-[#60a5fa] to-[#34d399] bg-clip-text text-3xl md:text-4xl font-bold tracking-tight text-transparent">
              ApexCode
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#e2e8f0] font-sans mb-3 text-center relative z-10">
            What do you want to build?
          </h1>
          <p className="text-[#64748b] text-base mb-8 text-center relative z-10">
            Describe your app and ApexCode will generate it instantly
          </p>

          <div className="relative z-10 w-full max-w-[720px]">
            <ApexCodeSearchBar onGenerate={handleGenerate} />
          </div>
        </div>
      ) : (
        /* ─── WORKSPACE (two-panel layout) ─── */
        <div className="flex h-full w-full overflow-hidden">
          {/* ═══ LEFT PANEL — Chat / Prompt ═══ */}
          <aside
            style={{ width: sidebarWidth, maxWidth: "100%" }}
            className="flex shrink-0 flex-col border-r border-white/[0.06] overflow-hidden"
            // Dark gradient background
          >
            {/* Panel background */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f0f23] via-[#0d0d1f] to-[#0a0a18]" style={{ width: sidebarWidth, position: 'absolute', top: 0, bottom: 0, left: 0 }} />

            {/* Header */}
            <div className="relative z-10 flex items-center gap-2.5 px-5 pt-5 pb-3">
              <div className="relative h-9 w-9">
                <Image
                  src="/proper_octopus_transparent.png"
                  alt="ApexCode logo"
                  fill
                  sizes="36px"
                  className="object-contain"
                />
              </div>
              <span className="bg-gradient-to-r from-[#a78bfa] via-[#60a5fa] to-[#34d399] bg-clip-text text-xl font-bold tracking-tight text-transparent">
                ApexCode
              </span>
            </div>

            {/* Scrollable chat area */}
            <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-3 pt-3">
              {/* User prompt bubble — right side */}
              <div className="apexcode-fade-in flex justify-end">
                <div className="flex max-w-[85%] flex-col items-end">
                  <span className="mb-1 text-[11px] font-medium text-[#64748b]">
                    You
                  </span>
                  <div className="px-1 py-2">
                    <p className="text-[13px] text-[#e2e8f0] leading-relaxed text-right">{activePrompt}</p>
                  </div>
                </div>
              </div>

              {/* AI Thinking animation — left side */}
              {isGenerating && (
                <div className="apexcode-fade-in mt-5">
                  <div className="flex items-start">
                      <div className="max-w-[85%]">
                        <span className="mb-1 block text-[11px] font-medium text-[#64748b] pt-0.5">ApexCode AI</span>
                        <div className="px-1 py-2">
                          <TypingDots />
                          <p className="mt-2 text-[11px] text-[#64748b] leading-snug">
                            {typingMessage}
                          </p>
                        </div>
                      </div>
                  </div>
                </div>
              )}

              {/* Generation complete — left side */}
              {generatedFiles.length > 0 && !isGenerating && (
                <div className="mt-5">
                  <div className="flex items-start">
                    <div className="max-w-[85%]">
                      <span className="mb-1 block text-[11px] font-medium text-[#64748b] pt-0.5">ApexCode AI</span>
                      <div className="px-1 py-2">
                        <p className="flex items-center gap-1.5 text-[13px] text-[#e2e8f0] leading-relaxed">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                          <span>{responseText}</span>
                          {!filesVisible && (
                            <span className="inline-block h-4 w-[2px] bg-[#a78bfa] caret-blink ml-0.5 rounded-full" />
                          )}
                        </p>
                        {filesVisible && (
                          <div className="flex flex-col gap-1.5 mt-3">
                            {generatedFiles.map((f, i) => (
                              <button
                                key={f.path}
                                onClick={() => setActiveFile(f.path)}
                                style={{ animationDelay: `${i * 250}ms` }}
                                className={`apexcode-fade-in flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-[12px] font-mono transition-colors ${
                                  activeFile === f.path
                                    ? "bg-[#7c3aed]/20 text-[#c4b5fd]"
                                    : "bg-white/[0.04] text-[#94a3b8] hover:bg-white/[0.07] hover:text-[#e2e8f0]"
                                }`}
                              >
                                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                                  activeFile === f.path
                                    ? "bg-[#7c3aed]/30 text-[#c4b5fd]"
                                    : "bg-white/[0.06] text-[#64748b]"
                                }`}>
                                  {i + 1}
                                </span>
                                <FileCode className="h-3.5 w-3.5 shrink-0" />
                                <span className="flex-1 text-left truncate">{f.path}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom: pinned search bar */}
            <div className="relative z-10 shrink-0 border-t border-white/[0.06] bg-[#0a0a18]/80 backdrop-blur-md p-3">
              <ApexCodeSearchBar onGenerate={handleGenerate} showQuickHints={false} />
            </div>
          </aside>

          {/* ═══ DRAG RESIZER ═══ */}
          <div
            onPointerDown={startResize}
            title="Drag to resize"
            className="hidden md:flex w-[6px] shrink-0 cursor-col-resize items-center justify-center bg-transparent group touch-none relative z-20"
          >
            {/* Visible handle pill */}
            <div className="h-12 w-[3px] rounded-full bg-white/[0.08] transition-all duration-200 group-hover:bg-[#7c3aed]/60 group-hover:h-16 group-hover:w-[4px] group-hover:shadow-[0_0_12px_rgba(124,58,237,0.3)] group-active:bg-[#3b82f6]/70 group-active:shadow-[0_0_16px_rgba(59,130,246,0.4)]" />
          </div>

          {/* ═══ RIGHT PANEL — Workspace ═══ */}
          <main className="relative flex flex-1 flex-col min-w-0 bg-[#0c0c1a] overflow-hidden">
            {/* Top toolbar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-[#0e0e1e]/80 backdrop-blur-md shrink-0">
              {/* Left: View mode tabs */}
              <div className="flex items-center gap-1 rounded-xl bg-white/[0.04] border border-white/[0.06] p-1">
                <button
                  onClick={() => setViewMode("code")}
                  title="Code view"
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    viewMode === "code"
                      ? "bg-[#7c3aed]/20 text-[#c4b5fd] shadow-sm shadow-[#7c3aed]/10"
                      : "text-[#64748b] hover:text-[#94a3b8]"
                  }`}
                >
                  <Code className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Code</span>
                </button>
                <button
                  onClick={() => setViewMode("preview")}
                  title="Preview view"
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    viewMode === "preview"
                      ? "bg-[#7c3aed]/20 text-[#c4b5fd] shadow-sm shadow-[#7c3aed]/10"
                      : "text-[#64748b] hover:text-[#94a3b8]"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Preview</span>
                </button>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2">
                {isGenerating ? (
                  <span className="apexcode-status-pulse flex items-center gap-1.5 rounded-full bg-[#7c3aed]/15 border border-[#7c3aed]/20 px-3 py-1.5 text-[11px] font-semibold text-[#a78bfa]">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Generating...
                  </span>
                ) : buildStep >= 3 ? (
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-[11px] font-semibold text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Complete
                  </span>
                ) : null}

                <button
                  onClick={() => setFilesOpen((v) => !v)}
                  title="Toggle file explorer"
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                    filesOpen
                      ? "border-[#7c3aed]/30 bg-[#7c3aed]/10 text-[#c4b5fd]"
                      : "border-white/[0.06] bg-white/[0.03] text-[#64748b] hover:text-[#94a3b8]"
                  }`}
                >
                  <Files className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Explorer</span>
                </button>

                {viewMode === "preview" && (
                  <>
                    <div className="flex items-center gap-1 rounded-xl bg-white/[0.04] border border-white/[0.06] p-1">
                      <button
                        onClick={() => setDevice("laptop")}
                        title="Laptop preview"
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${
                          device === "laptop"
                            ? "bg-[#7c3aed]/20 text-[#c4b5fd]"
                            : "text-[#64748b] hover:text-[#94a3b8]"
                        }`}
                      >
                        <Monitor className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDevice("tablet")}
                        title="Tablet preview"
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${
                          device === "tablet"
                            ? "bg-[#7c3aed]/20 text-[#c4b5fd]"
                            : "text-[#64748b] hover:text-[#94a3b8]"
                        }`}
                      >
                        <Tablet className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDevice("phone")}
                        title="Phone preview"
                        className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 ${
                          device === "phone"
                            ? "bg-[#7c3aed]/20 text-[#c4b5fd]"
                            : "text-[#64748b] hover:text-[#94a3b8]"
                        }`}
                      >
                        <Smartphone className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => setPreviewKey((k) => k + 1)}
                      title="Refresh preview"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-[#64748b] hover:text-[#94a3b8] hover:bg-white/[0.05] transition-all duration-200"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}

                <Link
                  href="/settings"
                  title="Settings"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-[#64748b] hover:text-[#94a3b8] hover:bg-white/[0.05] transition-all duration-200"
                >
                  <Settings className="h-3.5 w-3.5" />
                </Link>

                <button
                  onClick={resetApp}
                  title="Start a new prompt"
                  className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#3b82f6] hover:from-[#6d28d9] hover:to-[#2563eb] text-xs font-medium text-white transition-all duration-200 shadow-lg shadow-[#7c3aed]/20 hover:shadow-[#7c3aed]/30"
                >
                  New Prompt
                </button>
              </div>
            </div>

            {/* Content area: Explorer + Code/Preview */}
            <div className="flex-1 flex overflow-hidden">
              {/* File Explorer sidebar */}
              {filesOpen && (
                <aside className="w-56 lg:w-60 shrink-0 border-r border-white/[0.06] bg-[#0b0b19] overflow-y-auto flex flex-col">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#64748b] flex items-center gap-1.5">
                      <Files className="h-3.5 w-3.5" />
                      Explorer
                    </p>
                    <span className="text-[10px] text-[#475569] font-mono">
                      {generatedFiles.length} files
                    </span>
                  </div>
                  <div className="flex-1 p-2 space-y-0.5">
                    {tree.map((node) => (
                      <TreeItem
                        key={node.path}
                        node={node}
                        depth={0}
                        activePath={activeFile}
                        onSelect={(p) => {
                          setActiveFile(p);
                          if (viewMode === "preview" && p.toLowerCase().endsWith(".html")) {
                            setPreviewKey((k) => k + 1);
                          }
                        }}
                      />
                    ))}
                    {generatedFiles.length === 0 && (
                      <div className="flex items-center gap-2 px-2 py-3 text-xs text-[#475569]">
                        <Loader2 className="h-4 w-4 animate-spin text-[#7c3aed]" />
                        Preparing files...
                      </div>
                    )}
                  </div>
                </aside>
              )}

              {/* Code / Preview content */}
              <div className="flex-1 min-w-0 p-3 md:p-4 overflow-hidden">
                {viewMode === "code" ? (
                  <div className="h-full flex flex-col rounded-xl overflow-hidden border border-white/[0.06] bg-[#1e1e2e]">
                    {/* Editor tab bar */}
                    <div className="flex items-center justify-between bg-[#181825] border-b border-white/[0.04] px-4 py-2 shrink-0">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Traffic light dots */}
                        <div className="flex items-center gap-1.5 mr-3">
                          <span className="h-3 w-3 rounded-full bg-[#f38ba8]/80" />
                          <span className="h-3 w-3 rounded-full bg-[#f9e2af]/80" />
                          <span className="h-3 w-3 rounded-full bg-[#a6e3a1]/80" />
                        </div>
                        <span className="text-[#89b4fa]/80">
                          <Code className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-xs font-mono text-[#cdd6f4] truncate">
                          {activeFile ?? "Select a file"}
                        </span>
                        {isGenerating && (
                          <span className="flex items-center gap-1 text-[10px] text-[#a78bfa]">
                            <PenLine className="h-3 w-3" />
                            writing...
                          </span>
                        )}
                      </div>
                      <button
                        onClick={copyActiveFile}
                        disabled={!activeFile}
                        className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-[#a6adc8] transition-colors disabled:opacity-30"
                      >
                        {copied ? (
                          <>
                            <Check className="h-3 w-3 text-[#a6e3a1]" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    {/* Code with line numbers + typewriter */}
                    <pre className="flex-1 overflow-auto p-4 text-[13px] leading-relaxed font-mono text-[#cdd6f4]">
                      {displayedCode.split("\n").map((line, i) => (
                        <div key={i} className="flex hover:bg-white/[0.02] transition-colors">
                          <span className="w-10 shrink-0 select-none text-right pr-4 text-[#585b70]">
                            {i + 1}
                          </span>
                          <span className="whitespace-pre">
                            <CodeSyntaxLine line={line} />
                          </span>
                        </div>
                      ))}
                      {!activeFile && (
                        <div className="flex items-center gap-2 text-[#585b70]">
                          <Loader2 className="h-4 w-4 animate-spin text-[#7c3aed]" />
                          Generating code files...
                        </div>
                      )}
                      {activeFile && isGenerating && (
                        <span className="inline-block h-4 w-[2px] bg-[#a78bfa] caret-blink ml-0.5 align-middle rounded-full" />
                      )}
                    </pre>
                  </div>
                ) : (
                  <div className="h-full flex flex-col rounded-xl overflow-hidden border border-white/[0.06] bg-[#0f0f23]">
                    {/* Preview browser bar */}
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#181825] border-b border-white/[0.04] shrink-0">
                      <div className="flex items-center gap-1.5 mr-3">
                        <span className="h-3 w-3 rounded-full bg-[#f38ba8]/80" />
                        <span className="h-3 w-3 rounded-full bg-[#f9e2af]/80" />
                        <span className="h-3 w-3 rounded-full bg-[#a6e3a1]/80" />
                      </div>
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-[11px] font-mono text-[#64748b]">
                          {device === "phone"
                            ? "Phone"
                            : device === "tablet"
                              ? "Tablet"
                              : "Laptop"}{" "}
                          · localhost:3000
                        </span>
                      </div>
                    </div>
                    {/* Device frame */}
                    <div className="flex-1 flex items-center justify-center overflow-y-auto p-4">
                      {device === "laptop" ? (
                        <iframe
                          key={previewKey}
                          srcDoc={previewHtml}
                          title="App Preview"
                          sandbox="allow-scripts"
                          className="h-full w-full rounded-b-lg bg-white"
                        />
                      ) : (
                        <div
                          style={{
                            width: device === "tablet" ? 768 : 375,
                            maxWidth: "100%",
                          }}
                          className="flex h-full min-h-[480px] flex-col overflow-hidden rounded-[22px] border border-white/10 bg-[#0d0d1f] shadow-2xl shadow-black/60"
                        >
                          {/* Device status bar */}
                          <div className="shrink-0 flex items-center justify-center px-4 py-2 bg-[#181825]">
                            <span className="h-1.5 w-20 rounded-full bg-white/20" />
                          </div>
                          <iframe
                            key={`${previewKey}-${device}`}
                            srcDoc={previewHtml}
                            title="App Preview"
                            sandbox="allow-scripts"
                            className="flex-1 w-full rounded-b-[16px] bg-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              </div>
          </main>
        </div>
      )}
    </div>
  );
}