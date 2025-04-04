import { useState, useCallback, useEffect } from "react"

export interface Location {
  id: string
  name: string
}

export function useTransferLocations() {
  const [locations, setLocations] = useState<Location[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Function to fetch transfer locations and categories
  const fetchTransferData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // First try to load from localStorage
      const savedData = localStorage.getItem("transferLocations")
      
      if (savedData) {
        const { locations: savedLocations, categories: savedCategories } = JSON.parse(savedData)
        setLocations(savedLocations)
        setCategories(savedCategories)
        setIsLoading(false)
        return
      }
      
      // If no localStorage data, simulate a fetch from future DB
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Initial locations data
      const locationsData: Location[] = [
        { id: "loc1", name: "Main Warehouse" },
        { id: "loc2", name: "Downtown Shop" },
        { id: "loc3", name: "Westside Location" },
        { id: "loc4", name: "Northside Branch" },
        { id: "loc5", name: "East Warehouse" },
        { id: "loc6", name: "South Distribution Center" },
      ]

      // Initial categories data
      const categoriesData = ["All Categories", "Oil", "Filters", "Fluids", "Accessories"]
      
      setLocations(locationsData)
      setCategories(categoriesData)
      
      // Save to localStorage
      localStorage.setItem("transferLocations", JSON.stringify({
        locations: locationsData,
        categories: categoriesData
      }))
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch data on mount
  useEffect(() => {
    fetchTransferData()
  }, [fetchTransferData])

  return {
    locations,
    categories,
    isLoading,
    error,
    refreshTransferData: fetchTransferData
  }
} 