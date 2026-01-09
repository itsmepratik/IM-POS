
import { db } from "../lib/db/client";
import { sql, eq, desc } from "drizzle-orm";
import { products, inventory, tradeInTransactions } from "../lib/db/schema";

async function investigate() {
  console.log("Investigating Trade-In Data...");

  // 1. Check recent Trade-In Transactions
  const recentTradeIns = await db.select().from(tradeInTransactions)
    .orderBy(desc(tradeInTransactions.createdAt))
    .limit(5);
  
  console.log("Recent Trade-In Transactions:", recentTradeIns.length);
  
  if (recentTradeIns.length === 0) {
      console.log("No trade-in transactions found.");
      return;
  }

  for (const ti of recentTradeIns) {
      console.log(`\n--- Trade-In ID: ${ti.id} ---`);
      console.log(`Product ID: ${ti.productId}`);
      console.log(`Quantity: ${ti.quantity}`);
      
      // 2. Check Product Details
      const [product] = await db.select().from(products).where(eq(products.id, ti.productId));
      console.log("Product:", product ? `${product.name} (ID: ${product.id})` : "NOT FOUND");
      
      if (product) {
          // 3. Check Inventory for this Product (ANY location)
          const invRecords = await db.select().from(inventory).where(eq(inventory.productId, product.id));
          console.log("Inventory Records:", invRecords.length);
          invRecords.forEach(inv => {
              console.log(` - Loc: ${inv.locationId}, Std Stock: ${inv.standardStock}`);
          });
      }
  }
}

investigate().catch(console.error).then(() => process.exit(0));
