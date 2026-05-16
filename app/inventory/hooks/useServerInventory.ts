import {
  useState,
  useEffect,
  useCallback,
  useLayoutEffect,
  useRef,
} from "react";
import { Item } from "@/lib/services/inventoryService";
import { getInventoryServerAction } from "@/lib/actions/inventory";
import { useToast } from "@/components/ui/use-toast";

interface UseServerInventoryProps {
  initialPage?: number;
  initialLimit?: number;
  locationId?: string;
  /** When true (default), filters and pagination persist across reload (per location). */
  persistFilters?: boolean;
}

const FILTER_STORAGE_VERSION = 1 as const;

type StockStatus = "all" | "in-stock" | "low-stock" | "out-of-stock";

function filterStorageKey(locationId: string) {
  return `pos:inventory:filters:v${FILTER_STORAGE_VERSION}:${locationId}`;
}

function parseStoredFilters(raw: string | null): Partial<{
  search: string;
  categoryId: string;
  brandId: string;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  stockStatus: StockStatus;
  showLowStockOnly: boolean;
  showOutOfStockOnly: boolean;
  showInStock: boolean;
  showBatteries: boolean;
  batteryState: "new" | "scrap" | "resellable";
  sortBy: "name" | "price" | undefined;
  sortOrder: "asc" | "desc";
}> | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Record<string, unknown>;
    if (p.v !== FILTER_STORAGE_VERSION) return null;

    const stockStatuses: StockStatus[] = [
      "all",
      "in-stock",
      "low-stock",
      "out-of-stock",
    ];
    const st = p.stockStatus;
    const stockStatus = stockStatuses.includes(st as StockStatus)
      ? (st as StockStatus)
      : "all";

    const batteryStates = ["new", "scrap", "resellable"] as const;
    const bs = p.batteryState;
    const batteryState = batteryStates.includes(bs as (typeof batteryStates)[number])
      ? (bs as (typeof batteryStates)[number])
      : "new";

    const sb = p.sortBy;
    const sortBy = sb === "name" || sb === "price" ? sb : undefined;

    const so = p.sortOrder === "desc" ? "desc" : "asc";

    return {
      search: typeof p.search === "string" ? p.search : "",
      categoryId: typeof p.categoryId === "string" ? p.categoryId : "all",
      brandId: typeof p.brandId === "string" ? p.brandId : "all",
      minPrice:
        typeof p.minPrice === "number" && !Number.isNaN(p.minPrice)
          ? p.minPrice
          : undefined,
      maxPrice:
        typeof p.maxPrice === "number" && !Number.isNaN(p.maxPrice)
          ? p.maxPrice
          : undefined,
      stockStatus,
      showLowStockOnly: Boolean(p.showLowStockOnly),
      showOutOfStockOnly: Boolean(p.showOutOfStockOnly),
      showInStock: Boolean(p.showInStock),
      showBatteries: Boolean(p.showBatteries),
      batteryState,
      sortBy,
      sortOrder: so,
    };
  } catch {
    return null;
  }
}

export function useServerInventory({
  initialPage = 1,
  initialLimit = 50,
  locationId = "sanaiya",
  persistFilters = true,
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
  const [stockStatus, setStockStatus] = useState<StockStatus>("all");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showOutOfStockOnly, setShowOutOfStockOnly] = useState(false);
  const [showInStock, setShowInStock] = useState(false);
  const [showBatteries, setShowBatteries] = useState(false);
  const [batteryState, setBatteryState] = useState<
    "new" | "scrap" | "resellable"
  >("new");
  const [sortBy, setSortBy] = useState<"name" | "price" | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const storageKey = filterStorageKey(locationId);
  const [filtersHydrated, setFiltersHydrated] = useState(!persistFilters);
  const skipNextPersist = useRef(false);

  const { toast } = useToast();

  useLayoutEffect(() => {
    if (!persistFilters || typeof window === "undefined") {
      setFiltersHydrated(true);
      return;
    }
    try {
      const parsed = parseStoredFilters(
        sessionStorage.getItem(storageKey),
      );
      skipNextPersist.current = true;
      if (parsed) {
        if (parsed.search !== undefined) setSearch(parsed.search);
        if (parsed.categoryId !== undefined) setCategoryId(parsed.categoryId);
        if (parsed.brandId !== undefined) setBrandId(parsed.brandId);
        if (parsed.minPrice !== undefined) setMinPrice(parsed.minPrice);
        if (parsed.maxPrice !== undefined) setMaxPrice(parsed.maxPrice);
        if (parsed.stockStatus !== undefined) setStockStatus(parsed.stockStatus);
        if (parsed.showLowStockOnly !== undefined)
          setShowLowStockOnly(parsed.showLowStockOnly);
        if (parsed.showOutOfStockOnly !== undefined)
          setShowOutOfStockOnly(parsed.showOutOfStockOnly);
        if (parsed.showInStock !== undefined) setShowInStock(parsed.showInStock);
        if (parsed.showBatteries !== undefined)
          setShowBatteries(parsed.showBatteries);
        if (parsed.batteryState !== undefined)
          setBatteryState(parsed.batteryState);
        if (parsed.sortBy !== undefined) setSortBy(parsed.sortBy);
        if (parsed.sortOrder !== undefined) setSortOrder(parsed.sortOrder);
      } else {
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
      }
    } catch {
      // ignore corrupt storage
    }
    setPage(initialPage);
    setLimit(initialLimit);
    setFiltersHydrated(true);
  }, [persistFilters, storageKey, initialPage, initialLimit]);

  useEffect(() => {
    if (!persistFilters || !filtersHydrated || typeof window === "undefined") {
      return;
    }
    if (skipNextPersist.current) {
      skipNextPersist.current = false;
      return;
    }
    try {
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({
          v: FILTER_STORAGE_VERSION,
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
        }),
      );
    } catch {
      // quota / private mode
    }
  }, [
    persistFilters,
    filtersHydrated,
    storageKey,
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
    if (!filtersHydrated) return;
    loadData();
  }, [loadData, filtersHydrated]);

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
    if (persistFilters && typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(storageKey);
      } catch {
        // ignore
      }
    }
  }, [persistFilters, storageKey]);

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
