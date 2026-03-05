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
import { useUser } from "@/lib/contexts/UserContext";

// Define branch type since branches table no longer exists
export type DbBranch = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;

  // Bill Header Details (Added for dynamic bill customization)
  company_name?: string;
  company_name_arabic?: string;
  cr_number?: string;
  address_line_1?: string;
  address_line_2?: string;
  address_line_3?: string;
  address_line_arabic_1?: string;
  address_line_arabic_2?: string;
  contact_number?: string;
  contact_number_arabic?: string;

  // Extended Bill Details
  service_description_en?: string;
  service_description_ar?: string;
  thank_you_message?: string;
  thank_you_message_ar?: string;
  brand_name?: string;
  brand_address?: string;
  brand_phones?: string;
  brand_whatsapp?: string;
  pos_id?: string;
};

interface BranchContextType {
  branches: DbBranch[];
  currentBranch: DbBranch | null;
  isLoadingBranches: boolean;
  selectBranch: (branchId: string) => void;
  refreshBranches: () => Promise<void>;
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
  refreshBranches: async () => {},
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
  const [inventoryLocationId, setInventoryLocationId] = useState<string | null>(
    null,
  );
  const [isBranchLocked, setIsBranchLocked] = useState(false);
  const [userShopDisplayName, setUserShopDisplayName] = useState<string | null>(
    null,
  );

  const supabase = createClient();
  const { currentUser, isAdmin, isLoading: isLoadingUser } = useUser();

  // Load branches from database using the fetchBranches service
  const loadBranches = async () => {
    // Define userProfile here to be accessible in catch block
    let userProfile: {
      shop_id: string | null;
      role: string;
      is_admin: boolean;
    } | null = null;

    try {
      setIsLoadingBranches(true);
      setBranchLoadError(false);

      // Fetch current user's profile to check for shop assignment

      // Fetch current user's profile to check for shop assignment
      if (currentUser) {
        try {
          const { data: profileData, error: profileError } = await supabase
            .from("user_profiles")
            .select("shop_id, role, is_admin")
            .eq("id", currentUser.id)
            .single();

          if (!profileError && profileData) {
            userProfile = profileData;
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

          // Map new extended fields
          company_name: shop.company_name || undefined,
          company_name_arabic: shop.company_name_arabic || undefined,
          cr_number: shop.cr_number || undefined,
          address_line_1: shop.address_line_1 || undefined,
          address_line_2: shop.address_line_2 || undefined,
          address_line_3: shop.address_line_3 || undefined,
          address_line_arabic_1: shop.address_line_arabic_1 || undefined,
          address_line_arabic_2: shop.address_line_arabic_2 || undefined,
          contact_number: shop.contact_number || undefined,
          contact_number_arabic: shop.contact_number_arabic || undefined,
          service_description_en: shop.service_description_en || undefined,
          service_description_ar: shop.service_description_ar || undefined,
          thank_you_message: shop.thank_you_message || undefined,
          thank_you_message_ar: shop.thank_you_message_ar || undefined,
          brand_name: shop.brand_name || undefined,
          brand_address: shop.brand_address || undefined,
          brand_phones: shop.brand_phones || undefined,
          brand_whatsapp: shop.brand_whatsapp || undefined,
          pos_id: shop.pos_id || undefined,
        }));

        // PRIORITY 1: Check for email pattern matching (e.g. sanaiya1@hnsautomotive.com)
        // This overrides everything else if matched
        if (
          currentUser?.email &&
          currentUser.email.endsWith("@hnsautomotive.com")
        ) {
          const emailParts = currentUser.email.split("@");
          if (emailParts.length > 0) {
            const potentialShopName = emailParts[0].toLowerCase();

            // Try to find a matching shop
            // We check if the shop name matches, or if it's contained in the shop name
            // e.g. "sanaiya1" matches "Sanaiya1" or "Al Ain Sanaiya 1"
            const matchedBranch = dbBranches.find(
              (b) =>
                b.name.toLowerCase().replace(/\s+/g, "") ===
                  potentialShopName ||
                b.name.toLowerCase().includes(potentialShopName) ||
                // Handle edge cases like 'saniya1' in email vs 'sanaiya1' in DB if needed,
                // but for now strict partial match is safer.
                (potentialShopName === "saniya1" &&
                  b.name.toLowerCase().includes("sanaiya1")) ||
                (potentialShopName === "saniya2" &&
                  b.name.toLowerCase().includes("sanaiya2")),
            );

            // Admin override check inside this block to ensure admins with matching emails aren't locked if we don't want them to be.
            // But requirement says "basically all the shop accounts locked to their shops".
            // If I am "sanaiya1@hnsautomotive.com", I should be locked to Sanaiya1.
            // Admin role usually comes from user_profiles.
            // Let's assume if you have a specific shop email, you ARE that shop's user, regardless of other roles,
            // UNLESS you are explicitly global admin.
            // Let's check admin status just in case to avoid locking a super admin who happens to have a shop-like email?
            // Actually, the user request says 'shops like sanaiya1 will be preselected and locked'.
            // So if I am admin but my email is sanaiya1@..., I probably still want to be locked?
            // No, admin should be able to switch.
            // Let's check if the user is ACTUALLY an admin role in DB.

            const isRealAdmin =
              userProfile?.role === "admin" ||
              userProfile?.is_admin === true ||
              isAdmin();

            if (matchedBranch && !isRealAdmin) {
              // Filter branches to show only assigned shop
              dbBranches = dbBranches.filter((b) => b.id === matchedBranch.id);

              // Lock branch selection
              setIsBranchLocked(true);

              // Set inventory location ID from shop's location_id
              const assignedShop = shops.find((s) => s.id === matchedBranch.id);
              if (assignedShop) {
                setInventoryLocationId(assignedShop.locationId);
              }

              // Automatically set branch
              setCurrentBranch(matchedBranch);
              localStorage.setItem("selectedBranchId", matchedBranch.id);
              document.cookie = `pos_branch_id=${matchedBranch.id}; path=/; max-age=31536000; SameSite=Lax`;

              // Update state and return early
              setBranches(dbBranches);
              setBranchLoadError(false);
              setIsLoadingBranches(false);
              return;
            }
          }
        }

        // Check if user is admin - moved up to be accessible in scope
        const userIsAdmin =
          userProfile?.is_admin || userProfile?.role === "admin" || isAdmin();

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
          }

          // Automatically set branch to shop_id
          const assignedBranch = dbBranches.find(
            (b) => b.id === userProfile!.shop_id,
          );
          if (assignedBranch) {
            setCurrentBranch(assignedBranch);
            localStorage.setItem("selectedBranchId", assignedBranch.id);
          }

          setBranchLoadError(false);
          return;
        } else {
          // Admin users can access all shops
          setIsBranchLocked(false);
          setUserShopDisplayName(null);
        }
        setBranches(dbBranches);

