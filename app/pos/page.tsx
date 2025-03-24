"use client"

import { useState, useMemo, useCallback, memo, useRef, useEffect } from "react"
import { Layout } from "@/components/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Plus,
  Minus,
  X,
  CreditCard,
  Banknote,
  ShoppingCart,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ImageIcon,
  Check,
  Printer,
  Smartphone,
  Ticket,
  RotateCcw
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogContentWithoutClose
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { OpenBottleIcon, ClosedBottleIcon } from "@/components/ui/bottle-icons"

// Import the RefundDialog component
import { RefundDialog } from "./components/refund-dialog"
import { ImportDialog } from "./components/import-dialog"

interface OilProduct {
  id: number
  brand: string
  name: string
  basePrice: number
  type: string
  image?: string
  volumes: {
    size: string
    price: number
  }[]
}

interface Product {
  id: number
  name: string
  price: number
  category: 'Filters' | 'Parts' | 'Additives'
  brand?: string
  type?: string
}

interface CartItem extends Omit<Product, 'category'> {
  quantity: number
  details?: string
  uniqueId: string
}

interface SelectedVolume {
  size: string
  quantity: number
  price: number
  bottleType?: 'open' | 'closed'
}

// Updated oil products data structure
const oilProducts: OilProduct[] = [
  {
    id: 101,
    brand: "Toyota",
    name: "0W-20",
    basePrice: 39.99,
    type: "0W-20",
    image: "/oils/toyota-0w20.jpg",
    volumes: [
      { size: "5L", price: 39.99 },
      { size: "4L", price: 34.99 },
      { size: "1L", price: 11.99 },
      { size: "500ml", price: 6.99 },
      { size: "250ml", price: 3.99 },
    ]
  },
  {
    id: 102,
    brand: "Toyota",
    name: "5W-30",
    basePrice: 39.99,
    type: "5W-30",
    image: "/oils/toyota-5w30.jpg",
    volumes: [
      { size: "5L", price: 39.99 },
      { size: "4L", price: 34.99 },
      { size: "1L", price: 11.99 },
      { size: "500ml", price: 6.99 },
      { size: "250ml", price: 3.99 },
    ]
  },
  {
    id: 103,
    brand: "Toyota",
    name: "10W-30",
    basePrice: 39.99,
    type: "10W-30",
    image: "/oils/toyota-10w30.jpg",
    volumes: [
      { size: "5L", price: 39.99 },
      { size: "4L", price: 34.99 },
      { size: "1L", price: 11.99 },
      { size: "500ml", price: 6.99 },
      { size: "250ml", price: 3.99 },
    ]
  },
  {
    id: 201,
    brand: "Shell",
    name: "0W-20",
    basePrice: 45.99,
    type: "0W-20",
    image: "/oils/shell-0w20.jpg",
    volumes: [
      { size: "5L", price: 45.99 },
      { size: "4L", price: 39.99 },
      { size: "1L", price: 13.99 },
      { size: "500ml", price: 7.99 },
      { size: "250ml", price: 4.99 },
    ]
  },
  {
    id: 202,
    brand: "Shell",
    name: "5W-30",
    basePrice: 45.99,
    type: "5W-30",
    image: "/oils/shell-5w30.jpg",
    volumes: [
      { size: "5L", price: 45.99 },
      { size: "4L", price: 39.99 },
      { size: "1L", price: 13.99 },
      { size: "500ml", price: 7.99 },
      { size: "250ml", price: 4.99 },
    ]
  },
  {
    id: 203,
    brand: "Shell",
    name: "10W-40",
    basePrice: 35.99,
    type: "10W-40",
    image: "/oils/shell-10w40.jpg",
    volumes: [
      { size: "5L", price: 35.99 },
      { size: "4L", price: 31.99 },
      { size: "1L", price: 11.99 },
      { size: "500ml", price: 6.99 },
      { size: "250ml", price: 3.99 },
    ]
  },
  {
    id: 301,
    brand: "Lexus",
    name: "0W-20",
    basePrice: 49.99,
    type: "0W-20",
    image: "/oils/lexus-0w20.jpg",
    volumes: [
      { size: "5L", price: 49.99 },
      { size: "4L", price: 43.99 },
      { size: "1L", price: 14.99 },
      { size: "500ml", price: 8.99 },
      { size: "250ml", price: 5.99 },
    ]
  },
  {
    id: 302,
    brand: "Lexus",
    name: "5W-30",
    basePrice: 49.99,
    type: "5W-30",
    image: "/oils/lexus-5w30.jpg",
    volumes: [
      { size: "5L", price: 49.99 },
      { size: "4L", price: 43.99 },
      { size: "1L", price: 14.99 },
      { size: "500ml", price: 8.99 },
      { size: "250ml", price: 5.99 },
    ]
  }
]

