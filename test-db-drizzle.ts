import { db } from "./lib/db/client";
import { transactions } from "./lib/db/schema";
import { gte, lte, eq } from "drizzle-orm";

async function check() {
  const result = await db.query.transactions.findMany({
    where: (tx, { eq }) => eq(tx.type, "SALE"),
    limit: 5,
    columns: { id: true, createdAt: true, type: true },
  });
  console.log("Recent SALE txs:", result);
  process.exit(0);
}

check().catch(console.error);
