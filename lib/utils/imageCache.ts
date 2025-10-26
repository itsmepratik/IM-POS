/**
 * Image Cache Utility
 *
 * Provides caching for frequently accessed images to improve performance
 * and reduce redundant network requests.
 */

// Cache interface
interface CacheEntry {
  url: string;
  timestamp: number;
  valid: boolean;
  errorCount: number;
}

// Image cache storage
const imageCache = new Map<string, CacheEntry>();
const MAX_CACHE_SIZE = 100; // Maximum number of cached images
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL
const MAX_ERROR_COUNT = 3; // Maximum errors before marking as invalid

/**
 * Validates if a URL is a valid image URL
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return (
      (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") &&
      /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(parsedUrl.pathname)
    );
  } catch {
    return false;
  }
}

/**
 * Checks if an image URL is cached and still valid
 */
export function isImageCached(url: string): boolean {
  const entry = imageCache.get(url);
  if (!entry) return false;

  // Check if cache entry has expired
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    imageCache.delete(url);
    return false;
  }

  // Check if entry is marked as invalid
  if (!entry.valid) return false;

  return true;
}

/**
 * Marks an image URL as valid in the cache
 */
export function cacheImageValid(url: string): void {
  const entry: CacheEntry = {
    url,
    timestamp: Date.now(),
    valid: true,
    errorCount: 0,
  };

  // Clean up old entries if cache is full
  if (imageCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = imageCache.keys().next().value;
    if (oldestKey) imageCache.delete(oldestKey);
  }

  imageCache.set(url, entry);
}

/**
 * Marks an image URL as invalid in the cache
 */
export function cacheImageInvalid(url: string): void {
  const entry = imageCache.get(url);
  if (entry) {
    entry.valid = false;
    entry.errorCount++;

    // If too many errors, keep it invalid for longer
    if (entry.errorCount >= MAX_ERROR_COUNT) {
      entry.timestamp = Date.now() - CACHE_TTL * 0.8; // Mark as expired soon
    }
  } else {
    const newEntry: CacheEntry = {
      url,
      timestamp: Date.now(),
      valid: false,
      errorCount: 1,
    };

    if (imageCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = imageCache.keys().next().value;
      if (oldestKey) imageCache.delete(oldestKey);
    }

    imageCache.set(url, newEntry);
  }
}

/**
 * Gets cache statistics for debugging
 */
export function getCacheStats() {
  const entries = Array.from(imageCache.values());
  const validEntries = entries.filter((e) => e.valid);
  const invalidEntries = entries.filter((e) => !e.valid);

  return {
    total: entries.length,
    valid: validEntries.length,
    invalid: invalidEntries.length,
    averageAge:
      entries.length > 0
        ? entries.reduce((sum, e) => sum + (Date.now() - e.timestamp), 0) /
          entries.length
        : 0,
  };
}

/**
 * Clears the image cache
 */
export function clearImageCache(): void {
  imageCache.clear();
}

/**
 * Preloads an image and caches the result
 */
export function preloadImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isValidImageUrl(url)) {
      cacheImageInvalid(url);
      resolve(false);
      return;
    }

    // Check if already cached
    if (isImageCached(url)) {
      resolve(true);
      return;
    }

    const img = new Image();
    img.onload = () => {
      cacheImageValid(url);
      resolve(true);
    };

    img.onerror = () => {
      cacheImageInvalid(url);
      resolve(false);
    };

    img.src = url;
  });
}
