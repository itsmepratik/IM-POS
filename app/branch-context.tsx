"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { Branch, MOCK_BRANCHES } from "@/lib/services/inventoryService";
import { toast } from "@/components/ui/use-toast";

// Extend the Branch type to allow for our fallback branches
interface ExtendedBranch extends Omit<Branch, "created_at" | "updated_at"> {
  created_at: string | null;
  updated_at: string | null;
  active?: boolean;
}

interface BranchContextType {
  branches: ExtendedBranch[];
  currentBranch: ExtendedBranch | null;
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
  const [branches, setBranches] = useState<ExtendedBranch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<ExtendedBranch | null>(
    null
  );
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [branchLoadError, setBranchLoadError] = useState(false);

  // Define the load branches function that can be called elsewhere
  const loadBranches = async () => {
    try {
      setIsLoadingBranches(true);
      setBranchLoadError(false);

      // In development mode, use mock branches directly
      if (process.env.NODE_ENV === "development") {
        console.log("Using mock branches data");
        setBranches(MOCK_BRANCHES as ExtendedBranch[]);
        setCurrentBranch(MOCK_BRANCHES[0] as ExtendedBranch);
        setBranchLoadError(false);
        setIsLoadingBranches(false);
        return;
      }

      // Add fallback branches if there's an issue loading from the server
      const fallbackBranches: ExtendedBranch[] = [
        {
          id: "branch1",
          name: "Hafith",
          address: "Hafith Location",
          active: true,
          created_at: null,
          updated_at: null,
        },
        {
          id: "branch2",
          name: "Abu-Dhurus",
          address: "Abu-Dhurus Location",
          active: true,
          created_at: null,
          updated_at: null,
        },
      ];

      // In production, try to fetch branches but this isn't implemented yet
      // This will need to be updated when connecting to Supabase
      console.warn("Fetching branches from API not implemented yet");
      setBranches(fallbackBranches);
      setCurrentBranch(fallbackBranches[0]);
    } catch (error) {
      console.error("Error loading branches:", error);
      const fallbackBranches: ExtendedBranch[] = [
        {
          id: "branch1",
          name: "Hafith",
          address: "Hafith Location",
          active: true,
          created_at: null,
          updated_at: null,
        },
        {
          id: "branch2",
          name: "Abu-Dhurus",
          address: "Abu-Dhurus Location",
          active: true,
          created_at: null,
          updated_at: null,
        },
      ];
      setBranches(fallbackBranches);
      setCurrentBranch(fallbackBranches[0]);
      setBranchLoadError(true);

      toast({
        title: "Error loading branches",
        description:
          "Using fallback branch data instead. Some features may be limited.",
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
