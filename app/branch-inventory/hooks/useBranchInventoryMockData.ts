"use client";

import { useState, useEffect, useMemo } from "react";
import { Item } from "@/lib/services/branchInventoryService";

// Mock branches data
export const MOCK_BRANCHES = [
  {
    id: "1",
    name: "Abu Dhabi Branch",
    address: "123 Main St",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Hafeet Branch",
    address: "456 Center Ave",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "West Side Branch",
    address: "789 West Blvd",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock branch inventory data (will show different inventory per branch)
const MOCK_BRANCH_INVENTORY: Record<string, Item[]> = {
  // Branch 1 (Abu Dhurus)
  "1": [
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
          created_at: null,
          updated_at: null,
        },
        {
          id: "v2",
          item_id: "1",
          size: "4L",
          price: 29.99,
          created_at: null,
          updated_at: null,
        },
        {
          id: "v3",
          item_id: "1",
          size: "5L",
          price: 34.99,
          created_at: null,
          updated_at: null,
        },
      ],
      bottleStates: { open: 3, closed: 42 },
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
      id: "9",
      name: "Power Steering Fluid",
      price: 16.99,
      stock: 28,
      category: "Fluids",
      brand: "Castrol",
      brand_id: "1",
      category_id: "4",
      type: "Standard",
      sku: "FLD-PSF-CAS",
      description: "Standard power steering fluid for most vehicles",
      is_oil: true,
      isOil: true,
      imageUrl: "/placeholders/fluid.jpg",
      image_url: "/placeholders/fluid.jpg",
      volumes: [
        {
          id: "v10",
          item_id: "9",
          size: "1L",
          price: 16.99,
          created_at: null,
          updated_at: null,
        },
      ],
      bottleStates: { open: 3, closed: 25 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],

  // Branch 2 (Hafeet Branch)
  "2": [
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
          created_at: null,
          updated_at: null,
        },
        {
          id: "v5",
          item_id: "2",
          size: "4L",
          price: 24.99,
          created_at: null,
          updated_at: null,
        },
      ],
      bottleStates: { open: 2, closed: 6 },
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
      id: "6",
      name: "Transmission Fluid",
      price: 19.99,
      stock: 25,
      category: "Fluids",
      brand: "Valvoline",
      brand_id: "6",
      category_id: "4",
      type: "Automatic",
      sku: "FLD-TRN-VAL",
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
          created_at: null,
          updated_at: null,
        },
        {
          id: "v7",
          item_id: "6",
          size: "3.78L",
          price: 19.99,
          created_at: null,
          updated_at: null,
        },
      ],
      bottleStates: { open: 5, closed: 20 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "10",
      name: "Wiper Fluid",
      price: 8.99,
      stock: 55,
      category: "Fluids",
      brand: "Rain-X",
      brand_id: "8",
      category_id: "4",
      type: "All-Weather",
      sku: "FLD-WPR-RNX",
      description: "All-weather windshield washer fluid",
      is_oil: true,
      isOil: true,
      imageUrl: "/placeholders/fluid.jpg",
      image_url: "/placeholders/fluid.jpg",
      volumes: [
        {
          id: "v11",
          item_id: "10",
          size: "1L",
          price: 4.99,
          created_at: null,
          updated_at: null,
        },
        {
          id: "v12",
          item_id: "10",
          size: "3.78L",
          price: 8.99,
          created_at: null,
          updated_at: null,
        },
      ],
      bottleStates: { open: 10, closed: 45 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],

  // Branch 3 (West Side Branch)
  "3": [
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
      sku: "FLD-COL-PRE",
      description: "All-season coolant/antifreeze for all vehicles",
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
          created_at: null,
          updated_at: null,
        },
        {
          id: "v9",
          item_id: "7",
          size: "3.78L",
          price: 14.99,
          created_at: null,
          updated_at: null,
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
  ],
};

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

// Interface for the returned data
interface UseBranchInventoryMockDataReturn {
  // Item data
  branchItems: Item[];
  filteredItems: Item[];
  categories: string[];
  brands: string[];
  isLoading: boolean;

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

