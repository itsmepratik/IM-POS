import { getRevenueData } from "./app/sales-info/revenue/actions";

async function main() {
  const data = await getRevenueData(
    new Date("2026-03-01"),
    new Date("2026-03-05"),
  );
  console.log("Items:", data.items.length);
  console.log("Stores:", data.stores.length);
}

main().catch(console.error);
