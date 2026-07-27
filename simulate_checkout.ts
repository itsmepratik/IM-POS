import pg from "pg";
import { readFileSync } from "fs";

const env = Object.fromEntries(
  readFileSync("C:\\IM-POS\\.env", "utf-8")
    .split("\n").filter(Boolean).map(l => l.trim().split("="))
    .map(([k, ...v]) => [k, v.join("=")])
);

const client = new pg.Client({ connectionString: env.DIRECT_URL });
await client.connect();

// Simulate what the stored procedure does for an OPEN sale of 1L from 10W-40
const locationId = '504eb38b-81b0-4e3c-82b5-4aa30700ff2b';
const productId = '3c5120d9-54aa-4998-9577-1bb99465e204';

const { rows: inv } = await client.query(
  'SELECT id, standard_stock, closed_bottles_stock, open_bottles_stock FROM inventory WHERE product_id = $1 AND location_id = $2',
  [productId, locationId]
);
console.log("Current inventory:", inv[0]);

// Check: does this product have volumes?
const { rows: vols } = await client.query(
  'SELECT * FROM product_volumes WHERE product_id = $1',
  [productId]
);
console.log("\nProduct volumes:", vols);

// Check: what is bottle_size on products?
const { rows: prod } = await client.query(
  'SELECT bottle_size FROM products WHERE id = $1',
  [productId]
);
console.log("Product bottle_size:", prod[0]?.bottle_size);

// Now simulate the stored procedure logic manually:
const invId = inv[0].id;
const bottleSize = parseFloat(prod[0].bottle_size);
const volumeDesc = "1L open bottle";
const quantity = 1;

// Parse sold volume
const match = volumeDesc.match(/^([0-9]+(?:\.[0-9]+)?)/);
const soldVolumePerUnit = match ? parseFloat(match[1]) : bottleSize;
const totalReqVolume = soldVolumePerUnit * quantity;
let remainingQty = totalReqVolume;

console.log(`\nSimulation: selling ${soldVolumePerUnit}L x ${quantity} from ${bottleSize}L bottle`);
console.log(`  Total required: ${totalReqVolume}L`);
console.log(`  Remaining: ${remainingQty}L`);

// Step 1: Try to deduct from open bottles
const { rows: openBottles } = await client.query(
  'SELECT id, current_volume FROM open_bottle_details WHERE inventory_id = $1 AND current_volume > 0 AND is_empty = FALSE ORDER BY current_volume ASC',
  [invId]
);
console.log(`  Open bottles found: ${openBottles.length}`);

for (const ob of openBottles) {
  if (remainingQty <= 0) break;
  const newVol = Math.max(0, parseFloat(ob.current_volume) - remainingQty);
  const deduction = Math.min(remainingQty, parseFloat(ob.current_volume));
  console.log(`  Deducting ${deduction}L from bottle ${ob.id} (${ob.current_volume}L -> ${newVol}L)`);
  remainingQty -= deduction;
}

// Step 2: If still remaining, open closed bottles
if (remainingQty > 0) {
  const bottlesToOpen = Math.ceil(remainingQty / bottleSize);
  console.log(`  Need to open ${bottlesToOpen} closed bottle(s)`);
  console.log(`  Current closed_bottles_stock: ${inv[0].closed_bottles_stock}`);
  
  if (inv[0].closed_bottles_stock < bottlesToOpen) {
    console.log("  ERROR: Insufficient closed bottles!");
  } else {
    // Deduct from closed bottles
    await client.query(
      'UPDATE inventory SET closed_bottles_stock = closed_bottles_stock - $1 WHERE id = $2',
      [bottlesToOpen, invId]
    );
    console.log(`  Deducted ${bottlesToOpen} from closed_bottles_stock`);
    
    // Create residual open bottle
    const residualVolume = (bottlesToOpen * bottleSize) - remainingQty;
    console.log(`  Residual volume: ${residualVolume}L`);
    
    if (residualVolume > 0) {
      const { rows: inserted } = await client.query(
        `INSERT INTO open_bottle_details (inventory_id, initial_volume, current_volume, is_empty, opened_at)
         VALUES ($1, $2, $3, false, NOW()) RETURNING *`,
        [invId, bottleSize, residualVolume]
      );
      console.log("  INSERTED open_bottle_details:", JSON.stringify(inserted[0]));
    }
    
    // Update standard_stock
    await client.query(
      'UPDATE inventory SET standard_stock = standard_stock - $1 WHERE id = $2',
      [quantity, invId]
    );
    console.log(`  Deducted ${quantity} from standard_stock`);
  }
}

// Check final state
const { rows: finalInv } = await client.query(
  'SELECT standard_stock, closed_bottles_stock, open_bottles_stock FROM inventory WHERE id = $1',
  [invId]
);
console.log("\nFinal inventory:", finalInv[0]);

const { rows: finalOBD } = await client.query(
  'SELECT * FROM open_bottle_details WHERE inventory_id = $1',
  [invId]
);
console.log("Final open_bottle_details:", finalOBD.length, "rows");
finalOBD.forEach(r => console.log(`  id=${r.id}, initial=${r.initial_volume}, current=${r.current_volume}, empty=${r.is_empty}`));

// Undo the changes (restore to original state)
await client.query(
  'UPDATE inventory SET standard_stock = $1, closed_bottles_stock = $2 WHERE id = $3',
  [inv[0].standard_stock, inv[0].closed_bottles_stock, invId]
);
await client.query('DELETE FROM open_bottle_details WHERE inventory_id = $1', [invId]);
console.log("\nRestored original state");

await client.end();
