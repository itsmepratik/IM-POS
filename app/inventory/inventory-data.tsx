import { useState, useMemo, useCallback, useEffect } from "react";
import { useItems, Item, BottleStates } from "./items-context";
import { toast } from "@/components/ui/use-toast";

// Define a low stock threshold value
const LOW_STOCK_THRESHOLD = 5;

export const useInventoryData = () => {
  const { items, categories, brands, deleteItem, duplicateItem } = useItems();

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedBottleState, setSelectedBottleState] = useState<string>("all");
  const [showInStock, setShowInStock] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // New filter states for threshold indicators
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showOutOfStockOnly, setShowOutOfStockOnly] = useState(false);

  // Battery filter states
  const [showBatteries, setShowBatteries] = useState(false);
  const [batteryState, setBatteryState] = useState<
    "new" | "scrap" | "resellable"
  >("new");

  // Advanced filter states
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [stockStatus, setStockStatus] = useState("all");

  // Item selection for bulk actions
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Editing modal states
  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);

  // Debounce search query to reduce filter frequency
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Count out of stock items
  const outOfStockCount = useMemo(() => {
    return items.filter((item) => (item.stock ?? 0) === 0).length;
  }, [items]);

  // Count low stock items (excluding out of stock)
  const lowStockCount = useMemo(() => {
    return items.filter((item) => {
      const stock = item.stock ?? 0;
      // Use item's lowStockAlert value if available, otherwise use default threshold
      const threshold = item.lowStockAlert ?? LOW_STOCK_THRESHOLD;
      return stock > 0 && stock <= threshold;
    }).length;
  }, [items]);

  // Filter items based on all filters
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search filter
      const matchesSearch =
        debouncedSearchQuery === "" ||
        item.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        (item.brand &&
          item.brand.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
        (item.category &&
          item.category.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));

      // Category filter
      const matchesCategory =
        selectedCategory === "all" || item.category === selectedCategory;

      // Brand filter
      const matchesBrand =
        selectedBrand === "all" ||
        (selectedBrand === "none" ? !item.brand : item.brand === selectedBrand);

      // Bottle state filter (for oils)
      const matchesBottleState =
        selectedBottleState === "all" ||
        (item.isOil &&
          item.bottleStates &&
          (selectedBottleState === "open"
            ? item.bottleStates.open > 0
            : item.bottleStates.closed > 0));

      // Low stock filter
      const matchesLowStock = showLowStockOnly
        ? (item.stock ?? 0) > 0 &&
          (item.stock ?? 0) <= (item.lowStockAlert ?? LOW_STOCK_THRESHOLD)
        : true;

      // Out of stock filter
      const matchesOutOfStock = showOutOfStockOnly
        ? (item.stock ?? 0) === 0
        : true;

      // Stock filter (only used when not filtering by low/out of stock)
      const matchesStock = !showInStock || (item.stock ?? 0) > 0;

      // Determine which stock filter to apply
      const stockFilterToApply =
        showLowStockOnly || showOutOfStockOnly
          ? matchesLowStock && matchesOutOfStock
          : matchesStock;

      // Battery filter
      const matchesBattery = showBatteries
        ? item.isBattery === true && item.batteryState === batteryState
        : true;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBrand &&
        matchesBottleState &&
        stockFilterToApply &&
        matchesBattery
      );
    });
  }, [
    items,
    debouncedSearchQuery,
    selectedCategory,
    selectedBrand,
    selectedBottleState,
    showInStock,
    showLowStockOnly,
    showOutOfStockOnly,
    showBatteries,
    batteryState,
  ]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedBrand("all");
    setSelectedBottleState("all");
    setShowInStock(false);
    setShowLowStockOnly(false);
    setShowOutOfStockOnly(false);
    setShowBatteries(false);
    setBatteryState("new");
  }, []);

  // Handle item selection
  const toggleItemSelection = useCallback((id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  }, []);

  const toggleAllSelection = useCallback(() => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map((item) => item.id));
    }
  }, [filteredItems, selectedItems.length]);

  // Handle item CRUD operations
  const handleEdit = useCallback((item: Item) => {
    setEditingItem(item);
  }, []);

  const handleAddItem = useCallback(() => {
    setEditingItem(undefined);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (
        window.confirm(
          "Are you sure you want to delete this item from the current branch? This action cannot be undone."
        )
      ) {
        try {
          const item = items.find((item) => item.id === id);
          const itemName = item?.name || "Item";

          console.log(`User confirmed deletion of item: ${itemName} (${id})`);
          console.log("Calling deleteItem with id:", id);
          const success = await deleteItem(id);

          if (success) {
            console.log(`Item ${id} successfully deleted`);
            toast({
              title: "Item deleted",
              description: `${itemName} has been deleted from this branch.`,
              variant: "default",
            });

            // Refetch items to update the UI without page reload
            await refetchItems();
          } else {
            console.error(`Failed to delete item ${id}`);
            toast({
              title: "Deletion failed",
              description: `Could not delete ${itemName}. There might be related records or a server issue.`,
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error("Error in handleDelete:", error);
          toast({
            title: "Deletion error",
            description:
              "An unexpected error occurred while trying to delete the item.",
            variant: "destructive",
          });
        }
      }
    },
    [deleteItem, items, toast]
  );

  const handleDuplicate = useCallback(
    (id: string) => {
      duplicateItem(id);
      toast({
        title: "Item duplicated",
        description: "A copy of the item has been created.",
      });
    },
    [duplicateItem]
  );

  return {
    // Items and categories data
    items,
    categories,
    brands,
    filteredItems,

    // Search and filter states
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedBrand,
    setSelectedBrand,
    selectedBottleState,
    setSelectedBottleState,
    showInStock,
    setShowInStock,
    isFiltersOpen,
    setIsFiltersOpen,
    resetFilters,

    // New filter states
    showLowStockOnly,
    setShowLowStockOnly,
    showOutOfStockOnly,
    setShowOutOfStockOnly,

    // Battery filter states
    showBatteries,
    setShowBatteries,
    batteryState,
    setBatteryState,

    // Advanced filter states
    showFilters,
    setShowFilters,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    stockStatus,
    setStockStatus,

    // Selection states
    selectedItems,
    setSelectedItems,
    toggleItemSelection,
    toggleAllSelection,

    // Modal states
    editingItem,
    setEditingItem,

    // CRUD operations
    handleEdit,
    handleAddItem,
    handleDelete,
    handleDuplicate,

    // Counts
    outOfStockCount,
    lowStockCount,
  };
};
