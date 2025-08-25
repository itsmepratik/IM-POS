"use client";

import { useMemo } from "react";
import { useInventoryMockData } from "@/app/inventory/hooks/useInventoryMockData";
import { useBranch } from "@/app/branch-context";

// Local shapes compatible with POS page expectations
interface LubricantProduct {
  id: number;
  brand: string;
  name: string; // display name
  basePrice: number;
  type: string;
  image?: string;
  volumes: {
    size: string;
    price: number;
  }[];
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: "Filters" | "Parts" | "Additives & Fluids";
  brand?: string;
  type?: string;
}

// Simple hash to create stable numeric ids from strings
function hashToNumber(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function usePOSCatalog(): {
  isLoading: boolean;
  lubricantProducts: LubricantProduct[];
  products: Product[];
} {
  // Source of truth: inventory (mock-backed for now)
  const { items /* filteredItems, */ } = useInventoryMockData();
  // Optionally consider current branch once items are branch-specific
  const { currentBranch } = useBranch();

  // Build lubricants grouped by brand + type
  const lubricantProducts = useMemo<LubricantProduct[]>(() => {
    const oils = items.filter((it) => it.isOil || it.category === "Lubricants");

    const byKey = new Map<string, LubricantProduct>();

    for (const it of oils) {
      const brand = it.brand || "Unknown";
      const type = (it.type || it.name || "").toString();
      const key = `${brand}::${type}`;
      const basePrice = typeof it.price === "number" ? it.price : 0;
      const volumes = Array.isArray(it.volumes)
        ? it.volumes.map((v) => ({ size: v.size, price: v.price }))
        : [];

      if (!byKey.has(key)) {
        byKey.set(key, {
          id: hashToNumber(`${brand}-${type}`),
          brand,
          name: type,
          basePrice,
          type,
          image: it.imageUrl || it.image_url || undefined,
          volumes,
        });
      } else {
        // Merge volumes if multiple items share same brand+type
        const existing = byKey.get(key)!;
        const mergedSizes = new Set(existing.volumes.map((v) => v.size));
        for (const v of volumes) {
          if (!mergedSizes.has(v.size)) {
            existing.volumes.push(v);
            mergedSizes.add(v.size);
          }
        }
        // Keep the lowest base price as reference
        existing.basePrice = Math.min(
          existing.basePrice,
          basePrice || existing.basePrice
        );
      }
    }

    // Sort for stable UI
    return Array.from(byKey.values()).sort(
      (a, b) => a.brand.localeCompare(b.brand) || a.type.localeCompare(b.type)
    );
  }, [items, currentBranch?.id]);

  // Build POS products for filters, parts, and additives/fluids
  const products = useMemo<Product[]>(() => {
    const out: Product[] = [];

    for (const it of items) {
      // Skip oils; lubricants are handled above
      if (it.isOil || it.category === "Lubricants") continue;

      let category: Product["category"] | null = null;
      const rawCat = (it.category || "").toLowerCase();

      if (rawCat.includes("filter")) category = "Filters";
      else if (
        rawCat.includes("brake") ||
        rawCat.includes("part") ||
        rawCat.includes("exterior") ||
        rawCat.includes("sensor") ||
        rawCat.includes("cooling") ||
        rawCat.includes("electrical")
      )
        category = "Parts";
      else if (
        rawCat.includes("fluid") ||
        rawCat.includes("additive") ||
        rawCat.includes("coolant")
      )
        category = "Additives & Fluids";

      if (!category) continue;

      out.push({
        id: Number.isFinite(Number(it.id))
          ? Number(it.id)
          : hashToNumber(it.id),
        name: it.name,
        price: typeof it.price === "number" ? it.price : 0,
        category,
        brand: it.brand || undefined,
        type: it.type || undefined,
      });
    }

    return out;
  }, [items, currentBranch?.id]);

  return {
    isLoading: false,
    lubricantProducts,
    products,
  };
}

export type { LubricantProduct, Product };
