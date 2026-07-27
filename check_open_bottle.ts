import pg from "pg";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:\\IM-POS\\.env", "utf-8")
    .split("\n").filter(Boolean).map(l => l.trim().split("="))
    .map(([k, ...v]) => [k, v.join("=")])
);

const client = new pg.Client({ connectionString: env.DIRECT_URL });
await client.connect();

// Check inventory for the product that was sold OPEN (10W-40)
const { rows: inv } = await client.query(`
  SELECT i.*, p.name, p.bottle_size
  FROM inventory i
  JOIN products p ON i.product_id = p.id
  WHERE i.product_id = '3c5120d9-54aa-4998-9577-1bb99465e204'
    AND i.location_id = '504eb38b-81b0-4e3c-82b5-4aa30700ff2b'
`);
console.log("10W-40 (sold OPEN) inventory:", JSON.stringify(inv[0], null, 2));

// Check open_bottle_details for this inventory
const { rows: obd } = await client.query(`
  SELECT * FROM open_bottle_details
  WHERE inventory_id = $1
`, [inv[0]?.id]);
console.log("\nopen_bottle_details for 10W-40:", obd.length, "rows");
obd.forEach(r => console.log(JSON.stringify(r)));

// Check batches for this inventory
const { rows: batches } = await client.query(`
  SELECT * FROM batches WHERE inventory_id = $1 ORDER BY batch_number
`, [inv[0]?.id]);
console.log("\nbatches for 10W-40:", batches.length);
batches.forEach(b => console.log(`  batch ${b.batch_number}: stock_remaining=${b.stock_remaining}, qty_received=${b.quantity_received}`));

// Now check what the stored procedure actually does with the OPEN source
// Check if there's a trigger that overwrites open_bottles_stock
const { rows: triggers } = await client.query(`
  SELECT trigger_name, event_manipulation, action_statement
  FROM information_schema.triggers
  WHERE event_object_table = 'inventory'
`);
console.log("\nTriggers on inventory table:");
triggers.forEach(t => console.log(`  ${t.trigger_name}: ${t.event_manipulation} -> ${t.action_statement.substring(0, 100)}`));

// Check the sync trigger on open_bottle_details
const { rows: obdTriggers } = await client.query(`
  SELECT trigger_name, event_manipulation, action_statement
  FROM information_schema.triggers
  WHERE event_object_table = 'open_bottle_details'
`);
console.log("\nTriggers on open_bottle_details:");
obdTriggers.forEach(t => console.log(`  ${t.trigger_name}: ${t.event_manipulation} -> ${t.action_statement.substring(0, 100)}`));

// Check the sync trigger on batches
const { rows: batchTriggers } = await client.query(`
  SELECT trigger_name, event_manipulation, action_statement
  FROM information_schema.triggers
  WHERE event_object_table = 'batches'
`);
console.log("\nTriggers on batches:");
batchTriggers.forEach(t => console.log(`  ${t.trigger_name}: ${t.event_manipulation} -> ${t.action_statement.substring(0, 100)}`));

await client.end();
