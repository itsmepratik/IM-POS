import { useState, useMemo, useCallback } from "react";
import { useItems, Item, BottleStates } from "./items-context";
import { toast } from "@/components/ui/use-toast";

export const useInventoryData = () => {
  const { items, categories, brands, deleteItem, duplicateItem } = useItems();

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedBottleState, setSelectedBottleState] = useState<string>("all");
  const [showInStock, setShowInStock] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Item selection for bulk actions
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Editing modal states
  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);

  // Filter items based on all filters
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.brand &&
          item.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.sku &&
          item.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.category &&
          item.category.toLowerCase().includes(searchQuery.toLowerCase()));

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

      // Stock filter
      const matchesStock = !showInStock || (item.stock ?? 0) > 0;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBrand &&
        matchesBottleState &&
        matchesStock
      );
    });
  }, [
    items,
    searchQuery,
    selectedCategory,
    selectedBrand,
    selectedBottleState,
    showInStock,
  ]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedBrand("all");
    setSelectedBottleState("all");
    setShowInStock(true);
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

            // Wait a moment and trigger a refetch
            setTimeout(() => {
              window.location.reload();
            }, 1000);
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
  };
};
