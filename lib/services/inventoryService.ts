import { createClient } from "@/supabase/client";

// Create a singleton Supabase client to prevent dynamic import issues
const supabase = createClient();

// Type definitions
// Type definition for Branch
export type Branch = {
  id: string;
  name: string;
  address: string;
  created_at: string;
  updated_at: string;
};

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
  batteryState?: "new" | "scrap" | "resellable";
  costPrice?: number;
  manufacturingDate?: string | null;
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

export type Category = {
  id: string;
  name: string;
};

export type Brand = {
  id: string;
  name: string;
};

export type Supplier = {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
};

// Mock data for branches
export const MOCK_BRANCHES: Branch[] = [
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

// Mock data for categories
const MOCK_CATEGORIES: Category[] = [
  { id: "1", name: "Lubricants" },
  { id: "2", name: "Filters" },
  { id: "3", name: "Brakes" },
  { id: "4", name: "Batteries" },
  { id: "5", name: "Additives" },
];

// Mock data for brands
const MOCK_BRANDS: Brand[] = [
  { id: "1", name: "Castrol" },
  { id: "2", name: "Mobil" },
  { id: "3", name: "Bosch" },
  { id: "4", name: "K&N" },
  { id: "5", name: "Toyota" },
];

// Mock data for suppliers
const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: "1",
    name: "AutoSupply Co.",
    contact: "John Doe",
    email: "john@autosupply.com",
    phone: "+971 50 123 4567",
  },
  {
    id: "2",
    name: "Gulf Parts Ltd.",
    contact: "Jane Smith",
    email: "jane@gulfparts.com",
    phone: "+971 50 765 4321",
  },
  {
    id: "3",
    name: "OEM Direct",
    contact: "Mohammed Ali",
    email: "mali@oemdirect.com",
    phone: "+971 50 987 6543",
  },
];

// Mock data for inventory items
const MOCK_INVENTORY: Record<string, Item[]> = {
  // Sample data for Branch 1
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
      ],
      bottleStates: { open: 3, closed: 42 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
};

// Implement the API functions using actual endpoints
export const fetchItems = async (
  locationId: string,
  showTradeIns?: boolean
): Promise<Item[]> => {
  try {
    console.log(`Fetching items for location: ${locationId}`);

    const url = new URL("/api/products/fetch", window.location.origin);
    url.searchParams.set("locationId", locationId);
    if (showTradeIns) {
      url.searchParams.set("showTradeIns", "true");
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Failed to fetch items: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Failed to fetch items");
    }

    // Transform API response to match Item interface
    const items: Item[] = data.items.map((item: any) => ({
      id: item.id,
      name: item.name,
      price: parseFloat(item.inventory?.selling_price || "0"),
      stock: item.inventory?.total_stock || 0,
      category: item.category,
      brand: item.brand,
      brand_id: item.brand_id || null,
      category_id: item.category_id || null,
      type: item.product_type,
      description: item.description || null,
      is_oil: item.category?.toLowerCase() === "lubricants",
      isOil: item.category?.toLowerCase() === "lubricants",
      imageUrl: item.image_url,
      image_url: item.image_url,
      volumes: item.volumes || [],
      batches: [], // Will be populated from batches API if needed
      created_at: item.created_at || null,
      updated_at: item.updated_at || null,
      lowStockAlert: item.low_stock_threshold || 5,
      costPrice: item.cost_price ? parseFloat(item.cost_price) : 0,
      manufacturingDate: item.manufacturing_date || null,
      bottleStates:
        item.category?.toLowerCase() === "lubricants"
          ? {
              open: item.inventory?.open_bottles_stock || 0,
              closed: item.inventory?.closed_bottles_stock || 0,
            }
          : undefined,
    }));

    console.log(`Fetched ${items.length} items successfully`);
    return items;
  } catch (error) {
    console.error("Error fetching items:", error);
    throw error;
  }
};

export const fetchItem = async (
  itemId: string,
  locationId: string
): Promise<Item | null> => {
  try {
    console.log(`Fetching item ${itemId} for location: ${locationId}`);

    // For now, fetch all items and find the specific one
    const items = await fetchItems(locationId);
    const item = items.find((item) => item.id === itemId);

    if (item) {
      console.log(`Found item: ${item.name}`);
      return item;
    }

    console.log(`Item ${itemId} not found`);
    return null;
  } catch (error) {
    console.error("Error fetching item:", error);
    return null;
  }
};

