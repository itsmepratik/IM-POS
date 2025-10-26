import { createClient } from "@/supabase/client";

// Create a singleton Supabase client to prevent dynamic import issues
const supabase = createClient();

// Mock data for fallback when Supabase is not available
const MOCK_ITEMS: Item[] = [
  {
    id: "mock-1",
    name: "Engine Oil 5W-30",
    price: 25.99,
    stock: 50,
    category: "Lubricants",
    brand: "Castrol",
    brand_id: "mock-brand-1",
    category_id: "mock-category-1",
    type: "Synthetic",
    description: "High performance synthetic engine oil",
    isOil: true,
    imageUrl: null,
    image_url: null,
    volumes: [
      {
        id: "mock-vol-1",
        item_id: "mock-1",
        size: "1L",
        price: 12.99,
        created_at: null,
        updated_at: null,
      },
      {
        id: "mock-vol-2",
        item_id: "mock-1",
        size: "4L",
        price: 45.99,
        created_at: null,
        updated_at: null,
      },
    ],
    batches: [
      {
        id: "mock-batch-1",
        item_id: "mock-1",
        purchase_date: "2024-01-15",
        expiration_date: "2026-01-15",
        supplier_id: "mock-supplier-1",
        cost_price: 20.0,
        initial_quantity: 100,
        current_quantity: 50,
        created_at: "2024-01-15T00:00:00Z",
        updated_at: "2024-01-15T00:00:00Z",
      },
    ],
    created_at: null,
    updated_at: null,
    lowStockAlert: 10,
    isBattery: false,
    batteryState: undefined,
    costPrice: 20.0,
    cost_price: 20.0,
    manufacturingDate: "2024-01-01",
    manufacturing_date: "2024-01-01",
    is_battery: false,
    battery_state: null,
    is_oil: true,
  },
];

