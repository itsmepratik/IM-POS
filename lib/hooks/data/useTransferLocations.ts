import { useState, useCallback, useEffect } from "react"

export interface Location {
  id: string
  name: string
}

/**
 * Custom React hook for managing transfer locations and categories.
 * This hook handles fetching, storing, and updating transfer-related data.
 * It also includes functionality to periodically check and refresh data if needed.
 *
 * @returns {Object} An object containing:
 *   - locations {Location[]}: Array of available transfer locations
 *   - categories {string[]}: Array of available transfer categories
 *   - isLoading {boolean}: Indicates whether data is currently being fetched
 *   - error {Error | null}: Any error that occurred during data fetching
 *   - refreshTransferData {Function}: Function to manually refresh transfer data
 */
export function useTransferLocations() {
  const [locations, setLocations] = useState<Location[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Current expected locations
  const expectedLocations = [
    { id: "loc0", name: "Sanaiya (Main)" },
    { id: "loc1", name: "Abu Dhurus" },
    { id: "loc2", name: "Hafith" },
  ]

  // Function to fetch transfer locations and categories
  const fetchTransferData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log("Clearing transfer locations from localStorage")
      // Force clear localStorage data to prevent old locations from being shown
      localStorage.removeItem("transferLocations")
      
      // Initial locations data - Only Abu Dhurus and Hafith for sources, and Sanaiya (Main) for destination
      const locationsData: Location[] = expectedLocations
      console.log("Setting locations to:", locationsData)
      
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
      console.error("Error in fetchTransferData:", err)
      setError(err instanceof Error ? err : new Error('Unknown error occurred'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch data on mount
  useEffect(() => {
    console.log("useTransferLocations useEffect running")
    fetchTransferData()
    
    // Create an interval to periodically check if the data needs to be refreshed
    const interval = setInterval(() => {
      const savedData = localStorage.getItem("transferLocations")
      if (savedData) {
        try {
          const { locations: savedLocations } = JSON.parse(savedData)
          // If any location other than our expected ones is found, refresh the data
          if (savedLocations.some((loc: Location) => 
            !expectedLocations.find(expected => expected.id === loc.id)
          )) {
            console.log("Found unexpected locations in localStorage, refreshing...")
            fetchTransferData()
          }
        } catch (e) {
          console.error("Error checking localStorage:", e)
        }
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [fetchTransferData])

  return {
    locations,
    categories,
    isLoading,
    error,
    refreshTransferData: fetchTransferData
  }
} 