export const createItem = async (
  newItem: Omit<Item, "id">,
  locationId: string
): Promise<Item | null> => {
  try {
    console.log("Creating item:", newItem.name, "for location:", locationId);

    // Prepare the payload for the API
    const payload: any = {
      name: newItem.name,
      low_stock_threshold: newItem.lowStockAlert || 5,
      location_id: locationId,
    };

    // Only include fields if they have valid values (not null or undefined)
    // Prefer brand_id over brand text field
    if (newItem.brand_id) {
      payload.brand_id = newItem.brand_id;
    } else if (newItem.brand) {
      payload.brand = newItem.brand;
    }
    if (newItem.type) {
      payload.type = newItem.type;
    }
    if (newItem.description) {
      payload.description = newItem.description;
    }
    if (newItem.image_url) {
      payload.image_url = newItem.image_url;
    }
    if (newItem.category_id) {
      payload.category_id = newItem.category_id;
    }
    if (newItem.costPrice !== undefined && newItem.costPrice !== null) {
      payload.cost_price = newItem.costPrice;
    }
    if (newItem.manufacturingDate) {
      payload.manufacturing_date = newItem.manufacturingDate;
    }

    // Add lubricant-specific data if it's a lubricant
    if (newItem.isOil || newItem.is_oil) {
      // Filter out volumes with empty or invalid sizes and map to API format
      const volumes =
        newItem.volumes
          ?.filter((v) => v.size && v.size.trim() !== "")
          ?.map((v) => ({
            volume: v.size.trim(),
            price: v.price || 0,
          })) || [];

      console.log("🛢️ Creating lubricant product:");
      console.log("- Raw volumes from item:", newItem.volumes);
      console.log("- Filtered volumes for API:", volumes);
      console.log("- Bottle states:", newItem.bottleStates);

      Object.assign(payload, {
        volumes,
        open_bottles_stock: newItem.bottleStates?.open || 0,
        closed_bottles_stock: newItem.bottleStates?.closed || 0,
      });
    } else {
      // For non-lubricants
      Object.assign(payload, {
        standard_stock: newItem.stock || 0,
        selling_price: newItem.price || 0,
      });
    }

    // Add initial batch if available
    if (newItem.batches && newItem.batches.length > 0) {
      const firstBatch = newItem.batches[0];
      Object.assign(payload, {
        batch: {
          cost_price: firstBatch.cost_price || 0,
          quantity: firstBatch.current_quantity || 0,
          supplier: firstBatch.supplier_id || undefined,
        },
      });
    }

    console.log("API Payload:", payload);

    const response = await fetch("/api/products/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: response.statusText }));
      console.error("API Error Response:", errorData);
      throw new Error(
        `Failed to create item: ${errorData.error || response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Failed to create item");
    }

    console.log("Item created successfully with ID:", data.product_id);

    // Return the created item by fetching it back
    const createdItem = await fetchItem(data.product_id, locationId);

    if (!createdItem) {
      throw new Error("Failed to fetch created item");
    }

    return createdItem;
  } catch (error) {
    console.error("Error creating item:", error);
    throw error;
  }
};

// Alias for backwards compatibility
export const addItem = createItem;

export const updateItem = async (
  id: string,
  updatedItem: Partial<Item>,
  locationId: string
): Promise<Item | null> => {
  try {
    console.log("Updating item:", id, "for location:", locationId);

    // Prepare the payload for the API (similar to createItem but with id)
    const payload: any = {
      id,
      name: updatedItem.name,
      low_stock_threshold: updatedItem.lowStockAlert || 5,
      location_id: locationId,
    };

    // Only include fields if they have valid values (not null or undefined)
    // Prefer brand_id over brand text field
    if (updatedItem.brand_id) {
      payload.brand_id = updatedItem.brand_id;
    } else if (updatedItem.brand) {
      payload.brand = updatedItem.brand;
    }
    if (updatedItem.type) {
      payload.type = updatedItem.type;
    }
    if (updatedItem.description) {
      payload.description = updatedItem.description;
    }
    if (updatedItem.image_url) {
      payload.image_url = updatedItem.image_url;
    }
    if (updatedItem.category_id) {
      payload.category_id = updatedItem.category_id;
    }
    if (updatedItem.costPrice !== undefined && updatedItem.costPrice !== null) {
      payload.cost_price = updatedItem.costPrice;
    }
    if (updatedItem.manufacturingDate) {
      payload.manufacturing_date = updatedItem.manufacturingDate;
    }

    // Add lubricant-specific data if it's a lubricant
    if (updatedItem.isOil || updatedItem.is_oil) {
      // Filter out volumes with empty or invalid sizes and map to API format
      const volumes =
        updatedItem.volumes
          ?.filter((v) => v.size && v.size.trim() !== "")
          ?.map((v) => ({
            volume: v.size.trim(),
            price: v.price || 0,
          })) || [];

      console.log("🛢️ Updating lubricant product:");
      console.log("- Raw volumes from item:", updatedItem.volumes);
      console.log("- Filtered volumes for API:", volumes);
      console.log("- Bottle states:", updatedItem.bottleStates);

      Object.assign(payload, {
        volumes,
        open_bottles_stock: updatedItem.bottleStates?.open || 0,
        closed_bottles_stock: updatedItem.bottleStates?.closed || 0,
      });
    } else {
      // For non-lubricants
      const stockValue = Math.max(0, updatedItem.stock || 0);
      const priceValue = updatedItem.price || 0;

      Object.assign(payload, {
        standard_stock: stockValue,
        selling_price: priceValue >= 0 ? priceValue : 0,
      });
    }

    console.log("Update API Payload:", payload);

    const response = await fetch("/api/products/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: response.statusText }));
      console.error("API Error Response:", errorData);
      throw new Error(
        `Failed to update item: ${errorData.error || response.statusText}`
      );
    }

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Failed to update item");
    }

    console.log("Item updated successfully");

    // Return the updated item by fetching it back
    const updatedItemData = await fetchItem(id, locationId);

    if (!updatedItemData) {
      throw new Error("Failed to fetch updated item");
    }

    return updatedItemData;
  } catch (error) {
    console.error("Error updating item:", error);
    throw error;
  }
};

export const deleteItem = async (
  id: string,
  locationId: string
): Promise<boolean> => {
  try {
    console.log("Deleting item:", id, "for location:", locationId);

    const response = await fetch(
      `/api/products/delete?productId=${id}&locationId=${locationId}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete item: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.error || "Failed to delete item");
    }

    console.log("Item deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting item:", error);
    return false;
  }
};

