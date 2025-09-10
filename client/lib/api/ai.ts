// lib/api/ai.ts
import api from "@/config/axios";
// Use canonical types
import type { AIDrawingRequest, AIDrawingResponse } from "@/types/ai";

export async function generateDrawing(
  data: AIDrawingRequest
): Promise<AIDrawingResponse> {
  try {
    const res = await api.post<AIDrawingResponse>("/ai/drawing", data);
    return res.data;
  } catch (err: any) {
    // Return a consistent error format
    return {
      success: false,
      type: "api_error",
      message:
        err.response?.data?.message || err.message || "API request failed",
    };
  }
}
