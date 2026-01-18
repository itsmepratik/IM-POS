"use server";

import { createClient } from "@/supabase/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { transactions, products, brands } from "@/lib/db/schema";
import { and, eq, gte, lte, inArray, desc } from "drizzle-orm";

export interface TopProductData {
  name: string;
  units: number;
  revenue: number;
}

export async function getTopSellingProducts(
  startDate: Date,
  endDate: Date,
  shopId?: string
): Promise<TopProductData[]> {
  try {
    // We need to aggregate sales from the JSONB `items_sold` column.
    // This is complex to do typescript-safe in Drizzle without raw SQL.
    // So we will use Drizzle's `sql` tag for the query.
    
    // Construct the filter for shop
    const shopFilter = shopId ? sql`AND ${transactions.shopId} = ${shopId}` : sql``;

    // Filter for valid transaction types (sales and paid credits/holds)
    // Exclude refunds, voided, etc if any.
    // Types: SALE, ON_HOLD_PAID, CREDIT_PAID
    
    const query = sql`
      WITH expanded_items AS (
        SELECT
          t.id,
          t.created_at,
          -- Fallback to product name from products table if missing in JSON
          -- If product exists, try to prepend Brand name
          CASE 
            WHEN p.name IS NOT NULL THEN 
              TRIM(CONCAT(COALESCE(b.name, ''), ' ', p.name))
            ELSE COALESCE(item->>'name', 'Unknown Product')
          END as product_name,
          COALESCE((item->>'quantity')::int, 0) as quantity,
          -- Use sellingPrice as it matches the Zod schema
          COALESCE((item->>'sellingPrice')::numeric, (item->>'price')::numeric, 0) as unit_price
        FROM ${transactions} t
        CROSS JOIN LATERAL jsonb_array_elements(t.items_sold) as item
        LEFT JOIN ${products} p ON p.id = (item->>'productId')::uuid
        LEFT JOIN ${brands} b ON b.id = p.brand_id
        WHERE 
          t.created_at >= ${startDate.toISOString()}
          AND t.created_at <= ${endDate.toISOString()}
          ${shopFilter}
          AND t.type IN ('SALE', 'ON_HOLD_PAID', 'CREDIT_PAID')
      )
      SELECT
        product_name as name,
        SUM(quantity) as units,
        SUM(quantity * unit_price) as revenue
      FROM expanded_items
      WHERE product_name IS NOT NULL
      GROUP BY product_name
      ORDER BY units DESC
      LIMIT 5;
    `;

    const result = await db.execute(query);
    
    // Map result to our interface
    // result.rows is the array of rows
    return result.map((row: any) => ({
      name: row.name,
      units: Number(row.units),
      revenue: Number(row.revenue)
    }));

  } catch (error) {
    console.error("Error fetching top selling products:", error);
    return [];
  }
}
