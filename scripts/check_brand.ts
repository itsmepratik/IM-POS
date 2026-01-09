
import { db } from "../lib/db/client";
import { sql, eq, desc } from "drizzle-orm";
import { products, tradeInTransactions } from "../lib/db/schema";

async function checkBrand() {
  const recentTradeIns = await db.select().from(tradeInTransactions)
    .orderBy(desc(tradeInTransactions.createdAt))
    .limit(1);

  if (recentTradeIns.length === 0) return;
  
  const ti = recentTradeIns[0];
  const [product] = await db.select().from(products).where(eq(products.id, ti.productId));
  
  console.log(`Product ID: ${product.id}`);
  console.log(`Product Name: ${product.name}`);
  console.log(`Brand ID: ${product.brandId}`); // Should be null
}

checkBrand().catch(console.error).then(() => process.exit(0));
