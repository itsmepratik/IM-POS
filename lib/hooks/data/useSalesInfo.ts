import { useState, useCallback, useEffect } from "react"
import { getRevenueData, SaleItem, Store } from "@/app/sales-info/revenue/actions"

export type { SaleItem, Store, SaleVariant } from "@/app/sales-info/revenue/actions"

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
      const { items: salesData, stores: storesData } = await getRevenueData()
      
      // Add "All Stores" option if not present
      const allStoresOption = { id: "all-stores", name: "All Stores" }
      const finalStores = [allStoresOption, ...storesData]

      setItems(salesData)
      setStores(finalStores)
    } catch (err) {
      console.error("Failed to fetch revenue data:", err)
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
