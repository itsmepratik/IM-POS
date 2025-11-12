import { createClient } from "@/supabase/client";

const supabase = createClient();

export type Type = {
  id: string;
  category_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

// Fetch all types or types for a specific category
export const fetchTypes = async (
  categoryId?: string
): Promise<Type[]> => {
  try {
    let query = supabase.from("types").select("*").order("name");

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching types:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error in fetchTypes:", error);
    return [];
  }
};

// Fetch a single type by ID
export const fetchTypeById = async (id: string): Promise<Type | null> => {
  try {
    const { data, error } = await supabase
      .from("types")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching type:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in fetchTypeById:", error);
    return null;
  }
};

// Create a new type
export const createType = async (
  categoryId: string,
  name: string
): Promise<Type | null> => {
  try {
    // Validate that category exists
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("id", categoryId)
      .single();

    if (!category) {
      console.error("Category not found:", categoryId);
      return null;
    }

    // Check if type already exists for this category
    const { data: existing } = await supabase
      .from("types")
      .select("id")
      .eq("category_id", categoryId)
      .eq("name", name.trim())
      .single();

    if (existing) {
      console.error("Type already exists for this category");
      return null;
    }

    const { data, error } = await supabase
      .from("types")
      .insert({
        category_id: categoryId,
        name: name.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating type:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in createType:", error);
    return null;
  }
};

// Update an existing type
export const updateType = async (
  id: string,
  name: string
): Promise<Type | null> => {
  try {
    // Get existing type to check category
    const existingType = await fetchTypeById(id);
    if (!existingType) {
      console.error("Type not found:", id);
      return null;
    }

    // Check if another type with the same name exists for this category
    const { data: duplicate } = await supabase
      .from("types")
      .select("id")
      .eq("category_id", existingType.category_id)
      .eq("name", name.trim())
      .neq("id", id)
      .single();

    if (duplicate) {
      console.error("Type name already exists for this category");
      return null;
    }

    const { data, error } = await supabase
      .from("types")
      .update({
        name: name.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating type:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in updateType:", error);
    return null;
  }
};

// Delete a type
export const deleteType = async (id: string): Promise<boolean> => {
  try {
    // Check if any products are using this type
    const { data: productsUsingType } = await supabase
      .from("products")
      .select("id")
      .eq("type_id", id)
      .limit(1);

    if (productsUsingType && productsUsingType.length > 0) {
      console.error(
        "Cannot delete type: products are still using it. Set products.type_id to null first."
      );
      return false;
    }

    const { error } = await supabase.from("types").delete().eq("id", id);

    if (error) {
      console.error("Error deleting type:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in deleteType:", error);
    return false;
  }
};

// Helper function to get types for a category
export const getTypesForCategory = async (
  categoryId: string
): Promise<Type[]> => {
  return fetchTypes(categoryId);
};

// Helper function to get types by category name (for backward compatibility)
export const getTypesForCategoryName = async (
  categoryName: string
): Promise<Type[]> => {
  try {
    // First get category ID by name
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("name", categoryName)
      .single();

    if (!category) {
      return [];
    }

    return fetchTypes(category.id);
  } catch (error) {
    console.error("Error in getTypesForCategoryName:", error);
    return [];
  }
};

