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

// Define a new Batch interface
export interface Batch {
  id: string
  purchaseDate: string
  costPrice: number
  quantity: number
  supplier?: string
  expirationDate?: string
}

export interface Item {
  id: string
  name: string
  category: string
  stock: number
  price: number // Selling price (customer-facing)
  brand?: string
  type?: string
  image?: string
  volumes?: Volume[]
  basePrice?: number // For compatibility with existing code
  sku?: string
  description?: string
  isOil?: boolean
  bottleStates?: BottleStates
  batches?: Batch[] // Array of batches with different cost prices
}

interface ItemsContextType {
  items: Item[]
  categories: string[]
  brands: string[]
  addItem: (item: Omit<Item, "id">) => void
  updateItem: (id: string, updatedItem: Omit<Item, "id">) => void
  deleteItem: (id: string) => void
  duplicateItem: (id: string) => void
  addCategory: (category: string) => void
  updateCategory: (oldCategory: string, newCategory: string) => void
  deleteCategory: (category: string) => void
  addBrand: (brand: string) => void
  updateBrand: (oldBrand: string, newBrand: string) => void
  deleteBrand: (brand: string) => void
  addBatch: (itemId: string, batchData: Omit<Batch, "id">) => void
  updateBatch: (itemId: string, batchId: string, batchData: Omit<Batch, "id">) => void
  deleteBatch: (itemId: string, batchId: string) => void
  calculateAverageCost: (itemId: string) => number
}

const ItemsContext = createContext<ItemsContextType | undefined>(undefined)

export const useItems = () => {
  const context = useContext(ItemsContext)
  if (!context) {
    throw new Error("useItems must be used within an ItemsProvider")
  }
  return context
}

