import { NextResponse } from "next/server";
import { AIDrawingService } from "../services";
import { aiDrawingRequestSchema } from "../schemas";
import { DSL_PROMPT } from "../utils";
import { logger } from "@/core/logger";

/**
 * AI Drawing Controller
 * Handles HTTP request/response logic
 * Layer: Controller → Uses Service layer
 */
export class AIDrawingController {
  private aiDrawingService: AIDrawingService;

  constructor() {
    this.aiDrawingService = new AIDrawingService(DSL_PROMPT);
  }

  /**
   * Handle POST request for AI drawing generation
   */
  async handleGenerateDrawing(req: Request): Promise<NextResponse> {
    try {
      // Parse and validate request body
      const body = await req.json();
      const validation = aiDrawingRequestSchema.safeParse(body);

      if (!validation.success) {
        logger.warn("Validation error:", validation.error);
        return NextResponse.json(
          {
            success: false,
            type: "validation_error",
            message: validation.error.errors[0]?.message || "Validation failed",
          },
          { status: 400 }
        );
      }

      const { prompt } = validation.data;

      // Call service layer
      const result = await this.aiDrawingService.generateDrawing(prompt);

      // Map service result to HTTP response
      if (result.success) {
        return NextResponse.json({
          success: true,
          dsl: result.dsl,
        });
      } else {
        // Determine HTTP status code based on error type
        const statusCode = this.mapErrorTypeToStatusCode(result.error?.type);
        return NextResponse.json(
          {
            success: false,
            type: result.error?.type || "unknown_error",
            message: result.error?.message || "Failed to generate DSL",
          },
          { status: statusCode }
        );
      }
    } catch (err: any) {
      logger.error("Controller error:", err);
      return NextResponse.json(
        {
          success: false,
          type: "api_error",
          message: err.message || "Internal Server Error",
        },
        { status: 500 }
      );
    }
  }

  /**
   * Map error types to HTTP status codes
   */
  private mapErrorTypeToStatusCode(errorType?: string): number {
    switch (errorType) {
      case "validation_error":
        return 400;
      case "classification_error":
      case "subclassification_error":
      case "optimization_error":
      case "dsl_generation_error":
        return 422; // Unprocessable Entity
      case "api_error":
        return 502; // Bad Gateway
      default:
        return 500; // Internal Server Error
    }
  }
}
