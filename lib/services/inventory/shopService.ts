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
  shop_code: string | null;
  zip_code: string | null;
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
        shop_code,
        zip_code,
        locations!shops_location_id_locations_id_fk!inner (
          id,
          name
        )
      `)
      .eq("is_active", true)
      .order("name");

    // Ambiguous FKs (PGRST201) or stale schema cache: retry without the
    // embed and join locations client-side so branches always load.
    let shopRows: any[] = (data as any[]) || [];
    const embedFailed =
      !!error &&
      ((error as any)?.code === "PGRST201" ||
        (typeof (error as any)?.message === "string" &&
          ((error as any).message.includes("more than one relationship") ||
            ((error as any).message.includes("relationship") &&
              (error as any).message.includes("schema cache")))));
    if (error && embedFailed) {
      console.warn(
        "[fetchShops] Embed query failed — falling back to split queries.",
        (error as any)?.message,
      );
      const { data: rawShops, error: rawErr } = await supabase
        .from("shops")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (rawErr) {
        console.error("Error fetching shops:", JSON.stringify(rawErr, null, 2));
        return [];
      }
      const locationIds = [
        ...new Set(
          (rawShops || []).map((s: any) => s.location_id).filter(Boolean),
        ),
      ];
      let locationsById = new Map<string, string>();
      if (locationIds.length > 0) {
        const { data: locRows } = await supabase
          .from("locations")
          .select("id, name")
          .in("id", locationIds);
        locationsById = new Map(
          (locRows || []).map((l: any) => [l.id, l.name]),
        );
      }
      shopRows = (rawShops || []).map((s: any) => ({
        ...s,
        locations: s.location_id
          ? { id: s.location_id, name: locationsById.get(s.location_id) || "" }
          : null,
      }));
    } else if (error) {
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
      shop_code: string | null;
      zip_code: string | null;
      locations?: { id: string; name: string } | { id: string; name: string }[] | null;
    }

    const shops = (shopRows || []).map((shop: ShopRow) => ({
      id: shop.id,
      name: shop.name,
      displayName: shop.display_name || shop.name,
      locationId: shop.location_id,
      locationName: Array.isArray(shop.locations)
        ? shop.locations[0]?.name || ""
        : shop.locations?.name || "",
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
      shop_code: shop.shop_code,
      zip_code: shop.zip_code,
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
