"use client";

import { useEffect, useState, useCallback, useRef } from "react";

// Redis import removed
import { Item } from "@/lib/services/inventoryService";

// Local storage keys
const STORAGE_KEYS = {
  INVENTORY_ITEMS: "inventory:items",
  CATEGORIES: "inventory:categories",
  BRANDS: "inventory:brands",
};

export function useCachedInventory() {
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isCacheLoaded, setIsCacheLoaded] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced localStorage update function
  const debouncedUpdateStorage = useCallback((items: Item[]) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for debounced update
    debounceTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(
          STORAGE_KEYS.INVENTORY_ITEMS,
          JSON.stringify(items)
        );
        console.log("Stored", items.length, "inventory items (debounced)");
      } catch (error) {
        console.error("Error storing inventory:", error);
      }
    }, 300); // 300ms debounce delay
  }, []);

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

  // Cache items when they change (debounced)
  useEffect(() => {
    if (!isCacheLoaded) return;

    debouncedUpdateStorage(inventory.items);
  }, [inventory.items, isCacheLoaded, debouncedUpdateStorage]);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

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
