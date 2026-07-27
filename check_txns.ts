import pg from "pg";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:\\IM-POS\\.env", "utf-8")
    .split("\n").filter(Boolean).map(l => l.trim().split("="))
    .map(([k, ...v]) => [k, v.join("=")])
);

const client = new pg.Client({ connectionString: env.DIRECT_URL });
await client.connect();

// Find transaction-related tables
const { rows: tables } = await client.query(
  "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%transaction%' ORDER BY tablename"
);
console.log("Transaction tables:", tables.map(t => t.tablename));

// Check latest transactions with items column
const { rows: txn } = await client.query(
  "SELECT id, reference_number, total_amount, type, items, payment_method, created_at FROM transactions ORDER BY created_at DESC LIMIT 3"
);
console.log("\nLatest transactions:");
txn.forEach(t => {
  const items = typeof t.items === 'string' ? JSON.parse(t.items) : t.items;
  console.log(`  ${t.reference_number}: total=${t.total_amount}, type=${t.type}, method=${t.payment_method}`);
  if (Array.isArray(items)) {
    items.forEach((item: any) => {
      console.log(`    Item: productId=${item.productId}, qty=${item.quantity}, source=${item.source || 'N/A'}, vol=${item.volumeDescription || 'N/A'}, price=${item.sellingPrice || 'N/A'}`);
    });
  }
});

// Check what the stored procedure looks like in DB
const { rows: funcs } = await client.query(
  "SELECT p.proname, pg_get_function_arguments(p.oid) as args FROM pg_proc p WHERE p.proname LIKE '%checkout%'"
);
console.log("\nCheckout functions:", funcs.map(f => f.proname));

// Check if the stored procedure is the latest version
const { rows: funcSrc } = await client.query(
  "SELECT prosrc FROM pg_proc WHERE proname = 'create_checkout_transaction'"
);
if (funcSrc.length > 0) {
  const src = funcSrc[0].prosrc;
  // Check for key patterns
  console.log("\nStored procedure checks:");
  console.log("  Has 'OPEN' source handling:", src.includes("OPEN"));
  console.log("  Has open_bottle_details:", src.includes("open_bottle_details"));
  console.log("  Has v_bottle_size:", src.includes("v_bottle_size"));
  console.log("  Has bottle_size from products:", src.includes("bottle_size"));
  console.log("  Has volumeDescription parsing:", src.includes("v_volume_desc"));
  console.log("  Has residual volume:", src.includes("v_residual_open_volume"));
  console.log("  Length:", src.length, "chars");
}

await client.end();