// Check if Supabase is available and has required tables
async function isSupabaseAvailable(): Promise<boolean> {
  try {
    // Test basic connection
    const { error: connectionError } = await supabase
      .from("locations")
      .select("count")
      .limit(1);

    if (connectionError) {
      console.warn("Supabase connection failed:", connectionError.message);
      return false;
    }

    // Test if required tables exist by checking for specific columns
    const { error: inventoryError } = await supabase
      .from("inventory")
      .select("id, product_id, standard_stock")
      .limit(1);

    if (
      inventoryError &&
      (inventoryError.code === "42703" || inventoryError.code === "42P01")
    ) {
      console.warn(
        "Required database tables or columns not found, using mock data"
      );
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Supabase not available, using mock data:", error);
    return false;
  }
}

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
  cost_price?: number | null;
  manufacturing_date?: string | null;
  is_battery?: boolean;
  battery_state?: string | null;
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

// Database service functions

// Fetch items for a specific location
export const fetchItems = async (
  locationId: string = "sanaiya"
): Promise<Item[]> => {
  try {
    // Check if Supabase is available first
    const isAvailable = await isSupabaseAvailable();

    if (!isAvailable) {
      console.warn("Supabase not available, using mock data");
      return MOCK_ITEMS;
    }

    // Get location ID by name if string is passed
    let actualLocationId = locationId;
    if (
      typeof locationId === "string" &&
      (locationId === "sanaiya" || locationId === "main")
    ) {
      // Try to find location by name (handle variations)
      const locationName = locationId === "sanaiya" ? "Sanaiya" : "Main Branch";
      const { data: location } = await supabase
        .from("locations")
        .select("id")
        .ilike("name", `%${locationName}%`)
        .single();

      if (location) {
        actualLocationId = location.id;
      } else {
        console.warn(
          `Location not found for name: ${locationName}, using mock data`
        );
        return MOCK_ITEMS; // Return mock data if location not found
      }
    }

    const { data: inventoryData, error } = await supabase
      .from("inventory")
      .select(
        `
        id,
        product_id,
        standard_stock,
        selling_price,
        open_bottles_stock,
        closed_bottles_stock,
        total_stock,
        products (
          id,
          name,
          product_type,
          description,
          image_url,
          low_stock_threshold,
          cost_price,
          manufacturing_date,
          brand,
          category_id,
          brand_id,
          categories (
            id,
            name
          ),
          brands (
            id,
            name
          )
        )
      `
      )
      .eq("location_id", actualLocationId);

    if (error) {
      console.error("Error fetching inventory:", error);
      console.error("Error details:", {
        message: error?.message || "No message",
        details: error?.details || "No details",
        hint: error?.hint || "No hint",
        code: error?.code || "No code",
        locationId: actualLocationId,
        locationIdType: typeof actualLocationId,
      });
      return [];
    }

    // Transform the data to match the Item interface
    const items: Item[] = await Promise.all(
      (inventoryData || []).map(async (inv: any) => {
        const product = inv.products;

        // Determine if this is an oil product based on product_type and category
        const isOilProduct =
          product.product_type === "Oil" ||
          product.product_type === "Synthetic" ||
          product.product_type === "Semi-Synthetic" ||
          (product.categories && product.categories.name === "Lubricants");

        // Fetch volumes for oil products
        let volumes: Volume[] = [];
        if (isOilProduct) {
          const { data: volumeData } = await supabase
            .from("product_volumes")
            .select("*")
            .eq("product_id", inv.product_id);

          volumes = (volumeData || []).map((vol: any) => ({
            id: vol.id,
            item_id: product.id,
            size: vol.volume_description,
            price: parseFloat(vol.selling_price),
            created_at: vol.created_at,
            updated_at: vol.updated_at,
          }));
        }

        // Fetch batches using the correct product_id from inventory
        const { data: batchData } = await supabase
          .from("batches")
          .select("*")
          .eq("product_id", inv.product_id)
          .eq("location_id", actualLocationId);

        const batches: Batch[] = (batchData || []).map((batch: any) => ({
          id: batch.id,
          item_id: product.id,
          purchase_date: batch.purchase_date,
          expiration_date: batch.expiration_date,
          supplier_id: batch.supplier_id,
          cost_price: batch.cost_price ? parseFloat(batch.cost_price) : null,
          initial_quantity: batch.initial_quantity,
          current_quantity: batch.current_quantity,
          created_at: batch.created_at,
          updated_at: batch.updated_at,
        }));

        // Calculate total stock from available columns
        const standardStock = inv.standard_stock || 0;
        const openBottlesStock = inv.open_bottles_stock || 0;
        const closedBottlesStock = inv.closed_bottles_stock || 0;
        // Use total_stock if available, otherwise calculate it
        const totalStock =
          inv.total_stock !== undefined
            ? inv.total_stock
            : standardStock + openBottlesStock + closedBottlesStock;

        return {
          id: product.id,
          name: product.name,
          price: inv.selling_price ? parseFloat(inv.selling_price) : 0,
          stock: totalStock,
          bottleStates: isOilProduct
            ? {
                open: inv.open_bottles_stock || 0,
                closed: inv.closed_bottles_stock || 0,
              }
            : undefined,
          category: product.categories?.name || "Uncategorized", // Using the actual category name
          brand: product.brands?.name || product.brand || "N/A", // Use brands table first, fallback to deprecated brand column
          brand_id: product.brand_id,
          category_id: product.category_id,
          type: product.product_type,
          description: product.description,
          is_oil: isOilProduct,
          isOil: isOilProduct,
          imageUrl: product.image_url,
          image_url: product.image_url,
          volumes,
          batches,
          created_at: null, // Not available in current schema
          updated_at: null, // Not available in current schema
          lowStockAlert: product.low_stock_threshold,
          isBattery: (inv as any).is_battery || false,
          batteryState: (inv as any).battery_state as
            | "new"
            | "scrap"
            | "resellable"
            | undefined,
          costPrice: product.cost_price
            ? parseFloat(product.cost_price)
            : undefined,
          cost_price: product.cost_price
            ? parseFloat(product.cost_price)
            : null,
          manufacturingDate:
            (inv as any).manufacturing_date || product.manufacturing_date,
          manufacturing_date:
            (inv as any).manufacturing_date || product.manufacturing_date,
          is_battery: (inv as any).is_battery || false,
          battery_state: (inv as any).battery_state,
        };
      })
    );

    return items;
  } catch (error) {
    console.error("Error in fetchItems:", error);
    return [];
  }
};

// Fetch a single item
export const fetchItem = async (
  id: string,
  locationId: string = "sanaiya"
): Promise<Item | null> => {
  try {
    const items = await fetchItems(locationId);
    return items.find((item) => item.id === id) || null;
  } catch (error) {
    console.error("Error in fetchItem:", error);
    return null;
  }
};

// Create a new item
export const createItem = async (
  item: Omit<Item, "id" | "created_at" | "updated_at">,
  locationId: string = "sanaiya"
): Promise<Item | null> => {
  try {
    // Get location ID
    let actualLocationId = locationId;
    if (
      typeof locationId === "string" &&
      (locationId === "sanaiya" || locationId === "main")
    ) {
      // Try to find location by name (handle variations)
      const locationName = locationId === "sanaiya" ? "Sanaiya" : "Main Branch";
      const { data: location } = await supabase
        .from("locations")
        .select("id")
        .ilike("name", `%${locationName}%`)
        .single();

      if (location) {
        actualLocationId = location.id;
      } else {
        console.warn(`Location not found for name: ${locationName}`);
        return null; // Return null if location not found
      }
    }

    // Create product first
    const { data: productData, error: productError } = await supabase
      .from("products")
      .insert({
        name: item.name,
        category_id: item.category_id,
        brand_id: item.brand_id,
        product_type: item.type,
        description: item.description,
        image_url: item.image_url,
        is_oil: item.is_oil,
        low_stock_threshold: item.lowStockAlert || 0,
      })
      .select()
      .single();

    if (productError || !productData) {
      console.error("Error creating product:", productError);
      return null;
    }

    // Create inventory entry
    const { data: inventoryData, error: inventoryError } = await supabase
      .from("inventory")
      .insert({
        product_id: productData.id,
        location_id: actualLocationId,
        standard_stock: item.stock || 0,
        selling_price: item.price,
        cost_price: item.costPrice,
        open_bottles_stock: item.bottleStates?.open || 0,
        closed_bottles_stock: item.bottleStates?.closed || 0,
        is_battery: item.isBattery || false,
        battery_state: item.batteryState,
        manufacturing_date: item.manufacturingDate,
      })
      .select()
      .single();

    if (inventoryError) {
      console.error("Error creating inventory:", inventoryError);
      return null;
    }

    // Create volumes if it's an oil product
    if (item.is_oil && item.volumes && item.volumes.length > 0) {
      const volumeInserts = item.volumes.map((vol) => ({
        product_id: productData.id,
        volume_description: vol.size,
        selling_price: vol.price,
      }));

      await supabase.from("product_volumes").insert(volumeInserts);
    }

    return await fetchItem(productData.id, locationId);
  } catch (error) {
    console.error("Error in createItem:", error);
    return null;
  }
};

// Update an existing item
export const updateItem = async (
  id: string,
  updates: Partial<Item>,
  locationId: string = "sanaiya"
): Promise<Item | null> => {
  try {
    // Get location ID
    let actualLocationId = locationId;
    if (
      typeof locationId === "string" &&
      (locationId === "sanaiya" || locationId === "main")
    ) {
      // Try to find location by name (handle variations)
      const locationName = locationId === "sanaiya" ? "Sanaiya" : "Main Branch";
      const { data: location } = await supabase
        .from("locations")
        .select("id")
        .ilike("name", `%${locationName}%`)
        .single();

      if (location) {
        actualLocationId = location.id;
      } else {
        console.warn(`Location not found for name: ${locationName}`);
        return null; // Return null if location not found
      }
    }

    // Update product
    const productUpdates: any = {};
    if (updates.name !== undefined) productUpdates.name = updates.name;
    if (updates.category_id !== undefined)
      productUpdates.category_id = updates.category_id;
    if (updates.brand_id !== undefined)
      productUpdates.brand_id = updates.brand_id;
    if (updates.type !== undefined) productUpdates.product_type = updates.type;
    if (updates.description !== undefined)
      productUpdates.description = updates.description;
    if (updates.image_url !== undefined)
      productUpdates.image_url = updates.image_url;
    if (updates.imageUrl !== undefined)
      productUpdates.image_url = updates.imageUrl;
    if (updates.lowStockAlert !== undefined)
      productUpdates.low_stock_threshold = updates.lowStockAlert;
    if (updates.costPrice !== undefined)
      productUpdates.cost_price = updates.costPrice;
    if (updates.manufacturingDate !== undefined)
      productUpdates.manufacturing_date = updates.manufacturingDate;
    // Note: is_oil column doesn't exist in database, so we skip this update

    if (Object.keys(productUpdates).length > 0) {
      const { error: productError } = await supabase
        .from("products")
        .update(productUpdates)
        .eq("id", id);

      if (productError) {
        console.error("Error updating product:", {
          error: productError,
          message: productError.message || "Unknown database error",
          details: productError.details || "No additional details",
          hint: productError.hint || "No hint available",
          code: productError.code || "No error code",
        });
        return null;
      }
    }

    // Update inventory
    const inventoryUpdates: any = {};
    if (updates.stock !== undefined)
      inventoryUpdates.standard_stock = updates.stock;
    if (updates.price !== undefined)
      inventoryUpdates.selling_price = updates.price;
    // Note: is_battery, battery_state columns don't exist in inventory table
    if (updates.bottleStates?.open !== undefined)
      inventoryUpdates.open_bottles_stock = updates.bottleStates.open;
    if (updates.bottleStates?.closed !== undefined)
      inventoryUpdates.closed_bottles_stock = updates.bottleStates.closed;

    if (Object.keys(inventoryUpdates).length > 0) {
      const { error: inventoryError } = await supabase
        .from("inventory")
        .update(inventoryUpdates)
        .eq("product_id", id)
        .eq("location_id", actualLocationId);

      if (inventoryError) {
        console.error("Error updating inventory:", {
          error: inventoryError,
          message: inventoryError.message || "Unknown database error",
          details: inventoryError.details || "No additional details",
          hint: inventoryError.hint || "No hint available",
          code: inventoryError.code || "No error code",
        });
        return null;
      }
    }

    // Update volumes if provided (for oil/lubricant products)
    if (
      updates.volumes !== undefined &&
      updates.is_oil !== false &&
      updates.isOil !== false
    ) {
      // Get existing volumes
      const { data: existingVolumes } = await supabase
        .from("product_volumes")
        .select("id, volume_description")
        .eq("product_id", id);

      const existingVolumeMap = new Map<string, string>();
      (existingVolumes || []).forEach((v: any) => {
        existingVolumeMap.set(v.volume_description, v.id);
      });

      const newVolumeDescriptions = new Set<string>();

      // Process each volume from updates
      for (const volume of updates.volumes || []) {
        if (!volume.size || volume.size.trim() === "") continue;

        newVolumeDescriptions.add(volume.size);

        if (existingVolumeMap.has(volume.size)) {
          // Update existing volume
          const volumeId = existingVolumeMap.get(volume.size);
          await supabase
            .from("product_volumes")
            .update({
              selling_price: volume.price,
            })
            .eq("id", volumeId);
        } else {
          // Insert new volume
          await supabase.from("product_volumes").insert({
            product_id: id,
            volume_description: volume.size,
            selling_price: volume.price,
          });
        }
      }

      // Delete volumes that are no longer in the list
      for (const [volumeDesc, volumeId] of existingVolumeMap.entries()) {
        if (!newVolumeDescriptions.has(volumeDesc)) {
          await supabase.from("product_volumes").delete().eq("id", volumeId);
        }
      }
    }

    return await fetchItem(id, locationId);
  } catch (error) {
    console.error("Error in updateItem:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : "No stack trace",
      type: typeof error,
    });
    return null;
  }
};

