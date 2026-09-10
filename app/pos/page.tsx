import {
  getCachedProducts,
  getCachedBrands,
  getCachedShops,
} from "@/lib/db/queries";
import { POSClient } from "./client-page";
import { cookies } from "next/headers";
import { getDatabase, withTimeout } from "@/lib/db/client";
import { referenceNumberCounters } from "@/lib/db/schema";
import { CategoryProvider } from "./context/CategoryContext";
import { CartProvider } from "./context/CartContext";
import { Suspense } from "react";
import POSLoading from "./loading";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Point of Sale | HNS Automotive",
  description: "Process sales and manage transactions",
};

// Export removed; we want Next.js to use route caching where possible.
// Cookies and headers will naturally make this route dynamic per-request.

export default async function POSPage() {
  const cookieStore = await cookies();
  const branchId = cookieStore.get("pos_branch_id")?.value;

  // Fetch global static data — each wrapped in try/catch + timeout so a transient
  // DB failure or "Connection closed" never crashes the entire server render and never hangs infinitely
  let brandsData: any[] = [];
  let shopsData: any[] = [];

  try {
    brandsData = await withTimeout(getCachedBrands() as Promise<any>, 6000, "prefetch brands");
  } catch (e: any) {
    console.error("Failed to pre-fetch brands:", e?.message || e);
  }

  try {
    shopsData = await withTimeout(getCachedShops() as Promise<any>, 6000, "prefetch shops");
  } catch (e: any) {
    console.error("Failed to pre-fetch shops:", e?.message || e);
  }

  let productsData: any[] = [];
  let countersData: any[] = [];
  let activeShiftData: any = null;

  try {
    const db = getDatabase();
    const countersPromise = db
      .select({
        prefix: referenceNumberCounters.prefix,
        counter: referenceNumberCounters.counter,
      })
      .from(referenceNumberCounters);
    countersData = await withTimeout(countersPromise as Promise<any>, 5000, "prefetch counters");
  } catch (e: any) {
    console.error("Failed to pre-fetch reference counters:", e?.message || e);
  }

  const saniyaShop = shopsData.find(
    (s: any) =>
      s.name?.toLowerCase().includes("saniya1") ||
      s.name?.toLowerCase().includes("sanaiya1")
  );
  const effectiveShopId = branchId || saniyaShop?.id || shopsData[0]?.id;

  if (effectiveShopId) {
    try {
      const { getActiveShift } = await import("@/lib/actions/cash-shifts");
      activeShiftData = await withTimeout(getActiveShift(effectiveShopId) as Promise<any>, 8000, "prefetch activeShift");
    } catch (e: any) {
      console.error("Failed to pre-fetch active cash shift:", e?.message || e);
    }
  }

  if (branchId && shopsData) {
    const currentShop = shopsData.find((s: any) => s.id === branchId);
    if (currentShop && currentShop.locationId) {
      try {
        productsData = await withTimeout(getCachedProducts(currentShop.locationId) as Promise<any>, 8000, "prefetch products");
      } catch (e: any) {
        console.error("Failed to pre-fetch products:", e?.message || e);
      }
    }
  }

  return (
    <CategoryProvider initialCategory="Lubricants">
      <CartProvider>
        <Suspense fallback={<POSLoading />}>
          <POSClient
            initialData={{
              brands: brandsData,
              products: productsData,
              shops: shopsData,
              counters: countersData,
              activeShift: activeShiftData,
            }}
          />
        </Suspense>
      </CartProvider>
    </CategoryProvider>
  );
}

