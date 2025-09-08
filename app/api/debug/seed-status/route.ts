import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import {
  categories,
  inventory,
  locations,
  productVolumes,
  products,
} from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";

export async function GET() {
  try {
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!db) {
      return NextResponse.json({ error: "DB not configured" }, { status: 500 });
    }

    const [{ count: categoriesCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(categories);

    const [{ count: productsCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(products);

    const [{ count: inventoryCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(inventory);

    const [{ count: volumesCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(productVolumes);

    const [{ count: locationsCount }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(locations);

    const mainBranch = await db
      .select({ id: locations.id })
      .from(locations)
      .where(eq(locations.name, "Main Branch"))
      .limit(1);

    return NextResponse.json({
      ok: true,
      counts: {
        categories: Number(categoriesCount),
        products: Number(productsCount),
        inventory: Number(inventoryCount),
        product_volumes: Number(volumesCount),
        locations: Number(locationsCount),
      },
      mainBranchId: mainBranch[0]?.id ?? null,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error" }, { status: 500 });
  }
}
