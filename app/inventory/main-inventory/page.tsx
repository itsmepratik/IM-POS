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
import { DebouncedSearchInput } from "@/components/ui/debounced-search-input";
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
  ArrowUpDown,
} from "lucide-react";
import { ItemsProvider, useItems, type Item } from "../items-context";
import { useServerInventory } from "../hooks/useServerInventory";
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
import { CategoryModal } from "../category-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUser } from "@/lib/contexts/UserContext";
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
import { BranchProvider } from "@/lib/contexts/BranchContext";
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
import { TypesModal } from "../types-modal";
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
const MobileItemCard = ({
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
    [item.id, calculateAverageCost],
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
                <h3 className="font-medium whitespace-normal break-words pr-2">
                  {item.name}
                </h3>
                {item.brand && (
                  <p className="text-sm text-muted-foreground">{item.brand}</p>
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
              {item.specification && (
                <Badge
                  variant="outline"
                  className="border-blue-200 bg-blue-50 text-blue-700"
                >
                  {item.specification}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Stock:</span>
              <span className="font-medium">{item.stock ?? 0}</span>
            </div>
            <div className="text-base font-bold text-[#6d6d6d]">
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
                      <div className="text-muted-foreground mb-1">Volumes:</div>
                      <div className="grid gap-1">
                        {item.volumes.map(
                          (
                            volume: { size: string; price: number },
                            index: number,
                          ) => (
                            <div
                              key={index}
                              className="flex justify-between text-xs"
                            >
                              <span>{volume.size}</span>
                              <span>OMR {volume.price.toFixed(2)}</span>
                            </div>
                          ),
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
                                item.batches?.length || 0,
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Types */}
                  {((item.types && item.types.length > 0) || item.type) && (
                    <div className="mt-2 text-left">
                      <div className="text-muted-foreground mb-1">Types:</div>
                      <div className="flex flex-wrap gap-2">
                        {item.types && item.types.length > 0
                          ? item.types.map((t) => (
                              <Badge key={t.id} variant="outline">
                                {t.name}
                              </Badge>
                            ))
                          : item.type && (
                              <Badge variant="outline">{item.type}</Badge>
                            )}
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
};
MobileItemCard.displayName = "MobileItemCard";

const DeleteConfirmDialog = memo(
  ({
    open,
    onOpenChange,
    onConfirm,
    isDeleting,
  }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    isDeleting: boolean;
  }) => {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="w-[calc(100%-16px)] rounded-[9px] sm:w-full">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              item from the inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                onConfirm();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  },
);
DeleteConfirmDialog.displayName = "DeleteConfirmDialog";

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
    // Get active batch cost price
    const activeBatchCost = useMemo(() => {
      if (!item.batches || item.batches.length === 0) return 0;
      // Find the active batch, or fallback to the first one available
      const activeBatch =
        item.batches.find((b) => b.is_active_batch) || item.batches[0];
      return activeBatch?.cost_price || 0;
    }, [item.batches]);
    const batchCount = useMemo(() => item.batches?.length || 0, [item.batches]);

    // Calculate profit margin

    return (
      <tr
        className={cn(
          "border-b hover:bg-muted/30 transition-colors text-sm",
          isSelected && "bg-muted/50",
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
          {activeBatchCost > 0 ? (
            <span className="font-medium text-muted-foreground">
              OMR {activeBatchCost.toFixed(3)}
            </span>
          ) : (
            <span className="text-muted-foreground">N/A</span>
          )}
        </td>
        <td className="h-16 px-4 text-left align-middle">
          <span className="font-medium text-emerald-600">
            OMR {item.price.toFixed(3)}
          </span>
        </td>
        <td className="h-16 px-4 text-left align-middle">
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
            <span className="text-muted-foreground">N/A</span>
          )}
        </td>
        {/* Batch and cost/margin info */}
        <td className="h-16 px-4 text-left align-middle">
          {batchCount > 0 ? (
            <div className="flex gap-2">
              <Badge
                variant="outline"
                className="bg-[#d5f365]/20 text-[#4a5200] border-[#d5f365]/50 gap-1"
              >
                <Box className="h-3.5 w-3.5" />
                Batches: {batchCount}
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground text-xs italic">
              No batches
            </span>
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
  },
);
TableRow.displayName = "TableRow";

function MobileView({
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
  showLowStockOnly,
  setShowLowStockOnly,
  showOutOfStockOnly,
  setShowOutOfStockOnly,
  showBatteries,
  setShowBatteries,
  batteryState,
  setBatteryState,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  stockStatus,
  setStockStatus,
  resetFilters,

  // Pagination
  currentPage,
  setCurrentPage,
  itemsPerPage,
  totalCount,

  // Actions
  handleDelete,
  handleDuplicate,
  refresh,
  updateLocalItem,
}: {
  filteredItems: Item[];
  categories: string[];
  brands: string[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  selectedCategory: string;
  setSelectedCategory: (s: string) => void;
  selectedBrand: string;
  setSelectedBrand: (s: string) => void;
  showInStock: boolean;
  setShowInStock: (b: boolean) => void;
  showLowStockOnly: boolean;
  setShowLowStockOnly: (b: boolean) => void;
  showOutOfStockOnly: boolean;
  setShowOutOfStockOnly: (b: boolean) => void;
  showBatteries: boolean;
  setShowBatteries: (b: boolean) => void;
  batteryState: any;
  setBatteryState: (s: any) => void;
  minPrice: any;
  setMinPrice: (s: any) => void;
  maxPrice: any;
  setMaxPrice: (s: any) => void;
  stockStatus: any;
  setStockStatus: (s: any) => void;
  resetFilters: () => void;
  currentPage: number;
  setCurrentPage: (p: number) => void;
  itemsPerPage: number;
  totalCount: number;
  handleDelete: (id: string) => void;
  handleDuplicate: (id: string) => void;
  refresh: (silent?: boolean) => void;
  updateLocalItem: (item: Item) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);

  // Local state for counts (approximate or 0 for now as server doesn't return them without specific query)
  const outOfStockCount = 0;
  const lowStockCount = 0;

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      setIsDeleting(true);
      await handleDelete(itemToDelete);
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setItemToDelete(null);
  };

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [tradeInsModalOpen, setTradeInsModalOpen] = useState(false);
  const [typesModalOpen, setTypesModalOpen] = useState(false);
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
    [setEditingItem],
  );

  // Handle modal state changes
  const handleItemModalOpenChange = useCallback(
    (open: boolean) => {
      setItemModalOpen(open);
      if (!open) {
        setEditingItem(undefined);
      }
    },
    [setEditingItem],
  );

  // Handle low stock click
  const handleLowStockClick = useCallback(() => {
    const newValue = !showLowStockOnly;
    setShowLowStockOnly(newValue);
    if (newValue) {
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
    const newValue = !showOutOfStockOnly;
    setShowOutOfStockOnly(newValue);
    if (newValue) {
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

  // Handle types modal open
  const handleTypesModalOpen = useCallback(() => {
    setTypesModalOpen(true);
    setFiltersOpen(false);
  }, []);

  // Handle search input change
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      startTransition(() => setSearchQuery(e.target.value));
    },
    [setSearchQuery],
  );

  // Handle category change
  const handleCategoryChange = useCallback(
    (value: string) => {
      startTransition(() => setSelectedCategory(value));
    },
    [setSelectedCategory],
  );

  // Handle brand change
  const handleBrandChange = useCallback(
    (value: string) => {
      startTransition(() => setSelectedBrand(value));
    },
    [setSelectedBrand],
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
    [setShowInStock, setShowLowStockOnly, setShowOutOfStockOnly],
  );

  // Handle min price change
  const handleMinPriceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setMinPrice(isNaN(val) ? undefined : val);
    },
    [setMinPrice],
  );

  // Handle max price change
  const handleMaxPriceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setMaxPrice(isNaN(val) ? undefined : val);
    },
    [setMaxPrice],
  );

  // Handle clear all filters
  const handleClearAllFilters = useCallback(() => {
    resetFilters();
    setFiltersOpen(false);
  }, [resetFilters]);

  return (
    <div className="space-y-4 mt-[0px] pt-3 pb-4">
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
            variant="ghost"
            size="sm"
            className="p-2 rounded-[12px] bg-white border-none"
            onClick={() => setFiltersOpen(true)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Buttons row below search */}
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2 pl-1">
            <Button
              onClick={openAddItemModal}
              variant="chonky"
              size="sm"
              className="overflow-visible"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 rounded-[12px] pl-6"
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
                <DropdownMenuItem onAction={handleTypesModalOpen}>
                  Types
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
          <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <SheetTitle>Filters</SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAllFilters}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground rounded-[12px]"
            >
              <X className="h-3 w-3 mr-1" />
              Clear All
            </Button>
          </SheetHeader>
          <div className="py-4 space-y-6">
            {/* Price Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <span className="text-slate-500">💰</span>
                Price Range
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={handleMinPriceChange}
                  className="flex-1 rounded-[12px] border-slate-200"
                />
                <span className="text-slate-400">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={handleMaxPriceChange}
                  className="flex-1 rounded-[12px] border-slate-200"
                />
              </div>
            </div>

            {/* Stock Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <span className="text-slate-500">📦</span>
                Stock Status
              </label>
              <ClientOnly>
                <Select value={stockStatus} onValueChange={setStockStatus}>
                  <SelectTrigger className="w-full rounded-[12px] border-slate-200">
                    <SelectValue placeholder="All Stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock</SelectItem>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="low-stock">Low Stock</SelectItem>
                    <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </ClientOnly>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Categories</h3>
              <ClientOnly>
                <Select
                  value={selectedCategory}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger className="rounded-[12px] border-slate-200">
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
            </div>

            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-medium">Brands</h3>
              <ClientOnly>
                <Select value={selectedBrand} onValueChange={handleBrandChange}>
                  <SelectTrigger className="rounded-[12px] border-slate-200">
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
        <div className="flex items-center gap-2">
          <label htmlFor="mobileShowBatteries" className="text-sm font-medium">
            Show batteries
          </label>
          <ClientOnly>
            <Checkbox
              id="mobileShowBatteries"
              checked={showBatteries}
              onCheckedChange={(checked) => {
                setShowBatteries(!!checked);
              }}
            />
          </ClientOnly>
        </div>
      </div>

      {showBatteries && (
        <div className="flex items-center gap-2 pb-2">
          <span className="text-sm font-medium">State:</span>
          <BatteryStateSwitch value={batteryState} onChange={setBatteryState} />
        </div>
      )}

      <div className="space-y-2">
        {!isLoading &&
          filteredItems.map((item) => (
            <MobileItemCard
              key={item.id}
              item={item}
              onEdit={openEditItemModal}
              onDelete={(id) => setItemToDelete(id)}
              onDuplicate={handleDuplicate}
            />
          ))}
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
        <div className="w-full overflow-x-auto overflow-y-visible py-6 my-2">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalCount / itemsPerPage)}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <ItemModal
        open={itemModalOpen}
        onOpenChange={handleItemModalOpenChange}
        item={editingItem}
        onItemUpdated={(item) => {
          updateLocalItem(item);
          refresh(true); // Silent refresh
        }}
      />
      <CategoryModal
        open={categoryModalOpen}
        onOpenChange={setCategoryModalOpen}
      />
      <BrandModal open={brandModalOpen} onOpenChange={setBrandModalOpen} />
      <TypesModal open={typesModalOpen} onOpenChange={setTypesModalOpen} />
      <TradeInsModal
        isOpen={tradeInsModalOpen}
        onClose={handleTradeInsModalClose}
      />
      <DeleteConfirmDialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && handleCancelDelete()}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}

interface DesktopViewProps {
  filteredItems: Item[];
  categories: string[];
  brands: string[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  selectedCategory: string;
  setSelectedCategory: (s: string) => void;
  selectedBrand: string;
  setSelectedBrand: (s: string) => void;
  showInStock: boolean;
  setShowInStock: (b: boolean) => void;
  showLowStockOnly: boolean;
  setShowLowStockOnly: (b: boolean) => void;
  showOutOfStockOnly: boolean;
  setShowOutOfStockOnly: (b: boolean) => void;
  showBatteries: boolean;
  setShowBatteries: (b: boolean) => void;
  batteryState: any;
  setBatteryState: (s: any) => void;
  minPrice: any;
  setMinPrice: (s: any) => void;
  maxPrice: any;
  setMaxPrice: (s: any) => void;
  stockStatus: any;
  setStockStatus: (s: any) => void;
  resetFilters: () => void;

  // Pagination
  currentPage: number;
  setCurrentPage: (p: number) => void;
  itemsPerPage: number;
  totalCount: number;

  // Actions
  handleDelete: (id: string) => void;
  handleDuplicate: (id: string) => void;
  sortBy: "name" | "price" | undefined;
  setSortBy: (s: "name" | "price" | undefined) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (s: "asc" | "desc") => void;
  refresh: (silent?: boolean) => void;
  updateLocalItem: (item: Item) => void;
}

function DesktopView({
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
  showLowStockOnly,
  setShowLowStockOnly,
  showOutOfStockOnly,
  setShowOutOfStockOnly,
  showBatteries,
  setShowBatteries,
  batteryState,
  setBatteryState,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  stockStatus,
  setStockStatus,
  resetFilters,

  // Pagination
  currentPage,
  setCurrentPage,
  itemsPerPage,
  totalCount,

  // Actions
  handleDelete,
  handleDuplicate,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  refresh,
  updateLocalItem,
}: DesktopViewProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);

  // Counts (approximate)
  const outOfStockCount = 0;
  const lowStockCount = 0;

  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      setIsDeleting(true);
      await handleDelete(itemToDelete);
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setItemToDelete(null);
  };

  const toggleItemSelection = useCallback((id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }, []);

  const toggleAllSelection = useCallback(() => {
    if (filteredItems.length === 0) return;
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map((i) => i.id));
    }
  }, [filteredItems, selectedItems]);

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [tradeInsModalOpen, setTradeInsModalOpen] = useState(false);
  const [typesModalOpen, setTypesModalOpen] = useState(false);

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
    [setEditingItem],
  );

  // Handle modal state changes
  const handleItemModalOpenChange = useCallback(
    (open: boolean) => {
      setItemModalOpen(open);
      if (!open) {
        setEditingItem(undefined);
      }
    },
    [setEditingItem],
  );

  // Handle low stock click
  const handleLowStockClick = useCallback(() => {
    const newValue = !showLowStockOnly;
    setShowLowStockOnly(newValue);
    if (newValue) {
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
    const newValue = !showOutOfStockOnly;
    setShowOutOfStockOnly(newValue);
    if (newValue) {
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

  // Handle types modal open
  const handleTypesModalOpen = useCallback(() => {
    setTypesModalOpen(true);
  }, []);

  // Handle clear all filters - uses resetFilters from useInventoryData
  const handleClearAllFilters = useCallback(() => {
    resetFilters();
  }, [resetFilters]);

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
      const val = parseFloat(e.target.value);
      setMinPrice(isNaN(val) ? undefined : val);
    },
    [setMinPrice],
  );

  // Handle max price change
  const handleMaxPriceChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      setMaxPrice(isNaN(val) ? undefined : val);
    },
    [setMaxPrice],
  );

  // Handle search input change
  const handleSearchChange = useCallback(
    (value: string) => {
      startTransition(() => setSearchQuery(value));
    },
    [setSearchQuery],
  );

  // Handle category change
  const handleCategoryChange = useCallback(
    (value: string) => {
      startTransition(() => setSelectedCategory(value));
    },
    [setSelectedCategory],
  );

  // Handle brand change
  const handleBrandChange = useCallback(
    (value: string) => {
      startTransition(() => setSelectedBrand(value));
    },
    [setSelectedBrand],
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
    [setShowInStock, setShowLowStockOnly, setShowOutOfStockOnly],
  );

  const areAllSelected =
    selectedItems.length === filteredItems.length && filteredItems.length > 0;

  return (
    <div className="space-y-4 pt-3 pb-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <ClientOnly>
            <DebouncedSearchInput
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search items..."
              debounceMs={500}
            />
          </ClientOnly>
        </div>

        <div className="flex-shrink-0 space-x-2">
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
              <DropdownMenuItem onAction={handleCategoryModalOpen}>
                Categories
              </DropdownMenuItem>
              <DropdownMenuItem onAction={handleBrandModalOpen}>
                Brands
              </DropdownMenuItem>
              <DropdownMenuItem onAction={handleTypesModalOpen}>
                Types
              </DropdownMenuItem>
              <DropdownMenuItem onAction={handleTradeInsModalOpen}>
                Trade-ins
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={openAddItemModal} variant="chonky">
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

      {/* Awesome Filter Section - Desktop Only */}
      {showFilters && (
        <div className="bg-slate-50/50 backdrop-blur-sm border border-slate-200 rounded-[12px] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-200 rounded-full">
                <Filter className="h-5 w-5 text-slate-600" />
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
              className="rounded-[12px] text-slate-600 hover:bg-slate-100"
            >
              <X className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Price Range Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <span className="text-slate-500">💰</span>
                Price Range
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={handleMinPriceChange}
                  className="flex-1 rounded-[12px] border-slate-200 focus:border-slate-400 focus:ring-slate-400/20"
                />
                <span className="text-slate-400">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={handleMaxPriceChange}
                  className="flex-1 rounded-[12px] border-slate-200 focus:border-slate-400 focus:ring-slate-400/20"
                />
              </div>
            </div>

            {/* Stock Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <span className="text-slate-500">📦</span>
                Stock Status
              </label>
              <Select value={stockStatus} onValueChange={setStockStatus}>
                <SelectTrigger className="w-full rounded-[12px] border-slate-200 focus:border-slate-400 focus:ring-slate-400/20">
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
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <span className="text-slate-500">📂</span>
                Category
              </label>
              <Select
                value={selectedCategory}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="w-full rounded-[12px] border-slate-200 focus:border-slate-400 focus:ring-slate-400/20">
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
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <span className="text-slate-500">🏷️</span>
                Brand
              </label>
              <Select value={selectedBrand} onValueChange={handleBrandChange}>
                <SelectTrigger className="w-full rounded-[12px] border-slate-200 focus:border-slate-400 focus:ring-slate-400/20">
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
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <span className="text-slate-500">📊</span>
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

      <div className="rounded-[1.125rem] border bg-white shadow-sm mb-4">
        <div className="overflow-x-auto pb-2">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b bg-muted/50 text-sm">
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
                  Cost Price
                </th>
                <th className="h-14 px-4 text-left align-middle font-medium min-w-[100px]">
                  Selling Price
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
                  {filteredItems.map((item) => (
                    <TableRow
                      key={item.id}
                      item={item}
                      isSelected={selectedItems.includes(item.id)}
                      onToggle={toggleItemSelection}
                      onEdit={openEditItemModal}
                      onDelete={(id) => setItemToDelete(id)}
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
        <div className="w-full overflow-x-auto overflow-y-visible py-6 my-2">
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(totalCount / itemsPerPage)}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <ItemModal
        open={itemModalOpen}
        onOpenChange={handleItemModalOpenChange}
        item={editingItem}
        onItemUpdated={(item) => {
          updateLocalItem(item);
          refresh(true); // Silent refresh
        }}
      />
      <CategoryModal
        open={categoryModalOpen}
        onOpenChange={setCategoryModalOpen}
      />
      <BrandModal open={brandModalOpen} onOpenChange={setBrandModalOpen} />
      <TypesModal open={typesModalOpen} onOpenChange={setTypesModalOpen} />
      <TradeInsModal
        isOpen={tradeInsModalOpen}
        onClose={handleTradeInsModalClose}
      />

      <DeleteConfirmDialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && handleCancelDelete()}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}

function ItemsPageContent() {
  const { currentUser } = useUser();

  // Use server-side inventory hook
  const serverInventory = useServerInventory({
    initialLimit: 10,
  });

  // Use global items context for categories, etc.
  const { categories, brands, deleteItem, duplicateItem } = useItems();

  const commonProps = {
    filteredItems: serverInventory.items,
    categories,
    brands,
    isLoading: serverInventory.loading,
    searchQuery: serverInventory.search,
    setSearchQuery: serverInventory.setSearch,
    selectedCategory: serverInventory.categoryId,
    setSelectedCategory: serverInventory.setCategoryId,
    selectedBrand: serverInventory.brandId,
    setSelectedBrand: serverInventory.setBrandId,
    // Map advanced filters
    minPrice: serverInventory.minPrice,
    setMinPrice: serverInventory.setMinPrice,
    maxPrice: serverInventory.maxPrice,
    setMaxPrice: serverInventory.setMaxPrice,
    stockStatus: serverInventory.stockStatus,
    setStockStatus: serverInventory.setStockStatus,
    showLowStockOnly: serverInventory.showLowStockOnly,
    setShowLowStockOnly: serverInventory.setShowLowStockOnly,
    showOutOfStockOnly: serverInventory.showOutOfStockOnly,
    setShowOutOfStockOnly: serverInventory.setShowOutOfStockOnly,
    showInStock: serverInventory.showInStock,
    setShowInStock: serverInventory.setShowInStock,
    showBatteries: serverInventory.showBatteries,
    setShowBatteries: serverInventory.setShowBatteries,
    batteryState: serverInventory.batteryState,
    setBatteryState: serverInventory.setBatteryState,
    resetFilters: serverInventory.resetFilters,

    // Pagination
    currentPage: serverInventory.page,
    setCurrentPage: serverInventory.setPage,
    itemsPerPage: serverInventory.limit,
    totalCount: serverInventory.totalCount,

    // Actions wrapper
    handleDelete: async (id: string) => {
      await deleteItem(id);
      serverInventory.refresh();
    },
    handleDuplicate: async (id: string) => {
      await duplicateItem(id);
      serverInventory.refresh();
    },
    refresh: serverInventory.refresh,
    updateLocalItem: serverInventory.updateLocalItem,
    sortBy: serverInventory.sortBy,
    setSortBy: serverInventory.setSortBy,
    sortOrder: serverInventory.sortOrder,
    setSortOrder: serverInventory.setSortOrder,
  };

  return (
    <div className="w-full h-full">
      <div className="hidden md:block h-full">
        <DesktopView {...commonProps} />
      </div>
      <div className="block md:hidden h-full">
        <MobileView {...commonProps} />
      </div>
    </div>
  );
}

export default function MainInventoryPage() {
  return (
    <BranchProvider>
      <ItemsProvider overrideLocationId="sanaiya" skipFetchingItems={true}>
        <ClientOnly>
          <ItemsPageContent />
        </ClientOnly>
      </ItemsProvider>
    </BranchProvider>
  );
}