// Delete an item
export const deleteItem = async (
  id: string,
  locationId: string = "sanaiya"
): Promise<boolean> => {
  try {
    // Get location ID
    let actualLocationId = locationId;
    if (
      typeof locationId === "string" &&
      (locationId === "sanaiya" || locationId === "main")
    ) {
      // Try to find location by name (handle variations)
      const locationName = locationId === "sanaiya" ? "Sanaiya" : "Main Branch";
      const { data: location } = await supabase
        .from("locations")
        .select("id")
        .ilike("name", `%${locationName}%`)
        .single();

      if (location) {
        actualLocationId = location.id;
      } else {
        console.warn(`Location not found for name: ${locationName}`);
        return null; // Return null if location not found
      }
    }

    // Delete inventory entry (this will cascade to related tables)
    const { error: inventoryError } = await supabase
      .from("inventory")
      .delete()
      .eq("product_id", id)
      .eq("location_id", actualLocationId);

    if (inventoryError) {
      console.error("Error deleting inventory:", inventoryError);
      return false;
    }

    // Check if product exists in other locations
    const { data: otherInventory } = await supabase
      .from("inventory")
      .select("id")
      .eq("product_id", id);

    // If no other inventory exists, delete the product
    if (!otherInventory || otherInventory.length === 0) {
      const { error: productError } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (productError) {
        console.error("Error deleting product:", productError);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Error in deleteItem:", error);
    return false;
  }
};

// Mock data for categories
const MOCK_CATEGORIES: Category[] = [
  { id: "mock-category-1", name: "Lubricants" },
  { id: "mock-category-2", name: "Filters" },
  { id: "mock-category-3", name: "Brakes" },
  { id: "mock-category-4", name: "Batteries" },
  { id: "mock-category-5", name: "Additives" },
];

// Fetch categories
export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const isAvailable = await isSupabaseAvailable();

    if (!isAvailable) {
      console.warn("Supabase not available, using mock categories");
      return MOCK_CATEGORIES;
    }

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      console.warn("Database error, using mock categories");
      return MOCK_CATEGORIES; // Fallback to mock data
    }

    // If no data returned, it might be because tables don't exist
    if (!data || data.length === 0) {
      console.warn("No categories found in database, using mock categories");
      return MOCK_CATEGORIES;
    }

    return data || MOCK_CATEGORIES;
  } catch (error) {
    console.error("Error in fetchCategories:", error);
    return MOCK_CATEGORIES;
  }
};

