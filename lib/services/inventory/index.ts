// Inventory Domain Services - Central Export
// This file re-exports all domain services for backward compatibility

// Types
export * from "./types";

// Category Service
export {
  fetchCategories,
  addCategoryService,
  updateCategoryService,
  deleteCategoryService,
  addCategory,
  updateCategory,
  deleteCategory,
} from "./categoryService";

// Brand Service
export {
  fetchBrands,
  addBrandService,
  updateBrandService,
  deleteBrandService,
  addBrand,
  updateBrand,
  deleteBrand,
} from "./brandService";

// Supplier Service
export {
  fetchSuppliers,
  addSupplierService,
  updateSupplierService,
  deleteSupplierService,
} from "./supplierService";

// Shop/Branch Service
export {
  fetchShops,
  updateShop,
  fetchBranches,
} from "./shopService";
export type { Shop, ShopUpdates } from "./shopService";

// Batch Service
export {
  addBatch,
  updateBatch,
  deleteBatch,
  createInitialBatchForInventory,
  cleanupOldBatches,
  fetchBatchesForInventory,
} from "./batchService";
