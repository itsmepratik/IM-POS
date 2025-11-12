import {
  CreateNotificationParams,
  NotificationCategory,
} from "@/lib/services/notificationService";

/**
 * Create a notification for lubricant volume limit exceeded
 */
export function createLubricantVolumeAlert(params: {
  productId: string;
  productName: string;
  availableVolume: number;
  attemptedVolume: number;
  size: string;
  bottleType: "open" | "closed";
}): CreateNotificationParams {
  const formattedAvailable = params.availableVolume
    .toFixed(1)
    .replace(/\.0$/, "");
  const formattedAttempted = params.attemptedVolume
    .toFixed(1)
    .replace(/\.0$/, "");

  return {
    type: "error",
    title: "Insufficient Open Bottle Volume",
    message: `Only ${formattedAvailable}L available in open bottles for ${params.productName}. Cannot select ${formattedAttempted}L.`,
    category: "lubricant",
    metadata: {
      productId: params.productId,
      productName: params.productName,
      availableVolume: params.availableVolume,
      attemptedVolume: params.attemptedVolume,
      size: params.size,
      bottleType: params.bottleType,
    },
  };
}

/**
 * Create a notification for low stock alert
 * (For future use)
 */
export function createLowStockAlert(params: {
  productId: string;
  productName: string;
  currentStock: number;
  threshold: number;
  locationId?: string;
  locationName?: string;
}): CreateNotificationParams {
  return {
    type: "warning",
    title: "Low Stock Alert",
    message: `${params.productName} is running low. Current stock: ${params.currentStock}, Threshold: ${params.threshold}`,
    category: "stock",
    metadata: {
      productId: params.productId,
      productName: params.productName,
      currentStock: params.currentStock,
      threshold: params.threshold,
      locationId: params.locationId,
      locationName: params.locationName,
    },
  };
}

/**
 * Create a notification for out of stock alert
 * (For future use)
 */
export function createOutOfStockAlert(params: {
  productId: string;
  productName: string;
  locationId?: string;
  locationName?: string;
}): CreateNotificationParams {
  return {
    type: "error",
    title: "Out of Stock Alert",
    message: `${params.productName} is out of stock${params.locationName ? ` at ${params.locationName}` : ""}. Restock needed.`,
    category: "stock",
    metadata: {
      productId: params.productId,
      productName: params.productName,
      locationId: params.locationId,
      locationName: params.locationName,
    },
  };
}

/**
 * Create a notification for inventory discrepancy
 * (For future use)
 */
export function createInventoryDiscrepancyAlert(params: {
  productId: string;
  productName: string;
  expectedStock: number;
  actualStock: number;
  locationId?: string;
  locationName?: string;
}): CreateNotificationParams {
  return {
    type: "warning",
    title: "Inventory Discrepancy",
    message: `Stock mismatch detected for ${params.productName}. Expected: ${params.expectedStock}, Actual: ${params.actualStock}`,
    category: "inventory",
    metadata: {
      productId: params.productId,
      productName: params.productName,
      expectedStock: params.expectedStock,
      actualStock: params.actualStock,
      locationId: params.locationId,
      locationName: params.locationName,
    },
  };
}

