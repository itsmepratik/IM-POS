// Brand management service
// Extracted from inventoryService.ts

import { supabase, Brand } from "./types";

// Fetch all brands
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

    const brands = (data || []).map((brand: { id: string; name: string; image_url?: string | null }) => ({
      id: brand.id,
      name: brand.name,
      image_url: brand.image_url || null,
    }));

    return brands;
  } catch (error) {
    console.error("Error in fetchBrands:", error);
    return [];
  }
};

// Add a new brand
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

// Update an existing brand
export const updateBrandService = async (
  id: string,
  updates: Partial<Brand>
): Promise<Brand> => {
  try {
    const dbUpdates: Record<string, string | null | undefined> = {};

    if (updates.name !== undefined) {
      dbUpdates.name = updates.name;
    }

    if (updates.image_url !== undefined) {
      dbUpdates.image_url = updates.image_url || null;
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

    return data;
  } catch (error) {
    console.error("Error in updateBrandService:", error);
    throw error;
  }
};

// Delete a brand
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

// Legacy aliases for backward compatibility
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
