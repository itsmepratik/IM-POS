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
import { useUser } from "@/app/user-context";

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
  inventoryLocationId: string | null; // Location ID to use for inventory queries
  isBranchLocked: boolean; // Whether branch selection is locked for current user
}

const BranchContext = createContext<BranchContextType>({
  branches: [],
  currentBranch: null,
  isLoadingBranches: true,
  selectBranch: () => {},
  retryLoadBranches: async () => {},
  branchLoadError: false,
  inventoryLocationId: null,
  isBranchLocked: false,
});

export function useBranch() {
  return useContext(BranchContext);
}

export function BranchProvider({ children }: { children: ReactNode }) {
  const [branches, setBranches] = useState<DbBranch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<DbBranch | null>(null);
  const [isLoadingBranches, setIsLoadingBranches] = useState(true);
  const [branchLoadError, setBranchLoadError] = useState(false);
  const [inventoryLocationId, setInventoryLocationId] = useState<string | null>(null);
  const [isBranchLocked, setIsBranchLocked] = useState(false);
  const [userShopDisplayName, setUserShopDisplayName] = useState<string | null>(null);

  const supabase = createClient();
  const { currentUser, isAdmin } = useUser();

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

      // Fetch current user's profile to check for shop assignment
      let userProfile: {
        shop_id: string | null;
        role: string;
        is_admin: boolean;
      } | null = null;

      if (currentUser) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from("user_profiles")
            .select("shop_id, role, is_admin")
            .eq("id", currentUser.id)
            .single();

          if (!profileError && profileData) {
            userProfile = profileData;
            console.log("👤 User profile loaded:", {
              shop_id: userProfile.shop_id,
              role: userProfile.role,
              is_admin: userProfile.is_admin,
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }

      // Import fetchShops function (now uses shops table)
      const { fetchShops } = await import("@/lib/services/inventoryService");

      // Fetch shops from database
      const shops = await fetchShops();

      if (shops && shops.length > 0) {
        // Transform shops to DbBranch format
        let dbBranches: DbBranch[] = shops.map((shop) => ({
          id: shop.id,
          name: shop.displayName || shop.name,
          address: shop.locationName || null,
          phone: null,
          email: null,
          is_active: shop.isActive,
          created_at: new Date().toISOString(),
        }));

        // Check if user is admin
        const userIsAdmin = userProfile?.is_admin || userProfile?.role === "admin" || isAdmin();

        // If user is shop and has shop_id, filter and lock branches
        if (!userIsAdmin && userProfile?.shop_id) {
          // Filter branches to show only assigned shop
          dbBranches = dbBranches.filter((b) => b.id === userProfile!.shop_id);
          
          // Lock branch selection
          setIsBranchLocked(true);
          
          // Set inventory location ID from shop's location_id
          const assignedShop = shops.find((s) => s.id === userProfile!.shop_id);
          if (assignedShop) {
            setInventoryLocationId(assignedShop.locationId);
            console.log(
              `📦 Shop user: Set inventory location to ${assignedShop.locationName} (${assignedShop.locationId})`
            );
          }

          // Automatically set branch to shop_id
          const assignedBranch = dbBranches.find((b) => b.id === userProfile!.shop_id);
          if (assignedBranch) {
            setCurrentBranch(assignedBranch);
            localStorage.setItem("selectedBranchId", assignedBranch.id);
            console.log(
              `🔒 Locked branch to: ${assignedBranch.name} (${assignedBranch.id}) for shop user`
            );
          }
          
          setBranchLoadError(false);
          return;
        } else {
          // Admin users can access all shops
          setIsBranchLocked(false);
          setUserShopDisplayName(null);
        }

        console.log(
          "✅ Successfully loaded branches:",
          dbBranches.map((b) => ({ id: b.id, name: b.name }))
        );
        setBranches(dbBranches);

        // Set first branch as default if none selected or saved branch doesn't exist (only for admin)
        if (!userIsAdmin && userProfile?.shop_location_id) {
          // Already handled above for shop users
          setBranchLoadError(false);
          return;
        }

        const savedBranchId = localStorage.getItem("selectedBranchId");
        const savedBranch = savedBranchId ? dbBranches.find((b) => b.id === savedBranchId) : null;

        // Clear localStorage if saved branch doesn't exist
        if (savedBranchId && !savedBranch) {
          localStorage.removeItem("selectedBranchId");
          console.log("🧹 Cleared invalid saved branch ID from localStorage");
        }

        if (!currentBranch || !savedBranch) {
          // For admin: Set default to Saniya1 (first shop)
          if (userIsAdmin) {
            const saniya1Branch = dbBranches.find((b) =>
              b.name.toLowerCase().includes("saniya1")
            );
            const defaultBranch = saniya1Branch || dbBranches[0];
            setCurrentBranch(defaultBranch);
            localStorage.setItem("selectedBranchId", defaultBranch.id);
            
            // Set inventory location from shop's location_id
            const defaultShop = shops.find((s) => s.id === defaultBranch.id);
            if (defaultShop) {
              setInventoryLocationId(defaultShop.locationId);
              console.log(
                `📦 Admin defaulted to ${defaultBranch.name}: Set inventory location to ${defaultShop.locationName} (${defaultShop.locationId})`
              );
            }
            
            console.log(
              `🏢 Set default branch to: ${defaultBranch.name} (${defaultBranch.id})`
            );
          } else {
            // This shouldn't happen for shop users, but handle it just in case
            const defaultBranch = dbBranches[0];
            if (defaultBranch) {
              setCurrentBranch(defaultBranch);
              localStorage.setItem("selectedBranchId", defaultBranch.id);
            }
          }
        } else if (userIsAdmin && savedBranch) {
          // If admin has a saved branch, ensure inventory location is set correctly
          const savedShop = shops.find((s) => s.id === savedBranch.id);
          if (savedShop) {
            setInventoryLocationId(savedShop.locationId);
            console.log(
              `📦 Admin restored ${savedBranch.name}: Set inventory location to ${savedShop.locationName} (${savedShop.locationId})`
            );
          }
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
          id: "9c284f57-22db-40ce-9703-c5290d8769be", // Real Saniya1 location ID from database
          name: "Saniya1",
          address: "Saniya1 Shop, Al Ain",
          phone: "+971-3-711-2347",
          email: "saniya1@hnsautomotive.com",
          is_active: true,
          created_at: new Date().toISOString(),
        },
        {
          id: "5b0ee3e7-8a72-4747-8547-cf27f26974ee", // Real Saniya2 location ID from database
          name: "Saniya2",
          address: "Saniya2 Shop, Al Ain",
          phone: "+971-3-711-2348",
          email: "saniya2@hnsautomotive.com",
          is_active: true,
          created_at: new Date().toISOString(),
        },
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
      ];

      console.warn("⚠️ Using fallback branch data with valid UUIDs");
      
      // Filter out Sanaiya from fallback branches for admin users
      let filteredFallbackBranches = fallbackBranches;
      if (userIsAdmin) {
        filteredFallbackBranches = fallbackBranches.filter((b) => 
          b.name.toLowerCase().trim() !== "sanaiya"
        );
      }
      
      setBranches(filteredFallbackBranches);

      // Set Saniya1 as default if none selected (for admin) or shop location (for shop users)
      if (!currentBranch) {
        if (userIsAdmin) {
          const saniya1Fallback = filteredFallbackBranches.find((b) =>
            b.name.toLowerCase().includes("saniya1")
          );
          const defaultBranch = saniya1Fallback || filteredFallbackBranches[0];
          setCurrentBranch(defaultBranch);
          localStorage.setItem("selectedBranchId", defaultBranch.id);
          console.log(
            `🏢 Set fallback default branch to: ${defaultBranch.name} (${defaultBranch.id})`
          );
        } else if (userProfile?.shop_location_id) {
          // For shop users, use their assigned shop location
          const shopBranch = filteredFallbackBranches.find((b) => 
            b.id === userProfile.shop_location_id
          );
          if (shopBranch) {
            setCurrentBranch(shopBranch);
            localStorage.setItem("selectedBranchId", shopBranch.id);
          }
        }
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
    // Wait for user to be loaded before loading branches
    if (currentUser !== undefined) {
      loadBranches();
    }
  }, [currentUser]);

  // Restore selected branch when branches are loaded
  useEffect(() => {
    const savedBranchId = localStorage.getItem("selectedBranchId");
    if (savedBranchId && branches.length > 0 && !currentBranch) {
      selectBranch(savedBranchId);
    }
  }, [branches]); // Run when branches are loaded

  const selectBranch = (branchId: string) => {
    // Prevent non-admin users from changing branch if locked
    if (isBranchLocked) {
      const userIsAdmin = currentUser?.role === "admin" || isAdmin();
      if (!userIsAdmin) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to change locations. Please contact an administrator.",
          variant: "destructive",
        });
        console.warn("⚠️ Shop user attempted to change branch while locked");
        return;
      }
    }

    const branch = branches.find((b) => b.id === branchId);
    if (branch) {
      // For admin: Derive inventory location from shop's location_id
      const userIsAdmin = currentUser?.role === "admin" || isAdmin();
      if (userIsAdmin) {
        // Fetch shop to get location_id
        const fetchShopLocation = async () => {
          try {
            const { fetchShops } = await import("@/lib/services/inventoryService");
            const shops = await fetchShops();
            const selectedShop = shops.find((s) => s.id === branchId);
            if (selectedShop) {
              setInventoryLocationId(selectedShop.locationId);
              console.log(
                `📦 Admin selected ${branch.name}: Set inventory location to ${selectedShop.locationName} (${selectedShop.locationId})`
              );
            }
          } catch (error) {
            console.error("Error fetching shop location:", error);
          }
        };
        fetchShopLocation();
      }

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
      inventoryLocationId,
      isBranchLocked,
    }),
    [
      stableBranches,
      currentBranch,
      isLoadingBranches,
      selectBranch,
      retryLoadBranches,
      branchLoadError,
      inventoryLocationId,
      isBranchLocked,
    ]
  );

  return (
    <BranchContext.Provider value={contextValue}>
      {children}
    </BranchContext.Provider>
  );
}
