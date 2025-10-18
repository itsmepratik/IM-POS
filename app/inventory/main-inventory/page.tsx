"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  memo,
  useMemo,
  useTransition,
} from "react";

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
  Menu,
  ImageIcon,
  MoreVertical,
  Box,
  Percent,
  AlertCircle,
  PackageX,
  Package,
  Filter,
  X,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { ItemsProvider, useItems, type Item } from "../items-context";
import { ItemModal } from "../item-modal";
import { CategoryModal } from "../category-modal";
import { useUser } from "../../user-context";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BranchProvider } from "../../branch-context";
import { useInventoryData } from "../inventory-data";
import {
  OpenBottleBadge,
  ClosedBottleBadge,
} from "@/components/ui/inventory-bottle-icons";
import { OpenBottleIcon, ClosedBottleIcon } from "@/components/ui/bottle-icons";
import BrandModal from "../brand-modal";
import ExportButton from "../export-button";
import { StockIndicator } from "../components/stock-indicator";
import { BatteryStateSwitch } from "../components/battery-state-switch";
import { TradeInsModal } from "../components/trade-ins-modal";
import Image from "next/image";
import { Pagination } from "@/components/ui/pagination";

// Using Batch type from services via Item; no local Batch interface needed

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

    // Memoize expensive calculations
    const avgCost = useMemo(
      () => calculateAverageCost(item.id),
      [item.id, calculateAverageCost]
    );
    const batchCount = useMemo(() => item.batches?.length || 0, [item.batches]);

    // Calculate profit margin
    const margin = useMemo(() => {
      if (!item.batches || item.batches.length === 0 || item.price <= 0)
        return null;

      if (avgCost <= 0) return null;

      const marginPercentage = ((item.price - avgCost) / item.price) * 100;
      return Math.round(marginPercentage * 100) / 100; // Round to 2 decimals
    }, [item.batches, item.price, avgCost]);

    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="relative w-16 h-16 rounded-md border overflow-hidden bg-muted shrink-0">
              {!imageError && (item.imageUrl || item.image_url) ? (
                <Image
                  src={(item.imageUrl || item.image_url) as string}
                  alt={item.name}
                  fill
                  sizes="64px"
                  className="object-contain p-1"
                  onError={handleImageError as unknown as () => void}
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
                          {item.batches.map((batch, index) => (
                            <div
                              key={index}
                              className="flex justify-between text-xs"
                            >
                              <span>
                                {batch.purchase_date
                                  ? batch.purchase_date.substring(0, 10)
                                  : "-"}{" "}
                                ({batch.current_quantity ?? 0}/
                                {batch.initial_quantity ?? 0})
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

    // Memoize expensive calculations
    const avgCost = useMemo(
      () => calculateAverageCost(item.id),
      [item.id, calculateAverageCost]
    );
    const batchCount = useMemo(() => item.batches?.length || 0, [item.batches]);

    // Calculate profit margin
    const margin = useMemo(() => {
      if (!item.batches || item.batches.length === 0 || item.price <= 0)
        return null;

      if (avgCost <= 0) return null;

      const marginPercentage = ((item.price - avgCost) / item.price) * 100;
      return Math.round(marginPercentage * 100) / 100; // Round to 2 decimals
    }, [item.batches, item.price, avgCost]);

    return (
      <tr
        className={cn(
          "border-b hover:bg-muted/30 transition-colors",
          isSelected && "bg-muted/50"
        )}
      >
        <td className="h-16 px-4 text-left align-middle">
          <ClientOnly>
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggle(item.id)}
            />
          </ClientOnly>
        </td>
        <td className="h-16 px-4 text-left align-middle">
          <div className="flex items-center gap-3">
            {(item.imageUrl || item.image_url) && !imageError ? (
              <div className="relative w-8 h-8 rounded bg-muted overflow-hidden">
                <Image
                  src={(item.imageUrl || item.image_url) as string}
                  alt={item.name}
                  fill
                  sizes="32px"
                  className="object-contain"
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
        <td className="h-16 px-4 text-left align-middle">
          <Badge variant="outline">{item.category}</Badge>
        </td>
        <td className="h-16 px-4 text-left align-middle">
          {typeof item.stock === "number" ? (
            item.stock < 10 ? (
              <span className="text-red-500 font-medium">{item.stock}</span>
            ) : (
              item.stock
            )
          ) : (
            <span className="text-muted-foreground">N/A</span>
          )}
        </td>
        <td className="h-16 px-4 text-left align-middle">
          OMR {item.price.toFixed(2)}
        </td>
        <td className="h-16 px-4 text-left align-middle">
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
        <td className="h-16 px-4 text-left align-middle">
          {batchCount > 0 ? (
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className="bg-orange-50 text-orange-700 border-orange-200 gap-1"
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
  const [isPending, startTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const {
    filteredItems,
    categories,
    brands,
    isLoading,

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

    // Battery filter states
    showBatteries,
    setShowBatteries,
    batteryState,
    setBatteryState,

    editingItem,
    setEditingItem,

    // Unused here; actions triggered via local handlers
    // handleEdit,
    // handleAddItem,
    handleDelete,
    handleDuplicate,

    // Counts
    outOfStockCount,
    lowStockCount,
  } = useInventoryData();

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [tradeInsModalOpen, setTradeInsModalOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Open item modal for adding new item
  const openAddItemModal = useCallback(() => {
    setEditingItem(undefined);
    setItemModalOpen(true);
  }, [setEditingItem]);

  // Open item modal for editing existing item
  const openEditItemModal = useCallback(
    (item: Item) => {
      setEditingItem(item);
      setItemModalOpen(true);
    },
    [setEditingItem]
  );

  // Handle modal state changes
  const handleItemModalOpenChange = useCallback(
    (open: boolean) => {
      setItemModalOpen(open);
      if (!open) {
        setEditingItem(undefined);
      }
    },
    [setEditingItem]
  );

  // Handle low stock click
  const handleLowStockClick = useCallback(() => {
    setShowLowStockOnly((prev) => !prev);
    if (!showLowStockOnly) {
      setShowOutOfStockOnly(false);
      setShowInStock(false);
    } else {
      setShowInStock(true);
    }
  }, [
    showLowStockOnly,
    setShowLowStockOnly,
    setShowOutOfStockOnly,
    setShowInStock,
  ]);

  // Handle out of stock click
  const handleOutOfStockClick = useCallback(() => {
    setShowOutOfStockOnly((prev) => !prev);
    if (!showOutOfStockOnly) {
      setShowLowStockOnly(false);
      setShowInStock(false);
    } else {
      setShowInStock(true);
    }
  }, [
    showOutOfStockOnly,
    setShowOutOfStockOnly,
    setShowLowStockOnly,
    setShowInStock,
  ]);

  // Handle category modal open
  const handleCategoryModalOpen = useCallback(() => {
    setCategoryModalOpen(true);
    setFiltersOpen(false);
  }, []);

  // Handle brand modal open
  const handleBrandModalOpen = useCallback(() => {
    setBrandModalOpen(true);
    setFiltersOpen(false);
  }, []);

  // Handle trade-ins modal open
  const handleTradeInsModalOpen = useCallback(() => {
    setTradeInsModalOpen(true);
    setFiltersOpen(false);
  }, []);

  // Handle trade-ins modal close
  const handleTradeInsModalClose = useCallback(() => {
    setTradeInsModalOpen(false);
  }, []);

  // Handle search input change
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      startTransition(() => setSearchQuery(e.target.value));
    },
    [setSearchQuery]
  );

  // Handle category change
  const handleCategoryChange = useCallback(
    (value: string) => {
      startTransition(() => setSelectedCategory(value));
    },
    [setSelectedCategory]
  );

  // Handle brand change
  const handleBrandChange = useCallback(
    (value: string) => {
      startTransition(() => setSelectedBrand(value));
    },
    [setSelectedBrand]
  );

  // Handle show in stock change
  const handleShowInStockChange = useCallback(
    (checked: boolean) => {
      startTransition(() => {
        setShowInStock(!!checked);
        if (checked) {
          setShowLowStockOnly(false);
          setShowOutOfStockOnly(false);
        }
      });
    },
    [setShowInStock, setShowLowStockOnly, setShowOutOfStockOnly]
  );

  return (
    <div className="space-y-4 mt-[0px]">
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
              onChange={handleSearchChange}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="p-2"
            onClick={() => setFiltersOpen(true)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Buttons row below search */}
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Button onClick={openAddItemModal} size="sm">
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
                <DropdownMenuItem onAction={handleCategoryModalOpen}>
                  Categories
                </DropdownMenuItem>
                <DropdownMenuItem onAction={handleBrandModalOpen}>
                  Brands
                </DropdownMenuItem>
                <DropdownMenuItem onAction={handleTradeInsModalOpen}>
                  Trade-ins
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <ExportButton items={filteredItems} />
        </div>
      </div>

      {/* Filters Sheet */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
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
                  onValueChange={handleCategoryChange}
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
                onClick={handleCategoryModalOpen}
                className="w-full"
              >
                Categories
              </Button>
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-medium">Brands</h3>
              <ClientOnly>
                <Select value={selectedBrand} onValueChange={handleBrandChange}>
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
                onClick={handleBrandModalOpen}
                className="w-full"
              >
                Brands
              </Button>
            </div>

            {/* Stock Options */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-medium">Stock Options</h3>
              <div className="flex items-center space-x-2">
                <ClientOnly>
                  <Checkbox
                    id="mobileShowInStock"
                    checked={showInStock}
                    onCheckedChange={handleShowInStockChange}
                  />
                </ClientOnly>
                <label
                  htmlFor="mobileShowInStock"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Show in-stock only
                </label>
              </div>
            </div>

            {/* Stock Status Options */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-medium">Stock Status</h3>
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    startTransition(() => {
                      setShowOutOfStockOnly(false);
                      setShowLowStockOnly(!showLowStockOnly);
                      setShowInStock(false);
                    })
                  }
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
                  onClick={() =>
                    startTransition(() => {
                      setShowLowStockOnly(false);
                      setShowOutOfStockOnly(!showOutOfStockOnly);
                      setShowInStock(false);
                    })
                  }
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
        </SheetContent>
      </Sheet>

      <div className="flex items-center justify-between gap-4">
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
        {!isLoading &&
          (() => {
            const indexOfLastItem = currentPage * itemsPerPage;
            const indexOfFirstItem = indexOfLastItem - itemsPerPage;
            const currentItems = filteredItems.slice(
              indexOfFirstItem,
              indexOfLastItem
            );
            return currentItems.map((item) => (
              <MobileItemCard
                key={item.id}
                item={item}
                onEdit={openEditItemModal}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
              />
            ));
          })()}
        {isLoading && (
          <div className="text-center py-8">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">
                Loading inventory items...
              </p>
            </div>
          </div>
        )}

        {!isLoading && filteredItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <div className="flex flex-col items-center justify-center gap-2">
              <Package className="h-8 w-8 text-muted-foreground/50" />
              <p>
                {searchQuery || selectedCategory || selectedBrand
                  ? "No items match your current filters."
                  : "No inventory items found. Add your first product to get started."}
              </p>
            </div>
          </div>
        )}
      </div>

      {filteredItems.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredItems.length / itemsPerPage)}
          onPageChange={setCurrentPage}
        />
      )}

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
      <TradeInsModal
        isOpen={tradeInsModalOpen}
        onClose={handleTradeInsModalClose}
      />
    </div>
  );
}

function DesktopView() {
  const [isPending, startTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const {
    filteredItems,
    categories,
    brands,
    isLoading,

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

    // Battery filter states
    showBatteries,
    setShowBatteries,
    batteryState,
    setBatteryState,

    // Local filter states
    showFilters,
    setShowFilters,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    stockStatus,
    setStockStatus,

    selectedItems,
    toggleItemSelection,
    toggleAllSelection,

    editingItem,
    setEditingItem,

    // handleEdit,
    // handleAddItem,
    handleDelete,
    handleDuplicate,

    // Counts
    outOfStockCount,
    lowStockCount,
  } = useInventoryData();

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [tradeInsModalOpen, setTradeInsModalOpen] = useState(false);

  // Open item modal for adding new item
  const openAddItemModal = useCallback(() => {
    setEditingItem(undefined);
    setItemModalOpen(true);
  }, [setEditingItem]);

  // Open item modal for editing existing item
  const openEditItemModal = useCallback(
    (item: Item) => {
      setEditingItem(item);
      setItemModalOpen(true);
    },
    [setEditingItem]
  );

  // Handle modal state changes
  const handleItemModalOpenChange = useCallback(
    (open: boolean) => {
      setItemModalOpen(open);
      if (!open) {
        setEditingItem(undefined);
      }
    },
    [setEditingItem]
  );

  // Handle low stock click
  const handleLowStockClick = useCallback(() => {
    setShowLowStockOnly((prev) => !prev);
    if (!showLowStockOnly) {
      setShowOutOfStockOnly(false);
      setShowInStock(false);
    } else {
      setShowInStock(true);
    }
  }, [
    showLowStockOnly,
    setShowLowStockOnly,
    setShowOutOfStockOnly,
    setShowInStock,
  ]);

  // Handle out of stock click
  const handleOutOfStockClick = useCallback(() => {
    setShowOutOfStockOnly((prev) => !prev);
    if (!showOutOfStockOnly) {
      setShowLowStockOnly(false);
      setShowInStock(false);
    } else {
      setShowInStock(true);
    }
  }, [
    showOutOfStockOnly,
    setShowOutOfStockOnly,
    setShowLowStockOnly,
    setShowInStock,
  ]);

  // Handle category modal open
  const handleCategoryModalOpen = useCallback(() => {
    setCategoryModalOpen(true);
  }, []);

  // Handle brand modal open
  const handleBrandModalOpen = useCallback(() => {
    setBrandModalOpen(true);
  }, []);

  // Handle trade-ins modal open
  const handleTradeInsModalOpen = useCallback(() => {
    setTradeInsModalOpen(true);
  }, []);

  // Handle trade-ins modal close
  const handleTradeInsModalClose = useCallback(() => {
    setTradeInsModalOpen(false);
  }, []);

  // Handle clear all filters
  const handleClearAllFilters = useCallback(() => {
    setMinPrice("");
    setMaxPrice("");
    setStockStatus("all");
    setShowLowStockOnly(false);
    setShowOutOfStockOnly(false);
  }, [
    setMinPrice,
    setMaxPrice,
    setStockStatus,
    setShowLowStockOnly,
    setShowOutOfStockOnly,
  ]);

  // Handle low stock filter toggle
  const handleLowStockFilterToggle = useCallback(() => {
    startTransition(() => {
      setShowOutOfStockOnly(false);
      setShowLowStockOnly(!showLowStockOnly);
    });
  }, [showLowStockOnly, setShowOutOfStockOnly, setShowLowStockOnly]);

  // Handle out of stock filter toggle
  const handleOutOfStockFilterToggle = useCallback(() => {
    startTransition(() => {
      setShowLowStockOnly(false);
      setShowOutOfStockOnly(!showOutOfStockOnly);
    });
  }, [showOutOfStockOnly, setShowLowStockOnly, setShowOutOfStockOnly]);

  // Handle min price change
  const handleMinPriceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMinPrice(e.target.value);
    },
    [setMinPrice]
  );

  // Handle max price change
  const handleMaxPriceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setMaxPrice(e.target.value);
    },
    [setMaxPrice]
  );

  // Handle search input change
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      startTransition(() => setSearchQuery(e.target.value));
    },
    [setSearchQuery]
  );

  // Handle category change
  const handleCategoryChange = useCallback(
    (value: string) => {
      startTransition(() => setSelectedCategory(value));
    },
    [setSelectedCategory]
  );

  // Handle brand change
  const handleBrandChange = useCallback(
    (value: string) => {
      startTransition(() => setSelectedBrand(value));
    },
    [setSelectedBrand]
  );

  // Handle show in stock change
  const handleShowInStockChange = useCallback(
    (checked: boolean) => {
      startTransition(() => {
        setShowInStock(!!checked);
        if (checked) {
          setShowLowStockOnly(false);
          setShowOutOfStockOnly(false);
        }
      });
    },
    [setShowInStock, setShowLowStockOnly, setShowOutOfStockOnly]
  );

  const areAllSelected =
    selectedItems.length === filteredItems.length && filteredItems.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <ClientOnly>
            <Input
              type="search"
              placeholder="Search items..."
              className="pl-9 pr-4 w-full rounded-[2.0625rem] border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </ClientOnly>
        </div>

        <div className="flex-shrink-0 space-x-2">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="rounded-[2.0625rem] p-2"
            size="sm"
          >
            <Filter className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="rounded-[2.0625rem]"
                size="sm"
              >
                More Options
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent placement="bottom end" className="w-40">
              <DropdownMenuItem onAction={handleCategoryModalOpen}>
                Categories
              </DropdownMenuItem>
              <DropdownMenuItem onAction={handleBrandModalOpen}>
                Brands
              </DropdownMenuItem>
              <DropdownMenuItem onAction={handleTradeInsModalOpen}>
                Trade-ins
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
            <label htmlFor="showBatteries" className="text-sm font-medium">
              Show batteries:
            </label>
            <ClientOnly>
              <Checkbox
                id="showBatteries"
                checked={showBatteries}
                onCheckedChange={(checked) => {
                  setShowBatteries(!!checked);
                }}
              />
            </ClientOnly>
          </div>
          {showBatteries && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">State:</span>
              <BatteryStateSwitch
                value={batteryState}
                onChange={setBatteryState}
              />
            </div>
          )}
        </div>
      </div>

      {/* Awesome Filter Section - Desktop Only */}
      {showFilters && (
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
              onClick={handleClearAllFilters}
              className="rounded-[2.0625rem] text-gray-600 hover:bg-gray-100"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Price Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="text-green-600">💰</span>
                Price Range
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={handleMinPriceChange}
                  className="flex-1 rounded-[2.0625rem] border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
                <span className="text-gray-400">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={handleMaxPriceChange}
                  className="flex-1 rounded-[2.0625rem] border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Stock Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="text-orange-600">📦</span>
                Stock Status
              </label>
              <Select value={stockStatus} onValueChange={setStockStatus}>
                <SelectTrigger className="w-full rounded-[2.0625rem] border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                  <SelectValue placeholder="All Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stock</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                  <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="text-orange-600">📂</span>
                Category
              </label>
              <Select
                value={selectedCategory}
                onValueChange={handleCategoryChange}
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
              <Select value={selectedBrand} onValueChange={handleBrandChange}>
                <SelectTrigger className="w-full rounded-[2.0625rem] border-gray-300 focus:border-orange-500 focus:ring-orange-500">
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
            </div>

            {/* Stock Options Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="text-green-600">📊</span>
                Stock Options
              </label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="desktopShowInStock"
                    checked={showInStock}
                    onCheckedChange={handleShowInStockChange}
                  />
                  <label
                    htmlFor="desktopShowInStock"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Show in-stock only
                  </label>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <span className="text-red-600">⚡</span>
                Quick Filters
              </label>
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLowStockFilterToggle}
                  className={`justify-start rounded-[2.0625rem] ${
                    showLowStockOnly
                      ? "bg-amber-100 text-amber-800 border border-amber-300"
                      : "hover:bg-amber-50"
                  }`}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Low Stock
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOutOfStockFilterToggle}
                  className={`justify-start rounded-[2.0625rem] ${
                    showOutOfStockOnly
                      ? "bg-red-100 text-red-800 border border-red-300"
                      : "hover:bg-red-50"
                  }`}
                >
                  <PackageX className="h-4 w-4 mr-2" />
                  Out of Stock
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-[1.125rem] border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-14 px-4 text-left align-middle font-medium w-12">
                  <ClientOnly>
                    <Checkbox
                      checked={areAllSelected}
                      onCheckedChange={toggleAllSelection}
                    />
                  </ClientOnly>
                </th>
                <th className="h-14 px-4 text-left align-middle font-medium min-w-[200px]">
                  Item
                </th>
                <th className="h-14 px-4 text-left align-middle font-medium min-w-[120px]">
                  Category
                </th>
                <th className="h-14 px-4 text-left align-middle font-medium min-w-[80px]">
                  Stock
                </th>
                <th className="h-14 px-4 text-left align-middle font-medium min-w-[100px]">
                  Price
                </th>
                <th className="h-14 px-4 text-left align-middle font-medium min-w-[160px]">
                  Bottle Status
                </th>
                <th className="h-14 px-4 text-left align-middle font-medium min-w-[140px]">
                  Batches
                </th>
                <th className="h-14 px-4 text-right align-middle font-medium w-16">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <p>Loading inventory items...</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {filteredItems
                    .slice(
                      (currentPage - 1) * itemsPerPage,
                      currentPage * itemsPerPage
                    )
                    .map((item) => (
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
                        className="h-32 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Package className="h-8 w-8 text-muted-foreground/50" />
                          <p>
                            {searchQuery || selectedCategory || selectedBrand
                              ? "No items match your current filters."
                              : "No inventory items found. Add your first product to get started."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {filteredItems.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredItems.length / itemsPerPage)}
          onPageChange={setCurrentPage}
        />
      )}

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
      <TradeInsModal
        isOpen={tradeInsModalOpen}
        onClose={handleTradeInsModalClose}
      />
    </div>
  );
}

function ItemsPageContent() {
  const { currentUser } = useUser();

  if (currentUser?.role === "staff") {
    return (
      <div className="text-center py-8">
        You don&apos;t have permission to access this page.
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="hidden md:block h-full">
        <DesktopView />
      </div>
      <div className="block md:hidden h-full">
        <MobileView />
      </div>
    </div>
  );
}

export default function MainInventoryPage() {
  return (
    <BranchProvider>
      <ItemsProvider>
        <ClientOnly>
          <ItemsPageContent />
        </ClientOnly>
      </ItemsProvider>
    </BranchProvider>
  );
}
