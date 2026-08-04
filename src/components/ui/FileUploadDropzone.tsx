"use client";

import { useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, FileImage, FileVideo, FileText, FileSpreadsheet, File } from "lucide-react";

const ACCEPTED_TYPES = {
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
};

interface FileUploadDropzoneProps {
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
  file: File | null;
  label?: string;
}

function getFileIcon(file: File) {
  if (file.type.startsWith("image/")) return <FileImage className="h-4 w-4 shrink-0 text-indigo-500" />;
  if (file.type.startsWith("video/")) return <FileVideo className="h-4 w-4 shrink-0 text-purple-500" />;
  if (file.type === "application/pdf") return <FileText className="h-4 w-4 shrink-0 text-red-500" />;
  if (
    file.type === "application/msword" ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) return <FileText className="h-4 w-4 shrink-0 text-blue-500" />;
  if (
    file.type === "application/vnd.ms-excel" ||
    file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    file.type === "text/csv"
  ) return <FileSpreadsheet className="h-4 w-4 shrink-0 text-green-500" />;
  if (file.type === "text/plain" || file.type === "application/rtf")
    return <FileText className="h-4 w-4 shrink-0 text-gray-500" />;
  return <File className="h-4 w-4 shrink-0 text-gray-400" />;
}

export default function FileUploadDropzone({
  onFileSelect,
  onFileRemove,
  file,
  label = "Attach File (images, videos, docs)",
}: FileUploadDropzoneProps) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(null);
  }, [file]);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    validator: (file) => {
      const name = file.name || "";
      const type = file.type || "";
      const isZip = type === "application/zip" ||
        type === "application/x-zip-compressed" ||
        type === "application/x-7z-compressed" ||
        type === "application/vnd.rar" ||
        name.endsWith(".zip") ||
        name.endsWith(".rar") ||
        name.endsWith(".7z");
      if (isZip) {
        return { code: "file-not-allowed", message: "ZIP and archive files are not allowed" };
      }
      return null;
    },
  });

  return (
    <div
      {...getRootProps()}
      className={`w-full rounded-lg border border-dashed text-xs cursor-pointer transition-all ${
        file ? "p-3" : "py-2 flex items-center justify-center gap-2"
      } ${
        isDragActive
          ? "border-blue-500 bg-blue-50 text-blue-600"
          : isDragReject
          ? "border-red-500 bg-red-50 text-red-500"
          : "border-black/10 text-foreground/50 hover:bg-black/5"
      }`}
    >
      <input {...getInputProps()} />
      {file ? (
        <div className="flex items-center gap-3 w-full">
          {preview ? (
            <div className="h-10 w-10 rounded-md overflow-hidden shrink-0 border border-black/5">
              <img src={preview} alt="preview" className="h-full w-full object-cover" />
            </div>
          ) : (
            getFileIcon(file)
          )}
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-medium text-foreground/80">{file.name}</p>
            <p className="text-[10px] text-foreground/40">{(file.size / 1024).toFixed(1)} KB</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFileRemove();
            }}
            className="p-1 hover:bg-black/10 rounded-full shrink-0"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : isDragReject ? (
        <span className="flex items-center justify-center gap-2">
          <X className="h-3 w-3" /> ZIP, RAR, 7z and OS files are not allowed
        </span>
      ) : (
        <>
          <Upload className="h-3 w-3" />
          {isDragActive ? "Drop file here" : label}
        </>
      )}
    </div>
  );
}
