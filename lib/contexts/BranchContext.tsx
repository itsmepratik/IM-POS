"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";
import { toast } from "@/components/ui/use-toast";

type DbBranch = Database["public"]["Tables"]["branches"]["Row"];

interface BranchContextType {
  branches: DbBranch[];
  currentBranch: DbBranch | null;
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
  const [branches, setBranches] = useState<DbBranch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<DbBranch | null>(null);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [branchLoadError, setBranchLoadError] = useState(false);

  const supabase = createClient();

  // Load branches from Supabase
  const loadBranches = async () => {
    try {
      setIsLoadingBranches(true);
      setBranchLoadError(false);

      const { data: branchesData, error } = await supabase
        .from("branches")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error("Error fetching branches:", error);
        throw error;
      }

      if (branchesData && branchesData.length > 0) {
        setBranches(branchesData);

        // Set first branch as default if none selected
        if (!currentBranch) {
          setCurrentBranch(branchesData[0]);
          localStorage.setItem("selectedBranchId", branchesData[0].id);
        }
      } else {
        throw new Error("No active branches found");
      }
    } catch (error) {
      console.error("Error loading branches:", error);

      // Fallback to default branches if database fails
      const fallbackBranches: DbBranch[] = [
        {
          id: "fallback-downtown",
          name: "Downtown Branch",
          address: "123 Main Street, Downtown",
          phone: "+1-555-0101",
          email: "downtown@posstore.com",
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "fallback-mall",
          name: "Mall Branch",
          address: "456 Shopping Mall, Level 2",
          phone: "+1-555-0102",
          email: "mall@posstore.com",
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "fallback-suburban",
          name: "Suburban Branch",
          address: "789 Suburban Ave, Plaza",
          phone: "+1-555-0103",
          email: "suburban@posstore.com",
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ];

      setBranches(fallbackBranches);
      setCurrentBranch(fallbackBranches[0]);
      setBranchLoadError(true);

      toast({
        title: "Database Connection Issue",
        description: "Using offline branch data. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBranches(false);
    }
  };

  // Load branches and restore selected branch on mount
  useEffect(() => {
    loadBranches();
  }, []);

  // Restore selected branch when branches are loaded
  useEffect(() => {
    const savedBranchId = localStorage.getItem("selectedBranchId");
    if (savedBranchId && branches.length > 0 && !currentBranch) {
      selectBranch(savedBranchId);
    }
  }, [branches]); // Run when branches are loaded

  const selectBranch = (branchId: string) => {
    const branch = branches.find((b) => b.id === branchId);
    if (branch) {
      setCurrentBranch(branch);
      localStorage.setItem("selectedBranchId", branchId);

      toast({
        title: "Branch Selected",
        description: `Switched to ${branch.name}`,
      });
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
