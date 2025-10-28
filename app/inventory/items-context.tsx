"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect, useMemo } from "react";
// Using actual Supabase service functions
import {
  Item,
  Batch,
  Volume,
  BottleStates,
  Brand,
  Category,
  Supplier,
  fetchItems,
  fetchItem,
  createItem,
  updateItem as updateItemService,
  deleteItem as deleteItemService,
  fetchCategories,
  fetchBrands,
  fetchSuppliers,
  fetchBranches,
  addCategoryService,
  updateCategoryService,
  deleteCategoryService,
  addBrandService,
  updateBrandService,
  deleteBrandService,
  addSupplierService,
  updateSupplierService,
  deleteSupplierService,
  addBatch as addBatchService,
  updateBatch as updateBatchService,
  deleteBatch as deleteBatchService,
} from "../../lib/services/inventoryService";
import { useBranch } from "../branch-context";
import { toast } from "@/components/ui/use-toast";

interface ItemsContextType {
  items: Item[];
  categories: string[];
  brands: string[];
  brandObjects: Brand[];
  suppliers: Supplier[];
  categoryMap: Record<string, string>;
  brandMap: Record<string, string>;
  showTradeIns: boolean;
  setShowTradeIns: (show: boolean) => void;
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
  addBrand: (brand: Omit<Brand, "id">) => Promise<string | null>;
  updateBrand: (
    id: string,
    updates: Partial<Omit<Brand, "id">>
  ) => Promise<boolean>;
  deleteBrand: (id: string) => Promise<boolean>;
  addSupplier: (supplier: Omit<Supplier, "id">) => Promise<string | null>;
  updateSupplier: (
    id: string,
    supplier: Partial<Omit<Supplier, "id">>
  ) => Promise<boolean>;
  deleteSupplier: (id: string) => Promise<boolean>;
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
  brandObjects: [],
  suppliers: [],
  categoryMap: {},
  brandMap: {},
  showTradeIns: false,
  setShowTradeIns: () => {},
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
  addSupplier: async () => null,
  updateSupplier: async () => false,
  deleteSupplier: async () => false,
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
  // Using actual Supabase data
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [brandObjects, setBrandObjects] = useState<Brand[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showTradeIns, setShowTradeIns] = useState(false);
  const [categoryMap, setCategoryMap] = useState<Map<string, string>>(
    new Map()
  ); // id -> name
  const [brandMap, setBrandMap] = useState<Map<string, string>>(new Map()); // id -> name

  const { currentBranch } = useBranch();

  // Helper function to convert Map to Record
  const mapToRecord = (map: Map<string, string>): Record<string, string> => {
    const record: Record<string, string> = {};
    map.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  };

