import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { 
  items, 
  categories, 
  brands, 
  suppliers, 
  batches, 
  itemVolumes, 
  locationStock,
  branches, 
  sales, 
  saleItems, 
  inventoryTransactions, 
  inventoryTransfers 
} from './schema';

// Infer types from schema
export type Item = InferSelectModel<typeof items>;
export type NewItem = InferInsertModel<typeof items>;

export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;

export type Brand = InferSelectModel<typeof brands>;
export type NewBrand = InferInsertModel<typeof brands>;

export type Supplier = InferSelectModel<typeof suppliers>;
export type NewSupplier = InferInsertModel<typeof suppliers>;

export type Batch = InferSelectModel<typeof batches>;
export type NewBatch = InferInsertModel<typeof batches>;

export type ItemVolume = InferSelectModel<typeof itemVolumes>;
export type NewItemVolume = InferInsertModel<typeof itemVolumes>;

export type LocationStock = InferSelectModel<typeof locationStock>;
export type NewLocationStock = InferInsertModel<typeof locationStock>;

export type Branch = InferSelectModel<typeof branches>;
export type NewBranch = InferInsertModel<typeof branches>;

export type Sale = InferSelectModel<typeof sales>;
export type NewSale = InferInsertModel<typeof sales>;

export type SaleItem = InferSelectModel<typeof saleItems>;
export type NewSaleItem = InferInsertModel<typeof saleItems>;

export type InventoryTransaction = InferSelectModel<typeof inventoryTransactions>;
export type NewInventoryTransaction = InferInsertModel<typeof inventoryTransactions>;

export type InventoryTransfer = InferSelectModel<typeof inventoryTransfers>;
export type NewInventoryTransfer = InferInsertModel<typeof inventoryTransfers>; 