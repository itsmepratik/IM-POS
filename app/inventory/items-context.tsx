"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"

export interface Volume {
  size: string
  price: number
}

export interface BottleStates {
  open: number
  closed: number
}

export interface Item {
  id: string
  name: string
  category: string
  stock: number
  price: number
  brand?: string
  type?: string
  image?: string
  volumes?: Volume[]
  basePrice?: number
  sku?: string
  description?: string
  isOil?: boolean
  bottleStates?: BottleStates
}

interface ItemsContextType {
  items: Item[]
  categories: string[]
  addItem: (item: Omit<Item, "id">) => void
  updateItem: (id: string, item: Partial<Item>) => void
  deleteItem: (id: string) => void
  duplicateItem: (id: string) => void
  addCategory: (category: string) => void
  removeCategory: (category: string) => void
}

const ItemsContext = createContext<ItemsContextType | undefined>(undefined)

export const useItems = () => {
  const context = useContext(ItemsContext)
  if (!context) {
    throw new Error("useItems must be used within an ItemsProvider")
  }
  return context
}

export const ItemsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Item[]>([
    // Oil Products
    {
      id: "oil-1",
      name: "0W-20",
      brand: "Toyota",
      type: "0W-20",
      category: "Oil",
      basePrice: 39.99,
      price: 39.99,
      stock: 100,
      image: "/oils/toyota-0w20.jpg",
      isOil: true,
      bottleStates: { open: 5, closed: 5 },
      volumes: [
        { size: "5L", price: 39.99 },
        { size: "4L", price: 34.99 },
        { size: "1L", price: 11.99 },
        { size: "500ml", price: 6.99 },
      ],
      sku: "TOY-OIL-0W20",
      description: "Genuine Toyota 0W-20 Synthetic Oil"
    },
    {
      id: "oil-2",
      name: "5W-30",
      brand: "Shell",
      type: "5W-30",
      category: "Oil",
      basePrice: 45.99,
      price: 45.99,
      stock: 150,
      image: "/oils/shell-5w30.jpg",
      isOil: true,
      bottleStates: { open: 5, closed: 5 },
      volumes: [
        { size: "5L", price: 45.99 },
        { size: "4L", price: 39.99 },
        { size: "1L", price: 13.99 },
        { size: "500ml", price: 7.99 },
      ],
      sku: "SHL-OIL-5W30",
      description: "Shell Helix 5W-30 Synthetic Oil"
    },
    // Filters
    {
      id: "filter-1",
      name: "Oil Filter - Premium",
      brand: "Toyota",
      type: "Oil Filter",
      category: "Filters",
      price: 19.99,
      stock: 75,
      image: "/filters/toyota-oil-filter.jpg",
      sku: "TOY-FLT-OIL-P",
      description: "Premium Toyota Oil Filter"
    },
    {
      id: "filter-2",
      name: "Air Filter - Standard",
      brand: "Honda",
      type: "Air Filter",
      category: "Filters",
      price: 14.99,
      stock: 50,
      image: "/filters/honda-air-filter.jpg",
      sku: "HON-FLT-AIR-S",
      description: "Standard Honda Air Filter"
    },
    // Parts
    {
      id: "part-1",
      name: "Brake Pads",
      category: "Parts",
      price: 45.99,
      stock: 30,
      sku: "BRK-PAD-001",
      description: "High-performance brake pads"
    },
    // Additives
    {
      id: "add-1",
      name: "Fuel System Cleaner",
      category: "Additives",
      price: 14.99,
      stock: 60,
      sku: "ADD-FSC-001",
      description: "Professional fuel system cleaning solution"
    }
  ])

  const [categories, setCategories] = useState<string[]>([
    "Oil",
    "Filters",
    "Parts",
    "Additives"
  ])

  const addItem = useCallback((newItem: Omit<Item, "id">) => {
    setItems((prevItems) => [...prevItems, { ...newItem, id: uuidv4() }])
  }, [])

  const updateItem = useCallback((id: string, updatedItem: Partial<Item>) => {
    setItems((prevItems) => prevItems.map((item) => (item.id === id ? { ...item, ...updatedItem } : item)))
  }, [])

  const deleteItem = useCallback((id: string) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id))
  }, [])

  const duplicateItem = useCallback((id: string) => {
    setItems((prevItems) => {
      const itemToDuplicate = prevItems.find((item) => item.id === id)
      if (!itemToDuplicate) return prevItems

      const duplicatedItems = prevItems.filter(
        (item) => item.name.startsWith(`${itemToDuplicate.name} (`) && item.name.endsWith(")"),
      )
      const newName = `${itemToDuplicate.name} (${duplicatedItems.length + 1})`

      return [...prevItems, { ...itemToDuplicate, id: uuidv4(), name: newName }]
    })
  }, [])

  const addCategory = useCallback((category: string) => {
    setCategories((prev) => [...new Set([...prev, category])])
  }, [])

  const removeCategory = useCallback((category: string) => {
    setCategories((prev) => prev.filter((c) => c !== category))
    setItems((prevItems) => prevItems.map((item) => (item.category === category ? { ...item, category: "" } : item)))
  }, [])

  // Use effect to log changes in categories (for debugging)
  useEffect(() => {
    console.log("Categories updated:", categories)
  }, [categories])

  return (
    <ItemsContext.Provider
      value={{
        items,
        categories,
        addItem,
        updateItem,
        deleteItem,
        duplicateItem,
        addCategory,
        removeCategory,
      }}
    >
      {children}
    </ItemsContext.Provider>
  )
}

