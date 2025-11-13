"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchItems } from "@/lib/services/inventoryService"

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

export function useInventory(locationId?: string) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Function to fetch inventory items
  const fetchInventoryItems = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Use "sanaiya" as default location if not provided
      const locationToFetch = locationId || "sanaiya"
      
      // Fetch real inventory items from database
      const dbItems = await fetchItems(locationToFetch)
      
      // Transform database items to InventoryItem format
      const data: InventoryItem[] = dbItems.map((item, index) => {
        // Generate a numeric ID from UUID string
        const numericId = item.id 
          ? parseInt(item.id.replace(/-/g, '').substring(0, 10), 16) || index + 1
          : index + 1;
        
        // Use first 8 chars of UUID as SKU (remove dashes)
        const sku = item.id 
          ? item.id.replace(/-/g, '').substring(0, 8).toUpperCase()
          : `SKU${String(index + 1).padStart(4, '0')}`;
        
        return {
          id: numericId,
          name: item.name,
          brand: item.brand || "Unknown",
          sku: sku,
          location: "A1-01", // Default location code
          stock: item.stock || 0,
          price: item.price || 0,
        };
      })
      
      setItems(data)
      console.log(`✅ Loaded ${data.length} inventory items for location: ${locationToFetch}`)
    } catch (err) {
      console.error("Error fetching inventory items:", err)
      setError(err instanceof Error ? err : new Error('Unknown error occurred'))
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [locationId])

  // Fetch data on mount and when locationId changes
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