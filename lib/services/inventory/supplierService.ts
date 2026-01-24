// Supplier management service
// Extracted from inventoryService.ts

import { supabase, Supplier } from "./types";

// Fetch all suppliers
export const fetchSuppliers = async (): Promise<Supplier[]> => {
  try {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching suppliers:", error);
      return [];
    }

    return (data || []).map((s: { id: string; name: string; contact?: string; email?: string; phone?: string }) => ({
      id: s.id,
      name: s.name,
      contact: s.contact,
      email: s.email,
      phone: s.phone,
    }));
  } catch (error) {
    console.error("Error in fetchSuppliers:", error);
    return [];
  }
};

// Add a new supplier
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

// Update an existing supplier
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

// Delete a supplier
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
