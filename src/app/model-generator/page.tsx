"use client";

import { useState, useRef, useEffect } from "react";
import * as THREE from "three";
import Sidebar from "@/components/Sidebar";
import { PanelLeft, Box, Wand2, Download, Upload, RotateCcw, Palette, Layers, History, X, FileImageIcon } from "lucide-react";
import { useDropzone } from "react-dropzone";

export default function ModelGenerator() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const mountRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [scene, setScene] = useState<THREE.Scene | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    setFile(acceptedFiles[0]);
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFile(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
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
  });

  useEffect(() => {
    if (!mountRef.current) return;

    const newScene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    newScene.add(light);
    newScene.add(new THREE.AmbientLight(0x404040));

    camera.position.z = 3;
    setScene(newScene);

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(newScene, camera);
    };
    animate();

    return () => {
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="h-screen w-full bg-white flex">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="flex-1 flex flex-col p-4 lg:p-8 bg-[#F9F9F9] overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6">Vedaa Pex 3D Generator</h1>
        
        <div className="flex flex-col lg:flex-row gap-6 min-h-[500px]">
          <div className="bg-white rounded-2xl border border-black/10 p-4 flex-1 shadow-sm relative min-h-[300px]">
             <div ref={mountRef} className="w-full h-full rounded-xl overflow-hidden bg-black/[0.02]" />
             <div className="absolute top-6 right-6 flex flex-col gap-2">
                <button className="p-2 bg-white rounded-lg shadow-sm border border-black/10"><Palette className="h-5 w-5"/></button>
                <button className="p-2 bg-white rounded-lg shadow-sm border border-black/10"><Layers className="h-5 w-5"/></button>
                <button className="p-2 bg-white rounded-lg shadow-sm border border-black/10"><RotateCcw className="h-5 w-5"/></button>
             </div>
          </div>
          
          <div className="w-full lg:w-[350px] space-y-6">
             <div className="bg-white rounded-2xl border border-black/10 p-6 shadow-sm space-y-4">
                <label className="block text-sm font-medium text-foreground/70">Image to 3D</label>
                <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-black/5 transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : ''}`}>
                  <input {...getInputProps()} />
                  {file ? (
                    <div className="flex items-center gap-3 bg-black/5 p-2 rounded-lg">
                      <FileImageIcon className="h-8 w-8 text-indigo-500" />
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-[10px] text-foreground/50">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <button onClick={removeFile} className="p-1 hover:bg-black/10 rounded-full">
                        <X className="h-4 w-4 text-foreground/60" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-6 w-6 text-foreground/30 mx-auto mb-2" />
                      <span className="text-xs text-foreground/50">Upload reference image</span>
                    </>
                  )}
                </div>
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-24 rounded-xl border border-black/10 bg-[#FAFAFA] p-3 text-sm focus:outline-none"
                  placeholder="Describe your model..."
                />
                <button 
                  onClick={() => setIsGenerating(!isGenerating)}
                  className="w-full bg-foreground text-white py-3 rounded-xl font-medium hover:opacity-90 flex items-center justify-center gap-2"
                >
                  <Wand2 className="h-4 w-4" /> {isGenerating ? "Generating..." : "Generate Model"}
                </button>
             </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><History className="h-5 w-5" /> Recent Generations</h2>
          <div className="grid grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white border border-black/10 rounded-xl" />)}
          </div>
        </div>
      </main>
    </div>
  );
}
