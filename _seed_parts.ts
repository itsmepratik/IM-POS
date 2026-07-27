import "dotenv/config";
import postgres from "postgres";
import fs from "fs";

const sql = postgres(process.env.DATABASE_URL!);
const DOWNLOADS = "C:\\Users\\S.Shop1\\Downloads";

/** Parse CSV with quoted-field support */
function parseCSVLine(line: string): string[] {
  const cols: string[] = [];
  let current = "", inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { cols.push(current.trim()); current = ""; continue; }
    current += ch;
  }
  cols.push(current.trim());
  return cols;
}

async function main() {
  const [saniya] = await sql`SELECT id FROM locations WHERE name = 'Saniya' LIMIT 1`;
  const saniyaLocId = saniya!.id;

  // Get category IDs
  const [filtersCat] = await sql`SELECT id FROM categories WHERE name = 'Filters'`;
  const [partsCat] = await sql`SELECT id FROM categories WHERE name = 'Parts'`;
  const [additivesCat] = await sql`SELECT id FROM categories WHERE name = 'Additives & Fluids'`;

  console.log(`Saniya location: ${saniyaLocId}`);
  console.log(`Categories: Filters=${filtersCat?.id}, Parts=${partsCat?.id}, Additives=${additivesCat?.id}`);

  // ===== ENGINE OIL FILTERS =====
  console.log("\n=== Seeding Engine Oil Filters ===");
  let oilFilterProducts = await seedOilFilters(DOWNLOADS + "\\shop inventory (2)(Engine oil Filters).csv", filtersCat!.id, saniyaLocId);
  console.log(`  Created ${oilFilterProducts} oil filter products`);

  // ===== BATTERIES =====
  console.log("\n=== Seeding Batteries ===");
  let batteryProducts = await seedBatteries(DOWNLOADS + "\\shop inventory (2)(Batteries).csv", partsCat!.id, saniyaLocId);
  console.log(`  Created ${batteryProducts} battery products`);

  // ===== SPARK PLUGS =====
  console.log("\n=== Seeding Spark Plugs ===");
  let sparkPlugProducts = await seedSparkPlugs(DOWNLOADS + "\\shop inventory (2)(Spark Plugs).csv", partsCat!.id, saniyaLocId);
  console.log(`  Created ${sparkPlugProducts} spark plug products`);

  // Summary
  console.log("\n=== Summary ===");
  const counts = await sql`
    SELECT c.name, COUNT(p.id) as cnt FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    GROUP BY c.name ORDER BY c.name
  `;
  for (const r of counts) console.log(`  ${r.name}: ${r.cnt} products`);

  await sql.end();
}

