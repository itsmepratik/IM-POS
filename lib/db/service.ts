import { createDrizzleClient } from './drizzle';
import { eq, and, isNull, desc } from 'drizzle-orm';
import { items, locationStock, categories, brands, batches } from './schema';
import type { NewItem, NewLocationStock } from './types';

// Create a singleton instance of the Drizzle client
const db = createDrizzleClient();

// Example: Get all items with their category and brand names
export async function getAllItems() {
  return db.query.items.findMany({
    with: {
      category: true,
      brand: true,
    },
    orderBy: [items.name],
  });
}

// Example: Get item by ID with related data
export async function getItemById(id: string) {
  return db.query.items.findFirst({
    where: eq(items.id, id),
    with: {
      category: true,
      brand: true,
      volumes: true,
      batches: {
        orderBy: [desc(batches.purchaseDate)],
      },
    },
  });
}

// Example: Get inventory for a specific branch
export async function getBranchInventory(branchId: string) {
  return db
    .select({
      id: items.id,
      name: items.name,
      category: categories.name,
      brand: brands.name,
      price: items.price,
      stock: locationStock.quantity,
      openBottles: locationStock.openBottles,
      closedBottles: locationStock.closedBottles,
      isOil: items.isOil,
    })
    .from(locationStock)
    .innerJoin(items, eq(locationStock.itemId, items.id))
    .leftJoin(categories, eq(items.categoryId, categories.id))
    .leftJoin(brands, eq(items.brandId, brands.id))
    .where(
      and(
        eq(locationStock.branchId, branchId),
        isNull(locationStock.batchId)
      )
    );
}

// Example: Add new item
export async function createItem(itemData: NewItem) {
  return db.transaction(async (tx) => {
    // Insert the item
    const [newItem] = await tx
      .insert(items)
      .values(itemData)
      .returning();

    return newItem;
  });
}

// Example: Update item
export async function updateItem(id: string, itemData: Partial<NewItem>) {
  return db.transaction(async (tx) => {
    const [updatedItem] = await tx
      .update(items)
      .set(itemData)
      .where(eq(items.id, id))
      .returning();

    return updatedItem;
  });
}

// Example: Delete item
export async function deleteItem(id: string) {
  return db.transaction(async (tx) => {
    await tx.delete(items).where(eq(items.id, id));
    return { success: true };
  });
}

// Example: Update stock levels
export async function updateStockLevel(itemId: string, branchId: string, quantity: number) {
  return db.transaction(async (tx) => {
    const [record] = await tx
      .select()
      .from(locationStock)
      .where(
        and(
          eq(locationStock.itemId, itemId),
          eq(locationStock.branchId, branchId),
          isNull(locationStock.batchId)
        )
      );

    if (record) {
      // Update existing record
      return tx
        .update(locationStock)
        .set({ quantity })
        .where(eq(locationStock.id, record.id))
        .returning();
    } else {
      // Insert new record
      const newRecord: NewLocationStock = {
        itemId,
        branchId,
        productId: itemId, // This is required by your schema
        quantity,
      };
      
      return tx
        .insert(locationStock)
        .values(newRecord)
        .returning();
    }
  });
} 