  // Branch data
  branches: typeof MOCK_BRANCHES;
  selectedBranch: (typeof MOCK_BRANCHES)[0] | null;
  setSelectedBranch: (branch: (typeof MOCK_BRANCHES)[0] | null) => void;

  // Actions
  toggleItem: (id: string) => void;
  toggleAll: (checked: boolean) => void;
  handleEdit: (item: Item) => void;
  handleDeleteItem: (id: string) => Promise<void>;
  resetFilters: () => void;
  fetchBranchInventory: (branchId: string) => Promise<Item[]>;
  handleRunInventoryFix: () => Promise<void>;
  handleMigrateInventory: () => Promise<void>;
  isFixingInventory: boolean;
  isMigratingInventory: boolean;
}

export function useBranchInventoryMockData(): UseBranchInventoryMockDataReturn {
  // State for branch and items
  const [selectedBranch, setSelectedBranch] = useState<
    (typeof MOCK_BRANCHES)[0] | null
  >(MOCK_BRANCHES[0]);
  const [branchItems, setBranchItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFixingInventory, setIsFixingInventory] = useState(false);
  const [isMigratingInventory, setIsMigratingInventory] = useState(false);

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

  // Mock fetch function for branch inventory
  const fetchBranchInventory = async (branchId: string): Promise<Item[]> => {
    setIsLoading(true);

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Get mock data for the selected branch
      const items = MOCK_BRANCH_INVENTORY[branchId] || [];
      console.log(
        `Fetched ${items.length} items for branch ${branchId} (mock)`
      );

      setBranchItems(items);
      return items;
    } catch (error) {
      console.error("Error fetching branch inventory:", error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Load branch items when branch changes
  useEffect(() => {
    if (selectedBranch) {
      fetchBranchInventory(selectedBranch.id);
    }
  }, [selectedBranch]);

  // Oil-specific data
  const oilItems = useMemo(
    () => branchItems.filter((item) => item.isOil),
    [branchItems]
  );
  const nonOilItems = useMemo(
    () => branchItems.filter((item) => !item.isOil),
    [branchItems]
  );

  // Filtered items based on search query, category, and low stock filter
  const filteredItems = useMemo(() => {
    return branchItems.filter((item) => {
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
  }, [branchItems, searchQuery, selectedCategory, showLowStock]);

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

  const handleDeleteItem = async (id: string): Promise<void> => {
    if (!selectedBranch) return;

    try {
      setIsLoading(true);
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Remove item from branch inventory
      const updatedItems = branchItems.filter((item) => item.id !== id);
      setBranchItems(updatedItems);

      console.log(`Deleted item ${id} from branch ${selectedBranch.id} (mock)`);
    } catch (error) {
      console.error("Error deleting item:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setShowLowStock(false);
    setIsFiltersOpen(false);
  };

  // Mock functions for fixing inventory and migration
  const handleRunInventoryFix = async (): Promise<void> => {
    if (!selectedBranch) return;

    setIsFixingInventory(true);

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log(`Fixed inventory for branch ${selectedBranch.id} (mock)`);

      // Refresh branch inventory
      await fetchBranchInventory(selectedBranch.id);
    } catch (error) {
      console.error("Error fixing inventory:", error);
    } finally {
      setIsFixingInventory(false);
    }
  };

  const handleMigrateInventory = async (): Promise<void> => {
    if (!selectedBranch) return;

    setIsMigratingInventory(true);

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 3000));
      console.log(`Migrated inventory for branch ${selectedBranch.id} (mock)`);

      // Refresh branch inventory
      await fetchBranchInventory(selectedBranch.id);
    } catch (error) {
      console.error("Error migrating inventory:", error);
    } finally {
      setIsMigratingInventory(false);
    }
  };

  return {
    // Data
    branchItems,
    filteredItems,
    categories: MOCK_CATEGORIES,
    brands: MOCK_BRANDS,
    isLoading,

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

    // Branch data
    branches: MOCK_BRANCHES,
    selectedBranch,
    setSelectedBranch,

    // Actions
    toggleItem,
    toggleAll,
    handleEdit,
    handleDeleteItem,
    resetFilters,
    fetchBranchInventory,
    handleRunInventoryFix,
    handleMigrateInventory,
    isFixingInventory,
    isMigratingInventory,
  };
}
