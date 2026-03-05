"use server";

import { getDatabase } from "@/lib/db/client";
import {
  transactions,
  shops,
  products,
  types,
  categories,
  brands,
  locations,
} from "@/lib/db/schema";
import { inArray, desc, eq, and, gte, lte } from "drizzle-orm";

export interface SaleVariant {
  size: string;
  quantity: number;
  unitPrice: number;
  totalSales: number;
}

export interface SaleItem {
  name: string;
  category: "fluid" | "part" | "service";
  quantity: number;
  unitPrice: number;
  totalSales: number;
  storeId: string;
  storeName?: string;
  variants?: SaleVariant[];
}

export interface Store {
  id: string;
  name: string;
}

export async function getRevenueData(
  startDate?: Date | string,
  endDate?: Date | string,
) {
  try {
    const db = getDatabase();

    // Fetch basic data
    const allShops = await db
      .select({
        id: shops.id,
        name: shops.name,
        displayName: shops.displayName,
        locationId: shops.locationId,
      })
      .from(shops);
    const allLocations = await db
      .select({ id: locations.id, name: locations.name })
      .from(locations);
    const allProducts = await db
      .select({
        id: products.id,
        name: products.name,
        categoryId: products.categoryId,
        brandId: products.brandId,
      })
      .from(products);
    const allCategories = await db
      .select({ id: categories.id, name: categories.name })
      .from(categories);
    const allBrands = await db
      .select({ id: brands.id, name: brands.name })
      .from(brands);

    // Build map for stores
    const shopMap = new Map<string, string>();
    const locMap = new Map<string, string>();
    const locToShopMap = new Map<string, string>();

    allShops.forEach((s) => {
      shopMap.set(s.id, s.displayName || s.name || "Unknown Shop");
      if (s.locationId) locToShopMap.set(s.locationId, s.id);
    });
    allLocations.forEach((l) => locMap.set(l.id, l.name));

    // Build map for products
    const productMap = new Map(allProducts.map((p) => [p.id, p]));
    const categoryMap = new Map(allCategories.map((c) => [c.id, c.name]));
    const brandMap = new Map(allBrands.map((b) => [b.id, b.name]));

    // Build Conditions
    const conditions = [eq(transactions.type, "SALE")];

    if (startDate) {
      const strStart =
        typeof startDate === "string" && startDate.length === 10
          ? `${startDate}T00:00:00`
          : startDate;
      const sDate = new Date(strStart);
      conditions.push(gte(transactions.createdAt, sDate));
    } else {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      conditions.push(gte(transactions.createdAt, startOfDay));
    }

    if (endDate) {
      const strEnd =
        typeof endDate === "string" && endDate.length === 10
          ? `${endDate}T00:00:00`
          : endDate;
      const endOfDay = new Date(strEnd);
      endOfDay.setHours(23, 59, 59, 999);
      conditions.push(lte(transactions.createdAt, endOfDay));
    }

    const txs = await db
      .select({
        itemsSold: transactions.itemsSold,
        shopId: transactions.shopId,
        locationId: transactions.locationId,
        discountAmount: transactions.discountAmount,
        subtotalBeforeDiscount: transactions.subtotalBeforeDiscount,
      })
      .from(transactions)
      .where(and(...conditions));

    // Helper to get category name for a product
    const getCategoryName = (
      productId: string,
    ): "fluid" | "part" | "service" => {
      const product = productMap.get(productId);
      if (!product) return "part";

      const catName = categoryMap.get(product.categoryId);

      if (catName) {
        const lower = catName.toLowerCase();
        if (
          lower.includes("fluid") ||
          lower.includes("oil") ||
          lower.includes("lubricant") ||
          lower.includes("additive")
        )
          return "fluid";
        if (lower.includes("part") || lower.includes("filter")) return "part";
        if (lower.includes("service") || lower.includes("labor"))
          return "service";
      }

      const lowerName = product.name.toLowerCase();
      if (
        /\d+w-?\d+/i.test(lowerName) ||
        lowerName.includes("oil") ||
        lowerName.includes("fluid") ||
        lowerName.includes("lubricant")
      ) {
        return "fluid";
      }

      return "part";
    };

    // Aggregate data
    const itemMap = new Map<string, SaleItem>();

    txs.forEach((tx: any) => {
      let finalStoreName = "Unknown Shop";
      let finalStoreId = "all-stores";

      const txLocId = tx.locationId;
      const txStoreId = tx.shopId;

      if (txStoreId && shopMap.has(txStoreId)) {
        finalStoreName = shopMap.get(txStoreId)!;
        finalStoreId = txStoreId;
      } else if (txLocId && locToShopMap.has(txLocId)) {
        const linkedShopId = locToShopMap.get(txLocId)!;
        finalStoreName = shopMap.get(linkedShopId)!;
        finalStoreId = linkedShopId;
      } else if (txLocId && locMap.has(txLocId)) {
        finalStoreName = locMap.get(txLocId)!;
        finalStoreId = `loc-${txLocId}`;
      }

      const items = tx.itemsSold as any[];

      if (Array.isArray(items)) {
        let discountRatio = 1;
        const discountAmount = Number(tx.discountAmount) || 0;

        if (discountAmount > 0) {
          let subtotal = Number(tx.subtotalBeforeDiscount);
          if (!subtotal || isNaN(subtotal) || subtotal === 0) {
            subtotal = items.reduce(
              (sum, i) =>
                sum + (Number(i.sellingPrice) || 0) * (Number(i.quantity) || 0),
              0,
            );
          }
          if (subtotal > 0) {
            discountRatio = Math.max(0, (subtotal - discountAmount) / subtotal);
          }
        }

        items.forEach((item) => {
          const productId = item.productId;
          const product = productMap.get(productId);

          let category = getCategoryName(productId);

          const brandName = product?.brandId
            ? brandMap.get(product.brandId)
            : "";
          const productName = product ? product.name : "";

          let displayTitle = "Unknown Item";
          if (brandName && productName) {
            displayTitle = `${brandName} ${productName}`;
          } else if (productName) {
            displayTitle = productName;
          } else if (item.name) {
            displayTitle = item.name;
          } else if (item.volumeDescription) {
            displayTitle = item.volumeDescription;
          } else {
            displayTitle = `Unknown Item (${productId || "No ID"})`;
          }

          if (
            productId === "9999" ||
            displayTitle.toLowerCase().includes("labor") ||
            displayTitle.toLowerCase().includes("service")
          ) {
            category = "service";
          }

          const quantity = Number(item.quantity) || 0;
          const price = Number(item.sellingPrice) || 0;
          const variantName = item.volumeDescription || item.size || null;

          const key = `${displayTitle}-${finalStoreId}`;

          if (!itemMap.has(key)) {
            itemMap.set(key, {
              name: displayTitle,
              category,
              quantity: 0,
              unitPrice: price,
              totalSales: 0,
              storeId: finalStoreId,
              storeName: finalStoreName,
              variants: [],
            });
          }

          const entry = itemMap.get(key)!;
          const revenue = quantity * price * discountRatio;

          entry.quantity += quantity;
          entry.totalSales += revenue;
          if (entry.quantity > 0) {
            entry.unitPrice = entry.totalSales / entry.quantity;
          }

          if (variantName) {
            let variant = entry.variants?.find((v) => v.size === variantName);
            if (!variant) {
              if (!entry.variants) entry.variants = [];
              variant = {
                size: variantName,
                quantity: 0,
                unitPrice: price,
                totalSales: 0,
              };
              entry.variants.push(variant);
            }
            variant.quantity += quantity;
            variant.totalSales += revenue;
            if (variant.quantity > 0) {
              variant.unitPrice = variant.totalSales / variant.quantity;
            }
          }
        });
      }
    });

    const uniqueStoresMap = new Map<string, Store>();
    allShops.forEach((s) => {
      uniqueStoresMap.set(s.id, { id: s.id, name: s.displayName || s.name });
    });
    // Add locations that don't have shops just in case
    allLocations.forEach((l) => {
      const locId = `loc-${l.id}`;
      // Note: the select options are built from this.
      if (
        !uniqueStoresMap.has(l.id) &&
        !Array.from(locToShopMap.keys()).includes(l.id)
      ) {
        uniqueStoresMap.set(locId, { id: locId, name: l.name });
      }
    });

    return {
      items: Array.from(itemMap.values()),
      stores: Array.from(uniqueStoresMap.values()),
    };
  } catch (error: any) {
    console.error("Error in getRevenueData:", error);
    throw new Error(
      error.message || "Unknown error occurred inside getRevenueData",
    );
  }
}
