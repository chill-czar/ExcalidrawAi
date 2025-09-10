// client/hooks/useAIDrawing.ts
import { useMutation } from "@tanstack/react-query";
import { generateDrawing } from "@/lib/api/ai";
// Use canonical types from converter via ai types
import type { AIDrawingRequest, AIDrawingResponse } from "@/types/ai";

export function useAIDrawing() {
  return useMutation<AIDrawingResponse, Error, AIDrawingRequest>({
    mutationFn: generateDrawing,
  });
}
