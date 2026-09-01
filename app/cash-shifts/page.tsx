import { Layout } from "@/components/layout";
import { Metadata } from "next";
import { getCachedShops } from "@/lib/db/queries";
import { getCashShiftsHistory, getActiveShift } from "@/lib/actions/cash-shifts";
import { CashShiftsClient } from "./shifts-client";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "Cash Shifts & Reconciliation | HNS Automotive",
  description: "Track staff cash register shifts, drawer counts, and administrator reconciliation.",
};

export default async function CashShiftsPage() {
  const cookieStore = await cookies();
  const branchId = cookieStore.get("pos_branch_id")?.value;

  let shopsData: any[] = [];
  try {
    shopsData = await getCachedShops();
  } catch (e) {
    console.error("Failed to fetch shops for cash shifts page:", e);
  }

  const effectiveShopId = branchId || shopsData[0]?.id;

  let activeShift = null;
  let shiftsHistory: any[] = [];

  if (effectiveShopId) {
    try {
      activeShift = await getActiveShift(effectiveShopId);
    } catch (e) {
      console.error("Failed to fetch active shift:", e);
    }
  }

  try {
    shiftsHistory = await getCashShiftsHistory({
      shopId: effectiveShopId || undefined,
      limit: 50,
    });
  } catch (e) {
    console.error("Failed to fetch shift history:", e);
  }

  return (
    <Layout pageTitle="Cash Shifts & Reconciliation">
      <CashShiftsClient
        initialShops={shopsData}
        initialActiveShift={activeShift}
        initialHistory={shiftsHistory}
        initialBranchId={effectiveShopId}
      />
    </Layout>
  );
}
