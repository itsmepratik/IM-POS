"use server";

import { getDatabase } from "@/lib/db/client";
import { transactions, shops, products, inventory, batches, productVolumes, categories, brands, locations } from "@/lib/db/schema";
import { desc, eq, and, gte, lte, sql, inArray, not } from "drizzle-orm";
import { calculateItemCost, resolveCostPrice } from "@/lib/utils/cost-calc";


export interface ProfitItemVariant {
  size: string;
  quantity: number;
  unitPrice: number;
  unitCost: number; // Avg unit cost
  totalSales: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
}

export interface ProfitItem {
  id: string;
  name: string;
  category: "fluid" | "part" | "service";
  quantity: number;
  unitPrice: number; // Avg unit price
  unitCost: number; // Avg unit cost
  totalSales: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  variants?: ProfitItemVariant[];
  storeId: string;
  storeName: string;
}

export async function getProfitsReport(
  storeId?: string,
  startDate?: Date,
  endDate?: Date
) {
  const db = getDatabase();

  // 1. Fetch Shops & Locations for Manual Mapping (Reliable Fallback)
  const allShops = await db.select().from(shops);
  const allLocations = await db.select().from(locations);
  
  const shopMap = new Map<string, string>(); // shopId -> Name
  const locMap = new Map<string, string>(); // locId -> Name
  const locToShopMap = new Map<string, string>(); // locId -> shopId (for fallback)

  allShops.forEach(s => {
      shopMap.set(s.id, s.displayName || s.name || "Unknown Shop");
      if (s.locationId) locToShopMap.set(s.locationId, s.id);
  });
  allLocations.forEach(l => locMap.set(l.id, l.name));

  // 2. Build Query Conditions
  const conditions = [];
  if (storeId && storeId !== "all-stores") {
    conditions.push(eq(transactions.shopId, storeId));
  }
  if (startDate) {
    conditions.push(gte(transactions.createdAt, startDate));
  }
  if (endDate) {
    conditions.push(lte(transactions.createdAt, endDate));
  }

  // Exclude unpaid transactions (ON_HOLD, CREDIT)
  // We keep SALE, ON_HOLD_PAID, CREDIT_PAID, RETURN, etc.
  conditions.push(not(inArray(transactions.type, ["ON_HOLD", "CREDIT"])));

  // 3. Fetch Transactions
  // We don't rely on the join for the store name anymore, but we keep it for reference
  const transactionData = await db.query.transactions.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    orderBy: [desc(transactions.createdAt)],
  });

  // 4. Collect Product IDs for Batch Aggregation
  const allProductIds = new Set<string>();
  transactionData.forEach(tx => {
    const items = tx.itemsSold as any[];
    if (Array.isArray(items)) {
       items.forEach(item => {
         if (item.productId && typeof item.productId === 'string') {
            allProductIds.add(item.productId);
         }
       });
    }
  });

  // 5. Bulk Fetch Product Metadata & Costs using EXPLICIT separate queries
  const productsMap = new Map();
  const costMap = new Map<string, number>(); // Best available base cost for each product
  const volumesMap = new Map<string, string[]>();

  if (allProductIds.size > 0) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const pIds = Array.from(allProductIds).filter(id => uuidRegex.test(id));
    
    if (pIds.length > 0) {
      // Step A: Fetch Products (simple select, no relations magic)
      const pData = await db.select().from(products).where(inArray(products.id, pIds));
      
      // Step B: Fetch Categories for those products
      const categoryIds = [...new Set(pData.map(p => p.categoryId))];
      const catData = await db.select().from(categories).where(inArray(categories.id, categoryIds));
      const catMap = new Map(catData.map(c => [c.id, c]));
      
      // Step B2: Fetch Brands for those products (use raw SQL for consistency)
      const brandIds = [...new Set(pData.map(p => p.brandId).filter(Boolean))] as string[];
      let brandData: any[] = [];
      if (brandIds.length > 0) {
          try {
              brandData = await db.execute(sql`
                  SELECT id, name FROM brands WHERE id IN (${sql.join(brandIds.map(id => sql`${id}::uuid`), sql`, `)})
              `) as any[];
          } catch (e) {
              console.error("Failed to fetch brands:", e);
              // Continue without brand names
          }
      }
      const brandMap = new Map(brandData.map(b => [b.id, b]));
      
      pData.forEach(p => {
         productsMap.set(p.id, { 
             ...p, 
             category: catMap.get(p.categoryId),
             brand: p.brandId ? brandMap.get(p.brandId) : null
         });
         // Default cost from product table (fallback)
         if (p.costPrice) costMap.set(p.id, Number(p.costPrice));
      });

      // Step C: Fetch Inventory for these products
      const invData = await db.select().from(inventory).where(inArray(inventory.productId, pIds));
      const invMap = new Map<string, string>(); // inventoryId -> productId
      const invIds = invData.map(i => {
          invMap.set(i.id, i.productId);
          return i.id;
      });

      // Step D: Fetch Batches for those inventory records
      if (invIds.length > 0) {
          const bData = await db
              .select()
              .from(batches)
              .where(inArray(batches.inventoryId, invIds))
              .orderBy(desc(batches.purchaseDate));
          
          // Priority: Active Batch > Latest Batch > Product Cost
          // Since we sort by purchaseDate DESC, first hit per product is latest
          bData.forEach(b => {
             const pid = invMap.get(b.inventoryId);
             if (pid) {
                const batchCost = Number(b.costPrice);
                // Only use batch cost if it's valid (> 0)
                // Priority: Active Batch > Latest Batch > Product Cost
                if (batchCost > 0 && (!costMap.has(pid) || b.isActiveBatch)) {
                   costMap.set(pid, batchCost);
                }
             }
          });

      }

      // Step E: Fetch Product Volumes
      const vData = await db.select().from(productVolumes).where(inArray(productVolumes.productId, pIds));
      vData.forEach(v => {
          if (!volumesMap.has(v.productId)) volumesMap.set(v.productId, []);
          volumesMap.get(v.productId)?.push(v.volumeDescription);
      });
    }
  }

  // 6. Aggregation
  // Key = Normalized Name (to merge duplicates)
  const aggregation = new Map<string, ProfitItem>();

  for (const tx of transactionData) {
    const items = tx.itemsSold as any[];
    if (!items || !Array.isArray(items)) continue;

    // Calculate Discount Ratio to Apply Proportional Revenue Reduction
    // Calculate Revenue Ratio (Handles both Discount AND Trade-In)
    // Revenue = Subtotal * Ratio = NetTotal
    // Ratio = NetTotal / Subtotal
    
    let revenueRatio = 1;
    let subtotal = Number(tx.subtotalBeforeDiscount);
    const totalAmount = Number(tx.totalAmount) || 0; // The final cash amount

    // Fallback if subtotal missing
    if (!subtotal || isNaN(subtotal) || subtotal === 0) {
        subtotal = items.reduce((sum, i) => sum + (Number(i.sellingPrice) || 0) * (Number(i.quantity) || 0), 0);
    }

    if (subtotal > 0) {
        // Apply ratio: Total / Subtotal
        // e.g. Subtotal 50, Discount 5, TradeIn 5 -> Total 40.
        // Ratio = 40/50 = 0.8
        revenueRatio = Math.max(0, totalAmount / subtotal);
    }

    for (const item of items) {
       // Validate Data
       if (!item.productId) continue;
       const quantity = Number(item.quantity) || 0;
       const sellingPrice = Number(item.sellingPrice) || 0;
       
       if (quantity === 0) continue; // Skip 0 quantity items

       // Revenue (Adjusted for Discount AND Trade-In)
       const revenue = sellingPrice * quantity * revenueRatio;

       // Cost Logic
       let finalCost = 0;
       const savedCost = Number(item.costPrice); // Snapshot 
       
       if (!isNaN(savedCost) && savedCost > 0) {
          // Use snapshot if available
          finalCost = savedCost * quantity; 
       } else {
          // Calculation / Fallback
          const product = productsMap.get(item.productId);
          const baseCost = costMap.get(item.productId) || 0;
          
          const categoryName = product?.category?.name?.toLowerCase() || "";
          const isFluid = categoryName.includes('fluid') || categoryName.includes('oil') || categoryName.includes('lubricant');
          
          const allVols = volumesMap.get(item.productId);
          
          const unitCost = calculateItemCost({
             baseCost,
             isFluid,
             itemVolume: item.volumeDescription,
             allVolumeDescriptions: allVols
          });
          
          finalCost = unitCost * quantity;
       }

       // Aggregation Key: Use Name instead of ID to merge duplicates
       const product = productsMap.get(item.productId);
       // Build display name with brand prefix (e.g., "Shell 20W-50")
       const brandName = product?.brand?.name || "";
       const productName = product?.name || "";
       
       let displayTitle = "Unknown Item";
       if (brandName && productName) {
           displayTitle = `${brandName} ${productName}`;
       } else if (productName) {
           displayTitle = productName;
       } else if (item.name) {
           displayTitle = item.name;
       } else if (item.volumeDescription) {
           // Fallback for Labor/Custom items which often have volumeDescription like "Labor - Custom Service"
           displayTitle = item.volumeDescription;
       } else {
           displayTitle = `Unknown Item (${item.productId})`;
       }
       
       const nameKey = displayTitle.trim(); // Normalize

       let category: "fluid" | "part" | "service" = "part";
       const catName = product?.category?.name?.toLowerCase() || "";
       if (catName.includes('fluid') || catName.includes('oil') || catName.includes('lubricant')) category = "fluid";
       else if (catName.includes('service') || catName.includes('labor')) category = "service";
       // Also check if the item itself implies service/labor (e.g. ID 9999)
       if (item.productId === '9999' || displayTitle.toLowerCase().includes('labor') || displayTitle.toLowerCase().includes('service')) {
           category = "service";
       }

       // Store Name Mapping
       const txStoreId = tx.shopId;
       const txLocId = tx.locationId;
       
       // Robust Name Resolution:
       // 1. Try shopId map
       // 2. Try location's linked shop
       // 3. Try location name
       let finalStoreName = "Unknown Shop";
       let finalStoreId = "unknown";

       if (txStoreId && shopMap.has(txStoreId)) {
           finalStoreName = shopMap.get(txStoreId)!;
           finalStoreId = txStoreId;
       } else if (txLocId && locToShopMap.has(txLocId)) {
           const linkedShopId = locToShopMap.get(txLocId)!;
           finalStoreName = shopMap.get(linkedShopId)!;
           finalStoreId = linkedShopId;
       } else if (txLocId && locMap.has(txLocId)) {
           finalStoreName = locMap.get(txLocId)!; // Fallback to location name (e.g. "Sanaiya")
           finalStoreId = `loc-${txLocId}`;
       }

       // Change Aggregation Key to include Store ID (splits same product in diff stores)
       const uniqueKey = `${nameKey}::${finalStoreId}`;

       if (!aggregation.has(uniqueKey)) {
          // Create new record
          aggregation.set(uniqueKey, {
              // IMPORTANT: The ID must be unique for the frontend list key. 
              // Using item.productId is NOT unique if the same product is in multiple stores.
              // So we use uniqueKey or a composite ID.
              id: uniqueKey, 
              name: displayTitle,
              category,
              quantity: 0,
              unitPrice: 0,
              unitCost: 0,
              totalSales: 0,
              totalCost: 0,
              profit: 0,
              profitMargin: 0,
              storeId: finalStoreId,
              storeName: finalStoreName,
              variants: []
          });
       }

       const entry = aggregation.get(uniqueKey)!;
       
       entry.quantity += quantity;
       entry.totalSales += revenue;
       entry.totalCost += finalCost;
       entry.profit += (revenue - finalCost);
       
       // No need for mixed store logic anymore since we split them
       // if (entry.storeId !== "mixed" && entry.storeId !== txStoreId) { ... }

       // Variants (merged by Size)
       if (category === "fluid" && item.volumeDescription) {
           const sizeKey = item.volumeDescription.trim();
           // Get the correct entry for this store-specific product
           const currentItem = aggregation.get(uniqueKey)!;
           
           if (!currentItem.variants) currentItem.variants = [];
           
           let variant = currentItem.variants.find(v => v.size === sizeKey);
           if (!variant) {
              variant = {
                 size: sizeKey,
                 quantity: 0,
                 unitPrice: 0,
                 unitCost: 0,
                 totalSales: 0,
                 totalCost: 0,
                 profit: 0,
                 profitMargin: 0
              };
              entry.variants.push(variant);
           }
           
           variant.quantity += quantity;
           variant.totalSales += revenue;
           variant.totalCost += finalCost;
           variant.profit += (revenue - finalCost);
       }
    }
  }

  // 7. Final Calculations
  const reportItems = Array.from(aggregation.values()).map(item => {
     // Weighted Averages
     item.unitPrice = item.quantity > 0 ? item.totalSales / item.quantity : 0;
     item.unitCost = item.quantity > 0 ? item.totalCost / item.quantity : 0;
     item.profitMargin = item.totalSales > 0 ? (item.profit / item.totalSales) * 100 : 0;

     if (item.variants) {
         item.variants.forEach(v => {
            v.unitPrice = v.quantity > 0 ? v.totalSales / v.quantity : 0;
            v.unitCost = v.quantity > 0 ? v.totalCost / v.quantity : 0;
            v.profitMargin = v.totalSales > 0 ? (v.profit / v.totalSales) * 100 : 0;
         });
         item.variants.sort((a,b) => b.totalSales - a.totalSales);
     }
     return item;
  });

  // Sort
  reportItems.sort((a,b) => b.profit - a.profit);

  return reportItems;
}

export async function getShops() {
  const db = getDatabase();
  const allShops = await db.select().from(shops);
  return [
    { id: "all-stores", name: "All Shops" },
    ...allShops.map(s => ({ id: s.id, name: s.displayName || s.name || "Unknown Shop" }))
  ];
}
