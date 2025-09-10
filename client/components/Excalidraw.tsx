"use client";

import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import { useSelector } from "react-redux";
import { RootState } from "@/config/store";

const ExcalidrawLib = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false }
);

export default function Excalidraw() {
  const elements = useSelector(
    (state: RootState) => state.currentExcalidraw.elements || []
  );
    
  return (
    <div className="w-full h-full">
      <ExcalidrawLib
        key={JSON.stringify(elements)}
        theme="light"
        initialData={{
          elements: elements || [],
        }}
        UIOptions={{
          canvasActions: {
            export: false,
            loadScene: false,
            saveAsImage: false,
          },
        }}
        onChange={() => {
          // optional: don’t need to update Redux here
        }}
      />
    </div>
  );
}

