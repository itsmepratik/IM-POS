import { useState, useMemo, useCallback } from 'react';
import { useItems, Item, BottleState } from './items-context';
import { toast } from '@/components/ui/use-toast';

export const useInventoryData = () => {
  const { items, categories, brands, deleteItem, duplicateItem } = useItems();
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedBottleState, setSelectedBottleState] = useState<BottleState | 'all'>('all');
  const [showInStock, setShowInStock] = useState(true);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  
  // Item selection for bulk actions
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  // Editing modal states
  const [editingItem, setEditingItem] = useState<Item | undefined>(undefined);
  
  // Filter items based on all filters
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search filter
      const matchesSearch = 
        searchQuery === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Category filter
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      
      // Brand filter
      const matchesBrand = selectedBrand === 'all' || 
        (selectedBrand === 'none' ? !item.brand : item.brand === selectedBrand);
      
      // Bottle state filter (for oils)
      const matchesBottleState = selectedBottleState === 'all' || 
        (item.isOil && item.bottleStates && 
          (selectedBottleState === 'open' ? item.bottleStates.open > 0 : item.bottleStates.closed > 0));
      
      // Stock filter
      const matchesStock = !showInStock || item.stock > 0;
      
      return matchesSearch && matchesCategory && matchesBrand && matchesBottleState && matchesStock;
    });
  }, [items, searchQuery, selectedCategory, selectedBrand, selectedBottleState, showInStock]);
  
  // Reset all filters
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedBottleState('all');
    setShowInStock(true);
  }, []);
  
  // Handle item selection
  const toggleItemSelection = useCallback((id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id) 
        : [...prev, id]
    );
  }, []);
  
  const toggleAllSelection = useCallback(() => {
    if (selectedItems.length === filteredItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.id));
    }
  }, [filteredItems, selectedItems.length]);
  
  // Handle item CRUD operations
  const handleEdit = useCallback((item: Item) => {
    setEditingItem(item);
  }, []);
  
  const handleAddItem = useCallback(() => {
    setEditingItem(undefined);
  }, []);
  
  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      deleteItem(id);
      toast({
        title: "Item deleted",
        description: "The item has been deleted successfully."
      });
    }
  }, [deleteItem]);
  
  const handleDuplicate = useCallback((id: string) => {
    duplicateItem(id);
    toast({
      title: "Item duplicated",
      description: "A copy of the item has been created."
    });
  }, [duplicateItem]);
  
  return {
    // Items and categories data
    items,
    categories,
    brands,
    filteredItems,
    
    // Search and filter states
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedBrand,
    setSelectedBrand,
    selectedBottleState,
    setSelectedBottleState,
    showInStock,
    setShowInStock,
    isFiltersOpen,
    setIsFiltersOpen,
    resetFilters,
    
    // Selection states
    selectedItems,
    setSelectedItems,
    toggleItemSelection,
    toggleAllSelection,
    
    // Modal states
    editingItem,
    setEditingItem,
    
    // CRUD operations
    handleEdit,
    handleAddItem,
    handleDelete,
    handleDuplicate
  };
}; 