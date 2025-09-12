/**
 * Inventory-POS Synchronization Service
 *
 * This service handles real-time synchronization between the inventory system
 * and the POS system, ensuring data consistency and handling stock updates.
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { UnifiedProduct, ProductInventory } from "@/lib/types/unified-product";
import {
  itemsToUnifiedProducts,
  unifiedProductsToPOSProducts,
  validateSaleQuantity,
} from "@/lib/adapters/product-adapters";
import { fetchItems, updateItem, Item } from "@/lib/services/inventoryService";
import { toast } from "@/components/ui/use-toast";

// Sync event types
export type SyncEventType =
  | "products-updated"
  | "stock-changed"
  | "product-added"
  | "product-removed"
  | "sync-error";

export interface SyncEvent {
  type: SyncEventType;
  productId?: string;
  locationId?: string;
  data?: any;
  timestamp: Date;
}

// Sync configuration
export interface SyncConfig {
  autoRefreshInterval: number; // milliseconds
  enableRealTimeSync: boolean;
  maxRetries: number;
  retryDelay: number; // milliseconds
}

const DEFAULT_SYNC_CONFIG: SyncConfig = {
  autoRefreshInterval: 30000, // 30 seconds
  enableRealTimeSync: true,
  maxRetries: 3,
  retryDelay: 1000, // 1 second
};

// Stock update interface
export interface StockUpdate {
  productId: string;
  locationId: string;
  quantityChange: number;
  updateType: "sale" | "restock" | "adjustment" | "return";
  referenceId?: string; // transaction ID, batch ID, etc.
  notes?: string;
}

/**
 * Custom hook for managing inventory-POS synchronization
 */
