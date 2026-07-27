import pg from "pg";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:\\IM-POS\\.env", "utf-8")
    .split("\n").filter(Boolean).map(l => l.trim().split("="))
    .map(([k, ...v]) => [k, v.join("=")])
);

const client = new pg.Client({ connectionString: env.DIRECT_URL });
await client.connect();

// Transactions table columns
const { rows: cols } = await client.query(
  "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'transactions' ORDER BY ordinal_position"
);
console.log("transactions columns:");
cols.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));

// Latest transactions
const { rows: txn } = await client.query(
  "SELECT * FROM transactions ORDER BY created_at DESC LIMIT 2"
);
console.log("\nLatest transactions (all columns):");
txn.forEach(t => console.log(JSON.stringify(t, null, 2)));

// Check if there are transaction_items in another schema or as a view
const { rows: views } = await client.query(
  "SELECT table_name FROM information_schema.views WHERE table_schema = 'public'"
);
console.log("\nViews:", views.map(v => v.table_name));

// Check stored procedure source
const { rows: funcSrc } = await client.query(
  "SELECT prosrc FROM pg_proc WHERE proname = 'create_checkout_transaction'"
);
if (funcSrc.length > 0) {
  const src = funcSrc[0].prosrc;
  console.log("\nStored procedure key checks:");
  console.log("  Has OPEN source:", src.includes("'OPEN'"));
  console.log("  Has open_bottle_details:", src.includes("open_bottle_details"));
  console.log("  Has bottle_size:", src.includes("v_bottle_size"));
  console.log("  Has volumeDescription:", src.includes("v_volume_desc"));
  console.log("  Has residual:", src.includes("v_residual"));
  console.log("  Procedure length:", src.length);
}

await client.end();
