import { getDatabase } from "@/lib/db/client";
import {
  products,
  brands,
  categories,
  inventory,
  productVolumes,
  batches,
  openBottleDetails,
  types,
  shops,
} from "@/lib/db/schema";
import { unstable_cache } from "next/cache";
import { desc, eq, and, sql } from "drizzle-orm";
import {
  calculateLubricantStock,
  calculateLubricantStockLegacy,
  type VolumeInfo,
} from "@/lib/utils/lubricant-stock-calc";

import { CACHE_TAGS } from "./cache-tags";

// Revalidation time (seconds) - Default 1 hour
const REVALIDATE_TIME = 3600;

export const getCachedBrands = unstable_cache(
  async () => {
    const db = getDatabase();
    return db.select().from(brands).orderBy(brands.name);
  },
  [CACHE_TAGS.BRANDS],
  {
    tags: [CACHE_TAGS.BRANDS],
    revalidate: REVALIDATE_TIME,
  },
);

export const getCachedShops = unstable_cache(
  async () => {
    const db = getDatabase();
    return db
      .select({
        id: shops.id,
        name: shops.name,
        locationId: shops.locationId,
      })
      .from(shops)
      .where(eq(shops.isActive, true));
  },
  [CACHE_TAGS.SHOPS],
  {
    tags: [CACHE_TAGS.SHOPS],
    revalidate: REVALIDATE_TIME,
  },
);

// Type definition for the cached product to match POS expectations
export type CachedProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  brand: string;
  brand_id: string | null;
  category_id: string | null;
  type: string | null;
  type_id: string | null;
  description: string | null;
  isOil: boolean;
  imageUrl: string | null;
  volumes: any[];
  lowStockAlert: number;
  isBattery: boolean;
  batteryState: "new" | "scrap" | "resellable" | null;
  bottleStates?: {
    open: number;
    closed: number;
  };
  totalOpenVolume?: number;
};

// Complex query to get products with all relations for POS
// Validating locationId is crucial. Defaulting to 'sanaiya' equivalent location if not provided.
export const getCachedProducts = async (locationId: string) => {
  // We cache PER LOCATION
  return unstable_cache(
    async () => {
      const db = getDatabase();
      // 1. Fetch raw data with Drizzle
      // We need to join inventory, products, brands, categories
      // Using query builder for better type safety with relations

      // Note: We use db.query.inventory.findMany.
      // If types are not perfectly inferred, we might need to fallback to db.select with joins,
      // but let's try assuming the schema from relations is correct.
      const rawProducts = await db.query.inventory.findMany({
        where: eq(inventory.locationId, locationId),
        with: {
          product: {
            with: {
              brand: true,
              category: true,
              // Checking schema: productsRelations has 'type' (singular) relation to 'types' table
              type: true,
              // Checking schema: productsRelations has 'volumes' relation to 'productVolumes' table
              volumes: true,
            },
          },
          batches: true,
        },
      });

      // Fetch open bottles separately as it might not be a direct relation on inventory in schema yet
      const openBottles = await db
        .select()
        .from(openBottleDetails)
        .where(eq(openBottleDetails.isEmpty, false));
      const openBottleMap = new Map();
      openBottles.forEach((ob) => {
        if (!openBottleMap.has(ob.inventoryId)) {
          openBottleMap.set(ob.inventoryId, []);
        }
        openBottleMap.get(ob.inventoryId).push(ob);
      });

      // Transform to POS format
      return rawProducts
        .map((inv) => {
          const p = inv.product;
          if (!p) return null;

          const categoryName = p.category?.name || "Uncategorized";
          const isOilProduct =
            p.productType?.toLowerCase() === "oil" ||
            p.productType?.toLowerCase() === "synthetic" ||
            p.productType?.toLowerCase() === "semi-synthetic" ||
            categoryName === "Lubricants" ||
            categoryName === "Additives";

          let volumes: any[] = [];
          if (isOilProduct) {
            volumes = p.volumes.map((v) => ({
              id: v.id,
              item_id: p.id,
              size: v.volumeDescription,
              price: parseFloat(v.sellingPrice),
            }));
          }

          // Stock Calculation
          const batchStock =
            inv.batches.length > 0
              ? inv.batches.reduce((sum, b) => sum + (b.stockRemaining || 0), 0)
              : null;

          let derivedOpenBottles = inv.openBottlesStock || 0;
          let derivedClosedBottles = inv.closedBottlesStock || 0;
          let totalOpenVolume = 0;

          if (isOilProduct) {
            const openBottleRows = openBottleMap.get(inv.id) || [];
            const volumeInfos: VolumeInfo[] = volumes.map((v) => ({
              size: v.size,
              price: v.price,
            }));

            if (batchStock !== null) {
              const stockResult = calculateLubricantStock(
                batchStock,
                openBottleRows.map((r: any) => ({
                  current_volume: parseFloat(r.currentVolume),
                })),
                volumeInfos,
              );
              derivedOpenBottles = stockResult.openBottleCount;
              derivedClosedBottles = stockResult.closedBottleCount;
              totalOpenVolume = stockResult.totalOpenVolume;
            } else {
              const legacyResult = calculateLubricantStockLegacy(
                inv.openBottlesStock || 0,
                inv.closedBottlesStock || 0,
              );
              derivedOpenBottles = legacyResult.openBottleCount;
              derivedClosedBottles = legacyResult.closedBottleCount;
              if (openBottleRows.length > 0) {
                totalOpenVolume = openBottleRows.reduce(
                  (sum: number, b: any) =>
                    sum + (parseFloat(b.currentVolume) || 0),
                  0,
                );
              }
            }
          }

          const finalStock = isOilProduct
            ? batchStock !== null
              ? batchStock + derivedOpenBottles
              : inv.standard_stock || 0
            : batchStock !== null
              ? batchStock
              : inv.standard_stock || 0;

          return {
            id: p.id,
            name: p.name,
            price: inv.sellingPrice ? parseFloat(inv.sellingPrice) : 0,
            stock: finalStock,
            category: categoryName,
            brand: p.brand?.name || "N/A",
            brand_id: p.brandId,
            category_id: p.categoryId,
            type: p.type?.name || p.productType || null,
            type_id: p.typeId,
            description: p.description,
            isOil: isOilProduct,
            imageUrl: p.imageUrl,
            volumes,
            lowStockAlert: p.lowStockThreshold || 10,
            isBattery: p.isBattery || false,
            batteryState: p.batteryState as
              | "new"
              | "scrap"
              | "resellable"
              | null,
            bottleStates: isOilProduct
              ? {
                  open: derivedOpenBottles,
                  closed: derivedClosedBottles,
                }
              : undefined,
            totalOpenVolume: isOilProduct ? totalOpenVolume : undefined,
          };
        })
        .filter(Boolean) as CachedProduct[];
    },
    [CACHE_TAGS.products(locationId)],
    {
      tags: [CACHE_TAGS.ALL_PRODUCTS, CACHE_TAGS.products(locationId)],
      revalidate: REVALIDATE_TIME,
    },
  )();
};
