import { z } from "zod";

/**
 * Request schema for AI drawing generation
 */
export const aiDrawingRequestSchema = z.object({
  prompt: z
    .string()
    .min(3, "Prompt must be at least 3 characters long")
    .max(1000, "Prompt must be less than 1000 characters"),
});

export type AIDrawingRequest = z.infer<typeof aiDrawingRequestSchema>;

/**
 * Error types for AI drawing operations
 */
export const aiDrawingErrorTypes = [
  "validation_error",
  "classification_error",
  "subclassification_error",
  "optimization_error",
  "dsl_generation_error",
  "api_error",
  "unknown_error",
] as const;

export type AIDrawingErrorType = (typeof aiDrawingErrorTypes)[number];

/**
 * DSL Element schema
 */
export const dslElementSchema = z.object({
  type: z.string(),
  id: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  height: z.number().optional(),
  text: z.string().optional(),
  label: z.string().optional(),
  strokeColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  fontSize: z.number().optional(),
  fontFamily: z.number().optional(),
  textAlign: z.string().optional(),
  verticalAlign: z.string().optional(),
  angle: z.number().optional(),
  roundness: z
    .object({
      type: z.number(),
    })
    .optional(),
  boundElements: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
      })
    )
    .optional(),
  startBinding: z
    .object({
      elementId: z.string(),
      focus: z.number(),
      gap: z.number(),
    })
    .optional(),
  endBinding: z
    .object({
      elementId: z.string(),
      focus: z.number(),
      gap: z.number(),
    })
    .optional(),
  points: z
    .array(
      z.tuple([z.number(), z.number()]).or(z.array(z.number()).length(2))
    )
    .optional(),
  startArrowhead: z.string().nullable().optional(),
  endArrowhead: z.string().nullable().optional(),
});

export type DSLElement = z.infer<typeof dslElementSchema>;

/**
 * DSL JSON schema
 */
export const dslJsonSchema = z.object({
  elements: z.array(dslElementSchema),
  appState: z
    .object({
      viewBackgroundColor: z.string().optional(),
      gridSize: z.number().nullable().optional(),
    })
    .optional(),
});

export type DSLJson = z.infer<typeof dslJsonSchema>;

/**
 * Response schema for AI drawing generation
 */
export const aiDrawingResponseSchema = z.object({
  success: z.boolean(),
  dsl: dslJsonSchema.optional(),
  type: z.enum(aiDrawingErrorTypes).optional(),
  message: z.string().optional(),
  details: z.any().optional(),
});

export type AIDrawingResponse = z.infer<typeof aiDrawingResponseSchema>;
