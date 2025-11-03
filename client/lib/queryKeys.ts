/**
 * TanStack Query Keys
 *
 * Centralized query key factory for type-safe query management.
 * Organized by module/domain for easy invalidation and management.
 */

/**
 * Query key factory for drawing module
 */
export const drawingKeys = {
  all: ["drawing"] as const,
  generate: (prompt: string) => ["drawing", "generate", prompt] as const,
  history: () => ["drawing", "history"] as const,
  byId: (id: string) => ["drawing", "byId", id] as const,
};

/**
 * Query key factory for pipeline module
 */
export const pipelineKeys = {
  all: ["pipeline"] as const,
  classify: (input: string) => ["pipeline", "classify", input] as const,
  optimize: (type: string, input: string) => ["pipeline", "optimize", type, input] as const,
  visualizability: (input: string) => ["pipeline", "visualizability", input] as const,
};

/**
 * Query key factory for DSL module
 */
export const dslKeys = {
  all: ["dsl"] as const,
  convert: (data: unknown) => ["dsl", "convert", data] as const,
  validate: (dsl: unknown) => ["dsl", "validate", dsl] as const,
};

/**
 * Combined query keys object
 * Useful for global operations like invalidateAll
 */
export const queryKeys = {
  drawing: drawingKeys,
  pipeline: pipelineKeys,
  dsl: dslKeys,
};

/**
 * Helper type to extract query key types
 */
export type QueryKey<T extends (...args: any[]) => readonly string[]> = ReturnType<T>;

/**
 * Example usage:
 *
 * // In a component:
 * const { data } = useQuery({
 *   queryKey: drawingKeys.generate(prompt),
 *   queryFn: () => generateDrawing({ prompt }),
 * });
 *
 * // Invalidate specific query:
 * queryClient.invalidateQueries({ queryKey: drawingKeys.generate(prompt) });
 *
 * // Invalidate all drawing queries:
 * queryClient.invalidateQueries({ queryKey: drawingKeys.all });
 */
