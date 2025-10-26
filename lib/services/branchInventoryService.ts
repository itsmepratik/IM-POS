// Type definitions
export type Item = {
  id: string;
  name: string;
  price: number;
  stock?: number;
  bottleStates?: BottleStates;
  category?: string;
  brand?: string;
  brand_id: string | null;
  category_id: string | null;
  type: string | null;
  description: string | null;
  is_oil: boolean | null;
  isOil?: boolean;
  imageUrl?: string;
  image_url: string | null;
  volumes?: Volume[];
  batches?: Batch[];
  created_at: string | null;
  updated_at: string | null;
  lowStockAlert?: number;
  isBattery?: boolean;
  batteryState?: "new" | "scrap" | "resellable" | "warranty";
};

export type Volume = {
  id: string;
  item_id: string;
  size: string;
  price: number;
  created_at: string | null;
  updated_at: string | null;
};

export type Batch = {
  id: string;
  item_id: string;
  purchase_date: string | null;
  expiration_date: string | null;
  supplier_id: string | null;
  cost_price: number | null;
  initial_quantity: number | null;
  current_quantity: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export type BottleStates = {
  open: number;
  closed: number;
};

// Mock data for branch inventory
const MOCK_INVENTORY: Record<string, Item[]> = {
  // Branch 1 (Abu Dhurus)
  "1": [
    {
      id: "1",
      name: "Engine Lubricant 5W-30",
      price: 29.99,
      stock: 45,
      category: "Lubricants",
      brand: "Castrol",
      type: "Synthetic",
      sku: "OIL-5W30-CAS",
      description: "Fully synthetic engine oil for modern engines",
      brand_id: "1",
      category_id: "1",
      is_oil: true,
      isOil: true,
      imageUrl: "/placeholders/oil.jpg",
      image_url: "/placeholders/oil.jpg",
      volumes: [
        {
          id: "v1",
          item_id: "1",
          size: "1L",
          price: 12.99,
          created_at: null,
          updated_at: null,
        },
        {
          id: "v2",
          item_id: "1",
          size: "4L",
          price: 29.99,
          created_at: null,
          updated_at: null,
        },
        {
          id: "v3",
          item_id: "1",
          size: "5L",
          price: 34.99,
          created_at: null,
          updated_at: null,
        },
      ],
      bottleStates: { open: 3, closed: 42 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "3",
      name: "Oil Filter",
      price: 12.99,
      stock: 65,
      category: "Filters",
      brand: "Bosch",
      type: "Regular",
      sku: "FIL-OIL-BOSCH",
      description: "Standard oil filter for most vehicles",
      brand_id: "3",
      category_id: "2",
      is_oil: false,
      isOil: false,
      imageUrl: "/placeholders/filter.jpg",
      image_url: "/placeholders/filter.jpg",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],

  // Branch 2 (Hafeet Branch)
  "2": [
    {
      id: "2",
      name: "Engine Lubricant 10W-40",
      price: 24.99,
      stock: 8,
      category: "Lubricants",
      brand: "Mobil",
      type: "Semi-Synthetic",
      sku: "OIL-10W40-MOB",
      description: "Semi-synthetic engine oil for older engines",
      brand_id: "2",
      category_id: "1",
      is_oil: true,
      isOil: true,
      imageUrl: "/placeholders/oil.jpg",
      image_url: "/placeholders/oil.jpg",
      volumes: [
        {
          id: "v4",
          item_id: "2",
          size: "1L",
          price: 9.99,
          created_at: null,
          updated_at: null,
        },
        {
          id: "v5",
          item_id: "2",
          size: "4L",
          price: 24.99,
          created_at: null,
          updated_at: null,
        },
      ],
      bottleStates: { open: 2, closed: 6 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],

  // Branch 3 (West Side Branch)
  "3": [
    {
      id: "4",
      name: "Air Filter",
      price: 18.99,
      stock: 32,
      category: "Filters",
      brand: "K&N",
      type: "Performance",
      sku: "FIL-AIR-KN",
      description: "High-flow air filter for improved performance",
      brand_id: "4",
      category_id: "2",
      is_oil: false,
      isOil: false,
      imageUrl: "/placeholders/filter.jpg",
      image_url: "/placeholders/filter.jpg",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
};

/**
 * Normalizes an item to ensure consistent field names
 * @param item The item to normalize
 * @returns The normalized item
 */
export const normalizeItem = (
  item: Partial<Item> | Record<string, unknown>
): Item => {
  const { is_oil, image_url, description, ...rest } = item as Record<
    string,
    unknown
  >;

  // Cast rest to Record<string, unknown> for type safety
  const restRecord = rest as Record<string, unknown>;

  // Create a base object with the required properties
  const normalizedItem: Partial<Item> = {
    ...rest,
    is_oil: typeof is_oil === "boolean" ? is_oil : false,
    isOil: typeof is_oil === "boolean" ? is_oil : false,
    image_url: (image_url as string | null) ?? null,
    imageUrl:
      (image_url as string | null) ??
      (restRecord.imageUrl as string | null) ??
      null,
    description: (description as string | null) ?? null,
    notes:
      (description as string | null) ??
      (restRecord.notes as string | null) ??
      null,
    // Ensure required Item properties have default values
    brand_id: (restRecord.brand_id as string) ?? null,
    category_id: (restRecord.category_id as string) ?? null,
    created_at: (restRecord.created_at as string) ?? null,
    updated_at: (restRecord.updated_at as string) ?? null,
    type: (restRecord.type as string) ?? null,
    sku: (restRecord.sku as string) ?? null,
    lowStockAlert:
      typeof restRecord.lowStockAlert === "number"
        ? (restRecord.lowStockAlert as number)
        : 5,

    // Default values for required properties that might be missing
    id: (restRecord.id as string) || "unknown-id",
    name: (restRecord.name as string) || "Unknown Item",
    price:
      typeof restRecord.price === "number" ? (restRecord.price as number) : 0,
  };

  return normalizedItem as Item;
};

/**
 * Fetches inventory items for a specific branch
 * @param branchId The ID of the branch to fetch inventory for
 * @returns Array of inventory items for the specified branch
 */
export const fetchBranchInventory = async (
  branchId: string
): Promise<Item[]> => {
  try {
    console.log("Fetching inventory for branch ID:", branchId);

    // Add a delay to simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Get mock data for the branch
    const items = MOCK_INVENTORY[branchId] || [];

    // Return normalized items
    return items.map((item) => normalizeItem(item));
  } catch (error) {
    console.error("Error in fetchBranchInventory:", error);
    return [];
  }
};

/**
 * Deletes an inventory item from a branch
 * @param itemId The ID of the item to delete
 * @param branchId The ID of the branch
 * @returns Boolean indicating whether the operation was successful
 */
export const deleteBranchItem = async (
  itemId: string,
  branchId?: string
): Promise<boolean> => {
  try {
    console.log(`Deleting item ${itemId} from branch ${branchId} (mock)`);

    // Add a delay to simulate API call
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (branchId && MOCK_INVENTORY[branchId]) {
      // Remove the item from the branch's inventory (if it exists)
      const initialLength = MOCK_INVENTORY[branchId].length;
      MOCK_INVENTORY[branchId] = MOCK_INVENTORY[branchId].filter(
        (item) => item.id !== itemId
      );
      return MOCK_INVENTORY[branchId].length < initialLength;
    }

    // If no branchId provided, delete from all branches
    let deletedAny = false;
    Object.keys(MOCK_INVENTORY).forEach((branch) => {
      const initialLength = MOCK_INVENTORY[branch].length;
      MOCK_INVENTORY[branch] = MOCK_INVENTORY[branch].filter(
        (item) => item.id !== itemId
      );
      if (MOCK_INVENTORY[branch].length < initialLength) {
        deletedAny = true;
      }
    });

    return deletedAny;
  } catch (error) {
    console.error("Error in deleteBranchItem:", error);
    return false;
  }
};

/**
 * Updates the quantity of an item in a branch's inventory
 * @param itemId The ID of the item to update
 * @param branchId The ID of the branch
 * @param quantity The new quantity
 * @returns Boolean indicating whether the operation was successful
 */
export const updateBranchItemQuantity = async (
  itemId: string,
  branchId: string,
  quantity: number
): Promise<boolean> => {
  try {
    console.log(
      `Updating quantity for item ${itemId} in branch ${branchId} to ${quantity} (mock)`
    );

    // Add a delay to simulate API call
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (MOCK_INVENTORY[branchId]) {
      const itemIndex = MOCK_INVENTORY[branchId].findIndex(
        (item) => item.id === itemId
      );
      if (itemIndex >= 0) {
        MOCK_INVENTORY[branchId][itemIndex] = {
          ...MOCK_INVENTORY[branchId][itemIndex],
          stock: quantity,
          updated_at: new Date().toISOString(),
        };
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error in updateBranchItemQuantity:", error);
    return false;
  }
};

/**
 * Updates the bottle states (open/closed) for an oil product in a branch
 * @param itemId The ID of the oil item
 * @param branchId The ID of the branch
 * @param openBottles The number of open bottles
 * @param closedBottles The number of closed bottles
 * @returns Boolean indicating whether the operation was successful
 */
export const updateBranchBottleStates = async (
  itemId: string,
  branchId: string,
  openBottles: number,
  closedBottles: number
): Promise<boolean> => {
  try {
    console.log(
      `Updating bottle states for item ${itemId} in branch ${branchId}: open=${openBottles}, closed=${closedBottles} (mock)`
    );

    // Add a delay to simulate API call
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (MOCK_INVENTORY[branchId]) {
      const itemIndex = MOCK_INVENTORY[branchId].findIndex(
        (item) => item.id === itemId
      );
      if (itemIndex >= 0 && MOCK_INVENTORY[branchId][itemIndex].is_oil) {
        MOCK_INVENTORY[branchId][itemIndex] = {
          ...MOCK_INVENTORY[branchId][itemIndex],
          bottleStates: { open: openBottles, closed: closedBottles },
          stock: openBottles + closedBottles,
          updated_at: new Date().toISOString(),
        };
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Error in updateBranchBottleStates:", error);
    return false;
  }
};
