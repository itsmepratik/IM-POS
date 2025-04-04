import { useState, useCallback, useEffect } from "react"

export interface SaleVariant {
  size: string
  quantity: number
  unitPrice: number
  totalSales: number
}

export interface SaleItem {
  name: string
  category: string
  quantity: number
  unitPrice: number
  totalSales: number
  storeId: string
  variants?: SaleVariant[]
}

export interface Store {
  id: string
  name: string
}

export function useSalesInfo() {
  const [items, setItems] = useState<SaleItem[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Function to fetch sales info
  const fetchSalesInfo = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // First try to load from localStorage
      const savedSalesInfo = localStorage.getItem("salesInfo")
      
      if (savedSalesInfo) {
        const { items: savedItems, stores: savedStores } = JSON.parse(savedSalesInfo)
        setItems(savedItems)
        setStores(savedStores)
        setIsLoading(false)
        return
      }
      
      // If no localStorage data, simulate a fetch from future DB
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Initial sales data
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

      // Initial stores data
      const storesData: Store[] = [
        { id: "all-stores", name: "All Stores" },
        { id: "store1", name: "Main (Sanaya)" },
        { id: "store2", name: "Hafith" },
        { id: "store3", name: "Abu-Dhurus" },
      ]
      
      setItems(salesData)
      setStores(storesData)
      
      // Save to localStorage
      localStorage.setItem("salesInfo", JSON.stringify({ items: salesData, stores: storesData }))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch data on mount
  useEffect(() => {
    fetchSalesInfo()
  }, [fetchSalesInfo])

  return {
    items,
    stores,
    isLoading,
    error,
    refreshSalesInfo: fetchSalesInfo
  }
} 