/**
 * Application Constants
 *
 * Centralized constants for the application.
 */

/**
 * Cache TTL values (in milliseconds)
 */
export const CACHE_TTL = {
  SHORT: 1000 * 60 * 5, // 5 minutes
  MEDIUM: 1000 * 60 * 15, // 15 minutes
  LONG: 1000 * 60 * 60, // 1 hour
  DAY: 1000 * 60 * 60 * 24, // 24 hours
} as const;

/**
 * API timeout values (in milliseconds)
 */
export const TIMEOUTS = {
  DEFAULT: 30000, // 30 seconds
  LONG: 60000, // 1 minute
  SHORT: 10000, // 10 seconds
} as const;

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  MAX_RETRIES: 2,
  RETRY_DELAY: 1000, // 1 second
} as const;

/**
 * Validation limits
 */
export const VALIDATION_LIMITS = {
  PROMPT_MIN_LENGTH: 3,
  PROMPT_MAX_LENGTH: 1000,
  DSL_MAX_ELEMENTS: 100,
} as const;

/**
 * AI Model Configuration
 */
export const AI_CONFIG = {
  MODEL: "llama-3.3-70b-versatile",
  MAX_RETRIES: 2,
  TIMEOUT: 30000,
} as const;

/**
 * Classification types
 */
export const CLASSIFICATION_TYPES = {
  INTENT: ["create", "edit", "question", "reference", "general"] as const,
  VISUALIZABILITY: ["system_design", "technical_diagram", "drawing", "not_visualizable"] as const,
} as const;

/**
 * HTTP Status Codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;
