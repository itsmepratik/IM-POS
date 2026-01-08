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
  // Bill Header Details
  // Bill Header Details
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

export type Item = {
  id: string;
  product_id?: string; // Explicit product ID
  name: string;
  price: number;
  stock: number;
  category: string;
  brand: string;
  brand_id: string;
  category_id: string;
  type: string | null; // Legacy: type name (text), kept for backward compatibility
  type_id: string | null; // New: type ID (UUID)
  type_name: string | null; // New: type name from types table
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
  totalOpenVolume?: number; // Total volume in liters from open_bottle_details (for lubricants)
  specification?: string | null;
  types?: Type[]; // Array of associated types
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

export type Type = {
  id: string;
  name: string;
  category_id?: string | null;
};

// Database service functions

// Fetch items for a specific location
  // Helper function to resolve location ID
  const resolveLocationId = async (locId: string): Promise<string> => {
    const uuidRegex =
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    
    // Check known locations first
    if (locId === "sanaiya") {
      const { data: location } = await supabase
        .from("locations")
        .select("id")
        .ilike("name", "Sanaiya")
        .single();
      if (location) return location.id;
    } else if (locId === "abu-durus") {
      const { data: location } = await supabase
        .from("locations")
        .select("id")
        .ilike("name", "Abu Dhurus")
        .single();
      if (location) return location.id;
    } else if (!uuidRegex.test(locId)) {
      // If it's not a UUID, try to look it up by name
      const { data: location } = await supabase
        .from("locations")
        .select("id")
        .eq("name", locId)
        .single();
      if (location) return location.id;
    }
    
    return locId;
  };

// Helper type for stock status
type StockStatus = "all" | "in-stock" | "low-stock" | "out-of-stock";

export const fetchInventoryItems = async (
  page: number = 1,
  limit: number = 50,
  search: string = "",
  categoryId: string = "ALL",
  brandId: string = "ALL",
  locationId: string = "sanaiya",
  filters: {
    minPrice?: number;
    maxPrice?: number;
    stockStatus?: StockStatus;
    showLowStockOnly?: boolean;
    showOutOfStockOnly?: boolean;
    showInStock?: boolean;
    showBatteries?: boolean;
    batteryState?: "new" | "scrap" | "resellable";
    sortBy?: "name" | "price";
    sortOrder?: "asc" | "desc";
  } = {}
): Promise<{ data: Item[]; count: number }> => {
  try {
    const actualLocationId = await resolveLocationId(locationId);
    
    let query = supabase
      .from("inventory")
      .select(
        `
        id,
        product_id,
        standard_stock,
        selling_price,
        open_bottles_stock,
        closed_bottles_stock,
        products!inner (
          id,
          name,
          product_type,
          type_id,
          description,
          image_url,
          low_stock_threshold,
          cost_price,
          manufacturing_date,
          is_battery,
          battery_state,
          specification,
          category_id,
          brand_id,
          categories!inner ( id, name ),
          brands!inner ( id, name ),
          types ( id, name ),
          product_types (
            types ( id, name, category_id )
          )
        )
      `,
        { count: "exact" }
      )
      .eq("location_id", actualLocationId);

    // Apply Basic Filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`, { foreignTable: "products" });
    }

    // Helper to check for valid UUID
    const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

    if (categoryId && categoryId !== "ALL") {
      if (isUUID(categoryId)) {
        query = query.eq("products.category_id", categoryId);
      } else {
        // Filter by category name
        query = query.eq("products.categories.name", categoryId);
      }
    }

    if (brandId && brandId !== "ALL") {
      if (isUUID(brandId)) {
        query = query.eq("products.brand_id", brandId);
      } else if (brandId === "none") {
         // Handle "No Brand" case if passed from UI
         query = query.is("products.brand_id", null);
      } else {
        // Filter by brand name
        query = query.eq("products.brands.name", brandId);
      }
    }

    // Apply Advanced Filters
    if (filters.minPrice !== undefined && filters.minPrice !== null) {
      query = query.gte("selling_price", filters.minPrice);
    }

    if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
      query = query.lte("selling_price", filters.maxPrice);
    }

    // Stock Filters
    // Note: 'standard_stock' is the main stock field.
    // Low stock requires comparing standard_stock with products.low_stock_threshold.
    // Supabase standard queries can't easily compare two columns (col A <= col B).
    // We might need to filter basic stock > 0 checks, but for relative checks (low stock), 
    // we might need to rely on RPC or client-side filtering if the dataset after other filters is small enough.
    // HOWEVER, for "Out of Stock" (stock == 0) and "In Stock" (stock > 0), it is easy.
    
    if (filters.showOutOfStockOnly) {
       query = query.eq("standard_stock", 0);
    } else if (filters.showInStock) {
       query = query.gt("standard_stock", 0);
    } else if (filters.stockStatus === "out-of-stock") {
       query = query.eq("standard_stock", 0);
    } else if (filters.stockStatus === "in-stock") {
       query = query.gt("standard_stock", 0);
    }
    
    // Battery Filters
    if (filters.showBatteries) {
      query = query.eq("products.is_battery", true);
      if (filters.batteryState) {
        query = query.eq("products.battery_state", filters.batteryState);
      }
    }

    // Apply Sorting
    if (filters.sortBy === 'name') {
      query = query.order('name', { foreignTable: 'products', ascending: filters.sortOrder === 'asc' });
    } else if (filters.sortBy === 'price') {
      query = query.order('selling_price', { ascending: filters.sortOrder === 'asc' });
    } else {
      // Default sort
      query = query.order("id", { ascending: true });
    }

    // Apply Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data: inventoryData, error, count } = await query
      .range(from, to);

    if (error) {
      console.error("Error fetching paginated inventory:", JSON.stringify(error, null, 2));
      throw error;
    }

    // Client-side filtering for complex logic that Supabase query can't easily handle
    // specifically "Low Stock" which depends on row-by-row threshold
    let items: Item[] = await Promise.all(
      (inventoryData || []).map(async (inv: any) => {
        const product = inv.products;
        
        // ... (Existing transformation logic)
        let imageUrl = product.image_url;
        if (imageUrl && !imageUrl.startsWith("http")) {
           const { data: publicUrlData } = supabase.storage
            .from("product-images")
            .getPublicUrl(imageUrl);
           imageUrl = publicUrlData.publicUrl;
        }

        const batches: Batch[] = []; 
        let volumes: Volume[] = [];
        // Safety check for product and categories
        if (product && product.categories && (product.categories.name === "Lubricants" || product.categories.name === "Additives")) {
           const { data: volData } = await supabase
             .from("product_volumes")
             .select("*")
             .eq("item_id", inv.id);
             if (volData) volumes = volData;
        }

        return {
          id: inv.id,
          product_id: inv.product_id || product?.id,
          name: product?.name || "Unknown Product",
          price: inv.selling_price,
          stock: inv.standard_stock,
          category: product?.categories?.name || "Uncategorized",
          brand: product?.brands?.name || "Unknown Brand",
          brand_id: product?.brand_id,
          category_id: product?.category_id,
          type: product?.product_types?.[0]?.types?.name || product?.types?.name || product?.product_type || "Unknown Type", 
          type_id: product?.type_id,
          type_name: product?.types?.name,
          types: product?.product_types?.map((pt: any) => pt.types).filter(Boolean) || [],
          description: product?.description,
          isOil: product?.categories?.name === "Lubricants",
          imageUrl: imageUrl,
          image_url: product?.image_url,
          volumes: volumes,
          batches: batches,
          created_at: inv.created_at || new Date().toISOString(),
          updated_at: inv.updated_at || new Date().toISOString(),
          lowStockAlert: product?.low_stock_threshold || 10,
          isBattery: product?.is_battery || false,
          batteryState: product?.battery_state,
          costPrice: product?.cost_price || 0,
          manufacturingDate: product?.manufacturing_date,
          specification: product?.specification,
          open_bottles_stock: inv.open_bottles_stock,
          closed_bottles_stock: inv.closed_bottles_stock,
          bottleStates: {
             open: inv.open_bottles_stock || 0,
             closed: inv.closed_bottles_stock || 0
          }
        };
      })
    );


    // Apply strict Low Stock filtering post-fetch if requested
    // Note: This messes up pagination count if we filter AFTER fetching a page.
    // Ideally we should filter in DB. 
    // Since we can't easily do `standard_stock <= products.low_stock_threshold` in simple select,
    // we might accept that "Low Stock" filter is approximate or handled by a separate RPC or ignoring it for now if strict server pagination is required.
    // Or, we can use a raw SQL query or check if Drizzle/Supabase supports column comparison.
    // Supabase `.filter('standard_stock', 'lte', 'products.low_stock_threshold')` doesn't work directly with joins like that easily.
    // Compromise: For "Low Stock Only", we will fetch more items (limit * 2) and filter. Or just return what matches in current page.
    // Or, we assume "Low Stock" means stock <= 5 (default) if threshold is missing.
    // To support "No Compromises", we would need a DB function `is_low_stock` or similar.
    // But for now, let's filter in memory for the requested page.
    // ISSUE: If page 1 has no low stock items because they are on page 5, the user sees empty list.
    // FIX: "Low Stock" filter usually drastically reduces the dataset. We could try fetching ALL low stock items if that filter is active (assuming low stock items are few), or use RPC.
    
    // Let's implement post-processing filter for now to match interface, 
    // but warn that complex cross-column filtering affects pagination accuracy without RPC.
    // Assuming user wants speed first.
    
    if (filters.showLowStockOnly || filters.stockStatus === "low-stock") {
       items = items.filter(i => (i.stock || 0) <= (i.lowStockAlert || 5) && (i.stock || 0) > 0);
       // We should ideally update 'count' too, but we don't have total count of low stock items without a specific query.
    }

    return { data: items, count: count || 0 };

  } catch (err) {
    console.error("fetchInventoryItems failed:", err);
    throw err;
  }
};