// Mock data for brands
const MOCK_BRANDS: Brand[] = [
  { id: "mock-brand-1", name: "Castrol" },
  { id: "mock-brand-2", name: "Mobil" },
  { id: "mock-brand-3", name: "Shell" },
  { id: "mock-brand-4", name: "Bosch" },
  { id: "mock-brand-5", name: "Mann" },
];

// Fetch brands
export const fetchBrands = async (): Promise<Brand[]> => {
  try {
    const isAvailable = await isSupabaseAvailable();

    if (!isAvailable) {
      console.warn("Supabase not available, using mock brands");
      return MOCK_BRANDS;
    }

    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching brands:", error);
      console.warn("Database error, using mock brands");
      return MOCK_BRANDS; // Fallback to mock data
    }

    // If no data returned, it might be because tables don't exist
    if (!data || data.length === 0) {
      console.warn("No brands found in database, using mock brands");
      return MOCK_BRANDS;
    }

    return data || MOCK_BRANDS;
  } catch (error) {
    console.error("Error in fetchBrands:", error);
    return MOCK_BRANDS;
  }
};

// Mock data for suppliers
const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: "mock-supplier-1",
    name: "AutoSupply Co.",
    contact: "John Doe",
    email: "john@autosupply.com",
    phone: "+971 50 123 4567",
  },
  {
    id: "mock-supplier-2",
    name: "Gulf Parts Ltd.",
    contact: "Jane Smith",
    email: "jane@gulfparts.com",
    phone: "+971 50 765 4321",
  },
  {
    id: "mock-supplier-3",
    name: "OEM Direct",
    contact: "Mohammed Ali",
    email: "mali@oemdirect.com",
    phone: "+971 50 987 6543",
  },
];

