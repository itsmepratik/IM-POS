"use client"

import { Card } from "@/components/ui/card"
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useMemo, memo, useCallback } from "react"
import { Layout } from "@/components/layout"
import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Add cache configuration
export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour
export const fetchCache = 'force-cache'

interface SaleItemVariant {
  size: string
  quantity: number
  unitPrice: number
  totalSales: number
}

interface SaleItem {
  name: string
  category: "fluid" | "part" | "service"
  quantity: number
  unitPrice: number
  totalSales: number
  variants?: SaleItemVariant[]
  storeId: string
}

const salesData: SaleItem[] = [
  { 
    name: "Shell Helix Oil",
    category: "fluid",
    quantity: 5,
    unitPrice: 45.00,
    totalSales: 225.00,
    storeId: "store1",
    variants: [
      { size: "5L", quantity: 2, unitPrice: 55.00, totalSales: 110.00 },
      { size: "2L", quantity: 3, unitPrice: 38.50, totalSales: 115.00 }
    ]
  },
  { 
    name: "Castrol Coolant",
    category: "fluid",
    quantity: 8,
    unitPrice: 25.00,
    totalSales: 200.00,
    storeId: "store2",
    variants: [
      { size: "4L", quantity: 3, unitPrice: 32.00, totalSales: 96.00 },
      { size: "1L", quantity: 5, unitPrice: 20.80, totalSales: 104.00 }
    ]
  },
  { 
    name: "Oil Filter",
    category: "part",
    quantity: 15,
    unitPrice: 12.00,
    totalSales: 180.00,
    storeId: "store1"
  },
  { 
    name: "Standard Oil Change",
    category: "service",
    quantity: 20,
    unitPrice: 45.00,
    totalSales: 900.00,
    storeId: "store3"
  },
  { 
    name: "Brake Fluid",
    category: "fluid",
    quantity: 6,
    unitPrice: 15.00,
    totalSales: 90.00,
    storeId: "store2",
    variants: [
      { size: "500ml", quantity: 4, unitPrice: 12.50, totalSales: 50.00 },
      { size: "1L", quantity: 2, unitPrice: 20.00, totalSales: 40.00 }
    ]
  },
]

const stores = [
  { id: "all-stores", name: "All Stores" },
  { id: "store1", name: "Store 1" },
  { id: "store2", name: "Store 2" },
  { id: "store3", name: "Store 3" },
]