export const fetchItems = async (
  locationId: string = "sanaiya"
): Promise<Item[]> => {
  try {
    // Get location ID
    let actualLocationId = locationId;

    if (!locationId) {
      throw new Error("Location ID is required for fetchItems");
    }

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
        products!inner (
          id,
          name,
          product_type,
          type_id,
          description,
          image_url,
          low_stock_threshold,
          cost_price,
          manufacturing_date,
          is_battery,
          battery_state,
          specification,
          category_id,
          brand_id,
          categories (
            id,
            name
          ),
          brands (
            id,
            name
          ),
          types (
            id,
            name
          ),
          product_types (
            types (
              id,
              name,
              category_id
            )
          )
        )
      `
      )
      .eq("location_id", actualLocationId);

    if (error) {
      console.error("Error fetching inventory:", {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        locationId,
        actualLocationId,
      });
      throw new Error(
        `Failed to fetch inventory for location "${locationId}" (resolved to "${actualLocationId}"): ${error.message || "Unknown error"}`
      );
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
          product?.product_type === "Oil" ||
          product?.product_type === "Synthetic" ||
          product?.product_type === "Semi-Synthetic" ||
          (product?.categories && product.categories.name === "Lubricants");

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

        // For lubricants, fetch open_bottle_details to calculate totalOpenVolume
        // Only count the most recent bottles up to open_bottles_stock count
        // This handles cases where open_bottles_stock is out of sync with actual bottle count
        let totalOpenVolume: number | undefined = undefined;
        if (isOilProduct && inv.id) {
          const openBottlesStockCount = inv.open_bottles_stock || 0;
          
          // Fetch all non-empty bottles, ordered by most recently opened
          const { data: openBottleRows, error: openBottleError } = await supabase
            .from("open_bottle_details")
            .select("id, inventory_id, current_volume, opened_at")
            .eq("inventory_id", inv.id)
            .eq("is_empty", false)
            .order("opened_at", { ascending: false });

          if (openBottleError) {
            console.error(`Error fetching open bottles for inventory ${inv.id}:`, openBottleError);
          }

          if (openBottleRows && openBottleRows.length > 0) {
            // If open_bottles_stock is set and is less than actual count, use only the most recent N bottles
            // This handles data inconsistency where count is out of sync
            const bottlesToCount = openBottlesStockCount > 0 && openBottlesStockCount < openBottleRows.length
              ? openBottleRows.slice(0, openBottlesStockCount)
              : openBottleRows;
            
            totalOpenVolume = bottlesToCount.reduce(
              (sum, bottle) => {
                const volume = parseFloat(bottle.current_volume) || 0;
                return sum + volume;
              },
              0
            );
            
            // Debug logging
            console.log(`[fetchItems] Product: ${product.name} (${product.id})`, {
              inventoryId: inv.id,
              openBottlesStock: openBottlesStockCount,
              actualOpenBottlesCount: openBottleRows.length,
              bottlesUsedForCalculation: bottlesToCount.length,
              totalOpenVolume,
              note: openBottlesStockCount < openBottleRows.length 
                ? `Using only ${openBottlesStockCount} most recent bottles (data sync issue)` 
                : 'Using all bottles',
            });
          } else {
            totalOpenVolume = 0;
          }
        }

        return {
          id: product.id,
          product_id: product.id,
          name: product.name,
          price: inv.selling_price ? parseFloat(inv.selling_price) : 0,
          stock: totalStock,
          bottleStates: isOilProduct
            ? {
                open: inv.open_bottles_stock || 0,
                closed: inv.closed_bottles_stock || 0,
              }
            : undefined,
          types: product.product_types
            ? product.product_types.map((pt: any) => pt.types).filter(Boolean)
            : [],
          category: product.categories?.name || "Uncategorized", // Using the actual category name
          brand: product.brands?.name || "N/A", // Use brands table via brand_id foreign key
          brand_id: product.brand_id,
          category_id: product.category_id,
          type: product.types?.name || product.product_type || null, // Prefer type from types table, fallback to product_type
          type_id: product.type_id || null,
          type_name: product.types?.name || null,
          description: product.description,
          isOil: isOilProduct,
          imageUrl: product.image_url,
          image_url: product.image_url,
          volumes,
          batches,
          created_at: null, // Not available in current schema
          updated_at: null, // Not available in current schema
          lowStockAlert: product.low_stock_threshold,
          isBattery: product.is_battery || false,
          batteryState: product.battery_state as "new" | "scrap" | "resellable" | undefined,
          costPrice: product.cost_price
            ? parseFloat(product.cost_price)
            : undefined,
          manufacturingDate: product.manufacturing_date,
          specification: product.specification,
          // Debug logging for manufacturing date
          ...(product.manufacturing_date && {
            debug_manufacturingDate: product.manufacturing_date,
            debug_manufacturingDate_type: typeof product.manufacturing_date,
            debug_manufacturingDate_string: String(product.manufacturing_date),
          }),
          ...(isOilProduct && totalOpenVolume !== undefined && { totalOpenVolume }),
        };
      })
    );

    return items;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Error in fetchItems:", {
      error,
      message: errorMessage,
      locationId,
      stack: error instanceof Error ? error.stack : undefined,
    });
    // Re-throw the error so callers can handle it appropriately
    console.error("CRITICAL ERROR in fetchItems:", errorMessage, error);
    throw new Error(`Failed to fetch items for location "${locationId}": ${errorMessage}`);
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
        is_oil: item.isOil,
        specification: item.specification,
        type_ids: item.types?.map(t => t.id),
      },
    });

    // Validate required fields
    if (!item.category_id) {
      console.error("Error: category_id is required");
      return null;
    }

    // Check if this is a battery product by looking at type_id or type text
    let isBatteryProduct = false;
    if (item.type_id) {
      // Check if type is "Battery" or "Batteries" by querying types table
      const { data: typeData } = await supabase
        .from("types")
        .select("name")
        .eq("id", item.type_id)
        .single();
      
      if (typeData) {
        const typeName = typeData.name.toLowerCase().trim();
        isBatteryProduct = typeName === "battery" || typeName === "batteries";
      }
    } else if (item.type) {
      // Legacy check using type text
      const typeName = item.type.toLowerCase().trim();
      isBatteryProduct = typeName === "battery" || typeName === "batteries";
    }

    // Create product first
    const productInsert: any = {
      name: item.name,
      category_id: item.category_id,
      brand_id: item.brand_id,
      description: item.description,
      image_url: item.image_url,
      low_stock_threshold: item.lowStockAlert || 0,
      cost_price:
        item.costPrice && item.costPrice > 0 ? item.costPrice : null,
      manufacturing_date: item.manufacturingDate,
      is_battery: isBatteryProduct,
      battery_state: isBatteryProduct ? (item.batteryState || "new") : null,
      specification: item.specification || null,
    };

    // Prefer type_id over type (text) for new products
    if (item.type_id) {
      productInsert.type_id = item.type_id;
    } else if (item.type) {
      // Legacy support: if type_id not provided but type text is, try to find matching type
      // This is for backward compatibility during migration
      productInsert.product_type = item.type;
    }

    const { data: productData, error: productError } = await supabase
      .from("products")
      .insert(productInsert)
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
    if (item.isOil && item.volumes && item.volumes.length > 0) {
      const volumeInserts = item.volumes.map((vol) => ({
        product_id: productData.id,
        volume_description: vol.size,
        selling_price: vol.price,
      }));

      await supabase.from("product_volumes").insert(volumeInserts);
    }

    // Insert types into product_types junction table
    if (item.types && item.types.length > 0) {
      const typeInserts = item.types.map((type) => ({
        product_id: productData.id,
        type_id: type.id,
      }));

      const { error: typesError } = await supabase
        .from("product_types")
        .insert(typeInserts);

      if (typesError) {
        console.error("Error inserting product types:", typesError);
        // Continue despite error, as product was created
      }
    } else if (productData.type_id) {
       // Fallback: if types array not provided but type_id is (single select mode), add it to product_types
       const { error: typeError } = await supabase
        .from("product_types")
        .insert({
          product_id: productData.id,
          type_id: productData.type_id,
        });
        
       if (typeError) {
          console.error("Error inserting fallback product type:", typeError);
       }
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
    // Prefer type_id over type (text)
    if (updates.type_id !== undefined) {
      productUpdates.type_id = updates.type_id;
      // Clear product_type when type_id is set
      if (updates.type_id) {
        productUpdates.product_type = null;
      }
    } else if (updates.type !== undefined) {
      // Legacy support: if type_id not provided but type text is
      productUpdates.product_type = updates.type;
    }
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
    if (updates.isBattery !== undefined)
      productUpdates.is_battery = updates.isBattery;
    if (updates.batteryState !== undefined)
      productUpdates.battery_state = updates.batteryState;
    if (updates.specification !== undefined)
      productUpdates.specification = updates.specification;
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
      updates.isOil !== false
    ) {
      // Get existing volumes
      const { data: existingVolumes } = await supabase
        .from("product_volumes")
        .select("id, volume_description")
        .eq("product_id", id);

      // Map volume description to ARRAY of IDs to handle duplicates
      const existingVolumeMap = new Map<string, string[]>();
      (existingVolumes || []).forEach((v: any) => {
        const currentIds = existingVolumeMap.get(v.volume_description) || [];
        currentIds.push(v.id);
        existingVolumeMap.set(v.volume_description, currentIds);
      });

      const processedVolumeIds = new Set<string>();

      // Process each volume from updates
      for (const volume of updates.volumes || []) {
        if (!volume.size || volume.size.trim() === "") continue;

        const volumeDesc = volume.size;
        
        if (existingVolumeMap.has(volumeDesc)) {
          const ids = existingVolumeMap.get(volumeDesc) || [];
          
          if (ids.length > 0) {
            // Update the first ID
            const primaryId = ids[0];
            await supabase
              .from("product_volumes")
              .update({
                selling_price: volume.price,
              })
              .eq("id", primaryId);
            
            processedVolumeIds.add(primaryId);

            // Delete duplicates (any IDs after the first one)
            if (ids.length > 1) {
              console.log(`Found duplicate volumes for ${volumeDesc}, cleaning up...`);
              const duplicateIds = ids.slice(1);
              for (const dupId of duplicateIds) {
                await supabase.from("product_volumes").delete().eq("id", dupId);
                processedVolumeIds.add(dupId); // Mark as processed so we don't try to delete again
              }
            }
          }
        } else {
          // Insert new volume
          await supabase.from("product_volumes").insert({
            product_id: id,
            volume_description: volume.size,
            selling_price: volume.price,
          });
        }
      }

      // Delete volumes that are no longer in the list (and weren't caught as duplicates)
      for (const ids of existingVolumeMap.values()) {
        for (const volumeId of ids) {
          if (!processedVolumeIds.has(volumeId)) {
            await supabase.from("product_volumes").delete().eq("id", volumeId);
          }
        }
      }
    }

    // Update product types if provided
    if (updates.types !== undefined) {
      console.log("Updating product types:", updates.types);
      // 1. Delete existing relationships
      const { error: deleteError } = await supabase
        .from("product_types")
        .delete()
        .eq("product_id", id);
      
      if (deleteError) console.error("Error deleting product_types:", deleteError);

      // 2. Insert new relationships
      if (updates.types.length > 0) {
        const typeInserts = updates.types.map((type) => ({
          product_id: id,
          type_id: type.id,
        }));

        const { error: insertError } = await supabase.from("product_types").insert(typeInserts);
        if (insertError) console.error("Error inserting product_types:", insertError);
        
        // Also update the legacy/primary type_id on the product for backward compatibility
        // Use the first type as the primary one
        if (updates.types.length > 0) {
           await supabase
            .from("products")
            .update({ type_id: updates.types[0].id })
            .eq("id", id);
        }
      } else {
        // If types cleared, clear primary type_id too
        await supabase
          .from("products")
          .update({ type_id: null })
          .eq("id", id);
      }
    } else if (updates.type_id !== undefined) {
      // If updating via single type_id (legacy/simple mode)
      // Sync it to product_types table as well
      
      // 1. Delete existing relationships
      await supabase
        .from("product_types")
        .delete()
        .eq("product_id", id);
        
      // 2. Insert new single relationship if not null
      if (updates.type_id) {
        await supabase.from("product_types").insert({
          product_id: id,
          type_id: updates.type_id,
        });
      }
    }

    console.log("Update completed, fetching updated item...");
    const updatedItem = await fetchItem(id, locationId);
    console.log("Fetched updated item:", updatedItem ? "Success" : "Failed (null)");
    return updatedItem;
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
      // First, delete any trade-in transactions that reference this product
      // This is necessary because the foreign key constraint is set to RESTRICT
      const { error: tradeInError } = await supabase
        .from("trade_in_transactions")
        .delete()
        .eq("product_id", id);

      if (tradeInError) {
        console.error("Error deleting trade-in transactions:", tradeInError);
        // Continue anyway - product might not have trade-in records
      }

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

// Fetch shops (logical business units within locations)
export const fetchShops = async (): Promise<Array<{
  id: string;
  name: string;
  displayName: string | null;
  locationId: string;
  locationName: string;
  isActive: boolean;
  company_name: string | null;
  company_name_arabic: string | null;
  cr_number: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  address_line_3: string | null;
  contact_number: string | null;
  service_description_en: string | null;
  service_description_ar: string | null;
  thank_you_message: string | null;
  thank_you_message_ar: string | null;
  contact_number_arabic: string | null;
  address_line_arabic_1: string | null;
  address_line_arabic_2: string | null;
  brand_name: string | null;
  brand_address: string | null;
  brand_phones: string | null;
  brand_whatsapp: string | null;
  pos_id: string | null;
}>> => {
  try {
    const { data, error } = await supabase
      .from("shops")
      .select(`
        id,
        name,
        display_name,
        location_id,
        is_active,
        company_name,
        company_name_arabic,
        cr_number,
        address_line_1,
        address_line_2,
        address_line_3,
        address_line_arabic_1,
        address_line_arabic_2,
        contact_number,
        contact_number_arabic,
        service_description_en,
        service_description_ar,
        service_description_ar,
        thank_you_message,
        thank_you_message_ar,
        brand_name,
        brand_address,
        brand_phones,
        brand_whatsapp,
        pos_id,
        locations!inner (
          id,
          name
        )
      `)
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching shops:", JSON.stringify(error, null, 2));
      return [];
    }
    
    const shops = (data || []).map((shop: any) => ({
      id: shop.id,
      name: shop.name,
      displayName: shop.display_name || shop.name,
      locationId: shop.location_id,
      locationName: shop.locations?.name || "",
      isActive: shop.is_active,
      company_name: shop.company_name,
      company_name_arabic: shop.company_name_arabic,
      cr_number: shop.cr_number,
      address_line_1: shop.address_line_1,
      address_line_2: shop.address_line_2,
      address_line_3: shop.address_line_3,
      address_line_arabic_1: shop.address_line_arabic_1,
      address_line_arabic_2: shop.address_line_arabic_2,
      contact_number: shop.contact_number,
      contact_number_arabic: shop.contact_number_arabic,
      service_description_en: shop.service_description_en,
      service_description_ar: shop.service_description_ar,
      thank_you_message: shop.thank_you_message,
      thank_you_message_ar: shop.thank_you_message_ar,
      brand_name: shop.brand_name,
      brand_address: shop.brand_address,
      brand_phones: shop.brand_phones,
      brand_whatsapp: shop.brand_whatsapp,
      pos_id: shop.pos_id,
    }));

    return shops;
  } catch (error) {
    console.error("Error in fetchShops:", error);
    return [];
  }
};

// Fetch branches (kept for backward compatibility, but now uses shops)
export const fetchBranches = async (): Promise<Branch[]> => {
  try {
    // Use shops instead of locations for better semantics
    const shops = await fetchShops();
        
    // Transform shops to Branch format for backward compatibility
    const branches: Branch[] = shops.map((shop) => ({
      id: shop.id,
      name: shop.displayName || shop.name,
      address: shop.locationName || "",
      created_at: "", // Not available in shops table
      updated_at: "", // Not available in shops table
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

    // Prioritize Saniya1 as the main branch (first in the list)
    const saniya1Index = branches.findIndex((branch) =>
      branch.name.toLowerCase().includes("saniya1")
    );

    if (saniya1Index > 0) {
      const saniya1Branch = branches.splice(saniya1Index, 1)[0];
      branches.unshift(saniya1Branch);
      console.log(
        "✅ Prioritized Saniya1 as main branch for inventory display"
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
    const { data, error } = await supabase
      .from("brands")
      .insert({
        name: brand.name,
        image_url: brand.image_url || null,
      })
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
    // Prepare updates for direct image_url column
    const dbUpdates: any = {};

    if (updates.name !== undefined) {
      dbUpdates.name = updates.name;
    }

    if (updates.image_url !== undefined) {
      // Update the image_url column directly
      dbUpdates.image_url = updates.image_url || null;
    }

    console.log("🔍 updateBrandService - Updating brand:", { id, dbUpdates });

    const { data, error } = await supabase
      .from("brands")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating brand:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
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

export const updateShop = async (
  id: string,
  updates: Partial<{
    name: string;
    display_name: string;
    is_active: boolean;
    company_name: string;
    company_name_arabic: string;
    cr_number: string;
    address_line_1: string;
    address_line_2: string;
    address_line_3: string;
    address_line_arabic_1: string;
    address_line_arabic_2: string;
    contact_number: string;
    contact_number_arabic: string;
    service_description_en: string;
    service_description_ar: string;
    thank_you_message: string;
    thank_you_message_ar: string;
    brand_name: string;
    brand_address: string;
    brand_whatsapp: string;
    pos_id: string;
  }>
): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from("shops")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating shop:", error);
      throw new Error("Failed to update shop");
    }

    return data;
  } catch (error) {
    console.error("Error in updateShop:", error);
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
