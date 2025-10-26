/**
 * Image Testing Utilities
 *
 * Provides utilities for testing and debugging image functionality
 */

import {
  verifyDatabaseConnection,
  getSampleImageUrls,
} from "./databaseVerification";
import { isValidImageUrl, getCacheStats } from "./imageCache";

export interface ImageTestResult {
  success: boolean;
  message: string;
  details?: {
    databaseConnection: boolean;
    brandsWithImages: number;
    productsWithImages: number;
    cacheStats: any;
    sampleBrandUrls: string[];
    sampleProductUrls: string[];
  };
}

/**
 * Comprehensive image functionality test
 */
export async function testImageFunctionality(): Promise<ImageTestResult> {
  try {
    console.log("🧪 Testing image functionality...");

    // Test database connection
    const dbResult = await verifyDatabaseConnection();
    if (!dbResult.success) {
      return {
        success: false,
        message: `Database connection failed: ${dbResult.error}`,
        details: {
          databaseConnection: false,
          brandsWithImages: 0,
          productsWithImages: 0,
          cacheStats: getCacheStats(),
          sampleBrandUrls: [],
          sampleProductUrls: [],
        },
      };
    }

    // Get sample URLs for testing
    const sampleUrls = await getSampleImageUrls();

    // Test URL validation
    const validBrandUrls = sampleUrls.brandImages.filter(isValidImageUrl);
    const validProductUrls = sampleUrls.productImages.filter(isValidImageUrl);

    const cacheStats = getCacheStats();

    const success =
      dbResult.success &&
      (validBrandUrls.length > 0 || validProductUrls.length > 0);

    return {
      success,
      message: success
        ? "Image functionality is working correctly"
        : "Some image functionality issues detected",
      details: {
        databaseConnection: dbResult.success,
        brandsWithImages: dbResult.details?.brandsWithImages || 0,
        productsWithImages: dbResult.details?.productsWithImages || 0,
        cacheStats,
        sampleBrandUrls: sampleUrls.brandImages,
        sampleProductUrls: sampleUrls.productImages,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Test failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Log image system status for debugging
 */
export function logImageSystemStatus() {
  const cacheStats = getCacheStats();

  console.group("📊 Image System Status");
  console.log("Cache Stats:", cacheStats);
  console.log("Valid URL function:", typeof isValidImageUrl);
  console.groupEnd();

  return cacheStats;
}
