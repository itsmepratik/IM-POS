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
import { MoreHorizontal, Plus, Search, ChevronRight, Menu, ImageIcon, MoreVertical, Store } from "lucide-react"
import { ItemsProvider, useItems, type Item } from "../../inventory/items-context"
import { ItemModal } from "../../inventory/item-modal"
import { toast } from "@/components/ui/use-toast"
import { CategoryModal } from "../../inventory/category-modal"
import { useUser } from "../../user-context"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { PageHeader } from "@/components/page-title"
import { BranchProvider, useBranch, type Branch } from "../../branch-context"

// Add cache configuration
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour
export const fetchCache = 'force-cache'

// Define volume type
interface Volume {
  size: string;
  price: number;
}

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
                    {item.volumes.map((volume: Volume, index: number) => (
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
}) => (
  <tr className="border-b">
    <td className="p-4">
      <Checkbox checked={isSelected} onCheckedChange={() => onToggle(item.id)} />
    </td>
    <td className="p-4">{item.name}</td>
    <td className="p-4">{item.category}</td>
    <td className="p-4">{item.stock}</td>
    <td className="p-4">OMR {item.price.toFixed(2)}</td>
    {item.isOil && (
      <td className="p-4">
        {item.bottleStates && (
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
      </td>
    )}
    {!item.isOil && <td className="p-4"></td>}
    <td className="p-4">
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
    </td>
  </tr>
))
TableRow.displayName = 'TableRow'

function MobileView() {
  const { items, categories, deleteItem, duplicateItem } = useItems()
  const { branches, currentBranch, setCurrentBranch } = useBranch()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showLowStock, setShowLowStock] = useState(false)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [currentItem, setCurrentItem] = useState<Item | null>(null)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  
  const filteredItems = useMemo(() => {
    return items.filter((item: Item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
                           (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
      const matchesStock = !showLowStock || item.stock < 10
      
      return matchesSearch && matchesCategory && matchesStock
    })
  }, [items, searchQuery, selectedCategory, showLowStock])
  
  const handleEditItem = useCallback((item: Item) => {
    setCurrentItem(item)
    setIsItemModalOpen(true)
  }, [])
  
  const handleAddItem = useCallback(() => {
    setCurrentItem(null)
    setIsItemModalOpen(true)
  }, [])
  
  const handleDeleteItem = useCallback((id: string) => {
    deleteItem(id)
    toast({
      title: "Item deleted",
      description: "The item has been deleted successfully.",
    })
  }, [deleteItem])
  
  const handleDuplicateItem = useCallback((id: string) => {
    duplicateItem(id)
    toast({
      title: "Item duplicated",
      description: "The item has been duplicated successfully.",
    })
  }, [duplicateItem])

  const handleManageCategories = useCallback(() => {
    setIsCategoryModalOpen(true)
  }, [])

  const resetFilters = useCallback(() => {
    setSearchQuery("")
    setSelectedCategory("all")
    setShowLowStock(false)
    setIsFiltersOpen(false)
  }, [])
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Branch Inventory</h2>
        <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[350px]">
            <SheetHeader className="text-left mb-5">
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select 
                  value={selectedCategory} 
                  onValueChange={(value) => setSelectedCategory(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category: string) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="lowStock" 
                  checked={showLowStock} 
                  onCheckedChange={(checked) => setShowLowStock(checked as boolean)} 
                />
                <label htmlFor="lowStock" className="text-sm font-medium">
                  Show low stock items only
                </label>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={resetFilters}
              >
                Reset Filters
              </Button>
              <div className="pt-4 border-t">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handleManageCategories}
                >
                  Manage Categories
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <Select 
          value={currentBranch?.id || "main"} 
          onValueChange={(value) => {
            const branch = branches.find((b: Branch) => b.id === value)
            if (branch) setCurrentBranch(branch)
          }}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select branch" />
          </SelectTrigger>
          <SelectContent>
            {branches.map((branch: Branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
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
      </div>
      
      <div className="grid grid-cols-1 gap-4">
        {filteredItems.map((item: Item) => (
          <MobileItemCard
            key={item.id}
            item={item}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
            onDuplicate={handleDuplicateItem}
          />
        ))}
        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No items found. Try adjusting your filters or add a new item.
          </div>
        )}
      </div>
      
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false)
          setCurrentItem(null)
        }}
        item={currentItem as Item | undefined}
      />
      
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
    </div>
  )
}

function DesktopView() {
  const { currentUser } = useUser()
  const { items, categories, deleteItem, duplicateItem } = useItems()
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all-categories")
  const [brandFilter, setBrandFilter] = useState("all-brands")
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)

  const uniqueBrands = useMemo(() => {
    const brands = items
      .map((item: Item) => item.brand)
      .filter((brand): brand is string => !!brand);
    return ["all-brands", ...Array.from(new Set(brands))];
  }, [items]);

  const toggleItem = useCallback((itemId: string) => {
    setSelectedItems((prev) => 
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    )
  }, [])

  const toggleAll = useCallback(() => {
    setSelectedItems((prev) => (prev.length === items.length ? [] : items.map((item: Item) => item.id)))
  }, [items])

  const handleEdit = useCallback((item: Item) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }, [])

  const handleDelete = useCallback((id: string) => {
    deleteItem(id)
    toast({
      title: "Item deleted",
      description: "The item has been successfully deleted.",
    })
  }, [deleteItem])

  const handleDuplicate = useCallback((id: string) => {
    duplicateItem(id)
    toast({
      title: "Item duplicated",
      description: "A copy of the item has been created.",
    })
  }, [duplicateItem])

  const filteredItems = useMemo(() => 
    items.filter(
      (item: Item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (categoryFilter === "all-categories" || item.category === categoryFilter) &&
        (brandFilter === "all-brands" || item.brand === brandFilter)
    ),
    [items, searchTerm, categoryFilter, brandFilter]
  )

  if (currentUser?.role === "staff") {
    return <div className="text-center py-8">You don&apos;t have permission to access this page.</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:flex-1 md:mr-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search items"
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-categories">All categories</SelectItem>
                {categories.map((category: string) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-brands">All brands</SelectItem>
                {uniqueBrands.slice(1).map((brand: string) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="h-10" onClick={() => setIsCategoryModalOpen(true)}>
              Manage Categories
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button className="h-10" onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create item
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
              {filteredItems.map((item: Item) => (
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
      <PageHeader>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage inventory at {currentBranch?.name || 'Main Store'}
          </p>
        </div>
      </PageHeader>
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

