// Type definitions
// Type definition for Branch
export type Branch = {
  id: string;
  name: string;
  address: string;
  created_at: string;
  updated_at: string;
};

export type Item = {
  id: string;
  name: string;
  price: number;
  stock?: number;
  bottleStates?: BottleStates;
  category?: string;
  brand?: string;
  brand_id: string | null;
  category_id: string | null;
  type: string | null;
  sku: string | null;
  description: string | null;
  is_oil: boolean | null;
  isOil?: boolean;
  imageUrl?: string;
  image_url: string | null;
  volumes?: Volume[];
  batches?: Batch[];
  created_at: string | null;
  updated_at: string | null;
  lowStockAlert?: number;
};

export type Volume = {
  id: string;
  item_id: string;
  size: string;
  price: number;
  created_at: string | null;
  updated_at: string | null;
};

export type Batch = {
  id: string;
  item_id: string;
  purchase_date: string | null;
  expiration_date: string | null;
  supplier_id: string | null;
  cost_price: number | null;
  initial_quantity: number | null;
  current_quantity: number | null;
  created_at: string | null;
  updated_at: string | null;
};

export type BottleStates = {
  open: number;
  closed: number;
};

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
  contact?: string;
  email?: string;
  phone?: string;
};

// Mock data for branches
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
const MOCK_CATEGORIES: Category[] = [
  { id: "1", name: "Oils" },
  { id: "2", name: "Filters" },
  { id: "3", name: "Brakes" },
  { id: "4", name: "Batteries" },
  { id: "5", name: "Lubricants" },
];

// Mock data for brands
const MOCK_BRANDS: Brand[] = [
  { id: "1", name: "Castrol" },
  { id: "2", name: "Mobil" },
  { id: "3", name: "Bosch" },
  { id: "4", name: "K&N" },
  { id: "5", name: "Toyota" },
];

// Mock data for suppliers
const MOCK_SUPPLIERS: Supplier[] = [
  { id: "1", name: "AutoSupply Co.", contact: "John Doe", email: "john@autosupply.com", phone: "+971 50 123 4567" },
  { id: "2", name: "Gulf Parts Ltd.", contact: "Jane Smith", email: "jane@gulfparts.com", phone: "+971 50 765 4321" },
  { id: "3", name: "OEM Direct", contact: "Mohammed Ali", email: "mali@oemdirect.com", phone: "+971 50 987 6543" },
];

// Mock data for inventory items
const MOCK_INVENTORY: Record<string, Item[]> = {
  // Sample data for Branch 1
  "1": [
    {
      id: "1",
      name: "Engine Oil 5W-30",
      price: 29.99,
      stock: 45,
      category: "Oils",
      brand: "Castrol",
      type: "Synthetic",
      sku: "OIL-5W30-CAS",
      description: "Fully synthetic engine oil for modern engines",
      brand_id: "1",
      category_id: "1",
      is_oil: true,
      isOil: true,
      imageUrl: "/placeholders/oil.jpg",
      image_url: "/placeholders/oil.jpg",
      volumes: [
        { id: "v1", item_id: "1", size: "1L", price: 12.99, created_at: null, updated_at: null },
        { id: "v2", item_id: "1", size: "4L", price: 29.99, created_at: null, updated_at: null },
      ],
      bottleStates: { open: 3, closed: 42 },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]
};

// Implement the missing API functions
export const fetchItems = async (branchId: string): Promise<Item[]> => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
  return MOCK_INVENTORY[branchId] || [];
};

export const fetchItem = async (itemId: string): Promise<Item | null> => {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
  
  // Search in all branches
  for (const branchId in MOCK_INVENTORY) {
    const item = MOCK_INVENTORY[branchId].find(item => item.id === itemId);
    if (item) return item;
  }
  
  return null;
};

export const createItem = async (item: Omit<Item, "id">, branchId: string): Promise<Item> => {
  await new Promise(resolve => setTimeout(resolve, 700)); // Simulate API delay
  
  const newId = Math.random().toString(36).substring(2, 15);
  const newItem: Item = {
    ...item,
    id: newId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    brand_id: item.brand_id || null,
    category_id: item.category_id || null,
    is_oil: item.is_oil || false,
    image_url: item.image_url || null,
    type: item.type || null,
    sku: item.sku || null,
  };
  
  if (!MOCK_INVENTORY[branchId]) {
    MOCK_INVENTORY[branchId] = [];
  }
  
  MOCK_INVENTORY[branchId].push(newItem);
  return newItem;
};

export const updateItem = async (id: string, updatedItem: Partial<Item>, branchId: string): Promise<Item | null> => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
  
  if (!MOCK_INVENTORY[branchId]) return null;
  
  const itemIndex = MOCK_INVENTORY[branchId].findIndex(item => item.id === id);
  if (itemIndex === -1) return null;
  
  const item = MOCK_INVENTORY[branchId][itemIndex];
  const updated: Item = {
    ...item,
    ...updatedItem,
    updated_at: new Date().toISOString()
  };
  
  MOCK_INVENTORY[branchId][itemIndex] = updated;
  return updated;
};

export const deleteItem = async (id: string, branchId: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 400)); // Simulate API delay
  
  if (!MOCK_INVENTORY[branchId]) return false;
  
  const initialLength = MOCK_INVENTORY[branchId].length;
  MOCK_INVENTORY[branchId] = MOCK_INVENTORY[branchId].filter(item => item.id !== id);
  
  return MOCK_INVENTORY[branchId].length < initialLength;
};

export const fetchCategories = async (): Promise<Category[]> => {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
  return MOCK_CATEGORIES;
};

export const fetchBrands = async (): Promise<Brand[]> => {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
  return MOCK_BRANDS;
};

