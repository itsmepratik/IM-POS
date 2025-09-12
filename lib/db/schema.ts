import { sql } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const locations = pgTable("locations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
});

export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),
  brandId: uuid("brand_id").references(() => brands.id, {
    onDelete: "set null",
  }),
  brand: text("brand"), // Keep for backward compatibility
  productType: text("product_type"),
  description: text("description"),
  imageUrl: text("image_url"),
  lowStockThreshold: integer("low_stock_threshold").default(0),
  costPrice: numeric("cost_price"),
  manufacturingDate: timestamp("manufacturing_date", { withTimezone: true }),
});

export const productVolumes = pgTable("product_volumes", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  volumeDescription: text("volume_description").notNull(),
  sellingPrice: numeric("selling_price").notNull(),
});

export const inventory = pgTable("inventory", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "restrict" }),

  // Generic product stock
  standardStock: integer("standard_stock").default(0),
  sellingPrice: numeric("selling_price"),

  // Lubricant-specific stock
  openBottlesStock: integer("open_bottles_stock").default(0),
  closedBottlesStock: integer("closed_bottles_stock").default(0),

  // Generated total stock
  totalStock: integer("total_stock").generatedAlwaysAs(
    sql`COALESCE("standard_stock", 0) + COALESCE("open_bottles_stock", 0) + COALESCE("closed_bottles_stock", 0)`
  ),
});

export const batches = pgTable("batches", {
  id: uuid("id").primaryKey().defaultRandom(),
  inventoryId: uuid("inventory_id")
    .notNull()
    .references(() => inventory.id, { onDelete: "cascade" }),
  costPrice: numeric("cost_price").notNull(),
  quantityReceived: integer("quantity_received").notNull(),
  stockRemaining: integer("stock_remaining").notNull(),
  supplier: text("supplier"),
  purchaseDate: timestamp("purchase_date", { withTimezone: true }).defaultNow(),
  isActiveBatch: boolean("is_active_batch").default(false),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  referenceNumber: text("reference_number").notNull().unique(),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "restrict" }),
  shopId: uuid("shop_id").references(() => locations.id, {
    onDelete: "restrict",
  }),
  cashierId: uuid("cashier_id"),
  type: text("type").notNull(), // 'SALE' | 'REFUND' | 'WARRANTY_CLAIM'
  totalAmount: numeric("total_amount").notNull(),
  itemsSold: jsonb("items_sold").$type<unknown[]>(),
  paymentMethod: text("payment_method"),
  receiptHtml: text("receipt_html"),
  batteryBillHtml: text("battery_bill_html"),
  originalReferenceNumber: text("original_reference_number"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const tradeInPrices = pgTable(
  "trade_in_prices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    size: text("size").notNull(),
    condition: text("condition").notNull(), // 'Scrap' or 'Resalable'
    tradeInValue: numeric("trade_in_value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    uniqueSizeCondition: unique().on(table.size, table.condition),
  })
);

export const tradeInTransactions = pgTable("trade_in_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionId: uuid("transaction_id")
    .notNull()
    .references(() => transactions.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  tradeInValue: numeric("trade_in_value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const openBottleDetails = pgTable("open_bottle_details", {
  id: uuid("id").primaryKey().defaultRandom(),
  inventoryId: uuid("inventory_id")
    .notNull()
    .references(() => inventory.id, { onDelete: "cascade" }),
  initialVolume: numeric("initial_volume").notNull(),
  currentVolume: numeric("current_volume").notNull(),
  openedAt: timestamp("opened_at", { withTimezone: true }).defaultNow(),
  isEmpty: boolean("is_empty").default(false),
});
