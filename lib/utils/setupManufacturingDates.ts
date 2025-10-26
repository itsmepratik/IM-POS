/**
 * Manufacturing Date Setup Utility
 *
 * Provides utilities to set up and populate manufacturing dates in the database
 * for testing and development purposes.
 */

import { createClient } from "@/supabase/client";

const supabase = createClient();

export interface SetupResult {
  success: boolean;
  message: string;
  details?: {
    productsUpdated: number;
    sampleDates: string[];
  };
}

/**
 * Sets up sample manufacturing dates for testing
 */
export async function setupSampleManufacturingDates(): Promise<SetupResult> {
  try {
    console.log("🔧 Setting up sample manufacturing dates...");

    // Check current state
    const { data: products, error: fetchError } = await supabase
      .from("products")
      .select("id, name, manufacturing_date")
      .limit(10);

    if (fetchError) {
      return {
        success: false,
        message: `Failed to fetch products: ${fetchError.message}`,
      };
    }

    console.log("📦 Current products state:", products);

    // Generate sample manufacturing dates (between 1-5 years ago)
    const sampleDates = [];
    const updates = [];

    for (const product of products || []) {
      if (!product.manufacturing_date) {
        // Generate a random date between 1-5 years ago
        const yearsAgo = Math.floor(Math.random() * 5) + 1;
        const date = new Date();
        date.setFullYear(date.getFullYear() - yearsAgo);
        date.setMonth(Math.floor(Math.random() * 12));
        date.setDate(Math.floor(Math.random() * 28) + 1);

        const manufacturingDate = date.toISOString().split("T")[0]; // YYYY-MM-DD format
        sampleDates.push(manufacturingDate);

        updates.push({
          id: product.id,
          manufacturing_date: manufacturingDate,
        });
      }
    }

    console.log("📅 Generated manufacturing dates:", sampleDates);

    if (updates.length === 0) {
      return {
        success: true,
        message: "All products already have manufacturing dates",
        details: {
          productsUpdated: 0,
          sampleDates: [],
        },
      };
    }

    // Update products with manufacturing dates
    const { error: updateError } = await supabase
      .from("products")
      .upsert(updates, { onConflict: "id" });

    if (updateError) {
      return {
        success: false,
        message: `Failed to update products: ${updateError.message}`,
      };
    }

    console.log(
      `✅ Successfully updated ${updates.length} products with manufacturing dates`
    );

    return {
      success: true,
      message: `Successfully set up manufacturing dates for ${updates.length} products`,
      details: {
        productsUpdated: updates.length,
        sampleDates,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Setup failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Clear all manufacturing dates (for testing)
 */
export async function clearManufacturingDates(): Promise<SetupResult> {
  try {
    console.log("🧹 Clearing all manufacturing dates...");

    const { error } = await supabase
      .from("products")
      .update({ manufacturing_date: null })
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Update all records

    if (error) {
      return {
        success: false,
        message: `Failed to clear dates: ${error.message}`,
      };
    }

    return {
      success: true,
      message: "Successfully cleared all manufacturing dates",
    };
  } catch (error) {
    return {
      success: false,
      message: `Clear failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Check manufacturing date coverage in database
 */
export async function checkManufacturingDateCoverage(): Promise<{
  totalProducts: number;
  productsWithDates: number;
  coveragePercentage: number;
  sampleProducts: any[];
}> {
  try {
    const { data: products, error } = await supabase
      .from("products")
      .select("id, name, manufacturing_date")
      .limit(50);

    if (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }

    const totalProducts = products?.length || 0;
    const productsWithDates =
      products?.filter((p) => p.manufacturing_date).length || 0;
    const coveragePercentage =
      totalProducts > 0 ? (productsWithDates / totalProducts) * 100 : 0;

    const sampleProducts = products?.slice(0, 5) || [];

    console.log("📊 Manufacturing date coverage:");
    console.log(`- Total products: ${totalProducts}`);
    console.log(`- Products with dates: ${productsWithDates}`);
    console.log(`- Coverage: ${coveragePercentage.toFixed(1)}%`);
    console.log("- Sample products:", sampleProducts);

    return {
      totalProducts,
      productsWithDates,
      coveragePercentage,
      sampleProducts,
    };
  } catch (error) {
    console.error("Error checking manufacturing date coverage:", error);
    return {
      totalProducts: 0,
      productsWithDates: 0,
      coveragePercentage: 0,
      sampleProducts: [],
    };
  }
}

// Make functions available globally for browser console access
if (typeof window !== "undefined") {
  (window as any).setupSampleManufacturingDates = setupSampleManufacturingDates;
  (window as any).clearManufacturingDates = clearManufacturingDates;
  (window as any).checkManufacturingDateCoverage =
    checkManufacturingDateCoverage;
}
