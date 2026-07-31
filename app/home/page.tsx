import { RouteProtection } from "@/components/route-protection";
import { BranchProvider } from "@/lib/contexts/BranchContext";
import { HomePageContent } from "./client-page";
import { getDashboardSummary } from "@/lib/db/queries/dashboard";
import { cookies } from "next/headers";
import { Suspense } from "react";
import HomeLoading from "./loading";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | HNS Automotive",
  description: "View sales metrics and business overview",
};

export default async function HomePage() {
  const cookieStore = await cookies();
  const branchId = cookieStore.get("pos_branch_id")?.value;
  
  const dashboardData = await getDashboardSummary(branchId);

  return (
    <RouteProtection adminOnly={true} fallbackPath="/pos">
      <BranchProvider>
        <Suspense fallback={<HomeLoading />}>
          <HomePageContent initialSalesMetrics={dashboardData?.sales} />
        </Suspense>
      </BranchProvider>
    </RouteProtection>
  );
}
