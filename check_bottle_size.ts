import pg from "pg";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:\\IM-POS\\.env", "utf-8")
    .split("\n").filter(Boolean).map(l => l.trim().split("="))
    .map(([k, ...v]) => [k, v.join("=")])
);

const client = new pg.Client({ connectionString: env.DIRECT_URL });
await client.connect();

// Check ALL lubricant products with bottle_size = 0 or NULL (would skip OPEN handling)
const { rows: noBottleSize } = await client.query(`
  SELECT p.id, p.name, p.bottle_size, c.name as category
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  WHERE (c.name IN ('Lubricants', 'Additives') OR c.name ILIKE '%oil%')
    AND (p.bottle_size IS NULL OR p.bottle_size = 0)
  ORDER BY p.name
  LIMIT 10
`);
console.log("Lubricant products with NULL/0 bottle_size:", noBottleSize.length);
noBottleSize.forEach(r => console.log(`  ${r.name}: bottle_size=${r.bottle_size}`));

// Check the stored procedure condition more carefully
const { rows } = await client.query(
  "SELECT prosrc FROM pg_proc WHERE proname = 'create_checkout_transaction'"
);
const src = rows[0].prosrc;

// Find the exact condition
const condIdx = src.indexOf("v_is_lubricant AND v_item_source = 'OPEN'");
if (condIdx > 0) {
  console.log("\nStored procedure condition context:");
  console.log(src.substring(condIdx - 100, condIdx + 200));
}

// Check: what happens when bottle_size is 0? COALESCE(p.bottle_size, 0) = 0
// Then v_bottle_size = 0, and condition v_bottle_size > 0 is FALSE
// This means OPEN handling is SKIPPED for lubricants without bottle_size!

// Let's also check the _apply_procedures.sql to see if it has a different version
// that doesn't check v_bottle_size > 0
const applyProcedures = readFileSync("C:\\IM-POS\\supabase\\migrations\\_apply_procedures.sql", "utf-8");
// Find the LAST create_checkout_transaction definition
const lastIdx = applyProcedures.lastIndexOf("CREATE OR REPLACE FUNCTION create_checkout_transaction");
if (lastIdx > 0) {
  const section = applyProcedures.substring(lastIdx, lastIdx + 5000);
  const hasOpenHandling = section.includes("v_item_source = 'OPEN'");
  const hasBottleSizeCheck = section.includes("v_bottle_size > 0");
  console.log("\n_apply_procedures.sql LAST version:");
  console.log("  Has OPEN handling:", hasOpenHandling);
  console.log("  Has bottle_size > 0 check:", hasBottleSizeCheck);
}

await client.end();
