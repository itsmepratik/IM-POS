"use client";

import { useMemo, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";
import { usePOSMockData } from "./usePOSMockData";
import { useBranch } from "../../contexts/DataProvider";

// Keep the same interfaces for compatibility with existing POS components
export interface LubricantProduct {
  id: number;
  brand: string;
  name: string;
  basePrice: number;
  type: string;
  image?: string;
  volumes: {
    size: string;
    price: number;
    availableQuantity?: number; // Add inventory tracking
  }[];
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category: "Filters" | "Parts" | "Additives & Fluids";
  brand?: string;
  type?: string;
  availableQuantity?: number; // Add inventory tracking
}

export interface POSCatalogData {
  lubricantProducts: LubricantProduct[];
  products: Product[];
  filterBrands: string[];
  filterTypes: string[];
  partBrands: string[];
  partTypes: string[];
  lubricantBrands: string[];
  isLoading: boolean;
  error: string | null;
}

// Database types
type DbLubricant = Database["public"]["Tables"]["lubricants"]["Row"];
type DbLubricantVolume =
  Database["public"]["Tables"]["lubricant_volumes"]["Row"];
type DbLubricantInventory =
  Database["public"]["Tables"]["lubricant_inventory"]["Row"];
type DbProduct = Database["public"]["Tables"]["products"]["Row"];
type DbProductInventory =
  Database["public"]["Tables"]["product_inventory"]["Row"];
type DbBrand = Database["public"]["Tables"]["brands"]["Row"];
type DbCategory = Database["public"]["Tables"]["categories"]["Row"];
type DbProductType = Database["public"]["Tables"]["product_types"]["Row"];

interface LubricantWithDetails extends DbLubricant {
  brand: DbBrand;
  volumes: (DbLubricantVolume & {
    inventory: DbLubricantInventory[];
  })[];
}

interface ProductWithDetails extends DbProduct {
  brand: DbBrand | null;
  category: DbCategory | null;
  product_type: DbProductType | null;
  inventory: DbProductInventory[];
}

export function usePOSData(): POSCatalogData {
  const { currentBranch, branchLoadError } = useBranch();
  const [lubricants, setLubricants] = useState<LubricantWithDetails[]>([]);
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  // Get mock data for fallback
  const mockData = usePOSMockData();

  const supabase = createClient();

  useEffect(() => {
    if (!currentBranch || branchLoadError) {
      setUseFallback(true);
      setIsLoading(false);
      return;
    }

    fetchPOSData();
  }, [currentBranch, branchLoadError]);

  const fetchPOSData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch lubricants with volumes and inventory
      const { data: lubricantsData, error: lubricantsError } = await supabase
        .from("lubricants")
        .select(
          `
          *,
          brand:brands(*),
          volumes:lubricant_volumes(
            *,
            inventory:lubricant_inventory(*)
          )
        `
        )
        .eq("is_active", true)
        .eq("volumes.is_active", true)
        .eq("volumes.inventory.branch_id", currentBranch!.id);

      if (lubricantsError) throw lubricantsError;

      // Fetch products with inventory
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(
          `
          *,
          brand:brands(*),
          category:categories(*),
          product_type:product_types(*),
          inventory:product_inventory(*)
        `
        )
        .eq("is_active", true)
        .eq("inventory.branch_id", currentBranch!.id);

      if (productsError) throw productsError;

      setLubricants(lubricantsData || []);
      setProducts(productsData || []);
      setUseFallback(false);
    } catch (err) {
      console.error("Error fetching POS data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch POS data");
      setUseFallback(true); // Fall back to mock data on error
    } finally {
      setIsLoading(false);
    }
  };

  // Transform database data to match existing POS component interface
  const lubricantProducts = useMemo(() => {
    return lubricants.map(
      (lub): LubricantProduct => ({
        id: parseInt(lub.id.slice(-8), 16) || Math.floor(Math.random() * 10000), // Convert UUID to number for compatibility
        brand: lub.brand?.name || "",
        name: lub.name,
        basePrice: lub.base_price,
        type: lub.type,
        image: lub.image_url || undefined,
        volumes:
          lub.volumes?.map((vol) => ({
            size: vol.size,
            price: vol.price,
            availableQuantity:
              vol.inventory?.reduce(
                (sum, inv) => sum + inv.quantity_available,
                0
              ) || 0,
          })) || [],
      })
    );
  }, [lubricants]);

  const productsList = useMemo(() => {
    return products.map(
      (prod): Product => ({
        id:
          parseInt(prod.id.slice(-8), 16) || Math.floor(Math.random() * 10000), // Convert UUID to number for compatibility
        name: prod.name,
        price: prod.price,
        category: (prod.category?.name || "Parts") as
          | "Filters"
          | "Parts"
          | "Additives & Fluids",
        brand: prod.brand?.name,
        type: prod.product_type?.name,
        availableQuantity:
          prod.inventory?.reduce(
            (sum, inv) => sum + inv.quantity_available,
            0
          ) || 0,
      })
    );
  }, [products]);

  // Derive organized data arrays (same as mock data)
  const derivedData = useMemo(() => {
    const lubricantBrands = Array.from(
      new Set(lubricantProducts.map((oil) => oil.brand))
    );

    const filterBrands = Array.from(
      new Set(
        productsList
          .filter((p) => p.category === "Filters" && p.brand)
          .map((p) => p.brand!)
      )
    );

    const filterTypes = Array.from(
      new Set(
        productsList
          .filter((p) => p.category === "Filters" && p.type)
          .map((p) => p.type!)
      )
    );

    const partBrands = Array.from(
      new Set(
        productsList
          .filter((p) => p.category === "Parts" && p.brand)
          .map((p) => p.brand!)
      )
    );

    const partTypes = Array.from(
      new Set(
        productsList
          .filter(
            (p) =>
              p.category === "Parts" &&
              p.type &&
              ["Miscellaneous Parts", "Spark Plugs", "Batteries"].includes(
                p.type
              )
          )
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
  }, [lubricantProducts, productsList]);

  // Return mock data if using fallback or database data is not available
  if (useFallback || (!currentBranch && !isLoading)) {
    return {
      ...mockData,
      isLoading: false,
      error: branchLoadError
        ? "Using offline data - branch selection unavailable"
        : error,
    };
  }

  return {
    lubricantProducts,
    products: productsList,
    ...derivedData,
    isLoading,
    error,
  };
}
