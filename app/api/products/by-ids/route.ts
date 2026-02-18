import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const url = new URL(req.url);
    const idsParam = url.searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json(
        { error: "ids parameter is required" },
        { status: 400 }
      );
    }

    let productIds: string[];
    try {
      productIds = JSON.parse(idsParam);
    } catch {
      return NextResponse.json(
        { error: "Invalid ids parameter format" },
        { status: 400 }
      );
    }

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json({ products: [] });
    }

    // Fetch products with category, type, and brand information
    const { data: products, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        brand_id,
        category_id,
        product_types (
          types (
            id,
            name
          )
        ),
        categories (
          id,
          name
        ),
        brands (
          id,
          name
        )
      `)
      .in("id", productIds);

    if (error) {
      console.error("Error fetching products:", error);
      return NextResponse.json(
        { error: "Failed to fetch products", details: error.message },
        { status: 500 }
      );
    }

    // Transform products to include category, type, and brand names
    const transformedProducts = (products || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      brandName: p.brands?.name || "",
      category: p.categories?.name || "",
      type: p.product_types?.[0]?.types?.name || "",
    }));

    return NextResponse.json({ products: transformedProducts });
  } catch (error) {
    console.error("Error in products/by-ids route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}



