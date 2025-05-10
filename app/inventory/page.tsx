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
  Box,
  DollarSign,
  PackageCheck,
  Percent,
  Pencil,
  Copy,
  Trash2,
  FolderGit2,
  AlertCircle,
  PackageX,
} from "lucide-react";
import { ItemsProvider, useItems, type Item } from "./items-context";
import { ItemModal } from "./item-modal";
import { toast } from "@/components/ui/use-toast";
import { CategoryModal } from "./category-modal";
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
import { BranchProvider, useBranch } from "../branch-context";
import { useInventoryData } from "./inventory-data";
import { Label } from "@/components/ui/label";
import {
  OpenBottleBadge,
  ClosedBottleBadge,
} from "@/components/ui/inventory-bottle-icons";
import { OpenBottleIcon, ClosedBottleIcon } from "@/components/ui/bottle-icons";
import ReceiveModal from "./receive-modal";
import BrandModal from "./brand-modal";
import ExportButton from "./export-button";
import Link from "next/link";
import { StockIndicator } from "./components/stock-indicator";

// Client-side only component wrapper to prevent hydration mismatch
const ClientOnly = ({ children }: { children: React.ReactNode }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null; // Return nothing on server-side
  }

  return <>{children}</>;
};

// Add helper function for FIFO order
const getBatchFifoPosition = (batchIndex: number, totalBatches: number) => {
  if (totalBatches <= 1) return "";
  if (batchIndex === 0) return "Next in line";
  if (batchIndex === totalBatches - 1) return "Last to use";
  return `Position ${batchIndex + 1} of ${totalBatches}`;
};

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
    const { calculateAverageCost } = useItems();

    const handleImageError = useCallback(() => {
      setImageError(true);
    }, []);

    // Calculate profit margin
    const calculateMargin = useCallback(() => {
      if (!item.batches || item.batches.length === 0 || item.price <= 0)
        return null;

      const avgCost = calculateAverageCost(item.id);
      if (avgCost <= 0) return null;

      const marginPercentage = ((item.price - avgCost) / item.price) * 100;
      return Math.round(marginPercentage * 100) / 100; // Round to 2 decimals
    }, [item, calculateAverageCost]);

    const margin = calculateMargin();
    const batchCount = item.batches?.length || 0;
    const avgCost = calculateAverageCost(item.id);

    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="relative w-16 h-16 rounded-md border overflow-hidden bg-muted shrink-0">
              {!imageError && item.image ? (
                <img
                  src={item.image}
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
              <>
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
                    {avgCost > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Avg Cost:</span>
                        <span>OMR {avgCost.toFixed(2)}</span>
                      </div>
                    )}

                    {margin !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Margin:</span>
                        <span
                          className={
                            margin < 30 ? "text-red-500" : "text-green-500"
                          }
                        >
                          {margin.toFixed(1)}%
                        </span>
                      </div>
                    )}

                    {batchCount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Batches:</span>
                        <span>{batchCount}</span>
                      </div>
                    )}

                    {item.volumes && item.volumes.length > 0 && (
                      <div className="mt-2">
                        <div className="text-muted-foreground mb-1">
                          Volumes:
                        </div>
                        <div className="grid gap-1">
                          {item.volumes.map(
                            (
                              volume: { size: string; price: number },
                              index: number
                            ) => (
                              <div
                                key={index}
                                className="flex justify-between text-xs"
                              >
                                <span>{volume.size}</span>
                                <span>OMR {volume.price.toFixed(2)}</span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {item.batches && item.batches.length > 0 && (
                      <div className="mt-2">
                        <div className="text-muted-foreground mb-1">
                          Batch Details (FIFO):
                        </div>
                        <div className="grid gap-1">
                          {item.batches.map((batch: any, index: number) => (
                            <div
                              key={index}
                              className="flex justify-between text-xs"
                            >
                              <span>
                                {batch.purchase_date.substring(0, 10)} (
                                {batch.current_quantity}/
                                {batch.initial_quantity})
                              </span>
                              <span>
                                {getBatchFifoPosition(
                                  index,
                                  item.batches?.length || 0
                                )}
                              </span>
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
              </>
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

// Memoize the table row component
const TableRow = memo(
  ({
    item,
    isSelected,
    onToggle,
    onEdit,
    onDelete,
    onDuplicate,
  }: {
    item: Item;
    isSelected: boolean;
    onToggle: (id: string) => void;
    onEdit: (item: Item) => void;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
  }) => {
    const [imageError, setImageError] = useState(false);
    const { calculateAverageCost } = useItems();

    // Calculate profit margin
    const calculateMargin = useCallback(() => {
      if (!item.batches || item.batches.length === 0 || item.price <= 0)
        return null;

      const avgCost = calculateAverageCost(item.id);
      if (avgCost <= 0) return null;

      const marginPercentage = ((item.price - avgCost) / item.price) * 100;
      return Math.round(marginPercentage * 100) / 100; // Round to 2 decimals
    }, [item, calculateAverageCost]);

    const margin = calculateMargin();
    const avgCost = calculateAverageCost(item.id);
    const batchCount = item.batches?.length || 0;

    return (
      <tr className={cn("border-b", isSelected && "bg-muted/50")}>
        <td className="h-12 px-4 text-left align-middle">
          <ClientOnly>
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggle(item.id)}
            />
          </ClientOnly>
        </td>
        <td className="h-12 px-4 text-left align-middle">
          <div className="flex items-center gap-3">
            {item.image && !imageError ? (
              <div className="w-8 h-8 rounded bg-muted overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-contain"
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            <div>
              <div className="font-medium">{item.name}</div>
              <div className="text-xs text-muted-foreground">
                {item.brand || "-"}
              </div>
            </div>
          </div>
        </td>
        <td className="h-12 px-4 text-left align-middle">
          <Badge variant="outline">{item.category}</Badge>
        </td>
        <td className="h-12 px-4 text-left align-middle">
          {item.stock < 10 ? (
            <span className="text-red-500 font-medium">{item.stock}</span>
          ) : (
            item.stock
          )}
        </td>
        <td className="h-12 px-4 text-left align-middle">
          OMR {item.price.toFixed(2)}
        </td>
        <td className="h-12 px-4 text-left align-middle">
          {item.isOil && item.bottleStates ? (
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className="bg-red-50 text-red-700 border-red-200 gap-1"
              >
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                Open: {item.bottleStates.open}
              </Badge>
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200 gap-1"
              >
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Closed: {item.bottleStates.closed}
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">N/A</span>
          )}
        </td>
        {/* Batch and cost/margin info */}
        <td className="h-12 px-4 text-left align-middle">
          {batchCount > 0 ? (
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 gap-1"
              >
                <Box className="h-3.5 w-3.5" />
                Batches: {batchCount}
              </Badge>
              {margin !== null && (
                <Badge
                  variant="outline"
                  className={`gap-1 ${
                    margin < 15
                      ? "bg-red-50 text-red-700 border-red-200"
                      : margin < 25
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                      : "bg-green-50 text-green-700 border-green-200"
                  }`}
                >
                  <Percent className="h-3.5 w-3.5" />
                  {margin}%
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">N/A</span>
          )}
        </td>
        <td className="h-12 px-4 text-right align-middle">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(item)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(item.id)}>
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(item.id)}
                className="text-red-600 focus:text-red-600"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </td>
      </tr>
    );
  }
);
TableRow.displayName = "TableRow";

function MobileView() {
  const {
    filteredItems,
    categories,
    brands,

    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedBrand,
    setSelectedBrand,
    showInStock,
    setShowInStock,

    // Stock threshold states
    showLowStockOnly,
    setShowLowStockOnly,
    showOutOfStockOnly,
    setShowOutOfStockOnly,

    editingItem,
    setEditingItem,

    handleEdit,
    handleAddItem,
    handleDelete,
    handleDuplicate,

    // Counts
    outOfStockCount,
    lowStockCount,
  } = useInventoryData();

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Open item modal for adding new item
  const openAddItemModal = () => {
    setEditingItem(undefined);
    setItemModalOpen(true);
  };

  // Open item modal for editing existing item
  const openEditItemModal = (item: Item) => {
    setEditingItem(item);
    setItemModalOpen(true);
  };

  // Handle modal state changes
  const handleItemModalOpenChange = (open: boolean) => {
    setItemModalOpen(open);
    if (!open) {
      setEditingItem(undefined);
    }
  };

  // Handle low stock click
  const handleLowStockClick = () => {
    setShowLowStockOnly((prev) => !prev);
    if (!showLowStockOnly) {
      setShowOutOfStockOnly(false);
      setShowInStock(false);
    } else {
      setShowInStock(true);
    }
  };

  // Handle out of stock click
  const handleOutOfStockClick = () => {
    setShowOutOfStockOnly((prev) => !prev);
    if (!showOutOfStockOnly) {
      setShowLowStockOnly(false);
      setShowInStock(false);
    } else {
      setShowInStock(true);
    }
  };

  return (
    <div className="space-y-4 -mt-4">
      <div className="mb-2 flex flex-col gap-4">
        {/* Search bar and stock indicators */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full pl-9"
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
        </div>

        {/* Buttons row below search */}
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Button onClick={openAddItemModal} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Menu className="h-4 w-4 mr-1" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[380px]">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Categories</h3>
                    <ClientOnly>
                      <Select
                        value={selectedCategory}
                        onValueChange={setSelectedCategory}
                      >
                        <SelectTrigger>
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
                    </ClientOnly>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCategoryModalOpen(true);
                        setFiltersOpen(false);
                      }}
                      className="w-full"
                    >
                      Manage Categories
                    </Button>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="text-sm font-medium">Brands</h3>
                    <ClientOnly>
                      <Select
                        value={selectedBrand}
                        onValueChange={setSelectedBrand}
                      >
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
                    </ClientOnly>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBrandModalOpen(true);
                        setFiltersOpen(false);
                      }}
                      className="w-full"
                    >
                      Manage Brands
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <label
                      htmlFor="mobileShowInStock"
                      className="text-sm font-medium flex-1"
                    >
                      Show in-stock only
                    </label>
                    <ClientOnly>
                      <Checkbox
                        id="mobileShowInStock"
                        checked={showInStock}
                        onCheckedChange={(checked) => {
                          setShowInStock(!!checked);
                          if (checked) {
                            setShowLowStockOnly(false);
                            setShowOutOfStockOnly(false);
                          }
                        }}
                      />
                    </ClientOnly>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <ExportButton items={filteredItems} />
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            {filteredItems.length}{" "}
            {filteredItems.length === 1 ? "item" : "items"} found
          </div>
          {showLowStockOnly && (
            <Badge
              variant="outline"
              className="bg-amber-100 border-amber-300 text-amber-700 text-xs flex items-center gap-1"
            >
              <AlertCircle className="h-3 w-3" />
              Low Stock
            </Badge>
          )}
          {showOutOfStockOnly && (
            <Badge
              variant="outline"
              className="bg-red-100 border-red-300 text-red-700 text-xs flex items-center gap-1"
            >
              <PackageX className="h-3 w-3" />
              Out of Stock
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {filteredItems.map((item) => (
          <MobileItemCard
            key={item.id}
            item={item}
            onEdit={openEditItemModal}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
          />
        ))}
        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No items found. Try adjusting your filters.
          </div>
        )}
      </div>

      <ItemModal
        open={itemModalOpen}
        onOpenChange={handleItemModalOpenChange}
        item={editingItem}
      />
      <CategoryModal
        open={categoryModalOpen}
        onOpenChange={setCategoryModalOpen}
      />
      <BrandModal open={brandModalOpen} onOpenChange={setBrandModalOpen} />
    </div>
  );
}

function DesktopView() {
  const {
    filteredItems,
    categories,
    brands,

    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedBrand,
    setSelectedBrand,
    showInStock,
    setShowInStock,

    // Stock threshold states
    showLowStockOnly,
    setShowLowStockOnly,
    showOutOfStockOnly,
    setShowOutOfStockOnly,

    selectedItems,
    toggleItemSelection,
    toggleAllSelection,

    editingItem,
    setEditingItem,

    handleEdit,
    handleAddItem,
    handleDelete,
    handleDuplicate,

    // Counts
    outOfStockCount,
    lowStockCount,
  } = useInventoryData();

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);

  // Open item modal for adding new item
  const openAddItemModal = () => {
    setEditingItem(undefined);
    setItemModalOpen(true);
  };

  // Open item modal for editing existing item
  const openEditItemModal = (item: Item) => {
    setEditingItem(item);
    setItemModalOpen(true);
  };

  // Handle modal state changes
  const handleItemModalOpenChange = (open: boolean) => {
    setItemModalOpen(open);
    if (!open) {
      setEditingItem(undefined);
    }
  };

  // Handle low stock click
  const handleLowStockClick = () => {
    setShowLowStockOnly((prev) => !prev);
    if (!showLowStockOnly) {
      setShowOutOfStockOnly(false);
      setShowInStock(false);
    } else {
      setShowInStock(true);
    }
  };

  // Handle out of stock click
  const handleOutOfStockClick = () => {
    setShowOutOfStockOnly((prev) => !prev);
    if (!showOutOfStockOnly) {
      setShowLowStockOnly(false);
      setShowInStock(false);
    } else {
      setShowInStock(true);
    }
  };

  const areAllSelected =
    selectedItems.length === filteredItems.length && filteredItems.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="relative w-60">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <ClientOnly>
              <Input
                type="search"
                placeholder="Search items..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </ClientOnly>
          </div>
          <StockIndicator
            lowStockCount={lowStockCount}
            outOfStockCount={outOfStockCount}
            onLowStockClick={handleLowStockClick}
            onOutOfStockClick={handleOutOfStockClick}
          />
        </div>

        <div className="flex items-center gap-2">
          <ClientOnly>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-[180px]">
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
          </ClientOnly>
          <ClientOnly>
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                <SelectItem value="none">No Brand</SelectItem>
                {brands &&
                  brands.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </ClientOnly>
          <Button variant="outline" onClick={() => setCategoryModalOpen(true)}>
            Categories
          </Button>
          <Button variant="ghost" onClick={() => setBrandModalOpen(true)}>
            Brands
          </Button>
          <Button onClick={openAddItemModal}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
          <ExportButton items={filteredItems} />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground">
          {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}{" "}
          found
        </div>
        <div className="flex gap-2 items-center ml-6">
          <label htmlFor="showInStock" className="text-sm font-medium">
            Show in-stock only:
          </label>
          <ClientOnly>
            <Checkbox
              id="showInStock"
              checked={showInStock}
              onCheckedChange={(checked) => {
                setShowInStock(!!checked);
                if (checked) {
                  setShowLowStockOnly(false);
                  setShowOutOfStockOnly(false);
                }
              }}
            />
          </ClientOnly>
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
      </div>

      <div className="rounded-md border bg-white overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium">
                  <ClientOnly>
                    <Checkbox
                      checked={areAllSelected}
                      onCheckedChange={toggleAllSelection}
                    />
                  </ClientOnly>
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium">
                  Item
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium">
                  Category
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium">
                  Stock
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium">
                  Price
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium">
                  Bottle Status
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium">
                  Batches
                </th>
                <th className="h-12 px-4 text-right align-middle font-medium">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <TableRow
                  key={item.id}
                  item={item}
                  isSelected={selectedItems.includes(item.id)}
                  onToggle={toggleItemSelection}
                  onEdit={openEditItemModal}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                />
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No items found. Try adjusting your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ItemModal
        open={itemModalOpen}
        onOpenChange={handleItemModalOpenChange}
        item={editingItem}
      />
      <CategoryModal
        open={categoryModalOpen}
        onOpenChange={setCategoryModalOpen}
      />
      <BrandModal open={brandModalOpen} onOpenChange={setBrandModalOpen} />
    </div>
  );
}

function ItemsPageContent() {
  const { currentUser } = useUser();
  const { currentBranch } = useBranch();
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

  return (
    <div className="w-full space-y-6">
      <div className="hidden md:block">
        <DesktopView />
      </div>
      <div className="block md:hidden">
        <MobileView />
      </div>
    </div>
  );
}

export default function InventoryPage() {
  return (
    <Layout>
      <BranchProvider>
        <ItemsProvider>
          <ClientOnly>
            <ItemsPageContent />
          </ClientOnly>
        </ItemsProvider>
      </BranchProvider>
    </Layout>
  );
}
