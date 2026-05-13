import { Redis } from "@upstash/redis";

export const redis = Redis.fromEnv();

// SimilarWeb responses are cached for 1 hour to save API quota
const DEFAULT_CACHE_TTL = 60 * 60; // 1 hour in seconds

/**
 * Gets a cached response from Redis
 * @param key The cache key
 * @returns The cached data or null if not found
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    return await redis.get<T>(key);
  } catch (error) {
    console.error(`Error reading cache for key ${key}:`, error);
    return null;
  }
}

/**
 * Sets a value in the Redis cache
 * @param key The cache key
 * @param value The data to cache
 * @param ttl Time to live in seconds (defaults to 1 hour)
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttl: number = DEFAULT_CACHE_TTL
): Promise<void> {
  try {
    await redis.set(key, value, { ex: ttl });
  } catch (error) {
    console.error(`Error setting cache for key ${key}:`, error);
  }
}
