import "dotenv/config";
import postgres from "postgres";
import fs from "fs";

const sql = postgres(process.env.DATABASE_URL!);
const CSV_PATH = "C:\\Users\\S.Shop1\\Downloads\\shop inventory (2)(Lubricants).csv";

interface ProductRow {
  brand: string; grade: string; apiSpec: string; maxVolume: string;
  buyingPrice: number | null; branchPrice: number | null; sellingPrice: number | null;
  price1L: number | null; price500ml: number | null; price250ml: number | null;
}

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

const volNorm: Record<string, string> = { "4L": "4L", "5L": "5L", "1L": "1L", "500ML": "500ml", "250ML": "250ml" };
const volValues: Record<string, number> = { "5L": 5, "4L": 4, "2L": 2, "1L": 1, "500ml": 0.5, "250ml": 0.25 };

function parseCSV(filePath: string): ProductRow[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  const products: ProductRow[] = [];
  let currentBrand = "";

  for (const line of lines) {
    if (line.startsWith("Engine Oil") || line.startsWith("Sl. No.")) continue;
    const cols = parseCSVLine(line);

    // Brand header row
    if (/^\d+$/.test(cols[0]) && cols[1]) { currentBrand = cols[1]; continue; }
    if (!cols[4]) continue;

    const rawVol = (cols[6] || "").toUpperCase().trim();
    const maxVol = volNorm[rawVol];
    if (!maxVol) continue;

    const parseNum = (v: string): number | null => {
      if (!v || v.trim() === "") return null;
      const n = parseFloat(v.replace(/[^\d.-]/g, ""));
      return isNaN(n) ? null : n;
    };

    products.push({
      brand: currentBrand, grade: cols[4], apiSpec: cols[5] || "", maxVolume: maxVol,
      buyingPrice: parseNum(cols[7]), branchPrice: parseNum(cols[8]), sellingPrice: parseNum(cols[9]),
      price1L: parseNum(cols[10]), price500ml: parseNum(cols[11]), price250ml: parseNum(cols[12]),
    });
  }
  return products;
}

/** Extract meaningful type tags from API spec string */
function extractTypes(apiSpec: string): string[] {
  if (!apiSpec) return [];
  const types: string[] = [];

  // Strip ACEA and ILSAC specs first so they don't pollute API grade extraction
  const cleaned = apiSpec.replace(/ACEA\s+\S+(?:\s*\/\s*\S+)*/gi, "").replace(/ILSAC\s+\S+(?:\s*\/\s*\S+)*/gi, "");

  // Extract API spec phrase (everything after "API:" up to ACEA/ILSAC/paren)
  const apiFull = cleaned.match(/API:\s*([^(]+)/i);
  if (apiFull) {
    const raw = apiFull[1].trim();
    // Split on "/" to get individual grades (e.g. "SN/CH-4" → "SN", "CH-4")
    for (const part of raw.split("/")) {
      // Strip any remaining non-grade text
      let clean = part.trim();
      clean = clean.replace(/\s+(PremiumSX|SynthHC|SynthPro|SynthUltra|MagnaTEC|EDGE|GTX|R\d+|Classic|2000|3000|5000|Multigrade)\s*/gi, "").trim();
      // Keep only valid API grade patterns: 2-4 letters optionally followed by -digit or space+letters
      const gradeMatch = clean.match(/^([A-Z]{2,4}(?:-?\d+)?(?:\s+[A-Z]{2,4})?)\s*/i);
      if (gradeMatch) {
        const grade = gradeMatch[1].trim();
        // Skip ILSAC grades (GF-5, GF-6, etc.) — they're not API certifications
        if (grade && !/^GF-/i.test(grade) && !types.includes(`API: ${grade}`)) {
          types.push(`API: ${grade}`);
        }
      }
    }
  }

  // Extract base oil type from parentheses — fuzzy match to handle typos like "Fully Sythetic"
  const parenMatch = apiSpec.match(/\(([^)]+)\)/g);
  if (parenMatch) {
    for (const pm of parenMatch) {
      const inner = pm.slice(1, -1).trim().toLowerCase();
      if (inner.includes("mineral") && !types.includes("Mineral")) types.push("Mineral");
      if (inner.includes("semi synt") && !types.includes("Semi Synthetic")) types.push("Semi Synthetic");
      if (inner.includes("fully synt") && !types.includes("Fully Synthetic")) types.push("Fully Synthetic");
      if (inner.includes("synthetic") && !types.includes("Synthetic")) types.push("Synthetic");
      if (inner.includes("classic") && !types.includes("Classic")) types.push("Classic");
      if (inner.includes("multigrade") && !types.includes("Multigrade")) types.push("Multigrade");
    }
  }

  // Detect diesel from API grade
  if (types.some((t) => t.toLowerCase().includes("ch-4") || t.toLowerCase().includes("cf"))) {
    if (!types.includes("Diesel")) types.push("Diesel");
  }

  return types.length > 0 ? types : ["Engine Oil"];
}