        // FOR ADMINS: Always default to Sanaiya1, ignore localStorage
        if (userIsAdmin) {
          const saniya1Branch = dbBranches.find(
            (b) =>
              b.name.toLowerCase().includes("saniya1") ||
              b.name.toLowerCase().includes("sanaiya1"),
          );
          const defaultBranch = saniya1Branch || dbBranches[0];

          // Validate that we are actually switching or setting
          if (!currentBranch || currentBranch.id !== defaultBranch.id) {
            setCurrentBranch(defaultBranch);
            // We DON'T load from localStorage for admins to ensure strict default
            // But we DO update localStorage so if they reload, it's consistent until they leave?
            // Wait, requirement is "always on sanaiya1 by default".
            // So we should OVERWRITE localStorage with Sanaiya1 ID.
            localStorage.setItem("selectedBranchId", defaultBranch.id);
          }

          // Set inventory location from shop's location_id
          const defaultShop = shops.find((s) => s.id === defaultBranch.id);
          if (defaultShop) {
            setInventoryLocationId(defaultShop.locationId);
          }
          setBranchLoadError(false);
          return;
        }

        // FOR NON-ADMINS (who are not shop locked? Should not happen based on logic, but fallback)
        const savedBranchId = localStorage.getItem("selectedBranchId");
        const savedBranch = savedBranchId
          ? dbBranches.find((b) => b.id === savedBranchId)
          : null;

