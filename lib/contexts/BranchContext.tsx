"use client";

import {
  createContext,
  useState,
  useContext,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import { createClient } from "@/supabase/client";
import { toast } from "@/components/ui/use-toast";

// Define branch type since branches table no longer exists
type DbBranch = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
};

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

  // Add stability to prevent unnecessary re-renders
  const stableBranches = useMemo(() => branches, [JSON.stringify(branches)]);

  // Load branches from database using the fetchBranches service
  const loadBranches = async () => {
    try {
      setIsLoadingBranches(true);
      setBranchLoadError(false);

      console.log(
        "🏢 Loading real branches from database via fetchBranches service..."
      );

      // Import fetchBranches function
      const { fetchBranches } = await import("@/lib/services/inventoryService");

      // Fetch real branches from database
      const realBranches = await fetchBranches();

      if (realBranches && realBranches.length > 0) {
        // Transform branch data to match DbBranch interface
        const dbBranches: DbBranch[] = realBranches.map((branch) => ({
          id: branch.id,
          name: branch.name,
          address: branch.address || null,
          phone: null, // Not available in current schema
          email: null, // Not available in current schema
          is_active: true,
          created_at: branch.created_at || new Date().toISOString(),
        }));

        console.log(
          "✅ Successfully loaded branches:",
          dbBranches.map((b) => ({ id: b.id, name: b.name }))
        );
        setBranches(dbBranches);

        // Set first branch as default if none selected or saved branch doesn't exist
        const savedBranchId = localStorage.getItem("selectedBranchId");
        const savedBranch = dbBranches.find((b) => b.id === savedBranchId);

        // Clear localStorage to force default to Sanaiya (which has inventory data)
        if (savedBranchId && !savedBranch) {
          localStorage.removeItem("selectedBranchId");
          console.log("🧹 Cleared invalid saved branch ID from localStorage");
        }

        if (!currentBranch || !savedBranch) {
          // Set Sanaiya as default since it has inventory data
          const sanaiyaBranch = dbBranches.find((b) =>
            b.name.toLowerCase().includes("sanaiya")
          );
          const defaultBranch = sanaiyaBranch || dbBranches[0];
          setCurrentBranch(defaultBranch);
          localStorage.setItem("selectedBranchId", defaultBranch.id);
          console.log(
            `🏢 Set default branch to: ${defaultBranch.name} (${defaultBranch.id})`
          );
        }

        setBranchLoadError(false);
      } else {
        throw new Error("No branches returned from database");
      }
    } catch (error) {
      console.error("❌ Error loading branches from database:", error);

      // Fallback to mock data with real database UUIDs as last resort
      const fallbackBranches: DbBranch[] = [
        {
          id: "93922a5e-5327-4561-8395-97a4653c720c", // Real Hafith location ID from database
          name: "Hafith",
          address: "Hafith Area, Al Ain",
          phone: "+971-3-711-2345",
          email: "hafith@hnsautomotive.com",
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "d2f3b51b-2e86-4c4b-831c-96b468bd48db", // Real Abudhurus location ID from database
          name: "Abu Dhurus",
          address: "Abu Dhurus Area, Al Ain",
          phone: "+971-3-711-2346",
          email: "abudhurus@hnsautomotive.com",
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "c4212c14-64f3-4c9e-aa0e-6317fa3e9c3c", // Real Sanaiya location ID from database
          name: "Sanaiya (HQ)",
          address: "Sanaiya Industrial Area, Al Ain",
          phone: "+971-3-711-2347",
          email: "sanaiya@hnsautomotive.com",
          is_active: true,
          created_at: new Date().toISOString(),
        },
      ];

      console.warn("⚠️ Using fallback branch data with valid UUIDs");
      setBranches(fallbackBranches);

      // Set Sanaiya as default if none selected (since it has inventory data)
      if (!currentBranch) {
        const sanaiyaFallback = fallbackBranches.find((b) =>
          b.name.toLowerCase().includes("sanaiya")
        );
        const defaultBranch = sanaiyaFallback || fallbackBranches[0];
        setCurrentBranch(defaultBranch);
        localStorage.setItem("selectedBranchId", defaultBranch.id);
        console.log(
          `🏢 Set fallback default branch to: ${defaultBranch.name} (${defaultBranch.id})`
        );
      }

      setBranchLoadError(true);

      // Show error toast to user
      const { toast } = await import("@/components/ui/use-toast");
      toast({
        title: "Error loading locations",
        description:
          "Using fallback location data. Some features may be limited.",
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

      console.log(`✅ Switched to branch: ${branch.name} (${branch.id})`);

      toast({
        title: "Location Selected",
        description: `Switched to ${branch.name}`,
      });
    } else {
      console.error(`❌ Branch with ID ${branchId} not found`);

      toast({
        title: "Error",
        description: `Location with ID ${branchId} not found`,
        variant: "destructive",
      });
    }
  };

  const retryLoadBranches = async () => {
    await loadBranches();
  };

  const contextValue = useMemo(
    () => ({
      branches: stableBranches,
      currentBranch,
      isLoadingBranches,
      selectBranch,
      retryLoadBranches,
      branchLoadError,
    }),
    [
      stableBranches,
      currentBranch,
      isLoadingBranches,
      selectBranch,
      retryLoadBranches,
      branchLoadError,
    ]
  );

  return (
    <BranchContext.Provider value={contextValue}>
      {children}
    </BranchContext.Provider>
  );
}
