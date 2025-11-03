import type { AIDrawingErrorType, DSLJson } from "../schemas";

/**
 * Domain model for AI Drawing Response
 * This represents the business domain object
 */
export interface AIDrawingResult {
  success: boolean;
  dsl?: DSLJson;
  error?: {
    type: AIDrawingErrorType;
    message: string;
    details?: any;
  };
}

/**
 * Domain model for classification result
 */
export interface ClassificationResult {
  mainIntent: "create" | "edit" | "question" | "reference" | "general";
  visualizability:
    | "system_design"
    | "technical_diagram"
    | "drawing"
    | "not_visualizable";
}
