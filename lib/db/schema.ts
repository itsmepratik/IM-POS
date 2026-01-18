import { sql } from "drizzle-orm";
import {
  boolean,
  index,
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

export const shops = pgTable("shops", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "restrict" }),
  displayName: text("display_name"),
  posId: text("pos_id"),
  brandWhatsapp: text("brand_whatsapp"), // Whatsapp number for the shop/brand
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Type inference for shops table
export type Shop = typeof shops.$inferSelect;
export type NewShop = typeof shops.$inferInsert;

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
});

export const types = pgTable(
  "types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    uniqueCategoryType: unique().on(table.categoryId, table.name),
  })
);

// Type inference for types table
export type Type = typeof types.$inferSelect;
export type NewType = typeof types.$inferInsert;

export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  images: jsonb("images"), // JSONB column to store brand images (URLs, metadata, etc.)
});

// Type inference for the brands table
export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),
  brandId: uuid("brand_id").references(() => brands.id, {
    onDelete: "set null",
  }),
  typeId: uuid("type_id").references(() => types.id, { onDelete: "set null" }),
  productType: text("product_type"), // Legacy field, kept for backward compatibility
  description: text("description"),
  imageUrl: text("image_url"),
  lowStockThreshold: integer("low_stock_threshold").default(0),
  costPrice: numeric("cost_price"),
  manufacturingDate: timestamp("manufacturing_date", { withTimezone: true }),
  isBattery: boolean("is_battery").default(false),
  batteryState: text("battery_state"), // 'new', 'scrap', 'resellable'
}, (table) => ({
  categoryIdIdx: index("products_category_idx").on(table.categoryId),
}));

export const productVolumes = pgTable("product_volumes", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  volumeDescription: text("volume_description").notNull(),
  sellingPrice: numeric("selling_price").notNull(),
}, (table) => ({
  productIdIdx: index("product_volumes_product_idx").on(table.productId),
}));

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
}, (table) => ({
  productLocationIdx: index("inventory_product_location_idx").on(table.productId, table.locationId),
}));

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
  batchNumber: integer("batch_number").default(1),
}, (table) => ({
  inventoryActiveIdx: index("batches_inventory_active_idx").on(table.inventoryId, table.isActiveBatch),
}));

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  referenceNumber: text("reference_number").notNull().unique(),
  locationId: uuid("location_id")
    .notNull()
    .references(() => locations.id, { onDelete: "restrict" }),
  shopId: uuid("shop_id").references(() => shops.id, {
    onDelete: "restrict",
  }),
  cashierId: uuid("cashier_id").references(() => staff.id, {
    onDelete: "set null",
  }), // Foreign key to staff.id (UUID)
  type: text("type").notNull(), // 'SALE' | 'REFUND' | 'WARRANTY_CLAIM' | 'CREDIT' | 'ON_HOLD'
  totalAmount: numeric("total_amount").notNull(),
  itemsSold: jsonb("items_sold").$type<unknown[]>(),
  paymentMethod: text("payment_method"),
  carPlateNumber: text("car_plate_number"), // For 'on hold' transactions
  mobilePaymentAccount: text("mobile_payment_account"), // Account used for mobile payment (Adanan or Forman)
  mobileNumber: text("mobile_number"), // Mobile number used for the transaction
  receiptHtml: text("receipt_html"),
  batteryBillHtml: text("battery_bill_html"),
  originalReferenceNumber: text("original_reference_number"),
  customerId: uuid("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }), // Link to customers table
  notes: text("notes"), // Additional notes (e.g., stock transfer details, special instructions)
  discountType: text("discount_type"), // Type of discount: "percentage" or "amount"
  discountValue: numeric("discount_value"), // Discount percentage (0-100) or fixed amount in OMR
  discountAmount: numeric("discount_amount"), // Calculated discount amount in OMR
  subtotalBeforeDiscount: numeric("subtotal_before_discount"), // Original subtotal before discount
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => ({
  referenceNumberIdx: index("transactions_ref_idx").on(table.referenceNumber),
}));

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

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const customerVehicles = pgTable("customer_vehicles", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "cascade" }),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: text("year").notNull(),
  licensePlate: text("license_plate").notNull(),
  vin: text("vin"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
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
}, (table) => ({
  inventoryEmptyIdx: index("open_bottle_details_inventory_empty_idx").on(table.inventoryId, table.isEmpty),
}));

export const referenceNumberCounters = pgTable("reference_number_counters", {
  prefix: text("prefix").primaryKey(),
  counter: integer("counter").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const staff = pgTable("staff", {
  id: uuid("id").primaryKey().defaultRandom(),
  staffId: text("staff_id").notNull().unique(),
  name: text("name").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Type inference for staff table
export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;

import { relations } from "drizzle-orm";

export const locationsRelations = relations(locations, ({ many }) => ({
  shops: many(shops),
  inventory: many(inventory),
  transactions: many(transactions),
}));

export const shopsRelations = relations(shops, ({ one, many }) => ({
  location: one(locations, {
    fields: [shops.locationId],
    references: [locations.id],
  }),
  transactions: many(transactions),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
  types: many(types),
}));

export const typesRelations = relations(types, ({ one, many }) => ({
  category: one(categories, {
    fields: [types.categoryId],
    references: [categories.id],
  }),
  products: many(products),
}));

export const brandsRelations = relations(brands, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  type: one(types, {
    fields: [products.typeId],
    references: [types.id],
  }),
  inventory: many(inventory),
  volumes: many(productVolumes),
}));

export const productVolumesRelations = relations(productVolumes, ({ one }) => ({
  product: one(products, {
    fields: [productVolumes.productId],
    references: [products.id],
  }),
}));

export const inventoryRelations = relations(inventory, ({ one, many }) => ({
  product: one(products, {
    fields: [inventory.productId],
    references: [products.id],
  }),
  location: one(locations, {
    fields: [inventory.locationId],
    references: [locations.id],
  }),
  batches: many(batches),
}));

export const batchesRelations = relations(batches, ({ one }) => ({
  inventory: one(inventory, {
    fields: [batches.inventoryId],
    references: [inventory.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  location: one(locations, {
    fields: [transactions.locationId],
    references: [locations.id],
  }),
  shop: one(shops, {
    fields: [transactions.shopId],
    references: [shops.id],
  }),
  cashier: one(staff, {
    fields: [transactions.cashierId],
    references: [staff.id],
  }),
  customer: one(customers, {
    fields: [transactions.customerId],
    references: [customers.id],
  }),
}));

export const staffRelations = relations(staff, ({ many }) => ({
  transactions: many(transactions),
}));
