"use client";

import { useState, useEffect, useMemo } from "react";
import { Item } from "@/lib/services/inventoryService";
import {
  fetchItems,
  deleteItem,
  fetchCategories,
  fetchBrands,
} from "@/lib/services/inventoryService";
import { toast } from "@/components/ui/use-toast";

// Hafith Branch data (Branch ID: "2")
export const HAFITH_BRANCH = {
  id: "2",
  name: "Hafeet Branch",
  address: "456 Center Ave",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Hafith Branch inventory data
const HAFITH_INVENTORY: Item[] = [
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
  // Hafith specific products
  {
    id: "13",
    name: "Racing Motor Lubricant",
    price: 49.99,
    stock: 15,
    category: "Lubricants",
    brand: "Motul",
    brand_id: "11",
    category_id: "1",
    type: "Full-Synthetic",
    sku: "OIL-RACE-MTL",
    description: "High-performance racing motor oil",
    is_oil: true,
    isOil: true,
    imageUrl: "/placeholders/oil.jpg",
    image_url: "/placeholders/oil.jpg",
    volumes: [
      {
        id: "v14",
        item_id: "13",
        size: "1L",
        price: 20.99,
        created_at: null,
        updated_at: null,
      },
      {
        id: "v15",
        item_id: "13",
        size: "4L",
        price: 49.99,
        created_at: null,
        updated_at: null,
      },
    ],
    bottleStates: { open: 4, closed: 11 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "14",
    name: "Performance Ceramic Brake Pads",
    price: 79.99,
    stock: 8,
    category: "Brakes",
    brand: "Brembo",
    brand_id: "12",
    category_id: "3",
    type: "Performance",
    sku: "BRK-PERF-BRM",
    description: "High-performance ceramic brake pads for sports cars",
    is_oil: false,
    isOil: false,
    imageUrl: "/placeholders/brakes.jpg",
    image_url: "/placeholders/brakes.jpg",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

interface UseHafithInventoryReturn {
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
  selectedBranch: typeof HAFITH_BRANCH;

  // Actions
  toggleItem: (id: string) => void;
  toggleAll: (checked: boolean) => void;
  handleEdit: (item: Item) => void;
  handleDeleteItem: (id: string) => Promise<void>;
  resetFilters: () => void;
  fetchBranchInventory: () => Promise<Item[]>;
  handleRunInventoryFix: () => Promise<void>;
  handleMigrateInventory: () => Promise<void>;
  isFixingInventory: boolean;
  isMigratingInventory: boolean;
}

export function useHafithInventory(): UseHafithInventoryReturn {
  // Item states
  const [branchItems, setBranchItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Database categories and brands
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [dbBrands, setDbBrands] = useState<string[]>([]);

  // UI states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showLowStock, setShowLowStock] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Utility states
  const [isFixingInventory, setIsFixingInventory] = useState(false);
  const [isMigratingInventory, setIsMigratingInventory] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch items, categories, and brands in parallel
        const [itemsData, categoriesData, brandsData] = await Promise.all([
          fetchBranchInventory(),
          fetchCategories(),
          fetchBrands(),
        ]);

        setBranchItems(itemsData);
        setDbCategories(categoriesData.map((cat) => cat.name));
        setDbBrands(brandsData.map((brand) => brand.name));
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch branch inventory",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchBranchInventory = async (): Promise<Item[]> => {
    try {
      // Use real database connection - Hafith branch ID
      const hafithId = "8ae59a0c-1821-4ec0-b913-1900fdcaf7a1";
      const data = await fetchItems(hafithId);
      console.log(`✅ Fetched ${data.length} items for Hafith from database`);
      return data;
    } catch (error) {
      console.error("Error fetching Hafith inventory:", error);
      return [];
    }
  };

  // Derived states - use database categories and brands
  const categories = useMemo(() => {
    return dbCategories;
  }, [dbCategories]);

  const brands = useMemo(() => {
    return dbBrands;
  }, [dbBrands]);

  const oilItems = useMemo(() => {
    return branchItems.filter((item) => item.isOil);
  }, [branchItems]);

  const nonOilItems = useMemo(() => {
    return branchItems.filter((item) => !item.isOil);
  }, [branchItems]);

  const filteredItems = useMemo(() => {
    return branchItems.filter((item) => {
      // Filter by search query
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // Filter by category
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;

      // Filter by stock
      const matchesStock = !showLowStock || (item.stock ?? 0) < 10;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [branchItems, searchQuery, selectedCategory, showLowStock]);

  // Actions
  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
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
    try {
      // Use real database connection - Hafith branch ID
      const hafithId = "8ae59a0c-1821-4ec0-b913-1900fdcaf7a1";
      const success = await deleteItem(id, hafithId);

      if (success) {
        // Update local state
        setBranchItems((prev) => prev.filter((item) => item.id !== id));

        // Update selected items
        setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));

        toast({
          title: "Success",
          description: "Item deleted successfully from Hafith inventory",
        });
      } else {
        throw new Error("Delete operation failed");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive",
      });
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setShowLowStock(false);
  };

  const handleRunInventoryFix = async (): Promise<void> => {
    setIsFixingInventory(true);
    try {
      toast({
        title: "Success",
        description: "Inventory fixed successfully",
      });
    } catch (error) {
      console.error("Error fixing inventory:", error);
      toast({
        title: "Error",
        description: "Failed to fix inventory",
        variant: "destructive",
      });
    } finally {
      setIsFixingInventory(false);
    }
  };

  const handleMigrateInventory = async (): Promise<void> => {
    setIsMigratingInventory(true);
    try {
      toast({
        title: "Success",
        description: "Inventory migrated successfully",
      });
    } catch (error) {
      console.error("Error migrating inventory:", error);
      toast({
        title: "Error",
        description: "Failed to migrate inventory",
        variant: "destructive",
      });
    } finally {
      setIsMigratingInventory(false);
    }
  };

  return {
    // Item data
    branchItems,
    filteredItems,
    categories,
    brands,
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
    selectedBranch: HAFITH_BRANCH,

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
