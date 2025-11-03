/**
 * Shared Type Definitions
 *
 * Common types used across multiple modules.
 */

/**
 * Generic success response
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
}

/**
 * Generic error response
 */
export interface ErrorResponse {
  success: false;
  type: string;
  message: string;
  details?: any;
}

/**
 * Union type for API responses
 */
export type APIResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Async result type
 */
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Create success result
 */
export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

/**
 * Create error result
 */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> extends SuccessResponse<T[]> {
  meta: PaginationMeta;
}

/**
 * Timestamp fields
 */
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Entity with ID
 */
export interface Entity {
  id: string;
}

/**
 * Full entity with timestamps
 */
export interface FullEntity extends Entity, Timestamps {}
