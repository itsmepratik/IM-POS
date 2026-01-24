// Shop/Branch management service
// Extracted from inventoryService.ts

import { supabase, Branch } from "./types";

// Shop data type
export type Shop = {
  id: string;
  name: string;
  displayName: string | null;
  locationId: string;
  locationName: string;
  isActive: boolean;
  company_name: string | null;
  company_name_arabic: string | null;
  cr_number: string | null;
  address_line_1: string | null;
  address_line_2: string | null;
  address_line_3: string | null;
  contact_number: string | null;
  service_description_en: string | null;
  service_description_ar: string | null;
  thank_you_message: string | null;
  thank_you_message_ar: string | null;
  contact_number_arabic: string | null;
  address_line_arabic_1: string | null;
  address_line_arabic_2: string | null;
  brand_name: string | null;
  brand_address: string | null;
  brand_phones: string | null;
  brand_whatsapp: string | null;
  pos_id: string | null;
};

// Shop update data type
export type ShopUpdates = Partial<{
  name: string;
  display_name: string;
  is_active: boolean;
  company_name: string;
  company_name_arabic: string;
  cr_number: string;
  address_line_1: string;
  address_line_2: string;
  address_line_3: string;
  address_line_arabic_1: string;
  address_line_arabic_2: string;
  contact_number: string;
  contact_number_arabic: string;
  service_description_en: string;
  service_description_ar: string;
  thank_you_message: string;
  thank_you_message_ar: string;
  brand_name: string;
  brand_address: string;
  brand_whatsapp: string;
  pos_id: string;
}>;

// Fetch all active shops
export const fetchShops = async (): Promise<Shop[]> => {
  try {
    const { data, error } = await supabase
      .from("shops")
      .select(`
        id,
        name,
        display_name,
        location_id,
        is_active,
        company_name,
        company_name_arabic,
        cr_number,
        address_line_1,
        address_line_2,
        address_line_3,
        address_line_arabic_1,
        address_line_arabic_2,
        contact_number,
        contact_number_arabic,
        service_description_en,
        service_description_ar,
        thank_you_message,
        thank_you_message_ar,
        brand_name,
        brand_address,
        brand_phones,
        brand_whatsapp,
        pos_id,
        locations!inner (
          id,
          name
        )
      `)
      .eq("is_active", true)
      .order("name");

    if (error) {
      console.error("Error fetching shops:", JSON.stringify(error, null, 2));
      return [];
    }

    interface ShopRow {
      id: string;
      name: string;
      display_name: string | null;
      location_id: string;
      is_active: boolean;
      company_name: string | null;
      company_name_arabic: string | null;
      cr_number: string | null;
      address_line_1: string | null;
      address_line_2: string | null;
      address_line_3: string | null;
      address_line_arabic_1: string | null;
      address_line_arabic_2: string | null;
      contact_number: string | null;
      contact_number_arabic: string | null;
      service_description_en: string | null;
      service_description_ar: string | null;
      thank_you_message: string | null;
      thank_you_message_ar: string | null;
      brand_name: string | null;
      brand_address: string | null;
      brand_phones: string | null;
      brand_whatsapp: string | null;
      pos_id: string | null;
      locations?: { id: string; name: string } | null;
    }

    const shops = (data || []).map((shop: ShopRow) => ({
      id: shop.id,
      name: shop.name,
      displayName: shop.display_name || shop.name,
      locationId: shop.location_id,
      locationName: shop.locations?.name || "",
      isActive: shop.is_active,
      company_name: shop.company_name,
      company_name_arabic: shop.company_name_arabic,
      cr_number: shop.cr_number,
      address_line_1: shop.address_line_1,
      address_line_2: shop.address_line_2,
      address_line_3: shop.address_line_3,
      address_line_arabic_1: shop.address_line_arabic_1,
      address_line_arabic_2: shop.address_line_arabic_2,
      contact_number: shop.contact_number,
      contact_number_arabic: shop.contact_number_arabic,
      service_description_en: shop.service_description_en,
      service_description_ar: shop.service_description_ar,
      thank_you_message: shop.thank_you_message,
      thank_you_message_ar: shop.thank_you_message_ar,
      brand_name: shop.brand_name,
      brand_address: shop.brand_address,
      brand_phones: shop.brand_phones,
      brand_whatsapp: shop.brand_whatsapp,
      pos_id: shop.pos_id,
    }));

    return shops;
  } catch (error) {
    console.error("Error in fetchShops:", error);
    return [];
  }
};

// Update a shop
export const updateShop = async (
  id: string,
  updates: ShopUpdates
): Promise<Shop | null> => {
  try {
    const { data, error } = await supabase
      .from("shops")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating shop:", error);
      throw new Error("Failed to update shop");
    }

    return data;
  } catch (error) {
    console.error("Error in updateShop:", error);
    throw error;
  }
};

// Fetch branches (legacy, kept for backward compatibility)
export const fetchBranches = async (): Promise<Branch[]> => {
  try {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching branches:", error);
      return [];
    }

    return (data || []).map((loc: { id: string; name: string; address?: string; created_at?: string; updated_at?: string }) => ({
      id: loc.id,
      name: loc.name,
      address: loc.address || "",
      created_at: loc.created_at || "",
      updated_at: loc.updated_at || "",
    }));
  } catch (error) {
    console.error("Error in fetchBranches:", error);
    return [];
  }
};
