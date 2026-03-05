import { NextResponse } from "next/server";
import { getInventoryServerAction } from "@/lib/actions/inventory";

export async function GET() {
  const result = await getInventoryServerAction(
    1, // page
    10, // limit
    "shell", // search
    "all", // categoryId
    "all", // brandId
    "sanaiya", // locationId
    {
      stockStatus: "all",
      showLowStockOnly: false,
      showOutOfStockOnly: false,
      showInStock: false,
      showBatteries: false,
      batteryState: "new",
      sortBy: "name",
      sortOrder: "asc",
    },
  );

  return NextResponse.json(result);
}
