"use client";

import { useEffect, useState } from "react";
import { useInventoryMockData } from "./useInventoryMockData";
import { redisCache } from "@/lib/services/redisService";
import { Item } from "@/lib/services/branchInventoryService";

// Cache keys
const CACHE_KEYS = {
  INVENTORY_ITEMS: 'inventory:items',
  CATEGORIES: 'inventory:categories',
  BRANDS: 'inventory:brands',
};

export function useCachedInventory() {
  const inventory = useInventoryMockData();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isCacheLoaded, setIsCacheLoaded] = useState(false);

  // Load data from cache on initial load
  useEffect(() => {
    if (!isInitialLoad) return;

    const loadFromCache = async () => {
      try {
        // Try to get inventory data from cache
        const cachedItems = await redisCache.get<Item[]>(CACHE_KEYS.INVENTORY_ITEMS);
        
        if (cachedItems) {
          console.log('Loaded inventory from cache:', cachedItems.length, 'items');
          // If we have cached data, update the state directly
          inventory.setItems?.(cachedItems);
        }
        
        setIsCacheLoaded(true);
        setIsInitialLoad(false);
      } catch (error) {
        console.error('Error loading from cache:', error);
        setIsCacheLoaded(true);
        setIsInitialLoad(false);
      }
    };

    loadFromCache();
  }, [isInitialLoad, inventory]);

  // Cache items when they change
  useEffect(() => {
    if (!isCacheLoaded) return;

    const cacheInventory = async () => {
      try {
        await redisCache.set(CACHE_KEYS.INVENTORY_ITEMS, inventory.items);
        console.log('Cached', inventory.items.length, 'inventory items');
      } catch (error) {
        console.error('Error caching inventory:', error);
      }
    };

    cacheInventory();
  }, [inventory.items, isCacheLoaded]);

  // Enhanced methods that update cache
  const enhancedHandlers = {
    handleDelete: async (id: string): Promise<boolean> => {
      const result = await inventory.handleDelete(id);
      if (result) {
        // Only update cache if operation was successful
        await redisCache.set(CACHE_KEYS.INVENTORY_ITEMS, inventory.items);
      }
      return result;
    },

    handleDuplicate: async (id: string): Promise<Item | null> => {
      const result = await inventory.handleDuplicate(id);
      if (result) {
        // Only update cache if operation was successful
        await redisCache.set(CACHE_KEYS.INVENTORY_ITEMS, inventory.items);
      }
      return result;
    },

    // Add more enhanced methods as needed
  };

  // Return the original inventory object with enhanced methods
  return {
    ...inventory,
    ...enhancedHandlers,
    isCacheReady: isCacheLoaded
  };
}

// Type augmentation for TypeScript support
declare module "./useInventoryMockData" {
  interface UseInventoryMockDataReturn {
    setItems?: (items: Item[]) => void;
  }
} 