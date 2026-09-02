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
  shopCode: text("shop_code").default("01"),
  zipCode: text("zip_code").default("319"),
  brandWhatsapp: text("brand_whatsapp"), // Whatsapp number for the shop/brand
  supervisorPasswordHash: text("supervisor_password_hash"), // bcrypt hash for void authorization
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
  }),
);

// Type inference for types table
export type Type = typeof types.$inferSelect;
export type NewType = typeof types.$inferInsert;

export const brands = pgTable("brands", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  imageUrl: text("image_url"),
});

// Type inference for the brands table
export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    brandId: uuid("brand_id").references(() => brands.id, {
      onDelete: "set null",
    }),
    // typeId: uuid("type_id").references(() => types.id, { onDelete: "set null" }),
    // productType: text("product_type"),
    description: text("description"),
    imageUrl: text("image_url"),
    lowStockThreshold: integer("low_stock_threshold").default(0),
    costPrice: numeric("cost_price"),
    manufacturingDate: timestamp("manufacturing_date", { withTimezone: true }),
    isBattery: boolean("is_battery").default(false),
    batteryState: text("battery_state"), // 'new', 'scrap', 'resellable'
  },
  (table) => ({
    categoryIdIdx: index("products_category_idx").on(table.categoryId),
    brandIdIdx: index("products_brand_idx").on(table.brandId),
    nameLowerIdx: index("products_name_lower_idx").on(sql`lower(${table.name})`),
  }),
);

export const productVolumes = pgTable(
  "product_volumes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    volumeDescription: text("volume_description").notNull(),
    sellingPrice: numeric("selling_price").notNull(),
  },
  (table) => ({
    productIdIdx: index("product_volumes_product_idx").on(table.productId),
  }),
);

export const productTypes = pgTable(
  "product_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    typeId: uuid("type_id")
      .notNull()
      .references(() => types.id, { onDelete: "cascade" }),
  },
  (table) => ({
    productIdx: index("product_types_product_idx").on(table.productId),
    typeIdx: index("product_types_type_idx").on(table.typeId),
    uniqueProductType: unique("product_types_product_type_key").on(table.productId, table.typeId),
  }),
);

export const inventory = pgTable(
  "inventory",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "restrict" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),

    // Generic product stock (bottle count — max ~1000 from orders)
    standardStock: integer("standard_stock").default(0),
    sellingPrice: numeric("selling_price"),

    // Lubricant-specific stock
    openBottlesStock: integer("open_bottles_stock").default(0),
    closedBottlesStock: integer("closed_bottles_stock").default(0),

    // Generated total stock (mirrors standard_stock as source of truth)
    totalStock: integer("total_stock").generatedAlwaysAs(
      sql`COALESCE("standard_stock", 0)`,
    ),
  },
  (table) => ({
    productLocationIdx: index("inventory_product_location_idx").on(
      table.productId,
      table.locationId,
    ),
  }),
);

export const batches = pgTable(
  "batches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    inventoryId: uuid("inventory_id")
      .notNull()
      .references(() => inventory.id, { onDelete: "cascade" }),
    costPrice: numeric("cost_price").notNull(),
    quantityReceived: integer("quantity_received").notNull(),
    stockRemaining: integer("stock_remaining").notNull(),
    supplier: text("supplier"),
    purchaseDate: timestamp("purchase_date", {
      withTimezone: true,
    }).defaultNow(),
    isActiveBatch: boolean("is_active_batch").default(false),
    batchNumber: integer("batch_number").default(1),
  },
  (table) => ({
    inventoryActiveIdx: index("batches_inventory_active_idx").on(
      table.inventoryId,
      table.isActiveBatch,
    ),
  }),
);

export const transactions = pgTable(
  "transactions",
  {
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
    isVoided: boolean("is_voided").default(false),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    voidedByStaffId: uuid("voided_by_staff_id").references(() => staff.id, {
      onDelete: "set null",
    }),
    voidReason: text("void_reason"),
    cashShiftId: uuid("cash_shift_id").references(() => cashShifts.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    referenceNumberIdx: index("transactions_ref_idx").on(table.referenceNumber),
    createdAtIdx: index("transactions_date_idx").on(table.createdAt),
    customerIdIdx: index("transactions_customer_idx").on(table.customerId),
    shopIdIdx: index("transactions_shop_idx").on(table.shopId),
    cashShiftIdx: index("transactions_cash_shift_idx").on(table.cashShiftId),
  }),
);

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
  }),
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

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    nameLowerIdx: index("customers_name_lower_idx").on(
      sql`lower(${table.name})`,
    ),
    phoneIdx: index("customers_phone_idx").on(table.phone),
  }),
);

