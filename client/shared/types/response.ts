/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * Standard API error structure
 */
export interface ApiError {
  type: string;
  message: string;
  details?: any;
}
