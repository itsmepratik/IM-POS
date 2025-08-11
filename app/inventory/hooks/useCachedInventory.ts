"use client";

import { useEffect, useState } from "react";
import { useInventoryMockData } from "./useInventoryMockData";
// Redis import removed
import { Item } from "@/lib/services/branchInventoryService";

// Local storage keys
const STORAGE_KEYS = {
  INVENTORY_ITEMS: "inventory:items",
  CATEGORIES: "inventory:categories",
  BRANDS: "inventory:brands",
};

export function useCachedInventory() {
  const inventory = useInventoryMockData();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isCacheLoaded, setIsCacheLoaded] = useState(false);

  // Load data from cache on initial load
  useEffect(() => {
    if (!isInitialLoad) return;

    const loadFromStorage = () => {
      try {
        // Try to get inventory data from localStorage
        const storedData = localStorage.getItem(STORAGE_KEYS.INVENTORY_ITEMS);
        const cachedItems = storedData
          ? (JSON.parse(storedData) as Item[])
          : null;

        if (cachedItems) {
          console.log(
            "Loaded inventory from localStorage:",
            cachedItems.length,
            "items"
          );
          // If we have stored data, update the state directly
          inventory.setItems?.(cachedItems);
        }

        setIsCacheLoaded(true);
        setIsInitialLoad(false);
      } catch (error) {
        console.error("Error loading from localStorage:", error);
        setIsCacheLoaded(true);
        setIsInitialLoad(false);
      }
    };

    loadFromStorage();
  }, [isInitialLoad, inventory]);

  // Cache items when they change
  useEffect(() => {
    if (!isCacheLoaded) return;

    const storeInventory = () => {
      try {
        localStorage.setItem(
          STORAGE_KEYS.INVENTORY_ITEMS,
          JSON.stringify(inventory.items)
        );
        console.log("Stored", inventory.items.length, "inventory items");
      } catch (error) {
        console.error("Error storing inventory:", error);
      }
    };

    storeInventory();
  }, [inventory.items, isCacheLoaded]);

  // Enhanced methods that update cache
  const enhancedHandlers = {
    handleDelete: async (id: string): Promise<boolean> => {
      const result = await inventory.handleDelete(id);
      if (result) {
        // Only update localStorage if operation was successful
        localStorage.setItem(
          STORAGE_KEYS.INVENTORY_ITEMS,
          JSON.stringify(inventory.items)
        );
      }
      return result;
    },

    handleDuplicate: async (id: string): Promise<Item | null> => {
      const result = await inventory.handleDuplicate(id);
      if (result) {
        // Only update localStorage if operation was successful
        localStorage.setItem(
          STORAGE_KEYS.INVENTORY_ITEMS,
          JSON.stringify(inventory.items)
        );
      }
      return result;
    },

    // Add more enhanced methods as needed
  };

  // Return the original inventory object with enhanced methods
  return {
    ...inventory,
    ...enhancedHandlers,
    isCacheReady: isCacheLoaded,
  };
}

// Type augmentation for TypeScript support
declare module "./useInventoryMockData" {
  interface UseInventoryMockDataReturn {
    setItems?: (items: Item[]) => void;
  }
}
