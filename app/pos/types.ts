import { Product } from "@/lib/hooks/data/useIntegratedPOSData";

export interface CartItem extends Omit<Product, "category" | "quantity" | "availableQuantity" | "isAvailable" | "originalId"> {
  quantity: number;
  details?: string;
  uniqueId: string;
  bottleType?: "open" | "closed";
  source?: string; // Required for lubricant checkout API ("OPEN" or "CLOSED")
  category?: string;
  brand?: string;
  type?: string;
  availableQuantity?: number;
  isAvailable?: boolean;
  originalId?: string;
}

export interface SelectedVolume {
  size: string;
  quantity: number;
  price: number;
  bottleType?: "open" | "closed";
}

export interface ImportedCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface TradeinBattery {
  id: string;
  size: string;
  status: "scrap" | "resellable";
  amount: number;
}
