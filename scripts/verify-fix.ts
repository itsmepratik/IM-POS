
import { queryClient } from "../lib/db/client";

async function main() {
  console.log("Verifying lubricant pricing fix...");
  
  try {
    const rows = await queryClient`
      SELECT 
        p.id, 
        p.name, 
        pv.volume_description, 
        pv.selling_price
      FROM products p
      JOIN product_volumes pv ON p.id = pv.product_id
      WHERE p.category_id = 'c9a58df4-eb3d-424a-a9d6-7c26f3f57c1b'
    `;

    console.log(`Found ${rows.length} volume entries.`);

    const products: Record<string, { name: string, volumes: any[] }> = {};

    rows.forEach((row: any) => {
      if (!products[row.id]) {
        products[row.id] = { name: row.name, volumes: [] };
      }
      products[row.id].volumes.push({
        desc: row.volume_description,
        price: row.selling_price
      });
    });

    // UPDATED PARSE FUNCTION (Simulating the fix)
    const parseVolume = (volStr: string): number => {
        const clean = volStr.toLowerCase().trim(); // FIX: Only trim
        if (clean.includes("ml")) {
          return parseFloat(clean) / 1000;
        }
        return parseFloat(clean);
    };

    console.log("\n--- Verification Analysis ---");
    let problemCount = 0;

    Object.values(products).forEach((p) => {
        let maxVol = 0;
        let priceForMaxVol = 0;
        let maxVolDesc = "";

        // UPDATED SELECTION LOGIC (Simulating the fix)
        p.volumes.forEach((v) => {
            const vol = parseVolume(v.desc);
            // FIX: Cap at 20L
            if (vol > 0 && vol <= 20 && vol > maxVol) {
                maxVol = vol;
                priceForMaxVol = v.price;
                maxVolDesc = v.desc;
            }
        });

        const pricePerLiter = maxVol > 0 ? (priceForMaxVol / maxVol) : 0;
        
        // Check for remaining low prices
        if (pricePerLiter > 0 && pricePerLiter < 0.5) {
            console.log(`\n[WARNING] Low Price Detected: ${p.name}`);
            console.log(`  Reference Volume: ${maxVolDesc} (Parsed: ${maxVol}L)`);
            console.log(`  Price/Liter: ${pricePerLiter.toFixed(3)} OMR`);
            problemCount++;
        }
    });

    if (problemCount === 0) {
        console.log("\n✅ SUCCESS: No ridiculously low prices (< 0.5 OMR/L) detected with new logic.");
    } else {
        console.log(`\n❌ WARNING: ${problemCount} items still show low prices.`);
    }

  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

main();
