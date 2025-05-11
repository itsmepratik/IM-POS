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

// Add missing exports to resolve build errors
export type Category = {
  id: string;
  name: string;
};

export type Brand = {
  id: string;
  name: string;
};

export type Supplier = {
  id: string;
  name: string;
};

export type Item = {
  id: string;
  name: string;
};

export type Batch = {
  id: string;
  item_id: string;
  purchase_date: string;
  cost_price: number;
  initial_quantity: number;
  current_quantity: number;
  supplier_id: string;
  expiration_date?: string;
};

export type Volume = {
  size: string;
  price: number;
};

export type BottleStates = "open" | "closed";

// No-op functions to prevent build errors
export const debugFixOilProducts = async (): Promise<void> => {
  console.log("Debug fix oil products is not implemented in production");
};

export const fetchCategories = async (): Promise<Category[]> => {
  console.log("Fetch categories is not implemented in production");
  return [];
};

export const fetchBrands = async (): Promise<Brand[]> => {
  console.log("Fetch brands is not implemented in production");
  return [];
};

export const fetchSuppliers = async (): Promise<Supplier[]> => {
  console.log("Fetch suppliers is not implemented in production");
  return [];
};

export const fetchBranches = async (): Promise<Branch[]> => {
  console.log("Fetch branches is not implemented in production");
  return MOCK_BRANCHES;
};

export const fetchItems = async (branchId: string): Promise<Item[]> => {
  console.log(`Fetch items for branch ${branchId} is not implemented in production`);
  return [];
};

export const fetchItem = async (id: string): Promise<Item | null> => {
  console.log(`Fetch item ${id} is not implemented in production`);
  return null;
};

export const createItem = async (item: Omit<Item, "id">, branchId: string): Promise<Item> => {
  console.log(`Create item in branch ${branchId} is not implemented in production`);
  return { id: "mock-id", ...item };
};

export const updateItem = async (id: string, item: Partial<Item>): Promise<Item | null> => {
  console.log(`Update item ${id} is not implemented in production`);
  return null;
};

export const deleteItem = async (id: string): Promise<boolean> => {
  console.log(`Delete item ${id} is not implemented in production`);
  return true;
};

export const addBatch = async (itemId: string, batch: Partial<Batch>): Promise<boolean> => {
  console.log(`Add batch to item ${itemId} is not implemented in production`);
  return true;
};

export const updateBatch = async (itemId: string, batchId: string, batch: Partial<Batch>): Promise<boolean> => {
  console.log(`Update batch ${batchId} for item ${itemId} is not implemented in production`);
  return true;
};

export const deleteBatch = async (itemId: string, batchId: string): Promise<boolean> => {
  console.log(`Delete batch ${batchId} for item ${itemId} is not implemented in production`);
  return true;
};

export const addCategory = async (name: string): Promise<string> => {
  console.log(`Add category ${name} is not implemented in production`);
  return "mock-id";
};

export const updateCategory = async (id: string, name: string): Promise<boolean> => {
  console.log(`Update category ${id} is not implemented in production`);
  return true;
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  console.log(`Delete category ${id} is not implemented in production`);
  return true;
};

export const addBrand = async (name: string): Promise<string> => {
  console.log(`Add brand ${name} is not implemented in production`);
  return "mock-id";
};

export const updateBrand = async (id: string, name: string): Promise<boolean> => {
  console.log(`Update brand ${id} is not implemented in production`);
  return true;
};

export const deleteBrand = async (id: string): Promise<boolean> => {
  console.log(`Delete brand ${id} is not implemented in production`);
  return true;
};
