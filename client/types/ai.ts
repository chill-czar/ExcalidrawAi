// Re-export types from the ai-drawing module
// This maintains backward compatibility while using the new modular structure
export type {
  AIDrawingRequest,
  AIDrawingResponse,
  DSLJson,
  DSLElement,
  AIDrawingErrorType,
} from "@/modules/ai-drawing";
