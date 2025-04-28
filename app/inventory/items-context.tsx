"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";
import {
  Item,
  Batch,
  Volume,
  BottleStates,
  fetchItems,
  fetchItem,
  createItem,
  updateItem as updateItemService,
  deleteItem as deleteItemService,
  addBatch as addBatchService,
  updateBatch as updateBatchService,
  deleteBatch as deleteBatchService,
  fetchCategories,
  fetchBrands,
  fetchBranches,
  fetchSuppliers,
  addCategory as addCategoryService,
  updateCategory,
  deleteCategory,
  addBrand as addBrandService,
  updateBrand,
  deleteBrand,
  Brand,
  Category,
  Supplier,
} from "@/lib/services/inventoryService";
import { useBranch } from "../branch-context";

interface ItemsContextType {
  items: Item[];
  categories: string[];
  brands: string[];
  suppliers: Supplier[];
  addItem: (item: Omit<Item, "id">) => Promise<Item | null>;
  updateItem: (
    id: string,
    updatedItem: Omit<Item, "id">
  ) => Promise<Item | null>;
  deleteItem: (id: string) => Promise<boolean>;
  duplicateItem: (id: string) => Promise<Item | null>;
  addCategory: (category: string) => Promise<string | null>;
  updateCategory: (
    oldCategory: string,
    newCategory: string
  ) => Promise<boolean>;
  deleteCategory: (category: string) => Promise<boolean>;
  addBrand: (brand: string) => Promise<string | null>;
  updateBrand: (oldBrand: string, newBrand: string) => Promise<boolean>;
  deleteBrand: (brand: string) => Promise<boolean>;
  addBatch: (
    itemId: string,
    batchData: Pick<
      Batch,
      | "purchase_date"
      | "cost_price"
      | "initial_quantity"
      | "current_quantity"
      | "supplier_id"
      | "expiration_date"
    >
  ) => Promise<boolean>;
  updateBatch: (
    itemId: string,
    batchId: string,
    batchData: Partial<Omit<Batch, "id" | "item_id">>
  ) => Promise<boolean>;
  deleteBatch: (itemId: string, batchId: string) => Promise<boolean>;
  calculateAverageCost: (itemId: string) => number;
  isLoading: boolean;
  refetchItems: () => Promise<void>;
}

const ItemsContext = createContext<ItemsContextType>({
  items: [],
  categories: [],
  brands: [],
  suppliers: [],
  addItem: async () => null,
  updateItem: async () => null,
  deleteItem: async () => false,
  duplicateItem: async () => null,
  addCategory: async () => null,
  updateCategory: async () => false,
  deleteCategory: async () => false,
  addBrand: async () => null,
  updateBrand: async () => false,
  deleteBrand: async () => false,
  addBatch: async () => false,
  updateBatch: async () => false,
  deleteBatch: async () => false,
  calculateAverageCost: () => 0,
  isLoading: true,
  refetchItems: async () => {},
});

export const useItems = () => {
  const context = useContext(ItemsContext);
  if (!context) {
    throw new Error("useItems must be used within an ItemsProvider");
  }
  return context;
};

export { type Item, type Batch, type Volume, type BottleStates };

