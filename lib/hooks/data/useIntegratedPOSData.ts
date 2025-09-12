/**
 * Integrated POS Data Hook
 *
 * This hook provides POS-specific product data that's synchronized with the inventory system.
 * It replaces the old usePOSData hook to provide real-time inventory integration.
 */

"use client";

import { useMemo } from "react";
import { useBranch } from "../../contexts/DataProvider";
import { useInventoryPOSSync } from "@/lib/services/inventory-pos-sync";
import { POSProduct, POSLubricantProduct } from "@/lib/types/unified-product";

// Keep the same interfaces for compatibility with existing POS components
export interface LubricantProduct extends POSLubricantProduct {}

export interface Product extends POSProduct {}

export interface IntegratedPOSData {
  lubricantProducts: LubricantProduct[];
  products: Product[];
  filterBrands: string[];
  filterTypes: string[];
  partBrands: string[];
  partTypes: string[];
  lubricantBrands: string[];
  isLoading: boolean;
  isBackgroundSyncing: boolean;
  error: string | null;

  // Additional integrated features
  lastSyncTime: Date | null;
  syncProducts: () => void;
  processSale: (
    productId: string,
    quantity: number,
    transactionId?: string
  ) => Promise<{ success: boolean; error?: string }>;
  getProductAvailability: (id: string) => {
    canSell: boolean;
    availableQuantity: number;
    errorMessage?: string;
  } | null;
}

/**
 * Hook for integrated POS data with real-time inventory synchronization
 */
export function useIntegratedPOSData(): IntegratedPOSData {
  const { currentBranch, branchLoadError } = useBranch();

  // Use the inventory-POS sync service
  const {
    products: unifiedProducts,
    posData,
    isLoading,
    isBackgroundSyncing,
    error: syncError,
    lastSyncTime,
    syncProducts,
    processSale,
    getProductAvailability,
  } = useInventoryPOSSync(currentBranch?.id || null);

  // Transform the POS data to match the expected interface
  const lubricantProducts = posData.lubricantProducts;
  const products = posData.regularProducts;

  // Derive organized data arrays (same logic as the original usePOSData)
  const derivedData = useMemo(() => {
    const lubricantBrands = Array.from(
      new Set(lubricantProducts.map((oil) => oil.brand))
    );

    const filterBrands = Array.from(
      new Set(
        products
          .filter((p) => p.category === "Filters" && p.brand)
          .map((p) => p.brand!)
      )
    );

    const filterTypes = Array.from(
      new Set(
        products
          .filter((p) => p.category === "Filters" && p.type)
          .map((p) => p.type!)
      )
    );

    const partBrands = Array.from(
      new Set(
        products
          .filter((p) => p.category === "Parts" && p.brand)
          .map((p) => p.brand!)
      )
    );

    const partTypes = Array.from(
      new Set(
        products
          .filter((p) => p.category === "Parts" && p.type)
          .map((p) => p.type!)
      )
    );

    return {
      lubricantBrands,
      filterBrands,
      filterTypes,
      partBrands,
      partTypes,
    };
  }, [lubricantProducts, products]);

  // Determine overall error state
  const error =
    syncError || (branchLoadError ? "Branch selection unavailable" : null);

  // Transform getProductAvailability to work with numeric IDs
  const getAvailabilityByNumericId = (numericId: number) => {
    // Find the unified product by matching the numeric ID
    const unifiedProduct = unifiedProducts.find((p) => {
      const generatedId = generateNumericId(p.id);
      return generatedId === numericId;
    });

    if (!unifiedProduct) return null;

    return getProductAvailability(unifiedProduct.id);
  };

  // Transform processSale to work with numeric IDs
  const processSaleByNumericId = async (
    numericId: number,
    quantity: number,
    transactionId?: string
  ) => {
    // Find the unified product by matching the numeric ID
    const unifiedProduct = unifiedProducts.find((p) => {
      const generatedId = generateNumericId(p.id);
      return generatedId === numericId;
    });

    if (!unifiedProduct) {
      return { success: false, error: "Product not found" };
    }

    return processSale(unifiedProduct.id, quantity, transactionId);
  };

  return {
    lubricantProducts,
    products,
    ...derivedData,
    isLoading,
    isBackgroundSyncing,
    error,
    lastSyncTime,
    syncProducts,
    processSale: processSaleByNumericId,
    getProductAvailability: getAvailabilityByNumericId,
  };
}

/**
 * Generate a consistent numeric ID from a UUID (duplicate from adapters for consistency)
 */
function generateNumericId(uuid: string): number {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    const char = uuid.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Re-export types for convenience
export type { LubricantProduct, Product };
