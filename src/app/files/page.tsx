"use client";

import Sidebar from "@/components/Sidebar";
import { useState } from "react";
import { FileUp, Folder, File } from "lucide-react";

export default function FilesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen w-full">
      <div className="flex h-full w-full overflow-hidden bg-white">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
            <h1 className="text-2xl font-bold break-words">Uploaded Files</h1>
            <button className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-md text-sm">
              <FileUp className="h-4 w-4" />
              Upload
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-xl hover:bg-black/5 cursor-pointer flex flex-col items-center justify-center text-center">
              <Folder className="h-12 w-12 text-blue-500 mb-2" />
              <span className="text-sm font-medium">Documents</span>
            </div>
            <div className="p-4 border rounded-xl hover:bg-black/5 cursor-pointer flex flex-col items-center justify-center text-center">
              <File className="h-12 w-12 text-foreground/40 mb-2" />
              <span className="text-sm font-medium">analysis.pdf</span>
              <span className="text-xs text-foreground/40">2.4 MB</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
