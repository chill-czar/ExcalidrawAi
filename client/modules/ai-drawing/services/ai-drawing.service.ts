import { LLMService } from "./llm.service";
import { logger } from "@/core/logger";
import type { AIDrawingResult } from "../models";
import type { AIDrawingErrorType } from "../schemas";

/**
 * AI Drawing Service
 * Orchestrates the AI drawing generation pipeline
 * Layer: Service → Uses LLMService, no direct DB access
 */
export class AIDrawingService {
  private llmService: LLMService;
  private dslInstructions: string;

  constructor(dslInstructions: string) {
    this.llmService = new LLMService();
    this.dslInstructions = dslInstructions;
  }

  /**
   * Main orchestration method for AI drawing generation
   */
  async generateDrawing(input: string): Promise<AIDrawingResult> {
    try {
      // Step 1: Classify intent
      const intent = await this.classifyWithErrorHandling(input);
      if (!intent.success) {
        return intent.error!;
      }

      // Step 2: Check visualizability
      const visualizability = await this.checkVisualizabilityWithErrorHandling(
        input
      );
      if (!visualizability.success) {
        return visualizability.error!;
      }

      // If not visualizable, return early
      if (visualizability.type === "not_visualizable") {
        return {
          success: true,
          error: {
            type: "validation_error",
            message: `Classification: ${intent.type}/${visualizability.type}. Not suitable for DSL generation.`,
          },
        };
      }

      // Step 3: Optimize prompt based on type
      const optimized = await this.optimizePromptWithErrorHandling(
        input,
        visualizability.type!
      );
      if (!optimized.success) {
        return optimized.error!;
      }

      // Step 4: Generate DSL
      const dsl = await this.generateDSLWithErrorHandling(optimized.prompt!);
      if (!dsl.success) {
        return dsl.error!;
      }

      return {
        success: true,
        dsl: dsl.dsl,
      };
    } catch (error) {
      logger.error("Unexpected error in generateDrawing:", error);
      return this.handleLLMError(error, "main orchestration");
    }
  }

  /**
   * Classify intent with error handling
   */
  private async classifyWithErrorHandling(input: string): Promise<{
    success: boolean;
    type?: string;
    error?: AIDrawingResult;
  }> {
    try {
      const classification = await this.llmService.classifyIntent(input);
      const validIntents = ["create", "edit", "general", "question", "reference"];

      if (!validIntents.includes(classification)) {
        return {
          success: false,
          error: {
            success: false,
            error: {
              type: "classification_error",
              message: "Invalid classification result from AI.",
            },
          },
        };
      }

      return { success: true, type: classification };
    } catch (error) {
      return {
        success: false,
        error: this.handleLLMError(error, "classification"),
      };
    }
  }

  /**
   * Check visualizability with error handling
   */
  private async checkVisualizabilityWithErrorHandling(input: string): Promise<{
    success: boolean;
    type?: string;
    error?: AIDrawingResult;
  }> {
    try {
      const subtype = await this.llmService.classifyVisualizability(input);
      const validTypes = [
        "system_design",
        "technical_diagram",
        "drawing",
        "not_visualizable",
      ];

      if (!validTypes.includes(subtype)) {
        return {
          success: false,
          error: {
            success: false,
            error: {
              type: "subclassification_error",
              message: "Invalid visualizability result from AI.",
            },
          },
        };
      }

      return { success: true, type: subtype };
    } catch (error) {
      return {
        success: false,
        error: this.handleLLMError(error, "visualizability"),
      };
    }
  }

  /**
   * Optimize prompt with error handling
   */
  private async optimizePromptWithErrorHandling(
    input: string,
    type: string
  ): Promise<{
    success: boolean;
    prompt?: string;
    error?: AIDrawingResult;
  }> {
    try {
      let optimized: string;

      if (type === "system_design") {
        optimized = await this.llmService.optimizeSystemDesignPrompt(input);
      } else if (type === "technical_diagram") {
        optimized = await this.llmService.optimizeTechnicalDiagramPrompt(input);
      } else {
        optimized = await this.llmService.optimizeDrawingPrompt(input);
      }

      if (!optimized || optimized.length < 10) {
        return {
          success: false,
          error: {
            success: false,
            error: {
              type: "optimization_error",
              message: "Optimized prompt generation failed.",
            },
          },
        };
      }

      return { success: true, prompt: optimized };
    } catch (error) {
      return {
        success: false,
        error: this.handleLLMError(error, "optimization"),
      };
    }
  }

  /**
   * Generate DSL with error handling
   */
  private async generateDSLWithErrorHandling(optimizedPrompt: string): Promise<{
    success: boolean;
    dsl?: any;
    error?: AIDrawingResult;
  }> {
    try {
      const dsl = await this.llmService.generateDSL(
        optimizedPrompt,
        this.dslInstructions
      );

      if (!dsl || typeof dsl !== "object") {
        return {
          success: false,
          error: {
            success: false,
            error: {
              type: "dsl_generation_error",
              message: "Invalid DSL structure generated.",
            },
          },
        };
      }

      return { success: true, dsl };
    } catch (error) {
      return {
        success: false,
        error: this.handleLLMError(error, "DSL generation"),
      };
    }
  }

  /**
   * Handle LLM errors uniformly
   */
  private handleLLMError(error: any, context: string): AIDrawingResult {
    logger.error(`Error in ${context}:`, error);

    let type: AIDrawingErrorType = "unknown_error";
    let message = `Unexpected error in ${context}. Please try again.`;

    if (error?.name === "AbortError") {
      type = "api_error";
      message = "Request timeout. Please try again.";
    } else if (error?.status === 429) {
      type = "api_error";
      message = "Rate limit exceeded. Please try again later.";
    } else if (error?.status >= 400 && error?.status < 500) {
      type = "api_error";
      message = "API request failed. Please check your input.";
    }

    return {
      success: false,
      error: {
        type,
        message,
        details: error,
      },
    };
  }
}
