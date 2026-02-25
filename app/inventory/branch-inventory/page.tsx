"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Plus,
  Search,
  ChevronRight,
  Menu,
  ImageIcon,
  MoreVertical,
  Store,
  Filter,
  X,
  AlertTriangle,
  PackageX,
  ChevronDown,
  Box,
  AlertCircle,
  ArrowUpDown,
} from "lucide-react";
import { ItemsProvider, useItems, type Item } from "../items-context";
import dynamic from "next/dynamic";
import { ItemModalProps } from "../components/item-modal/types";

// Lazy load the heavy ItemModal
const ItemModal = dynamic(
  () =>
    import("../item-modal").then(
      (mod) => mod.ItemModal as React.ComponentType<ItemModalProps>,
    ),
  { ssr: false },
);
import { toast } from "@/components/ui/use-toast";
import { CategoryModal } from "../category-modal";
import { useUser } from "@/lib/contexts/UserContext";
import { BranchProvider } from "@/lib/contexts/BranchContext";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PageHeader } from "@/components/page-title";
import type { Branch } from "@/lib/services/inventoryService";
import { useInventoryData } from "../inventory-data";
import { Label } from "@/components/ui/label";
import {
  OpenBottleBadge,
  ClosedBottleBadge,
} from "@/components/ui/inventory-bottle-icons";
import { OpenBottleIcon, ClosedBottleIcon } from "@/components/ui/bottle-icons";
import BrandModal from "../brand-modal";
import { useBranchInventory } from "./hooks/useBranchInventory";
import { useServerInventory } from "../hooks/useServerInventory";
import {
  BRANCH_SHOPS,
  getAllBranchShops,
  DEFAULT_BRANCH,
  type BranchShop,
} from "./branchConfig";
import ExportButton from "../export-button";
import { BatteryStateSwitch } from "../components/battery-state-switch";
import { TradeInsModal } from "../components/trade-ins-modal";

// Define volume type
interface Volume {
  size: string;
  price: number;
}

