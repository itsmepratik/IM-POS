"use client";

import { useState, useEffect, useMemo } from "react";
import { Item } from "@/lib/services/branchInventoryService";
import { toast } from "@/components/ui/use-toast";

// Abu Dhurus Branch data (Branch ID: "1")
export const ABU_DHABI_BRANCH = {
  id: "1",
  name: "Abu Dhurus",
  address: "123 Main St",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Abu Dhurus Branch inventory data
const ABU_DHABI_INVENTORY: Item[] = [
  {
    id: "1",
    name: "Engine Oil 5W-30",
    price: 29.99,
    stock: 45,
    category: "Oils",
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
      { id: "v1", item_id: "1", size: "1L", price: 12.99, created_at: null, updated_at: null },
      { id: "v2", item_id: "1", size: "4L", price: 29.99, created_at: null, updated_at: null },
      { id: "v3", item_id: "1", size: "5L", price: 34.99, created_at: null, updated_at: null },
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
      { id: "v10", item_id: "9", size: "1L", price: 16.99, created_at: null, updated_at: null },
    ],
    bottleStates: { open: 3, closed: 25 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  // Abu Dhurus specific products
  {
    id: "11",
    name: "Premium Brake Fluid DOT 4",
    price: 18.99,
    stock: 40,
    category: "Fluids",
    brand: "ATE",
    brand_id: "9",
    category_id: "4",
    type: "Premium",
    sku: "FLD-BRK-ATE4",
    description: "High-performance brake fluid for all vehicles",
    is_oil: true,
    isOil: true,
    imageUrl: "/placeholders/fluid.jpg",
    image_url: "/placeholders/fluid.jpg",
    volumes: [
      { id: "v13", item_id: "11", size: "1L", price: 18.99, created_at: null, updated_at: null },
    ],
    bottleStates: { open: 5, closed: 35 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "12",
    name: "Luxury Car Shampoo",
    price: 22.99,
    stock: 30,
    category: "Cleaning",
    brand: "Meguiar's",
    brand_id: "10",
    category_id: "5",
    type: "Exterior",
    sku: "CLN-SHP-MEG",
    description: "Premium car shampoo for luxury vehicles",
    is_oil: false,
    isOil: false,
    imageUrl: "/placeholders/cleaning.jpg",
    image_url: "/placeholders/cleaning.jpg",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

interface UseAbuDhabiInventoryReturn {
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
  selectedBranch: typeof ABU_DHABI_BRANCH;
  
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

export function useAbuDhabiInventory(): UseAbuDhabiInventoryReturn {
  // Item states
  const [branchItems, setBranchItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
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
        const data = await fetchBranchInventory();
        setBranchItems(data);
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
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    return ABU_DHABI_INVENTORY;
  };

  // Derived states
  const categories = useMemo(() => {
    const allCategories = Array.from(
      new Set(branchItems.map((item) => item.category).filter(Boolean) as string[])
    );
    return allCategories;
  }, [branchItems]);

  const brands = useMemo(() => {
    const allBrands = Array.from(
      new Set(branchItems.map((item) => item.brand).filter(Boolean) as string[])
    );
    return allBrands;
  }, [branchItems]);

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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update local state
      setBranchItems((prev) => prev.filter((item) => item.id !== id));
      
      // Update selected items
      setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));
      
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 3000));
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
    selectedBranch: ABU_DHABI_BRANCH,
    
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