async function main() {
  console.log("Parsing CSV...");
  const products = parseCSV(CSV_PATH);
  console.log(`Parsed ${products.length} rows`);

  const [saniya] = await sql`SELECT id FROM locations WHERE name = 'Saniya' LIMIT 1`;
  const saniyaLocId = saniya!.id;

  let [lubeCat] = await sql`SELECT id FROM categories WHERE name = 'Lubricants'`;
  if (!lubeCat) [lubeCat] = await sql`INSERT INTO categories (name) VALUES ('Lubricants') RETURNING id`;
  const lubeCatId = lubeCat.id;

  // Wipe old product data
  await sql`DELETE FROM product_types`; await sql`DELETE FROM product_volumes`;
  await sql`DELETE FROM inventory`; await sql`DELETE FROM products`;
  await sql`DELETE FROM types WHERE category_id = ${lubeCatId}`;

  // Upsert brands
  const brandNames = [...new Set(products.map((p) => p.brand))];
  const brandMap: Record<string, string> = {};
  for (const name of brandNames) {
    const [b] = await sql`INSERT INTO brands (name) VALUES (${name}) ON CONFLICT (name) DO UPDATE SET name = ${name} RETURNING id`;
    brandMap[name] = b.id;
  }

  // Collect all unique type tags from the CSV
  const allTypeTags = new Set<string>();
  for (const p of products) {
    for (const t of extractTypes(p.apiSpec)) allTypeTags.add(t);
  }
  // Always include Engine Oil as the base type
  allTypeTags.add("Engine Oil");

  // Create types under Lubricants category
  const typeMap: Record<string, string> = {};
  for (const tag of [...allTypeTags].sort()) {
    const [t] = await sql`
      INSERT INTO types (category_id, name) VALUES (${lubeCatId}, ${tag})
      ON CONFLICT (category_id, name) DO UPDATE SET name = ${tag}
      RETURNING id
    `;
    typeMap[tag] = t.id;
  }
  console.log(`Created ${Object.keys(typeMap).length} types under Lubricants`);

  // Group products by (brand, grade)
  const grouped = new Map<string, {
    brand: string; grade: string; apiSpec: string;
    buyingPrice: number | null;
    volumes: Map<string, { sellingPrice: number; costPrice: number | null }>;
    types: Set<string>;
  }>();

  for (const p of products) {
    const key = `${p.brand}|${p.grade}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        brand: p.brand, grade: p.grade, apiSpec: p.apiSpec,
        buyingPrice: p.buyingPrice,
        volumes: new Map(), types: new Set(),
      });
    }
    const g = grouped.get(key)!;
    if (p.apiSpec && p.apiSpec.length > (g.apiSpec?.length || 0)) g.apiSpec = p.apiSpec;
    if (p.buyingPrice !== null && (g.buyingPrice === null || p.buyingPrice < g.buyingPrice)) g.buyingPrice = p.buyingPrice;

    // Extract types from this row's API spec
    for (const t of extractTypes(p.apiSpec)) g.types.add(t);
    g.types.add("Engine Oil");

    // Add volumes
    if (p.sellingPrice !== null) g.volumes.set(p.maxVolume, { sellingPrice: p.sellingPrice, costPrice: p.buyingPrice });
    const maxVal = volValues[p.maxVolume] || 0;
    if (maxVal >= 4) {
      if (p.price1L !== null) g.volumes.set("1L", { sellingPrice: p.price1L, costPrice: p.buyingPrice ? Math.round(p.price1L * 0.65 * 1000) / 1000 : null });
      if (p.price500ml !== null) g.volumes.set("500ml", { sellingPrice: p.price500ml, costPrice: p.buyingPrice ? Math.round(p.price500ml * 0.65 * 1000) / 1000 : null });
      if (p.price250ml !== null) g.volumes.set("250ml", { sellingPrice: p.price250ml, costPrice: p.buyingPrice ? Math.round(p.price250ml * 0.65 * 1000) / 1000 : null });
    }
    if (maxVal >= 2 && p.price1L !== null && !g.volumes.has("2L")) {
      g.volumes.set("2L", { sellingPrice: Math.round(p.price1L * 2 * 1000) / 1000, costPrice: p.buyingPrice ? Math.round(p.buyingPrice * 0.5 * 1000) / 1000 : null });
    }
  }

  console.log(`Grouped into ${grouped.size} unique products`);

  let prodCount = 0, volCount = 0, invCount = 0, typeLinkCount = 0;

  for (const [, g] of grouped) {
    const brandId = brandMap[g.brand];
    if (!brandId || g.volumes.size === 0) continue;

    const firstVol = g.volumes.values().next().value;
    const sellPrice = firstVol?.sellingPrice || 0;
    const costPrice = g.buyingPrice || Math.round(sellPrice * 0.65 * 1000) / 1000;
    const prodName = g.grade.replace(/\s*\(.*?\)\s*/g, "").trim();

    const [prod] = await sql`
      INSERT INTO products (name, category_id, brand_id, description, cost_price, is_battery)
      VALUES (${prodName}, ${lubeCatId}, ${brandId}, ${`${g.brand} ${g.grade} ${g.apiSpec}`.trim()}, ${costPrice}, false)
      RETURNING id
    `;

    // Link all extracted types
    for (const typeTag of g.types) {
      const typeId = typeMap[typeTag];
      if (typeId) {
        await sql`INSERT INTO product_types (product_id, type_id) VALUES (${prod.id}, ${typeId}) ON CONFLICT DO NOTHING`;
        typeLinkCount++;
      }
    }

    // Create volumes
    for (const [vol, pi] of g.volumes) {
      await sql`INSERT INTO product_volumes (product_id, volume_description, selling_price) VALUES (${prod.id}, ${vol}, ${pi.sellingPrice})`;
      volCount++;
    }

    await sql`INSERT INTO inventory (product_id, location_id, standard_stock, selling_price) VALUES (${prod.id}, ${saniyaLocId}, 0, ${sellPrice})`;
    invCount++;
    prodCount++;
  }

  const finalT = await sql`SELECT COUNT(*) as c FROM types WHERE category_id = ${lubeCatId}`;
  const finalPT = await sql`SELECT COUNT(*) as c FROM product_types`;
  console.log(`\nProducts: ${prodCount}, Volumes: ${volCount}, Inventory: ${invCount}`);
  console.log(`Types under Lubricants: ${finalT[0].c}, Product-Type links: ${finalPT[0].c}`);

  // Show types
  const types = await sql`SELECT name, COUNT(pt.id) as used FROM types t LEFT JOIN product_types pt ON pt.type_id = t.id WHERE t.category_id = ${lubeCatId} GROUP BY t.name ORDER BY used DESC`;
  console.log("\n=== Types ===");
  for (const t of types) console.log(`  ${t.name.padEnd(24)} ${t.used} products`);

  // Sample products
  const samples = await sql`
    SELECT p.name, b.name as brand, string_agg(DISTINCT t.name, ', ' ORDER BY t.name) as types
    FROM products p JOIN brands b ON p.brand_id = b.id JOIN product_types pt ON pt.product_id = p.id JOIN types t ON pt.type_id = t.id
    GROUP BY p.id, p.name, b.name ORDER BY b.name, p.name LIMIT 15
  `;
  console.log("\n=== Sample Products with Types ===");
  for (const s of samples) console.log(`  ${s.brand.padEnd(16)} ${s.name.padEnd(12)} ${s.types}`);

  await sql.end();
}

main().catch(console.error);