// Memoize the mobile item card component
const MobileItemCard = memo(
  ({
    item,
    onEdit,
    onDelete,
    onDuplicate,
  }: {
    item: Item;
    onEdit: (item: Item) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
  }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [imageError, setImageError] = useState(false);

    const handleImageError = useCallback(() => {
      setImageError(true);
    }, []);

    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="relative w-16 h-16 rounded-md border overflow-hidden bg-muted shrink-0">
              {!imageError && (item.imageUrl || item.image_url) ? (
                <img
                  src={item.imageUrl || item.image_url || ""}
                  alt={item.name}
                  className="object-contain w-full h-full p-1"
                  onError={handleImageError}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium truncate">{item.name}</h3>
                  {item.brand && (
                    <p className="text-sm text-muted-foreground">
                      {item.brand}
                    </p>
                  )}
                  {item.isOil && item.bottleStates && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {item.bottleStates.open > 0 && (
                        <OpenBottleBadge count={item.bottleStates.open} />
                      )}
                      {item.bottleStates.closed > 0 && (
                        <ClosedBottleBadge count={item.bottleStates.closed} />
                      )}
                    </div>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      Edit item
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(item.id)}>
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete(item.id)}
                    >
                      Delete item
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Category: {item.category}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{item.category}</Badge>
                {item.type && <Badge variant="outline">{item.type}</Badge>}
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Stock:</span>
                <span className="font-medium">{item.stock ?? 0}</span>
              </div>
              <div className="text-base font-medium text-primary">
                OMR {item.price.toFixed(2)}
              </div>
            </div>

            {item.sku && (
              <div className="text-sm text-muted-foreground">
                SKU: {item.sku}
              </div>
            )}

            {showDetails && (
              <div className="mt-3 pt-3 border-t">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">Details</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setShowDetails(false)}
                  >
                    Hide
                  </Button>
                </div>

                <div className="space-y-2 text-sm">
                  {item.description && (
                    <div className="text-sm mb-2">
                      <span className="text-muted-foreground">
                        Description:
                      </span>
                      <p className="mt-1">{item.description}</p>
                    </div>
                  )}

                  {item.isOil && item.volumes && item.volumes.length > 0 && (
                    <div className="mt-2">
                      <div className="text-muted-foreground mb-1">Volumes:</div>
                      <div className="grid gap-1">
                        {item.volumes.map((volume: Volume, index: number) => (
                          <div
                            key={index}
                            className="flex justify-between text-xs"
                          >
                            <span>{volume.size}</span>
                            <span>OMR {volume.price.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.isOil && item.bottleStates && (
                    <div className="mt-2">
                      <div className="text-muted-foreground mb-1">
                        Inventory:
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center justify-between p-1.5 rounded-md bg-red-50 border border-red-200">
                          <span className="text-xs text-red-800 flex items-center gap-1">
                            <OpenBottleIcon className="h-3 w-3" />
                            Open:
                          </span>
                          <span className="font-medium text-red-800">
                            {item.bottleStates.open}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-1.5 rounded-md bg-green-50 border border-green-200">
                          <span className="text-xs font-medium text-green-800 flex items-center gap-1">
                            <ClosedBottleIcon className="h-3 w-3" />
                            Closed:
                          </span>
                          <span className="font-medium text-green-800">
                            {item.bottleStates.closed}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? "Hide Details" : "Show Details"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  },
);
MobileItemCard.displayName = "MobileItemCard";

function MobileView({
  items,
  isLoading,
  selectedBranch,
  handleDeleteItem,
  onBranchChange,
  onItemUpdated,
}: {
  items: Item[];
  isLoading: boolean;
  selectedBranch: BranchShop;
  handleDeleteItem: (id: string) => Promise<void>;
  onBranchChange: (locationId: string) => void;
  onItemUpdated: () => void;
}) {
  const { addItem } = useItems(); // Access addItem from context
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showOutOfStockOnly, setShowOutOfStockOnly] = useState(false);
  // Default to the provided selectedBranch's location
  const [branchLocationId, setBranchLocationId] = useState(
    selectedBranch.locationId,
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [brandFilter, setBrandFilter] = useState("all");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isTradeInsModalOpen, setIsTradeInsModalOpen] = useState(false);
  const { categories, brands } = useItems();

  // Get available branches from config
  const branches = getAllBranchShops();

  // Set mounted flag to prevent SSR issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Update the branch location ID when selectedBranch changes
  useEffect(() => {
    if (selectedBranch?.locationId) {
      setBranchLocationId(selectedBranch.locationId);
    }
  }, [selectedBranch]);

  // Filter items based on search and stock filters
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

      // Low stock filter
      const matchesLowStock = showLowStockOnly
        ? (item.stock ?? 0) > 0 &&
          (item.stock ?? 0) <= (item.lowStockAlert ?? 5)
        : true;

      // Out of stock filter
      const matchesOutOfStock = showOutOfStockOnly
        ? (item.stock ?? 0) === 0
        : true;

      return (
        matchesSearch &&
        (showLowStockOnly || showOutOfStockOnly
          ? matchesLowStock && matchesOutOfStock
          : true)
      );
    });
  }, [items, searchQuery, showLowStockOnly, showOutOfStockOnly]);

  const handleAddItem = () => {
    setEditingItem(null);
    setItemModalOpen(true);
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setItemModalOpen(true);
  };

  const handleBranchChange = (locationId: string) => {
    setBranchLocationId(locationId);
    onBranchChange(locationId);
  };

  // Prevent rendering until component is mounted to avoid hydration issues
  if (!isMounted) {
    return (
      <div className="space-y-4 -mt-4 pt-4 flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading mobile view...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 -mt-4 pt-4">
      <div className="mb-2 flex flex-col gap-4">
        {/* Branch selector dropdown */}
        <div>
          <Select value={branchLocationId} onValueChange={handleBranchChange}>
            <SelectTrigger className="w-full rounded-full bg-primary/10">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Select Branch" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {branches.map((branch) => (
                <SelectItem key={branch.locationId} value={branch.locationId}>
                  {branch.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search and indicators */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="p-2 shrink-0"
            onClick={() => setFiltersOpen(true)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Buttons row below search */}
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleAddItem}
              size="sm"
              className="shrink-0"
              type="button"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0">
                  More Options
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent placement="bottom end" className="w-40">
                <DropdownMenuItem
                  onAction={() => {
                    setIsCategoryModalOpen(true);
                    setFiltersOpen(false);
                  }}
                >
                  Categories
                </DropdownMenuItem>
                <DropdownMenuItem
                  onAction={() => {
                    setIsBrandModalOpen(true);
                    setFiltersOpen(false);
                  }}
                >
                  Brands
                </DropdownMenuItem>
                <DropdownMenuItem
                  onAction={() => {
                    setIsTradeInsModalOpen(true);
                    setFiltersOpen(false);
                  }}
                >
                  Trade-ins
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Filtered items status */}
      {(showLowStockOnly || showOutOfStockOnly) && (
        <div className="mb-2">
          <Badge variant="outline" className="w-full justify-start py-1 px-3">
            {showLowStockOnly && "Showing low stock items only"}
            {showOutOfStockOnly && "Showing out of stock items only"}
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 ml-2 text-muted-foreground"
              onClick={() => {
                setShowLowStockOnly(false);
                setShowOutOfStockOnly(false);
              }}
            >
              Clear
            </Button>
          </Badge>
        </div>
      )}

      {/* Mobile item list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-muted-foreground">No items found</p>
          {searchQuery && (
            <Button
              variant="link"
              onClick={() => setSearchQuery("")}
              className="mt-2"
            >
              Clear search
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2 pb-20">
          {filteredItems.map((item) => (
            <MobileItemCard
              key={item.id}
              item={item}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
              onDuplicate={() => {}}
            />
          ))}
        </div>
      )}

      <ItemModal
        open={itemModalOpen}
        onOpenChange={setItemModalOpen}
        item={editingItem || undefined}
        onItemUpdated={onItemUpdated}
      />

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="right" className="w-[280px] sm:w-[380px]">
          <SheetHeader>
            <SheetTitle>Filters</SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Categories</h3>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <h3 className="text-sm font-medium">Brands</h3>
              <Select value={brandFilter} onValueChange={setBrandFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brands</SelectItem>
                  <SelectItem value="none">No Brand</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Stock Status Options */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-medium">Stock Status</h3>
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowOutOfStockOnly(false);
                      setShowLowStockOnly(!showLowStockOnly);
                    }}
                    className={`justify-start w-full ${
                      showLowStockOnly ? "bg-amber-100 text-amber-800" : ""
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Low Stock
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowLowStockOnly(false);
                      setShowOutOfStockOnly(!showOutOfStockOnly);
                    }}
                    className={`justify-start w-full ${
                      showOutOfStockOnly ? "bg-red-100 text-red-800" : ""
                    }`}
                  >
                    <PackageX className="h-4 w-4 mr-2" />
                    Out of Stock
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <CategoryModal
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
      />
      <BrandModal open={isBrandModalOpen} onOpenChange={setIsBrandModalOpen} />
      <TradeInsModal
        isOpen={isTradeInsModalOpen}
        onClose={() => setIsTradeInsModalOpen(false)}
      />
    </div>
  );
}

// Container Component - Managers State and Context
function BranchInventoryManager() {
  const [selectedLocationId, setSelectedLocationId] = useState(
    DEFAULT_BRANCH.locationId,
  );

  return (
    <BranchProvider>
      <ItemsProvider
        overrideLocationId={selectedLocationId}
        skipFetchingItems={true} // Match Main Inventory: Skip context fetching, let useServerInventory handle it
      >
        <BranchInventoryContent
          selectedLocationId={selectedLocationId}
          onLocationIdChange={setSelectedLocationId}
        />
      </ItemsProvider>
    </BranchProvider>
  );
}

// Inner component that runs INSIDE ItemsProvider
function BranchInventoryContent({
  selectedLocationId,
  onLocationIdChange,
}: {
  selectedLocationId: string;
  onLocationIdChange: (id: string) => void;
}) {
  const {
    addItem,
    updateItem,
    deleteItem,
    duplicateItem,
    categories,
    brands,
    refetchItems,
  } = useItems();
  const [isClient, setIsClient] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Use useServerInventory hook (Same as Main Inventory Page)
  // This handles data fetching, pagination, sorting, and filtering
  const {
    items: branchItems,
    loading: isLoading,
    // Pagination
    page,
    setPage,
    limit,
    setLimit,
    totalCount,
    // Filters
    search: searchQuery,
    setSearch: setSearchQuery,
    categoryId: selectedCategory,
    setCategoryId: setSelectedCategory,
    brandId: brandFilter,
    setBrandId: setBrandFilter,
    // Advanced Filters
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    // Filter variables
    stockStatus,
    setStockStatus,
    showLowStockOnly,
    setShowLowStockOnly,
    showOutOfStockOnly,
    setShowOutOfStockOnly,
    showInStock,
    setShowInStock,
    showBatteries,
    setShowBatteries, // NEW
    batteryState,
    setBatteryState, // NEW
    sortBy,
    setSortBy, // NEW
    sortOrder,
    setSortOrder, // NEW
    // Actions
    refresh,
    updateLocalItem,
    resetFilters,
  } = useServerInventory({
    locationId: selectedLocationId,
    initialLimit: 50,
  });

  // UI States
  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isTradeInsModalOpen, setIsTradeInsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);

  // Derived state for the selected branch object
  const selectedBranch = useMemo(
    () =>
      getAllBranchShops().find((b) => b.locationId === selectedLocationId) ||
      DEFAULT_BRANCH,
    [selectedLocationId],
  );

  const handleBranchChange = (locationId: string) => {
    onLocationIdChange(locationId);
    // Reset page and filters on branch change (useServerInventory handles this via useEffect on locationId change?
    // actually useServerInventory useEffect depends on locationId, so it auto-refreshes)
  };

  // Handle Item Updates (Add/Edit)
  const handleItemUpdated = useCallback(
    async (updatedItem?: Item) => {
      // 1. Refresh Context (for brands/categories consistency)
      await refetchItems();

      // 2. Update Local List (Optimistic or Refresh)
      if (updatedItem) {
        updateLocalItem(updatedItem);
      }
      refresh(true); // Silent refresh from server
    },
    [refetchItems, updateLocalItem, refresh],
  );

  // Handle Delete
  const handleDeleteItem = async (id: string) => {
    try {
      await deleteItem(id);
      refresh(); // Refresh list after delete
      toast({ title: "Item deleted successfully" });
    } catch (error) {
      console.error("Failed to delete item:", error);
      toast({ title: "Failed to delete item", variant: "destructive" });
    }
  };

  // Actions for Mobile View
  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Check viewport
  const checkViewport = useCallback(() => {
    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 1024);
    }
  }, []);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      checkViewport();
      window.addEventListener("resize", checkViewport);
      return () => window.removeEventListener("resize", checkViewport);
    }
  }, [checkViewport]);

  const handleItemModalOpenChange = useCallback(
    (open: boolean) => {
      setIsModalOpen(open);
      if (!open) setEditingItem(undefined); // use undefined to match ItemModal props type
    },
    [setIsModalOpen, setEditingItem],
  );

  if (!isClient) return null;

  return (
    <div className="w-full h-full">
      {isMobile ? (
        <MobileView
          items={branchItems}
          isLoading={isLoading}
          selectedBranch={selectedBranch}
          handleDeleteItem={handleDeleteItem}
          onBranchChange={handleBranchChange}
          onItemUpdated={() => handleItemUpdated()}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between">
            <div className="w-[300px]">
              <Select
                value={selectedLocationId}
                onValueChange={handleBranchChange}
              >
                <SelectTrigger className="w-full rounded-full bg-primary/10">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select Branch" />
                    {process.env.NODE_ENV === "development" && (
                      <span className="text-xs text-muted-foreground opacity-50">
                        ({selectedLocationId.slice(0, 4)})
                      </span>
                    )}
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {getAllBranchShops().map((branch) => (
                    <SelectItem
                      key={branch.locationId}
                      value={branch.locationId}
                    >
                      {branch.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search items..."
                  className="pl-9 pr-4 w-full rounded-[2.0625rem] border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex-shrink-0 space-x-2 flex items-center">
                <Button
                  variant="ghost"
                  onClick={() => setShowFilters(!showFilters)}
                  className="rounded-[12px] p-2 bg-white border-none"
                  size="sm"
                >
                  <Filter className="h-4 w-4" />
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="rounded-[12px] pl-6"
                      size="sm"
                    >
                      More Options
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent placement="bottom end" className="w-40">
                    <DropdownMenuItem
                      onAction={() => setIsCategoryModalOpen(true)}
                    >
                      Categories
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onAction={() => setIsBrandModalOpen(true)}
                    >
                      Brands
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onAction={() => setIsTradeInsModalOpen(true)}
                    >
                      Trade-ins
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  onClick={() => {
                    setEditingItem(undefined);
                    setIsModalOpen(true);
                  }}
                  variant="chonky"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
                <ExportButton items={branchItems} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {branchItems.length}{" "}
                {branchItems.length === 1 ? "item" : "items"} found
              </div>

              {showLowStockOnly && (
                <Badge
                  variant="outline"
                  className="bg-amber-100 border-amber-300 text-amber-700 flex items-center gap-1"
                >
                  <AlertCircle className="h-3 w-3" />
                  Low Stock Only
                </Badge>
              )}
              {showOutOfStockOnly && (
                <Badge
                  variant="outline"
                  className="bg-red-100 border-red-300 text-red-700 flex items-center gap-1"
                >
                  <PackageX className="h-3 w-3" />
                  Out of Stock Only
                </Badge>
              )}

              <div className="flex gap-4 items-center ml-6">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="showBatteriesBranch"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Show batteries:
                  </label>
                  <Checkbox
                    id="showBatteriesBranch"
                    checked={showBatteries}
                    onCheckedChange={(checked) => setShowBatteries(!!checked)}
                  />
                </div>
                {showBatteries && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">State:</span>
                    <BatteryStateSwitch
                      value={batteryState || "new"}
                      onChange={setBatteryState}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 rounded-[12px]"
                    >
                      <ArrowUpDown className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Sort</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => {
                        setSortBy("name");
                        setSortOrder("asc");
                      }}
                    >
                      Name (A-Z)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSortBy("name");
                        setSortOrder("desc");
                      }}
                    >
                      Name (Z-A)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setSortBy("price");
                        setSortOrder("asc");
                      }}
                    >
                      Price (Low-High)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSortBy("price");
                        setSortOrder("desc");
                      }}
                    >
                      Price (High-Low)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Awesome Filter Section - Desktop Only */}
          {showFilters && !isMobile && (
            <div className="bg-gradient-to-r from-orange-50/50 via-white to-purple-50/50 backdrop-blur-sm border border-orange-200/50 rounded-[1.125rem] p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-full">
                    <Filter className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Advanced Filters
                    </h3>
                    <p className="text-sm text-gray-600">
                      Refine your inventory search
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="rounded-[2.0625rem] text-gray-600 hover:bg-gray-100"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="text-orange-600">📂</span>
                    Category
                  </label>
                  <Select
                    value={selectedCategory}
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-full rounded-[2.0625rem] border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Brand Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <span className="text-purple-600">🏷️</span>
                    Brand
                  </label>
                  <Select value={brandFilter} onValueChange={setBrandFilter}>
                    <SelectTrigger className="w-full rounded-[2.0625rem] border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                      <SelectValue placeholder="All Brands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      <SelectItem value="none">No Brand</SelectItem>
                      {brands.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Table View */}
          {!isLoading && (
            <div className="rounded-md border bg-white">
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b">
                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[300px]">
                        Item
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[150px]">
                        Category
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[100px]">
                        Stock
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[120px]">
                        Cost Price
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[120px]">
                        Selling Price
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[150px]">
                        Bottle Status
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[140px]">
                        Batches
                      </th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground w-[80px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {branchItems.map((item) => {
                      // Get active batch cost price
                      const activeBatchCost =
                        item.batches && item.batches.length > 0
                          ? (
                              item.batches.find((b) => b.is_active_batch) ||
                              item.batches[0]
                            )?.cost_price || 0
                          : 0; // Or fall back to item.costPrice if available

                      const batchCount = item.batches?.length || 0;

                      return (
                        <tr
                          key={item.id}
                          className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                        >
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="relative h-10 w-10 overflow-hidden rounded-md border bg-muted shrink-0">
                                {item.imageUrl || item.image_url ? (
                                  <img
                                    src={item.imageUrl || item.image_url || ""}
                                    alt={item.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium line-clamp-2">
                                  {item.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {item.brand || "-"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            <Badge variant="secondary" className="font-normal">
                              {item.category}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "font-medium",
                                  (item.stock || 0) <=
                                    (item.lowStockAlert || 5) &&
                                    "text-amber-600",
                                  (item.stock || 0) === 0 && "text-red-600",
                                )}
                              >
                                {item.stock || 0}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 align-middle">
                            {activeBatchCost > 0 ? (
                              <span className="font-medium text-muted-foreground">
                                OMR {activeBatchCost.toFixed(3)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                N/A
                              </span>
                            )}
                          </td>
                          <td className="p-4 align-middle">
                            <span className="font-medium text-emerald-600">
                              OMR {item.price.toFixed(3)}
                            </span>
                          </td>
                          <td className="p-4 align-middle">
                            {item.isOil && item.bottleStates ? (
                              <div className="flex items-center gap-4">
                                <div
                                  className="flex items-center gap-1.5 text-muted-foreground"
                                  title="Open Bottles"
                                >
                                  <OpenBottleIcon className="h-4 w-4 text-orange-500" />
                                  <span className="font-medium text-foreground">
                                    {item.bottleStates.open}
                                  </span>
                                </div>
                                <div
                                  className="flex items-center gap-1.5 text-muted-foreground"
                                  title="Sealed Bottles"
                                >
                                  <ClosedBottleIcon className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-foreground">
                                    {item.bottleStates.closed}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                N/A
                              </span>
                            )}
                          </td>
                          <td className="p-4 align-middle">
                            {batchCount > 0 ? (
                              <Badge
                                variant="outline"
                                className="bg-[#d5f365]/20 text-[#4a5200] border-[#d5f365]/50 gap-1 font-normal"
                              >
                                <Box className="h-3.5 w-3.5" />
                                Batches: {batchCount}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs italic">
                                No batches
                              </span>
                            )}
                          </td>
                          <td className="p-4 align-middle text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEdit(item)}
                                >
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => handleDeleteItem(item.id)}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Item modal for editing/adding */}
      <ItemModal
        open={isModalOpen}
        onOpenChange={handleItemModalOpenChange}
        item={editingItem || undefined}
        onItemUpdated={handleItemUpdated}
      />
      <CategoryModal
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
      />
      <BrandModal open={isBrandModalOpen} onOpenChange={setIsBrandModalOpen} />
      <TradeInsModal
        isOpen={isTradeInsModalOpen}
        onClose={() => setIsTradeInsModalOpen(false)}
      />
    </div>
  );
}

// Default export is the Manager
export default BranchInventoryManager;
