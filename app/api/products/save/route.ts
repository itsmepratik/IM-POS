import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/supabase/client";

// Input validation schema
const VolumeSchema = z.object({
  volume: z.string().min(1),
  price: z.coerce.number().nonnegative(),
});

const BatchSchema = z.object({
  cost_price: z.coerce.number().nonnegative(),
  quantity: z.number().int().nonnegative(),
  supplier: z.string().optional(),
});

const PayloadSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  category_id: z.string().uuid().optional(),
  brand: z.string().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  image_url: z.string().url().optional(),
  low_stock_threshold: z.number().int().min(0).optional(),

  location_id: z.string().uuid(),

  // Lubricants branch
  volumes: z.array(VolumeSchema).optional(),
  open_bottles_stock: z.number().int().min(0).optional(),
  closed_bottles_stock: z.number().int().min(0).optional(),

  // Non-lubricants branch
  standard_stock: z.number().int().min(0).optional(),
  selling_price: z.coerce.number().nonnegative().optional(),

  // Initial batch for new product
  batch: BatchSchema.optional(),
});

export async function POST(req: Request) {
  try {
    const supabase = createClient();

    const json = await req.json();
    const body = PayloadSchema.parse(json);

    // Determine if the category is Lubricants
    let category = null;
    let isLubricant = false;
    
    if (body.category_id) {
      const { data: categoryData, error: categoryError } = await supabase
        .from("categories")
        .select("id, name")
        .eq("id", body.category_id)
        .single();

      if (categoryError || !categoryData) {
        return NextResponse.json(
          { error: "Invalid category_id" },
          { status: 400 }
        );
      }
      category = categoryData;
      isLubricant = category.name.toLowerCase() === "lubricants";
    } else if (body.id) {
      // For updates without category_id, get the existing product's category
      const { data: existingProduct, error: productError } = await supabase
        .from("products")
        .select("category_id, categories(id, name)")
        .eq("id", body.id)
        .single();

      if (productError || !existingProduct) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }
      
      category = existingProduct.categories;
      isLubricant = category?.name?.toLowerCase() === "lubricants";
    } else {
      return NextResponse.json(
        { error: "category_id is required for new products" },
        { status: 400 }
      );
    }

    // 1) Upsert product
    let productId = body.id;

    if (productId) {
      // Update existing product
      const updateData: any = {
        name: body.name,
        brand_id: body.brand,
        product_type: body.type,
        description: body.description,
        image_url: body.image_url,
        low_stock_threshold: body.low_stock_threshold ?? 0,
      };
      
      // Only update category_id if provided
      if (body.category_id) {
        updateData.category_id = body.category_id;
      }
      
      const { error: updateError } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", productId);

      if (updateError) {
        console.error("Error updating product:", updateError);
        return NextResponse.json(
          { error: "Failed to update product" },
          { status: 500 }
        );
      }
    } else {
      // Create new product
      const { data: insertedProduct, error: insertError } = await supabase
        .from("products")
        .insert({
          name: body.name,
          category_id: body.category_id,
          brand_id: body.brand,
          product_type: body.type,
          description: body.description,
          image_url: body.image_url,
          low_stock_threshold: body.low_stock_threshold ?? 0,
        })
        .select("id")
        .single();

      if (insertError || !insertedProduct) {
        console.error("Error creating product:", insertError);
        return NextResponse.json(
          { error: "Failed to create product" },
          { status: 500 }
        );
      }
      productId = insertedProduct.id;
    }

    // 2) Inventory upsert by location
    const { data: existingInv } = await supabase
      .from("inventory")
      .select("id")
      .eq("product_id", productId)
      .eq("location_id", body.location_id)
      .single();

    const invValues: any = {
      product_id: productId,
      location_id: body.location_id,
    };

    if (isLubricant) {
      invValues.open_bottles_stock = body.open_bottles_stock ?? 0;
      invValues.closed_bottles_stock = body.closed_bottles_stock ?? 0;
      invValues.selling_price = null; // Prices are in product_volumes for lubricants
    } else {
      invValues.standard_stock = body.standard_stock ?? 0;
      invValues.selling_price = body.selling_price ?? null;
      invValues.open_bottles_stock = 0;
      invValues.closed_bottles_stock = 0;
    }

    let inventoryId: string;
    if (existingInv) {
      // Update existing inventory
      const { error: updateInvError } = await supabase
        .from("inventory")
        .update(invValues)
        .eq("id", existingInv.id);

      if (updateInvError) {
        console.error("Error updating inventory:", updateInvError);
        return NextResponse.json(
          { error: "Failed to update inventory" },
          { status: 500 }
        );
      }
      inventoryId = existingInv.id;
    } else {
      // Create new inventory record
      const { data: insertedInv, error: insertInvError } = await supabase
        .from("inventory")
        .insert(invValues)
        .select("id")
        .single();

      if (insertInvError || !insertedInv) {
        console.error("Error creating inventory:", insertInvError);
        return NextResponse.json(
          { error: "Failed to create inventory" },
          { status: 500 }
        );
      }
      inventoryId = insertedInv.id;
    }

    // 3) Lubricant volumes upsert
    if (isLubricant && body.volumes && body.volumes.length > 0) {
      // Delete existing volumes
      const { error: deleteVolumesError } = await supabase
        .from("product_volumes")
        .delete()
        .eq("product_id", productId);

      if (deleteVolumesError) {
        console.error("Error deleting volumes:", deleteVolumesError);
      }

      // Insert new volumes
      const volumeData = body.volumes.map((v) => ({
        product_id: productId,
        volume_description: v.volume,
        selling_price: String(v.price),
      }));

      const { error: insertVolumesError } = await supabase
        .from("product_volumes")
        .insert(volumeData);

      if (insertVolumesError) {
        console.error("Error inserting volumes:", insertVolumesError);
        return NextResponse.json(
          { error: "Failed to update product volumes" },
          { status: 500 }
        );
      }
    }

    // 4) Initial batch for new product
    if (!body.id && body.batch) {
      const { error: insertBatchError } = await supabase
        .from("batches")
        .insert({
          inventory_id: inventoryId,
          cost_price: String(body.batch.cost_price),
          quantity_received: body.batch.quantity,
          stock_remaining: body.batch.quantity,
          supplier: body.batch.supplier,
          is_active_batch: true,
        });

      if (insertBatchError) {
        console.error("Error inserting batch:", insertBatchError);
        // Don't fail the entire operation for batch insertion
      }
    }

    const result = { id: productId, inventoryId };

    return NextResponse.json({
      ok: true,
      product_id: result.id,
      inventory_id: result.inventoryId,
    });
  } catch (e: any) {
    const message = e?.issues?.[0]?.message || e?.message || "Invalid request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
