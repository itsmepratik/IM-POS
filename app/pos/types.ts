import { Product } from "@/lib/hooks/data/useIntegratedPOSData";

export interface LaborSplit {
  staffId?: string;
  staffName?: string;
  splitType: "technician_share" | "parts_portion" | "labor_portion";
  amount: number;
  percentage?: number;
  description?: string;
}

export interface CartItem extends Omit<
  Product,
  "category" | "quantity" | "availableQuantity" | "isAvailable" | "originalId"
> {
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
  // Service/Labor fields
  isService?: boolean;
  serviceName?: string;
  serviceId?: string;
  serviceDescription?: string;
  splits?: LaborSplit[];
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
