import {
  getCachedProducts,
  getCachedBrands,
  getCachedShops,
} from "@/lib/db/queries";
import { POSClient } from "./client-page";
import { cookies } from "next/headers";
import { getDatabase } from "@/lib/db/client";
import { referenceNumberCounters } from "@/lib/db/schema";
import { CategoryProvider } from "./context/CategoryContext";
import { CartProvider } from "./context/CartContext";
import { Suspense } from "react";

// Export removed; we want Next.js to use route caching where possible.
// Cookies and headers will naturally make this route dynamic per-request.

export default async function POSPage() {
  const cookieStore = await cookies();
  const branchId = cookieStore.get("pos_branch_id")?.value;

  // Fetch global static data — each wrapped in try/catch so a transient
  // DB failure on one query doesn't crash the entire server render.
  let brandsData: any[] = [];
  let shopsData: any[] = [];

  try {
    brandsData = await getCachedBrands();
  } catch (e) {
    console.error("Failed to pre-fetch brands:", e);
  }

  try {
    shopsData = await getCachedShops();
  } catch (e) {
    console.error("Failed to pre-fetch shops:", e);
  }

  let productsData: any[] = [];
  let countersData: any[] = [];

  try {
    const db = getDatabase();
    countersData = await db
      .select({
        prefix: referenceNumberCounters.prefix,
        counter: referenceNumberCounters.counter,
      })
      .from(referenceNumberCounters);
  } catch (e) {
    console.error("Failed to pre-fetch reference counters:", e);
  }

  if (branchId && shopsData) {
    const currentShop = shopsData.find((s: any) => s.id === branchId);
    if (currentShop && currentShop.locationId) {
      try {
        productsData = await getCachedProducts(currentShop.locationId);
      } catch (e) {
        console.error("Failed to pre-fetch products:", e);
      }
    }
  }

  return (
    <CategoryProvider initialCategory="Lubricants">
      <CartProvider>
        <Suspense fallback={null}>
          <POSClient
            initialData={{
              brands: brandsData,
              products: productsData,
              shops: shopsData,
              counters: countersData,
            }}
          />
        </Suspense>
      </CartProvider>
    </CategoryProvider>
  );
}
