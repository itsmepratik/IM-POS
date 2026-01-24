// Shared types for inventory domain services
// Extracted from inventoryService.ts

import { createClient } from "@/supabase/client";

// Create a singleton Supabase client to prevent dynamic import issues
export const supabase = createClient();

// Type definition for Branch
export type Branch = {
  id: string;
  name: string;
  address: string;
  created_at: string;
  updated_at: string;
  // Bill Header Details
  company_name?: string;
  company_name_arabic?: string;
  cr_number?: string;
  address_line_1?: string;
  address_line_2?: string;
  address_line_3?: string;
  address_line_arabic_1?: string;
  address_line_arabic_2?: string;
  contact_number?: string;
  contact_number_arabic?: string;
  // Extended Bill Details
  service_description_en?: string;
  service_description_ar?: string;
  thank_you_message?: string;
  thank_you_message_ar?: string;
  brand_name?: string;
  brand_address?: string;
  brand_phones?: string;
  brand_whatsapp?: string;
  pos_id?: string;
};

export type Item = {
  id: string;
  product_id?: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  brand: string;
  brand_id: string;
  category_id: string;
  type: string | null;
  type_id: string | null;
  type_name: string | null;
  description: string | null;
  isOil?: boolean;
  imageUrl?: string;
  image_url: string | null;
  volumes?: Volume[];
  batches?: Batch[];
  created_at: string | null;
  updated_at: string | null;
  lowStockAlert?: number;
  isBattery?: boolean;
  batteryState?: "new" | "scrap" | "resellable";
  costPrice?: number;
  manufacturingDate?: string | null;
  totalOpenVolume?: number;
  specification?: string | null;
  types?: Type[];
};

export type Volume = {
  id: string;
  item_id: string;
  size: string;
  price: number;
  created_at: string | null;
  updated_at: string | null;
};

export type Batch = {
  id: string;
  item_id: string;
  batch_number?: number;
  purchase_date: string | null;
  expiration_date: string | null;
  supplier_id: string | null;
  cost_price: number | null;
  initial_quantity: number | null;
  current_quantity: number | null;
  is_active_batch?: boolean;
  created_at: string | null;
  updated_at: string | null;
};

export type BottleStates = {
  open: number;
  closed: number;
};

export type Category = {
  id: string;
  name: string;
};

export type Brand = {
  id: string;
  name: string;
  image_url?: string | null;
};

export type Supplier = {
  id: string;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
};

export type Type = {
  id: string;
  name: string;
  category_id?: string | null;
};

// Helper type for stock status
export type StockStatus = "all" | "in-stock" | "low-stock" | "out-of-stock";

// Inventory filters type
export type InventoryFilters = {
  minPrice?: number;
  maxPrice?: number;
  stockStatus?: StockStatus;
  showLowStockOnly?: boolean;
  showOutOfStockOnly?: boolean;
  showInStock?: boolean;
  showBatteries?: boolean;
  batteryState?: "new" | "scrap" | "resellable";
  sortBy?: "name" | "price";
  sortOrder?: "asc" | "desc";
};

// Helper function to resolve location ID
export const resolveLocationId = async (locId: string): Promise<string> => {
  const uuidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

  if (locId === "sanaiya") {
    const { data: location } = await supabase
      .from("locations")
      .select("id")
      .ilike("name", "Sanaiya")
      .single();
    if (location) return location.id;
  } else if (locId === "abu-durus") {
    const { data: location } = await supabase
      .from("locations")
      .select("id")
      .ilike("name", "Abu Dhurus")
      .single();
    if (location) return location.id;
  } else if (!uuidRegex.test(locId)) {
    const { data: location } = await supabase
      .from("locations")
      .select("id")
      .eq("name", locId)
      .single();
    if (location) return location.id;
  }

  return locId;
};

// Helper to check for valid UUID
export const isUUID = (str: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
