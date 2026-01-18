import { useState, useCallback, useEffect } from "react"
import { getProfitsReport, getShops, type ProfitItem } from "@/app/actions/profits"

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

interface UseProfitsInfoParams {
  storeId?: string;
  startDate?: Date;
  endDate?: Date;
}

export function useProfitsInfo({ storeId, startDate, endDate }: UseProfitsInfoParams = {}) {
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

  const fetchProfitsInfo = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const [fetchedItems, fetchedShops] = await Promise.all([
        getProfitsReport(storeId, startDate, endDate),
        getShops()
      ]);

      setItems(fetchedItems)
      setStores(fetchedShops)
      
      // Operating Costs are still mocked/not implemented in DB yet based on schema review
      // Keeping generic placeholder or setting to 0 for now as requested task was about profit (revenue - cogs)
      // If user wants operating expenses integration, that would be a separate task likely requiring a new table.
      const costsData: OperatingCosts = {
        rent: 0,
        utilities: 0,
        salaries: 0,
        other: 0,
        total: 0,
      }
      setOperatingCosts(costsData)

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'))
    } finally {
      setIsLoading(false)
    }
  }, [storeId, startDate, endDate])

  // Fetch data on mount and dependencies change
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

