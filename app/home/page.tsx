import { RouteProtection } from "@/components/route-protection";
import { BranchProvider } from "@/lib/contexts/BranchContext";
import { HomePageContent } from "./client-page";
import { getDashboardSummary } from "@/lib/db/queries/dashboard";
import { cookies } from "next/headers";

export default async function HomePage() {
  const cookieStore = await cookies();
  const branchId = cookieStore.get("pos_branch_id")?.value;
  
  // Fetch initial dashboard data server-side
  // This uses unstable_cache under the hood for performance
  const dashboardData = await getDashboardSummary(branchId);

  return (
    <RouteProtection adminOnly={true} fallbackPath="/pos">
      <BranchProvider>
        <HomePageContent initialSalesMetrics={dashboardData?.sales} />
      </BranchProvider>
    </RouteProtection>
  );
}
