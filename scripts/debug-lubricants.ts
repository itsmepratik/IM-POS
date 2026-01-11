
import { queryClient } from "../lib/db/client";

async function main() {
  console.log("Fetching lubricant products...");
  
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

    const parseVolume = (volStr: string): number => {
        const clean = volStr.toLowerCase().replace(/\s/g, "");
        if (clean.includes("ml")) {
          return parseFloat(clean) / 1000;
        }
        return parseFloat(clean);
    };

    console.log("\n--- Analysis ---");

    Object.values(products).forEach((p) => {
        let maxVol = 0;
        let priceForMaxVol = 0;
        let maxVolDesc = "";

        p.volumes.forEach((v) => {
            const vol = parseVolume(v.desc);
            if (vol > maxVol) {
                maxVol = vol;
                priceForMaxVol = v.price;
                maxVolDesc = v.desc;
            }
        });

        const pricePerLiter = maxVol > 0 ? (priceForMaxVol / maxVol) : 0;
        
        // Flag suspicious items
        // If price per liter is very low (e.g. < 0.5 OMR)
        if (pricePerLiter < 0.5 || maxVol > 20) {
            console.log(`\nProduct: ${p.name}`);
            console.log(`  Reference Volume: ${maxVolDesc} (Parsed: ${maxVol}L)`);
            console.log(`  Price for Ref: ${priceForMaxVol}`);
            console.log(`  Calc Price/Liter: ${pricePerLiter.toFixed(3)} OMR`);
            
            // Show all volumes to understand why
            console.log("  All Volumes:");
            p.volumes.forEach(v => {
                console.log(`    - ${v.desc}: ${v.price}`);
            });
        }
    });

  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
}

main();