// Fetch suppliers
export const fetchSuppliers = async (): Promise<Supplier[]> => {
  try {
    const isAvailable = await isSupabaseAvailable();

    if (!isAvailable) {
      console.warn("Supabase not available, using mock suppliers");
      return MOCK_SUPPLIERS;
    }

    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("name");

    if (error) {
      // Handle specific case where suppliers table doesn't exist
      if (error.code === "PGRST205" && error.message.includes("suppliers")) {
        console.warn(
          "Suppliers table not found. Please create the suppliers table in your Supabase dashboard."
        );
        return MOCK_SUPPLIERS; // Fallback to mock data
      }

      console.error("Error fetching suppliers:", error);
      return MOCK_SUPPLIERS; // Fallback to mock data
    }

    return (data || []).map((supplier) => ({
      id: supplier.id,
      name: supplier.name,
      contact: supplier.contact,
      email: supplier.email,
      phone: supplier.phone,
    }));
  } catch (error) {
    console.error("Error in fetchSuppliers:", error);
    return MOCK_SUPPLIERS;
  }
};

// Mock data for branches
const MOCK_BRANCHES: Branch[] = [
  {
    id: "c4212c14-64f3-4c9e-aa0e-6317fa3e9c3c",
    name: "Sanaiya",
    address: "Sanaiya Industrial Area, Abu Dhabi",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "93922a5e-5327-4561-8395-97a4653c720c",
    name: "Abu Dhabi Branch",
    address: "123 Main St, Abu Dhabi",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "d2f3b51b-2e86-4c4b-831c-96b468bd48db",
    name: "Hafeet Branch",
    address: "456 Center Ave, Al Ain",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
];

// Fetch branches
export const fetchBranches = async (): Promise<Branch[]> => {
  try {
    const isAvailable = await isSupabaseAvailable();

    if (!isAvailable) {
      console.warn("Supabase not available, using mock branches");
      return MOCK_BRANCHES;
    }

    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching branches:", error);
      console.warn("Database error, using mock branches");
      return MOCK_BRANCHES; // Fallback to mock data
    }

    // If no data returned, it might be because tables don't exist
    if (!data || data.length === 0) {
      console.warn("No branches found in database, using mock branches");
      return MOCK_BRANCHES;
    }

    const branches = (data || []).map((location) => ({
      id: location.id,
      name: location.name,
      address: location.address || "",
      created_at: location.created_at,
      updated_at: location.updated_at,
    }));

    // Prioritize Sanaiya as the main branch (first in the list)
    // This ensures main inventory displays Sanaiya items by default
    const sanaiyaIndex = branches.findIndex((branch) =>
      branch.name.toLowerCase().includes("sanaiya")
    );

    if (sanaiyaIndex > 0) {
      // Move Sanaiya to the front
      const sanaiyaBranch = branches.splice(sanaiyaIndex, 1)[0];
      branches.unshift(sanaiyaBranch);
      console.log(
        "✅ Prioritized Sanaiya as main branch for inventory display"
      );
    }

    return branches;
  } catch (error) {
    console.error("Error in fetchBranches:", error);
    return MOCK_BRANCHES;
  }
};