export const fetchCategories = async (): Promise<Category[]> => {
  try {
    console.log("Fetching categories from database...");

    // Use Supabase client to fetch categories
    const { createClient } = await import("@/supabase/client");
    const supabase = createClient();

    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      // Fallback to mock data if database fails
      console.log("Falling back to mock categories");
      return MOCK_CATEGORIES;
    }

    console.log(`Fetched ${data?.length || 0} categories from database`);
    return data || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    // Fallback to mock data
    console.log("Falling back to mock categories");
    return MOCK_CATEGORIES;
  }
};

export const fetchBrands = async (): Promise<Brand[]> => {
  try {
    console.log("Fetching brands from database...");

    // Use Supabase client to fetch brands
    const { createClient } = await import("@/supabase/client");
    const supabase = createClient();

    const { data, error } = await supabase
      .from("brands")
      .select("id, name")
      .order("name");

    if (error) {
      console.error("Error fetching brands:", error);
      // Fallback to mock data if database fails
      console.log("Falling back to mock brands");
      return MOCK_BRANDS;
    }

    console.log(`Fetched ${data?.length || 0} brands from database`);
    return data || [];
  } catch (error) {
    console.error("Error fetching brands:", error);
    // Fallback to mock data
    console.log("Falling back to mock brands");
    return MOCK_BRANDS;
  }
};

export const fetchSuppliers = async (): Promise<Supplier[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300)); // Simulate API delay
  return MOCK_SUPPLIERS;
};

