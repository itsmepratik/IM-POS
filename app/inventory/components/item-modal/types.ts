// Types for item-modal component extraction
// Extracted from item-modal.tsx

import type { Item, Volume, BottleStates, Batch } from "../items-context";
import type { Type } from "@/lib/services/inventoryService";

// Extended Item interface to include additional properties needed in the modal
export interface ExtendedItem extends Omit<Item, "image_url" | "price" | "stock" | "costPrice" | "lowStockAlert"> {
  price: number | string;
  stock: number | string;
  isOil: boolean;
  imageUrl?: string;
  imageBlob?: string;
  notes?: string;
  lowStockAlert?: number | string;
  cost?: number | string;
  costPrice?: number | string;
  manufacturingDate?: string;
  batches: Batch[];
  isBattery?: boolean;
  batteryState?: "new" | "scrap" | "resellable";
  specification?: string;
  types?: Type[];
  selectedTypeIds?: string[];
}

export interface ItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: Item;
  onItemUpdated?: (item: Item) => void;
}

// Define a type for the tab values
export type TabType = "general" | "volumes" | "batches";

// Image tab type
export type ImageTabType = "url" | "upload";

// New batch form type (without id)
export type NewBatchForm = Omit<Batch, "id"> & {
  purchaseDate?: string;
  quantity?: number;
  costPrice?: number;
};

// Default values
export const defaultFormData: ExtendedItem = {
  id: "",
  name: "",
  category: "",
  stock: "",
  price: "",
  cost: 0,
  brand: "",
  type: "",
  type_id: null,
  type_name: null,
  imageUrl: "",
  imageBlob: "",
  notes: "",
  lowStockAlert: 10,
  isOil: false,
  bottleStates: { open: 0, closed: 0 },
  volumes: [],
  batches: [],
  category_id: null,
  brand_id: null,
  created_at: null,
  updated_at: null,
  description: null,
  image_url: null,
  isBattery: false,
  batteryState: "new",
  specification: "",
};

export const defaultNewBatch: NewBatchForm = {
  item_id: "",
  purchase_date: "",
  expiration_date: null,
  supplier_id: null,
  cost_price: 0,
  initial_quantity: 0,
  current_quantity: 0,
  created_at: null,
  updated_at: null,
};

export const defaultEditingBatch: Batch = {
  id: "",
  item_id: "",
  purchase_date: "",
  expiration_date: null,
  supplier_id: null,
  cost_price: 0,
  initial_quantity: 0,
  current_quantity: 0,
  created_at: null,
  updated_at: null,
};
