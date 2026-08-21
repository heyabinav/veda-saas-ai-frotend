"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  Plus,
  Image as ImageIcon,
  Video,
  FileText,
  Camera,
  Mic,
  Clipboard,
  FileType,
  FileSpreadsheet,
  ArrowRight,
  X,
  File,
  Download,
  Lock,
  Unlock,
  NotebookText,
  UploadCloud,
  Loader2,
  ChevronDown,
  Check,
} from "lucide-react";

const APEXCODE_MODELS = [
  { name: "Apex 2.1", price: "free", plan: "Free" },
  { name: "Apex 2.2 (Low)", price: "200", plan: "Pro" },
  { name: "Apex 2.2 (High)", price: "500", plan: "Max" },
  { name: "ApexCode 3 (Apex 3.0)", price: "1000", plan: "Ultra" },
];

const canAccessModel = (plan: string | null, price: string) => {
  if (price === "free") return true;
  if (!plan) return false;
  if (price === "200") return ["200", "500", "1000"].includes(plan);
  if (price === "500") return ["500", "1000"].includes(plan);
  if (price === "1000") return plan === "1000";
  return false;
};

const FEELING_LUCKY_PROMPTS = [
  "Build a full-stack web application with real-time user authentication and dark theme",
  "Create an Android app UI for AI photo editing with camera integration",
  "Build a SaaS billing dashboard with Stripe, responsive analytics charts, and dark mode",
  "Create a Gmail workflow automation bot that categorizes emails and sends AI summaries",
  "Build a Google Sheets integration tool that auto-generates data reports",
  "Build an AI code assistant component with syntax highlighting and diff viewer",
];

const QUICK_HINTS = [
  "Build a portfolio website",
  "Build a website",
  "Build a landing page",
  "Build a mobile app",
  "Build an e-commerce store",
];

type AddMenuItem = {
  label: string;
  icon: React.ReactNode;
  kind: "file" | "clipboard";
  accept?: string;
  capture?: "environment" | "user";
};

const addMenuItems: AddMenuItem[] = [
  { label: "Upload Image", icon: <ImageIcon className="h-4 w-4 text-blue-400" />, kind: "file", accept: "image/*" },
  { label: "Upload PDF", icon: <FileText className="h-4 w-4 text-red-400" />, kind: "file", accept: "application/pdf" },
  { label: "Upload DOCX", icon: <FileType className="h-4 w-4 text-blue-500" />, kind: "file", accept: ".docx" },
  { label: "Upload Excel", icon: <FileSpreadsheet className="h-4 w-4 text-emerald-400" />, kind: "file", accept: ".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" },
  { label: "Camera", icon: <Camera className="h-4 w-4 text-purple-400" />, kind: "file", accept: "image/*", capture: "environment" },
  { label: "Audio Note", icon: <Mic className="h-4 w-4 text-amber-400" />, kind: "file", accept: "audio/*" },
  { label: "Video Asset", icon: <Video className="h-4 w-4 text-rose-400" />, kind: "file", accept: "video/*" },
  { label: "Paste Clipboard", icon: <Clipboard className="h-4 w-4 text-cyan-400" />, kind: "clipboard" },
];

interface ApexCodeSearchBarProps {
  onGenerate?: (prompt: string, model: string) => void;
  showQuickHints?: boolean;
  docked?: boolean;
}

type AttachedFile = {
  id: string;
  name: string;
  url?: string;
  isImage: boolean;
  isVideo?: boolean;
  txtContent?: string;
  fileType?: string;
  fileSize?: number;
};

function getFileIcon(file: AttachedFile): React.ReactNode {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt")) return <NotebookText className="h-5 w-5 text-violet-500" />;
  if (name.endsWith(".pdf")) return <FileText className="h-5 w-5 text-red-400" />;
  if (name.endsWith(".docx") || name.endsWith(".doc")) return <FileType className="h-5 w-5 text-blue-500" />;
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv"))
    return <FileSpreadsheet className="h-5 w-5 text-emerald-400" />;
  if (
    name.endsWith(".mp3") ||
    name.endsWith(".wav") ||
    name.endsWith(".m4a") ||
    name.endsWith(".ogg") ||
    name.endsWith(".aac")
  )
    return <Mic className="h-5 w-5 text-amber-400" />;
  if (
    name.endsWith(".mp4") ||
    name.endsWith(".mov") ||
    name.endsWith(".webm") ||
    name.endsWith(".mkv") ||
    name.endsWith(".avi")
  )
    return <Video className="h-5 w-5 text-rose-400" />;
  return <File className="h-5 w-5 text-foreground/70" />;
}