export const ItemsProvider = ({ children }: { children: React.ReactNode }) => {
  const { currentBranch } = useBranch();
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [categoryMap, setCategoryMap] = useState<Map<string, string>>(
    new Map()
  ); // id -> name
  const [brandMap, setBrandMap] = useState<Map<string, string>>(new Map()); // id -> name

  // Fetch items when the current branch changes
  useEffect(() => {
    if (currentBranch) {
      loadItems();
    }
  }, [currentBranch]);

  // Fetch categories, brands, and suppliers on initial load
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [categoriesData, brandsData, suppliersData, branchesData] =
          await Promise.all([
            fetchCategories(),
            fetchBrands(),
            fetchSuppliers(),
            fetchBranches(),
          ]);

        // Setting category data
        setCategories(categoriesData.map((cat) => cat.name));
        const catMap = new Map<string, string>();
        categoriesData.forEach((cat: Category) => catMap.set(cat.id, cat.name));
        setCategoryMap(catMap);

        // Setting brand data
        setBrands(brandsData.map((brand) => brand.name));
        const brandMap = new Map<string, string>();
        brandsData.forEach((brand: Brand) =>
          brandMap.set(brand.id, brand.name)
        );
        setBrandMap(brandMap);

        // Setting supplier data
        setSuppliers(suppliersData);
      } catch (error) {
        console.error("Error loading metadata:", error);
      }
    };

    loadMetadata();
  }, []);

  const loadItems = async () => {
    if (!currentBranch) return;

    try {
      setIsLoading(true);
      const itemsData = await fetchItems(currentBranch.id);
      setItems(itemsData);
    } catch (error) {
      console.error("Error loading items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refetchItems = async () => {
    await loadItems();
  };

  const addItem = async (item: Omit<Item, "id">): Promise<Item | null> => {
    if (!currentBranch) {
      console.error("Cannot add item: No current branch selected");
      return null;
    }

    console.log("Adding item with current branch:", currentBranch);
    console.log("Item data:", item);

    try {
      const newItem = await createItem(item, currentBranch.id);

      if (newItem) {
        console.log("Item added successfully:", newItem.id);
        setItems((prev) => [...prev, newItem]);
        return newItem;
      } else {
        console.error("Failed to add item: createItem returned null");
        return null;
      }
    } catch (error) {
      console.error("Error adding item:", error);
      return null;
    }
  };

  const updateItem = async (
    id: string,
    updatedItem: Omit<Item, "id">
  ): Promise<Item | null> => {
    if (!currentBranch) {
      console.error("Cannot update item: No current branch selected");
      return null;
    }

    console.log("Updating item:", id);
    console.log("Updated data:", updatedItem);
    console.log("Current branch:", currentBranch);

    try {
      const updated = await updateItemService(
        id,
        updatedItem,
        currentBranch.id
      );

      if (updated) {
        console.log("Item updated successfully:", updated);
        // Force a complete refresh of items to ensure UI updates
        await loadItems();
        return updated;
      } else {
        console.error("Failed to update item: updateItemService returned null");
        return null;
      }
    } catch (error) {
      console.error("Error updating item:", error);
      return null;
    }
  };

  const deleteItem = async (id: string): Promise<boolean> => {
    try {
      const success = await deleteItemService(id);
      if (success) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting item:", error);
      return false;
    }
  };

  const duplicateItem = async (id: string): Promise<Item | null> => {
    if (!currentBranch) return null;

    try {
      // Find the original item
      const original = items.find((item) => item.id === id);
      if (!original) return null;

      // Create a copy with a new name
      const copy = { ...original, name: `${original.name} (Copy)` };

      // Remove ID to force creation of a new item
      const copyWithoutId = Object.fromEntries(
        Object.entries(copy).filter(([key]) => key !== "id")
      ) as Omit<Item, "id">;

      // Add the copy as a new item
      return await addItem(copyWithoutId);
    } catch (error) {
      console.error("Error duplicating item:", error);
      return null;
    }
  };

  const addCategory = async (category: string): Promise<string | null> => {
    try {
      const newCategory = await addCategoryService(category);
      if (newCategory) {
        setCategories((prev) => [...prev, newCategory.name]);
        categoryMap.set(newCategory.id, newCategory.name);
        setCategoryMap(new Map(categoryMap));
        return newCategory.id;
      }
      return null;
    } catch (error) {
      console.error("Error adding category:", error);
      return null;
    }
  };

  const updateCategory = async (
    oldCategory: string,
    newCategory: string
  ): Promise<boolean> => {
    try {
      // Find category ID by name
      let categoryId: string | undefined;
      for (const [id, name] of categoryMap.entries()) {
        if (name === oldCategory) {
          categoryId = id;
          break;
        }
      }

      if (!categoryId) return false;

      const success = await updateCategory(categoryId, newCategory);
      if (success) {
        setCategories((prev) =>
          prev.map((cat) => (cat === oldCategory ? newCategory : cat))
        );
        categoryMap.set(categoryId, newCategory);
        setCategoryMap(new Map(categoryMap));

        // Update all items with this category
        setItems((prev) =>
          prev.map((item) =>
            item.category === oldCategory
              ? { ...item, category: newCategory }
              : item
          )
        );

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating category:", error);
      return false;
    }
  };

  const deleteCategory = async (category: string): Promise<boolean> => {
    try {
      // Find category ID by name
      let categoryId: string | undefined;
      for (const [id, name] of categoryMap.entries()) {
        if (name === category) {
          categoryId = id;
          break;
        }
      }

      if (!categoryId) return false;

      const success = await deleteCategory(categoryId);
      if (success) {
        setCategories((prev) => prev.filter((cat) => cat !== category));
        categoryMap.delete(categoryId);
        setCategoryMap(new Map(categoryMap));

        // Update all items with this category
        setItems((prev) =>
          prev.map((item) =>
            item.category === category
              ? { ...item, category: "", category_id: null }
              : item
          )
        );

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting category:", error);
      return false;
    }
  };

  const addBrand = async (brand: string): Promise<string | null> => {
    try {
      const newBrand = await addBrandService(brand);
      if (newBrand) {
        setBrands((prev) => [...prev, newBrand.name]);
        brandMap.set(newBrand.id, newBrand.name);
        setBrandMap(new Map(brandMap));
        return newBrand.id;
      }
      return null;
    } catch (error) {
      console.error("Error adding brand:", error);
      return null;
    }
  };

  const updateBrand = async (
    oldBrand: string,
    newBrand: string
  ): Promise<boolean> => {
    try {
      // Find brand ID by name
      let brandId: string | undefined;
      for (const [id, name] of brandMap.entries()) {
        if (name === oldBrand) {
          brandId = id;
          break;
        }
      }

      if (!brandId) return false;

      const success = await updateBrand(brandId, newBrand);
      if (success) {
        setBrands((prev) =>
          prev.map((brand) => (brand === oldBrand ? newBrand : brand))
        );
        brandMap.set(brandId, newBrand);
        setBrandMap(new Map(brandMap));

        // Update all items with this brand
        setItems((prev) =>
          prev.map((item) =>
            item.brand === oldBrand ? { ...item, brand: newBrand } : item
          )
        );

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating brand:", error);
      return false;
    }
  };

  const deleteBrand = async (brand: string): Promise<boolean> => {
    try {
      // Find brand ID by name
      let brandId: string | undefined;
      for (const [id, name] of brandMap.entries()) {
        if (name === brand) {
          brandId = id;
          break;
        }
      }

      if (!brandId) return false;

      const success = await deleteBrand(brandId);
      if (success) {
        setBrands((prev) => prev.filter((b) => b !== brand));
        brandMap.delete(brandId);
        setBrandMap(new Map(brandMap));

        // Update all items with this brand
        setItems((prev) =>
          prev.map((item) =>
            item.brand === brand
              ? { ...item, brand: undefined, brand_id: null }
              : item
          )
        );

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting brand:", error);
      return false;
    }
  };

  const addBatchImpl = async (
    itemId: string,
    batchData: Pick<
      Batch,
      | "purchase_date"
      | "cost_price"
      | "initial_quantity"
      | "current_quantity"
      | "supplier_id"
      | "expiration_date"
    >
  ): Promise<boolean> => {
    if (!currentBranch) return false;

    try {
      console.log("Adding batch with data:", batchData);
      const success = await addBatchService(
        itemId,
        {
          purchase_date: batchData.purchase_date,
          cost_price: batchData.cost_price,
          initial_quantity: batchData.initial_quantity,
          current_quantity: batchData.current_quantity,
          supplier_id: batchData.supplier_id,
          expiration_date: batchData.expiration_date,
        },
        currentBranch.id
      );

      if (success) {
        // Reload the items to get the updated batch information
        await loadItems();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error adding batch:", error);
      return false;
    }
  };

  const updateBatchImpl = async (
    itemId: string,
    batchId: string,
    batchData: Partial<Omit<Batch, "id" | "item_id">>
  ): Promise<boolean> => {
    if (!currentBranch) return false;

    try {
      console.log("Updating batch with data:", batchData);
      const success = await updateBatchService(
        itemId,
        batchId,
        batchData,
        currentBranch.id
      );
      if (success) {
        // Reload the items to get the updated batch information
        await loadItems();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating batch:", error);
      return false;
    }
  };

  const deleteBatchImpl = async (
    itemId: string,
    batchId: string
  ): Promise<boolean> => {
    if (!currentBranch) return false;

    try {
      const success = await deleteBatchService(
        itemId,
        batchId,
        currentBranch.id
      );
      if (success) {
        // Reload the items to get the updated batch information
        await loadItems();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting batch:", error);
      return false;
    }
  };

  const calculateAverageCost = (itemId: string): number => {
    const item = items.find((item) => item.id === itemId);
    if (!item || !item.batches || item.batches.length === 0) return 0;

    let totalCost = 0;
    let totalQuantity = 0;

    for (const batch of item.batches) {
      totalCost += batch.cost_price * batch.current_quantity;
      totalQuantity += batch.current_quantity;
    }

    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  };

  return (
    <ItemsContext.Provider
      value={{
        items,
        categories,
        brands,
        suppliers,
        addItem,
        updateItem,
        deleteItem,
        duplicateItem,
        addCategory,
        updateCategory,
        deleteCategory,
        addBrand,
        updateBrand,
        deleteBrand,
        addBatch: addBatchImpl,
        updateBatch: updateBatchImpl,
        deleteBatch: deleteBatchImpl,
        calculateAverageCost,
        isLoading,
        refetchItems,
      }}
    >
      {children}
    </ItemsContext.Provider>
  );
};
