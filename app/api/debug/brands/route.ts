import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return detailed information about each brand
    const brandDetails = (data || []).map((brand: any) => ({
      id: brand.id,
      name: brand.name,
      images: brand.images,
      images_type: typeof brand.images,
      images_keys: brand.images ? Object.keys(brand.images) : null,
      has_image_url: !!brand.image_url,
      image_url: brand.image_url,
    }));

    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      brands: brandDetails,
      raw_data: data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}
