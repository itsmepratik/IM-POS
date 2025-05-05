"use client"

import { useState, useEffect, useMemo } from "react"
import { useItems, type Item } from "../items-context"
import { useBranch, type Branch } from "../../branch-context"

interface UseInventoryDataReturn {
  // Item data
  items: Item[]
  filteredItems: Item[]
  categories: string[]
  
  // UI states
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  showLowStock: boolean
  setShowLowStock: (show: boolean) => void
  selectedItems: string[]
  setSelectedItems: (items: string[]) => void
  
  // Modal states
  isModalOpen: boolean
  setIsModalOpen: (isOpen: boolean) => void
  isCategoryModalOpen: boolean
  setIsCategoryModalOpen: (isOpen: boolean) => void
  isFiltersOpen: boolean
  setIsFiltersOpen: (isOpen: boolean) => void
  editingItem: Item | undefined
  setEditingItem: (item: Item | undefined) => void
  
  // Oil-specific data
  oilItems: Item[]
  nonOilItems: Item[]
  
  // Actions
  toggleItem: (id: string) => void
  toggleAll: (checked: boolean) => void
  handleEdit: (item: Item) => void
  handleAddItem: () => void
  handleDelete: (id: string) => void
  handleDuplicate: (id: string) => void
  resetFilters: () => void
  
  // Branch data
  branches: Branch[]
  currentBranch: Branch | null
}

export function useInventoryData(): UseInventoryDataReturn {
  // Get data from contexts
  const { items, categories, deleteItem, duplicateItem } = useItems()
  const { branches, currentBranch } = useBranch()
  
  // UI state
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [showLowStock, setShowLowStock] = useState(false)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined)
  
  // Oil-specific data
  const oilItems = useMemo(() => items.filter(item => item.isOil), [items])
  const nonOilItems = useMemo(() => items.filter(item => !item.isOil), [items])
  
  // Filtered items based on search query, category, and low stock filter
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search query filter
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.brand?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (item.type?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (item.sku?.toLowerCase() || "").includes(searchQuery.toLowerCase())
      
      // Category filter
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
      
      // Low stock filter
      const matchesLowStock = !showLowStock || item.stock < 10
      
      return matchesSearch && matchesCategory && matchesLowStock
    })
  }, [items, searchQuery, selectedCategory, showLowStock])
  
  // Action handlers
  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    )
  }
  
  const toggleAll = (checked: boolean) => {
    setSelectedItems(checked ? filteredItems.map((item) => item.id) : [])
  }
  
  const handleEdit = (item: Item) => {
    setEditingItem(item)
    setIsModalOpen(true)
  }
  
  const handleAddItem = () => {
    setEditingItem(undefined)
    setIsModalOpen(true)
  }
  
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this item from this branch?')) {
      try {
        console.log(`Deleting item ${id} from branch ${currentBranch?.id}`);
        const result = await deleteItem(id);
        
        if (result) {
          console.log('Item deleted successfully from branch');
        } else {
          console.error('Failed to delete item from branch');
          // Show error toast if needed
        }
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  }
  
  const handleDuplicate = (id: string) => {
    duplicateItem(id)
  }
  
  const resetFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setShowLowStock(false)
    setIsFiltersOpen(false)
  }
  
  return {
    // Data
    items,
    filteredItems,
    categories,
    oilItems,
    nonOilItems,
    
    // UI states
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    showLowStock,
    setShowLowStock,
    selectedItems,
    setSelectedItems,
    
    // Modal states
    isModalOpen,
    setIsModalOpen,
    isCategoryModalOpen,
    setIsCategoryModalOpen,
    isFiltersOpen,
    setIsFiltersOpen,
    editingItem,
    setEditingItem,
    
    // Actions
    toggleItem,
    toggleAll,
    handleEdit,
    handleAddItem,
    handleDelete,
    handleDuplicate,
    resetFilters,
    
    // Branch data
    branches,
    currentBranch,
  }
} 