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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all-categories")
  const [brandFilter, setBrandFilter] = useState("all-brands")
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const uniqueBrands = useMemo(() => {
    const brands = items
      .map(item => item.brand)
      .filter((brand): brand is string => !!brand);
    return ["all-brands", ...Array.from(new Set(brands))];
  }, [items]);

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
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (categoryFilter === "all-categories" || item.category === categoryFilter) &&
        (brandFilter === "all-brands" || item.brand === brandFilter)
    ),
    [items, searchTerm, categoryFilter, brandFilter]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>Filters & Categories</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={categoryFilter} onValueChange={(value) => {
                  setCategoryFilter(value);
                  setIsFiltersOpen(false);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-categories">All categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Brand</label>
                <Select value={brandFilter} onValueChange={(value) => {
                  setBrandFilter(value);
                  setIsFiltersOpen(false);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-brands">All brands</SelectItem>
                    {uniqueBrands.slice(1).map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" className="w-full" onClick={() => setIsCategoryModalOpen(true)}>
                Manage Categories
              </Button>
            </div>
          </SheetContent>
        </Sheet>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-6">
          {filteredItems.map((item) => (
            <MobileItemCard
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      </ScrollArea>

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
      .map(item => item.brand)
      .filter((brand): brand is string => !!brand);
    return ["all-brands", ...Array.from(new Set(brands))];
  }, [items]);

  if (currentUser?.role === "staff") {
    return <div className="text-center py-8">You don&apos;t have permission to access this page.</div>
  }

  const toggleItem = useCallback((itemId: string) => {
    setSelectedItems((prev) => 
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    )
  }, [])

  const toggleAll = useCallback(() => {
    setSelectedItems((prev) => (prev.length === items.length ? [] : items.map((item) => item.id)))
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
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (categoryFilter === "all-categories" || item.category === categoryFilter) &&
        (brandFilter === "all-brands" || item.brand === brandFilter)
    ),
    [items, searchTerm, categoryFilter, brandFilter]
  )

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
                {categories.map((category) => (
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
                {uniqueBrands.slice(1).map((brand) => (
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

