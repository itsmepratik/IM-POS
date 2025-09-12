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
  brand_id: z.string().uuid().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  image_url: z.string().url().optional(),
  low_stock_threshold: z.number().int().min(0).optional(),
  cost_price: z.coerce.number().nonnegative().optional(),
  manufacturing_date: z.string().optional(),

  location_id: z.string().uuid(),

  // Lubricants branch
  volumes: z.array(VolumeSchema).optional(),
  open_bottles_stock: z.number().int().min(0).optional(),
  closed_bottles_stock: z.number().int().min(0).optional(),

  // Non-lubricants branch
  standard_stock: z.number().int().min(0).optional(),
  selling_price: z.coerce.number().min(0).optional(),

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
        product_type: body.type || null,
        description: body.description || null,
        image_url: body.image_url || null,
        low_stock_threshold: body.low_stock_threshold ?? 0,
      };

      // Handle brand_id vs brand - prefer brand_id (UUID) over brand (text)
      if (body.brand_id) {
        updateData.brand_id = body.brand_id;
      } else if (body.brand) {
        updateData.brand = body.brand;
      }

      // Only include new fields if they exist in the request
      if (body.cost_price !== undefined) {
        updateData.cost_price = body.cost_price;
      }
      if (body.manufacturing_date !== undefined) {
        updateData.manufacturing_date = body.manufacturing_date;
      }

      // Only update category_id if provided
      if (body.category_id) {
        updateData.category_id = body.category_id;
      }

      console.log("About to update product with data:", updateData);

      const { error: updateError } = await supabase
        .from("products")
        .update(updateData)
        .eq("id", productId);

      if (updateError) {
        console.error("Detailed Supabase error updating product:", updateError);
        console.error("Error code:", updateError.code);
        console.error("Error message:", updateError.message);
        console.error("Error details:", updateError.details);
        console.error("Error hint:", updateError.hint);
        return NextResponse.json(
          { error: `Failed to update product: ${updateError.message}` },
          { status: 500 }
        );
      }
    } else {
      // Create new product
      const insertData: any = {
        name: body.name,
        category_id: body.category_id,
        product_type: body.type || null,
        description: body.description || null,
        image_url: body.image_url || null,
        low_stock_threshold: body.low_stock_threshold ?? 0,
      };

      // Handle brand_id vs brand - prefer brand_id (UUID) over brand (text)
      if (body.brand_id) {
        insertData.brand_id = body.brand_id;
      } else if (body.brand) {
        insertData.brand = body.brand;
      }

      // Only include new fields if they exist in the request
      if (body.cost_price !== undefined) {
        insertData.cost_price = body.cost_price;
      }
      if (body.manufacturing_date !== undefined) {
        insertData.manufacturing_date = body.manufacturing_date;
      }

      const { data: insertedProduct, error: insertError } = await supabase
        .from("products")
        .insert(insertData)
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

    // 3) Lubricant volumes upsert - now with proper upsert logic
    console.log("🔍 Volume processing check:");
    console.log("- isLubricant:", isLubricant);
    console.log("- body.volumes:", body.volumes);
    console.log("- volumes length:", body.volumes?.length || 0);

    if (isLubricant && body.volumes && body.volumes.length > 0) {
      console.log("✅ Processing volumes for lubricant product");

      // Get existing volumes to determine what to update/insert/delete
      const { data: existingVolumes, error: fetchVolumesError } = await supabase
        .from("product_volumes")
        .select("id, volume_description, selling_price")
        .eq("product_id", productId);

      if (fetchVolumesError) {
        console.error("❌ Error fetching existing volumes:", fetchVolumesError);
        return NextResponse.json(
          { error: "Failed to fetch existing volumes" },
          { status: 500 }
        );
      }

      console.log("📦 Existing volumes:", existingVolumes);

      // Create a map of existing volumes by volume_description for easy lookup
      const existingVolumeMap = new Map();
      (existingVolumes || []).forEach((v) => {
        existingVolumeMap.set(v.volume_description, v);
      });

      // Process each volume from the request
      const processedVolumeDescriptions = new Set();
      for (const requestVolume of body.volumes) {
        const volumeDescription = requestVolume.volume;
        const price = String(requestVolume.price);

        processedVolumeDescriptions.add(volumeDescription);

        const existingVolume = existingVolumeMap.get(volumeDescription);

        if (existingVolume) {
          // Update existing volume if price changed
          if (existingVolume.selling_price !== price) {
            console.log(
              `🔄 Updating volume ${volumeDescription}: ${existingVolume.selling_price} → ${price}`
            );
            const { error: updateError } = await supabase
              .from("product_volumes")
              .update({ selling_price: price })
              .eq("id", existingVolume.id);

            if (updateError) {
              console.error("❌ Error updating volume:", updateError);
              return NextResponse.json(
                { error: "Failed to update product volume" },
                { status: 500 }
              );
            }
          } else {
            console.log(`✅ Volume ${volumeDescription} unchanged`);
          }
        } else {
          // Insert new volume
          console.log(`➕ Adding new volume: ${volumeDescription} at ${price}`);
          const { error: insertError } = await supabase
            .from("product_volumes")
            .insert({
              product_id: productId,
              volume_description: volumeDescription,
              selling_price: price,
            });

          if (insertError) {
            console.error("❌ Error inserting volume:", insertError);
            return NextResponse.json(
              { error: "Failed to insert product volume" },
              { status: 500 }
            );
          }
        }
      }

      // Remove volumes that are no longer in the request (optional - uncomment if you want this behavior)
      /*
      const volumesToDelete = (existingVolumes || []).filter(v => 
        !processedVolumeDescriptions.has(v.volume_description)
      );
      
      if (volumesToDelete.length > 0) {
        console.log("🗑️ Removing volumes:", volumesToDelete.map(v => v.volume_description));
        const { error: deleteError } = await supabase
          .from("product_volumes")
          .delete()
          .in("id", volumesToDelete.map(v => v.id));
          
        if (deleteError) {
          console.error("❌ Error deleting removed volumes:", deleteError);
        }
      }
      */

      console.log("✅ Successfully processed volumes");
    } else {
      console.log(
        "⏭️ Skipping volume processing - not a lubricant or no volumes"
      );
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
