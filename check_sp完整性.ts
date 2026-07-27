import pg from "pg";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:\\IM-POS\\.env", "utf-8")
    .split("\n").filter(Boolean).map(l => l.trim().split("="))
    .map(([k, ...v]) => [k, v.join("=")])
);

const client = new pg.Client({ connectionString: env.DIRECT_URL });
await client.connect();

const { rows } = await client.query(
  "SELECT prosrc FROM pg_proc WHERE proname = 'create_checkout_transaction'"
);
const src = rows[0].prosrc;

// Find the INSERT INTO open_bottle_details
const insertIdx = src.indexOf("INSERT INTO open_bottle_details");
if (insertIdx > 0) {
  console.log("Found INSERT INTO open_bottle_details at index", insertIdx);
  console.log("Context (200 chars around it):");
  console.log(src.substring(insertIdx - 50, insertIdx + 250));
} else {
  console.log("INSERT INTO open_bottle_details NOT FOUND in procedure!");
}

// Check if the procedure has the v_invento... truncated string
const truncIdx = src.indexOf("v_invento");
if (truncIdx > 0) {
  console.log("\nFound 'v_invento' at index", truncIdx);
  console.log("Context:", src.substring(truncIdx, truncIdx + 100));
}

// Search for all INSERT statements in the procedure
let searchFrom = 0;
let insertCount = 0;
while (true) {
  const idx = src.indexOf("INSERT", searchFrom);
  if (idx === -1) break;
  insertCount++;
  console.log(`\nINSERT #${insertCount} at index ${idx}:`);
  console.log(src.substring(idx, idx + 150));
  searchFrom = idx + 10;
}

// Also check: does the procedure end properly?
console.log("\n--- Last 200 chars of procedure ---");
console.log(src.substring(src.length - 200));

await client.end();
