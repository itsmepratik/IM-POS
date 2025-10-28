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
  image_url?: string | null; // Direct image URL column in database
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
    // Get location ID
    let actualLocationId = locationId;

    // Check if locationId is a UUID (not a name like "sanaiya")
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (locationId === "sanaiya" || locationId === "main") {
      const { data: location } = await supabase
        .from("locations")
        .select("id")
        .eq("name", locationId === "sanaiya" ? "Sanaiya" : "Main Branch")
        .single();

      if (location) {
        actualLocationId = location.id;
      } else {
        console.warn(
          "Location lookup failed in fetchItems, using provided locationId:",
          locationId
        );
      }
    } else if (!uuidRegex.test(locationId)) {
      // If it's not a UUID and not a known name, try to look it up by name
      console.warn(
        "Location ID is not a UUID in fetchItems, attempting lookup:",
        locationId
      );
      const { data: location } = await supabase
        .from("locations")
        .select("id")
        .eq("name", locationId)
        .single();

      if (location) {
        actualLocationId = location.id;
      } else {
        console.warn(
          "Location lookup failed in fetchItems, using provided locationId:",
          locationId
        );
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
      return [];
    }

    console.log("📦 Raw inventory data from database:", inventoryData);
    if (inventoryData && inventoryData.length > 0) {
      console.log("📦 First inventory item:", inventoryData[0]);
      console.log("📦 First product data:", inventoryData[0]?.products);
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

        // For lubricants (oil products), stock = open bottles + closed bottles
        // For non-lubricants, stock = standard stock
        const totalStock = isOilProduct
          ? (inv.open_bottles_stock || 0) + (inv.closed_bottles_stock || 0)
          : inv.standard_stock || 0;

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
          isOil: isOilProduct,
          imageUrl: product.image_url,
          image_url: product.image_url,
          volumes,
          batches,
          created_at: null, // Not available in current schema
          updated_at: null, // Not available in current schema
          lowStockAlert: product.low_stock_threshold,
          isBattery: false, // Not available in current schema
          batteryState: undefined, // Not available in current schema
          costPrice: product.cost_price
            ? parseFloat(product.cost_price)
            : undefined,
          manufacturingDate: product.manufacturing_date,
          // Debug logging for manufacturing date
          ...(product.manufacturing_date && {
            debug_manufacturingDate: product.manufacturing_date,
            debug_manufacturingDate_type: typeof product.manufacturing_date,
            debug_manufacturingDate_string: String(product.manufacturing_date),
          }),
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

    // Check if locationId is a UUID (not a name like "sanaiya")
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (locationId === "sanaiya" || locationId === "main") {
      const { data: location } = await supabase
        .from("locations")
        .select("id")
        .eq("name", locationId === "sanaiya" ? "Sanaiya" : "Main Branch")
        .single();

      if (location) {
        actualLocationId = location.id;
      } else {
        console.warn(
          "Location lookup failed, using provided locationId:",
          locationId
        );
      }
    } else if (!uuidRegex.test(locationId)) {
      // If it's not a UUID and not a known name, try to look it up by name
      console.warn("Location ID is not a UUID, attempting lookup:", locationId);
      const { data: location } = await supabase
        .from("locations")
        .select("id")
        .eq("name", locationId)
        .single();

      if (location) {
        actualLocationId = location.id;
      } else {
        console.warn(
          "Location lookup failed, using provided locationId:",
          locationId
        );
      }
    }

    console.log("Creating item with:", {
      locationId,
      actualLocationId,
      item: {
        name: item.name,
        category_id: item.category_id,
        brand_id: item.brand_id,
        price: item.price,
        stock: item.stock,
        is_oil: item.is_oil,
      },
    });

    // Validate required fields
    if (!item.category_id) {
      console.error("Error: category_id is required");
      return null;
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
        low_stock_threshold: item.lowStockAlert || 0,
        cost_price:
          item.costPrice && item.costPrice > 0 ? item.costPrice : null,
        manufacturing_date: item.manufacturingDate,
      })
      .select()
      .single();

    if (productError || !productData) {
      console.error("Error creating product:", {
        error: productError,
        message: productError?.message || "Unknown product error",
        details: productError?.details || "No details",
        hint: productError?.hint || "No hint",
        code: productError?.code || "No code",
        itemData: item,
      });
      return null;
    }

    // Create inventory entry
    const { data: inventoryData, error: inventoryError } = await supabase
      .from("inventory")
      .insert({
        product_id: productData.id,
        location_id: actualLocationId,
        standard_stock: item.stock || 0,
        selling_price: item.price && item.price > 0 ? item.price : null,
        open_bottles_stock: item.bottleStates?.open || 0,
        closed_bottles_stock: item.bottleStates?.closed || 0,
      })
      .select()
      .single();

    if (inventoryError) {
      console.error("Error creating inventory:", {
        error: inventoryError,
        message: inventoryError?.message || "Unknown inventory error",
        details: inventoryError?.details || "No details",
        hint: inventoryError?.hint || "No hint",
        code: inventoryError?.code || "No code",
        inventoryData: {
          product_id: productData.id,
          location_id: actualLocationId,
          standard_stock: item.stock || 0,
          selling_price: item.price || null,
          open_bottles_stock: item.bottleStates?.open || 0,
          closed_bottles_stock: item.bottleStates?.closed || 0,
        },
      });
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

    // Check if locationId is a UUID (not a name like "sanaiya")
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (locationId === "sanaiya" || locationId === "main") {
      const { data: location } = await supabase
        .from("locations")
        .select("id")
        .eq("name", locationId === "sanaiya" ? "Sanaiya" : "Main Branch")
        .single();

      if (location) {
        actualLocationId = location.id;
      } else {
        console.warn(
          "Location lookup failed in updateItem, using provided locationId:",
          locationId
        );
      }
    } else if (!uuidRegex.test(locationId)) {
      // If it's not a UUID and not a known name, try to look it up by name
      console.warn(
        "Location ID is not a UUID in updateItem, attempting lookup:",
        locationId
      );
      const { data: location } = await supabase
        .from("locations")
        .select("id")
        .eq("name", locationId)
        .single();

      if (location) {
        actualLocationId = location.id;
      } else {
        console.warn(
          "Location lookup failed in updateItem, using provided locationId:",
          locationId
        );
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
      productUpdates.cost_price =
        updates.costPrice && updates.costPrice > 0 ? updates.costPrice : null;
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
      inventoryUpdates.selling_price =
        updates.price && updates.price > 0 ? updates.price : null;
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

    // Check if locationId is a UUID (not a name like "sanaiya")
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (locationId === "sanaiya" || locationId === "main") {
      const { data: location } = await supabase
        .from("locations")
        .select("id")
        .eq("name", locationId === "sanaiya" ? "Sanaiya" : "Main Branch")
        .single();

      if (location) {
        actualLocationId = location.id;
      } else {
        console.warn(
          "Location lookup failed in deleteItem, using provided locationId:",
          locationId
        );
      }
    } else if (!uuidRegex.test(locationId)) {
      // If it's not a UUID and not a known name, try to look it up by name
      console.warn(
        "Location ID is not a UUID in deleteItem, attempting lookup:",
        locationId
      );
      const { data: location } = await supabase
        .from("locations")
        .select("id")
        .eq("name", locationId)
        .single();

      if (location) {
        actualLocationId = location.id;
      } else {
        console.warn(
          "Location lookup failed in deleteItem, using provided locationId:",
          locationId
        );
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

// Fetch categories
export const fetchCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchCategories:", error);
    return [];
  }
};

// Fetch brands
export const fetchBrands = async (): Promise<Brand[]> => {
  try {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching brands:", error);
      return [];
    }

    console.log(
      "🔍 fetchBrands - Raw data from DB:",
      JSON.stringify(data, null, 2)
    );

    // Map the data (image_url is now a direct column)
    const brands = (data || []).map((brand: any) => {
      console.log(`🔍 Processing brand "${brand.name}":`, {
        hasImageUrl: !!brand.image_url,
        image_url: brand.image_url,
      });

      return {
        id: brand.id,
        name: brand.name,
        image_url: brand.image_url || null,
      };
    });

    console.log(
      "✅ fetchBrands - Processed brands:",
      JSON.stringify(
        brands.map((b) => ({ name: b.name, image_url: b.image_url })),
        null,
        2
      )
    );

    return brands;
  } catch (error) {
    console.error("Error in fetchBrands:", error);
    return [];
  }
};

// Fetch suppliers
export const fetchSuppliers = async (): Promise<Supplier[]> => {
  try {
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
        console.warn(
          "SQL to create table:",
          `
CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);`
        );
        return [];
      }

      console.error("Error fetching suppliers:", error);
      return [];
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
    return [];
  }
};

// Fetch branches
export const fetchBranches = async (): Promise<Branch[]> => {
  try {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching branches:", error);
      return [];
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
    return [];
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
    // Prepare the images JSONB object from image_url
    const images = brand.image_url ? { url: brand.image_url } : null;

    const { data, error } = await supabase
      .from("brands")
      .insert({
        name: brand.name,
        images: images,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding brand:", error);
      throw new Error("Failed to add brand");
    }

    // Return with image_url extracted from images
    return {
      ...data,
      image_url: data.images?.url || data.images?.image_url || null,
    };
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
    // Prepare updates with images JSONB field
    const dbUpdates: any = {};

    if (updates.name !== undefined) {
      dbUpdates.name = updates.name;
    }

    if (updates.image_url !== undefined) {
      // Update the images JSONB field
      dbUpdates.images = updates.image_url ? { url: updates.image_url } : null;
    }

    const { data, error } = await supabase
      .from("brands")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating brand:", error);
      throw new Error("Failed to update brand");
    }

    // Return with image_url extracted from images
    return {
      ...data,
      image_url: data.images?.url || data.images?.image_url || null,
    };
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

    // Check if locationId is a UUID (not a name like "sanaiya")
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (locationId === "sanaiya" || locationId === "main") {
      const { data: location } = await supabase
        .from("locations")
        .select("id")
        .eq("name", locationId === "sanaiya" ? "Sanaiya" : "Main Branch")
        .single();

      if (location) {
        actualLocationId = location.id;
      } else {
        console.warn(
          "Location lookup failed in addBatch, using provided locationId:",
          locationId
        );
      }
    } else if (!uuidRegex.test(locationId)) {
      // If it's not a UUID and not a known name, try to look it up by name
      console.warn(
        "Location ID is not a UUID in addBatch, attempting lookup:",
        locationId
      );
      const { data: location } = await supabase
        .from("locations")
        .select("id")
        .eq("name", locationId)
        .single();

      if (location) {
        actualLocationId = location.id;
      } else {
        console.warn(
          "Location lookup failed in addBatch, using provided locationId:",
          locationId
        );
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
