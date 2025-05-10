"use client";

import { useState, useEffect } from "react";
import { useInventoryMockData } from "./useInventoryMockData";
import { useCachedInventory } from "./useCachedInventory";
import { useAbuDhabiInventory, ABU_DHABI_BRANCH } from "./useAbuDhabiInventory";
import { useHafithInventory, HAFITH_BRANCH } from "./useHafithInventory";

// Branch type for type safety
export type Branch = {
  id: string;
  name: string;
  address: string;
  phone?: string;
  created_at: string;
  updated_at: string;
};

export function useBranchSpecificInventory() {
  // All our hooks
  const mainInventory = useCachedInventory();
  const abuDhabiInventory = useAbuDhabiInventory();
  const hafithInventory = useHafithInventory();
  
  // Get all available branches
  const allBranches = [
    { id: "main", name: "Sanaiya (Main)", address: "Main Location", phone: "555-0000", created_at: "", updated_at: "" },
    ABU_DHABI_BRANCH,
    HAFITH_BRANCH
  ];
  
  // Current branch state
  const [currentBranchId, setCurrentBranchId] = useState<string>("main");
  
  // Get the inventory hook for the current branch
  const getInventoryForBranch = () => {
    switch (currentBranchId) {
      case "1": // Abu Dhabi
        return abuDhabiInventory;
      case "2": // Hafith
        return hafithInventory;
      default: // Main
        return mainInventory;
    }
  };
  
  // Get the current branch object
  const getCurrentBranch = (): Branch => {
    return allBranches.find(branch => branch.id === currentBranchId) || allBranches[0];
  };
  
  // The current inventory hook
  const currentInventory = getInventoryForBranch();
  
  return {
    // Branch selection
    currentBranchId,
    setCurrentBranchId,
    allBranches,
    currentBranch: getCurrentBranch(),
    
    // Combined/current inventory data
    ...currentInventory,
    
    // Individual inventory hooks (for advanced use cases)
    inventoryHooks: {
      main: mainInventory,
      abuDhabi: abuDhabiInventory,
      hafith: hafithInventory
    }
  };
} 