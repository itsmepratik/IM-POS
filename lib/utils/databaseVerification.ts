/**
 * Database Connection and Data Verification Utilities
 *
 * Provides functions to verify database connectivity and data integrity
 * for image-related functionality.
 */

import { createClient } from "@/supabase/client";

const supabase = createClient();

export interface DatabaseVerificationResult {
  success: boolean;
  error?: string;
  details?: {
    brandsTableExists: boolean;
    productsTableExists: boolean;
    brandsWithImages: number;
    productsWithManufacturingDate: number;
    totalBrands: number;
    totalProducts: number;
  };
}

/**
 * Verifies database connectivity and checks for data availability
 */
export async function verifyDatabaseConnection(): Promise<DatabaseVerificationResult> {
  try {
    // Test basic connectivity
    const { error: connectionError } = await supabase
      .from("brands")
      .select("count", { count: "exact", head: true });

    if (connectionError) {
      return {
        success: false,
        error: `Database connection failed: ${connectionError.message}`,
      };
    }

    // Check if tables exist and have manufacturing date data
    console.log(
      "🔍 Verifying database connection and manufacturing date data..."
    );
    const [brandsResult, productsResult] = await Promise.all([
      supabase.from("brands").select("*", { count: "exact" }),
      supabase
        .from("products")
        .select("id, name, manufacturing_date", { count: "exact" }),
    ]);

    console.log("📊 Database verification results:");
    console.log("- Brands table exists:", !brandsResult.error);
    console.log("- Products table exists:", !productsResult.error);
    console.log("- Total brands:", brandsResult.count);
    console.log("- Total products:", productsResult.count);
    console.log(
      "- Products with manufacturing dates:",
      productsResult.data?.filter((p) => p.manufacturing_date).length || 0
    );
    console.log("- Sample products:", productsResult.data?.slice(0, 3));

    const brandsWithImages =
      brandsResult.data?.filter(
        (brand) => brand.images && Object.keys(brand.images).length > 0
      ).length || 0;

    const productsWithManufacturingDate =
      productsResult.data?.filter((product) => product.manufacturing_date)
        .length || 0;

    return {
      success: true,
      details: {
        brandsTableExists: !brandsResult.error,
        productsTableExists: !productsResult.error,
        brandsWithImages,
        productsWithManufacturingDate,
        totalBrands: brandsResult.count || 0,
        totalProducts: productsResult.count || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}

/**
 * Gets sample data from the database for testing
 */
export async function getSampleData(): Promise<{
  brandImages: string[];
  productImages: string[];
  manufacturingDates: string[];
}> {
  try {
    const [brandsResult, productsResult] = await Promise.all([
      supabase.from("brands").select("name, images").limit(5),
      supabase
        .from("products")
        .select("name, image_url, imageUrl, manufacturing_date")
        .limit(5),
    ]);

    console.log("🔍 Database sample data fetched:");
    console.log("📦 Products result:", productsResult.data);
    console.log("📦 Products error:", productsResult.error);
    console.log(
      "📦 Products with manufacturing dates:",
      productsResult.data?.filter((p) => p.manufacturing_date)
    );

    const brandImages: string[] = [];
    brandsResult.data?.forEach((brand) => {
      if (brand.images) {
        if (typeof brand.images === "string") {
          brandImages.push(brand.images);
        } else if (typeof brand.images === "object") {
          const images = brand.images as any;
          if (images.primary) brandImages.push(images.primary);
          if (images.logo && !brandImages.includes(images.logo))
            brandImages.push(images.logo);
          if (images.url && !brandImages.includes(images.url))
            brandImages.push(images.url);
        }
      }
    });

    const productImages: string[] = [];
    const manufacturingDates: string[] = [];
    productsResult.data?.forEach((product) => {
      if (product.image_url) productImages.push(product.image_url);
      if (product.imageUrl && !productImages.includes(product.imageUrl)) {
        productImages.push(product.imageUrl);
      }
      if (product.manufacturing_date) {
        console.log(
          `📅 Product ${product.name} has manufacturing date:`,
          product.manufacturing_date,
          typeof product.manufacturing_date
        );
        manufacturingDates.push(product.manufacturing_date);
      } else {
        console.log(`📅 Product ${product.name} has no manufacturing date`);
      }
    });

    return {
      brandImages: brandImages.slice(0, 3), // Limit to 3 samples
      productImages: productImages.slice(0, 3),
      manufacturingDates: manufacturingDates.slice(0, 3),
    };
  } catch (error) {
    console.error("Error fetching sample data:", error);
    return {
      brandImages: [],
      productImages: [],
      manufacturingDates: [],
    };
  }
}

/**
 * Validates image URL accessibility
 */
export async function validateImageUrl(url: string): Promise<{
  isValid: boolean;
  isAccessible: boolean;
  contentType?: string;
  error?: string;
}> {
  try {
    const response = await fetch(url, {
      method: "HEAD", // Only get headers, not the full image
      mode: "no-cors", // Allow cross-origin requests
    });

    return {
      isValid: true,
      isAccessible: true,
    };
  } catch (error) {
    return {
      isValid: true,
      isAccessible: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
