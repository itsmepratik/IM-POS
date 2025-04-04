"use client"

import { useState, useEffect, useCallback } from "react"

// Define inventory item type
export interface InventoryItem {
  id: number
  name: string
  brand: string
  sku: string
  location: string
  stock: number
  price: number
}

export function useInventory() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Function to fetch inventory items
  const fetchInventoryItems = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // In the future, this will fetch from Supabase
      // For now, we'll simulate an API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Temporary mock data
      const data: InventoryItem[] = [
        {
          id: 1,
          name: "Synthetic Motor Oil",
          brand: "Mobil 1",
          sku: "M1-5W30-1QT",
          location: "A1-03",
          stock: 558,
          price: 39.99,
        },
        {
          id: 2,
          name: "Oil Filter",
          brand: "l",
          sku: "PH7317",
          location: "B2-01",
          stock: 85,
          price: 8.99,
        },
        {
          id: 3,
          name: "Transmission Fluid",
          brand: "Valvoline",
          sku: "VAL-ATF-1GAL",
          location: "A2-04",
          stock: 42,
          price: 29.99,
        },
      ]
      
      setItems(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Fetch data on mount
  useEffect(() => {
    fetchInventoryItems()
  }, [fetchInventoryItems])

  // Function to update an inventory item
  const updateInventoryItem = useCallback(async (item: InventoryItem) => {
    try {
      // In the future, this will update the item in Supabase
      setItems(currentItems => 
        currentItems.map(i => i.id === item.id ? item : i)
      )
      return true
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update item'))
      return false
    }
  }, [])

  // Function to add a new inventory item
  const addInventoryItem = useCallback(async (item: Omit<InventoryItem, 'id'>) => {
    try {
      // In the future, this will add the item to Supabase
      const newItem = {
        ...item,
        id: Math.max(0, ...items.map(i => i.id)) + 1
      }
      
      setItems(currentItems => [...currentItems, newItem as InventoryItem])
      return newItem as InventoryItem
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to add item'))
      return null
    }
  }, [items])

  return {
    items,
    isLoading,
    error,
    fetchInventoryItems,
    updateInventoryItem,
    addInventoryItem
  }
} 