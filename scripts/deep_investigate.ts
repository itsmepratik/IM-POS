
import { db } from "../lib/db/client";
import { sql, eq, desc } from "drizzle-orm";
import { products, inventory, tradeInTransactions, categories, types } from "../lib/db/schema";

async function deepInvestigate() {
  console.log("Deep Investigation...");

  const recentTradeIns = await db.select().from(tradeInTransactions)
    .orderBy(desc(tradeInTransactions.createdAt))
    .limit(1);

  if (recentTradeIns.length === 0) {
      console.log(JSON.stringify({ error: "No trade-ins found" }));
      return;
  }
  
  const ti = recentTradeIns[0];
  const [product] = await db.select().from(products).where(eq(products.id, ti.productId));
  const invRecords = await db.select().from(inventory).where(eq(inventory.productId, ti.productId));
  
  // Also get category and type names
  let categoryName = "N/A";
  let typeName = "N/A";
  
  if (product) {
      if (product.categoryId) {
          const [c] = await db.select().from(categories).where(eq(categories.id, product.categoryId));
          categoryName = c?.name || "Unknown";
      }
      if (product.typeId) {
          const [t] = await db.select().from(types).where(eq(types.id, product.typeId));
          typeName = t?.name || "Unknown";
      }
  }

  console.log(JSON.stringify({
      tradeInTransaction: ti,
      product: { ...product, categoryName, typeName },
      inventory: invRecords
  }, null, 2));
}

deepInvestigate().catch(console.error).then(() => process.exit(0));
