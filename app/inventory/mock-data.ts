// Mock data for inventory items - temporary replacement for database connections
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
  isBattery?: boolean;
  batteryState?: "new" | "scrap" | "resellable";
  costPrice?: number;
  manufacturingDate?: string | null;
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

// Mock categories
export const MOCK_CATEGORIES: Category[] = [
  { id: "1", name: "Lubricants" },
  { id: "2", name: "Filters" },
  { id: "3", name: "Brakes" },
  { id: "4", name: "Batteries" },
  { id: "5", name: "Additives" },
];

// Mock brands
export const MOCK_BRANDS: Brand[] = [
  { id: "1", name: "Castrol" },
  { id: "2", name: "Mobil" },
  { id: "3", name: "Bosch" },
  { id: "4", name: "K&N" },
  { id: "5", name: "Toyota" },
];

// Mock suppliers
export const MOCK_SUPPLIERS: Supplier[] = [
  {
    id: "1",
    name: "AutoSupply Co.",
    contact: "John Doe",
    email: "john@autosupply.com",
    phone: "+971 50 123 4567",
  },
  {
    id: "2",
    name: "Gulf Parts Ltd.",
    contact: "Jane Smith",
    email: "jane@gulfparts.com",
    phone: "+971 50 765 4321",
  },
  {
    id: "3",
    name: "OEM Direct",
    contact: "Mohammed Ali",
    email: "mali@oemdirect.com",
    phone: "+971 50 987 6543",
  },
];

