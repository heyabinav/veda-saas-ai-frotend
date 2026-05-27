"use client";

import { useState, useRef } from "react";
import CanvasGenerator from "@/components/CanvasGenerator";
import { Stage, Layer, Text } from "react-konva";
import { supabase } from "@/integrations/supabase/client";

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
  const fileRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!groom.trim() || !bride.trim()) return;
    setIsGenerating(true);
    
    try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;

        const response = await fetch("https://vedaapex-m77e.onrender.com/api/v1/generate", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ 
                tool_type: "image-generator", 
                prompt: `Wedding background for ${groom} and ${bride} at ${venue} on ${date}. Style: ${prompt}` 
            }),
        });
        
        if (!response.ok) throw new Error("Image generation failed");
        
        // Assume backend returns { status: "PENDING", task_id: "..." }
        // For now, we simulate success with a placeholder background
        setTimeout(() => {
            setElements([
                { id: "groom", text: `${groom} weds`, x: 100, y: 100 },
                { id: "bride", text: bride, x: 100, y: 150 },
                { id: "date", text: `Date: ${date}`, x: 100, y: 200 },
                { id: "venue", text: `Venue: ${venue}`, x: 100, y: 250 },
            ]);
            setIsGenerating(false);
        }, 2000);
    } catch (error) {
        console.error(error);
        alert("Error generating image. Check console.");
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
            
            <input type="file" ref={fileRef} className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            <button onClick={() => fileRef.current?.click()} className="p-3 border-2 border-dashed rounded-xl text-gray-500">
                {file ? file.name : "Attach Inspiration File"}
            </button>

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