const products: Product[] = [
  // Toyota Filters
  { id: 3, name: "Oil Filter - Standard", price: 12.99, category: "Filters", brand: "Toyota", type: "Oil Filter" },
  { id: 4, name: "Air Filter - Standard", price: 15.99, category: "Filters", brand: "Toyota", type: "Air Filter" },
  { id: 9, name: "Cabin Filter - Standard", price: 11.99, category: "Filters", brand: "Toyota", type: "Cabin Filter" },
  { id: 10, name: "Oil Filter - Premium", price: 19.99, category: "Filters", brand: "Toyota", type: "Oil Filter" },
  { id: 11, name: "Air Filter - Premium", price: 24.99, category: "Filters", brand: "Toyota", type: "Air Filter" },
  { id: 12, name: "Cabin Filter - Premium", price: 21.99, category: "Filters", brand: "Toyota", type: "Cabin Filter" },

  // Honda Filters
  { id: 31, name: "Oil Filter - Basic", price: 11.99, category: "Filters", brand: "Honda", type: "Oil Filter" },
  { id: 32, name: "Air Filter - Basic", price: 14.99, category: "Filters", brand: "Honda", type: "Air Filter" },
  { id: 35, name: "Cabin Filter - Basic", price: 12.99, category: "Filters", brand: "Honda", type: "Cabin Filter" },
  { id: 37, name: "Oil Filter - Premium", price: 18.99, category: "Filters", brand: "Honda", type: "Oil Filter" },
  { id: 38, name: "Air Filter - Premium", price: 22.99, category: "Filters", brand: "Honda", type: "Air Filter" },
  { id: 39, name: "Cabin Filter - Premium", price: 20.99, category: "Filters", brand: "Honda", type: "Cabin Filter" },

  // Nissan Filters
  { id: 33, name: "Oil Filter - Standard", price: 13.99, category: "Filters", brand: "Nissan", type: "Oil Filter" },
  { id: 34, name: "Air Filter - Standard", price: 16.99, category: "Filters", brand: "Nissan", type: "Air Filter" },
  { id: 36, name: "Cabin Filter - Standard", price: 13.99, category: "Filters", brand: "Nissan", type: "Cabin Filter" },
  { id: 40, name: "Oil Filter - Premium", price: 20.99, category: "Filters", brand: "Nissan", type: "Oil Filter" },
  { id: 41, name: "Air Filter - Premium", price: 25.99, category: "Filters", brand: "Nissan", type: "Air Filter" },
  { id: 42, name: "Cabin Filter - Premium", price: 22.99, category: "Filters", brand: "Nissan", type: "Cabin Filter" },

  // Other Products
  { id: 5, name: "Brake Pads", price: 45.99, category: "Parts" },
  { id: 6, name: "Spark Plugs", price: 8.99, category: "Parts" },
  { id: 7, name: "Fuel System Cleaner", price: 14.99, category: "Additives" },
  { id: 8, name: "Oil Treatment", price: 11.99, category: "Additives" },
]

// Memoize the cart item component
const CartItem = memo(({ 
  item, 
  updateQuantity, 
  removeFromCart 
}: { 
  item: CartItem
  updateQuantity: (id: number, quantity: number) => void
  removeFromCart: (id: number) => void 
}) => (
  <div className="grid grid-cols-[auto_1fr_auto] gap-3 py-4 first:pt-0 items-start border-b last:border-b-0">
    {/* Quantity controls */}
    <div className="flex flex-col items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => updateQuantity(item.id, item.quantity + 1)}
      >
        <Plus className="h-4 w-4" />
      </Button>
      <span className="w-6 text-center font-medium text-[clamp(0.875rem,2vw,1rem)]">{item.quantity}</span>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
      >
        <Minus className="h-4 w-4" />
      </Button>
    </div>
    
    {/* Item details */}
    <div className="min-w-0 px-1">
      <div className="font-medium text-[clamp(0.875rem,2vw,1rem)] mb-1">{item.name}</div>
      {item.bottleType && (
        <div className="flex items-center gap-1 mb-1">
          {item.bottleType === 'closed' ? (
            <ClosedBottleIcon className="h-4 w-4 text-primary" />
          ) : (
            <OpenBottleIcon className="h-4 w-4 text-primary" />
          )}
          <span className="text-xs text-muted-foreground capitalize">{item.bottleType} bottle</span>
        </div>
      )}
      <div className="text-[clamp(0.75rem,1.5vw,0.875rem)] text-muted-foreground">
        OMR {item.price.toFixed(2)} each
      </div>
      <div className="font-medium text-[clamp(0.875rem,2vw,1rem)] mt-1">
        OMR {(item.price * item.quantity).toFixed(2)}
      </div>
    </div>
    
    {/* Delete button */}
    <Button 
      variant="ghost" 
      size="icon" 
      className="h-8 w-8 flex-shrink-0 self-start" 
      onClick={() => removeFromCart(item.id)}
      aria-label="Remove item"
    >
      <X className="h-4 w-4" />
    </Button>
  </div>
))
CartItem.displayName = 'CartItem'

// Memoize the product button component
const ProductButton = memo(({ product, addToCart }: { product: Product, addToCart: (product: Product) => void }) => (
  <Button
    key={product.id}
    variant="outline"
    className="h-auto py-6 flex flex-col items-center justify-center text-center p-4 hover:shadow-md transition-all"
    onClick={() => addToCart(product)}
  >
    <div className="font-semibold text-base mb-2">{product.name}</div>
    <div className="text-lg font-medium text-primary">OMR {product.price.toFixed(2)}</div>
  </Button>
))
ProductButton.displayName = 'ProductButton'

