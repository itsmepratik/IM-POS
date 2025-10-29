/**
 * Product Data Adapters for Inventory-POS Integration
 *
 * This file contains adapter functions to transform data between different
 * product representations (Inventory Items, POS Products, Database records)
 */

import {
  Item,
  Volume,
  Batch,
  BottleStates,
} from "@/lib/services/inventoryService";
import {
  UnifiedProduct,
  ProductInventory,
  ProductVolume,
  ProductBatch,
  POSProduct,
  POSLubricantProduct,
  POSLubricantVolume,
  isLubricantProduct,
} from "@/lib/types/unified-product";

/**
 * Converts an Inventory Item to a Unified Product
 */
export function itemToUnifiedProduct(
  item: Item,
  locationId: string,
  locationName?: string
): UnifiedProduct {
  const inventory: ProductInventory = {
    locationId,
    locationName,
    standardStock: item.stock || 0,
    openBottlesStock: item.bottleStates?.open || 0,
    closedBottlesStock: item.bottleStates?.closed || 0,
    totalStock:
      (item.stock || 0) +
      (item.bottleStates?.open || 0) +
      (item.bottleStates?.closed || 0),
    sellingPrice: item.price || 0,
    isAvailable:
      (item.stock || 0) > 0 ||
      (item.bottleStates?.open || 0) > 0 ||
      (item.bottleStates?.closed || 0) > 0,
  };

  const volumes: ProductVolume[] =
    item.volumes?.map((vol) => ({
      id: vol.id,
      size: vol.size,
      price: vol.price,
      isActive: true,
    })) || [];

  const batches: ProductBatch[] =
    item.batches?.map((batch) => ({
      id: batch.id,
      purchaseDate: batch.purchase_date,
      expirationDate: batch.expiration_date,
      supplierId: batch.supplier_id,
      costPrice: batch.cost_price,
      initialQuantity: batch.initial_quantity,
      currentQuantity: batch.current_quantity,
      isActiveBatch: true, // Derive from batch data if needed
    })) || [];

  // Format manufacturing date for HTML date input (YYYY-MM-DD)
  let formattedManufacturingDate: string | null = null;
  if (item.manufacturingDate) {
    try {
      console.log(
        "Raw manufacturing date from item:",
        item.manufacturingDate,
        typeof item.manufacturingDate
      );

      // Handle different date formats from database
      if (typeof item.manufacturingDate === "string") {
        // If it's already in YYYY-MM-DD format, use it directly
        if (/^\d{4}-\d{2}-\d{2}$/.test(item.manufacturingDate)) {
          formattedManufacturingDate = item.manufacturingDate;
          console.log(
            "Date already in YYYY-MM-DD format:",
            formattedManufacturingDate
          );
        } else {
          // Try to parse the string as a date
          const date = new Date(item.manufacturingDate);
          if (!isNaN(date.getTime())) {
            formattedManufacturingDate = date.toISOString().split("T")[0];
            console.log(
              "Parsed string date to YYYY-MM-DD:",
              formattedManufacturingDate
            );
          }
        }
      } else if (item.manufacturingDate instanceof Date) {
        // Handle Date objects directly
        formattedManufacturingDate = item.manufacturingDate
          .toISOString()
          .split("T")[0];
        console.log(
          "Converted Date object to YYYY-MM-DD:",
          formattedManufacturingDate
        );
      } else {
        // Try to convert to Date and format
        const date = new Date(item.manufacturingDate as any);
        if (!isNaN(date.getTime())) {
          formattedManufacturingDate = date.toISOString().split("T")[0];
          console.log(
            "Converted unknown type to YYYY-MM-DD:",
            formattedManufacturingDate
          );
        }
      }
    } catch (error) {
      console.warn(
        "Error formatting manufacturing date:",
        error,
        "Raw value:",
        item.manufacturingDate
      );
      formattedManufacturingDate = null;
    }
  } else {
    console.log("No manufacturing date provided in item");
  }

  return {
    id: item.id,
    name: item.name,
    description: item.description,
    imageUrl: item.image_url || item.imageUrl,
    categoryId: item.category_id,
    categoryName: item.category,
    brandId: item.brand_id,
    brandName: item.brand,
    productType: item.type,
    basePrice: item.price || 0,
    costPrice: item.costPrice,
    lowStockThreshold: item.lowStockAlert || 5,
    manufacturingDate: formattedManufacturingDate,
    inventory,
    isLubricant: Boolean(item.is_oil || item.isOil),
    volumes: volumes.length > 0 ? volumes : undefined,
    bottleStates: item.bottleStates,
    batches: batches.length > 0 ? batches : undefined,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

/**
 * Converts a Unified Product back to an Inventory Item
 */
export function unifiedProductToItem(
  product: UnifiedProduct,
  locationId: string
): Omit<Item, "id"> {
  const volumes: Volume[] =
    product.volumes?.map((vol) => ({
      id: vol.id,
      item_id: product.id,
      size: vol.size,
      price: vol.price,
      created_at: null,
      updated_at: null,
    })) || [];

  const batches: Batch[] =
    product.batches?.map((batch) => ({
      id: batch.id,
      item_id: product.id,
      purchase_date: batch.purchaseDate,
      expiration_date: batch.expirationDate,
      supplier_id: batch.supplierId,
      cost_price: batch.costPrice,
      initial_quantity: batch.initialQuantity,
      current_quantity: batch.currentQuantity,
      created_at: null,
      updated_at: null,
    })) || [];

  return {
    name: product.name,
    price: product.inventory?.sellingPrice || product.basePrice,
    stock: product.inventory?.standardStock,
    bottleStates: product.bottleStates,
    category: product.categoryName,
    brand: product.brandName,
    brand_id: product.brandId,
    category_id: product.categoryId,
    type: product.productType,
    description: product.description,
    is_oil: product.isLubricant,
    isOil: product.isLubricant,
    imageUrl: product.imageUrl,
    image_url: product.imageUrl,
    volumes: volumes.length > 0 ? volumes : undefined,
    batches: batches.length > 0 ? batches : undefined,
    created_at: product.createdAt,
    updated_at: product.updatedAt,
    lowStockAlert: product.lowStockThreshold,
    costPrice: product.costPrice,
  };
}

/**
 * Converts a Unified Product to a POS Product for non-lubricant items
 */
export function unifiedProductToPOSProduct(
  product: UnifiedProduct
): POSProduct | null {
  if (isLubricantProduct(product)) {
    return null; // Lubricants should use the lubricant adapter
  }

  // Map category names to POS categories
  const categoryMapping: Record<string, POSProduct["category"]> = {
    Filters: "Filters",
    Parts: "Parts",
    "Additives & Fluids": "Additives & Fluids",
    Batteries: "Batteries",
    Lubricants: "Lubricants", // Fallback, but shouldn't happen
  };

  const category = product.categoryName
    ? categoryMapping[product.categoryName] || "Parts"
    : "Parts";

  // Debug: Log imageUrl transformation
  if (product.imageUrl) {
    console.log(`[unifiedProductToPOSProduct] Product ${product.name} has imageUrl:`, product.imageUrl);
  } else {
    console.log(`[unifiedProductToPOSProduct] Product ${product.name} has NO imageUrl`);
  }

  return {
    id: generateNumericId(product.id),
    originalId: product.id,
    name: product.name,
    price: product.inventory?.sellingPrice || product.basePrice,
    category,
    brand: product.brandName,
    type: product.productType,
    availableQuantity: product.inventory?.totalStock || 0,
    imageUrl: product.imageUrl || undefined,
    isAvailable: product.inventory?.isAvailable || false,
  };
}

/**
 * Converts a Unified Product to a POS Lubricant Product
 */
export function unifiedProductToPOSLubricantProduct(
  product: UnifiedProduct
): POSLubricantProduct | null {
  if (!isLubricantProduct(product)) {
    return null; // Non-lubricants should use the regular adapter
  }

  const volumes: POSLubricantVolume[] =
    product.volumes?.map((vol) => ({
      size: vol.size,
      price: vol.price,
      availableQuantity: calculateVolumeStock(product, vol.size),
      bottleStates: product.bottleStates,
    })) || [];

  // Debug: Log imageUrl transformation for lubricants
  if (product.imageUrl) {
    console.log(`[unifiedProductToPOSLubricantProduct] Product ${product.name} has imageUrl:`, product.imageUrl);
  }

  return {
    id: generateNumericId(product.id),
    originalId: product.id,
    brand: product.brandName || "Unknown Brand",
    name: product.name,
    basePrice: product.basePrice,
    type: product.productType || "Unknown Type",
    image: product.imageUrl || undefined,
    volumes,
    isAvailable: product.inventory?.isAvailable || false,
  };
}

/**
 * Generate a consistent numeric ID from a UUID for POS compatibility
 */
export function generateNumericId(uuid: string): number {
  // Use a hash of the UUID to generate a consistent numeric ID
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    const char = uuid.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Calculate available stock for a specific volume size (for lubricants)
 */
function calculateVolumeStock(
  product: UnifiedProduct,
  volumeSize: string
): number {
  if (!product.inventory) return 0;

  // For lubricants, we need to calculate stock based on bottle states
  // This is a simplified calculation - in a real scenario, you might want to
  // track stock per volume size more precisely
  const totalBottles =
    product.inventory.openBottlesStock + product.inventory.closedBottlesStock;

  // Distribute bottles across volumes based on some business logic
  // For now, we'll assume equal distribution
  const volumeCount = product.volumes?.length || 1;
  return Math.floor(totalBottles / volumeCount);
}

/**
 * Batch convert multiple items to unified products
 */
export function itemsToUnifiedProducts(
  items: Item[],
  locationId: string,
  locationName?: string
): UnifiedProduct[] {
  return items.map((item) =>
    itemToUnifiedProduct(item, locationId, locationName)
  );
}

/**
 * Batch convert unified products to POS products
 */
export function unifiedProductsToPOSProducts(products: UnifiedProduct[]): {
  regularProducts: POSProduct[];
  lubricantProducts: POSLubricantProduct[];
} {
  const regularProducts: POSProduct[] = [];
  const lubricantProducts: POSLubricantProduct[] = [];

  products.forEach((product) => {
    if (isLubricantProduct(product)) {
      const lubricantProduct = unifiedProductToPOSLubricantProduct(product);
      if (lubricantProduct) {
        lubricantProducts.push(lubricantProduct);
      }
    } else {
      const regularProduct = unifiedProductToPOSProduct(product);
      if (regularProduct) {
        regularProducts.push(regularProduct);
      }
    }
  });

  return { regularProducts, lubricantProducts };
}

/**
 * Get product availability info
 */
export function getProductAvailability(product: UnifiedProduct): {
  isAvailable: boolean;
  totalStock: number;
  isLowStock: boolean;
  stockMessage: string;
} {
  const totalStock = product.inventory?.totalStock || 0;
  const isAvailable = product.inventory?.isAvailable || false;
  const isLowStock = totalStock <= product.lowStockThreshold;

  let stockMessage = "";
  if (!isAvailable || totalStock === 0) {
    stockMessage = "Out of stock";
  } else if (isLowStock) {
    stockMessage = `Low stock (${totalStock} remaining)`;
  } else {
    stockMessage = `${totalStock} in stock`;
  }

  return {
    isAvailable,
    totalStock,
    isLowStock,
    stockMessage,
  };
}

/**
 * Validate if a product can be sold with the requested quantity
 */
export function validateSaleQuantity(
  product: UnifiedProduct,
  requestedQuantity: number
): {
  canSell: boolean;
  availableQuantity: number;
  errorMessage?: string;
} {
  const availability = getProductAvailability(product);

  if (!availability.isAvailable) {
    return {
      canSell: false,
      availableQuantity: 0,
      errorMessage: "Product is not available for sale",
    };
  }

  if (requestedQuantity > availability.totalStock) {
    return {
      canSell: false,
      availableQuantity: availability.totalStock,
      errorMessage: `Only ${availability.totalStock} units available, but ${requestedQuantity} requested`,
    };
  }

  return {
    canSell: true,
    availableQuantity: availability.totalStock,
  };
}