  // Load data from Supabase on mount and when branch changes
  useEffect(() => {
    if (currentBranch?.id) {
      loadData();
    }
  }, [currentBranch?.id]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      if (!currentBranch?.id) {
        console.warn("No current branch selected");
        return;
      }

      // Load items for current branch
      const itemsData = await fetchItems(currentBranch.id);
      setItems(itemsData);

      // Load categories
      const categoriesData = await fetchCategories();
      const categoryNames = categoriesData.map((cat) => cat.name);
      setCategories(categoryNames);
      const categoryMapInstance = new Map<string, string>();
      categoriesData.forEach((cat) =>
        categoryMapInstance.set(cat.id, cat.name)
      );
      setCategoryMap(categoryMapInstance);

      // Load brands
      const brandsData = await fetchBrands();
      console.log("📦 ItemsContext - Loaded brands from DB:", brandsData);
      const brandNames = brandsData.map((brand) => brand.name);
      setBrands(brandNames);
      setBrandObjects(brandsData);
      console.log("✅ ItemsContext - Set brandObjects:", brandsData);
      const brandMapInstance = new Map<string, string>();
      brandsData.forEach((brand) => brandMapInstance.set(brand.id, brand.name));
      setBrandMap(brandMapInstance);

      // Load suppliers
      const suppliersData = await fetchSuppliers();
      setSuppliers(suppliersData);

      console.log(
        `Loaded ${itemsData.length} items for branch ${currentBranch.name}`
      );
    } catch (error) {
      console.error("Error loading data:", error);
      toast({
        title: "Error loading items",
        description: "Failed to load inventory items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refetchItems = async () => {
    await loadData();
  };

  const addItem = async (item: Omit<Item, "id">): Promise<Item | null> => {
    try {
      if (!currentBranch?.id) {
        toast({
          title: "Error",
          description: "No branch selected.",
          variant: "destructive",
        });
        return null;
      }

      const newItem = await createItem({
        ...item,
        location_id: currentBranch.id,
      });
      if (newItem) {
        setItems((prev) => [...prev, newItem]);
        toast({
          title: "Item added",
          description: `${newItem.name} has been added successfully.`,
        });
        return newItem;
      }
      return null;
    } catch (error) {
      console.error("Error adding item:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast({
        title: "Error adding item",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateItem = async (
    id: string,
    updatedItem: Omit<Item, "id">
  ): Promise<Item | null> => {
    try {
      const updated = await updateItemService(id, updatedItem);
      if (updated) {
        setItems((prevItems) =>
          prevItems.map((item) => (item.id === id ? { ...updated } : item))
        );
        toast({
          title: "Item updated",
          description: `${updated.name} has been updated successfully.`,
        });
        return updated;
      } else {
        toast({
          title: "Update failed",
          description: "The item could not be updated. Please try again.",
          variant: "destructive",
        });
        return null;
      }
    } catch (error) {
      console.error("Error updating item:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast({
        title: "Error updating item",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteItem = async (id: string): Promise<boolean> => {
    try {
      const itemToDelete = items.find((item) => item.id === id);
      if (!itemToDelete) {
        toast({
          title: "Error",
          description: "Item not found.",
          variant: "destructive",
        });
        return false;
      }

      const success = await deleteItemService(id);
      if (success) {
        setItems((prevItems) => prevItems.filter((item) => item.id !== id));
        toast({
          title: "Item deleted",
          description: `${itemToDelete.name} has been removed.`,
        });
        return true;
      } else {
        toast({
          title: "Deletion failed",
          description: "The item could not be deleted. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast({
        title: "Error deleting item",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  const duplicateItem = async (id: string): Promise<Item | null> => {
    try {
      if (!currentBranch?.id) {
        toast({
          title: "Error",
          description: "No branch selected.",
          variant: "destructive",
        });
        return null;
      }

      const originalItem = await fetchItem(id);
      if (!originalItem) {
        toast({
          title: "Error",
          description: "Original item not found.",
          variant: "destructive",
        });
        return null;
      }

      // Create a duplicate with modified name
      const duplicateData = {
        ...originalItem,
        name: `${originalItem.name} (Copy)`,
        location_id: currentBranch.id,
      };
      delete (duplicateData as any).id; // Remove id to create new item

      const duplicatedItem = await createItem(duplicateData);
      if (duplicatedItem) {
        setItems((prev) => [...prev, duplicatedItem]);
        toast({
          title: "Item duplicated",
          description: `${duplicatedItem.name} has been duplicated.`,
        });
        return duplicatedItem;
      } else {
        toast({
          title: "Duplication failed",
          description: "The item could not be duplicated. Please try again.",
          variant: "destructive",
        });
        return null;
      }
    } catch (error) {
      console.error("Error duplicating item:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast({
        title: "Error duplicating item",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  };

  const addCategory = async (category: string): Promise<string | null> => {
    try {
      const newCategory = await addCategoryService({ name: category });
      if (newCategory) {
        setCategories((prev) => [...prev, category]);
        categoryMap.set(newCategory.id, category);
        setCategoryMap(new Map(categoryMap));
        toast({
          title: "Category added",
          description: `${category} has been added successfully.`,
        });
        return newCategory.id;
      }
      return null;
    } catch (error) {
      console.error("Error adding category:", error);
      toast({
        title: "Error adding category",
        description: "Failed to add the category. Please try again.",
        variant: "destructive",
      });
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

      const updated = await updateCategoryService(categoryId, {
        name: newCategory,
      });
      if (updated) {
        setCategories((prev) =>
          prev.map((cat) => (cat === oldCategory ? newCategory : cat))
        );
        categoryMap.set(categoryId, newCategory);
        setCategoryMap(new Map(categoryMap));

        // Refresh items to get updated category names
        await refetchItems();

        toast({
          title: "Category updated",
          description: `Category has been updated to ${newCategory}.`,
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Error updating category",
        description: "Failed to update the category. Please try again.",
        variant: "destructive",
      });
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

      const success = await deleteCategoryService(categoryId);
      if (success) {
        setCategories((prev) => prev.filter((cat) => cat !== category));
        categoryMap.delete(categoryId);
        setCategoryMap(new Map(categoryMap));

        // Refresh items to get updated category references
        await refetchItems();

        toast({
          title: "Category deleted",
          description: "The category has been removed.",
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Error deleting category",
        description: "Failed to delete the category. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const addBrand = async (brand: Omit<Brand, "id">): Promise<string | null> => {
    try {
      const newBrand = await addBrandService(brand);
      if (newBrand) {
        setBrands((prev) => [...prev, brand.name]);
        setBrandObjects((prev) => [...prev, newBrand]);
        brandMap.set(newBrand.id, brand.name);
        setBrandMap(new Map(brandMap));
        toast({
          title: "Brand added",
          description: `${brand.name} has been added successfully.`,
        });
        return newBrand.id;
      }
      return null;
    } catch (error) {
      console.error("Error adding brand:", error);
      toast({
        title: "Error adding brand",
        description: "Failed to add the brand. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateBrand = async (
    id: string,
    updates: Partial<Omit<Brand, "id">>
  ): Promise<boolean> => {
    try {
      const updated = await updateBrandService(id, updates);
      if (updated) {
        // Update brand name in the brands array if name was changed
        if (updates.name) {
          const oldName = brandMap.get(id);
          setBrands((prev) =>
            prev.map((brand) => (brand === oldName ? updates.name! : brand))
          );
          brandMap.set(id, updates.name);
          setBrandMap(new Map(brandMap));
        }

        // Update brandObjects array
        setBrandObjects((prev) =>
          prev.map((brand) =>
            brand.id === id ? { ...brand, ...updates } : brand
          )
        );

        // Refresh items to get updated brand names
        await refetchItems();

        toast({
          title: "Brand updated",
          description: `Brand has been updated successfully.`,
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating brand:", error);
      toast({
        title: "Error updating brand",
        description: "Failed to update the brand. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteBrand = async (id: string): Promise<boolean> => {
    try {
      const brandName = brandMap.get(id);

      await deleteBrandService(id);

      if (brandName) {
        setBrands((prev) => prev.filter((b) => b !== brandName));
      }
      setBrandObjects((prev) => prev.filter((b) => b.id !== id));
      brandMap.delete(id);
      setBrandMap(new Map(brandMap));

      // Refresh items to get updated brand references
      await refetchItems();

      toast({
        title: "Brand deleted",
        description: "The brand has been removed.",
      });

      return true;
    } catch (error) {
      console.error("Error deleting brand:", error);
      toast({
        title: "Error deleting brand",
        description: "Failed to delete the brand. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const addSupplier = async (
    supplier: Omit<Supplier, "id">
  ): Promise<string | null> => {
    try {
      const newSupplier = await addSupplierService(supplier);
      if (newSupplier) {
        setSuppliers((prev) => [...prev, newSupplier]);
        toast({
          title: "Supplier added",
          description: `${supplier.name} has been added successfully.`,
        });
        return newSupplier.id;
      }
      return null;
    } catch (error) {
      console.error("Error adding supplier:", error);
      toast({
        title: "Error adding supplier",
        description: "Failed to add the supplier. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateSupplier = async (
    id: string,
    supplierData: Partial<Omit<Supplier, "id">>
  ): Promise<boolean> => {
    try {
      const updated = await updateSupplierService(id, supplierData);
      if (updated) {
        setSuppliers((prev) =>
          prev.map((supplier) =>
            supplier.id === id ? { ...supplier, ...supplierData } : supplier
          )
        );

        // Refresh items to get updated supplier references
        await refetchItems();

        toast({
          title: "Supplier updated",
          description: "Supplier has been updated successfully.",
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating supplier:", error);
      toast({
        title: "Error updating supplier",
        description: "Failed to update the supplier. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteSupplier = async (id: string): Promise<boolean> => {
    try {
      const success = await deleteSupplierService(id);
      if (success) {
        setSuppliers((prev) => prev.filter((supplier) => supplier.id !== id));

        // Refresh items to get updated supplier references
        await refetchItems();

        toast({
          title: "Supplier deleted",
          description: "The supplier has been removed.",
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast({
        title: "Error deleting supplier",
        description: "Failed to delete the supplier. Please try again.",
        variant: "destructive",
      });
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
    try {
      const newBatch = await addBatchService({
        ...batchData,
        item_id: itemId,
      });

      if (newBatch) {
        // Refresh items to get updated batch data
        await refetchItems();

        toast({
          title: "Batch added",
          description: "Batch has been added successfully.",
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error adding batch:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      toast({
        title: "Error adding batch",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  const updateBatchImpl = async (
    itemId: string,
    batchId: string,
    batchData: Partial<Omit<Batch, "id" | "item_id">>
  ): Promise<boolean> => {
    try {
      const updated = await updateBatchService(batchId, batchData);
      if (updated) {
        // Refresh items to get updated batch data
        await refetchItems();

        toast({
          title: "Batch updated",
          description: "Batch has been updated successfully.",
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating batch:", error);
      toast({
        title: "Error updating batch",
        description: "Failed to update the batch. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteBatchImpl = async (
    itemId: string,
    batchId: string
  ): Promise<boolean> => {
    try {
      const success = await deleteBatchService(batchId);
      if (success) {
        // Refresh items to get updated batch data
        await refetchItems();

        toast({
          title: "Batch deleted",
          description: "Batch has been removed successfully.",
        });

        return true;
      }
      return false;
    } catch (error) {
      console.error("Error deleting batch:", error);
      toast({
        title: "Error deleting batch",
        description: "Failed to delete the batch. Please try again.",
        variant: "destructive",
      });
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

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      items,
      categories,
      brands,
      brandObjects,
      suppliers,
      categoryMap: mapToRecord(categoryMap),
      brandMap: mapToRecord(brandMap),
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
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addBatch: addBatchImpl,
      updateBatch: updateBatchImpl,
      deleteBatch: deleteBatchImpl,
      calculateAverageCost,
      isLoading,
      refetchItems,
      showTradeIns,
      setShowTradeIns,
    }),
    [
      items,
      categories,
      brands,
      brandObjects,
      suppliers,
      categoryMap,
      brandMap,
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
      addSupplier,
      updateSupplier,
      deleteSupplier,
      addBatchImpl,
      updateBatchImpl,
      deleteBatchImpl,
      calculateAverageCost,
      isLoading,
      refetchItems,
      showTradeIns,
      setShowTradeIns,
    ]
  );

  return (
    <ItemsContext.Provider value={contextValue}>
      {children}
    </ItemsContext.Provider>
  );
};