export const customerVehicles = pgTable(
  "customer_vehicles",
  {
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
  },
  (table) => ({
    licensePlateLowerIdx: index("vehicles_plate_lower_idx").on(
      sql`lower(${table.licensePlate})`,
    ),
  }),
);

export const openBottleDetails = pgTable(
  "open_bottle_details",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    inventoryId: uuid("inventory_id")
      .notNull()
      .references(() => inventory.id, { onDelete: "cascade" }),
    initialVolume: numeric("initial_volume").notNull(),
    currentVolume: numeric("current_volume").notNull(),
    openedAt: timestamp("opened_at", { withTimezone: true }).defaultNow(),
    isEmpty: boolean("is_empty").default(false),
  },
  (table) => ({
    inventoryEmptyIdx: index("open_bottle_details_inventory_empty_idx").on(
      table.inventoryId,
      table.isEmpty,
    ),
  }),
);

export const referenceNumberCounters = pgTable("reference_number_counters", {
  prefix: text("prefix").primaryKey(),
  counter: integer("counter").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const staff = pgTable(
  "staff",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    staffId: text("staff_id").notNull().unique(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    role: text("role").notNull().default("staff"), // 'admin' | 'manager' | 'technician' | 'cashier' | 'staff'
    salary: numeric("salary"),
    hireDate: timestamp("hire_date", { withTimezone: true }),
    dateOfBirth: timestamp("date_of_birth", { withTimezone: true }),
    address: text("address"),
    nationalId: text("national_id"),
    emergencyContact: text("emergency_contact"),
    emergencyPhone: text("emergency_phone"),
    profileImageUrl: text("profile_image_url"),
    shopId: uuid("shop_id").references(() => shops.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    emailIdx: index("staff_email_idx").on(table.email),
    roleIdx: index("staff_role_idx").on(table.role),
    shopIdx: index("staff_shop_idx").on(table.shopId),
  }),
);

// Type inference for staff table
export type Staff = typeof staff.$inferSelect;
export type NewStaff = typeof staff.$inferInsert;

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email"),
  serviceType: text("service_type").notNull(),
  appointmentDate: timestamp("appointment_date", {
    withTimezone: true,
  }).notNull(),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  vehicleMake: text("vehicle_make"),
  vehicleModel: text("vehicle_model"),
  vehicleYear: text("vehicle_year"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;

// ── Services & Labor Splits ────────────────────────────────────────────────

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    nameAr: text("name_ar"),
    description: text("description"),
    category: text("category").notNull().default("labor"), // 'labor' | 'diagnostic' | 'composite'
    defaultPrice: numeric("default_price"),
    estimatedDurationMinutes: integer("estimated_duration_minutes"),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    categoryIdx: index("services_category_idx").on(table.category),
    nameLowerIdx: index("services_name_lower_idx").on(sql`lower(${table.name})`),
  }),
);

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;

export const serviceItems = pgTable(
  "service_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    transactionId: uuid("transaction_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    itemType: text("item_type").notNull(), // 'product' | 'service' | 'labor' | 'composite'
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "restrict",
    }),
    serviceId: uuid("service_id").references(() => services.id, {
      onDelete: "restrict",
    }),
    name: text("name").notNull(),
    quantity: numeric("quantity").notNull().default("1"),
    unitPrice: numeric("unit_price").notNull(),
    costPrice: numeric("cost_price").default("0"),
    discountAmount: numeric("discount_amount").default("0"),
    volumeDescription: text("volume_description"),
    source: text("source"), // 'OPEN' | 'CLOSED'
    batchId: uuid("batch_id").references(() => batches.id),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    transactionIdx: index("service_items_transaction_idx").on(
      table.transactionId,
    ),
    productIdx: index("service_items_product_idx").on(table.productId),
    serviceIdx: index("service_items_service_idx").on(table.serviceId),
    typeIdx: index("service_items_type_idx").on(table.itemType),
  }),
);