export function useInventoryPOSSync(
  locationId: string | null,
  config: Partial<SyncConfig> = {}
) {
  const finalConfig = { ...DEFAULT_SYNC_CONFIG, ...config };

  const [products, setProducts] = useState<UnifiedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackgroundSyncing, setIsBackgroundSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncEvents, setSyncEvents] = useState<SyncEvent[]>([]);

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  // Add sync event
  const addSyncEvent = useCallback((event: Omit<SyncEvent, "timestamp">) => {
    const fullEvent: SyncEvent = {
      ...event,
      timestamp: new Date(),
    };

    setSyncEvents((prev) => [...prev.slice(-49), fullEvent]); // Keep last 50 events

    // Show toast for important events
    if (event.type === "sync-error") {
      toast({
        title: "Sync Error",
        description: event.data?.message || "Failed to synchronize data",
        variant: "destructive",
      });
    }
  }, []);

  // Fetch and sync products from inventory
  const syncProducts = useCallback(
    async (showToast = false, isBackgroundSync = false) => {
      if (!locationId) {
        setError("No location selected");
        return;
      }

      try {
        // For background syncs, use background loading state
        // For initial load or manual refresh, use main loading state
        if (isBackgroundSync && !isInitialLoadRef.current) {
          setIsBackgroundSyncing(true);
        } else {
          setIsLoading(true);
          if (isInitialLoadRef.current) {
            isInitialLoadRef.current = false;
          }
        }

        setError(null);

        console.log(
          `🔄 Syncing products for location: ${locationId} (background: ${isBackgroundSync})`
        );

        const inventoryItems = await fetchItems(locationId);
        const unifiedProducts = itemsToUnifiedProducts(
          inventoryItems,
          locationId
        );

        setProducts(unifiedProducts);
        setLastSyncTime(new Date());
        retryCountRef.current = 0;

        addSyncEvent({
          type: "products-updated",
          locationId,
          data: { count: unifiedProducts.length },
        });

        console.log(
          `✅ Successfully synced ${unifiedProducts.length} products (background: ${isBackgroundSync})`
        );

        if (showToast) {
          toast({
            title: "Products Synced",
            description: `Updated ${unifiedProducts.length} products`,
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to sync products";
        console.error("❌ Sync error:", err);

        // Only set error state for initial loads or manual syncs
        // Background sync errors shouldn't disrupt the UI
        if (!isBackgroundSync || isInitialLoadRef.current) {
          setError(errorMessage);
        }

        addSyncEvent({
          type: "sync-error",
          locationId,
          data: {
            message: errorMessage,
            error: err,
            isBackground: isBackgroundSync,
          },
        });

        // Retry logic
        if (retryCountRef.current < finalConfig.maxRetries) {
          retryCountRef.current++;
          console.log(
            `🔁 Retrying sync (attempt ${retryCountRef.current}/${finalConfig.maxRetries})`
          );

          setTimeout(() => {
            syncProducts(false, isBackgroundSync);
          }, finalConfig.retryDelay * retryCountRef.current);
        }
      } finally {
        if (isBackgroundSync && !isInitialLoadRef.current) {
          setIsBackgroundSyncing(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    [locationId, finalConfig.maxRetries, finalConfig.retryDelay, addSyncEvent]
  );

  // Update stock levels
  const updateStock = useCallback(
    async (stockUpdate: StockUpdate): Promise<boolean> => {
      try {
        console.log(
          `📦 Updating stock for product: ${stockUpdate.productId}`,
          stockUpdate
        );

        // Find the current product
        const currentProduct = products.find(
          (p) => p.id === stockUpdate.productId
        );
        if (!currentProduct || !currentProduct.inventory) {
          throw new Error(
            `Product ${stockUpdate.productId} not found or has no inventory`
          );
        }

        // Calculate new stock levels
        const currentInventory = currentProduct.inventory;
        let newStandardStock = currentInventory.standardStock;
        let newOpenBottlesStock = currentInventory.openBottlesStock;
        let newClosedBottlesStock = currentInventory.closedBottlesStock;

        // Apply stock change based on product type
        if (currentProduct.isLubricant && currentProduct.bottleStates) {
          // For lubricants, distribute the change across bottle states
          // This is a simplified logic - you might want to be more specific
          if (stockUpdate.quantityChange > 0) {
            // Restocking - add to closed bottles by default
            newClosedBottlesStock += stockUpdate.quantityChange;
          } else {
            // Sale/reduction - remove from available bottles
            const totalChange = Math.abs(stockUpdate.quantityChange);
            if (newClosedBottlesStock >= totalChange) {
              newClosedBottlesStock -= totalChange;
            } else {
              const remaining = totalChange - newClosedBottlesStock;
              newClosedBottlesStock = 0;
              newOpenBottlesStock = Math.max(
                0,
                newOpenBottlesStock - remaining
              );
            }
          }
        } else {
          // For regular products, update standard stock
          newStandardStock = Math.max(
            0,
            newStandardStock + stockUpdate.quantityChange
          );
        }

        // Create updated item for the inventory service
        const updatedItemData: Partial<Item> = {
          name: currentProduct.name, // Required by API
          stock: newStandardStock,
          bottleStates: currentProduct.isLubricant
            ? {
                open: newOpenBottlesStock,
                closed: newClosedBottlesStock,
              }
            : undefined,
        };

        // Update via inventory service
        const success = await updateItem(
          stockUpdate.productId,
          updatedItemData as Omit<Item, "id">,
          stockUpdate.locationId
        );

        if (success) {
          // Update local state
          setProducts((prevProducts) =>
            prevProducts.map((product) => {
              if (product.id === stockUpdate.productId && product.inventory) {
                const updatedInventory: ProductInventory = {
                  ...product.inventory,
                  standardStock: newStandardStock,
                  openBottlesStock: newOpenBottlesStock,
                  closedBottlesStock: newClosedBottlesStock,
                  totalStock:
                    newStandardStock +
                    newOpenBottlesStock +
                    newClosedBottlesStock,
                  isAvailable:
                    newStandardStock +
                      newOpenBottlesStock +
                      newClosedBottlesStock >
                    0,
                };

                return {
                  ...product,
                  inventory: updatedInventory,
                  bottleStates: currentProduct.isLubricant
                    ? {
                        open: newOpenBottlesStock,
                        closed: newClosedBottlesStock,
                      }
                    : undefined,
                };
              }
              return product;
            })
          );

          addSyncEvent({
            type: "stock-changed",
            productId: stockUpdate.productId,
            locationId: stockUpdate.locationId,
            data: {
              change: stockUpdate.quantityChange,
              updateType: stockUpdate.updateType,
              newTotal:
                newStandardStock + newOpenBottlesStock + newClosedBottlesStock,
            },
          });

          console.log(
            `✅ Stock updated successfully for product: ${stockUpdate.productId}`
          );
          return true;
        } else {
          throw new Error("Failed to update stock in inventory system");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to update stock";
        console.error("❌ Stock update error:", err);

        addSyncEvent({
          type: "sync-error",
          productId: stockUpdate.productId,
          locationId: stockUpdate.locationId,
          data: { message: errorMessage, error: err },
        });

        return false;
      }
    },
    [products, addSyncEvent]
  );

  // Process a sale and update stock
  const processSale = useCallback(
    async (
      productId: string,
      quantity: number,
      transactionId?: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!locationId) {
        return { success: false, error: "No location selected" };
      }

      const product = products.find((p) => p.id === productId);
      if (!product) {
        return { success: false, error: "Product not found" };
      }

      // Validate sale quantity
      const validation = validateSaleQuantity(product, quantity);
      if (!validation.canSell) {
        return { success: false, error: validation.errorMessage };
      }

      // Update stock
      const stockUpdate: StockUpdate = {
        productId,
        locationId,
        quantityChange: -quantity,
        updateType: "sale",
        referenceId: transactionId,
        notes: `Sale of ${quantity} units`,
      };

      const success = await updateStock(stockUpdate);

      if (success) {
        console.log(
          `💰 Sale processed: ${quantity} units of product ${productId}`
        );
      }

      return { success, error: success ? undefined : "Failed to process sale" };
    },
    [locationId, products, updateStock]
  );

  // Get POS-formatted data
  const getPOSData = useCallback(() => {
    return unifiedProductsToPOSProducts(products);
  }, [products]);

  // Auto-sync setup
  useEffect(() => {
    if (finalConfig.enableRealTimeSync && locationId) {
      // Initial sync (not background)
      syncProducts(false, false);

      // Set up periodic background sync
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      const scheduleNextSync = () => {
        syncTimeoutRef.current = setTimeout(() => {
          // Background syncs don't show loading UI
          syncProducts(false, true);
          scheduleNextSync();
        }, finalConfig.autoRefreshInterval);
      };

      scheduleNextSync();
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [
    locationId,
    finalConfig.enableRealTimeSync,
    finalConfig.autoRefreshInterval,
    syncProducts,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Data
    products,
    posData: getPOSData(),
    isLoading,
    isBackgroundSyncing,
    error,
    lastSyncTime,
    syncEvents,

    // Actions
    syncProducts: () => syncProducts(true, false), // Manual sync shows loading UI
    updateStock,
    processSale,

    // Utils
    getProductById: (id: string) => products.find((p) => p.id === id),
    getProductAvailability: (id: string) => {
      const product = products.find((p) => p.id === id);
      if (!product) return null;
      return validateSaleQuantity(product, 1);
    },

    // Config
    config: finalConfig,
  };
}