// Memoize the mobile item card component
const MobileItemCard = memo(({ 
  item, 
  isExpanded, 
  onToggle 
}: {
  item: SaleItem
  isExpanded: boolean
  onToggle: () => void
}) => {
  return (
    <Card className="overflow-hidden">
      <div 
        className={`p-4 ${item.category === "fluid" ? "cursor-pointer" : ""}`}
        onClick={() => item.category === "fluid" && onToggle()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">{item.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {item.quantity} units at OMR {item.unitPrice.toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <div className="font-semibold">OMR {item.totalSales.toFixed(2)}</div>
            {item.category === "fluid" && (
              <div className="text-blue-500 mt-1">
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            )}
          </div>
        </div>
        
        {item.category === "fluid" && isExpanded && item.variants && (
          <div className="mt-4 border-t pt-4 space-y-3">
            {item.variants.map((variant) => (
              <div key={variant.size} className="flex items-center justify-between text-sm text-gray-600">
                <div>
                  <span className="font-medium">{variant.size}</span>
                  <p className="text-xs mt-0.5">
                    {variant.quantity} units at OMR {variant.unitPrice.toFixed(2)}
                  </p>
                </div>
                <div className="font-medium">
                  OMR {variant.totalSales.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
})
MobileItemCard.displayName = 'MobileItemCard'

// Memoize the desktop view component
const DesktopView = memo(({ 
  salesData, 
  expandedItems, 
  toggleItem 
}: {
  salesData: SaleItem[]
  expandedItems: string[]
  toggleItem: (name: string) => void
}) => {
  const totalSales = useMemo(() => 
    salesData.reduce((sum, item) => sum + item.totalSales, 0), 
    [salesData]
  )

  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-gray-50">
          <tr>
            <th className="px-6 py-3">Item Name</th>
            <th className="px-6 py-3">Store</th>
            <th className="px-6 py-3 text-right">Quantity</th>
            <th className="px-6 py-3 text-right">Unit Price</th>
            <th className="px-6 py-3 text-right">Total Sales</th>
          </tr>
        </thead>
        <tbody>
          {salesData.map((item) => (
            <React.Fragment key={item.name}>
              <tr 
                className={`border-b ${item.category === "fluid" ? "cursor-pointer hover:bg-gray-50" : ""}`}
                onClick={() => item.category === "fluid" && toggleItem(item.name)}
              >
                <td className="px-6 py-4 font-medium">
                  <span className={item.category === "fluid" ? `${expandedItems.includes(item.name) ? "text-primary" : "text-gray-900"} hover:text-primary transition-colors` : ""}>
                    {item.name}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {stores.find(store => store.id === item.storeId)?.name}
                </td>
                <td className="px-6 py-4 text-right">{item.quantity} units</td>
                <td className="px-6 py-4 text-right">OMR {item.unitPrice.toFixed(2)}</td>
                <td className="px-6 py-4 text-right">OMR {item.totalSales.toFixed(2)}</td>
              </tr>
              {item.category === "fluid" && expandedItems.includes(item.name) && item.variants?.map((variant) => (
                <tr key={`${item.name}-${variant.size}`} className="border-b bg-gray-50">
                  <td className="px-6 py-3 pl-12 text-sm text-gray-600">
                    {variant.size}
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600"></td>
                  <td className="px-6 py-3 text-right text-sm text-gray-600">
                    {variant.quantity} units
                  </td>
                  <td className="px-6 py-3 text-right text-sm text-gray-600">
                    OMR {variant.unitPrice.toFixed(2)}
                  </td>
                  <td className="px-6 py-3 text-right text-sm text-gray-600">
                    OMR {variant.totalSales.toFixed(2)}
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
        <tfoot>
          <tr className="font-semibold text-lg">
            <td colSpan={4} className="px-6 pt-8">Total Sales</td>
            <td className="px-6 pt-8 text-right">
              OMR {totalSales.toFixed(2)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
})
DesktopView.displayName = 'DesktopView'

// Memoize the mobile view component
const MobileView = memo(({ 
  salesData, 
  expandedItems, 
  toggleItem 
}: {
  salesData: SaleItem[]
  expandedItems: string[]
  toggleItem: (name: string) => void
}) => {
  const totalSales = useMemo(() => 
    salesData.reduce((sum, item) => sum + item.totalSales, 0),
    [salesData]
  )

  return (
    <div className="space-y-4">
      {salesData.map((item) => (
        <MobileItemCard
          key={item.name}
          item={item}
          isExpanded={expandedItems.includes(item.name)}
          onToggle={() => toggleItem(item.name)}
        />
      ))}
      <Card className="p-4 mt-6">
        <div className="flex justify-between items-center text-lg font-semibold">
          <span>OMR {totalSales.toFixed(2)}</span>
        </div>
      </Card>
    </div>
  )
})
MobileView.displayName = 'MobileView'

export default function SalesInfo() {
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [isMobileView, setIsMobileView] = useState(false)
  const [selectedStore, setSelectedStore] = useState("all-stores")
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    const checkViewport = () => {
      setIsMobileView(window.innerWidth < 1024)
    }
    
    // Initial check
    checkViewport()
    
    // Add event listener
    window.addEventListener('resize', checkViewport)
    
    // Set hasMounted to prevent hydration mismatch
    setHasMounted(true)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkViewport)
  }, [])

  const toggleItem = useCallback((itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }, [])

  const filteredSalesData = useMemo(() => 
    selectedStore === "all-stores" 
      ? salesData 
      : salesData.filter(item => item.storeId === selectedStore),
    [selectedStore]
  )

  // Lazy load the view based on viewport
  const CurrentView = useMemo(() => {
    if (isMobileView) {
      return (
        <MobileView 
          salesData={filteredSalesData}
          expandedItems={expandedItems}
          toggleItem={toggleItem}
        />
      )
    }
    return (
      <DesktopView 
        salesData={filteredSalesData}
        expandedItems={expandedItems}
        toggleItem={toggleItem}
      />
    )
  }, [isMobileView, filteredSalesData, expandedItems, toggleItem])

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-semibold">Detailed Sales Report</h1>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
          <h2 className="text-lg font-semibold">Items Sold</h2>
          {hasMounted ? (
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select store" />
              </SelectTrigger>
              <SelectContent>
                {stores.map(store => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="w-[180px] h-10" /> /* Placeholder to maintain layout */
          )}
        </div>

        <Card className={isMobileView ? "p-4" : "p-6"}>
          {CurrentView}
        </Card>
      </div>
    </Layout>
  )
} 