export type ServiceItem = typeof serviceItems.$inferSelect;
export type NewServiceItem = typeof serviceItems.$inferInsert;

export const laborSplits = pgTable(
  "labor_splits",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serviceItemId: uuid("service_item_id")
      .notNull()
      .references(() => serviceItems.id, { onDelete: "cascade" }),
    staffId: uuid("staff_id").references(() => staff.id, {
      onDelete: "restrict",
    }),
    splitType: text("split_type").notNull(), // 'technician_share' | 'parts_portion' | 'labor_portion'
    amount: numeric("amount").notNull(),
    percentage: numeric("percentage"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    serviceItemIdx: index("labor_splits_service_item_idx").on(
      table.serviceItemId,
    ),
    staffIdx: index("labor_splits_staff_idx").on(table.staffId),
  }),
);

export type LaborSplit = typeof laborSplits.$inferSelect;
export type NewLaborSplit = typeof laborSplits.$inferInsert;

// ── Cash Shifts & Cash Drawer Movements ────────────────────────────────────

export interface DenominationBreakdown {
  fiftyNote?: number;    // 50 OMR
  twentyNote?: number;   // 20 OMR
  tenNote?: number;      // 10 OMR
  fiveNote?: number;     // 5 OMR
  oneNote?: number;      // 1 OMR
  halfNote?: number;     // 1/2 OMR (500 baisa)
  hundredBaisa?: number; // 100 baisa (0.100 OMR)
  coins?: number;        // Other small coins/baisa total in OMR
}

export const cashShifts = pgTable(
  "cash_shifts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shopId: uuid("shop_id")
      .notNull()
      .references(() => shops.id, { onDelete: "restrict" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "restrict" }),
    openedByStaffId: uuid("opened_by_staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "restrict" }),
    closedByStaffId: uuid("closed_by_staff_id").references(() => staff.id, {
      onDelete: "set null",
    }),
    status: text("status").notNull().default("open"), // 'open' | 'closed' | 'reconciled'
    startTime: timestamp("start_time", { withTimezone: true })
      .defaultNow()
      .notNull(),
    endTime: timestamp("end_time", { withTimezone: true }),
    openingCash: numeric("opening_cash").notNull().default("0"),
    openingDenominations: jsonb("opening_denominations").$type<DenominationBreakdown>(),
    openingNotes: text("opening_notes"),
    expectedClosingCash: numeric("expected_closing_cash"),
    actualClosingCash: numeric("actual_closing_cash"),
    closingDenominations: jsonb("closing_denominations").$type<DenominationBreakdown>(),
    cashDifference: numeric("cash_difference"),
    closingNotes: text("closing_notes"),
    totalCashSales: numeric("total_cash_sales").default("0"),
    totalCardSales: numeric("total_card_sales").default("0"),
    totalMobileSales: numeric("total_mobile_sales").default("0"),
    totalCreditSales: numeric("total_credit_sales").default("0"),
    totalRefunds: numeric("total_refunds").default("0"),
    totalTransactions: integer("total_transactions").default(0),
    reconciledByStaffId: uuid("reconciled_by_staff_id").references(
      () => staff.id,
      { onDelete: "set null" },
    ),
    reconciledAt: timestamp("reconciled_at", { withTimezone: true }),
    reconciliationNotes: text("reconciliation_notes"),
    reconciliationStatus: text("reconciliation_status").default("pending"), // 'pending' | 'balanced' | 'overage' | 'shortage' | 'approved'
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    shopStatusIdx: index("cash_shifts_shop_status_idx").on(
      table.shopId,
      table.status,
    ),
    startTimeIdx: index("cash_shifts_start_time_idx").on(table.startTime),
    openedByIdx: index("cash_shifts_opened_by_idx").on(table.openedByStaffId),
  }),
);

export type CashShift = typeof cashShifts.$inferSelect;
export type NewCashShift = typeof cashShifts.$inferInsert;

export const cashShiftMovements = pgTable(
  "cash_shift_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    shiftId: uuid("shift_id")
      .notNull()
      .references(() => cashShifts.id, { onDelete: "cascade" }),
    staffId: uuid("staff_id")
      .notNull()
      .references(() => staff.id, { onDelete: "restrict" }),
    type: text("type").notNull(), // 'CASH_IN' | 'CASH_OUT' | 'DROP' | 'PAY_IN' | 'PAY_OUT'
    amount: numeric("amount").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    shiftIdx: index("cash_shift_movements_shift_idx").on(table.shiftId),
    staffIdx: index("cash_shift_movements_staff_idx").on(table.staffId),
  }),
);

