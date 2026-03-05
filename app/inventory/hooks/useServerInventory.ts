import { useState, useEffect, useCallback } from "react";
import { Item } from "@/lib/services/inventoryService";
import { getInventoryServerAction } from "@/lib/actions/inventory";
import { useToast } from "@/components/ui/use-toast";

interface UseServerInventoryProps {
  initialPage?: number;
  initialLimit?: number;
  locationId?: string;
}

export function useServerInventory({
  initialPage = 1,
  initialLimit = 50,
  locationId = "sanaiya",
}: UseServerInventoryProps = {}) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [totalCount, setTotalCount] = useState(0);

  // Filters state
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [brandId, setBrandId] = useState("all");

  // Advanced Filters
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [stockStatus, setStockStatus] = useState<
    "all" | "in-stock" | "low-stock" | "out-of-stock"
  >("all");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showOutOfStockOnly, setShowOutOfStockOnly] = useState(false);
  const [showInStock, setShowInStock] = useState(false);
  const [showBatteries, setShowBatteries] = useState(false);
  const [batteryState, setBatteryState] = useState<
    "new" | "scrap" | "resellable"
  >("new");
  const [sortBy, setSortBy] = useState<"name" | "price" | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { toast } = useToast();

  // Reset page when search or filters change
  useEffect(() => {
    setPage(1);
  }, [
    search,
    categoryId,
    brandId,
    minPrice,
    maxPrice,
    stockStatus,
    showLowStockOnly,
    showOutOfStockOnly,
    showInStock,
    showBatteries,
    batteryState,
    sortBy,
    sortOrder,
  ]);

  const loadData = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      // setError(null); // Maybe keep error handling?
      try {
        const { data, count } = await getInventoryServerAction(
          page,
          limit,
          search,
          categoryId,
          brandId,
          locationId,
          {
            minPrice,
            maxPrice,
            stockStatus,
            showLowStockOnly,
            showOutOfStockOnly,
            showInStock,
            showBatteries,
            batteryState,
            sortBy,
            sortOrder,
          },
        );
        setItems(data);
        setTotalCount(count);
      } catch (err) {
        console.error("Failed to load inventory:", err);
        setError(err);
        toast({
          title: "Error loading inventory",
          description: "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [
      page,
      limit,
      search,
      categoryId,
      brandId,
      locationId,
      toast,
      minPrice,
      maxPrice,
      stockStatus,
      showLowStockOnly,
      showOutOfStockOnly,
      showInStock,
      showBatteries,
      batteryState,
      sortBy,
      sortOrder,
    ],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = useCallback(
    (silent = false) => {
      loadData(silent);
    },
    [loadData],
  );

  const updateLocalItem = useCallback((updatedItem: Item) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === updatedItem.id ||
        (item.product_id && item.product_id === updatedItem.product_id)
          ? updatedItem
          : item,
      ),
    );
  }, []);

  const resetFilters = useCallback(() => {
    setSearch("");
    setCategoryId("all");
    setBrandId("all");
    setMinPrice(undefined);
    setMaxPrice(undefined);
    setStockStatus("all");
    setShowLowStockOnly(false);
    setShowOutOfStockOnly(false);
    setShowInStock(false);
    setShowBatteries(false);
    setBatteryState("new");
    setSortBy(undefined);
    setSortOrder("asc");
    setPage(1);
  }, []);

  return {
    items,
    loading,
    error,
    page,
    setPage,
    limit,
    setLimit,
    totalCount,

    // Filters
    search,
    setSearch,
    categoryId,
    setCategoryId,
    brandId,
    setBrandId,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    stockStatus,
    setStockStatus,
    showLowStockOnly,
    setShowLowStockOnly,
    showOutOfStockOnly,
    setShowOutOfStockOnly,
    showInStock,
    setShowInStock,
    showBatteries,
    setShowBatteries,
    batteryState,
    setBatteryState,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,

    refresh,
    updateLocalItem,
    resetFilters,
  };
}
