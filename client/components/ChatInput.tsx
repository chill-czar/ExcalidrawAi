"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { useAIDrawing } from "@/hooks/useAIDrawing";
import type { AIDrawingResponse, DSLElement } from "@/types/ai";
import { useDispatch } from "react-redux";
import { setElements } from "@/lib/slice/currentExcalidrawSlice";
import ExcalidrawDSLConverter from "@/lib/converter";

export default function ChatInput() {
  const [message, setMessage] = useState("");

  const { mutate: generateDrawing, isPending } = useAIDrawing();
  const dispatch = useDispatch();

  const handleSendMessage = () => {
    if (!message.trim()) return;

    generateDrawing(
      { prompt: message },
      {
        onSuccess: async (data: AIDrawingResponse) => {
          try {
            if (data.success && data.dsl) {
              const elements = await ExcalidrawDSLConverter.fromDSL(
                data.dsl as unknown as DSLElement[]
              );
              console.log(elements);
              dispatch(setElements(elements));
            } else {
              console.error("AI Drawing failed:", data.message);
            }
          } catch (error) {
            console.error("Error processing DSL:", error);
          }
        },
        onError: (err) => {
          console.error("AI drawing failed:", err);
        },
      }
    );

    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="p-3 border-t">
      <div className="relative">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          disabled={isPending}
          className="min-h-[100px] max-h-[140px] pr-12 resize-none 
                     scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent
                     hover:scrollbar-thumb-gray-400 transition-colors"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#d1d5db transparent",
          }}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!message.trim() || isPending}
          size="icon"
          className="absolute right-3 bottom-3 h-8 w-8"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Debug: show last DSL response
      {dsl && (
        <pre className="mt-2 p-2 text-xs bg-gray-100 rounded overflow-auto max-h-40">
          {dsl}
        </pre>
      )} */}
    </div>
  );
}