export const ItemsProvider = ({ children }: { children: React.ReactNode }) => {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Use a stable ID generator that works on both server and client
  const generateId = useCallback(() => {
    // On server or during initial render, use a simple deterministic ID
    if (!isMounted) return `temp-id-${Math.floor(Math.random() * 1000)}`;
    // Only use uuidv4 on client after hydration
    return uuidv4();
  }, [isMounted]);
  
  const [items, setItems] = useState<Item[]>([
    // Oil Products
    {
      id: "oil-1",
      name: "0W-20",
      brand: "Toyota",
      type: "0W-20",
      category: "Oil",
      basePrice: 39.99,
      price: 39.99, // Selling price
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
      description: "Genuine Toyota 0W-20 Synthetic Oil",
      batches: [
        {
          id: "batch-1",
          purchaseDate: "2023-10-15",
          costPrice: 29.99,
          quantity: 50,
          supplier: "Toyota Parts Distributor",
          expirationDate: "2025-10-15"
        },
        {
          id: "batch-2",
          purchaseDate: "2024-01-20",
          costPrice: 32.99,
          quantity: 50,
          supplier: "Toyota Parts Distributor",
          expirationDate: "2026-01-20"
        }
      ]
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
      description: "Shell Helix 5W-30 Synthetic Oil",
      batches: [
        {
          id: "batch-1",
          purchaseDate: "2023-11-10",
          costPrice: 35.99,
          quantity: 75,
          supplier: "Shell Distributors",
          expirationDate: "2025-11-10"
        },
        {
          id: "batch-2",
          purchaseDate: "2024-02-05",
          costPrice: 38.99,
          quantity: 75,
          supplier: "Shell Distributors",
          expirationDate: "2026-02-05"
        }
      ]
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

  const [brands, setBrands] = useState<string[]>([
    "Toyota",
    "Shell",
    "Honda"
  ])

  const addItem = (item: Omit<Item, "id">) => {
    const newItem: Item = {
      ...item,
      id: generateId(),
    }
    setItems((prev) => [...prev, newItem])
  }

  const updateItem = (id: string, updatedItem: Omit<Item, "id">) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...updatedItem, id } : item))
    )
  }

  const deleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const duplicateItem = (id: string) => {
    const itemToDuplicate = items.find((item) => item.id === id)
    if (itemToDuplicate) {
      const duplicatedItem: Item = {
        ...itemToDuplicate,
        id: generateId(),
        name: `${itemToDuplicate.name} (Copy)`,
      }
      setItems((prev) => [...prev, duplicatedItem])
    }
  }

  const addCategory = (category: string) => {
    if (!categories.includes(category)) {
      setCategories((prev) => [...prev, category])
    }
  }

  const updateCategory = (oldCategory: string, newCategory: string) => {
    if (!categories.includes(newCategory)) {
      setCategories((prev) => prev.map((cat) => (cat === oldCategory ? newCategory : cat)))
      setItems((prev) =>
        prev.map((item) => (item.category === oldCategory ? { ...item, category: newCategory } : item))
      )
    }
  }

  const deleteCategory = (category: string) => {
    setCategories((prev) => prev.filter((cat) => cat !== category))
    setItems((prev) => prev.map((item) => (item.category === category ? { ...item, category: "" } : item)))
  }

  const addBrand = (brand: string) => {
    if (!brands.includes(brand)) {
      setBrands((prev) => [...prev, brand])
    }
  }

  const updateBrand = (oldBrand: string, newBrand: string) => {
    if (!brands.includes(newBrand)) {
      setBrands((prev) => prev.map((brand) => (brand === oldBrand ? newBrand : brand)))
      setItems((prev) =>
        prev.map((item) => (item.brand === oldBrand ? { ...item, brand: newBrand } : item))
      )
    }
  }

  const deleteBrand = (brand: string) => {
    setBrands((prev) => prev.filter((b) => b !== brand))
    setItems((prev) => prev.map((item) => (item.brand === brand ? { ...item, brand: undefined } : item)))
  }

  // Batch management functions
  const addBatch = (itemId: string, batchData: Omit<Batch, "id">) => {
    setItems((prevItems) => {
      return prevItems.map((item) => {
        if (item.id === itemId) {
          const newBatch = {
            id: generateId(),
            ...batchData
          };
          
          // Sort batches by purchase date (oldest first) to maintain FIFO order
          const newBatches = [...item.batches, newBatch].sort((a, b) => 
            new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()
          );
          
          // Calculate new stock based on batches
          const newStock = newBatches.reduce((sum, batch) => sum + batch.quantity, 0);
          
          return {
            ...item,
            batches: newBatches,
            stock: newStock // Always update stock to be the sum of all batch quantities
          };
        }
        return item;
      });
    });
  };

  const updateBatch = (itemId: string, batchId: string, batchData: Omit<Batch, "id">) => {
    setItems((prevItems) => {
      return prevItems.map((item) => {
        if (item.id === itemId) {
          const updatedBatches = item.batches.map((batch) => 
            batch.id === batchId ? { ...batch, ...batchData } : batch
          );
          
          // Re-sort batches by purchase date to maintain FIFO order
          const sortedBatches = updatedBatches.sort((a, b) => 
            new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime()
          );
          
          // Recalculate total stock from all batches
          const newStock = sortedBatches.reduce((sum, batch) => sum + batch.quantity, 0);
          
          return {
            ...item,
            batches: sortedBatches,
            stock: newStock // Always update stock to be the sum of all batch quantities
          };
        }
        return item;
      });
    });
  };

  const deleteBatch = (itemId: string, batchId: string) => {
    setItems((prevItems) => {
      return prevItems.map((item) => {
        if (item.id === itemId) {
          const remainingBatches = item.batches.filter((batch) => batch.id !== batchId);
          
          // Recalculate total stock from remaining batches
          const newStock = remainingBatches.reduce((sum, batch) => sum + batch.quantity, 0);
          
          return {
            ...item,
            batches: remainingBatches,
            stock: newStock // Always update stock to be the sum of all batch quantities
          };
        }
        return item;
      });
    });
  };
  
  const calculateAverageCost = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    if (!item || !item.batches || item.batches.length === 0) {
      return 0;
    }
    
    // Calculate weighted average cost
    const totalQuantity = item.batches.reduce((sum, batch) => sum + batch.quantity, 0);
    if (totalQuantity === 0) return 0;
    
    const totalCost = item.batches.reduce(
      (sum, batch) => sum + (batch.costPrice * batch.quantity), 
      0
    );
    
    return totalCost / totalQuantity;
  };

  return (
    <ItemsContext.Provider
      value={{
        items,
        categories,
        brands,
        addItem,
        updateItem,
        deleteItem,
        duplicateItem,
        addCategory,
        updateCategory,
        deleteCategory,
        addBrand,
        updateBrand,
        deleteBrand,
        addBatch,
        updateBatch,
        deleteBatch,
        calculateAverageCost
      }}
    >
      {children}
    </ItemsContext.Provider>
  )
}

