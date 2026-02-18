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
import { fetchBrands, Brand } from "@/lib/services/inventoryService";
import { POSProduct, POSLubricantProduct } from "@/lib/types/unified-product";
import { useState, useEffect } from "react";

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
  brands: Brand[];
  isLoading: boolean;
  isBackgroundSyncing: boolean;
  error: string | null;

  // Additional integrated features
  lastSyncTime: Date | null;
  syncProducts: (showToast?: boolean, isBackgroundSync?: boolean) => void;
  refresh: () => void;
  processSale: (
    productId: number,
    quantity: number,
    transactionId?: string
  ) => Promise<{ success: boolean; error?: string }>;
  getProductAvailability: (id: number) => {
    canSell: boolean;
    availableQuantity: number;
    errorMessage?: string;
  } | null;
}

/**
 * Hook for integrated POS data with real-time inventory synchronization
 * @param overrideLocationId - Optional location ID to override the branch context (useful for transfers)
 * @param config - Optional configuration for initial data hydration
 */
export function useIntegratedPOSData(
  overrideLocationId?: string | null, 
  config?: { 
    initialData?: { 
      products?: any[]; 
      brands?: Brand[];
    } 
  }
): IntegratedPOSData {
  const { currentBranch, branchLoadError, inventoryLocationId } = useBranch();

  // Use overrideLocationId if provided, otherwise use inventoryLocationId if available (for shop users with shared inventory), otherwise use currentBranch.id
  const locationIdForInventory = overrideLocationId !== undefined 
    ? overrideLocationId 
    : (inventoryLocationId || currentBranch?.id || null);

  // Brands state
  const [brands, setBrands] = useState<Brand[]>(config?.initialData?.brands || []);
  const [brandsLoading, setBrandsLoading] = useState(!config?.initialData?.brands);
  const [brandsError, setBrandsError] = useState<string | null>(null);

  // Fetch brands data
  useEffect(() => {
    if (config?.initialData?.brands) return;

    const loadBrands = async () => {
      setBrandsLoading(true);
      setBrandsError(null);
      try {
        const brandsData = await fetchBrands();
        setBrands(brandsData);
      } catch (err) {
        setBrandsError(
          err instanceof Error ? err.message : "Failed to load brands"
        );
        console.error("Error loading brands:", err);
      } finally {
        setBrandsLoading(false);
      }
    };

    loadBrands();
  }, [config?.initialData?.brands]);


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
    refresh,
  } = useInventoryPOSSync(locationIdForInventory, {
    initialData: config?.initialData?.products
  });

  // Transform the POS data to match the expected interface and SORT alphabetically
  const lubricantProducts = [...posData.lubricantProducts].sort((a, b) => 
    a.name.localeCompare(b.name)
  );
  const products = [...posData.regularProducts].sort((a, b) => 
    a.name.localeCompare(b.name)
  );

  // Derive organized data arrays (same logic as the original usePOSData)
  const derivedData = useMemo(() => {
    const lubricantBrands = Array.from(
      new Set(lubricantProducts.map((oil) => oil.brand))
    ).sort((a, b) => a.localeCompare(b));

    const filterBrands = Array.from(
      new Set(
        products
          .filter((p) => p.category === "Filters" && p.brand)
          .map((p) => p.brand!)
      )
    ).sort((a, b) => a.localeCompare(b));

    const filterTypes = Array.from(
      new Set(
        products
          .filter((p) => p.category === "Filters" && p.type)
          .map((p) => p.type!)
      )
    ).sort((a, b) => a.localeCompare(b));

    const partBrands = Array.from(
      new Set(
        products
          .filter((p) => p.category === "Parts" && p.brand)
          .map((p) => p.brand!)
      )
    ).sort((a, b) => a.localeCompare(b));

    const partTypes = Array.from(
      new Set(
        products
          .filter((p) => p.category === "Parts" && p.type)
          .map((p) => p.type!)
      )
    ).sort((a, b) => a.localeCompare(b));

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
    brands,
    isLoading: isLoading || brandsLoading,
    isBackgroundSyncing,
    error: error || brandsError,
    lastSyncTime,
    syncProducts,
    refresh,
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
// Re-export types for convenience
// export type { LubricantProduct, Product };
