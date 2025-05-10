"use client";

import { useState, useEffect, useMemo } from "react";
import { Item } from "@/lib/services/branchInventoryService";
import { redisCache } from "@/lib/services/redisService";

// Branch specific constants
export const HAFITH_BRANCH = {
  id: "2",
  name: "Hafith Branch",
  address: "456 Center Ave",
  phone: "555-5678",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Mock Hafith specific inventory items
export const HAFITH_INVENTORY: Item[] = [
  {
    id: "hf1",
    name: "Brake Fluid DOT 4",
    price: 16.99,
    stock: 32,
    category: "Fluids",
    brand: "ATE",
    brand_id: "ate1",
    category_id: "4",
    type: "DOT 4",
    sku: "FLD-BRK-DOT4",
    description: "High performance brake fluid for hydraulic brake systems",
    is_oil: true,
    isOil: true,
    imageUrl: "/placeholders/fluid.jpg",
    image_url: "/placeholders/fluid.jpg",
    volumes: [
      { id: "v1", item_id: "hf1", size: "500ml", price: 16.99, created_at: "", updated_at: "" },
      { id: "v2", item_id: "hf1", size: "1L", price: 29.99, created_at: "", updated_at: "" },
    ],
    bottleStates: { open: 2, closed: 30 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "hf2",
    name: "Diesel Particulate Filter Cleaner",
    price: 24.99,
    stock: 15,
    category: "Additives",
    brand: "Liqui Moly",
    brand_id: "lm1",
    category_id: "5",
    type: "Cleaner",
    sku: "ADD-DPF-LQM",
    description: "Professional cleaner for clogged diesel particulate filters",
    is_oil: true,
    isOil: true,
    imageUrl: "/placeholders/fluid.jpg",
    image_url: "/placeholders/fluid.jpg",
    volumes: [
      { id: "v3", item_id: "hf2", size: "1L", price: 24.99, created_at: "", updated_at: "" },
    ],
    bottleStates: { open: 1, closed: 14 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "hf3",
    name: "Oil Change Kit - Toyota",
    price: 59.99,
    stock: 10,
    category: "Kits",
    brand: "H Automotives",
    brand_id: "ha1",
    category_id: "6",
    type: "Maintenance",
    sku: "KIT-OCK-TOY",
    description: "Complete oil change kit for Toyota vehicles with oil, filter, and drain plug",
    is_oil: false,
    isOil: false,
    imageUrl: "/placeholders/kit.jpg",
    image_url: "/placeholders/kit.jpg",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "hf4",
    name: "BMW Genuine Oil Filter",
    price: 18.99,
    stock: 22,
    category: "Filters",
    brand: "BMW",
    brand_id: "bmw1",
    category_id: "2",
    type: "Genuine",
    sku: "FIL-OIL-BMW",
    description: "Genuine BMW oil filter for optimal engine protection",
    is_oil: false,
    isOil: false,
    imageUrl: "/placeholders/filter.jpg",
    image_url: "/placeholders/filter.jpg",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Cache keys
const CACHE_KEYS = {
  HAFITH_ITEMS: 'branch:hafith:items',
};

// Interface for the returned data
interface UseHafithInventoryReturn {
  // Basic data
  items: Item[];
  filteredItems: Item[];
  branch: typeof HAFITH_BRANCH;
  
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

export function useHafithInventory(): UseHafithInventoryReturn {
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
        const cachedItems = await redisCache.get<Item[]>(CACHE_KEYS.HAFITH_ITEMS);
        
        if (cachedItems && cachedItems.length > 0) {
          console.log('Loaded Hafith items from cache:', cachedItems.length, 'items');
          setItems(cachedItems);
        } else {
          // If not cached yet, use the mock data
          console.log('Using mock Hafith data');
          setItems(HAFITH_INVENTORY);
          
          // Cache the initial data
          await redisCache.set(CACHE_KEYS.HAFITH_ITEMS, HAFITH_INVENTORY);
        }
        
        setIsLoading(false);
        setIsCacheReady(true);
      } catch (error) {
        console.error('Error initializing Hafith inventory:', error);
        // Fallback to mock data in case of error
        setItems(HAFITH_INVENTORY);
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
        await redisCache.set(CACHE_KEYS.HAFITH_ITEMS, items);
        console.log('Updated Hafith cache with', items.length, 'items');
      } catch (error) {
        console.error('Error updating Hafith cache:', error);
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
      const newId = `hf${items.length + 1}`;
      
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
      await redisCache.set(CACHE_KEYS.HAFITH_ITEMS, updatedItems);
      
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
      await redisCache.set(CACHE_KEYS.HAFITH_ITEMS, updatedItems);
      
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
      await redisCache.set(CACHE_KEYS.HAFITH_ITEMS, updatedItems);
      
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
    branch: HAFITH_BRANCH,
    
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