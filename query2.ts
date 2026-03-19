import { db } from "./lib/db/client";
import { products } from "./lib/db/schema";
import { ilike } from "drizzle-orm";
import { writeFileSync } from "fs";

async function main() {
  const res = await db
    .select()
    .from(products)
    .where(ilike(products.name, "%USA%"));
  const names = res.map((p) => `${p.id} | ${p.name}`).join("\n");
  writeFileSync("out2.txt", names);
  process.exit(0);
}
main();