export const fetchBranches = async (): Promise<Branch[]> => {
  try {
    console.log("Fetching locations from database...");

    // Use Supabase client to fetch locations (branches)
    const { createClient } = await import("@/supabase/client");
    const supabase = createClient();

    const { data, error } = await supabase
      .from("locations")
      .select("id, name")
      .order("name");

    if (error) {
      console.error("Error fetching locations:", error);
      // Fallback to mock data if database fails
      console.log("Falling back to mock branches");
      return MOCK_BRANCHES;
    }

    // Transform locations to Branch format
    const branches: Branch[] = (data || []).map((location) => ({
      id: location.id,
      name: location.name,
      address: "", // Not stored in locations table
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    console.log(
      `Fetched ${branches.length} locations from database:`,
      branches.map((b) => ({ id: b.id, name: b.name }))
    );
    return branches;
  } catch (error) {
    console.error("Error fetching branches:", error);
    // Fallback to mock data
    console.log("Falling back to mock branches");
    return MOCK_BRANCHES;
  }
};

export const addCategory = async (name: string): Promise<Category | null> => {
  try {
    console.log("Adding category:", name);

    const { data, error } = await supabase
      .from("categories")
      .insert({ name })
      .select("id, name")
      .single();

    if (error) {
      console.error("Error adding category:", error);
      throw error;
    }

    console.log("Category added successfully:", data);
    return data;
  } catch (error) {
    console.error("Error adding category:", error);
    throw error;
  }
};

export const updateCategory = async (
  id: string,
  name: string
): Promise<Category | null> => {
  try {
    console.log("Updating category:", id, "to:", name);

    const { data, error } = await supabase
      .from("categories")
      .update({ name })
      .eq("id", id)
      .select("id, name")
      .single();

    if (error) {
      console.error("Error updating category:", error);
      throw error;
    }

    console.log("Category updated successfully:", data);
    return data;
  } catch (error) {
    console.error("Error updating category:", error);
    return null;
  }
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  try {
    console.log("Deleting category:", id);

    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      console.error("Error deleting category:", error);
      throw error;
    }

    console.log("Category deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting category:", error);
    return false;
  }
};

export const addBrand = async (name: string): Promise<Brand | null> => {
  try {
    console.log("Adding brand:", name);

    const { data, error } = await supabase
      .from("brands")
      .insert({ name })
      .select("id, name")
      .single();

    if (error) {
      console.error("Error adding brand:", error);
      throw error;
    }

    console.log("Brand added successfully:", data);
    return data;
  } catch (error) {
    console.error("Error adding brand:", error);
    return null;
  }
};

export const updateBrand = async (
  id: string,
  name: string
): Promise<Brand | null> => {
  try {
    console.log("Updating brand:", id, "to:", name);

    const { data, error } = await supabase
      .from("brands")
      .update({ name })
      .eq("id", id)
      .select("id, name")
      .single();

    if (error) {
      console.error("Error updating brand:", error);
      throw error;
    }

    console.log("Brand updated successfully:", data);
    return data;
  } catch (error) {
    console.error("Error updating brand:", error);
    return null;
  }
};

export const deleteBrand = async (id: string): Promise<boolean> => {
  try {
    console.log("Deleting brand:", id);

    const { error } = await supabase.from("brands").delete().eq("id", id);

    if (error) {
      console.error("Error deleting brand:", error);
      throw error;
    }

    console.log("Brand deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting brand:", error);
    return false;
  }
};

// Batch management functions
export const addBatch = async (
  itemId: string,
  newBatch: Pick<
    Batch,
    | "purchase_date"
    | "cost_price"
    | "initial_quantity"
    | "current_quantity"
    | "supplier_id"
    | "expiration_date"
  >,
  locationId: string
): Promise<boolean> => {
  try {
    console.log("Adding batch for item:", itemId, "location:", locationId);

    // For now, return true as batch management needs a dedicated API endpoint
    // The batch data would be stored via the products/save endpoint when creating/updating items
    console.log("Batch management via dedicated API not yet implemented");
    await new Promise((resolve) => setTimeout(resolve, 200));

    return true;
  } catch (error) {
    console.error("Error adding batch:", error);
    return false;
  }
};

export const updateBatch = async (
  itemId: string,
  batchId: string,
  updatedBatch: Partial<Omit<Batch, "id" | "item_id">>,
  locationId: string
): Promise<boolean> => {
  try {
    console.log(
      "Updating batch:",
      batchId,
      "for item:",
      itemId,
      "location:",
      locationId
    );

    // For now, return true as batch management needs a dedicated API endpoint
    console.log("Batch update via dedicated API not yet implemented");
    await new Promise((resolve) => setTimeout(resolve, 200));

    return true;
  } catch (error) {
    console.error("Error updating batch:", error);
    return false;
  }
};

export const deleteBatch = async (
  itemId: string,
  batchId: string,
  locationId: string
): Promise<boolean> => {
  try {
    console.log(
      "Deleting batch:",
      batchId,
      "for item:",
      itemId,
      "location:",
      locationId
    );

    // For now, return true as batch management needs a dedicated API endpoint
    console.log("Batch deletion via dedicated API not yet implemented");
    await new Promise((resolve) => setTimeout(resolve, 200));

    return true;
  } catch (error) {
    console.error("Error deleting batch:", error);
    return false;
  }
};
