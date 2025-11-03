/**
 * Common Error Types and Handlers
 *
 * Centralized error handling for consistent error management across modules.
 */

/**
 * Base error class for application errors
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly type: string,
    public readonly statusCode: number = 500,
    public readonly details?: any
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      success: false,
      type: this.type,
      message: this.message,
      details: this.details,
    };
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, "validation_error", 400, details);
    this.name = "ValidationError";
  }
}

/**
 * API error (external service failures)
 */
export class APIError extends AppError {
  constructor(message: string, details?: any) {
    super(message, "api_error", 502, details);
    this.name = "APIError";
  }
}

/**
 * Processing error (business logic failures)
 */
export class ProcessingError extends AppError {
  constructor(message: string, type: string, details?: any) {
    super(message, type, 422, details);
    this.name = "ProcessingError";
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      `${resource}${id ? ` with id ${id}` : ""} not found`,
      "not_found",
      404
    );
    this.name = "NotFoundError";
  }
}

/**
 * Error response interface
 */
export interface ErrorResponse {
  success: false;
  type: string;
  message: string;
  details?: any;
}

/**
 * Check if error is an AppError
 */
export function isAppError(error: any): error is AppError {
  return error instanceof AppError;
}

/**
 * Convert any error to ErrorResponse
 */
export function toErrorResponse(error: any): ErrorResponse {
  if (isAppError(error)) {
    return error.toJSON();
  }

  // Handle Zod validation errors
  if (error?.name === "ZodError") {
    return {
      success: false,
      type: "validation_error",
      message: "Validation failed",
      details: error.errors,
    };
  }

  // Handle unknown errors
  return {
    success: false,
    type: "unknown_error",
    message: error?.message || "An unexpected error occurred",
    details: error,
  };
}

/**
 * Error handler for API routes
 */
export function handleAPIError(error: any): Response {
  const errorResponse = toErrorResponse(error);
  const statusCode = isAppError(error) ? error.statusCode : 500;

  return Response.json(errorResponse, { status: statusCode });
}
