import { DSLJson } from "../lib/converter";
// Remove the old DSLElement, DSLFlow, DSLLayout definitions
// Use the converter's types directly

export type AIDrawingRequest = {
  prompt: string;
};

// Updated response type using canonical DSLJson from converter
export interface AIDrawingResponse {
  success: boolean;
  dsl?: DSLJson; // Make this optional
  type?: string;
  message?: string;
}

// Re-export converter types for convenience
export type { DSLElement, DSLJson } from "@/lib/converter";
