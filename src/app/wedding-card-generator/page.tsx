"use client";

import { useState, useRef, useEffect } from "react";
import CanvasGenerator from "@/components/CanvasGenerator";
import FileUploadDropzone from "@/components/ui/FileUploadDropzone";
import { Stage, Layer, Text } from "react-konva";
import { supabase } from "@/integrations/supabase/client";
import { apiRequest } from "@/lib/api";

export default function WeddingCardGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [groom, setGroom] = useState("");
  const [bride, setBride] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ w: 500, h: 400 });
  const [elements, setElements] = useState([
      { id: "groom", text: "Groom", x: 50, y: 100 },
      { id: "bride", text: "Bride", x: 50, y: 150 },
      { id: "date", text: "Wedding Date", x: 50, y: 200 },
  ]);
  useEffect(() => {
    const el = canvasWrapRef.current;
    if (!el) return;
    const update = () => {
      const w = Math.min(500, Math.max(280, el.clientWidth - 32));
      setStageSize({ w, h: Math.round(w * 0.8) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleGenerate = async () => {    if (!groom.trim() || !bride.trim()) return;
    setIsGenerating(true);
    
    try {
        const response = await apiRequest("/api/v1/ai/generate/wedding-card", {
            method: "POST",
            body: JSON.stringify({ 
                groom_name: groom,
                bride_name: bride,
                date: date,
                venue: venue,
                theme_prompt: prompt || undefined,
                tier: 1
            }),
        });
        
        const data = await response.json();
        console.log("Wedding Card API result:", data);
        
        setElements([
            { id: "groom", text: `${groom} weds`, x: 100, y: 100 },
            { id: "bride", text: bride, x: 100, y: 150 },
            { id: "date", text: `Date: ${date}`, x: 100, y: 200 },
            { id: "venue", text: `Venue: ${venue}`, x: 100, y: 250 },
        ]);
    } catch (error: any) {
        console.error(error);
        alert("Error generating card: " + (error.message || error));
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[#F9F9F9] overflow-hidden">
        <div className="w-full lg:w-[400px] lg:shrink-0 p-4 lg:p-8 border-b lg:border-b-0 lg:border-r bg-white flex flex-col gap-4 overflow-y-auto">
            <h1 className="text-xl font-bold">Wedding Card Editor</h1>
            <input value={groom} onChange={(e) => setGroom(e.target.value)} placeholder="Groom Name" className="p-3 border rounded-xl" />
            <input value={bride} onChange={(e) => setBride(e.target.value)} placeholder="Bride Name" className="p-3 border rounded-xl" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="p-3 border rounded-xl" />
            <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Venue" className="p-3 border rounded-xl" />
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="AI Design Prompt (e.g., Floral, Gold theme)" className="p-3 border rounded-xl h-24" />
            
            <FileUploadDropzone
              onFileSelect={(f) => setFile(f)}
              onFileRemove={() => setFile(null)}
              file={file}
              label="Attach Inspiration File"
            />

            <button onClick={handleGenerate} className="bg-foreground text-white py-3 rounded-xl font-medium">
                {isGenerating ? "Generating..." : "Generate Design"}
            </button>
        </div>
        <div ref={canvasWrapRef} className="flex-1 flex items-center justify-center p-4 lg:p-12 bg-slate-100 overflow-auto min-h-0">
            <Stage width={stageSize.w} height={stageSize.h} className="border bg-white shadow-lg max-w-full">
                <Layer>
                {elements.map((el) => (
                    <Text key={el.id} text={el.text} x={el.x} y={el.y} draggable fontSize={20} fill="#333" 
                        onDragEnd={(e) => {
                            setElements(elements.map(item => item.id === el.id ? {...item, x: e.target.x(), y: e.target.y()} : item));
                        }}
                    />
                ))}
                </Layer>
            </Stage>
        </div>
    </div>
  );
}
