"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { SendHorizontal, Eye, RefreshCw, Bot, User, Code2, X } from "lucide-react";
import { puter } from "@heyputer/puter.js";

export default function KodiXapex() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: "Hello! Describe the website or code you'd like me to build for you." }
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [code, setCode] = useState<string>("<!-- Code will appear here -->");
  const [showPreview, setShowPreview] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

    const handleGenerate = async () => {
      if (!input.trim()) return;
      const userMsg = input;
      setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
      setInput("");
      setIsGenerating(true);

      try {
        const response = await puter.ai.chat(`Generate clean, modern HTML/CSS code for: ${userMsg}. Return ONLY the code, no markdown blocks.`, {
          model: "anthropic/claude-opus-4.7-fast"
        });

        const content = response?.message?.content;
        const generatedCode = typeof content === "string"
          ? content
          : Array.isArray(content)
            ? content.map(part => (typeof part === 'string' ? part : (part as any).text || '')).join('')
            : "";
        setCode(generatedCode);
        setMessages(prev => [...prev, { role: 'assistant', content: "I've generated the code for your idea. Check the preview!" }]);
        setShowPreview(true);
      } catch (error) {
        console.error(error);
        setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error while generating code." }]);
      } finally {
        setIsGenerating(false);
      }
    };

    useEffect(() => {
      if (iframeRef.current && showPreview && code) {
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          doc.open();
          doc.write(code);
          doc.close();
        }
      }
    }, [code, showPreview]);


  return (
    <div className="h-screen w-full flex bg-background overflow-hidden">
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-white">
            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, i) => (
                    <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'assistant' && <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Bot className="h-5 w-5 text-primary" /></div>}
                        <div className={`p-4 rounded-2xl max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            {msg.content}
                        </div>
                        {msg.role === 'user' && <div className="h-8 w-8 rounded-full bg-foreground/10 flex items-center justify-center shrink-0"><User className="h-5 w-5" /></div>}
                    </div>
                ))}
                
                {/* Upgrade CTA for Free Users */}
                <div className="flex justify-center py-4">
                    <Link href="/upgrade" className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-full shadow-lg hover:from-violet-700 hover:to-indigo-700 transition-all transform hover:scale-105">
                        Upgrade
                    </Link>
                </div>

                {isGenerating && (
                    <div className="flex gap-4">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"><Bot className="h-5 w-5 text-primary animate-pulse" /></div>
                        <div className="p-4 rounded-2xl bg-muted">Generating your code...</div>
                    </div>
                )}
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-border bg-background">
                <div className="max-w-3xl mx-auto relative">
                    <input 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Describe your website idea..."
                      className="w-full pl-4 pr-12 py-3 bg-muted rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                    />
                    <button 
                      onClick={handleGenerate}
                      disabled={isGenerating || !input.trim()}
                      className="absolute right-2 top-2 p-1.5 bg-primary text-primary-foreground rounded-full disabled:opacity-50"
                    >
                        {isGenerating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* Slide-out Preview Panel */}
            <div className={`absolute top-0 right-0 h-full w-[500px] bg-background border-l border-border shadow-2xl transition-transform duration-300 ease-in-out z-20 ${showPreview ? "translate-x-0" : "translate-x-full"}`}>
                <div className="h-14 border-b border-border flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span className="text-sm font-medium">Artifact Preview</span>
                    </div>
                    <button onClick={() => setShowPreview(false)} className="p-1 hover:bg-muted rounded-full">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <iframe 
                    ref={iframeRef}
                    className="w-full h-[calc(100%-3.5rem)]"
                    title="preview"
                />
            </div>
        </main>
    </div>
  );
}
