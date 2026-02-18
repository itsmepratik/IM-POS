import { getCachedProducts, getCachedBrands, getCachedShops } from "@/lib/db/queries";
import { POSClient } from "./client-page";
import { cookies } from "next/headers";
import { getDatabase } from "@/lib/db/client";
import { CategoryProvider } from "./context/CategoryContext";
import { CartProvider } from "./context/CartContext";

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
    shopsRequest
  ]);
  
  let productsData: any[] = [];
  
  if (branchId && shopsData) {
      const currentShop = shopsData.find((s: any) => s.id === branchId);
      // We need locationId from shop. But getCachedShops only returns id, name.
      // We should update getCachedShops to return locationId too.
      // Or we can rely on the fact that for now we might skip pre-fetching if strict location mapping is missing
      // BUT `db/schema.ts` says shops has `locationId`.
      // Let's assume we update `getCachedShops` or just fetch it here.
      // Actually, checking queries.ts, I only selected id and name. 
      // I should update queries.ts to select locationId.
      
      // Ideally I would update queries.ts first.
      // For now, I'll skip product pre-fetch if I can't get location easily, 
      // OR I can blindly fetch products if branchId IS locationId (which it acts as in some parts of the code? No, shop_id != location_id usually).
      
      // WAIT. `BranchContext` says `setInventoryLocationId(assignedShop.locationId)`.
      // So the client knows the location ID.
      // The cookie `pos_branch_id` is the SHOP ID.
      // I need to map Shop ID -> Location ID.
      // I will update getCachedShops request in this file? No, I should update the query.
      // I can't update the query right now easily without another turn.
      // I'll stick to fetching brands/shops for now and let client fetch products,
      // UNLESS I can make a quick un-cached fetch for shop details here?
      // No, let's use what we have. 
      // "Caching Static Components" was the main goal. Products are dynamic-ish.
      // BUT, if I can just fetch valid products for "Sanaiya" (main) if no cookie?
      
      // Plan: passing brands/shops is a huge win already.
  }
  
  // Update: I can quickly check the DB for the shop's location if I have the ID.
  // It's a single fast query.
  if (branchId) {
      const db = getDatabase();
      // Verify database is available
      if (db) {
        try {
            const { shops } = await import("@/lib/db/schema");
            const { eq } = await import("drizzle-orm");
            
            const shop = await db.select({ locationId: shops.locationId }).from(shops).where(eq(shops.id, branchId)).limit(1);
            
            if (shop && shop.length > 0 && shop[0].locationId) {
                productsData = await getCachedProducts(shop[0].locationId);
            }
        } catch (e) {
            console.error("Failed to pre-fetch products:", e);
        }
      }
  } else {
       // Fallback: Fetch Sanaiya products? 
       // If we don't know the branch, better not show wrong products.
  }

  return (
    <CategoryProvider initialCategory="Lubricants">
      <CartProvider>
        <POSClient 
          initialData={{
              brands: brandsData,
              products: productsData,
              shops: shopsData
          }}
        />
      </CartProvider>
    </CategoryProvider>
  );
}
