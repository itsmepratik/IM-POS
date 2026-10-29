/**
 * Backup table registry — single source of truth for full-system export/restore.
 *
 * Server Components / Route Handlers only. Never import from a Client Component
 * (it pulls in the Drizzle schema). The UI talks to /api/admin/backup|restore.
 *
 * Order matters: `BACKUP_TABLES` is listed parents-first so both export and
 * restore insert parents before children. Deletes run in reverse.
 */

import {
  appointments,
  batches,
  brands,
  cashShiftMovements,
  cashShifts,
  categories,
  customerVehicles,
  customers,
  inventory,
  laborSplits,
  locations,
  openBottleDetails,
  productTypes,
  productVolumes,
  products,
  referenceNumberCounters,
  serviceItems,
  services,
  shops,
  staff,
  tradeInPrices,
  tradeInTransactions,
  transactions,
  types,
} from "@/lib/db/schema";

export const BACKUP_VERSION = 1 as const;

export interface BackupTableEntry {
  /** Key used inside the backup JSON `tables` object. */
  key: string;
  /** Physical Postgres table name (for SQL dump + audit). */
  tableName: string;
}

export type BackupTableKey =
  | "locations"
  | "categories"
  | "brands"
  | "trade_in_prices"
  | "reference_number_counters"
  | "appointments"
  | "services"
  | "customers"
  | "types"
  | "shops"
  | "products"
  | "product_volumes"
  | "product_types"
  | "staff"
  | "customer_vehicles"
  | "inventory"
  | "open_bottle_details"
  | "batches"
  | "cash_shifts"
  | "cash_shift_movements"
  | "transactions"
  | "service_items"
  | "labor_splits"
  | "trade_in_transactions";

export const BACKUP_TABLES: readonly { key: BackupTableKey; tableName: string }[] = [
  { key: "locations", tableName: "locations" },
  { key: "categories", tableName: "categories" },
  { key: "brands", tableName: "brands" },
  { key: "trade_in_prices", tableName: "trade_in_prices" },
  { key: "reference_number_counters", tableName: "reference_number_counters" },
  { key: "appointments", tableName: "appointments" },
  { key: "services", tableName: "services" },
  { key: "customers", tableName: "customers" },
  { key: "types", tableName: "types" },
  { key: "shops", tableName: "shops" },
  { key: "products", tableName: "products" },
  { key: "product_volumes", tableName: "product_volumes" },
  { key: "product_types", tableName: "product_types" },
  { key: "staff", tableName: "staff" },
  { key: "customer_vehicles", tableName: "customer_vehicles" },
  { key: "inventory", tableName: "inventory" },
  { key: "open_bottle_details", tableName: "open_bottle_details" },
  { key: "batches", tableName: "batches" },
  { key: "cash_shifts", tableName: "cash_shifts" },
  { key: "cash_shift_movements", tableName: "cash_shift_movements" },
  { key: "transactions", tableName: "transactions" },
  { key: "service_items", tableName: "service_items" },
  { key: "labor_splits", tableName: "labor_splits" },
  { key: "trade_in_transactions", tableName: "trade_in_transactions" },
] as const;

/** Reverse (children-first) order for destructive deletes. */
export const RESTORE_DELETE_ORDER: readonly { key: BackupTableKey; tableName: string }[] = [
  ...BACKUP_TABLES,
].reverse();

/**
 * Map a backup key to its Drizzle table object for typed queries.
 * Kept in one place so export + restore + CLI can never drift.
 */
export function getDrizzleTable(
  key: BackupTableKey,
): typeof locations | typeof shops | typeof categories | typeof types | typeof brands | typeof products | typeof productVolumes | typeof productTypes | typeof inventory | typeof batches | typeof transactions | typeof tradeInPrices | typeof tradeInTransactions | typeof customers | typeof customerVehicles | typeof openBottleDetails | typeof referenceNumberCounters | typeof staff | typeof appointments | typeof services | typeof serviceItems | typeof laborSplits | typeof cashShifts | typeof cashShiftMovements {
  switch (key) {
    case "locations":
      return locations;
    case "shops":
      return shops;
    case "categories":
      return categories;
    case "types":
      return types;
    case "brands":
      return brands;
    case "products":
      return products;
    case "product_volumes":
      return productVolumes;
    case "product_types":
      return productTypes;
    case "inventory":
      return inventory;
    case "batches":
      return batches;
    case "transactions":
      return transactions;
    case "trade_in_prices":
      return tradeInPrices;
    case "trade_in_transactions":
      return tradeInTransactions;
    case "customers":
      return customers;
    case "customer_vehicles":
      return customerVehicles;
    case "open_bottle_details":
      return openBottleDetails;
    case "reference_number_counters":
      return referenceNumberCounters;
    case "staff":
      return staff;
    case "appointments":
      return appointments;
    case "services":
      return services;
    case "service_items":
      return serviceItems;
    case "labor_splits":
      return laborSplits;
    case "cash_shifts":
      return cashShifts;
    case "cash_shift_movements":
      return cashShiftMovements;
    default: {
      const exhaustive: never = key;
      throw new Error(`Unknown backup table: ${String(exhaustive)}`);
    }
  }
}

export interface BackupMetadata {
  version: number;
  exportedAt: string;
  exportedBy: string;
  rowCounts: Record<string, number>;
  totalRows: number;
  checksumSha256: string;
}

export interface BackupFile {
  kind: "im-pos-full-backup";
  version: number;
  exportedAt: string;
  exportedBy: string;
  rowCounts: Record<string, number>;
  totalRows: number;
  checksumSha256: string;
  tables: Record<string, Record<string, unknown>[]>;
}
