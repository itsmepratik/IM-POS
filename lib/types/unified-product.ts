/**
 * Unified Product Types for Inventory-POS Integration
 *
 * This file defines unified types that bridge the gap between the inventory system
 * and the POS system, ensuring data consistency and type safety.
 */

import { z } from "zod";

// Base unified product interface
export interface UnifiedProduct {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;

  // Category and brand information
  categoryId?: string | null;
  categoryName?: string | null;
  brandId?: string | null;
  brandName?: string | null;
  productType?: string | null;

  // Pricing and stock information
  basePrice: number;
  costPrice?: number | null;
  lowStockThreshold: number;
  manufacturingDate?: string | null;

  // Location-specific inventory
  inventory?: ProductInventory;

  // Product-specific data
  isLubricant: boolean;
  volumes?: ProductVolume[];
  bottleStates?: BottleStates;
  batches?: ProductBatch[];

  // Metadata
  createdAt: string | null;
  updatedAt: string | null;
}

// Location-specific inventory information
export interface ProductInventory {
  locationId: string;
  locationName?: string;
  standardStock: number;
  openBottlesStock: number;
  closedBottlesStock: number;
  totalStock: number;
  sellingPrice: number;
  isAvailable: boolean;
}

// Product volumes (for lubricants)
export interface ProductVolume {
  id: string;
  size: string;
  price: number;
  isActive?: boolean;
}

// Bottle states for lubricants
export interface BottleStates {
  open: number;
  closed: number;
}

// Product batches for inventory tracking
export interface ProductBatch {
  id: string;
  purchaseDate: string | null;
  expirationDate: string | null;
  supplierId: string | null;
  supplierName?: string | null;
  costPrice: number | null;
  initialQuantity: number | null;
  currentQuantity: number | null;
  isActiveBatch?: boolean;
}

// POS-specific product interface (simplified for sales)
export interface POSProduct {
  id: number; // Numeric ID for POS compatibility
  originalId: string; // Original UUID
  name: string;
  price: number;
  category:
    | "Lubricants"
    | "Filters"
    | "Parts"
    | "Additives & Fluids"
    | "Batteries";
  brand?: string;
  type?: string;
  availableQuantity: number;
  imageUrl?: string;
  isAvailable: boolean;
}

// POS-specific lubricant product interface
export interface POSLubricantProduct {
  id: number; // Numeric ID for POS compatibility
  originalId: string; // Original UUID
  brand: string;
  name: string;
  basePrice: number;
  type: string;
  image?: string;
  volumes: POSLubricantVolume[];
  isAvailable: boolean;
}

// POS lubricant volume with stock information
export interface POSLubricantVolume {
  size: string;
  price: number;
  availableQuantity: number;
  bottleStates?: BottleStates;
}

// Validation schemas
export const UnifiedProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Product name is required"),
  description: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),

  categoryId: z.string().uuid().nullable().optional(),
  categoryName: z.string().nullable().optional(),
  brandId: z.string().uuid().nullable().optional(),
  brandName: z.string().nullable().optional(),
  productType: z.string().nullable().optional(),

  basePrice: z.number().min(0, "Base price must be non-negative"),
  costPrice: z.number().min(0).nullable().optional(),
  lowStockThreshold: z
    .number()
    .min(0, "Low stock threshold must be non-negative"),
  manufacturingDate: z.string().nullable().optional(),

  isLubricant: z.boolean(),

  volumes: z
    .array(
      z.object({
        id: z.string().uuid(),
        size: z.string().min(1, "Volume size is required"),
        price: z.number().min(0, "Volume price must be non-negative"),
        isActive: z.boolean().optional(),
      })
    )
    .optional(),

  bottleStates: z
    .object({
      open: z.number().min(0, "Open bottles count must be non-negative"),
      closed: z.number().min(0, "Closed bottles count must be non-negative"),
    })
    .optional(),

  createdAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime().nullable(),
});

export const ProductInventorySchema = z.object({
  locationId: z.string().uuid(),
  locationName: z.string().optional(),
  standardStock: z.number().min(0, "Standard stock must be non-negative"),
  openBottlesStock: z
    .number()
    .min(0, "Open bottles stock must be non-negative"),
  closedBottlesStock: z
    .number()
    .min(0, "Closed bottles stock must be non-negative"),
  totalStock: z.number().min(0, "Total stock must be non-negative"),
  sellingPrice: z.number().min(0, "Selling price must be non-negative"),
  isAvailable: z.boolean(),
});

export const POSProductSchema = z.object({
  id: z.number().int().positive(),
  originalId: z.string().uuid(),
  name: z.string().min(1, "Product name is required"),
  price: z.number().min(0, "Price must be non-negative"),
  category: z.enum([
    "Lubricants",
    "Filters",
    "Parts",
    "Additives & Fluids",
    "Batteries",
  ]),
  brand: z.string().optional(),
  type: z.string().optional(),
  availableQuantity: z
    .number()
    .min(0, "Available quantity must be non-negative"),
  imageUrl: z.string().url().optional(),
  isAvailable: z.boolean(),
});

export const POSLubricantProductSchema = z.object({
  id: z.number().int().positive(),
  originalId: z.string().uuid(),
  brand: z.string().min(1, "Brand is required"),
  name: z.string().min(1, "Product name is required"),
  basePrice: z.number().min(0, "Base price must be non-negative"),
  type: z.string().min(1, "Type is required"),
  image: z.string().url().optional(),
  volumes: z.array(
    z.object({
      size: z.string().min(1, "Volume size is required"),
      price: z.number().min(0, "Volume price must be non-negative"),
      availableQuantity: z
        .number()
        .min(0, "Available quantity must be non-negative"),
      bottleStates: z
        .object({
          open: z.number().min(0),
          closed: z.number().min(0),
        })
        .optional(),
    })
  ),
  isAvailable: z.boolean(),
});

// Type guards
export const isLubricantProduct = (product: UnifiedProduct): boolean => {
  return product.isLubricant === true;
};

export const isAvailableProduct = (product: UnifiedProduct): boolean => {
  if (!product.inventory) return false;
  return product.inventory.isAvailable && product.inventory.totalStock > 0;
};

// Error types for product operations
export class ProductValidationError extends Error {
  constructor(message: string, public field: string, public value: unknown) {
    super(message);
    this.name = "ProductValidationError";
  }
}

export class ProductNotFoundError extends Error {
  constructor(productId: string, locationId?: string) {
    super(
      locationId
        ? `Product ${productId} not found in location ${locationId}`
        : `Product ${productId} not found`
    );
    this.name = "ProductNotFoundError";
  }
}

export class InsufficientStockError extends Error {
  constructor(
    productId: string,
    requestedQuantity: number,
    availableQuantity: number
  ) {
    super(
      `Insufficient stock for product ${productId}. Requested: ${requestedQuantity}, Available: ${availableQuantity}`
    );
    this.name = "InsufficientStockError";
  }
}
