"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { FileText, ArrowLeft, Trash2, Plus, Upload, SortDesc, X, Search, Image as ImageIcon, Video, Download } from "lucide-react";
import Sidebar from "@/components/Sidebar";

export default function RecentFilesPage() {
  const router = useRouter();
  const [files, setFiles] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState<any | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("chat_attachments");
    if (saved) {
      setFiles(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreview(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const deleteFile = (id: string) => {
    const updated = files.filter((f) => f.id !== id);
    setFiles(updated);
    localStorage.setItem("chat_attachments", JSON.stringify(updated));
  };

  const clearAll = () => {
    if (confirm("Are you sure you want to delete all files?")) {
      setFiles([]);
      localStorage.setItem("chat_attachments", "[]");
    }
  };

  const handleFileUpload = (f: File) => {
    const id = Date.now().toString();
    const isMedia = f.type.startsWith("image/") || f.type.startsWith("video/");
    const newFile: any = {
      id,
      name: f.name,
      size: f.size,
      type: f.type,
      timestamp: Date.now(),
    };
    const persist = (withData: boolean) => {
      const updated = withData ? [newFile, ...files] : [newFile, ...files].map((f: any) => {
        if (f.id === id) {
          const { dataUrl, ...rest } = f;
          return rest;
        }
        return f;
      });
      setFiles(updated);
      try {
        localStorage.setItem("chat_attachments", JSON.stringify(updated));
      } catch {
        localStorage.setItem("chat_attachments", JSON.stringify(updated.map((f: any) => {
          const { dataUrl, ...rest } = f;
          return rest;
        })));
      }
      localStorage.setItem("pending_chat_attachment", JSON.stringify(newFile));
      router.push("/");
    };
    if (isMedia) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          newFile.dataUrl = result;
        }
        persist(true);
      };
      reader.readAsDataURL(f);
    } else {
      persist(true);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "image/*": [],
      "video/*": [],
      "application/pdf": [],
      "application/msword": [],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
      "application/vnd.ms-excel": [],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [],
      "application/vnd.ms-powerpoint": [],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [],
      "text/plain": [],
      "text/csv": [],
      "application/rtf": [],
    },
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) handleFileUpload(acceptedFiles[0]);
    },
    maxFiles: 1,
  });

  return (
    <div className="h-screen w-full">
      <div className="flex h-full w-full overflow-hidden bg-white">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="relative flex flex-1 flex-col min-h-0 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-foreground/60 hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Chat
          </button>
          
          <div className="flex items-center gap-2">
            <div {...getRootProps()} className="cursor-pointer">
              <input {...getInputProps()} />
              <button
                className="flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:bg-black/90 transition-all"
              >
                <Upload className="h-4 w-4" />
                Upload
              </button>
            </div>
            {files.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-all"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </button>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Recent Files</h1>
            <p className="text-foreground/50">Manage your local attachments and uploads.</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-foreground/30" />
            <input
              type="text"
              ref={searchRef}
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-black/[0.05] bg-black/[0.02] py-3 pl-10 pr-4 text-sm placeholder:text-foreground/30 focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
        </div>

        {files.length === 0 ? (
          <div {...getRootProps()} className={`rounded-3xl border-2 border-dashed p-8 sm:p-16 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-black/[0.1] hover:bg-black/[0.02]'}`}>
            <input {...getInputProps()} />
            <p className="text-foreground/40">
              {isDragActive ? "Drop file here" : "No recent files yet. Drag & drop or click to upload."}
            </p>
            <p className="text-[10px] text-foreground/30 mt-2">Images, videos, PDF, DOC, XLS, PPT, TXT, CSV, RTF</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/[0.1] p-8 text-center">
            <p className="text-foreground/40">No files match your search.</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {filteredFiles.sort((a, b) => b.timestamp - a.timestamp).map((file) => (
              <div
                key={file.id}
                onClick={() => setPreview(file)}
                title="Click to preview"
                className="group flex items-center gap-4 rounded-2xl border border-black/[0.05] bg-black/[0.02] p-4 transition-all hover:bg-black/[0.04] cursor-pointer"
              >
                <div className="flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm border border-black/[0.05]">
                  {file.type?.startsWith("image/") && file.dataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={file.dataUrl} alt={file.name} className="h-full w-full object-cover" />
                  ) : file.type?.startsWith("video/") && file.dataUrl ? (
                    <video src={file.dataUrl} muted playsInline className="h-full w-full object-cover" />
                  ) : (
                    <FileText className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-foreground/40">
                    {new Date(file.timestamp).toLocaleString()} • {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteFile(file.id);
                  }}
                  className="rounded-full p-2 text-foreground/30 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
          </div>
        </main>
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setPreview(null)}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-black/5">
                  {preview.type?.startsWith("image/") ? (
                    <ImageIcon className="h-4 w-4 text-blue-500" />
                  ) : preview.type?.startsWith("video/") ? (
                    <Video className="h-4 w-4 text-rose-500" />
                  ) : (
                    <FileText className="h-4 w-4 text-blue-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{preview.name}</p>
                  <p className="text-xs text-foreground/40">
                    {(preview.size / 1024).toFixed(1)} KB • {preview.type || "Unknown type"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {preview.dataUrl && (
                  <a
                    href={preview.dataUrl}
                    download={preview.name}
                    className="rounded-full p-2 text-foreground/40 hover:bg-black/5 hover:text-foreground transition-colors"
                    title="Download"
                  >
                    <Download className="h-5 w-5" />
                  </a>
                )}
                <button
                  onClick={() => setPreview(null)}
                  className="rounded-full p-2 text-foreground/40 hover:bg-black/5 hover:text-foreground transition-colors"
                  title="Close (Esc)"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center bg-black/[0.03] p-4">
              {preview.type?.startsWith("image/") && preview.dataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview.dataUrl}
                  alt={preview.name}
                  className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain"
                />
              ) : preview.type?.startsWith("video/") && preview.dataUrl ? (
                <video
                  src={preview.dataUrl}
                  controls
                  autoPlay
                  playsInline
                  className="max-h-[70vh] w-auto max-w-full rounded-xl"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <FileText className="mb-4 h-14 w-14 text-foreground/20" />
                  <p className="text-sm font-medium text-foreground/70">{preview.name}</p>
                  <p className="mt-1 text-xs text-foreground/40">
                    {preview.type?.startsWith("image/") || preview.type?.startsWith("video/")
                      ? "Preview data not saved for this file. Re-upload it to preview."
                      : "Live preview not available for this file type."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
