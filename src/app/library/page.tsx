"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  ImageIcon,
  Video,
  Presentation,
  Download,
  Trash2,
  Clock,
  Search,
} from "lucide-react";

type ItemType = "image" | "video" | "ppt" | "attachment";

type LibraryItem = {
  id: string;
  type: ItemType;
  title: string;
  url?: string;
  timestamp: number;
  metadata?: any;
};

export default function LibraryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [filter, setFilter] = useState<ItemType | "all">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Load images
    const images = JSON.parse(localStorage.getItem("image_generations") || "[]").map((i: any) => ({
      id: i.id,
      type: "image",
      title: i.prompt,
      url: i.url,
      timestamp: i.timestamp,
    }));

    // Load videos
    const videos = JSON.parse(localStorage.getItem("video_generations") || "[]").map((v: any) => ({
      id: v.id,
      type: "video",
      title: v.prompt,
      url: v.url,
      timestamp: v.timestamp,
    }));

    // Load PPTs
    const ppts = JSON.parse(localStorage.getItem("ppt_generations") || "[]").map((p: any) => ({
      id: p.id,
      type: "ppt",
      title: p.topic,
      timestamp: p.timestamp,
      metadata: { slideCount: p.slideCount, theme: p.theme }
    }));

    // Load Attachments
    const attachments = JSON.parse(localStorage.getItem("chat_attachments") || "[]").map((a: any) => ({
      id: a.id,
      type: "attachment",
      title: a.name,
      timestamp: a.timestamp,
      metadata: { size: a.size, type: a.type }
    }));

    // Combine all
    const allItems = [...images, ...videos, ...ppts, ...attachments].sort((a, b) => b.timestamp - a.timestamp);
    setItems(allItems);
  }, []);

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === "all" || item.type === filter;
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const deleteItem = (id: string, type: ItemType) => {
    if (confirm("Are you sure you want to delete this item?")) {
      const key = type === "image" ? "image_generations" : type === "video" ? "video_generations" : type === "ppt" ? "ppt_generations" : "chat_attachments";
      const current = JSON.parse(localStorage.getItem(key) || "[]");
      const updated = current.filter((i: any) => i.id !== id);
      localStorage.setItem(key, JSON.stringify(updated));
      setItems(items.filter(i => i.id !== id));
    }
  };

  return (
    <div className="h-screen w-full bg-white">
      <div className="flex h-full w-full overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="relative flex flex-1 flex-col overflow-y-auto bg-[#F9F9F9] p-8">
            <div className="max-w-6xl mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground/90">Library</h1>
                        <p className="text-foreground/50">Manage your generated assets and files</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
                            <input 
                                type="text"
                                placeholder="Search library..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 pr-4 py-2 rounded-lg border border-black/5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 w-full md:w-64"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                    <button 
                        onClick={() => setFilter("all")}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "all" ? "bg-black text-white" : "bg-white border border-black/5 text-foreground/60 hover:bg-black/5"}`}
                    >
                        All
                    </button>
                    <button 
                        onClick={() => setFilter("image")}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "image" ? "bg-black text-white" : "bg-white border border-black/5 text-foreground/60 hover:bg-black/5"}`}
                    >
                        Images
                    </button>
                    <button 
                        onClick={() => setFilter("video")}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "video" ? "bg-black text-white" : "bg-white border border-black/5 text-foreground/60 hover:bg-black/5"}`}
                    >
                        Videos
                    </button>
                    <button 
                        onClick={() => setFilter("ppt")}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "ppt" ? "bg-black text-white" : "bg-white border border-black/5 text-foreground/60 hover:bg-black/5"}`}
                    >
                        Presentations
                    </button>
                    <button 
                        onClick={() => setFilter("attachment")}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === "attachment" ? "bg-black text-white" : "bg-white border border-black/5 text-foreground/60 hover:bg-black/5"}`}
                    >
                        Attachments
                    </button>
                </div>

                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-black/5 shadow-sm">
                        <div className="h-16 w-16 bg-black/[0.02] rounded-full flex items-center justify-center mb-4">
                            <Clock className="h-8 w-8 text-foreground/20" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground/70">No items found</h3>
                        <p className="text-sm text-foreground/40">Your generated assets will appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map((item) => (
                            <div key={item.id} className="group relative bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden hover:shadow-md transition-all">
                                {item.type === "image" && item.url && (
                                    <div className="aspect-square w-full overflow-hidden bg-black/[0.02]">
                                        <img src={item.url} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    </div>
                                )}
                                {item.type === "video" && (
                                    <div className="aspect-video w-full bg-black/90 flex items-center justify-center">
                                        <Video className="h-12 w-12 text-white/20" />
                                    </div>
                                )}
                                {item.type === "ppt" && (
                                    <div className="aspect-video w-full bg-orange-500/10 flex items-center justify-center">
                                        <Presentation className="h-12 w-12 text-orange-500/40" />
                                    </div>
                                )}

                                <div className="p-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        {item.type === "image" && <ImageIcon className="h-3 w-3 text-blue-500" />}
                                        {item.type === "video" && <Video className="h-3 w-3 text-purple-500" />}
                                        {item.type === "ppt" && <Presentation className="h-3 w-3 text-orange-500" />}
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-foreground/40">{item.type}</span>
                                    </div>
                                    <h3 className="text-sm font-semibold text-foreground/80 line-clamp-2 mb-2 min-h-[40px]">{item.title}</h3>
                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-xs text-foreground/30">{new Date(item.timestamp).toLocaleDateString()}</span>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {item.url && (
                                                <a href={item.url} download className="p-1.5 rounded-md hover:bg-black/5 text-foreground/50 hover:text-foreground">
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            )}
                                            <button 
                                                onClick={() => deleteItem(item.id, item.type)}
                                                className="p-1.5 rounded-md hover:bg-red-50 text-foreground/50 hover:text-red-500"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
      </div>
    </div>
  );
}
