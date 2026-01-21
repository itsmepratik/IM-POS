"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Item, fetchInventoryItems, fetchCategories, fetchBrands, deleteItem } from "@/lib/services/inventoryService";
import { toast } from "@/components/ui/use-toast";
import { BRANCH_SHOPS, getBranchByLocationId, type BranchShop } from "../branchConfig";

interface UseBranchInventoryReturn {
  // Item data
  branchItems: Item[];
  filteredItems: Item[];
  categories: string[];
  brands: string[];
  isLoading: boolean;
  error: string | null;

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
  selectedBranch: BranchShop;
  locationId: string;

  // Actions
  toggleItem: (id: string) => void;
  toggleAll: (checked: boolean) => void;
  handleEdit: (item: Item) => void;
  handleDeleteItem: (id: string) => Promise<void>;
  resetFilters: () => void;
  refreshInventory: () => Promise<void>;
}

export function useBranchInventory(locationId: string): UseBranchInventoryReturn {
  // Item states
  const [branchItems, setBranchItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // Get branch info from locationId
  const selectedBranch = useMemo(() => {
    return getBranchByLocationId(locationId) || BRANCH_SHOPS.ABU_DHURUS;
  }, [locationId]);

  // Fetch inventory data from database
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch inventory items for this location
      const { data: items } = await fetchInventoryItems(
        1,      // page
        500,    // limit - fetch all for branch management
        "",     // search
        "all",  // categoryId
        "all",  // brandId
        locationId
      );

      setBranchItems(items);

      // Fetch categories and brands for filters
      const [categoriesData, brandsData] = await Promise.all([
        fetchCategories(),
        fetchBrands(),
      ]);

      setDbCategories(categoriesData.map((c) => c.name));
      setDbBrands(brandsData.map((b) => b.name));
    } catch (err) {
      console.error("Error fetching branch inventory:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch inventory");
      toast({
        title: "Error",
        description: "Failed to fetch branch inventory",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [locationId]);

  // Refresh function for external use
  const refreshInventory = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Fetch data when locationId changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived states
  const categories = useMemo(() => dbCategories, [dbCategories]);
  const brands = useMemo(() => dbBrands, [dbBrands]);

  const oilItems = useMemo(() => {
    return branchItems.filter((item) => item.isOil);
  }, [branchItems]);

  const nonOilItems = useMemo(() => {
    return branchItems.filter((item) => !item.isOil);
  }, [branchItems]);

  const filteredItems = useMemo(() => {
    return branchItems.filter((item) => {
      // Filter by search query
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter by category
      const matchesCategory =
        selectedCategory === "All" || item.category === selectedCategory;

      // Filter by stock
      const matchesStock = !showLowStock || (item.stock ?? 0) < 10;

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [branchItems, searchQuery, selectedCategory, showLowStock]);

  // Actions
  const toggleItem = useCallback((id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const toggleAll = useCallback(
    (checked: boolean) => {
      setSelectedItems(checked ? filteredItems.map((item) => item.id) : []);
    },
    [filteredItems]
  );

  const handleEdit = useCallback((item: Item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  }, []);

  const handleDeleteItem = useCallback(
    async (id: string): Promise<void> => {
      try {
        const success = await deleteItem(id, locationId);

        if (success) {
          // Update local state
          setBranchItems((prev) => prev.filter((item) => item.id !== id));
          setSelectedItems((prev) => prev.filter((itemId) => itemId !== id));

          toast({
            title: "Success",
            description: `Item deleted from ${selectedBranch.name} inventory`,
          });
        } else {
          throw new Error("Delete operation failed");
        }
      } catch (err) {
        console.error("Error deleting item:", err);
        toast({
          title: "Error",
          description: "Failed to delete item",
          variant: "destructive",
        });
      }
    },
    [locationId, selectedBranch.name]
  );

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("All");
    setShowLowStock(false);
  }, []);

  return {
    // Item data
    branchItems,
    filteredItems,
    categories,
    brands,
    isLoading,
    error,

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
    selectedBranch,
    locationId,

    // Actions
    toggleItem,
    toggleAll,
    handleEdit,
    handleDeleteItem,
    resetFilters,
    refreshInventory,
  };
}
