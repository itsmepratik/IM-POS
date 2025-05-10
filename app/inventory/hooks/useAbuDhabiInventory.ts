"use client";

import { useState, useEffect, useMemo } from "react";
import { Item } from "@/lib/services/branchInventoryService";
import { redisCache } from "@/lib/services/redisService";

// Branch specific constants
export const ABU_DHABI_BRANCH = {
  id: "1",
  name: "Abu Dhabi Branch",
  address: "123 Main St",
  phone: "555-1234",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock Abu Dhabi specific inventory items
export const ABU_DHABI_INVENTORY: Item[] = [
  {
    id: "ad1",
    name: "Toyota Genuine Oil",
    price: 32.99,
    stock: 45,
    category: "Oils",
    brand: "Toyota",
    brand_id: "t1",
    category_id: "1",
    type: "Synthetic",
    sku: "OIL-TOY-GENUINE",
    description: "Toyota genuine motor oil for Toyota vehicles",
    is_oil: true,
    isOil: true,
    imageUrl: "/placeholders/oil.jpg",
    image_url: "/placeholders/oil.jpg",
    volumes: [
      { id: "v1", item_id: "ad1", size: "1L", price: 14.99, created_at: "", updated_at: "" },
      { id: "v2", item_id: "ad1", size: "4L", price: 32.99, created_at: "", updated_at: "" },
    ],
    bottleStates: { open: 3, closed: 42 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "ad2",
    name: "Nissan CVT Fluid",
    price: 39.99,
    stock: 18,
    category: "Fluids",
    brand: "Nissan",
    brand_id: "n1",
    category_id: "4",
    type: "Transmission",
    sku: "FLD-NSN-CVT",
    description: "Nissan CVT transmission fluid for continuous variable transmissions",
    is_oil: true,
    isOil: true,
    imageUrl: "/placeholders/fluid.jpg",
    image_url: "/placeholders/fluid.jpg",
    volumes: [
      { id: "v3", item_id: "ad2", size: "1L", price: 16.99, created_at: "", updated_at: "" },
      { id: "v4", item_id: "ad2", size: "4L", price: 39.99, created_at: "", updated_at: "" },
    ],
    bottleStates: { open: 2, closed: 16 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "ad3",
    name: "Mercedes Synthetic Oil",
    price: 42.99,
    stock: 23,
    category: "Oils",
    brand: "Mercedes",
    brand_id: "m1",
    category_id: "1",
    type: "Synthetic",
    sku: "OIL-MRC-SYNTH",
    description: "Mercedes-Benz approved synthetic engine oil",
    is_oil: true,
    isOil: true,
    imageUrl: "/placeholders/oil.jpg",
    image_url: "/placeholders/oil.jpg",
    volumes: [
      { id: "v5", item_id: "ad3", size: "1L", price: 18.99, created_at: "", updated_at: "" },
      { id: "v6", item_id: "ad3", size: "5L", price: 42.99, created_at: "", updated_at: "" },
    ],
    bottleStates: { open: 5, closed: 18 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Cache keys
const CACHE_KEYS = {
  ABU_DHABI_ITEMS: 'branch:abudhabi:items',
};

// Interface for the returned data
interface UseAbuDhabiInventoryReturn {
  // Basic data
  items: Item[];
  filteredItems: Item[];
  branch: typeof ABU_DHABI_BRANCH;
  
  // Filter states
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  showLowStock: boolean;
  setShowLowStock: (show: boolean) => void;
  
  // Oil-specific data
  oilItems: Item[];
  nonOilItems: Item[];
  
  // Operations
  addItem: (item: Omit<Item, "id">) => Promise<Item>;
  updateItem: (id: string, updates: Partial<Item>) => Promise<Item | null>;
  deleteItem: (id: string) => Promise<boolean>;
  
  // Cache state
  isCacheReady: boolean;
}

export function useAbuDhabiInventory(): UseAbuDhabiInventoryReturn {
  // State for items (starting with mock data)
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showLowStock, setShowLowStock] = useState(false);
  const [isCacheReady, setIsCacheReady] = useState(false);
  
  // Categories derived from items
  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(items.map((item) => item.category || "Uncategorized"))
    );
    return ["All", ...uniqueCategories];
  }, [items]);
  
  // Oil-specific data
  const oilItems = useMemo(() => items.filter(item => item.isOil), [items]);
  const nonOilItems = useMemo(() => items.filter(item => !item.isOil), [items]);
  
  // Load data from cache or initialize with mock data
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Try to load from cache first
        const cachedItems = await redisCache.get<Item[]>(CACHE_KEYS.ABU_DHABI_ITEMS);
        
        if (cachedItems && cachedItems.length > 0) {
          console.log('Loaded Abu Dhabi items from cache:', cachedItems.length, 'items');
          setItems(cachedItems);
        } else {
          // If not cached yet, use the mock data
          console.log('Using mock Abu Dhabi data');
          setItems(ABU_DHABI_INVENTORY);
          
          // Cache the initial data
          await redisCache.set(CACHE_KEYS.ABU_DHABI_ITEMS, ABU_DHABI_INVENTORY);
        }
        
        setIsLoading(false);
        setIsCacheReady(true);
      } catch (error) {
        console.error('Error initializing Abu Dhabi inventory:', error);
        // Fallback to mock data in case of error
        setItems(ABU_DHABI_INVENTORY);
        setIsLoading(false);
        setIsCacheReady(false);
      }
    };
    
    initializeData();
  }, []);
  
  // Update cache when items change
  useEffect(() => {
    if (!isCacheReady || isLoading) return;
    
    const updateCache = async () => {
      try {
        await redisCache.set(CACHE_KEYS.ABU_DHABI_ITEMS, items);
        console.log('Updated Abu Dhabi cache with', items.length, 'items');
      } catch (error) {
        console.error('Error updating Abu Dhabi cache:', error);
      }
    };
    
    updateCache();
  }, [items, isCacheReady, isLoading]);
  
  // Filtered items based on search, category, and stock filters
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search query filter
      const matchesSearch = 
        (item.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.brand || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.sku || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory = 
        selectedCategory === "All" || 
        item.category === selectedCategory;
      
      // Low stock filter
      const matchesLowStock = !showLowStock || (item.stock || 0) < 10;
      
      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [items, searchQuery, selectedCategory, showLowStock]);
  
  // CRUD operations that also update the cache
  const addItem = async (itemData: Omit<Item, "id">): Promise<Item> => {
    try {
      // Create new ID (in a real app this would come from the backend)
      const newId = `ad${items.length + 1}`;
      
      // Create new item
      const newItem: Item = {
        ...itemData,
        id: newId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Update state
      const updatedItems = [...items, newItem];
      setItems(updatedItems);
      
      // Update cache
      await redisCache.set(CACHE_KEYS.ABU_DHABI_ITEMS, updatedItems);
      
      return newItem;
    } catch (error) {
      console.error('Error adding item:', error);
      throw new Error('Failed to add item');
    }
  };
  
  const updateItem = async (id: string, updates: Partial<Item>): Promise<Item | null> => {
    try {
      // Find the item
      const itemIndex = items.findIndex(item => item.id === id);
      if (itemIndex === -1) return null;
      
      // Create updated item
      const updatedItem: Item = {
        ...items[itemIndex],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      
      // Update state
      const updatedItems = [...items];
      updatedItems[itemIndex] = updatedItem;
      setItems(updatedItems);
      
      // Update cache
      await redisCache.set(CACHE_KEYS.ABU_DHABI_ITEMS, updatedItems);
      
      return updatedItem;
    } catch (error) {
      console.error('Error updating item:', error);
      return null;
    }
  };
  
  const deleteItem = async (id: string): Promise<boolean> => {
    try {
      // Filter out the item
      const updatedItems = items.filter(item => item.id !== id);
      
      // If no items were removed, the item wasn't found
      if (updatedItems.length === items.length) return false;
      
      // Update state
      setItems(updatedItems);
      
      // Update cache
      await redisCache.set(CACHE_KEYS.ABU_DHABI_ITEMS, updatedItems);
      
      return true;
    } catch (error) {
      console.error('Error deleting item:', error);
      return false;
    }
  };
  
  return {
    // Basic data
    items,
    filteredItems,
    branch: ABU_DHABI_BRANCH,
    
    // Filter states
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    showLowStock,
    setShowLowStock,
    
    // Oil data
    oilItems,
    nonOilItems,
    
    // Operations
    addItem,
    updateItem,
    deleteItem,
    
    // Cache state
    isCacheReady
  };
} 