// ===== ENGINE OIL FILTERS =====
async function seedOilFilters(csvPath: string, catId: string, locId: string): Promise<number> {
  const raw = fs.readFileSync(csvPath, "utf-8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return 0;

  // Clear existing products in Filters category
  await sql`DELETE FROM product_types WHERE product_id IN (SELECT id FROM products WHERE category_id = ${catId})`;
  await sql`DELETE FROM product_volumes WHERE product_id IN (SELECT id FROM products WHERE category_id = ${catId})`;
  await sql`DELETE FROM inventory WHERE product_id IN (SELECT id FROM products WHERE category_id = ${catId})`;
  await sql`DELETE FROM products WHERE category_id = ${catId}`;

  // Get Oil Filter type
  const [oilFilterType] = await sql`SELECT id FROM types WHERE category_id = ${catId} AND name = 'Oil Filter'`;
  const typeId = oilFilterType!.id;

  // Parse
  let currentBrand = "";
  let count = 0;
  const created = new Set<string>();

  for (const line of lines) {
    if (line.startsWith("Oil Filters") || line.startsWith("Brand,")) continue;
    const cols = parseCSVLine(line);
    if (!cols[0] && !cols[4]) continue;

    if (cols[0] && !cols[4]) {
      currentBrand = cols[0];
      continue;
    }

    if (cols[0] && cols[4]) {
      currentBrand = cols[0];
    }

    if (!currentBrand || !cols[4]) continue;

    const key = `${currentBrand}|${cols[4]}`;
    if (created.has(key)) continue;
    created.add(key);

    const filterNumber = cols[4];
    const buyingPrice = parseFloat(cols[5]) || 0;
    const sellingPrice = parseFloat(cols[7]) || parseFloat(cols[6]) || 0;

    // Upsert brand
    const [brand] = await sql`
      INSERT INTO brands (name) VALUES (${currentBrand})
      ON CONFLICT (name) DO UPDATE SET name = ${currentBrand}
      RETURNING id
    `;
    if (!brand) continue;

    const prodName = `${currentBrand} ${filterNumber}`;

    const [prod] = await sql`
      INSERT INTO products (name, category_id, brand_id, description, cost_price)
      VALUES (${filterNumber}, ${catId}, ${brand.id}, ${prodName}, ${buyingPrice || null})
      RETURNING id
    `;

    // Link to Oil Filter type
    await sql`INSERT INTO product_types (product_id, type_id) VALUES (${prod.id}, ${typeId}) ON CONFLICT DO NOTHING`;

    // Create default "1 Unit" volume
    await sql`
      INSERT INTO product_volumes (product_id, volume_description, selling_price)
      VALUES (${prod.id}, '1 Unit', ${sellingPrice || 0})
    `;

    // Create inventory
    await sql`
      INSERT INTO inventory (product_id, location_id, standard_stock, selling_price)
      VALUES (${prod.id}, ${locId}, 0, ${sellingPrice || 0})
    `;

    count++;
  }

  return count;
}

// ===== BATTERIES =====
async function seedBatteries(csvPath: string, catId: string, locId: string): Promise<number> {
  const raw = fs.readFileSync(csvPath, "utf-8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return 0;

  // Clear existing Batteries products
  const [batType] = await sql`SELECT id FROM types WHERE category_id = ${catId} AND name = 'Batteries'`;
  const batTypeId = batType!.id;

  // Delete only products linked to Batteries type (to avoid nuking other Parts)
  const existingBats = await sql`SELECT product_id FROM product_types WHERE type_id = ${batTypeId}`;
  if (existingBats.length > 0) {
    const ids = existingBats.map((r: any) => r.product_id);
    await sql`DELETE FROM product_types WHERE product_id = ANY(${ids})`;
    await sql`DELETE FROM product_volumes WHERE product_id = ANY(${ids})`;
    await sql`DELETE FROM inventory WHERE product_id = ANY(${ids})`;
    await sql`DELETE FROM products WHERE id = ANY(${ids})`;
  }

  // Parse
  let currentBrand = "";
  let currentOrigin = "";
  let currentMadeIn = "";
  let count = 0;
  const created = new Set<string>(); // track unique (brand, name) to avoid duplicates

  for (const line of lines) {
    if (line.startsWith("Batteries") || line.startsWith("Brand,")) continue;
    const cols = parseCSVLine(line);
    if (!cols[0] && !cols[3]) continue;

    if (cols[0]) {
      currentBrand = cols[0];
      currentOrigin = cols[1] || "";
      currentMadeIn = cols[2] || "";
      // Check if this is a brand row without data (e.g., "ACDelco,,,,,,,")
      if (!cols[3]) continue;
    }

    if (!currentBrand || !cols[3]) continue;
    if (cols[1]) currentOrigin = cols[1];
    if (cols[2]) currentMadeIn = cols[2];

    const name = cols[3];
    const key = `${currentBrand}|${name}`;
    if (created.has(key)) continue; // skip duplicate
    created.add(key);

    // col4 (Type) sometimes has buying price instead of type - check if numeric
    const typeOrPrice = cols[4] || "";
    const priceVal = parseFloat(typeOrPrice);
    const hasPriceInTypeCol = !isNaN(priceVal) && typeOrPrice !== "";

    const buyingPrice = hasPriceInTypeCol ? priceVal : (parseFloat(cols[5]) || 0);
    const sellingPrice = parseFloat(cols[7]) || parseFloat(cols[6]) || 0;

    // Upsert brand
    const [brand] = await sql`
      INSERT INTO brands (name) VALUES (${currentBrand})
      ON CONFLICT (name) DO UPDATE SET name = ${currentBrand}
      RETURNING id
    `;
    if (!brand) continue;

    const desc = `${currentBrand} ${name} ${currentOrigin}/${currentMadeIn}`.trim();
    const prodName = name;

    const [prod] = await sql`
      INSERT INTO products (name, category_id, brand_id, description, cost_price, is_battery)
      VALUES (${prodName}, ${catId}, ${brand.id}, ${desc}, ${buyingPrice || null}, true)
      RETURNING id
    `;

    await sql`INSERT INTO product_types (product_id, type_id) VALUES (${prod.id}, ${batTypeId}) ON CONFLICT DO NOTHING`;

    await sql`
      INSERT INTO product_volumes (product_id, volume_description, selling_price)
      VALUES (${prod.id}, '1 Unit', ${sellingPrice || 0})
    `;

    await sql`
      INSERT INTO inventory (product_id, location_id, standard_stock, selling_price)
      VALUES (${prod.id}, ${locId}, 0, ${sellingPrice || 0})
    `;

    count++;
  }

  return count;
}

// ===== SPARK PLUGS =====
async function seedSparkPlugs(csvPath: string, catId: string, locId: string): Promise<number> {
  const raw = fs.readFileSync(csvPath, "utf-8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return 0;

  // Clear existing Spark Plug products
  const [spType] = await sql`SELECT id FROM types WHERE category_id = ${catId} AND name = 'Spark Plugs'`;
  const spTypeId = spType!.id;

  const existing = await sql`SELECT product_id FROM product_types WHERE type_id = ${spTypeId}`;
  if (existing.length > 0) {
    const ids = existing.map((r: any) => r.product_id);
    await sql`DELETE FROM product_types WHERE product_id = ANY(${ids})`;
    await sql`DELETE FROM product_volumes WHERE product_id = ANY(${ids})`;
    await sql`DELETE FROM inventory WHERE product_id = ANY(${ids})`;
    await sql`DELETE FROM products WHERE id = ANY(${ids})`;
  }

  // Parse
  let currentBrand = "";
  let count = 0;
  const created = new Set<string>();

  for (const line of lines) {
    if (line.startsWith("Spark Plugs") || line.startsWith("Brand,")) continue;
    const cols = parseCSVLine(line);
    if (!cols[0] && !cols[4]) continue;

    if (cols[0]) {
      currentBrand = cols[0];
      if (!cols[4]) continue;
    }

    if (!currentBrand || !cols[4]) continue;

    const key = `${currentBrand}|${cols[4]}`;
    if (created.has(key)) continue;
    created.add(key);

    // Track sub-category (Normal/Iridium) — it may be in col3
    if (cols[3] && (cols[3] === "Normal" || cols[3] === "Iridium")) {
      currentSubCategory = cols[3];
    }

    const partNumber = cols[4];
    const identNumber = cols[5] || "";
    const buyingPrice = parseFloat(cols[6]) || 0;
    const branchPrice = parseFloat(cols[7]) || 0;
    const sellingPrice = parseFloat(cols[8]) || parseFloat(cols[7]) || 0;

    // Upsert brand
    const [brand] = await sql`
      INSERT INTO brands (name) VALUES (${currentBrand})
      ON CONFLICT (name) DO UPDATE SET name = ${currentBrand}
      RETURNING id
    `;
    if (!brand) continue;

    const prodName = `${partNumber} (${identNumber})`.trim().replace(/\s*\(\s*\)\s*$/, "");
    const desc = `${currentBrand} ${partNumber}`.trim();

    const [prod] = await sql`
      INSERT INTO products (name, category_id, brand_id, description, cost_price)
      VALUES (${partNumber}, ${catId}, ${brand.id}, ${desc}, ${buyingPrice || null})
      RETURNING id
    `;

    // Link to Spark Plugs type
    await sql`INSERT INTO product_types (product_id, type_id) VALUES (${prod.id}, ${spTypeId}) ON CONFLICT DO NOTHING`;

    await sql`
      INSERT INTO product_volumes (product_id, volume_description, selling_price)
      VALUES (${prod.id}, '1 Unit', ${sellingPrice || 0})
    `;

    await sql`
      INSERT INTO inventory (product_id, location_id, standard_stock, selling_price)
      VALUES (${prod.id}, ${locId}, 0, ${sellingPrice || 0})
    `;

    count++;
  }

  return count;
}

main().catch((e) => { console.error(e); process.exit(1); });
