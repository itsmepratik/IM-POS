// Category management service
// Extracted from inventoryService.ts

import { supabase, Category } from "./types";

// Fetch all categories
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

// Add a new category
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

// Update an existing category
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

// Delete a category
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

// Legacy alias for backward compatibility
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
