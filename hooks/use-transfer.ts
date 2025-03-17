import { useState, useEffect, useRef, useCallback } from "react";

// Define item type
export interface InventoryItem {
  id: number;
  name: string;
  brand: string;
  sku: string;
  location: string;
  stock: number;
  price: number;
}

// Mock data for demonstration
export const mockItems: InventoryItem[] = [
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
];

export const useTransfer = () => {
  // Use a ref to store the initial mock data
  const mockItemsRef = useRef<InventoryItem[]>([...mockItems]);
  
  // Use state to store the items
  const [items, setItems] = useState<InventoryItem[]>([...mockItemsRef.current]);
  const [sourceLocation, setSourceLocation] = useState("");
  const [destinationLocation, setDestinationLocation] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [transferItems, setTransferItems] = useState<InventoryItem[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [transferQuantities, setTransferQuantities] = useState<Record<number, number>>({});

  // Function to refresh the items - this will get the latest mockItems
  // Use useCallback to ensure this function doesn't change on every render
  const refreshItems = useCallback(() => {
    // Update the ref with the latest mockItems
    mockItemsRef.current = [...mockItems];
    // Update the state with the latest mockItems
    setItems([...mockItems]);
  }, []);

  // Ensure we're always using the latest mockItems on mount
  useEffect(() => {
    refreshItems();
  }, []);

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

  return {
    // State
    sourceLocation,
    destinationLocation,
    selectedCategory,
    transferItems,
    quantities,
    transferQuantities,
    
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