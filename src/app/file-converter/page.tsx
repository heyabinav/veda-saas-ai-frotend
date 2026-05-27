"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { PanelLeft, FileUp, Upload, X, File as FileIcon } from "lucide-react";
import { useDropzone } from "react-dropzone";

export default function FileConverter() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [format, setFormat] = useState("pdf");

  const onDrop = (acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    setFile(selectedFile);
    setFileName(selectedFile.name.split('.')[0] || "");
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
    setFileName("");
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div className="h-screen w-full bg-white flex">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 flex flex-col p-8 bg-[#F9F9F9]">
        <h1 className="text-2xl font-bold mb-6">Vedaa Pex File Converter</h1>
        
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-black/10 bg-white'}`}
        >
          <input {...getInputProps()} />
          
          {file ? (
            <div className="flex items-center gap-3 bg-black/5 p-3 rounded-lg w-full max-w-sm">
              <FileIcon className="h-8 w-8 text-blue-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-[10px] text-foreground/50">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={removeFile} className="p-1 hover:bg-black/10 rounded-full">
                <X className="h-4 w-4 text-foreground/60" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="h-12 w-12 text-foreground/30 mb-4" />
              <p className="text-foreground/60 text-center">
                Drag & drop a file here, or click to select
              </p>
            </>
          )}
        </div>

        {file && (
          <div className="mt-6 space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-foreground/70 mb-1">Output File Name</label>
                <input 
                  type="text" 
                  value={fileName} 
                  onChange={(e) => setFileName(e.target.value)} 
                  className="w-full rounded-xl border border-black/10 bg-white p-3 text-sm focus:outline-none"
                  placeholder="Enter filename"
                />
              </div>
              <div className="w-32">
                <label className="block text-sm font-medium text-foreground/70 mb-1">Format</label>
                <select 
                  value={format} 
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-white p-3 text-sm focus:outline-none"
                >
                  <option value="pdf">PDF</option>
                  <option value="png">PNG</option>
                  <option value="jpg">JPG</option>
                  <option value="svg">SVG</option>
                  <option value="docx">DOCX</option>
                </select>
              </div>
            </div>
            <button className="bg-foreground text-white px-8 py-3 rounded-xl font-medium hover:opacity-90">
              Convert to {format.toUpperCase()}
            </button>
          </div>
        )}

        <div className="mt-12">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">Recent Conversions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-white border border-black/10 rounded-xl" />)}
          </div>
        </div>
      </main>
    </div>
  );
}
