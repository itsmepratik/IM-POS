"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Layout } from "@/components/layout";
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
} from "lucide-react";
import { ItemsProvider, useItems, type Item } from "../inventory/items-context";
import { ItemModal } from "../inventory/item-modal";
import { toast } from "@/components/ui/use-toast";
import { CategoryModal } from "../inventory/category-modal";
import { useUser } from "../user-context";
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
import { BranchProvider, useBranch } from "./branch-context-mock";
import type { Branch } from "@/lib/services/inventoryService";
import { useInventoryData } from "../inventory/hooks/useInventoryData";
import { Label } from "@/components/ui/label";
import {
  OpenBottleBadge,
  ClosedBottleBadge,
} from "@/components/ui/inventory-bottle-icons";
import { OpenBottleIcon, ClosedBottleIcon } from "@/components/ui/bottle-icons";
import BrandModal from "../inventory/brand-modal";
import { useBranchInventoryMockData } from "./hooks/useBranchInventoryMockData";
import {
  useAbuDhabiInventory,
  ABU_DHABI_BRANCH,
} from "./hooks/useAbuDhabiInventory";
import { useHafithInventory, HAFITH_BRANCH } from "./hooks/useHafithInventory";
import { StockIndicator } from "../inventory/components/stock-indicator";

// Define volume type
interface Volume {
  size: string;
  price: number;
}

// Mock utility functions
async function runFixInventoryScript() {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  return {
    success: true,
    message: "Inventory fixed successfully (mock)",
  };
}

async function migrateToNewInventorySystem() {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 3000));

  return {
    success: true,
    message: "Inventory migrated to new system successfully (mock)",
  };
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
  }
);
MobileItemCard.displayName = "MobileItemCard";

function MobileView({
  items,
  isLoading,
  selectedBranch,
  handleDeleteItem,
  onBranchChange,
}: {
  items: Item[];
  isLoading: boolean;
  selectedBranch: typeof ABU_DHABI_BRANCH | typeof HAFITH_BRANCH;
  handleDeleteItem: (id: string) => Promise<void>;
  onBranchChange: (branchId: string) => void;
}) {
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showOutOfStockOnly, setShowOutOfStockOnly] = useState(false);
  const [branchId, setBranchId] = useState(selectedBranch.id);

  // Get available branches
  const branches = [ABU_DHABI_BRANCH, HAFITH_BRANCH];

  // Update the branch ID when selectedBranch changes
  useEffect(() => {
    setBranchId(selectedBranch.id);
  }, [selectedBranch]);

  // Count out of stock items
  const outOfStockCount = useMemo(() => {
    return items.filter((item) => (item.stock ?? 0) === 0).length;
  }, [items]);

  // Count low stock items (excluding out of stock)
  const lowStockCount = useMemo(() => {
    return items.filter((item) => {
      const stock = item.stock ?? 0;
      // Use item's lowStockAlert value if available, otherwise use default threshold of 5
      const threshold = item.lowStockAlert ?? 5;
      return stock > 0 && stock <= threshold;
    }).length;
  }, [items]);

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

  const handleLowStockClick = () => {
    setShowOutOfStockOnly(false);
    setShowLowStockOnly(!showLowStockOnly);
  };

  const handleOutOfStockClick = () => {
    setShowLowStockOnly(false);
    setShowOutOfStockOnly(!showOutOfStockOnly);
  };

  const handleBranchChange = (branchId: string) => {
    setBranchId(branchId);
    onBranchChange(branchId);
  };

  return (
    <div className="space-y-4 -mt-4 pt-4">
      <div className="mb-2 flex flex-col gap-4">
        {/* Branch selector dropdown */}
        <div>
          <Select value={branchId} onValueChange={handleBranchChange}>
            <SelectTrigger className="w-full rounded-full bg-primary/10">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Select Branch" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Abu Dhurus</SelectItem>
              <SelectItem value="2">Hafeet Branch</SelectItem>
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
          <StockIndicator
            lowStockCount={lowStockCount}
            outOfStockCount={outOfStockCount}
            onLowStockClick={handleLowStockClick}
            onOutOfStockClick={handleOutOfStockClick}
          />
          <Button
            onClick={handleAddItem}
            size="sm"
            className="shrink-0"
            type="button"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
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

      {/* Item modal for editing/adding */}
      <ItemModal
        open={itemModalOpen}
        onOpenChange={setItemModalOpen}
        item={editingItem || undefined}
      />
    </div>
  );
}

