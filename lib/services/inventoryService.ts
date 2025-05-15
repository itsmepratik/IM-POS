// Re-export all types and functions from branchInventoryService.ts
export * from './branchInventoryService';

// Type definition for Category
export type Category = {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
};

// Type definition for Brand
export type Brand = {
  id: string;
  name: string;
  created_at?: string;
  updated_at?: string;
};

// Type definition for Supplier
export type Supplier = {
  id: string;
  name: string;
  contact?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
};

// Type definition for Branch
export type Branch = {
  id: string;
  name: string;
  address: string;
  created_at: string;
  updated_at: string;
};

// Mock data for branches (not used directly, just for reference)
export const MOCK_BRANCHES: Branch[] = [
  {
    id: "1",
    name: "Abu Dhabi Branch",
    address: "123 Main St",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Hafeet Branch",
    address: "456 Center Ave",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "3",
    name: "West Side Branch",
    address: "789 West Blvd",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// Mock data for categories
export const MOCK_CATEGORIES: Category[] = [
  { id: "1", name: "Oils" },
  { id: "2", name: "Filters" },
  { id: "3", name: "Fluids" },
  { id: "4", name: "Parts" },
];

// Mock data for brands
export const MOCK_BRANDS: Brand[] = [
  { id: "1", name: "Castrol" },
  { id: "2", name: "Mobil" },
  { id: "3", name: "Bosch" },
  { id: "4", name: "K&N" },
];

// Mock data for suppliers
export const MOCK_SUPPLIERS: Supplier[] = [
  { id: "1", name: "Auto Parts Wholesale" },
  { id: "2", name: "OEM Suppliers Inc." },
];

// Export API functions that items-context expects
export const fetchItems = async (branchId: string) => {
  return fetchBranchInventory(branchId);
};

export const fetchItem = async (itemId: string, branchId: string) => {
  const items = await fetchBranchInventory(branchId);
  return items.find(item => item.id === itemId) || null;
};

export const createItem = async (item: Omit<Item, "id">, branchId: string) => {
  // Mock implementation
  const newId = Math.random().toString(36).substring(2, 9);
  const newItem = { ...item, id: newId } as Item;
  return newItem;
};

export const updateItem = async (id: string, item: Partial<Item>, branchId: string) => {
  // Mock implementation
  return { ...item, id } as Item;
};

export const deleteItem = async (id: string, branchId?: string) => {
  return deleteBranchItem(id, branchId);
};

export const fetchCategories = async () => {
  return MOCK_CATEGORIES;
};

export const fetchBrands = async () => {
  return MOCK_BRANDS;
};

export const fetchBranches = async () => {
  return MOCK_BRANCHES;
};

export const fetchSuppliers = async () => {
  return MOCK_SUPPLIERS;
};

export const addCategory = async (name: string) => {
  // Mock implementation
  const newId = Math.random().toString(36).substring(2, 9);
  return { id: newId, name };
};

export const updateCategory = async (oldName: string, newName: string) => {
  return true; // Mock success
};

export const deleteCategory = async (name: string) => {
  return true; // Mock success
};

export const addBrand = async (name: string) => {
  // Mock implementation
  const newId = Math.random().toString(36).substring(2, 9);
  return { id: newId, name };
};

export const updateBrand = async (oldName: string, newName: string) => {
  return true; // Mock success
};

export const deleteBrand = async (name: string) => {
  return true; // Mock success
};

export const addBatch = async (itemId: string, batchData: any) => {
  return true; // Mock success
};

export const updateBatch = async (itemId: string, batchId: string, batchData: any) => {
  return true; // Mock success
};

export const deleteBatch = async (itemId: string, batchId: string) => {
  return true; // Mock success
};
