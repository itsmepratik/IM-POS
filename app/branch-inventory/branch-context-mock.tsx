"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { Branch } from "@/lib/services/inventoryService";
import { toast } from "@/components/ui/use-toast";

// Mock branch data
const MOCK_BRANCHES: Branch[] = [
  {
    id: "1",
    name: "Abu Dhabi Branch",
    address: "123 Main St",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Hafeet Branch",
    address: "456 Center Ave",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "West Side Branch",
    address: "789 West Blvd",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

interface BranchContextType {
  branches: Branch[];
  currentBranch: Branch | null;
  isLoadingBranches: boolean;
  selectBranch: (branchId: string) => void;
  retryLoadBranches: () => Promise<void>;
  branchLoadError: boolean;
}

const BranchContext = createContext<BranchContextType>({
  branches: [],
  currentBranch: null,
  isLoadingBranches: true,
  selectBranch: () => {},
  retryLoadBranches: async () => {},
  branchLoadError: false,
});

export function useBranch() {
  return useContext(BranchContext);
}

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [branchLoadError, setBranchLoadError] = useState(false);

  // Define the load branches function that uses mock data
  const loadBranches = async () => {
    try {
      setIsLoadingBranches(true);
      setBranchLoadError(false);

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Use mock branches
      setBranches(MOCK_BRANCHES);
      setCurrentBranch(MOCK_BRANCHES[0]);
      setBranchLoadError(false);

      console.log("Loaded mock branches:", MOCK_BRANCHES.length);
    } catch (error) {
      console.error("Error loading mock branches:", error);
      setBranchLoadError(true);

      toast({
        title: "Error loading branches",
        description: "Failed to load branch data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBranches(false);
    }
  };

  // Load branches on initial load
  useEffect(() => {
    loadBranches();
  }, []);

  const selectBranch = (branchId: string) => {
    const branch = branches.find((b) => b.id === branchId);
    if (branch) {
      setCurrentBranch(branch);
      console.log(`Selected branch: ${branch.name} (${branch.id})`);
    } else {
      console.error(`Branch with ID ${branchId} not found`);
    }
  };

  const retryLoadBranches = async () => {
    await loadBranches();
  };

  return (
    <BranchContext.Provider
      value={{
        branches,
        currentBranch,
        isLoadingBranches,
        selectBranch,
        retryLoadBranches,
        branchLoadError,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}
