import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/supabase/client";

const QuerySchema = z.object({
  locationId: z.string().uuid(),
  category: z.string().trim().min(1).optional(),
  brand: z.string().trim().min(1).optional(),
  product_type: z.string().trim().min(1).optional(),
  showTradeIns: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

type QueryParams = z.infer<typeof QuerySchema>;

export async function GET(req: Request) {
  try {
    const supabase = createClient();

    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      locationId: url.searchParams.get("locationId"),
      category: url.searchParams.get("category") || undefined,
      brand: url.searchParams.get("brand") || undefined,
      product_type: url.searchParams.get("product_type") || undefined,
      showTradeIns: url.searchParams.get("showTradeIns") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const qp: QueryParams = parsed.data;
    const isInventoryUseCase = !qp.category && !qp.brand && !qp.product_type;

    // First, get inventory records for this location
    const { data: inventoryData, error: invError } = await supabase
      .from("inventory")
      .select(
        `
        id,
        product_id,
        standard_stock,
        open_bottles_stock,
        closed_bottles_stock,
        total_stock,
        selling_price
      `
      )
      .eq("location_id", qp.locationId);

    if (invError) {
      console.error("Inventory query error:", invError);
      return NextResponse.json(
        { error: "Failed to fetch inventory data" },
        { status: 500 }
      );
    }

    if (!inventoryData || inventoryData.length === 0) {
      return NextResponse.json({ ok: true, items: [] });
    }

    // Get product IDs from inventory
    const productIds = inventoryData.map((inv) => inv.product_id);

    // Query products with categories
    let query = supabase
      .from("products")
      .select(
        `
        id,
        name,
        brand_id,
        product_type,
        image_url,
        low_stock_threshold,
        category_id,
        cost_price,
        manufacturing_date
      `
      )
      .in("id", productIds);

    const { data: productsData, error } = await query;

    if (error) {
      console.error("Products query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch products data" },
        { status: 500 }
      );
    }

    // Get categories for the products
    const categoryIds = [
      ...new Set(productsData?.map((p) => p.category_id) || []),
    ];
    const { data: categoriesData, error: catError } = await supabase
      .from("categories")
      .select("id, name")
      .in("id", categoryIds);

    if (catError) {
      console.error("Categories query error:", catError);
    }

    // Get brands for the products
    const brandIds = [
      ...new Set(productsData?.map((p) => p.brand_id).filter(Boolean) || []),
    ];
    let brandsData = [];
    if (brandIds.length > 0) {
      const { data: brandData, error: brandError } = await supabase
        .from("brands")
        .select("id, name")
        .in("id", brandIds);

      if (brandError) {
        console.error("Brands query error:", brandError);
      } else {
        brandsData = brandData || [];
      }
    }

    // Create maps for easy lookup
    const inventoryMap = new Map();
    inventoryData.forEach((inv) => {
      inventoryMap.set(inv.product_id, inv);
    });

    const categoryMap = new Map();
    (categoriesData || []).forEach((cat) => {
      categoryMap.set(cat.id, cat);
    });

    const brandMap = new Map();
    brandsData.forEach((brand) => {
      brandMap.set(brand.id, brand);
    });

    // Apply filters
    let filteredProducts = productsData || [];

    // Filter for trade-in batteries if showTradeIns is true
    if (qp.showTradeIns) {
      filteredProducts = filteredProducts.filter((product) => {
        const category = categoryMap.get(product.category_id);
        const isBattery =
          category?.name?.toLowerCase().includes("battery") ||
          product.product_type?.toLowerCase().includes("battery");
        return isBattery;
      });
    }

    if (qp.category) {
      filteredProducts = filteredProducts.filter((product) => {
        const category = categoryMap.get(product.category_id);
        return category?.name
          ?.toLowerCase()
          .includes(qp.category!.toLowerCase());
      });
    }
    if (qp.brand) {
      filteredProducts = filteredProducts.filter((product) =>
        product.brand_id?.toLowerCase().includes(qp.brand!.toLowerCase())
      );
    }
    if (qp.product_type) {
      filteredProducts = filteredProducts.filter((product) =>
        product.product_type
          ?.toLowerCase()
          .includes(qp.product_type!.toLowerCase())
      );
    }

    // Map into response shape
    const baseItems = filteredProducts.map((product) => {
      const inventory = inventoryMap.get(product.id);
      const category = categoryMap.get(product.category_id);
      const brand = brandMap.get(product.brand_id);
      return {
        id: product.id,
        name: product.name,
        brand: brand?.name ?? product.brand ?? null,
        brand_id: product.brand_id ?? null,
        product_type: product.product_type ?? null,
        category: category?.name ?? null,
        category_id: product.category_id ?? null,
        image_url: product.image_url ?? null,
        low_stock_threshold: product.low_stock_threshold ?? 0,
        cost_price: product.cost_price ?? null,
        manufacturing_date: product.manufacturing_date ?? null,
        inventory: {
          id: inventory.id,
          standard_stock: inventory.standard_stock ?? 0,
          open_bottles_stock: inventory.open_bottles_stock ?? 0,
          closed_bottles_stock: inventory.closed_bottles_stock ?? 0,
          total_stock: inventory.total_stock ?? 0,
          selling_price: inventory.selling_price ?? null,
        },
      };
    });

    // Include volumes and open bottle details for Lubricants in both inventory and POS use cases
    const lubricantIds = baseItems
      .filter((it) => (it.category || "").toLowerCase() === "lubricants")
      .map((it) => it.id);

    let volumesByProduct: Record<string, any[]> = {};
    let openBottleDetailsByProduct: Record<string, any[]> = {};

    if (lubricantIds.length > 0) {
      // Fetch volumes for lubricant products
      const { data: vrows, error: volError } = await supabase
        .from("product_volumes")
        .select("id, product_id, volume_description, selling_price")
        .in("product_id", lubricantIds);

      if (volError) {
        console.error("Error fetching volumes:", volError);
      } else {
        for (const v of vrows || []) {
          const key = v.product_id;
          if (!volumesByProduct[key]) volumesByProduct[key] = [];
          // Map to match the Volume interface expected by the frontend
          volumesByProduct[key].push({
            id: v.id,
            item_id: v.product_id,
            size: v.volume_description,
            price: parseFloat(v.selling_price) || 0,
            created_at: null,
            updated_at: null,
          });
        }
      }

      // Fetch open bottle details for lubricant products
      // We need to get inventory IDs for lubricant products first
      const lubricantInventoryIds = baseItems
        .filter((it) => (it.category || "").toLowerCase() === "lubricants")
        .map((it) => it.inventory.id);

      if (lubricantInventoryIds.length > 0) {
        const { data: openBottleRows, error: openBottleError } = await supabase
          .from("open_bottle_details")
          .select("id, inventory_id, current_volume")
          .in("inventory_id", lubricantInventoryIds)
          .eq("is_empty", false); // Only non-empty bottles

        if (openBottleError) {
          console.error("Error fetching open bottle details:", openBottleError);
        } else {
          // Group open bottle details by product ID
          for (const bottle of openBottleRows || []) {
            // Find the product ID for this inventory ID
            const product = baseItems.find(
              (it) => it.inventory.id === bottle.inventory_id
            );
            if (product) {
              const key = product.id;
              if (!openBottleDetailsByProduct[key])
                openBottleDetailsByProduct[key] = [];
              openBottleDetailsByProduct[key].push({
                id: bottle.id,
                current_volume: parseFloat(bottle.current_volume) || 0,
              });
            }
          }
        }
      }
    }

    const items = baseItems.map((it) => {
      if ((it.category || "").toLowerCase() === "lubricants") {
        return {
          ...it,
          volumes: volumesByProduct[it.id] || [],
          openBottleDetails: openBottleDetailsByProduct[it.id] || [],
        };
      }
      return it;
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    const message = e?.issues?.[0]?.message || e?.message || "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
