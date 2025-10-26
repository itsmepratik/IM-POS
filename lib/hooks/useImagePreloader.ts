/**
 * Image Preloader Hook
 *
 * Provides functionality to preload images and manage image loading states
 */

import { useEffect, useCallback } from "react";
import {
  preloadImage,
  isValidImageUrl,
  isImageCached,
} from "@/lib/utils/imageCache";

interface UseImagePreloaderOptions {
  urls: string[];
  enabled?: boolean;
  onProgress?: (loaded: number, total: number) => void;
  onComplete?: (results: boolean[]) => void;
  onError?: (url: string, error: Error) => void;
}

export function useImagePreloader({
  urls,
  enabled = true,
  onProgress,
  onComplete,
  onError,
}: UseImagePreloaderOptions) {
  const validUrls = urls.filter(isValidImageUrl);

  const preloadImages = useCallback(async () => {
    if (!enabled || validUrls.length === 0) return;

    const results: boolean[] = [];
    let loaded = 0;

    for (const url of validUrls) {
      try {
        // Skip if already cached
        if (isImageCached(url)) {
          results.push(true);
          loaded++;
          onProgress?.(loaded, validUrls.length);
          continue;
        }

        const success = await preloadImage(url);
        results.push(success);
        loaded++;

        onProgress?.(loaded, validUrls.length);

        if (!success) {
          onError?.(url, new Error(`Failed to load image: ${url}`));
        }
      } catch (error) {
        results.push(false);
        loaded++;
        onProgress?.(loaded, validUrls.length);
        onError?.(url, error as Error);
      }
    }

    onComplete?.(results);
  }, [validUrls, enabled, onProgress, onComplete, onError]);

  useEffect(() => {
    if (enabled && validUrls.length > 0) {
      preloadImages();
    }
  }, [preloadImages, enabled, validUrls.length]);

  return {
    totalImages: validUrls.length,
    isPreloading: enabled && validUrls.length > 0,
    preloadImages,
  };
}
