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

            <Button
              variant="ghost"
              className="w-full justify-start p-0 h-auto text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? "Less details" : "More details"}
            </Button>

            {showDetails && (
              <div className="pt-2 space-y-3">
                {item.description && (
                  <div className="text-sm">
                    <span className="font-medium">Description:</span>
                    <p className="text-muted-foreground mt-1">
                      {item.description}
                    </p>
                  </div>
                )}

                {item.isOil && item.volumes && item.volumes.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium">
                      Available Volumes:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {item.volumes.map((volume: Volume, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 rounded-md border text-sm"
                        >
                          <span>{volume.size}</span>
                          <span className="font-medium">
                            OMR {volume.price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {item.isOil && item.bottleStates && (
                  <div className="mt-2 border-t pt-2">
                    <h4 className="text-sm font-medium mb-1">
                      Bottle Inventory
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center justify-between p-2 rounded-md bg-red-50 border border-red-200">
                        <span className="text-sm text-red-800 flex items-center gap-1">
                          <OpenBottleIcon className="h-3 w-3" />
                          Open Bottles:
                        </span>
                        <span className="font-medium text-red-800">
                          {item.bottleStates.open}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-md bg-green-50 border border-green-200">
                        <span className="text-sm font-medium text-green-800 flex items-center gap-1">
                          <ClosedBottleIcon className="h-3 w-3" />
                          Closed Bottles:
                        </span>
                        <span className="font-bold text-green-800">
                          {item.bottleStates.closed}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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
}: {
  items: Item[];
  isLoading: boolean;
  selectedBranch: Branch | null;
  handleDeleteItem: (id: string) => Promise<void>;
}) {
  const {
    categories,
    brands,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    showLowStock,
    setShowLowStock,
    isModalOpen,
    setIsModalOpen,
    isCategoryModalOpen,
    setIsCategoryModalOpen,
    isBrandModalOpen,
    setIsBrandModalOpen,
    editingItem,
    setEditingItem,
    filteredItems,
    handleEdit,
    branches,
    selectedBranch: hookSelectedBranch,
    setSelectedBranch,
    resetFilters,
  } = useBranchInventoryMockData();

  // Function to handle adding a new item
  const handleAddItem = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="w-full">
            <Select
              value={hookSelectedBranch?.id || ""}
              onValueChange={(value) => {
                const branch = branches.find((b) => b.id === value);
                if (branch) setSelectedBranch(branch);
              }}
            >
              <SelectTrigger className="w-full rounded-full bg-primary/10">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Select Branch" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Abu Dhabi Branch</SelectItem>
                <SelectItem value="2">Hafeet Branch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search items..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
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
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="py-4 space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="lowStock"
                    checked={showLowStock}
                    onCheckedChange={(checked) => setShowLowStock(!!checked)}
                  />
                  <Label htmlFor="lowStock">Show low stock only</Label>
                </div>

                <div className="space-y-2">
                  <div className="font-medium">Categories</div>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setIsCategoryModalOpen(true)}
                  >
                    Manage Categories
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="font-medium">Brands</div>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => setIsBrandModalOpen(true)}
                  >
                    Manage Brands
                  </Button>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={resetFilters}
                >
                  Reset Filters
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Button onClick={handleAddItem}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-pulse text-center">
            <p>Loading inventory...</p>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No items found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredItems.map((item) => (
            <MobileItemCard
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDeleteItem}
              onDuplicate={() => {}}
            />
          ))}
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

function BranchInventoryPage() {
  const { currentUser } = useUser();

  // Use our mock branch inventory hook
  const {
    branchItems,
    filteredItems,
    isLoading,
    selectedBranch,
    branches,
    setSelectedBranch,
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
  } = useBranchInventoryMockData();

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
    <div className="container mx-auto max-w-7xl px-2 sm:px-4 lg:px-6 py-4">
      <PageHeader>Branch Inventory</PageHeader>
      {isMobile ? (
        <MobileView
          items={branchItems}
          isLoading={isLoading}
          selectedBranch={selectedBranch}
          handleDeleteItem={handleDeleteItem}
        />
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between">
            <div className="w-[300px]">
              <Select
                value={selectedBranch?.id || ""}
                onValueChange={(value) => {
                  const branch = branches.find((b) => b.id === value);
                  if (branch) setSelectedBranch(branch);
                }}
              >
                <SelectTrigger className="w-full rounded-full bg-primary/10">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Select Branch" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Abu Dhabi Branch</SelectItem>
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="lowStockDesktop"
                checked={showLowStock}
                onCheckedChange={(checked) => setShowLowStock(!!checked)}
              />
              <Label htmlFor="lowStockDesktop">Show low stock only</Label>
            </div>
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
