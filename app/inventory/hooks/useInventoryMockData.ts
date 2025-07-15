"use client";

import { useState, useEffect, useMemo } from "react";
import { Item } from "@/lib/services/branchInventoryService";

// Mock data for inventory items
const MOCK_INVENTORY_ITEMS: Item[] = [
  {
    id: "1",
    name: "Engine Lubricant 5W-30",
    price: 29.99,
    stock: 45,
    category: "Lubricants",
    brand: "Castrol",
    brand_id: "1",
    category_id: "1",
    type: "Synthetic",
    sku: "OIL-5W30-CAS",
    description: "Fully synthetic engine oil for modern engines",
    is_oil: true,
    isOil: true,
    imageUrl: "/placeholders/oil.jpg",
    image_url: "/placeholders/oil.jpg",
    volumes: [
      {
        id: "v1",
        item_id: "1",
        size: "1L",
        price: 12.99,
        created_at: "",
        updated_at: "",
      },
      {
        id: "v2",
        item_id: "1",
        size: "4L",
        price: 29.99,
        created_at: "",
        updated_at: "",
      },
      {
        id: "v3",
        item_id: "1",
        size: "5L",
        price: 34.99,
        created_at: "",
        updated_at: "",
      },
    ],
    bottleStates: { open: 3, closed: 42 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Engine Lubricant 10W-40",
    price: 24.99,
    stock: 8,
    category: "Lubricants",
    brand: "Mobil",
    brand_id: "2",
    category_id: "1",
    type: "Semi-Synthetic",
    sku: "OIL-10W40-MOB",
    description: "Semi-synthetic engine oil for older engines",
    is_oil: true,
    isOil: true,
    imageUrl: "/placeholders/oil.jpg",
    image_url: "/placeholders/oil.jpg",
    volumes: [
      {
        id: "v4",
        item_id: "2",
        size: "1L",
        price: 9.99,
        created_at: "",
        updated_at: "",
      },
      {
        id: "v5",
        item_id: "2",
        size: "4L",
        price: 24.99,
        created_at: "",
        updated_at: "",
      },
    ],
    bottleStates: { open: 2, closed: 6 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Oil Filter",
    price: 12.99,
    stock: 65,
    category: "Filters",
    brand: "Bosch",
    brand_id: "3",
    category_id: "2",
    type: "Regular",
    sku: "FIL-OIL-BOSCH",
    description: "Standard oil filter for most vehicles",
    is_oil: false,
    isOil: false,
    imageUrl: "/placeholders/filter.jpg",
    image_url: "/placeholders/filter.jpg",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Air Filter",
    price: 18.99,
    stock: 32,
    category: "Filters",
    brand: "K&N",
    brand_id: "4",
    category_id: "2",
    type: "Performance",
    sku: "FIL-AIR-KN",
    description: "High-flow air filter for improved performance",
    is_oil: false,
    isOil: false,
    imageUrl: "/placeholders/filter.jpg",
    image_url: "/placeholders/filter.jpg",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "5",
    name: "Brake Pads",
    price: 45.99,
    stock: 12,
    category: "Brakes",
    brand: "Akebono",
    brand_id: "5",
    category_id: "3",
    type: "Ceramic",
    sku: "BRK-PAD-AKE",
    description: "Ceramic brake pads for reduced noise and dust",
    is_oil: false,
    isOil: false,
    imageUrl: "/placeholders/brakes.jpg",
    image_url: "/placeholders/brakes.jpg",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "6",
    name: "Transmission Fluid",
    price: 19.99,
    stock: 25,
    category: "Fluids",
    brand: "Valvoline",
    brand_id: "6",
    category_id: "4",
    type: "Automatic",
    sku: "FLD-TRANS-VAL",
    description: "Automatic transmission fluid for most vehicles",
    is_oil: true,
    isOil: true,
    imageUrl: "/placeholders/fluid.jpg",
    image_url: "/placeholders/fluid.jpg",
    volumes: [
      {
        id: "v6",
        item_id: "6",
        size: "1L",
        price: 9.99,
        created_at: "",
        updated_at: "",
      },
      {
        id: "v7",
        item_id: "6",
        size: "3.78L",
        price: 19.99,
        created_at: "",
        updated_at: "",
      },
    ],
    bottleStates: { open: 5, closed: 20 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "7",
    name: "Coolant",
    price: 14.99,
    stock: 38,
    category: "Fluids",
    brand: "Prestone",
    brand_id: "7",
    category_id: "4",
    type: "All-Season",
    sku: "FLD-COOL-PRE",
    description: "All-season engine coolant and antifreeze",
    is_oil: true,
    isOil: true,
    imageUrl: "/placeholders/fluid.jpg",
    image_url: "/placeholders/fluid.jpg",
    volumes: [
      {
        id: "v8",
        item_id: "7",
        size: "1L",
        price: 7.99,
        created_at: "",
        updated_at: "",
      },
      {
        id: "v9",
        item_id: "7",
        size: "3.78L",
        price: 14.99,
        created_at: "",
        updated_at: "",
      },
    ],
    bottleStates: { open: 8, closed: 30 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "8",
    name: "Wiper Blades",
    price: 21.99,
    stock: 42,
    category: "Exterior",
    brand: "Rain-X",
    brand_id: "8",
    category_id: "5",
    type: "Beam",
    sku: "WPR-BLD-RNX",
    description: "All-weather beam wiper blades",
    is_oil: false,
    isOil: false,
    imageUrl: "/placeholders/wiper.jpg",
    image_url: "/placeholders/wiper.jpg",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock data for categories
const MOCK_CATEGORIES = [
  "Lubricants",
  "Filters",
  "Brakes",
  "Fluids",
  "Exterior",
  "All",
];

// Mock brands
const MOCK_BRANDS = [
  "Castrol",
  "Mobil",
  "Bosch",
  "K&N",
  "Akebono",
  "Valvoline",
  "Prestone",
  "Rain-X",
];

// Mock branches
export const MOCK_BRANCHES = [
  {
    id: "1",
    name: "Abu Dhabi Branch",
    address: "123 Main St",
    phone: "555-1234",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Hafeet Branch",
    address: "456 Center Ave",
    phone: "555-5678",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "West Side Branch",
    address: "789 West Blvd",
    phone: "555-9012",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Interface for the returned data
interface UseInventoryMockDataReturn {
  // Item data
  items: Item[];
  filteredItems: Item[];
  categories: string[];
  brands: string[];

  // Items state setter
  setItems: (items: Item[]) => void;

  // UI states
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  showLowStock: boolean;
  setShowLowStock: (show: boolean) => void;
  selectedItems: string[];
  setSelectedItems: (items: string[]) => void;

  // Modal states
  isModalOpen: boolean;
  setIsModalOpen: (isOpen: boolean) => void;
  isCategoryModalOpen: boolean;
  setIsCategoryModalOpen: (isOpen: boolean) => void;
  isBrandModalOpen: boolean;
  setIsBrandModalOpen: (isOpen: boolean) => void;
  isFiltersOpen: boolean;
  setIsFiltersOpen: (isOpen: boolean) => void;
  editingItem: Item | null;
  setEditingItem: (item: Item | null) => void;

  // Oil-specific data
  oilItems: Item[];
  nonOilItems: Item[];

  // Actions
  toggleItem: (id: string) => void;
  toggleAll: (checked: boolean) => void;
  handleEdit: (item: Item) => void;
  handleAddItem: () => void;
  handleDelete: (id: string) => Promise<boolean>;
  handleDuplicate: (id: string) => Promise<Item | null>;
  resetFilters: () => void;

  // Branch data
  branches: typeof MOCK_BRANCHES;
  currentBranch: (typeof MOCK_BRANCHES)[0] | null;
  setCurrentBranch: (branch: (typeof MOCK_BRANCHES)[0] | null) => void;
}

export function useInventoryMockData(): UseInventoryMockDataReturn {
  // State for items (starting with mock data)
  const [items, setItems] = useState<Item[]>(MOCK_INVENTORY_ITEMS);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showLowStock, setShowLowStock] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Branch state
  const [currentBranch, setCurrentBranch] = useState<
    (typeof MOCK_BRANCHES)[0] | null
  >(MOCK_BRANCHES[0]);

  // Oil-specific data
  const oilItems = useMemo(() => items.filter((item) => item.isOil), [items]);
  const nonOilItems = useMemo(
    () => items.filter((item) => !item.isOil),
    [items]
  );

  // Filtered items based on search query, category, and low stock filter
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search query filter
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        ) ||
        (item.brand?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (item.type?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (item.sku?.toLowerCase() || "").includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;

      // Low stock filter
      const matchesLowStock = !showLowStock || (item.stock || 0) < 10;

      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [items, searchQuery, selectedCategory, showLowStock]);

  // Action handlers
  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  const toggleAll = (checked: boolean) => {
    setSelectedItems(checked ? filteredItems.map((item) => item.id) : []);
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string): Promise<boolean> => {
    try {
      setItems(items.filter((item) => item.id !== id));
      console.log(`Deleted item ${id} (mock)`);
      return true;
    } catch (error) {
      console.error("Error deleting item:", error);
      return false;
    }
  };

  const handleDuplicate = async (id: string): Promise<Item | null> => {
    try {
      const original = items.find((item) => item.id === id);
      if (!original) return null;

      // Create a new ID by incrementing from the highest existing ID
      const highestId = Math.max(...items.map((item) => parseInt(item.id)));
      const newId = (highestId + 1).toString();

      const duplicate: Item = {
        ...original,
        id: newId,
        name: `${original.name} (Copy)`,
        // Generate a new creation timestamp
        created_at: new Date().toISOString(),
      };

      setItems([...items, duplicate]);
      console.log(`Duplicated item ${id} -> ${newId} (mock)`);
      return duplicate;
    } catch (error) {
      console.error("Error duplicating item:", error);
      return null;
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setShowLowStock(false);
    setIsFiltersOpen(false);
  };

  return {
    // Data
    items,
    filteredItems,
    categories: MOCK_CATEGORIES,
    brands: MOCK_BRANDS,

    // Direct state access
    setItems,

    // UI states
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    showLowStock,
    setShowLowStock,
    selectedItems,
    setSelectedItems,

    // Modal states
    isModalOpen,
    setIsModalOpen,
    isCategoryModalOpen,
    setIsCategoryModalOpen,
    isBrandModalOpen,
    setIsBrandModalOpen,
    isFiltersOpen,
    setIsFiltersOpen,
    editingItem,
    setEditingItem,

    // Oil-specific data
    oilItems,
    nonOilItems,

    // Actions
    toggleItem,
    toggleAll,
    handleEdit,
    handleAddItem,
    handleDelete,
    handleDuplicate,
    resetFilters,

    // Branch data
    branches: MOCK_BRANCHES,
    currentBranch,
    setCurrentBranch,
  };
}
