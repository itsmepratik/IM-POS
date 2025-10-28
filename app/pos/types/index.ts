// Shared types for POS category components

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  details?: string;
  uniqueId: string;
  bottleType?: "open" | "closed";
  category?: string;
  brand?: string;
  type?: string;
  source?: string; // Required for lubricant checkout API ("OPEN" or "CLOSED")
}

export interface Product {
  id: number;
  name: string;
  price: number;
  category: "Filters" | "Parts" | "Additives & Fluids";
  brand?: string;
  type?: string;
  imageUrl?: string;
  availableQuantity?: number;
  isAvailable?: boolean;
}

export interface LubricantProduct {
  id: number;
  brand: string;
  name: string;
  basePrice: number;
  type: string;
  image?: string;
  volumes: {
    size: string;
    price: number;
  }[];
}

export interface SelectedVolume {
  size: string;
  quantity: number;
  price: number;
  bottleType?: "open" | "closed";
}

export interface CategoryComponentProps {
  onAddToCart: (items: CartItem[]) => void;
  searchQuery?: string;
}

export interface Brand {
  name: string;
  productCount: number;
}

export interface FilterType {
  name: string;
  productCount: number;
}

export interface PartType {
  name: string;
  productCount: number;
  includesBatteries?: boolean;
}

export type CategoryType =
  | "Lubricants"
  | "Filters"
  | "Parts"
  | "Additives & Fluids";
