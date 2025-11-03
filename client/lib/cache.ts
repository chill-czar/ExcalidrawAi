/**
 * Caching Layer
 *
 * Provides a memory-based cache with LRU eviction policy.
 * Future enhancement: Redis adapter for distributed caching.
 */

import { LRUCache } from "lru-cache";

// Cache configuration
const CACHE_CONFIG = {
  max: 200, // Maximum number of items
  ttl: 1000 * 60 * 15, // 15 minutes TTL
  updateAgeOnGet: true,
  updateAgeOnHas: false,
};

// Type-safe cache interface
export interface CacheAdapter<K = string, V = any> {
  get(key: K): V | undefined;
  set(key: K, value: V, ttl?: number): void;
  has(key: K): boolean;
  delete(key: K): boolean;
  clear(): void;
  size(): number;
}

/**
 * Memory Cache Implementation using LRU
 */
class MemoryCacheAdapter<K = string, V = any> implements CacheAdapter<K, V> {
  private cache: LRUCache<K, V>;

  constructor(options: typeof CACHE_CONFIG) {
    this.cache = new LRUCache<K, V>(options);
  }

  get(key: K): V | undefined {
    return this.cache.get(key);
  }

  set(key: K, value: V, ttl?: number): void {
    this.cache.set(key, value, { ttl });
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Redis Cache Adapter (Future Implementation)
 *
 * This adapter can be implemented when Redis is needed for distributed caching.
 * Configuration should be provided via environment variables.
 */
class RedisCacheAdapter<K = string, V = any> implements CacheAdapter<K, V> {
  // Redis client would be initialized here
  private isEnabled = false;

  constructor() {
    // Disabled by default - enable when Redis is configured
    this.isEnabled = process.env.REDIS_URL !== undefined;
  }

  get(_key: K): V | undefined {
    if (!this.isEnabled) return undefined;
    // TODO: Implement Redis get
    throw new Error("Redis cache not implemented yet");
  }

  set(_key: K, _value: V, _ttl?: number): void {
    if (!this.isEnabled) return;
    // TODO: Implement Redis set
    throw new Error("Redis cache not implemented yet");
  }

  has(_key: K): boolean {
    if (!this.isEnabled) return false;
    // TODO: Implement Redis has
    throw new Error("Redis cache not implemented yet");
  }

  delete(_key: K): boolean {
    if (!this.isEnabled) return false;
    // TODO: Implement Redis delete
    throw new Error("Redis cache not implemented yet");
  }

  clear(): void {
    if (!this.isEnabled) return;
    // TODO: Implement Redis clear
    throw new Error("Redis cache not implemented yet");
  }

  size(): number {
    if (!this.isEnabled) return 0;
    // TODO: Implement Redis size
    throw new Error("Redis cache not implemented yet");
  }
}

/**
 * Cache Factory
 *
 * Determines which cache adapter to use based on configuration.
 * Defaults to memory cache, falls back to memory if Redis is unavailable.
 */
function createCache<K = string, V = any>(): CacheAdapter<K, V> {
  const useRedis = process.env.USE_REDIS_CACHE === "true" && process.env.REDIS_URL;

  if (useRedis) {
    try {
      return new RedisCacheAdapter<K, V>();
    } catch (error) {
      console.warn("Failed to initialize Redis cache, falling back to memory cache", error);
    }
  }

  return new MemoryCacheAdapter<K, V>(CACHE_CONFIG);
}

// Default cache instance
const cache = createCache();

/**
 * Cache key generators for consistent key formatting
 */
export const cacheKeys = {
  drawing: (prompt: string) => `drawing:${prompt}`,
  dsl: (input: string) => `dsl:${input}`,
  classification: (input: string) => `classification:${input}`,
  optimization: (type: string, input: string) => `optimization:${type}:${input}`,
};

/**
 * Export the default cache instance and factory
 */
export default cache;
export { createCache, MemoryCacheAdapter, RedisCacheAdapter };