        if (savedBranch) {
          setCurrentBranch(savedBranch);
          // Ensure inventory location is set correctly
          const savedShop = shops.find((s) => s.id === savedBranch.id);
          if (savedShop) {
            setInventoryLocationId(savedShop.locationId);
          }
        } else {
          // Default to first
          const defaultBranch = dbBranches[0];
          setCurrentBranch(defaultBranch);
          localStorage.setItem("selectedBranchId", defaultBranch.id);
          const defaultShop = shops.find((s) => s.id === defaultBranch.id);
          if (defaultShop) {
            setInventoryLocationId(defaultShop.locationId);
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

      // Check if user is admin again for fallback scope
      const isUserAdmin =
        userProfile?.is_admin || userProfile?.role === "admin" || isAdmin();

      // Filter out Sanaiya from fallback branches for admin users
      let filteredFallbackBranches = fallbackBranches;
      if (isUserAdmin) {
        filteredFallbackBranches = fallbackBranches.filter(
          (b) => b.name.toLowerCase().trim() !== "sanaiya",
        );
      }

      setBranches(filteredFallbackBranches);

      // Set Saniya1 as default if none selected (for admin) or shop location (for shop users)
      if (!currentBranch) {
        if (isUserAdmin) {
          const saniya1Fallback = filteredFallbackBranches.find((b) =>
            b.name.toLowerCase().includes("saniya1"),
          );
          const defaultBranch = saniya1Fallback || filteredFallbackBranches[0];
          setCurrentBranch(defaultBranch);
          localStorage.setItem("selectedBranchId", defaultBranch.id);
        } else if (userProfile?.shop_id) {
          // For shop users, use their assigned shop location
          const shopBranch = filteredFallbackBranches.find(
            (b) => b.id === userProfile?.shop_id,
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
    // Wait for user to be loaded before deciding what to do
    if (isLoadingUser) return;

    if (currentUser) {
      loadBranches();
    } else {
      // Clear state when user is logged out
      setBranches([]);
      setCurrentBranch(null);
      setInventoryLocationId(null);
      setIsBranchLocked(false);
      setBranchLoadError(false);
    }
  }, [currentUser, isLoadingUser]);

  // Restore selected branch when branches are loaded
  useEffect(() => {
    // Only restore for non-admin users who aren't shop users (edge case)?
    // Actually, logic inside loadBranches handles the enforcement for Admins.
    // So we just need to make sure this effect doesn't override it.

    // We can rely on 'currentBranch' being set by loadBranches for admins.
    // If currentBranch is already set, we don't need to do anything.
    if (!currentBranch && branches.length > 0) {
      const savedBranchId = localStorage.getItem("selectedBranchId");
      if (savedBranchId) {
        const userIsAdmin = currentUser?.role === "admin" || isAdmin();
        // If Admin, loadBranches should have already handled it. If we are here, something is odd,
        // but let's respect the loadBranches logic which doesn't rely on this effect for the enforcement.
        // Actually, if we are strictly enforcing Sanaiya1 for admins, we should NOT restore from local storage here if admin.

        if (!userIsAdmin) {
          selectBranch(savedBranchId);
        }
      }
    }
  }, [branches, currentBranch, currentUser, isAdmin]); // Run when branches are loaded

  const selectBranch = (branchId: string) => {
    // Prevent non-admin users from changing branch if locked
    if (isBranchLocked) {
      const userIsAdmin = currentUser?.role === "admin" || isAdmin();
      if (!userIsAdmin) {
        toast({
          title: "Access Denied",
          description:
            "You don't have permission to change locations. Please contact an administrator.",
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
            const { fetchShops } =
              await import("@/lib/services/inventoryService");
            const shops = await fetchShops();
            const selectedShop = shops.find((s) => s.id === branchId);
            if (selectedShop) {
              setInventoryLocationId(selectedShop.locationId);
            }
          } catch (error) {
            console.error("Error fetching shop location:", error);
          }
        };
        fetchShopLocation();
      }

      setCurrentBranch(branch);
      setCurrentBranch(branch);
      localStorage.setItem("selectedBranchId", branchId);
      // Set cookie for Server Component access (1 year expiry)
      document.cookie = `pos_branch_id=${branchId}; path=/; max-age=31536000; SameSite=Lax`;

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
      branches,
      currentBranch,
      isLoadingBranches,
      selectBranch,
      retryLoadBranches,
      refreshBranches: loadBranches,
      branchLoadError,
      inventoryLocationId,
      isBranchLocked,
    }),
    [
      branches,
      currentBranch,
      isLoadingBranches,
      selectBranch,
      retryLoadBranches,
      loadBranches,
      branchLoadError,
      inventoryLocationId,
      isBranchLocked,
    ],
  );

  return (
    <BranchContext.Provider value={contextValue}>
      {children}
    </BranchContext.Provider>
  );
}