export const fetchSuppliers = async (): Promise<Supplier[]> => {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
  return MOCK_SUPPLIERS;
};

export const fetchBranches = async (): Promise<Branch[]> => {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
  return MOCK_BRANCHES;
};

export const addCategory = async (name: string): Promise<Category> => {
  await new Promise(resolve => setTimeout(resolve, 400)); // Simulate API delay
  
  const newId = Math.random().toString(36).substring(2, 15);
  const newCategory: Category = { id: newId, name };
  
  MOCK_CATEGORIES.push(newCategory);
  return newCategory;
};

export const updateCategory = async (id: string, name: string): Promise<Category | null> => {
  await new Promise(resolve => setTimeout(resolve, 400)); // Simulate API delay
  
  const index = MOCK_CATEGORIES.findIndex(cat => cat.id === id);
  if (index === -1) return null;
  
  MOCK_CATEGORIES[index].name = name;
  return MOCK_CATEGORIES[index];
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 400)); // Simulate API delay
  
  const initialLength = MOCK_CATEGORIES.length;
  const index = MOCK_CATEGORIES.findIndex(cat => cat.id === id);
  
  if (index !== -1) {
    MOCK_CATEGORIES.splice(index, 1);
  }
  
  return MOCK_CATEGORIES.length < initialLength;
};

export const addBrand = async (name: string): Promise<Brand> => {
  await new Promise(resolve => setTimeout(resolve, 400)); // Simulate API delay
  
  const newId = Math.random().toString(36).substring(2, 15);
  const newBrand: Brand = { id: newId, name };
  
  MOCK_BRANDS.push(newBrand);
  return newBrand;
};

export const updateBrand = async (id: string, name: string): Promise<Brand | null> => {
  await new Promise(resolve => setTimeout(resolve, 400)); // Simulate API delay
  
  const index = MOCK_BRANDS.findIndex(brand => brand.id === id);
  if (index === -1) return null;
  
  MOCK_BRANDS[index].name = name;
  return MOCK_BRANDS[index];
};

export const deleteBrand = async (id: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 400)); // Simulate API delay
  
  const initialLength = MOCK_BRANDS.length;
  const index = MOCK_BRANDS.findIndex(brand => brand.id === id);
  
  if (index !== -1) {
    MOCK_BRANDS.splice(index, 1);
  }
  
  return MOCK_BRANDS.length < initialLength;
};

export const addBatch = async (itemId: string, batchData: Partial<Batch>): Promise<Batch | null> => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
  
  // Find the item in any branch
  let targetItem: Item | null = null;
  let targetBranch: string | null = null;
  
  for (const branchId in MOCK_INVENTORY) {
    const item = MOCK_INVENTORY[branchId].find(item => item.id === itemId);
    if (item) {
      targetItem = item;
      targetBranch = branchId;
      break;
    }
  }
  
  if (!targetItem || !targetBranch) return null;
  
  const newId = Math.random().toString(36).substring(2, 15);
  const newBatch: Batch = {
    id: newId,
    item_id: itemId,
    purchase_date: batchData.purchase_date || null,
    expiration_date: batchData.expiration_date || null,
    supplier_id: batchData.supplier_id || null,
    cost_price: batchData.cost_price || 0,
    initial_quantity: batchData.initial_quantity || 0,
    current_quantity: batchData.current_quantity || 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  if (!targetItem.batches) {
    targetItem.batches = [];
  }
  
  targetItem.batches.push(newBatch);
  
  // Update stock
  if (targetItem.stock === undefined) {
    targetItem.stock = 0;
  }
  
  targetItem.stock += newBatch.current_quantity || 0;
  
  return newBatch;
};

export const updateBatch = async (itemId: string, batchId: string, batchData: Partial<Batch>): Promise<Batch | null> => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
  
  // Find the item in any branch
  let targetItem: Item | null = null;
  
  for (const branchId in MOCK_INVENTORY) {
    const item = MOCK_INVENTORY[branchId].find(item => item.id === itemId);
    if (item) {
      targetItem = item;
      break;
    }
  }
  
  if (!targetItem || !targetItem.batches) return null;
  
  const batchIndex = targetItem.batches.findIndex(batch => batch.id === batchId);
  if (batchIndex === -1) return null;
  
  const oldQuantity = targetItem.batches[batchIndex].current_quantity || 0;
  const newQuantity = batchData.current_quantity !== undefined ? batchData.current_quantity : oldQuantity;
  
  // Update the batch
  targetItem.batches[batchIndex] = {
    ...targetItem.batches[batchIndex],
    ...batchData,
    updated_at: new Date().toISOString()
  };
  
  // Update stock if quantity changed
  if (targetItem.stock !== undefined && newQuantity !== oldQuantity) {
    targetItem.stock = (targetItem.stock - oldQuantity) + (newQuantity || 0);
  }
  
  return targetItem.batches[batchIndex];
};

export const deleteBatch = async (itemId: string, batchId: string): Promise<boolean> => {
  await new Promise(resolve => setTimeout(resolve, 400)); // Simulate API delay
  
  // Find the item in any branch
  let targetItem: Item | null = null;
  
  for (const branchId in MOCK_INVENTORY) {
    const item = MOCK_INVENTORY[branchId].find(item => item.id === itemId);
    if (item) {
      targetItem = item;
      break;
    }
  }
  
  if (!targetItem || !targetItem.batches) return false;
  
  const batchIndex = targetItem.batches.findIndex(batch => batch.id === batchId);
  if (batchIndex === -1) return false;
  
  // Decrease stock
  if (targetItem.stock !== undefined) {
    targetItem.stock -= targetItem.batches[batchIndex].current_quantity || 0;
  }
  
  // Remove the batch
  targetItem.batches.splice(batchIndex, 1);
  
  return true;
};
