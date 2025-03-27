"use client"

import { useState, useEffect, useMemo, useCallback, memo } from "react"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Plus, Search, ChevronRight, Menu, ImageIcon, MoreVertical, Box, DollarSign, PackageCheck, Percent, Pencil, Copy, Trash2 } from "lucide-react"
import { ItemsProvider, useItems, type Item } from "./items-context"
import { ItemModal } from "./item-modal"
import { toast } from "@/components/ui/use-toast"
import { CategoryModal } from "./category-modal"
import { useUser } from "../user-context"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { PageHeader } from "@/components/page-title"
import { BranchProvider, useBranch } from "../branch-context"
import { useInventoryData } from "./inventory-data"
import { Label } from "@/components/ui/label"
import { OpenBottleBadge, ClosedBottleBadge } from "@/components/ui/inventory-bottle-icons"
import { OpenBottleIcon, ClosedBottleIcon } from "@/components/ui/bottle-icons"
import ReceiveModal from "./receive-modal"
import BrandModal from "./brand-modal"
import ExportButton from "./export-button"

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
const MobileItemCard = memo(({ item, onEdit, onDelete, onDuplicate }: {
  item: Item
  onEdit: (item: Item) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}) => {
  const [showDetails, setShowDetails] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { calculateAverageCost } = useItems()

  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  // Calculate profit margin
  const calculateMargin = useCallback(() => {
    if (!item.batches || item.batches.length === 0 || item.price <= 0) return null;
    
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
                  <DropdownMenuItem onClick={() => onEdit(item)}>Edit item</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate(item.id)}>Duplicate</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => onDelete(item.id)}>
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
              {item.type && (
                <Badge variant="outline">{item.type}</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Stock:</span>
              <span className="font-medium">{item.stock}</span>
            </div>
            <div className="text-base font-medium text-primary">
              OMR {item.price.toFixed(2)}
            </div>
          </div>
          
          {/* Batch info */}
          {batchCount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1">
                <Box className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Batches:</span>
                <span className="font-medium">{batchCount}</span>
              </div>
              {margin !== null && (
                <div className={`flex items-center gap-1 ${
                  margin < 15 ? 'text-destructive' : 
                  margin < 25 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  <Percent className="h-3.5 w-3.5" />
                  <span className="font-medium">{margin}%</span>
                </div>
              )}
            </div>
          )}

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
                  <p className="text-muted-foreground mt-1">{item.description}</p>
                </div>
              )}

              {/* Cost information */}
              {batchCount > 0 && avgCost > 0 && (
                <div className="border-t pt-2">
                  <h4 className="text-sm font-medium mb-2">Cost & Margin</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col p-2 rounded-md border">
                      <span className="text-xs text-muted-foreground">Avg. Cost Price:</span>
                      <div className="flex items-center mt-1">
                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground mr-1" />
                        <span className="font-medium">OMR {avgCost.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col p-2 rounded-md border">
                      <span className="text-xs text-muted-foreground">Profit Margin:</span>
                      <div className={`flex items-center mt-1 ${
                        margin < 15 ? 'text-destructive' : 
                        margin < 25 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        <Percent className="h-3.5 w-3.5 mr-1" />
                        <span className="font-medium">{margin}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {item.isOil && item.volumes && item.volumes.length > 0 && (
                <div className="space-y-2">
                  <span className="text-sm font-medium">Available Volumes:</span>
                  <div className="grid grid-cols-2 gap-2">
                    {item.volumes.map((volume, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-md border text-sm"
                      >
                        <span>{volume.size}</span>
                        <span className="font-medium">OMR {volume.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Batches summary */}
              {batchCount > 0 && (
                <div className="border-t pt-2">
                  <h4 className="text-sm font-medium mb-2">Batch Summary</h4>
                  <div className="space-y-2">
                    {item.batches.slice(0, 3).map((batch, index) => (
                      <div key={batch.id} className="flex justify-between items-center p-2 rounded-md border text-sm">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">Purchase: {batch.purchaseDate}</span>
                          <span>Qty: {batch.quantity}</span>
                          <span className="text-xs text-muted-foreground">{getBatchFifoPosition(index, item.batches.length)}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground">Cost:</span>
                          <div className="font-medium">OMR {batch.costPrice.toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                    {batchCount > 3 && (
                      <Button 
                        variant="ghost" 
                        className="w-full text-xs h-7" 
                        onClick={() => onEdit(item)}
                      >
                        View all {batchCount} batches
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {item.isOil && item.bottleStates && (
                <div className="mt-2 border-t pt-2">
                  <h4 className="text-sm font-medium mb-1">Bottle Inventory</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between p-2 rounded-md bg-green-50 border border-green-200">
                      <span className="text-sm text-green-800 flex items-center gap-1">
                        <OpenBottleIcon className="h-3 w-3" />
                        Open Bottles:
                      </span>
                      <span className="font-medium text-green-800">{item.bottleStates.open}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-md bg-red-100 border border-red-300">
                      <span className="text-sm font-medium text-red-900 flex items-center gap-1">
                        <ClosedBottleIcon className="h-3 w-3" />
                        Closed Bottles:
                      </span>
                      <span className="font-bold text-red-900">{item.bottleStates.closed}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
})
MobileItemCard.displayName = 'MobileItemCard'

// Memoize the table row component
const TableRow = memo(({ 
  item, 
  isSelected, 
  onToggle,
  onEdit,
  onDelete,
  onDuplicate 
}: {
  item: Item
  isSelected: boolean
  onToggle: (id: string) => void
  onEdit: (item: Item) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}) => {
  const [imageError, setImageError] = useState(false)
  const { calculateAverageCost } = useItems()
  
  // Calculate profit margin
  const calculateMargin = useCallback(() => {
    if (!item.batches || item.batches.length === 0 || item.price <= 0) return null;
    
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
          <Checkbox checked={isSelected} onCheckedChange={() => onToggle(item.id)} />
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
            <div className="text-xs text-muted-foreground">{item.brand || '-'}</div>
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
      <td className="h-12 px-4 text-left align-middle">OMR {item.price.toFixed(2)}</td>
      <td className="h-12 px-4 text-left align-middle">
        {item.isOil && item.bottleStates ? (
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              Open: {item.bottleStates.open}
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
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
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1">
              <Box className="h-3.5 w-3.5" />
              Batches: {batchCount}
            </Badge>
            {margin !== null && (
              <Badge variant="outline" className={`gap-1 ${
                margin < 15 ? 'bg-red-50 text-red-700 border-red-200' : 
                margin < 25 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                'bg-green-50 text-green-700 border-green-200'
              }`}>
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
            <DropdownMenuItem onClick={() => onEdit(item)}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(item.id)}>Duplicate</DropdownMenuItem>
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
  )
})
TableRow.displayName = 'TableRow'

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
    isFiltersOpen,
    setIsFiltersOpen,
    
    editingItem,
    setEditingItem,
    
    handleEdit,
    handleAddItem,
    handleDelete,
    handleDuplicate,
    resetFilters
  } = useInventoryData();
  
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [brandModalOpen, setBrandModalOpen] = useState(false)
  const [receiveModalOpen, setReceiveModalOpen] = useState(false)
  const [navigationOpen, setNavigationOpen] = useState(false)
  
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
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
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
        <Button variant="default" size="icon" className="bg-blue-600 hover:bg-blue-700" onClick={openAddItemModal}>
          <Plus className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
        </div>
        <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[350px]">
            <SheetHeader className="text-left mb-5">
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="categoryFilter">Category</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="brandFilter">Brand</Label>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Brands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Brands</SelectItem>
                    <SelectItem value="none">No Brand</SelectItem>
                    {brands && brands.map((brand) => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <ClientOnly>
                  <Checkbox 
                    id="inStock" 
                    checked={showInStock} 
                    onCheckedChange={(checked) => setShowInStock(!!checked)} 
                  />
                </ClientOnly>
                <Label htmlFor="inStock">Show in-stock only</Label>
              </div>
              <div className="flex items-center justify-between mt-6">
                <Button variant="outline" size="sm" onClick={resetFilters}>Reset</Button>
                <Button size="sm" onClick={() => setIsFiltersOpen(false)}>Apply</Button>
              </div>
              <div className="border-t my-4 pt-4">
                <Button variant="outline" size="sm" onClick={() => setCategoryModalOpen(true)} className="w-full">
                  Manage Categories
                </Button>
              </div>
              <div className="mt-2">
                <Button variant="outline" size="sm" onClick={() => setBrandModalOpen(true)} className="w-full">
                  Manage Brands
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
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
      <CategoryModal open={categoryModalOpen} onOpenChange={setCategoryModalOpen} />
      <BrandModal open={brandModalOpen} onOpenChange={setBrandModalOpen} />
    </div>
  )
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
    selectedItems,
    toggleItemSelection,
    toggleAllSelection,
    
    editingItem,
    setEditingItem,
    
    handleEdit,
    handleAddItem,
    handleDelete,
    handleDuplicate
  } = useInventoryData();
  
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [brandModalOpen, setBrandModalOpen] = useState(false)
  
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
  
  const areAllSelected = selectedItems.length === filteredItems.length && filteredItems.length > 0;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-grow max-w-md">
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
        <div className="flex items-center gap-2">
          <ClientOnly>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
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
                {brands && brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
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
          {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'} found
        </div>
        <div className="flex gap-2 items-center ml-6">
          <label htmlFor="showInStock" className="text-sm font-medium">
            Show in-stock only:
          </label>
          <ClientOnly>
            <Checkbox 
              id="showInStock" 
              checked={showInStock} 
              onCheckedChange={(checked) => setShowInStock(!!checked)} 
            />
          </ClientOnly>
        </div>
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
                <th className="h-12 px-4 text-left align-middle font-medium">Item</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Category</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Stock</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Price</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Bottle Status</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Batches</th>
                <th className="h-12 px-4 text-right align-middle font-medium">Actions</th>
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
                  <td colSpan={8} className="h-24 text-center text-muted-foreground">
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
      <CategoryModal open={categoryModalOpen} onOpenChange={setCategoryModalOpen} />
      <BrandModal open={brandModalOpen} onOpenChange={setBrandModalOpen} />
    </div>
  )
}

function ItemsPageContent() {
  const { currentUser } = useUser()
  const { currentBranch } = useBranch()
  const [isMobile, setIsMobile] = useState(false)

  // Check viewport on mount and resize
  const checkViewport = () => {
    setIsMobile(window.innerWidth < 1024)
  }

  useEffect(() => {
    checkViewport()
    window.addEventListener('resize', checkViewport)
    return () => window.removeEventListener('resize', checkViewport)
  }, [])

  if (currentUser?.role === "staff") {
    return <div className="text-center py-8">You don&apos;t have permission to access this page.</div>
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader 
        title="Main Inventory" 
        description={`Manage inventory at ${currentBranch?.name || 'Main (Sanaya)'}`}
      />
      <div className="hidden md:block">
        <DesktopView />
      </div>
      <div className="block md:hidden">
        <MobileView />
      </div>
    </div>
  )
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
  )
}