export default function POSPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeCategory, setActiveCategory] = useState<string>("Oil")
  const [searchQuery, setSearchQuery] = useState("")
  const [showCart, setShowCart] = useState(false)
  const [showClearCartDialog, setShowClearCartDialog] = useState(false)
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null)
  const [selectedOil, setSelectedOil] = useState<OilProduct | null>(null)
  const [isVolumeModalOpen, setIsVolumeModalOpen] = useState(false)
  const [selectedVolumes, setSelectedVolumes] = useState<SelectedVolume[]>([])
  const [selectedFilterBrand, setSelectedFilterBrand] = useState<string | null>(null)
  const [selectedFilterType, setSelectedFilterType] = useState<string | null>(null)
  const [isFilterBrandModalOpen, setIsFilterBrandModalOpen] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<Array<{ id: number; name: string; price: number; quantity: number }>>([])
  const [filterImageError, setFilterImageError] = useState(false)
  const [oilImageError, setOilImageError] = useState(false)
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'card' | 'cash' | 'mobile' | 'voucher' | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showOtherOptions, setShowOtherOptions] = useState(false)
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)

  // Add a state to track if bottle type dialog is open
  const [showBottleTypeDialog, setShowBottleTypeDialog] = useState(false)
  const [currentBottleVolumeSize, setCurrentBottleVolumeSize] = useState<string | null>(null)

  // Memoize handlers
  const removeFromCart = useCallback((productId: number) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: number, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(productId)
    } else {
      setCart((prevCart) => prevCart.map((item) => 
        item.id === productId ? { ...item, quantity: newQuantity } : item
      ))
    }
  }, [removeFromCart])

  const addToCart = useCallback((product: { id: number; name: string; price: number }, details?: string, quantity: number = 1) => {
    const uniqueId = `${product.id}-${details || ''}`
    setCart((prevCart) => {
      const existingItem = prevCart.find(
        (item) => item.uniqueId === uniqueId
      )
      if (existingItem) {
        return prevCart.map((item) =>
          item.uniqueId === uniqueId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      
      // Find the original product to get the brand if it exists
      const originalProduct = products.find(p => p.id === product.id) || 
                             oilProducts.find(p => p.id === product.id)
      
      const brand = originalProduct && 'brand' in originalProduct ? originalProduct.brand : undefined
      const fullName = brand ? `${brand} ${product.name}` : product.name
      
      return [...prevCart, { 
        ...product, 
        name: fullName,
        quantity, 
        details, 
        uniqueId 
      }]
    })
  }, [])

  const handleOilSelect = useCallback((oil: OilProduct) => {
    setSelectedOil(oil)
    setSelectedVolumes([])
    setIsVolumeModalOpen(true)
  }, [])

  // Function to handle volume selection with bottle type prompt for smaller volumes
  const handleVolumeClick = (volume: { size: string; price: number }) => {
    // For 4L and 5L, add directly without bottle type
    if (volume.size === '4L' || volume.size === '5L') {
      setSelectedVolumes(prev => {
        const existing = prev.find(v => v.size === volume.size)
        if (existing) {
          return prev.map(v =>
            v.size === volume.size
              ? { ...v, quantity: v.quantity + 1 }
              : v
          )
        }
        return [...prev, { ...volume, quantity: 1 }]
      })
      return
    }
    
    // For other volumes, show the bottle type dialog
    setCurrentBottleVolumeSize(volume.size)
    setShowBottleTypeDialog(true)
  }
  
  // Function to add volume with selected bottle type
  const addVolumeWithBottleType = (size: string, bottleType: 'open' | 'closed') => {
    const volumeDetails = selectedOil?.volumes.find(v => v.size === size)
    if (volumeDetails) {
      setSelectedVolumes(prev => {
        const existing = prev.find(v => v.size === size && v.bottleType === bottleType)
        if (existing) {
          return prev.map(v =>
            v.size === size && v.bottleType === bottleType
              ? { ...v, quantity: v.quantity + 1 }
              : v
          )
        }
        return [...prev, { ...volumeDetails, quantity: 1, bottleType }]
      })
    }
    setShowBottleTypeDialog(false)
    setCurrentBottleVolumeSize(null)
  }

  const handleQuantityChange = (size: string, change: number) => {
    setSelectedVolumes(prev => {
      const updated = prev.map(v =>
        v.size === size
          ? { ...v, quantity: Math.max(0, v.quantity + change) }
          : v
      ).filter(v => v.quantity > 0)
      return updated
    })
  }

  const handleAddSelectedToCart = () => {
    selectedVolumes.forEach(volume => {
      if (selectedOil) {
        const details = volume.size + (volume.bottleType ? ` (${volume.bottleType} bottle)` : '')
        addToCart(
          {
            id: selectedOil.id,
            name: selectedOil.name,
            price: volume.price,
          },
          details,
          volume.quantity
        )
      }
    })
    setIsVolumeModalOpen(false)
    setSelectedOil(null)
    setSelectedVolumes([])
  }

  const handleNextItem = () => {
    // Add current selection to cart
    handleAddSelectedToCart()

    // Navigate to Filters section and close modal
    setActiveCategory("Filters")
    setIsVolumeModalOpen(false)
    setSelectedOil(null)
    setSelectedVolumes([])
    setSearchQuery("") // Clear search when changing categories
  }

  const oilBrands = Array.from(new Set(oilProducts.map(oil => oil.brand)))

  const filterBrands = Array.from(
    new Set(products.filter(p => p.category === "Filters").map(p => p.brand!))
  )

  const filterTypes = Array.from(
    new Set(products.filter(p => p.category === "Filters").map(p => p.type!))
  )

  const getFiltersByType = (type: string) =>
    products.filter(product =>
      product.category === "Filters" &&
      product.type === type
    )

  // Memoize filtered data
  const filteredOilBrands = useMemo(() => 
    oilBrands.filter(brand => 
      brand.toLowerCase().includes(searchQuery.toLowerCase())
    ), [searchQuery, oilBrands]
  )

  const filteredProducts = useMemo(() => 
    activeCategory === "Oil"
      ? []
      : products.filter((product) => {
          const matchesCategory = product.category === activeCategory
          const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
          return matchesCategory && matchesSearch
        }), [activeCategory, searchQuery]
  )

  const total = useMemo(() => 
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  )

  const handleFilterClick = (filter: Product) => {
    setSelectedFilters(prev => {
      const existing = prev.find(f => f.id === filter.id)
      if (existing) {
        return prev.map(f =>
          f.id === filter.id
            ? { ...f, quantity: f.quantity + 1 }
            : f
        )
      }
      return [...prev, { ...filter, quantity: 1 }]
    })
  }

  const handleFilterQuantityChange = (filterId: number, change: number) => {
    setSelectedFilters(prev => {
      const updated = prev.map(f =>
        f.id === filterId
          ? { ...f, quantity: Math.max(0, f.quantity + change) }
          : f
      ).filter(f => f.quantity > 0)
      return updated
    })
  }

  const handleAddSelectedFiltersToCart = () => {
    selectedFilters.forEach(filter => {
      addToCart(
        {
          id: filter.id,
          name: filter.name,
          price: filter.price,
        },
        undefined,
        filter.quantity
      )
    })
    setIsFilterBrandModalOpen(false)
    setSelectedFilters([])
    setSelectedFilterType(null)
  }

  const handleNextFilterItem = () => {
    handleAddSelectedFiltersToCart()
    setActiveCategory("Parts")
    setSearchQuery("")
  }

  const clearCart = () => {
    setCart([])
    setShowClearCartDialog(false)
  }

  const handleCheckout = () => {
    setIsCheckoutModalOpen(true)
  }

  const handlePaymentComplete = () => {
    setShowSuccess(true)
  }

  const handleImportCustomers = (importedCustomers: any[]) => {
    // In a real implementation, this would add the imported customers to the database
    console.log('Imported customers:', importedCustomers)
    setIsImportDialogOpen(false)
  }

  // Function to toggle between open and closed bottle types
  const toggleBottleType = (size: string) => {
    setSelectedVolumes(prev => {
      return prev.map(v =>
        v.size === size
          ? { 
              ...v, 
              bottleType: v.bottleType === 'open' ? 'closed' : 'open' 
            }
          : v
      )
    })
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-5rem)] flex flex-col pb-4" suppressHydrationWarning>
        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
          {/* Product Grid */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <Card className="flex-1 overflow-hidden flex flex-col h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-6 flex-shrink-0">
                <CardTitle className="text-xl sm:text-2xl">Products</CardTitle>
                <div className="flex gap-2 items-center">
                  <Button
                    variant="outline"
                    size="default"
                    className="h-10 px-4 flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800"
                    onClick={() => setIsRefundDialogOpen(true)}
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="font-medium">Refund</span>
                  </Button>
                  
                  <Button variant="outline" size="icon" className="lg:hidden h-10 w-10 relative" onClick={() => setShowCart(true)}>
                    <ShoppingCart className="h-5 w-5" />
                    {cart.length > 0 && (
                      <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center">
                        {cart.length}
                      </span>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden flex flex-col p-6 min-h-0">
                <Tabs value={activeCategory} className="flex-1 flex flex-col min-h-0" onValueChange={setActiveCategory}>
                  <div className="space-y-6 flex-shrink-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={`Search in ${activeCategory}...`}
                        className="pl-9 h-10 text-base"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        suppressHydrationWarning
                      />
                    </div>
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1 gap-1">
                      <TabsTrigger value="Oil">Oil</TabsTrigger>
                      <TabsTrigger value="Filters">Filters</TabsTrigger>
                      <TabsTrigger value="Parts">Parts</TabsTrigger>
                      <TabsTrigger value="Additives">Additives</TabsTrigger>
                    </TabsList>
                  </div>
                  <ScrollArea className="flex-1 mt-6 -mx-2 px-2">
                    <div className="grid grid-cols-1 gap-4">
                      {activeCategory === "Oil" ? (
                        // Show oil brands with dropdown
                        filteredOilBrands.map((brand) => (
                          <div key={brand} className="border rounded-lg overflow-hidden">
                            <Button
                              variant="ghost"
                              className="w-full p-4 flex items-center justify-between hover:bg-accent"
                              onClick={() => setExpandedBrand(expandedBrand === brand ? null : brand)}
                            >
                              <span className="font-semibold text-lg">{brand}</span>
                              {expandedBrand === brand ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </Button>
                            {expandedBrand === brand && (
                              <div className="p-4 bg-muted/50 space-y-2">
                                {oilProducts.filter(oil => oil.brand === brand).map((oil) => (
                                  <Button
                                    key={oil.id}
                                    variant="outline"
                                    className="w-full justify-between py-3 px-4"
                                    onClick={() => handleOilSelect(oil)}
                                  >
                                    <span>{oil.type}</span>
                                    <span className="text-primary">OMR {oil.basePrice.toFixed(2)}</span>
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : activeCategory === "Filters" ? (
                        // Show filter types with dropdown
                        <div className="grid grid-cols-1 gap-4">
                          {filterTypes
                            .filter(type => type.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((type) => (
                              <div key={type} className="border rounded-lg overflow-hidden">
                                <Button
                                  variant="ghost"
                                  className="w-full p-4 flex items-center justify-between hover:bg-accent"
                                  onClick={() => setSelectedFilterType(selectedFilterType === type ? null : type)}
                                >
                                  <span className="font-semibold text-lg">{type}</span>
                                  {selectedFilterType === type ? (
                                    <ChevronUp className="h-5 w-5" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5" />
                                  )}
                                </Button>
                                {selectedFilterType === type && (
                                  <div className="p-4 bg-muted/50 space-y-2">
                                    {filterBrands.map((brand) => (
                                      <Button
                                        key={brand}
                                        variant="outline"
                                        className="w-full justify-between py-3 px-4"
                                        onClick={() => {
                                          setSelectedFilterBrand(brand)
                                          setSelectedFilters([])
                                          setIsFilterBrandModalOpen(true)
                                        }}
                                      >
                                        <span>{brand}</span>
                                      </Button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      ) : (
                        // Show other category products
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                          {filteredProducts.map((product) => (
                            <ProductButton
                              key={product.id}
                              product={product}
                              addToCart={addToCart}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Cart - Desktop and Tablet */}
          <div className="w-full lg:w-[400px] hidden lg:flex flex-col min-h-0">
            <Card className="flex-1 flex flex-col h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-6 flex-shrink-0">
                <CardTitle className="text-xl">Cart</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[clamp(0.875rem,2vw,1rem)] text-muted-foreground hover:text-destructive"
                  onClick={() => setShowClearCartDialog(true)}
                  disabled={cart.length === 0}
                >
                  Clear Cart
                </Button>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-6 min-h-0">
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                  <ScrollArea className="flex-1 -mx-4 px-4 h-[calc(100%-8rem)]">
                    <div className="space-y-3 pb-2">
                      {cart.map((item) => (
                        <CartItem
                          key={item.uniqueId}
                          item={item}
                          updateQuantity={updateQuantity}
                          removeFromCart={removeFromCart}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="pt-6 mt-auto border-t">
                    <div className="flex justify-between text-[clamp(1rem,2.5vw,1.125rem)] font-semibold mb-4">
                      <span>Total</span>
                      <span>OMR {total.toFixed(2)}</span>
                    </div>
                    
                    <Button 
                      className="w-full h-[clamp(2.5rem,6vw,2.75rem)] text-[clamp(0.875rem,2vw,1rem)]" 
                      disabled={cart.length === 0}
                      onClick={handleCheckout}
                    >
                      Checkout
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Cart - Mobile */}
          <div
            className={cn(
              "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:hidden transition-all duration-300",
              showCart ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            <div
              className={cn(
                "fixed right-0 top-0 h-full w-full sm:w-[400px] bg-background shadow-lg transition-transform duration-300 ease-out",
                showCart ? "translate-x-0" : "translate-x-full"
              )}
            >
              <Card className="h-full flex flex-col border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4">
                  <CardTitle className="text-[clamp(1.125rem,3vw,1.25rem)]">Cart</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[clamp(0.875rem,2vw,1rem)] text-muted-foreground hover:text-destructive"
                      onClick={() => setShowClearCartDialog(true)}
                      disabled={cart.length === 0}
                    >
                      Clear Cart
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowCart(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
                  <ScrollArea className="flex-1 -mx-4 px-4 overflow-y-auto">
                    <div className="space-y-3 pb-4">
                      {cart.map((item) => (
                        <CartItem
                          key={item.uniqueId}
                          item={item}
                          updateQuantity={updateQuantity}
                          removeFromCart={removeFromCart}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="mt-2 space-y-3 border-t pt-4 sticky bottom-0 bg-background w-full">
                    <div className="flex justify-between text-[clamp(1rem,2.5vw,1.125rem)] font-semibold">
                      <span>Total</span>
                      <span>OMR {total.toFixed(2)}</span>
                    </div>
                    
                    <Button 
                      className="w-full h-[clamp(2.5rem,6vw,2.75rem)] text-[clamp(0.875rem,2vw,1rem)]" 
                      disabled={cart.length === 0}
                      onClick={handleCheckout}
                    >
                      Checkout
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Volume Selection Modal */}
          <Dialog open={isVolumeModalOpen} onOpenChange={setIsVolumeModalOpen}>
            <DialogContent className="w-[90%] max-w-[500px] p-4 sm:p-6 rounded-lg">
              <DialogHeader className="pb-3 sm:pb-4">
                <DialogTitle className="text-base sm:text-xl font-semibold">
                  {selectedOil?.brand} - {selectedOil?.type}
                </DialogTitle>
              </DialogHeader>

              <div className="flex justify-center mb-4 sm:mb-6">
                <div className="relative w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] border-2 border-border rounded-lg overflow-hidden bg-muted">
                  {!oilImageError && selectedOil?.image ? (
                    <Image
                      src={selectedOil.image}
                      alt={`${selectedOil.brand} ${selectedOil.type}`}
                      className="object-contain p-2"
                      fill
                      sizes="(max-width: 768px) 120px, 160px"
                      onError={() => setOilImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Volume buttons grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {selectedOil?.volumes.map((volume) => (
                    <Button
                      key={`volume-button-${volume.size}`}
                      variant="outline"
                      className="h-auto py-2 sm:py-3 px-2 sm:px-4 flex flex-col items-center gap-1"
                      onClick={() => handleVolumeClick(volume)}
                    >
                      <div className="text-sm sm:text-base font-medium">{volume.size}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">OMR {volume.price.toFixed(2)}</div>
                    </Button>
                  ))}
                </div>

                {/* Selected volumes list */}
                {selectedVolumes.length > 0 && (
                  <div className="border rounded-lg">
                    <div className="h-[180px] sm:h-[220px] overflow-y-auto scrollbar-none">
                      <div className="px-2 sm:px-3 py-2">
                        {selectedVolumes.map((volume, index) => (
                          <div
                            key={`${volume.size}-${volume.bottleType || 'default'}`}
                            className={cn(
                              "flex flex-col py-1.5",
                              index === selectedVolumes.length - 1 && "mb-2 sm:mb-4"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 sm:gap-3">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 sm:h-9 sm:w-9 shrink-0"
                                  onClick={() => handleQuantityChange(volume.size, -1)}
                                >
                                  <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <span className="w-5 sm:w-6 text-center text-sm sm:text-base">{volume.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-7 w-7 sm:h-9 sm:w-9 shrink-0"
                                  onClick={() => handleQuantityChange(volume.size, 1)}
                                >
                                  <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 px-2 sm:px-3">
                                <span className="font-medium text-sm sm:text-base">{volume.size}</span>
                                {volume.bottleType && (
                                  <div className="flex items-center">
                                    {volume.bottleType === 'closed' ? (
                                      <ClosedBottleIcon className="h-4 w-4 mr-1 text-primary" />
                                    ) : (
                                      <OpenBottleIcon className="h-4 w-4 mr-1 text-primary" />
                                    )}
                                    <span className="text-xs text-muted-foreground capitalize">{volume.bottleType} bottle</span>
                                  </div>
                                )}
                                <span className="font-medium text-sm sm:text-base whitespace-nowrap">OMR {(volume.price * volume.quantity).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between gap-2 sm:gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="px-2 sm:px-6 text-sm sm:text-base"
                    onClick={() => {
                      setIsVolumeModalOpen(false)
                      setSelectedVolumes([])
                    }}
                  >
                    Cancel
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      className="px-2 sm:px-6 text-sm sm:text-base"
                      onClick={handleAddSelectedToCart}
                      disabled={selectedVolumes.length === 0}
                    >
                      Add to Cart
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 sm:h-10 sm:w-10"
                      onClick={handleNextItem}
                      disabled={selectedVolumes.length === 0}
                    >
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Filter Selection Modal */}
          <Dialog
            open={isFilterBrandModalOpen}
            onOpenChange={(open) => {
              setIsFilterBrandModalOpen(open)
              if (!open) {
                setSelectedFilters([])
                setSelectedFilterType(null)
                setFilterImageError(false)
              }
            }}
          >
            <DialogContent className="w-[90%] max-w-[500px] p-4 sm:p-6 rounded-lg">
              <DialogHeader className="pb-3 sm:pb-4">
                <DialogTitle className="text-base sm:text-xl font-semibold">
                  {selectedFilterBrand} - {selectedFilterType}
                </DialogTitle>
              </DialogHeader>

              <div className="flex justify-center mb-4 sm:mb-6">
                <div className="relative w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] border-2 border-border rounded-lg overflow-hidden bg-muted">
                  {!filterImageError ? (
                    <Image
                      src={`/filters/${selectedFilterBrand?.toLowerCase()}-${selectedFilterType?.toLowerCase().replace(' ', '-')}.jpg`}
                      alt={`${selectedFilterBrand} ${selectedFilterType}`}
                      className="object-contain p-2"
                      fill
                      sizes="(max-width: 768px) 120px, 160px"
                      onError={() => setFilterImageError(true)}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Filter options grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                  {getFiltersByType(selectedFilterType || "")
                    .filter(filter => filter.brand === selectedFilterBrand)
                    .map((filter) => (
                      <Button
                        key={filter.id}
                        variant="outline"
                        className="h-auto py-2 sm:py-3 px-2 sm:px-4 flex flex-col items-center gap-1"
                        onClick={() => handleFilterClick(filter)}
                      >
                        <div className="text-sm sm:text-base font-medium text-center line-clamp-2">{filter.name}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">OMR {filter.price.toFixed(2)}</div>
                      </Button>
                    ))}
                </div>

                {/* Selected filters list */}
                {selectedFilters.length > 0 && (
                  <div className="border rounded-lg">
                    <div className="h-[120px] sm:h-[160px] overflow-y-auto scrollbar-none">
                      <div className="px-2 sm:px-3 py-2">
                        {selectedFilters.map((filter, index) => (
                          <div
                            key={filter.id}
                            className={cn(
                              "flex items-center justify-between py-1.5",
                              index === selectedFilters.length - 1 && "mb-2 sm:mb-4"
                            )}
                          >
                            <div className="flex items-center gap-1.5 sm:gap-3">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 sm:h-9 sm:w-9 shrink-0"
                                onClick={() => handleFilterQuantityChange(filter.id, -1)}
                              >
                                <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <span className="w-5 sm:w-6 text-center text-sm sm:text-base">{filter.quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 sm:h-9 sm:w-9 shrink-0"
                                onClick={() => handleFilterQuantityChange(filter.id, 1)}
                              >
                                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0 px-2 sm:px-3">
                              <span className="font-medium text-sm sm:text-base line-clamp-1">{filter.name}</span>
                              <span className="font-medium text-sm sm:text-base whitespace-nowrap">OMR {(filter.price * filter.quantity).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between gap-2 sm:gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="px-2 sm:px-6 text-sm sm:text-base"
                    onClick={() => {
                      setIsFilterBrandModalOpen(false)
                      setSelectedFilters([])
                      setSelectedFilterType(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      className="px-2 sm:px-6 text-sm sm:text-base"
                      onClick={handleAddSelectedFiltersToCart}
                      disabled={selectedFilters.length === 0}
                    >
                      Add to Cart
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 sm:h-10 sm:w-10"
                      onClick={handleNextFilterItem}
                      disabled={selectedFilters.length === 0}
                    >
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Clear Cart Confirmation Dialog */}
          <AlertDialog open={showClearCartDialog} onOpenChange={setShowClearCartDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Cart</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to clear your cart? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={clearCart}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Clear Cart
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Checkout Modal */}
          <Dialog 
            open={isCheckoutModalOpen} 
            onOpenChange={(open) => {
              // Only allow closing via X button when not in success state
              if (!showSuccess) {
                setIsCheckoutModalOpen(open)
                if (!open) {
                  setShowOtherOptions(false) // Reset other options when closing modal
                }
              }
            }}
          >
            {showSuccess ? (
              <DialogContentWithoutClose 
                className="w-[90%] max-w-[500px] p-6 rounded-lg max-h-[90vh] overflow-auto"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
              >
                <DialogHeader className="pb-4 sticky top-0 bg-background z-10">
                  <DialogTitle className="text-xl font-semibold text-center">
                    Payment Complete
                  </DialogTitle>
                </DialogHeader>

                <motion.div
                  key="payment-success"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="flex flex-col items-center justify-center py-2"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className="rounded-full bg-green-100 p-3 mb-4"
                  >
                    <Check className="w-8 h-8 text-green-600" />
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-lg font-medium text-green-600 mb-4"
                  >
                    Payment Successful!
                  </motion.p>
                  
                  {/* Receipt will appear after 1 second */}
                  <div className="w-full">
                    <ReceiptComponent 
                      key={`receipt-${new Date().getTime()}`}
                      cart={cart} 
                      paymentMethod={selectedPaymentMethod} 
                    />
                    
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setShowSuccess(false)
                        setIsCheckoutModalOpen(false)
                        setShowCart(false)
                        setCart([])
                        setSelectedPaymentMethod(null)
                      }}
                      className="w-full mt-4"
                    >
                      Close
                    </Button>
                  </div>
                </motion.div>
              </DialogContentWithoutClose>
            ) : (
              <DialogContent 
                className="w-[90%] max-w-[500px] p-6 rounded-lg max-h-[90vh] overflow-auto"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
              >
                <DialogHeader className="pb-4 sticky top-0 bg-background z-10 pr-8">
                  <DialogTitle className="text-xl font-semibold text-center">
                    Select Payment Method
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  <div className={cn(
                    "grid gap-4",
                    showOtherOptions ? "grid-cols-2" : "grid-cols-3"
                  )}>
                    <Button
                      variant={selectedPaymentMethod === 'card' ? 'default' : 'outline'}
                      className={cn(
                        "h-24 flex flex-col items-center justify-center gap-2",
                        selectedPaymentMethod === 'card' && "ring-2 ring-primary"
                      )}
                      onClick={() => {
                        setSelectedPaymentMethod('card')
                        setShowOtherOptions(false)
                      }}
                    >
                      <CreditCard className="w-6 h-6" />
                      <span>Card</span>
                    </Button>
                    <Button
                      variant={selectedPaymentMethod === 'cash' ? 'default' : 'outline'}
                      className={cn(
                        "h-24 flex flex-col items-center justify-center gap-2",
                        selectedPaymentMethod === 'cash' && "ring-2 ring-primary"
                      )}
                      onClick={() => {
                        setSelectedPaymentMethod('cash')
                        setShowOtherOptions(false)
                      }}
                    >
                      <Banknote className="w-6 h-6" />
                      <span>Cash</span>
                    </Button>
                    <Button
                      variant={showOtherOptions ? 'default' : 'outline'}
                      className={cn(
                        "h-24 flex flex-col items-center justify-center gap-2",
                        (selectedPaymentMethod === 'mobile' || selectedPaymentMethod === 'voucher') && "ring-2 ring-primary"
                      )}
                      onClick={() => {
                        setShowOtherOptions(!showOtherOptions)
                        if (!showOtherOptions) {
                          setSelectedPaymentMethod(null)
                        }
                      }}
                    >
                      <ChevronDown className="w-6 h-6" />
                      <span>Other</span>
                    </Button>
                  </div>

                  {showOtherOptions && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-2 gap-4"
                    >
                      <Button
                        variant={selectedPaymentMethod === 'mobile' ? 'default' : 'outline'}
                        className={cn(
                          "h-24 flex flex-col items-center justify-center gap-2",
                          selectedPaymentMethod === 'mobile' && "ring-2 ring-primary"
                        )}
                        onClick={() => setSelectedPaymentMethod('mobile')}
                      >
                        <Smartphone className="w-6 h-6" />
                        <span>Mobile Pay</span>
                      </Button>
                      <Button
                        variant={selectedPaymentMethod === 'voucher' ? 'default' : 'outline'}
                        className={cn(
                          "h-24 flex flex-col items-center justify-center gap-2",
                          selectedPaymentMethod === 'voucher' && "ring-2 ring-primary"
                        )}
                        onClick={() => setSelectedPaymentMethod('voucher')}
                      >
                        <Ticket className="w-6 h-6" />
                        <span>Voucher</span>
                      </Button>
                    </motion.div>
                  )}

                  <div className="border-t pt-6">
                    <div className="flex justify-between text-lg font-semibold mb-6">
                      <span>Total Amount</span>
                      <span>OMR {total.toFixed(2)}</span>
                    </div>
                    <Button 
                      className="w-full h-12 text-base"
                      disabled={!selectedPaymentMethod}
                      onClick={handlePaymentComplete}
                    >
                      Complete Payment
                    </Button>
                  </div>
                </div>
              </DialogContent>
            )}
          </Dialog>
        </div>
      </div>

      {/* Import Dialog */}
      {isImportDialogOpen && (
        <ImportDialog 
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          onImport={handleImportCustomers}
        />
      )}
      
      {/* Refund Dialog */}
      <RefundDialog
        isOpen={isRefundDialogOpen}
        onClose={() => setIsRefundDialogOpen(false)}
      />
      
      {/* Bottle Type Selection Dialog */}
      <Dialog 
        open={showBottleTypeDialog} 
        onOpenChange={(open) => {
          if (!open) {
            setShowBottleTypeDialog(false)
            setCurrentBottleVolumeSize(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden">
          <DialogHeader className="bg-primary text-primary-foreground px-6 py-4">
            <DialogTitle className="text-center text-xl">Select Bottle Type</DialogTitle>
          </DialogHeader>
          
          <div className="p-6">
            <div className="text-center mb-4">
              <div className="text-muted-foreground">For {currentBottleVolumeSize} volume</div>
              <div className="font-semibold text-lg mt-1">{selectedOil?.brand} {selectedOil?.type}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <Button 
                variant="outline"
                className="h-40 flex flex-col items-center justify-center gap-3 hover:bg-accent rounded-xl border-2 hover:border-primary"
                onClick={() => addVolumeWithBottleType(currentBottleVolumeSize!, 'closed')}
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <ClosedBottleIcon className="h-10 w-10 text-primary" />
                </div>
                <span className="font-medium text-base">Closed Bottle</span>
                <span className="text-xs text-muted-foreground">Factory sealed</span>
              </Button>
              
              <Button 
                variant="outline"
                className="h-40 flex flex-col items-center justify-center gap-3 hover:bg-accent rounded-xl border-2 hover:border-primary"
                onClick={() => addVolumeWithBottleType(currentBottleVolumeSize!, 'open')}
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <OpenBottleIcon className="h-10 w-10 text-primary" />
                </div>
                <span className="font-medium text-base">Open Bottle</span>
                <span className="text-xs text-muted-foreground">For immediate use</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  )
}

// Add this component at the end of the file, before the final export default
const ReceiptComponent = ({ cart, paymentMethod }: { cart: CartItem[], paymentMethod: string }) => {
  const [showReceipt, setShowReceipt] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  
  // Client-side state for random values and dates
  const [receiptData, setReceiptData] = useState({
    receiptNumber: '',
    currentDate: '',
    currentTime: ''
  });
  
  // Generate values only on client-side after component mounts
  useEffect(() => {
    // Generate a random receipt number
    const receiptNumber = `A${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    // Generate current date and time
    const currentDate = new Date().toLocaleDateString('en-GB');
    const currentTime = new Date().toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
    
    setReceiptData({
      receiptNumber,
      currentDate,
      currentTime
    });
    
    // Show receipt after 1 second
    const timer = setTimeout(() => {
      setShowReceipt(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handlePrint = useCallback(() => {
    const content = receiptRef.current;
    if (!content) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print receipt');
      return;
    }
    
    // Calculate subtotal
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // No VAT in this example (0%)
    const vat = 0;
    const total = subtotal;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Courier New', monospace;
              padding: 0;
              margin: 0;
              width: 80mm;
              font-size: 12px;
            }
            .receipt-container {
              padding: 5mm;
            }
            .receipt-header {
              text-align: center;
              margin-bottom: 10px;
            }
            .receipt-header h2 {
              margin: 0;
              font-size: 16px;
            }
            .receipt-header p {
              margin: 2px 0;
              font-size: 12px;
            }
            .receipt-info {
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 5px 0;
              margin-bottom: 10px;
            }
            .receipt-info p {
              margin: 2px 0;
              font-size: 12px;
            }
            .receipt-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
              table-layout: fixed;
            }
            .receipt-table th {
              text-align: left;
              font-size: 12px;
              padding-bottom: 5px;
            }
            .receipt-table td {
              font-size: 12px;
              padding: 2px 0;
              word-wrap: break-word;
              word-break: break-word;
            }
            .receipt-table .qty {
              width: 30px;
            }
            .receipt-table .description {
              width: auto;
              max-width: 180px;
            }
            .receipt-table .price {
              width: 60px;
              text-align: right;
            }
            .receipt-table .amount {
              width: 70px;
              text-align: right;
            }
            .receipt-table .total {
              width: 70px;
              text-align: right;
            }
            .receipt-summary {
              margin-top: 10px;
              border-top: 1px dashed #000;
              padding-top: 5px;
            }
            .receipt-summary table {
              width: 100%;
            }
            .receipt-summary td {
              font-size: 12px;
            }
            .receipt-summary .total-label {
              font-weight: bold;
            }
            .receipt-summary .total-amount {
              text-align: right;
              font-weight: bold;
            }
            .receipt-footer {
              margin-top: 10px;
              text-align: center;
              font-size: 12px;
              border-top: 1px dashed #000;
              padding-top: 5px;
            }
            .receipt-footer p {
              margin: 3px 0;
            }
            .receipt-footer .arabic {
              font-size: 11px;
              direction: rtl;
              margin: 2px 0;
            }
            .barcode {
              margin-top: 10px;
              text-align: center;
            }
            .whatsapp {
              margin-top: 5px;
              text-align: center;
              font-size: 11px;
              font-weight: bold;
            }
            @media print {
              body {
                width: 80mm;
                margin: 0;
                padding: 0;
              }
              @page {
                margin: 0;
                size: 80mm auto;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-header">
              <h2>H Automotives</h2>
              <p>Saham, Sultanate of Oman</p>
              <p>Ph: 92510750 | 26856848</p>
              <p>VATIN: OM1100006980</p>
            </div>
            
            <div class="receipt-info">
              <p>INVOICE</p>
              <p>Date: ${receiptData.currentDate}</p>
              <p>Time: ${receiptData.currentTime}    POS ID: ${receiptData.receiptNumber}</p>
            </div>
            
            <table class="receipt-table">
              <thead>
                <tr>
                  <th class="qty">Qty.</th>
                  <th class="description">Description</th>
                  <th class="price">Price</th>
                  <th class="amount">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${cart.map((item, index) => `
                  <tr>
                    <td class="qty">${item.quantity}</td>
                    <td class="description">${item.name}${item.details ? ` (${item.details})` : ''}</td>
                    <td class="price">${item.price.toFixed(2)}</td>
                    <td class="amount">${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="receipt-summary">
              <table>
                <tr>
                  <td>Total w/o VAT</td>
                  <td class="total-amount">OMR ${subtotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>VAT</td>
                  <td class="total-amount">OMR ${vat.toFixed(2)}</td>
                </tr>
                <tr>
                  <td class="total-label">Total with VAT</td>
                  <td class="total-amount">OMR ${total.toFixed(2)}</td>
                </tr>
              </table>
            </div>
            
            <div class="receipt-footer">
              <p>Number of Items: ${cart.reduce((sum, item) => sum + item.quantity, 0)}</p>
              <p>Payment Method: ${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}</p>
              <p>Keep this Invoice for your Exchanges</p>
              <p class="arabic">احتفظ بهذه الفاتورة للتبديل</p>
              <p>Exchange with in 15 Days</p>
              <p class="arabic">التبديل خلال 15 يوم</p>
              <p>Thank you for shopping with us.</p>
              <p class="arabic">شكراً للتسوق معنا</p>
            </div>
            
            <div class="whatsapp">
              WhatsApp 72702537 for latest offers
            </div>
            
            <div class="barcode">
              <!-- Barcode would go here in a real implementation -->
              ${receiptData.receiptNumber}
            </div>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // On mobile, we need a slight delay before printing
    setTimeout(() => {
      printWindow.print();
      // Close the window after print on desktop, but keep it open on mobile
      // as mobile browsers handle print differently
      if (!(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))) {
        printWindow.close();
      }
    }, 500);
  }, [cart, paymentMethod, receiptData]);
  
  if (!showReceipt || !receiptData.receiptNumber) return null;
  
  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const vat = 0; // No VAT in this example
  const total = subtotal;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  // Format payment method name for display
  const getFormattedPaymentMethod = (method: string) => {
    switch(method) {
      case 'card': return 'Card';
      case 'cash': return 'Cash';
      case 'mobile': return 'Mobile Pay';
      case 'voucher': return 'Voucher';
      default: return method.charAt(0).toUpperCase() + method.slice(1);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="max-h-[40vh] overflow-auto mb-4">
        <div className="bg-white border rounded-lg p-4 w-full max-w-[300px] mx-auto" ref={receiptRef}>
          {/* Receipt Preview */}
          <div className="text-center mb-2">
            <h3 className="font-bold text-lg">H Automotives</h3>
            <p className="text-xs text-gray-500">Saham, Sultanate of Oman</p>
            <p className="text-xs text-gray-500">Ph: 92510750 | 26856848</p>
            <p className="text-xs text-gray-500">VATIN: OM1100006980</p>
          </div>
          
          <div className="border-t border-b border-dashed py-1 mb-3">
            <p className="text-xs font-medium text-center">INVOICE</p>
            <div className="flex justify-between text-xs">
              <span>Date: {receiptData.currentDate}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Time: {receiptData.currentTime}</span>
              <span>POS ID: {receiptData.receiptNumber}</span>
            </div>
          </div>
          
          <div className="text-xs mb-3">
            <div className="grid grid-cols-12 gap-1 font-medium mb-1">
              <span className="col-span-1">Qty.</span>
              <span className="col-span-7">Description</span>
              <span className="col-span-2 text-right">Price</span>
              <span className="col-span-2 text-right">Amount</span>
            </div>
            
            {cart.map((item) => (
              <div key={item.uniqueId} className="grid grid-cols-12 gap-1 mb-1">
                <span className="col-span-1">{item.quantity}</span>
                <span className="col-span-7 break-words">{item.name}{item.details ? ` (${item.details})` : ''}</span>
                <span className="col-span-2 text-right">{item.price.toFixed(2)}</span>
                <span className="col-span-2 text-right">{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-dashed pt-2 mb-3">
            <div className="flex justify-between text-xs">
              <span>Total w/o VAT</span>
              <span>OMR {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>VAT</span>
              <span>OMR {vat.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span>Total with VAT</span>
              <span>OMR {total.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="text-center text-xs text-gray-600 border-t border-dashed pt-2">
            <p>Number of Items: {itemCount}</p>
            <p>Payment Method: {getFormattedPaymentMethod(paymentMethod)}</p>
            <p>Keep this Invoice for your Exchanges</p>
            <p className="text-xs text-right text-gray-600">احتفظ بهذه الفاتورة للتبديل</p>
            <p>Exchange with in 15 Days</p>
            <p className="text-xs text-right text-gray-600">التبديل خلال 15 يوم</p>
            <p>Thank you for shopping with us.</p>
            <p className="text-xs text-right text-gray-600">شكراً للتسوق معنا</p>
            <p className="font-medium mt-2">WhatsApp 72702537 for latest offers</p>
            <p className="font-mono">{receiptData.receiptNumber}</p>
          </div>
        </div>
      </div>
      
      <Button 
        onClick={handlePrint}
        className="w-full flex items-center justify-center gap-2 mt-2"
      >
        <Printer className="h-4 w-4" />
        Print Receipt
      </Button>
    </motion.div>
  );
};