function BranchInventoryPage() {
  const { currentUser } = useUser();
  const [selectedBranchId, setSelectedBranchId] = useState("1"); // Default to Abu Dhurus
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showOutOfStockOnly, setShowOutOfStockOnly] = useState(false);

  // Branch specific hooks
  const abuDhabiInventory = useAbuDhabiInventory();
  const hafithInventory = useHafithInventory();

  // Select the active branch's data
  const branchData =
    selectedBranchId === "1" ? abuDhabiInventory : hafithInventory;

  // Destructure from the selected branch data
  const {
    branchItems,
    filteredItems: originalFilteredItems,
    isLoading,
    selectedBranch,
    handleDeleteItem,
    // UI states
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    showLowStock,
    setShowLowStock,
    // Modal states
    isModalOpen,
    setIsModalOpen,
    isCategoryModalOpen,
    setIsCategoryModalOpen,
    isBrandModalOpen,
    setIsBrandModalOpen,
    editingItem,
    setEditingItem,
    categories,
    brands,
    // Actions
    handleEdit,
    resetFilters,
  } = branchData;

  // Count out of stock items
  const outOfStockCount = useMemo(() => {
    return branchItems.filter((item) => (item.stock ?? 0) === 0).length;
  }, [branchItems]);

  // Count low stock items (excluding out of stock)
  const lowStockCount = useMemo(() => {
    return branchItems.filter((item) => {
      const stock = item.stock ?? 0;
      // Use item's lowStockAlert value if available, otherwise use default threshold of 5
      const threshold = item.lowStockAlert ?? 5;
      return stock > 0 && stock <= threshold;
    }).length;
  }, [branchItems]);

  // Apply additional filters for low stock and out of stock
  const filteredItems = useMemo(() => {
    return originalFilteredItems.filter((item) => {
      // Low stock filter
      const matchesLowStock = showLowStockOnly
        ? (item.stock ?? 0) > 0 &&
          (item.stock ?? 0) <= (item.lowStockAlert ?? 5)
        : true;

      // Out of stock filter
      const matchesOutOfStock = showOutOfStockOnly
        ? (item.stock ?? 0) === 0
        : true;

      return showLowStockOnly || showOutOfStockOnly
        ? matchesLowStock && matchesOutOfStock
        : true;
    });
  }, [originalFilteredItems, showLowStockOnly, showOutOfStockOnly]);

  const handleLowStockClick = () => {
    setShowOutOfStockOnly(false);
    setShowLowStockOnly(!showLowStockOnly);
    setShowLowStock(false); // Turn off the original low stock filter
  };

  const handleOutOfStockClick = () => {
    setShowLowStockOnly(false);
    setShowOutOfStockOnly(!showOutOfStockOnly);
    setShowLowStock(false); // Turn off the original low stock filter
  };

  const handleBranchChange = (branchId: string) => {
    setSelectedBranchId(branchId);
    setShowLowStockOnly(false);
    setShowOutOfStockOnly(false);
  };

  const [isMobile, setIsMobile] = useState(false);

  // Check viewport on mount and resize
  const checkViewport = () => {
    setIsMobile(window.innerWidth < 1024);
  };

  useEffect(() => {
    checkViewport();
    window.addEventListener("resize", checkViewport);

    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  if (currentUser?.role === "staff") {
    return (
      <div className="text-center py-8">
        You don&apos;t have permission to access this page.
      </div>
    );
  }

  // Get available branches
  const branches = [ABU_DHABI_BRANCH, HAFITH_BRANCH];

  return (
    <div className="w-full space-y-6">
      {isMobile ? (
        <MobileView
          items={branchItems}
          isLoading={isLoading}
          selectedBranch={
            selectedBranchId === "1" ? ABU_DHABI_BRANCH : HAFITH_BRANCH
          }
          handleDeleteItem={handleDeleteItem}
          onBranchChange={handleBranchChange}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between">
            <div className="w-[300px]">
              <Select
                value={selectedBranchId}
                onValueChange={handleBranchChange}
              >
                <SelectTrigger className="w-full rounded-full bg-primary/10">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select Branch" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Abu Dhurus</SelectItem>
                  <SelectItem value="2">Hafeet Branch</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search items..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <StockIndicator
              lowStockCount={lowStockCount}
              outOfStockCount={outOfStockCount}
              onLowStockClick={handleLowStockClick}
              onOutOfStockClick={handleOutOfStockClick}
            />
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-[180px]">
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
            <div className="flex-1 text-right space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsCategoryModalOpen(true)}
              >
                Categories
              </Button>
              <Button variant="ghost" onClick={() => setIsBrandModalOpen(true)}>
                Brands
              </Button>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
          </div>

          {/* Filter status indicators */}
          {(showLowStockOnly || showOutOfStockOnly) && (
            <div className="flex items-center">
              <Badge variant="outline" className="py-1 px-3">
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

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-pulse text-center">
                <p>Loading inventory...</p>
              </div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <p className="text-muted-foreground">No items found</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        Item
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        Category
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        Brand
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        Stock
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        Price
                      </th>
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        Bottle Inventory
                      </th>
                      <th className="h-12 w-[40px]"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md border overflow-hidden bg-muted flex items-center justify-center">
                              {item.imageUrl || item.image_url ? (
                                <img
                                  src={item.imageUrl || item.image_url || ""}
                                  alt={item.name}
                                  className="object-contain w-full h-full"
                                  onError={(e) => {
                                    (
                                      e.target as HTMLImageElement
                                    ).style.display = "none";
                                  }}
                                />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{item.name}</div>
                              {item.sku && (
                                <div className="text-xs text-muted-foreground">
                                  SKU: {item.sku}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary">
                            {item.category || "Uncategorized"}
                          </Badge>
                        </td>
                        <td className="p-4">{item.brand || "-"}</td>
                        <td className="p-4">{item.stock || 0}</td>
                        <td className="p-4">OMR {item.price.toFixed(2)}</td>
                        <td className="p-4">
                          {item.isOil && item.bottleStates ? (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <OpenBottleIcon className="h-3 w-3 text-red-600" />
                                <span>{item.bottleStates.open}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <ClosedBottleIcon className="h-3 w-3 text-green-600" />
                                <span>{item.bottleStates.closed}</span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-4">
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <ItemModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) setEditingItem(null);
        }}
        item={editingItem || undefined}
      />
      <CategoryModal
        open={isCategoryModalOpen}
        onOpenChange={setIsCategoryModalOpen}
      />
      <BrandModal open={isBrandModalOpen} onOpenChange={setIsBrandModalOpen} />
    </div>
  );
}

export default function ItemsPage() {
  return (
    <Layout>
      <BranchProvider>
        <ItemsProvider>
          <BranchInventoryPage />
        </ItemsProvider>
      </BranchProvider>
    </Layout>
  );
}
