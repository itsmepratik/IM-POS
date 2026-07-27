import pg from "pg";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:\\IM-POS\\.env", "utf-8")
    .split("\n").filter(Boolean).map(l => l.trim().split("="))
    .map(([k, ...v]) => [k, v.join("=")])
);

const client = new pg.Client({ connectionString: env.DIRECT_URL });
await client.connect();

// 1. Check open_bottle_details
const { rows: obd } = await client.query("SELECT COUNT(*) as count FROM open_bottle_details");
console.log("open_bottle_details rows:", obd[0].count);

// 2. Check inventory for Shell lubricants
const { rows: inv } = await client.query(`
  SELECT i.product_id, p.name, i.standard_stock, i.closed_bottles_stock, i.open_bottles_stock, i.selling_price
  FROM inventory i
  JOIN products p ON i.product_id = p.id
  WHERE i.location_id = '504eb38b-81b0-4e3c-82b5-4aa30700ff2b'
    AND p.category_id IN (SELECT id FROM categories WHERE name = 'Lubricants')
  ORDER BY p.name
  LIMIT 10
`);
console.log("\nLubricant inventory (first 10):");
inv.forEach(r => console.log(`  ${r.name}: stock=${r.standard_stock}, closed=${r.closed_bottles_stock}, open=${r.open_bottles_stock}, price=${r.selling_price}`));

// 3. Check product bottle_size
const { rows: prods } = await client.query(`
  SELECT p.id, p.name, p.bottle_size
  FROM products p
  JOIN categories c ON p.category_id = c.id
  WHERE c.name = 'Lubricants'
  ORDER BY p.name
  LIMIT 10
`);
console.log("\nLubricant products bottle_size:");
prods.forEach(r => console.log(`  ${r.name}: bottle_size=${r.bottle_size}`));

// 4. Check product_volumes
const { rows: vols } = await client.query(`
  SELECT pv.product_id, p.name, pv.volume_description, pv.selling_price
  FROM product_volumes pv
  JOIN products p ON pv.product_id = p.id
  ORDER BY p.name, pv.volume_description
  LIMIT 15
`);
console.log("\nProduct volumes:");
vols.forEach(r => console.log(`  ${r.name}: ${r.volume_description} @ ${r.selling_price}`));

// 5. Check recent transactions
const { rows: txns } = await client.query(`
  SELECT id, reference_number, total_amount, created_at
  FROM transactions
  ORDER BY created_at DESC
  LIMIT 5
`);
console.log("\nRecent transactions:", txns.length);
txns.forEach(r => console.log(`  ${r.reference_number}: ${r.total_amount} at ${r.created_at}`));

// 6. Check transaction_items for lubricant sales
const { rows: ti } = await client.query(`
  SELECT ti.*, p.name as product_name
  FROM transaction_items ti
  JOIN products p ON ti.product_id = p.id
  ORDER BY ti.created_at DESC
  LIMIT 5
`);
console.log("\nRecent transaction items:", ti.length);
ti.forEach(r => console.log(`  ${r.product_name}: qty=${r.quantity}, source=${r.source || 'N/A'}, vol=${r.volume_description || 'N/A'}`));

await client.end();
