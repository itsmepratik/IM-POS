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
import { MoreHorizontal, Plus, Search, ChevronRight, Menu, ImageIcon, MoreVertical } from "lucide-react"
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
import { useInventoryData } from "./hooks/useInventoryData"
import { Label } from "@/components/ui/label"

// Add cache configuration
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour
export const fetchCache = 'force-cache'

// Memoize the mobile item card component
const MobileItemCard = memo(({ item, onEdit, onDelete, onDuplicate }: {
  item: Item
  onEdit: (item: Item) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}) => {
  const [showDetails, setShowDetails] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

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
                      <Badge 
                        variant="outline" 
                        className="bg-green-100 text-green-800 border-green-300"
                      >
                        {item.bottleStates.open} Open {item.bottleStates.open === 1 ? 'Bottle' : 'Bottles'}
                      </Badge>
                    )}
                    {item.bottleStates.closed > 0 && (
                      <Badge 
                        variant="outline" 
                        className="bg-red-200 text-red-900 border-red-400 font-medium"
                      >
                        {item.bottleStates.closed} Closed {item.bottleStates.closed === 1 ? 'Bottle' : 'Bottles'}
                      </Badge>
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

              {item.isOil && item.bottleStates && (
                <div className="mt-2 border-t pt-2">
                  <h4 className="text-sm font-medium mb-1">Bottle Inventory</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between p-2 rounded-md bg-green-50 border border-green-200">
                      <span className="text-sm text-green-800">Open Bottles:</span>
                      <span className="font-medium text-green-800">{item.bottleStates.open}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-md bg-red-100 border border-red-300">
                      <span className="text-sm font-medium text-red-900">Closed Bottles:</span>
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
  
  return (
    <tr className={cn("border-b", isSelected && "bg-muted/50")}>
      <td className="h-12 px-4 text-left align-middle">
        <Checkbox checked={isSelected} onCheckedChange={() => onToggle(item.id)} />
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
      <td className="h-12 px-4 text-left align-middle">${item.price.toFixed(2)}</td>
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
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search items..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={handleAddItem}>
          <Plus className="h-4 w-4 mr-1" />
          Add
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
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="lowStock" 
                  checked={showLowStock} 
                  onCheckedChange={(checked) => setShowLowStock(!!checked)} 
                />
                <Label htmlFor="lowStock">Show low stock only</Label>
              </div>
              <div className="flex items-center justify-between mt-6">
                <Button variant="outline" size="sm" onClick={resetFilters}>Reset</Button>
                <Button size="sm" onClick={() => setIsFiltersOpen(false)}>Apply</Button>
              </div>
              <div className="border-t my-4 pt-4">
                <Button variant="outline" size="sm" onClick={() => setIsCategoryModalOpen(true)} className="w-full">
                  Manage Categories
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
            onEdit={handleEdit}
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
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingItem(undefined)
        }}
        item={editingItem}
      />
      <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} />
    </div>
  )
}

function DesktopView() {
  const {
    filteredItems,
    categories,
    
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    showLowStock,
    setShowLowStock,
    selectedItems,
    setSelectedItems,
    
    isModalOpen,
    setIsModalOpen,
    isCategoryModalOpen,
    setIsCategoryModalOpen,
    isFiltersOpen,
    setIsFiltersOpen,
    editingItem,
    setEditingItem,
    
    toggleItem,
    toggleAll,
    handleEdit,
    handleAddItem,
    handleDelete,
    handleDuplicate,
    resetFilters
  } = useInventoryData();
  
  return (
    <div className="space-y-4">
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
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="lowStockDesktop" 
            checked={showLowStock} 
            onCheckedChange={(checked) => setShowLowStock(!!checked)} 
          />
          <Label htmlFor="lowStockDesktop">Show low stock only</Label>
        </div>
        <div className="flex-1 text-right space-x-2">
          <Button variant="outline" onClick={() => setIsCategoryModalOpen(true)}>
            Categories
          </Button>
          <Button onClick={handleAddItem}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>
      </div>
      
      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="h-12 px-4 text-left align-middle font-medium">
                  <Checkbox checked={selectedItems.length === filteredItems.length} onCheckedChange={toggleAll} />
                </th>
                <th className="h-12 px-4 text-left align-middle font-medium">Item</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Category</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Stock</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Price</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Bottle Inventory</th>
                <th className="h-12 w-[40px]"></th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <TableRow
                  key={item.id}
                  item={item}
                  isSelected={selectedItems.includes(item.id)}
                  onToggle={toggleItem}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ItemModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingItem(undefined)
        }}
        item={editingItem}
      />
      <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} />
    </div>
  )
}

function ItemsPageContent() {
  const { currentUser } = useUser()
  const { currentBranch } = useBranch()
  const [isMobile, setIsMobile] = useState(false)

  // Check viewport on mount and resize
  const checkViewport = () => {
    setIsMobile(window.innerWidth < 768)
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
        title="Inventory" 
        description={`Manage inventory at ${currentBranch?.name || 'Main Store'}`}
      />
      {isMobile ? <MobileView /> : <DesktopView />}
    </div>
  )
}

export default function ItemsPage() {
  return (
    <Layout>
      <BranchProvider>
        <ItemsProvider>
          <ItemsPageContent />
        </ItemsProvider>
      </BranchProvider>
    </Layout>
  )
}