export type CashShiftMovement = typeof cashShiftMovements.$inferSelect;
export type NewCashShiftMovement = typeof cashShiftMovements.$inferInsert;

import { relations } from "drizzle-orm";

export const locationsRelations = relations(locations, ({ many }) => ({
  shops: many(shops),
  inventory: many(inventory),
  transactions: many(transactions),
  cashShifts: many(cashShifts),
}));

export const shopsRelations = relations(shops, ({ one, many }) => ({
  location: one(locations, {
    fields: [shops.locationId],
    references: [locations.id],
  }),
  transactions: many(transactions),
  cashShifts: many(cashShifts),
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
  productTypes: many(productTypes),
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
  // type: one(types, {
  //   fields: [products.typeId],
  //   references: [types.id],
  // }),
  inventory: many(inventory),
  volumes: many(productVolumes),
  productTypes: many(productTypes),
}));

export const productVolumesRelations = relations(productVolumes, ({ one }) => ({
  product: one(products, {
    fields: [productVolumes.productId],
    references: [products.id],
  }),
}));

export const productTypesRelations = relations(productTypes, ({ one }) => ({
  product: one(products, {
    fields: [productTypes.productId],
    references: [products.id],
  }),
  type: one(types, {
    fields: [productTypes.typeId],
    references: [types.id],
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

export const transactionsRelations = relations(
  transactions,
  ({ one, many }) => ({
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
    cashShift: one(cashShifts, {
      fields: [transactions.cashShiftId],
      references: [cashShifts.id],
    }),
    serviceItems: many(serviceItems),
  }),
);

export const staffRelations = relations(staff, ({ one, many }) => ({
  shop: one(shops, {
    fields: [staff.shopId],
    references: [shops.id],
  }),
  transactions: many(transactions),
  laborSplits: many(laborSplits),
  openedShifts: many(cashShifts, { relationName: "openedByStaff" }),
  closedShifts: many(cashShifts, { relationName: "closedByStaff" }),
  cashMovements: many(cashShiftMovements),
}));

export const cashShiftsRelations = relations(cashShifts, ({ one, many }) => ({
  shop: one(shops, {
    fields: [cashShifts.shopId],
    references: [shops.id],
  }),
  location: one(locations, {
    fields: [cashShifts.locationId],
    references: [locations.id],
  }),
  openedByStaff: one(staff, {
    fields: [cashShifts.openedByStaffId],
    references: [staff.id],
    relationName: "openedByStaff",
  }),
  closedByStaff: one(staff, {
    fields: [cashShifts.closedByStaffId],
    references: [staff.id],
    relationName: "closedByStaff",
  }),
  reconciledByStaff: one(staff, {
    fields: [cashShifts.reconciledByStaffId],
    references: [staff.id],
  }),
  transactions: many(transactions),
  movements: many(cashShiftMovements),
}));

export const cashShiftMovementsRelations = relations(
  cashShiftMovements,
  ({ one }) => ({
    shift: one(cashShifts, {
      fields: [cashShiftMovements.shiftId],
      references: [cashShifts.id],
    }),
    staff: one(staff, {
      fields: [cashShiftMovements.staffId],
      references: [staff.id],
    }),
  }),
);

export const servicesRelations = relations(services, ({ many }) => ({
  serviceItems: many(serviceItems),
}));

export const serviceItemsRelations = relations(
  serviceItems,
  ({ one, many }) => ({
    transaction: one(transactions, {
      fields: [serviceItems.transactionId],
      references: [transactions.id],
    }),
    product: one(products, {
      fields: [serviceItems.productId],
      references: [products.id],
    }),
    service: one(services, {
      fields: [serviceItems.serviceId],
      references: [services.id],
    }),
    laborSplits: many(laborSplits),
  }),
);

export const laborSplitsRelations = relations(laborSplits, ({ one }) => ({
  serviceItem: one(serviceItems, {
    fields: [laborSplits.serviceItemId],
    references: [serviceItems.id],
  }),
  staff: one(staff, {
    fields: [laborSplits.staffId],
    references: [staff.id],
  }),
}));

