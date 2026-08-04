"use client";

import { useState } from "react";
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
  const [elements, setElements] = useState([
      { id: "groom", text: "Groom", x: 50, y: 100 },
      { id: "bride", text: "Bride", x: 50, y: 150 },
      { id: "date", text: "Wedding Date", x: 50, y: 200 },
  ]);
  const handleGenerate = async () => {
    if (!groom.trim() || !bride.trim()) return;
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
    <div className="flex h-screen w-full bg-[#F9F9F9]">
        <div className="w-[400px] p-8 border-r bg-white flex flex-col gap-4 overflow-y-auto">
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
        <div className="flex-1 flex items-center justify-center p-12 bg-slate-100">
            <Stage width={500} height={400} className="border bg-white shadow-lg">
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
