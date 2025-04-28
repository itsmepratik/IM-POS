"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { Branch, fetchBranches } from "@/lib/services/inventoryService";

interface BranchContextType {
  branches: Branch[];
  currentBranch: Branch | null;
  isLoadingBranches: boolean;
  selectBranch: (branchId: string) => void;
}

const BranchContext = createContext<BranchContextType>({
  branches: [],
  currentBranch: null,
  isLoadingBranches: true,
  selectBranch: () => {},
});

export function useBranch() {
  return useContext(BranchContext);
}

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<Branch | null>(null);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        setIsLoadingBranches(true);
        const branchData = await fetchBranches();
        setBranches(branchData);

        // Set the main branch as the default selected branch
        const mainBranch = branchData.find(
          (b) => b.id === "00000000-0000-0000-0000-000000000000"
        );

        if (mainBranch) {
          setCurrentBranch(mainBranch);
        } else if (branchData.length > 0) {
          setCurrentBranch(branchData[0]);
        }
      } catch (error) {
        console.error("Error loading branches:", error);
      } finally {
        setIsLoadingBranches(false);
      }
    };

    loadBranches();
  }, []);

  const selectBranch = (branchId: string) => {
    const branch = branches.find((b) => b.id === branchId);
    if (branch) {
      setCurrentBranch(branch);
    }
  };

  return (
    <BranchContext.Provider
      value={{
        branches,
        currentBranch,
        isLoadingBranches,
        selectBranch,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}
