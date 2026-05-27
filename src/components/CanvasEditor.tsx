import React, { useState, useRef } from "react";
import { Stage, Layer, Image as KonvaImage, Text, Rect, Group } from "react-konva";
import useImage from "use-image";
import { useDropzone } from "react-dropzone";

interface CanvasEditorProps {
  imageUrl: string;
}

export default function CanvasEditor({ imageUrl }: CanvasEditorProps) {
  const [image] = useImage(imageUrl);
  const [elements, setElements] = useState([
    { id: "base", x: 0, y: 0, width: 500, height: 600, image: image },
  ]);

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        setElements([...elements, { id: Date.now().toString(), x: 50, y: 50, width: 100, height: 100, image: img }]);
      };
    };
    reader.readAsDataURL(file);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()} className="flex flex-1 flex-col items-center">
      <input {...getInputProps()} />
      <Stage width={500} height={600} className="border border-black/10 rounded-lg">
        <Layer>
          {elements.map((el, i) => (
            <KonvaImage
              key={el.id}
              image={el.image}
              x={el.x}
              y={el.y}
              width={el.width}
              height={el.height}
              draggable
            />
          ))}
          <Text text="Drag & Drop images here!" x={10} y={10} fontSize={20} fill="black" />
        </Layer>
      </Stage>
    </div>
  );
}
