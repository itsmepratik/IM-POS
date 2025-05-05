"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { Branch, fetchBranches } from "@/lib/services/inventoryService";
import { toast } from "@/components/ui/use-toast";

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

  // Define the load branches function that can be called elsewhere
  const loadBranches = async () => {
    try {
      setIsLoadingBranches(true);
      setBranchLoadError(false);

      // Add fallback branches if there's an issue loading from the server
      const fallbackBranches: Branch[] = [
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

      try {
        const branchData = await fetchBranches();

        if (branchData && branchData.length > 0) {
          setBranches(branchData);

          // Set the branch - prefer non-main branches for the branch inventory page
          const branch1 = branchData.find((b) => b.id === "branch1");
          const branch2 = branchData.find((b) => b.id === "branch2");
          const mainBranch = branchData.find(
            (b) => b.id === "00000000-0000-0000-0000-000000000000"
          );

          // Try branch1 first, then branch2, then main branch
          if (branch1) {
            setCurrentBranch(branch1);
          } else if (branch2) {
            setCurrentBranch(branch2);
          } else if (mainBranch) {
            setCurrentBranch(mainBranch);
          } else if (branchData.length > 0) {
            setCurrentBranch(branchData[0]);
          }

          setBranchLoadError(false);
        } else {
          console.warn("No branches returned from server, using fallbacks");
          setBranches(fallbackBranches);
          setCurrentBranch(fallbackBranches[0]);
          setBranchLoadError(true);
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
        setBranches(fallbackBranches);
        setCurrentBranch(fallbackBranches[0]);
        setBranchLoadError(true);

        toast({
          title: "Error loading branches",
          description:
            "Using fallback branch data instead. Some features may be limited.",
          variant: "destructive",
        });
      }
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
