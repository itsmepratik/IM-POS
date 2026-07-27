import pg from "pg";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:\\IM-POS\\.env", "utf-8")
    .split("\n").filter(Boolean).map(l => l.trim().split("="))
    .map(([k, ...v]) => [k, v.join("=")])
);

const client = new pg.Client({ connectionString: env.DIRECT_URL });
await client.connect();

// Check the two trigger functions
const { rows: func1 } = await client.query(
  "SELECT prosrc FROM pg_proc WHERE proname = 'sync_inventory_from_open_bottles'"
);
console.log("sync_inventory_from_open_bottles:");
console.log(func1[0]?.prosrc);

console.log("\n---\n");

const { rows: func2 } = await client.query(
  "SELECT prosrc FROM pg_proc WHERE proname = 'sync_inventory_open_bottles_stock'"
);
console.log("sync_inventory_open_bottles_stock:");
console.log(func2[0]?.prosrc);

// Now check the actual stored procedure - look for the open_bottle_details INSERT
const { rows: sp } = await client.query(
  "SELECT prosrc FROM pg_proc WHERE proname = 'create_checkout_transaction'"
);
if (sp.length > 0) {
  const src = sp[0].prosrc;
  // Find the section that handles OPEN source
  const openIdx = src.indexOf("OPEN");
  if (openIdx > 0) {
    // Get 2000 chars around the OPEN handling
    const start = Math.max(0, openIdx - 200);
    const end = Math.min(src.length, openIdx + 2000);
    console.log("\n--- Stored procedure OPEN handling section ---");
    console.log(src.substring(start, end));
  }
}

// Also manually test: try to INSERT into open_bottle_details
const { rows: inv } = await client.query(
  "SELECT id FROM inventory WHERE product_id = '3c5120d9-54aa-4998-9577-1bb99465e204' AND location_id = '504eb38b-81b0-4e3c-82b5-4aa30700ff2b'"
);
if (inv.length > 0) {
  const invId = inv[0].id;
  console.log("\n--- Manual INSERT test ---");
  try {
    const { rowCount } = await client.query(
      `INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
       VALUES ($1, 4, 3, false, NOW())`,
      [invId]
    );
    console.log("Manual INSERT succeeded:", rowCount, "rows");
    
    // Check if it's still there
    const { rows: check } = await client.query(
      "SELECT * FROM open_bottle_details WHERE inventory_id = $1",
      [invId]
    );
    console.log("Row after INSERT:", check.length, "rows");
    if (check.length > 0) console.log(JSON.stringify(check[0]));
    
    // Clean up - delete the test row
    await client.query("DELETE FROM open_bottle_details WHERE inventory_id = $1", [invId]);
    console.log("Cleaned up test row");
  } catch (e) {
    console.log("Manual INSERT FAILED:", e.message);
  }
}

await client.end();
