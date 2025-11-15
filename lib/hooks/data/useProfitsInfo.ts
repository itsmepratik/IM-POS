import { useState, useCallback, useEffect } from "react"

export interface ProfitVariant {
  size: string
  quantity: number
  unitPrice: number
  unitCost: number
  totalSales: number
  totalCost: number
  profit: number
  profitMargin: number
}

export interface ProfitItem {
  name: string
  category: "fluid" | "part" | "service"
  quantity: number
  unitPrice: number
  unitCost: number
  totalSales: number
  totalCost: number
  profit: number
  profitMargin: number
  storeId: string
  variants?: ProfitVariant[]
}

export interface Store {
  id: string
  name: string
}

export interface OperatingCosts {
  rent: number
  utilities: number
  salaries: number
  other: number
  total: number
}

export function useProfitsInfo() {
  const [items, setItems] = useState<ProfitItem[]>([])
  const [stores, setStores] = useState<Store[]>([])
  const [operatingCosts, setOperatingCosts] = useState<OperatingCosts>({
    rent: 0,
    utilities: 0,
    salaries: 0,
    other: 0,
    total: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Function to fetch profits info
  const fetchProfitsInfo = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // First try to load from localStorage
      const savedProfitsInfo = localStorage.getItem("profitsInfo")
      
      if (savedProfitsInfo) {
        const { items: savedItems, stores: savedStores, operatingCosts: savedCosts } = JSON.parse(savedProfitsInfo)
        setItems(savedItems)
        setStores(savedStores)
        setOperatingCosts(savedCosts)
        setIsLoading(false)
        return
      }
      
      // If no localStorage data, simulate a fetch from future DB
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Initial profits data with costs
      const profitsData: ProfitItem[] = [
        { 
          name: "Shell Helix Oil",
          category: "fluid",
          quantity: 5,
          unitPrice: 45.00,
          unitCost: 30.00,
          totalSales: 225.00,
          totalCost: 150.00,
          profit: 75.00,
          profitMargin: 33.33,
          storeId: "store1",
          variants: [
            { 
              size: "5L", 
              quantity: 2, 
              unitPrice: 55.00, 
              unitCost: 38.00,
              totalSales: 110.00,
              totalCost: 76.00,
              profit: 34.00,
              profitMargin: 30.91
            },
            { 
              size: "2L", 
              quantity: 3, 
              unitPrice: 38.50, 
              unitCost: 25.00,
              totalSales: 115.50,
              totalCost: 75.00,
              profit: 40.50,
              profitMargin: 35.06
            }
          ]
        },
        { 
          name: "Castrol Coolant",
          category: "fluid",
          quantity: 8,
          unitPrice: 25.00,
          unitCost: 15.00,
          totalSales: 200.00,
          totalCost: 120.00,
          profit: 80.00,
          profitMargin: 40.00,
          storeId: "store2",
          variants: [
            { 
              size: "4L", 
              quantity: 3, 
              unitPrice: 32.00, 
              unitCost: 19.00,
              totalSales: 96.00,
              totalCost: 57.00,
              profit: 39.00,
              profitMargin: 40.63
            },
            { 
              size: "1L", 
              quantity: 5, 
              unitPrice: 20.80, 
              unitCost: 12.50,
              totalSales: 104.00,
              totalCost: 62.50,
              profit: 41.50,
              profitMargin: 39.90
            }
          ]
        },
        { 
          name: "Oil Filter",
          category: "part",
          quantity: 15,
          unitPrice: 12.00,
          unitCost: 7.00,
          totalSales: 180.00,
          totalCost: 105.00,
          profit: 75.00,
          profitMargin: 41.67,
          storeId: "store1"
        },
        { 
          name: "Standard Oil Change",
          category: "service",
          quantity: 20,
          unitPrice: 45.00,
          unitCost: 20.00,
          totalSales: 900.00,
          totalCost: 400.00,
          profit: 500.00,
          profitMargin: 55.56,
          storeId: "store3"
        },
        { 
          name: "Brake Fluid",
          category: "fluid",
          quantity: 6,
          unitPrice: 15.00,
          unitCost: 8.00,
          totalSales: 90.00,
          totalCost: 48.00,
          profit: 42.00,
          profitMargin: 46.67,
          storeId: "store2",
          variants: [
            { 
              size: "500ml", 
              quantity: 4, 
              unitPrice: 12.50, 
              unitCost: 6.50,
              totalSales: 50.00,
              totalCost: 26.00,
              profit: 24.00,
              profitMargin: 48.00
            },
            { 
              size: "1L", 
              quantity: 2, 
              unitPrice: 20.00, 
              unitCost: 11.00,
              totalSales: 40.00,
              totalCost: 22.00,
              profit: 18.00,
              profitMargin: 45.00
            }
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

      // Operating costs (mock data)
      const costsData: OperatingCosts = {
        rent: 1500.00,
        utilities: 350.00,
        salaries: 2800.00,
        other: 450.00,
        total: 5100.00,
      }
      
      setItems(profitsData)
      setStores(storesData)
      setOperatingCosts(costsData)
      
      // Save to localStorage
      localStorage.setItem("profitsInfo", JSON.stringify({ 
        items: profitsData, 
        stores: storesData,
        operatingCosts: costsData
      }))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch data on mount
  useEffect(() => {
    fetchProfitsInfo()
  }, [fetchProfitsInfo])

  return {
    items,
    stores,
    operatingCosts,
    isLoading,
    error,
    refreshProfitsInfo: fetchProfitsInfo
  }
}

