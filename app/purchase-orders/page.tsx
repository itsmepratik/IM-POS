import { db } from "@/lib/db/client";
import { locations, products, brands } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import { PurchaseOrdersClient } from "./client-page";
import { Layout } from "@/components/layout";

export const metadata = {
  title: "Purchase Orders | HNS Automotive",
  description: "Create and manage purchase orders",
};

export default async function PurchaseOrdersPage() {
  const allLocations = await db.query.locations.findMany({
    orderBy: [asc(locations.name)],
  });

  const allProducts = await db
    .select({
      id: products.id,
      name: products.name,
      costPrice: products.costPrice,
      imageUrl: products.imageUrl,
      brandName: brands.name,
    })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .orderBy(asc(products.name));

  return (
    <Layout>
      <div className="flex flex-col h-full w-full max-w-7xl mx-auto space-y-4">
        <PurchaseOrdersClient locations={allLocations} products={allProducts} />
      </div>
    </Layout>
  );
}