// Category management functions
export const addCategoryService = async (
  category: Omit<Category, "id">
): Promise<Category> => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .insert({ name: category.name })
      .select()
      .single();

    if (error) {
      console.error("Error adding category:", error);
      throw new Error("Failed to add category");
    }

    return data;
  } catch (error) {
    console.error("Error in addCategoryService:", error);
    throw error;
  }
};

export const updateCategoryService = async (
  id: string,
  updates: Partial<Category>
): Promise<Category> => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating category:", error);
      throw new Error("Failed to update category");
    }

    return data;
  } catch (error) {
    console.error("Error in updateCategoryService:", error);
    throw error;
  }
};

export const deleteCategoryService = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      console.error("Error deleting category:", error);
      throw new Error("Failed to delete category");
    }
  } catch (error) {
    console.error("Error in deleteCategoryService:", error);
    throw error;
  }
};

// Brand management functions
export const addBrandService = async (
  brand: Omit<Brand, "id">
): Promise<Brand> => {
  try {
    const { data, error } = await supabase
      .from("brands")
      .insert({ name: brand.name })
      .select()
      .single();

    if (error) {
      console.error("Error adding brand:", error);
      throw new Error("Failed to add brand");
    }

    return data;
  } catch (error) {
    console.error("Error in addBrandService:", error);
    throw error;
  }
};

