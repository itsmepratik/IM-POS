import {
  getCachedProducts,
  getCachedBrands,
  getCachedShops,
} from "@/lib/db/queries";
import { POSClient } from "./client-page";
import { cookies } from "next/headers";
import { getDatabase } from "@/lib/db/client";
import { CategoryProvider } from "./context/CategoryContext";
import { CartProvider } from "./context/CartContext";
import { Suspense } from "react";
import { POSLoadingBar } from "./components/POSLoadingBar";

// Ensure dynamic rendering to read cookies and auth headers
export const dynamic = "force-dynamic";

export default async function POSPage() {
  const cookieStore = await cookies();
  const branchId = cookieStore.get("pos_branch_id")?.value;

  // Fetch global static data
  const brandsRequest = getCachedBrands();
  const shopsRequest = getCachedShops();

  // Fetch products if branch is known
  // We need to resolve branchId to locationId.
  // The cookie stores 'branchId' (which is actually shop ID in this system context).
  // We need to find the locationId for this shop.
  // Since we are fetching shops anyway, we can find it there.

  const [brandsData, shopsData] = await Promise.all([
    brandsRequest,
    shopsRequest,
  ]);

  let productsData: any[] = [];

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
        <Suspense fallback={<POSLoadingBar />}>
          <POSClient
            initialData={{
              brands: brandsData,
              products: productsData,
              shops: shopsData,
            }}
          />
        </Suspense>
      </CartProvider>
    </CategoryProvider>
  );
}
