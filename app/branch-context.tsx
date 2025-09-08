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

      console.log("🏢 Loading real branches from Supabase...");
      
      // Import fetchBranches function
      const { fetchBranches } = await import("@/lib/services/inventoryService");
      
      // Fetch real branches from Supabase
      const realBranches = await fetchBranches();
      
      if (realBranches && realBranches.length > 0) {
        console.log("✅ Successfully loaded branches:", realBranches.map(b => ({id: b.id, name: b.name})));
        setBranches(realBranches as ExtendedBranch[]);
        setCurrentBranch(realBranches[0] as ExtendedBranch);
        setBranchLoadError(false);
      } else {
        throw new Error("No branches returned from database");
      }
    } catch (error) {
      console.error("❌ Error loading branches:", error);
      
      // Fallback to mock data with real-looking IDs for development
      const fallbackBranches: ExtendedBranch[] = [
        {
          id: "8ae59a0c-1821-4ec0-b913-1900fdcaf7a1",
          name: "Hafith",
          address: "Hafith Area, Al Ain",
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "11fb9800-37ec-41af-b034-c8bbbd8c4b3c",
          name: "Abu Dhurus",
          address: "Abu Dhurus Area, Al Ain",
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: "01be3937-6c8a-4460-880d-a5da6fe6895b",
          name: "Sanaiya (HQ)",
          address: "Sanaiya Industrial Area, Al Ain",
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      
      console.warn("⚠️ Using fallback branch data with real IDs");
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