export const updateBrandService = async (
  id: string,
  updates: Partial<Brand>
): Promise<Brand> => {
  try {
    const { data, error } = await supabase
      .from("brands")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating brand:", error);
      throw new Error("Failed to update brand");
    }

    return data;
  } catch (error) {
    console.error("Error in updateBrandService:", error);
    throw error;
  }
};

export const deleteBrandService = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase.from("brands").delete().eq("id", id);

    if (error) {
      console.error("Error deleting brand:", error);
      throw new Error("Failed to delete brand");
    }
  } catch (error) {
    console.error("Error in deleteBrandService:", error);
    throw error;
  }
};

// Supplier management functions
export const addSupplierService = async (
  supplier: Omit<Supplier, "id">
): Promise<Supplier> => {
  try {
    const { data, error } = await supabase
      .from("suppliers")
      .insert({
        name: supplier.name,
        contact: supplier.contact,
        email: supplier.email,
        phone: supplier.phone,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding supplier:", error);
      throw new Error("Failed to add supplier");
    }

    return {
      id: data.id,
      name: data.name,
      contact: data.contact,
      email: data.email,
      phone: data.phone,
    };
  } catch (error) {
    console.error("Error in addSupplierService:", error);
    throw error;
  }
};

export const updateSupplierService = async (
  id: string,
  updates: Partial<Supplier>
): Promise<Supplier> => {
  try {
    const { data, error } = await supabase
      .from("suppliers")
      .update({
        name: updates.name,
        contact: updates.contact,
        email: updates.email,
        phone: updates.phone,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating supplier:", error);
      throw new Error("Failed to update supplier");
    }

    return {
      id: data.id,
      name: data.name,
      contact: data.contact,
      email: data.email,
      phone: data.phone,
    };
  } catch (error) {
    console.error("Error in updateSupplierService:", error);
    throw error;
  }
};

export const deleteSupplierService = async (id: string): Promise<Supplier> => {
  try {
    const { data, error } = await supabase
      .from("suppliers")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error deleting supplier:", error);
      throw new Error("Failed to delete supplier");
    }

    return {
      id: data.id,
      name: data.name,
      contact: data.contact,
      email: data.email,
      phone: data.phone,
    };
  } catch (error) {
    console.error("Error in deleteSupplierService:", error);
    throw error;
  }
};

// Legacy function aliases for backward compatibility
export const deleteItemService = async (
  id: string,
  branchId: string
): Promise<void> => {
  await deleteItem(id, branchId);
};

export const addCategory = async (name: string): Promise<Category | null> => {
  try {
    return await addCategoryService({ name });
  } catch {
    return null;
  }
};

export const updateCategory = async (
  id: string,
  updates: Partial<Category>
): Promise<Category | null> => {
  try {
    return await updateCategoryService(id, updates);
  } catch {
    return null;
  }
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  try {
    await deleteCategoryService(id);
    return true;
  } catch {
    return false;
  }
};

export const addBrand = async (name: string): Promise<Brand | null> => {
  try {
    return await addBrandService({ name });
  } catch {
    return null;
  }
};

export const updateBrand = async (
  id: string,
  updates: Partial<Brand>
): Promise<Brand | null> => {
  try {
    return await updateBrandService(id, updates);
  } catch {
    return null;
  }
};

export const deleteBrand = async (id: string): Promise<boolean> => {
  try {
    await deleteBrandService(id);
    return true;
  } catch {
    return false;
  }
};

// Batch management functions
export const addBatch = async (
  batch: Omit<Batch, "id" | "created_at" | "updated_at">,
  locationId: string = "sanaiya"
): Promise<Batch | null> => {
  try {
    // Get location ID
    let actualLocationId = locationId;
    if (
      typeof locationId === "string" &&
      (locationId === "sanaiya" || locationId === "main")
    ) {
      // Try to find location by name (handle variations)
      const locationName = locationId === "sanaiya" ? "Sanaiya" : "Main Branch";
      const { data: location } = await supabase
        .from("locations")
        .select("id")
        .ilike("name", `%${locationName}%`)
        .single();

      if (location) {
        actualLocationId = location.id;
      } else {
        console.warn(`Location not found for name: ${locationName}`);
        return null; // Return null if location not found
      }
    }

    const { data, error } = await supabase
      .from("batches")
      .insert({
        product_id: batch.item_id,
        location_id: actualLocationId,
        supplier_id: batch.supplier_id,
        purchase_date: batch.purchase_date,
        expiration_date: batch.expiration_date,
        cost_price: batch.cost_price,
        initial_quantity: batch.initial_quantity,
        current_quantity: batch.current_quantity,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding batch:", error);
      return null;
    }

    return {
      id: data.id,
      item_id: data.product_id,
      purchase_date: data.purchase_date,
      expiration_date: data.expiration_date,
      supplier_id: data.supplier_id,
      cost_price: data.cost_price ? parseFloat(data.cost_price) : null,
      initial_quantity: data.initial_quantity,
      current_quantity: data.current_quantity,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (error) {
    console.error("Error in addBatch:", error);
    return null;
  }
};

export const updateBatch = async (
  id: string,
  updates: Partial<Batch>
): Promise<Batch | null> => {
  try {
    const batchUpdates: any = {};
    if (updates.purchase_date !== undefined)
      batchUpdates.purchase_date = updates.purchase_date;
    if (updates.expiration_date !== undefined)
      batchUpdates.expiration_date = updates.expiration_date;
    if (updates.supplier_id !== undefined)
      batchUpdates.supplier_id = updates.supplier_id;
    if (updates.cost_price !== undefined)
      batchUpdates.cost_price = updates.cost_price;
    if (updates.initial_quantity !== undefined)
      batchUpdates.initial_quantity = updates.initial_quantity;
    if (updates.current_quantity !== undefined)
      batchUpdates.current_quantity = updates.current_quantity;

    const { data, error } = await supabase
      .from("batches")
      .update(batchUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating batch:", error);
      return null;
    }

    return {
      id: data.id,
      item_id: data.product_id,
      purchase_date: data.purchase_date,
      expiration_date: data.expiration_date,
      supplier_id: data.supplier_id,
      cost_price: data.cost_price ? parseFloat(data.cost_price) : null,
      initial_quantity: data.initial_quantity,
      current_quantity: data.current_quantity,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (error) {
    console.error("Error in updateBatch:", error);
    return null;
  }
};

export const deleteBatch = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from("batches").delete().eq("id", id);

    if (error) {
      console.error("Error deleting batch:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteBatch:", error);
    return false;
  }
};
