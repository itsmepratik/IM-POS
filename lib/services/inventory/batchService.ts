// Batch management service
// Extracted from inventoryService.ts

import { supabase, Batch, resolveLocationId } from "./types";

// Add a new batch
export const addBatch = async (
  batch: Omit<Batch, "id" | "created_at" | "updated_at">,
  locationId: string = "sanaiya"
): Promise<Batch | null> => {
  try {
    const actualLocationId = await resolveLocationId(locationId);

    // Resolve inventory_id
    const { data: inventoryData, error: inventoryError } = await supabase
      .from("inventory")
      .select("id")
      .eq("product_id", batch.item_id)
      .eq("location_id", actualLocationId)
      .single();

    if (inventoryError || !inventoryData) {
      console.error("Error resolving inventory ID:", inventoryError);
      throw new Error("Inventory item not found for this product and location");
    }

    const { data, error } = await supabase
      .from("batches")
      .insert({
        inventory_id: inventoryData.id,
        supplier: batch.supplier_id,
        purchase_date: batch.purchase_date,
        cost_price:
          batch.cost_price !== undefined &&
          batch.cost_price !== null &&
          !isNaN(Number(batch.cost_price))
            ? Number(batch.cost_price)
            : null,
        quantity_received:
          batch.initial_quantity !== undefined &&
          batch.initial_quantity !== null &&
          !isNaN(Number(batch.initial_quantity))
            ? Number(batch.initial_quantity)
            : 0,
        stock_remaining:
          batch.current_quantity !== undefined &&
          batch.current_quantity !== null &&
          !isNaN(Number(batch.current_quantity))
            ? Number(batch.current_quantity)
            : 0,
        batch_number: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding batch:", error);
      return null;
    }

    return {
      id: data.id,
      item_id: batch.item_id,
      purchase_date: data.purchase_date,
      expiration_date: null,
      supplier_id: data.supplier,
      cost_price: data.cost_price ? parseFloat(data.cost_price) : null,
      initial_quantity: data.quantity_received,
      current_quantity: data.stock_remaining,
      is_active_batch: data.is_active_batch,
      created_at: data.created_at,
      updated_at: data.updated_at,
      batch_number: data.batch_number,
    };
  } catch (error) {
    console.error("Error in addBatch:", error);
    return null;
  }
};

// Update an existing batch
export const updateBatch = async (
  id: string,
  updates: Partial<Batch>
): Promise<Batch | null> => {
  try {
    const batchUpdates: Record<string, string | number | null | undefined> = {};

    if (updates.purchase_date !== undefined)
      batchUpdates.purchase_date = updates.purchase_date;
    if (updates.supplier_id !== undefined)
      batchUpdates.supplier = updates.supplier_id;
    if (updates.cost_price !== undefined) {
      const costPrice = Number(updates.cost_price);
      batchUpdates.cost_price = !isNaN(costPrice) ? costPrice : null;
    }
    if (updates.initial_quantity !== undefined) {
      const initialQty = Number(updates.initial_quantity);
      batchUpdates.quantity_received = !isNaN(initialQty) ? initialQty : 0;
    }
    if (updates.current_quantity !== undefined) {
      const currentQty = Number(updates.current_quantity);
      batchUpdates.stock_remaining = !isNaN(currentQty) ? currentQty : 0;
    }

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
      item_id: "",
      purchase_date: data.purchase_date,
      expiration_date: null,
      supplier_id: data.supplier,
      cost_price: data.cost_price ? parseFloat(data.cost_price) : null,
      initial_quantity: data.quantity_received,
      current_quantity: data.stock_remaining,
      is_active_batch: data.is_active_batch,
      created_at: data.created_at,
      updated_at: data.updated_at,
      batch_number: data.batch_number,
    };
  } catch (error) {
    console.error("Error in updateBatch:", error);
    return null;
  }
};

// Delete a batch
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

// Create initial batch for new inventory items
export const createInitialBatchForInventory = async (
  inventoryId: string,
  costPrice: number,
  initialStock: number,
  supplier?: string
): Promise<Batch | null> => {
  try {
    if (initialStock <= 0) {
      return null;
    }

    const { data, error } = await supabase
      .from("batches")
      .insert({
        inventory_id: inventoryId,
        cost_price: costPrice,
        quantity_received: initialStock,
        stock_remaining: initialStock,
        is_active_batch: true,
        supplier: supplier || null,
        purchase_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating initial batch:", error);
      return null;
    }

    return {
      id: data.id,
      item_id: data.inventory_id,
      batch_number: data.batch_number,
      purchase_date: data.purchase_date,
      expiration_date: null,
      supplier_id: data.supplier,
      cost_price: data.cost_price ? parseFloat(data.cost_price) : null,
      initial_quantity: data.quantity_received,
      current_quantity: data.stock_remaining,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  } catch (error) {
    console.error("Error in createInitialBatchForInventory:", error);
    return null;
  }
};

// Cleanup old exhausted batches
export const cleanupOldBatches = async (
  keepCount: number = 5
): Promise<number> => {
  try {
    const { data, error } = await supabase.rpc("cleanup_old_batches", {
      p_keep_count: keepCount,
    });

    if (error) {
      console.error("Error cleaning up old batches:", error);
      return 0;
    }

    return data || 0;
  } catch (error) {
    console.error("Error in cleanupOldBatches:", error);
    return 0;
  }
};

// Fetch all batches for a specific inventory item
export const fetchBatchesForInventory = async (
  inventoryId: string
): Promise<Batch[]> => {
  try {
    const { data, error } = await supabase
      .from("batches")
      .select("*")
      .eq("inventory_id", inventoryId)
      .order("batch_number", { ascending: true });

    if (error) {
      console.error("Error fetching batches:", error);
      return [];
    }

    interface BatchRow {
      id: string;
      inventory_id: string;
      batch_number?: number;
      purchase_date: string | null;
      supplier: string | null;
      cost_price: string | null;
      quantity_received: number | null;
      stock_remaining: number | null;
      is_active_batch?: boolean;
      created_at: string | null;
      updated_at: string | null;
    }

    return (data || []).map((batch: BatchRow) => ({
      id: batch.id,
      item_id: batch.inventory_id,
      batch_number: batch.batch_number,
      purchase_date: batch.purchase_date,
      expiration_date: null,
      supplier_id: batch.supplier,
      cost_price: batch.cost_price ? parseFloat(batch.cost_price) : null,
      initial_quantity: batch.quantity_received,
      current_quantity: batch.stock_remaining,
      is_active_batch: batch.is_active_batch,
      created_at: batch.created_at,
      updated_at: batch.updated_at,
    }));
  } catch (error) {
    console.error("Error in fetchBatchesForInventory:", error);
    return [];
  }
};
