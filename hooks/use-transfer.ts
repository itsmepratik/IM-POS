import { useState, useEffect, useCallback } from "react";
import { useInventory, InventoryItem } from "@/lib/hooks/data/useInventory";

export const useTransfer = () => {
  const { items, isLoading, fetchInventoryItems } = useInventory();
  
  // State for transfer functionality
  const [sourceLocation, setSourceLocation] = useState("");
  const [destinationLocation, setDestinationLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [transferItems, setTransferItems] = useState<InventoryItem[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [transferQuantities, setTransferQuantities] = useState<Record<number, number>>({});

  const handleQuantityChange = (itemId: number, value: number) => {
    setQuantities({
      ...quantities,
      [itemId]: Math.max(1, value),
    });
  };

  const handleTransferQuantityChange = (itemId: number, value: number) => {
    setTransferQuantities({
      ...transferQuantities,
      [itemId]: Math.max(1, value),
    });
  };

  const addToTransfer = (item: InventoryItem) => {
    if (!transferItems.some(i => i.id === item.id)) {
      setTransferItems([...transferItems, item]);
      // Use the current quantity value when adding to transfer
      setTransferQuantities({
        ...transferQuantities,
        [item.id]: quantities[item.id] || 1,
      });
    }
  };

  const removeFromTransfer = (itemId: number) => {
    setTransferItems(transferItems.filter(item => item.id !== itemId));
    const newTransferQuantities = { ...transferQuantities };
    delete newTransferQuantities[itemId];
    setTransferQuantities(newTransferQuantities);
  };

  const handlePrint = () => {
    window.print();
  };

  // Refresh data function now calls the inventory hook's fetch function
  const refreshItems = useCallback(() => {
    fetchInventoryItems();
  }, [fetchInventoryItems]);

  return {
    // State
    sourceLocation,
    destinationLocation,
    selectedCategory,
    transferItems,
    quantities,
    transferQuantities,
    isLoading,
    
    // Setters
    setSourceLocation,
    setDestinationLocation,
    setSelectedCategory,
    
    // Actions
    handleQuantityChange,
    handleTransferQuantityChange,
    addToTransfer,
    removeFromTransfer,
    handlePrint,
    refreshItems,
    
    // Data
    items
  };
}; 