// Mock inventory items
export const MOCK_ITEMS: Item[] = [
  {
    id: "1",
    name: "Engine Lubricant 5W-30",
    price: 29.99,
    stock: 45,
    category: "Lubricants",
    brand: "Castrol",
    type: "Synthetic",
    description: "Fully synthetic engine oil for modern engines",
    brand_id: "1",
    category_id: "1",
    is_oil: true,
    isOil: true,
    imageUrl: "/placeholders/oil.jpg",
    image_url: "/placeholders/oil.jpg",
    volumes: [
      {
        id: "v1",
        item_id: "1",
        size: "1L",
        price: 12.99,
        created_at: null,
        updated_at: null,
      },
      {
        id: "v2",
        item_id: "1",
        size: "4L",
        price: 29.99,
        created_at: null,
        updated_at: null,
      },
    ],
    bottleStates: { open: 3, closed: 42 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lowStockAlert: 5,
    costPrice: 25.00,
    manufacturingDate: "2024-01-15",
  },
  {
    id: "2",
    name: "Air Filter Premium",
    price: 18.99,
    stock: 25,
    category: "Filters",
    brand: "Bosch",
    type: "Premium",
    description: "High-performance air filter",
    brand_id: "3",
    category_id: "2",
    is_oil: false,
    isOil: false,
    imageUrl: "/placeholders/filter.jpg",
    image_url: "/placeholders/filter.jpg",
    volumes: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lowStockAlert: 10,
    costPrice: 15.00,
  },
  {
    id: "3",
    name: "Engine Lubricant 10W-40",
    price: 24.99,
    stock: 8,
    category: "Lubricants",
    brand: "Mobil",
    type: "Semi-Synthetic",
    description: "Semi-synthetic engine oil for older engines",
    brand_id: "2",
    category_id: "1",
    is_oil: true,
    isOil: true,
    imageUrl: "/placeholders/oil.jpg",
    image_url: "/placeholders/oil.jpg",
    volumes: [
      {
        id: "v3",
        item_id: "3",
        size: "1L",
        price: 9.99,
        created_at: null,
        updated_at: null,
      },
      {
        id: "v4",
        item_id: "3",
        size: "4L",
        price: 24.99,
        created_at: null,
        updated_at: null,
      },
    ],
    bottleStates: { open: 2, closed: 6 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lowStockAlert: 5,
    costPrice: 20.00,
  },
  {
    id: "4",
    name: "Brake Pads Set",
    price: 45.99,
    stock: 12,
    category: "Brakes",
    brand: "Toyota",
    type: "OEM",
    description: "Original equipment brake pads",
    brand_id: "5",
    category_id: "3",
    is_oil: false,
    isOil: false,
    imageUrl: "/placeholders/brakes.jpg",
    image_url: "/placeholders/brakes.jpg",
    volumes: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lowStockAlert: 5,
    costPrice: 35.00,
  },
  {
    id: "5",
    name: "Car Battery 12V",
    price: 89.99,
    stock: 15,
    category: "Batteries",
    brand: "Bosch",
    type: "Lead Acid",
    description: "12V car battery with 2-year warranty",
    brand_id: "3",
    category_id: "4",
    is_oil: false,
    isOil: false,
    isBattery: true,
    batteryState: "new",
    imageUrl: "/placeholders/battery.jpg",
    image_url: "/placeholders/battery.jpg",
    volumes: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lowStockAlert: 3,
    costPrice: 70.00,
  },
  {
    id: "6",
    name: "Engine Additive",
    price: 12.99,
    stock: 30,
    category: "Additives",
    brand: "Castrol",
    type: "Performance",
    description: "Engine performance additive",
    brand_id: "1",
    category_id: "5",
    is_oil: false,
    isOil: false,
    imageUrl: "/placeholders/additive.jpg",
    image_url: "/placeholders/additive.jpg",
    volumes: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lowStockAlert: 10,
    costPrice: 8.00,
  },
  {
    id: "7",
    name: "Oil Filter Standard",
    price: 8.99,
    stock: 3,
    category: "Filters",
    brand: "K&N",
    type: "Standard",
    description: "Standard oil filter for regular maintenance",
    brand_id: "4",
    category_id: "2",
    is_oil: false,
    isOil: false,
    imageUrl: "/placeholders/filter.jpg",
    image_url: "/placeholders/filter.jpg",
    volumes: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lowStockAlert: 5,
    costPrice: 6.00,
  },
  {
    id: "8",
    name: "Transmission Fluid ATF",
    price: 19.99,
    stock: 0,
    category: "Lubricants",
    brand: "Mobil",
    type: "Synthetic",
    description: "Automatic transmission fluid",
    brand_id: "2",
    category_id: "1",
    is_oil: true,
    isOil: true,
    imageUrl: "/placeholders/oil.jpg",
    image_url: "/placeholders/oil.jpg",
    volumes: [
      {
        id: "v5",
        item_id: "8",
        size: "1L",
        price: 19.99,
        created_at: null,
        updated_at: null,
      },
    ],
    bottleStates: { open: 0, closed: 0 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lowStockAlert: 5,
    costPrice: 16.00,
  },
];

// Helper functions for mock data operations
export const getMockItems = (): Item[] => {
  return [...MOCK_ITEMS];
};

export const getMockCategories = (): string[] => {
  return MOCK_CATEGORIES.map(cat => cat.name);
};

export const getMockBrands = (): string[] => {
  return MOCK_BRANDS.map(brand => brand.name);
};

export const getMockSuppliers = (): Supplier[] => {
  return [...MOCK_SUPPLIERS];
};

export const getMockCategoryMap = (): Record<string, string> => {
  return MOCK_CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = cat.name;
    return acc;
  }, {} as Record<string, string>);
};

export const getMockBrandMap = (): Record<string, string> => {
  return MOCK_BRANDS.reduce((acc, brand) => {
    acc[brand.id] = brand.name;
    return acc;
  }, {} as Record<string, string>);
};

// Mock CRUD operations (for maintaining functionality)
export const addMockItem = (item: Omit<Item, "id">): Item => {
  const newItem: Item = {
    ...item,
    id: `mock-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  MOCK_ITEMS.push(newItem);
  return newItem;
};

export const updateMockItem = (id: string, updatedItem: Partial<Item>): Item | null => {
  const index = MOCK_ITEMS.findIndex(item => item.id === id);
  if (index === -1) return null;
  
  MOCK_ITEMS[index] = {
    ...MOCK_ITEMS[index],
    ...updatedItem,
    updated_at: new Date().toISOString(),
  };
  return MOCK_ITEMS[index];
};

export const deleteMockItem = (id: string): boolean => {
  const index = MOCK_ITEMS.findIndex(item => item.id === id);
  if (index === -1) return false;
  
  MOCK_ITEMS.splice(index, 1);
  return true;
};

export const duplicateMockItem = (id: string): Item | null => {
  const item = MOCK_ITEMS.find(item => item.id === id);
  if (!item) return null;
  
  const duplicatedItem: Item = {
    ...item,
    id: `mock-${Date.now()}`,
    name: `${item.name} (Copy)`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  MOCK_ITEMS.push(duplicatedItem);
  return duplicatedItem;
};