export default function ApexCodeSearchBar({ onGenerate, showQuickHints = true, docked = false }: ApexCodeSearchBarProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragDepthRef = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingFileKindRef = useRef<AddMenuItem | null>(null);
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [model, setModel] = useState("Apex 2.1");
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const readPlan = async () => {
      let p: string | null = null;
      try {
        const match = document.cookie.split("; ").find((c) => c.startsWith("user_plan="));
        if (match) p = decodeURIComponent(match.slice("user_plan=".length));
      } catch {
        // ignore cookie read errors
      }
      if (!p) {
        try {
          const { data } = await supabase.auth.getSession();
          p = data.session?.user?.user_metadata?.plan ?? null;
        } catch {
          // ignore session read errors
        }
      }
      if (mounted) {
        setPlan(p);
        // Free users start on the free model; higher plans get their best model as the default.
        setModel((current) => {
          if (current !== "Apex 2.1") return current;
          if (p === "1000") return "ApexCode 3 (Apex 3.0)";
          if (p === "500") return "Apex 2.2 (High)";
          if (p === "200") return "Apex 2.2 (Low)";
          return "Apex 2.1";
        });
      }
    };
    void readPlan();
    return () => {
      mounted = false;
    };
  }, []);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<AttachedFile | null>(null);
  const [imgW, setImgW] = useState<number | null>(null);
  const [imgH, setImgH] = useState<number | null>(null);
  const [keepRatio, setKeepRatio] = useState(true);
  const naturalDimRef = useRef<{ w: number; h: number } | null>(null);
  const txtFileCountRef = useRef(0);

  useEffect(() => {
    setImgW(null);
    setImgH(null);
    naturalDimRef.current = null;
  }, [previewFile?.id]);

  const handleImgWidthChange = (w: number) => {
    setImgW(w);
    if (keepRatio && naturalDimRef.current) {
      setImgH(Math.max(1, Math.round((w * naturalDimRef.current.h) / naturalDimRef.current.w)));
    }
  };

  const handleImgHeightChange = (h: number) => {
    setImgH(h);
    if (keepRatio && naturalDimRef.current) {
      setImgW(Math.max(1, Math.round((h * naturalDimRef.current.w) / naturalDimRef.current.h)));
    }
  };

  const resetImgSize = () => {
    setImgW(null);
    setImgH(null);
    naturalDimRef.current = null;
  };

  useEffect(() => {
    if (value.trim().length > 1000) {
      txtFileCountRef.current += 1;
      const txtFile: AttachedFile = {
        id: `txt-${Date.now()}`,
        name: `prompt-${txtFileCountRef.current}.txt`,
        isImage: false,
        txtContent: value.trim(),
      };
      setAttachedFiles((prev) => [...prev, txtFile]);
      setValue("");
      textareaRef.current?.focus();
    }
  }, [value]);

  const removeFile = useCallback((id: string) => {
    setAttachedFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target?.url) URL.revokeObjectURL(target.url);
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const addFiles = useCallback((files: File[]) => {
    if (files.length === 0) return;
    const newFiles: AttachedFile[] = files.map((file, idx) => {
      const isImage = file.type.startsWith("image/");
      return {
        id: `${file.name}-${Date.now()}-${idx}`,
        name: file.name,
        url: URL.createObjectURL(file),
        isImage,
        isVideo: file.type.startsWith("video/"),
        fileType: file.type,
        fileSize: file.size,
      };
    });
    setAttachedFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const handleAddMenuClick = useCallback((item: AddMenuItem) => {
    setAddMenuOpen(false);
    if (item.kind === "clipboard") {
      void navigator.clipboard
        .readText()
        .then((text) => {
          if (text) {
            setValue((prev) => (prev ? `${prev.trim()} ${text.trim()}` : text.trim()));
            textareaRef.current?.focus();
          }
        })
        .catch(() => {
          // Clipboard permission denied - user can paste manually.
        });
      return;
    }
    pendingFileKindRef.current = item;
    const input = fileInputRef.current;
    if (!input) return;
    input.accept = item.accept ?? "";
    input.capture = item.capture ?? "";
    input.value = "";
    input.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      pendingFileKindRef.current = null;
      e.target.value = "";
      addFiles(files);
    },
    [addFiles]
  );

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files || []);
    if (droppedFiles.length === 0) return;

    addFiles(droppedFiles);
  }, [addFiles]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragDepthRef.current += 1;
    setIsDragging(true);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setIsDragging(false);
    }
  }, []);

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const lineHeight = 26;
    const maxHeight = lineHeight * 6;
    ta.style.height = `${Math.min(ta.scrollHeight, maxHeight)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  const handleGenerate = useCallback(() => {
    const txtFile = attachedFiles.find((f) => f.txtContent);
    const prompt = value.trim() || txtFile?.txtContent || "";
    if (!prompt || isGenerating) return;
    setIsGenerating(true);
    if (onGenerate) {
      onGenerate(prompt, model);
    }
    setValue("");
    setAttachedFiles([]);
    setTimeout(() => setIsGenerating(false), 1700);
  }, [value, attachedFiles, isGenerating, onGenerate, model]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleGenerate();
      }
    },
    [handleGenerate]
  );

  const handleFeelingLucky = useCallback(() => {
    if (value.trim()) {
      handleGenerate();
      return;
    }
    const randomPrompt =
      FEELING_LUCKY_PROMPTS[Math.floor(Math.random() * FEELING_LUCKY_PROMPTS.length)];
    setValue(randomPrompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [value, handleGenerate]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Prompt Input Box with Rainbow Gradient Glow Border */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-full ${docked ? "" : "max-w-[720px]"} rounded-2xl border border-[#e2e8f0] bg-white transition-all duration-300 ${
          isDragging
            ? "border-[#4f46e5]/60 bg-white shadow-[0_0_40px_rgba(79,70,229,0.15)]"
            : isFocused
              ? "border-[#4f46e5]/50 shadow-[0_0_30px_rgba(79,70,229,0.12)]"
              : "shadow-[0_4px_20px_rgba(15,23,42,0.08)]"
        }`}
      >
        <div className="relative w-full rounded-2xl bg-white p-3 md:p-4 flex flex-col justify-between min-h-[110px] md:min-h-[120px] border border-[#f2f4f6]">
          {/* Text Area Input */}
          <div className="flex-1 w-full min-w-0 mb-3">
            {/* Attached file icons */}
            {attachedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {attachedFiles.map((file) => (
                  <div
                    key={file.id}
                    title={`${file.name} - click to view`}
                    className={`relative rounded-2xl border border-[#e2e8f0] flex items-center justify-center overflow-visible cursor-pointer group hover:border-[#c7c4d8] transition-colors ${
                      file.isImage || file.isVideo
                        ? "h-14 w-24 overflow-hidden"
                        : "h-11 w-11 bg-[#f2f4f6]"
                    }`}
                    onClick={() => setPreviewFile(file)}
                  >
                    {file.isImage && file.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={file.url}
                        alt={file.name}
                        className="h-full w-full object-cover"
                      />
                    ) : file.isVideo && file.url ? (
                      <video
                        src={file.url}
                        muted
                        playsInline
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      getFileIcon(file)
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(file.id);
                      }}
                      className="absolute -top-1.5 -right-1.5 rounded-full bg-white border border-[#e2e8f0] p-0.5 text-[#464555] hover:text-red-500 shadow-sm transition-colors"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
              placeholder="Describe an app and let ApexCode do the rest..."
              rows={1}
              className="w-full bg-transparent text-[#191c1e] text-base md:text-[17px] font-normal leading-relaxed placeholder:text-[#464555]/50 focus:outline-none resize-none min-h-[40px] font-sans"
              aria-label="Describe an app prompt"
            />

            {/* Drag & Drop Overlay */}
            {isDragging && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/90 backdrop-blur-sm border-2 border-dashed border-[#4f46e5]/60 pointer-events-none">
                <div className="flex flex-col items-center gap-2 text-[#3525cd]">
                  <UploadCloud className="h-8 w-8" />
                  <span className="text-sm font-semibold">Drop files here</span>
                  <span className="text-xs text-[#3525cd]/70">Images, PDFs, DOCX & more</span>
                </div>
              </div>
            )}

            </div>

            {/* Bottom Control Bar Inside Box */}
          <div className="flex items-center justify-between pt-2">
            {/* Left Icons: Plus and Model */}
            <div className="flex items-center gap-2">
              {/* Plus Menu Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAddMenuOpen(!addMenuOpen)}
                  title="Add attachment"
                  className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-[#eceef0] hover:bg-[#e0e3e5] text-[#464555] hover:text-[#191c1e] border border-transparent flex items-center justify-center transition-colors"
                >
                  <motion.div animate={{ rotate: addMenuOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
                    <Plus className="h-4 w-4 md:h-5 md:w-5" />
                  </motion.div>
                </button>

                {/* Popover Menu */}
                <AnimatePresence>
                  {addMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setAddMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 bottom-12 z-50 w-52 overflow-hidden rounded-2xl bg-white border border-[#e2e8f0] p-1.5 shadow-[0_8px_32px_rgba(15,23,42,0.12)] backdrop-blur-xl"
                      >
                        {addMenuItems.map((item) => (
                          <button
                            key={item.label}
                            type="button"
                            onClick={() => handleAddMenuClick(item)}
                            className="flex w-full items-center gap-3 px-3 py-2 text-xs md:text-sm font-medium text-[#191c1e]/80 transition-colors hover:bg-[#f2f4f6] hover:text-[#191c1e] rounded-xl"
                          >
                            <span>{item.icon}</span>
                            {item.label}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Model Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setModelOpen(!modelOpen)}
                  title="Select AI model"
                  className="flex items-center gap-1.5 rounded-full bg-[#eceef0] hover:bg-[#e0e3e5] text-[#464555] hover:text-[#191c1e] border border-transparent px-2.5 py-2 md:px-3 md:py-2.5 transition-colors"
                >
                  <span className="hidden sm:inline text-xs md:text-sm font-semibold truncate max-w-[90px]">
                    {model}
                  </span>
                  <ChevronDown
                    className={`h-3 w-3 shrink-0 transition-transform duration-200 ${modelOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {modelOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setModelOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 bottom-12 z-50 w-56 overflow-hidden rounded-2xl bg-white border border-[#e2e8f0] p-1.5 shadow-[0_8px_32px_rgba(15,23,42,0.12)]"
                      >
                        <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#64748b]">
                          Model
                        </p>
                        {APEXCODE_MODELS.map((m) => {
                          const allowed = canAccessModel(plan, m.price);
                          return (
                            <button
                              key={m.name}
                              type="button"
                              onClick={() => {
                                setModelOpen(false);
                                if (allowed) {
                                  setModel(m.name);
                                } else {
                                  router.push("/upgrade");
                                }
                              }}
                              className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs md:text-sm font-medium transition-colors ${
                                model === m.name && allowed
                                  ? "bg-[#4f46e5]/10 text-[#3525cd]"
                                  : "text-[#191c1e]/80 hover:bg-[#f2f4f6] hover:text-[#191c1e]"
                              }`}
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <span className="truncate">{m.name}</span>
                                {m.name === "ApexCode 3 (Apex 3.0)" && (
                                  <span className="shrink-0 rounded-full bg-[#4f46e5]/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#3525cd]">
                                    New
                                  </span>
                                )}
                              </span>
                              {model === m.name && allowed ? (
                                <Check className="h-4 w-4 shrink-0 text-[#3525cd]" />
                              ) : allowed ? (
                                <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wider text-[#64748b]">
                                  {m.plan}
                                </span>
                              ) : (
                                <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-600">
                                  <Lock className="h-2.5 w-2.5" />
                                  {m.plan}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* Hidden file input for the add menu */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Right Action Button: Feeling Lucky Pill */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFeelingLucky}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 rounded-full bg-[#3525cd] text-white text-xs md:text-sm font-semibold transition-all hover:scale-[1.02] hover:bg-[#4d44e3] shadow-sm active:scale-95"
              >
                {isGenerating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  </motion.div>
                ) : (
                  <>
                    <span>Build</span>
                    <ArrowRight className="h-3.5 w-3.5 text-white" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Hint Chips */}
      {showQuickHints && (
        <div className="mt-4 w-full">
          <p className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b] md:text-[12px]">
            Try a starter prompt
          </p>
          <div className="flex w-full gap-2 overflow-x-auto pb-1 md:flex-wrap md:justify-center md:overflow-visible md:pb-0">
            {QUICK_HINTS.map((hint) => (
              <button
                key={hint}
                type="button"
                onClick={() => {
                  setValue(hint);
                  if (textareaRef.current) textareaRef.current.focus();
                }}
                className="shrink-0 rounded-full border border-[#e2e8f0] bg-white px-3.5 py-1.5 text-[12px] font-medium text-[#464555] transition-all hover:border-[#4f46e5]/40 hover:bg-[#4f46e5]/5 hover:text-[#3525cd]"
              >
                {hint}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setPreviewFile(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden rounded-2xl bg-white border border-[#e2e8f0]"
            >
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#e2e8f0] bg-[#f7f9fb]">
                <div className="flex items-center gap-2 min-w-0">
                  <NotebookText className="h-4 w-4 text-[#4f46e5] shrink-0" />
                  <span className="text-sm font-semibold text-[#191c1e] truncate">
                    {previewFile.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="rounded-full p-1.5 text-[#464555] hover:text-red-500 hover:bg-[#f2f4f6] transition-colors"
                  aria-label="Close preview"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-auto flex items-start justify-start bg-[#f7f9fb] p-4">
                {previewFile.txtContent ? (
                  <pre className="w-full h-full min-h-0 overflow-auto px-4 py-3 text-[13px] leading-relaxed text-[#191c1e]/80 font-mono whitespace-pre-wrap break-words">
                    {previewFile.txtContent}
                  </pre>
                ) : previewFile.isImage && previewFile.url ? (
                  <div className="flex flex-col items-center gap-2 w-full">
                    <div className="flex items-center gap-2 rounded-xl bg-white border border-[#e2e8f0] px-3 py-2">
                      <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-[#464555]">
                        Size
                      </span>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-[#191c1e]/70">
                        Length
                        <input
                          type="number"
                          min={1}
                          value={imgW ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "") {
                              setImgW(null);
                              if (keepRatio && naturalDimRef.current) setImgH(null);
                            } else {
                              handleImgWidthChange(Math.max(1, parseInt(v) || 1));
                            }
                          }}
                          className="w-16 rounded-md border border-[#e2e8f0] px-1.5 py-0.5 text-xs text-[#191c1e] focus:outline-none focus:border-[#4f46e5]/60"
                        />
                        px
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-[#191c1e]/70">
                        Breadth
                        <input
                          type="number"
                          min={1}
                          value={imgH ?? ""}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "") {
                              setImgH(null);
                              if (keepRatio && naturalDimRef.current) setImgW(null);
                            } else {
                              handleImgHeightChange(Math.max(1, parseInt(v) || 1));
                            }
                          }}
                          className="w-16 rounded-md border border-[#e2e8f0] px-1.5 py-0.5 text-xs text-[#191c1e] focus:outline-none focus:border-[#4f46e5]/60"
                        />
                        px
                      </label>
                      <button
                        type="button"
                        onClick={() => setKeepRatio((v) => !v)}
                        title={keepRatio ? "Locked: aspect ratio maintained" : "Unlocked: free resize"}
                        className={`rounded-md p-1.5 transition-colors ${
                          keepRatio
                            ? "bg-[#4f46e5]/10 text-[#3525cd]"
                            : "text-[#464555] hover:text-[#191c1e]"
                        }`}
                      >
                        {keepRatio ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={resetImgSize}
                        className="rounded-md px-2 py-1 text-xs font-medium text-[#464555] hover:text-[#191c1e] hover:bg-[#f2f4f6] transition-colors"
                      >
                        Reset
                      </button>
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewFile.url}
                      alt={previewFile.name}
                      onLoad={(e) => {
                        if (!naturalDimRef.current) {
                          naturalDimRef.current = {
                            w: e.currentTarget.naturalWidth,
                            h: e.currentTarget.naturalHeight,
                          };
                        }
                      }}
                      style={{
                        width: imgW ? `${imgW}px` : undefined,
                        height: imgH ? `${imgH}px` : undefined,
                      }}
                      className="max-w-full max-h-[60vh] rounded-lg object-contain"
                    />
                  </div>
                ) : previewFile.fileType?.startsWith("video/") ? (
                  <video
                    src={previewFile.url}
                    controls
                    className="max-w-full max-h-[65vh] rounded-lg"
                  />
                ) : previewFile.fileType?.startsWith("audio/") ? (
                  <audio src={previewFile.url} controls className="w-full" />
                ) : previewFile.fileType === "application/pdf" ||
                  previewFile.fileType?.startsWith("text/") ? (
                  <iframe
                    src={previewFile.url}
                    title={previewFile.name}
                    className="w-full h-[65vh] rounded-lg"
                  />
                ) : (
                  <div className="text-center py-8 w-full">
                    <File className="h-12 w-12 mx-auto text-[#464555]/30" />
                    <p className="mt-3 text-sm font-medium text-[#191c1e] break-all px-6">
                      {previewFile.name}
                    </p>
                    <p className="mt-1 text-xs text-[#464555]">
                      {previewFile.fileType || "Unknown type"} ·{" "}
                      {previewFile.fileSize ? Math.max(1, Math.round(previewFile.fileSize / 1024)) : 0} KB
                    </p>
                    <a
                      href={previewFile.url}
                      download={previewFile.name}
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#3525cd] px-4 py-2 text-sm text-white hover:bg-[#4d44e3] transition-colors"
                    >
                      <Download className="h-4 w-4" /> Download
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

