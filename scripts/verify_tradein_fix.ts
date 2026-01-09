
import { db } from "../lib/db/client";
import { sql, eq } from "drizzle-orm";
import { inventory, shops, locations, tradeInPrices, tradeInTransactions } from "../lib/db/schema";

async function verifyTradeInFix() {
  console.log("Starting Trade-In Fix verification...");

  // 1. Get Location & Shop
  const [location] = await db.select().from(locations).limit(1);
  const [shop] = await db.select().from(shops).limit(1);
  if (!location || !shop) throw new Error("Missing location or shop");

  // 2. Ensure Trade-In Price exists
  const [existingPrice] = await db.select().from(tradeInPrices).limit(1);
  if (!existingPrice) {
      console.log("Inserting mock trade-in price...");
      await db.insert(tradeInPrices).values({
          size: "100",
          condition: "resellable",
          tradeInValue: "9.000"
      });
  }

  // 3. Get a product to sell
  const stockItem = await db.query.inventory.findFirst({
      where: (inventory, { eq, gt, and }) => and(
          eq(inventory.locationId, location.id),
          gt(inventory.standardStock, 10)
      )
  });
  
  if (!stockItem) throw new Error("No safe product to sell found");

  // 4. Construct Payload with INVALID UUID for Trade-In (replicating the crash scenario)
  const cart = [{
      productId: stockItem.productId,
      quantity: 1,
      sellingPrice: 37,
      volumeDescription: "Amaron 80L 70AH",
      source: "CLOSED"
  }];

  // Replicating the crash payload structure
  const tradeIns = [{
      productId: "tradein-100-resellable", // This caused the crash
      quantity: 1,
      tradeInValue: 9,
      size: "100",
      condition: "resellable",
      name: "100",
      costPrice: 9
  }];

  const payload = {
    p_location_id: location.id,
    p_shop_id: shop.id,
    p_cashier_id: null,
    p_items: JSON.stringify(cart),
    p_total_amount: "28", // 37 - 9
    p_payment_method: "CASH",
    p_type: "SALE",
    p_trade_ins: JSON.stringify(tradeIns)
  };

  // 5. Execute
  console.log("Executing stored procedure with invalid UUID trade-in...");
  
  try {
      const result = await db.execute(sql`
        SELECT create_checkout_transaction(
            ${payload.p_location_id}::uuid,
            ${payload.p_shop_id}::uuid,
            ${payload.p_cashier_id}::uuid,
            ${payload.p_items}::jsonb,
            ${payload.p_total_amount}::numeric,
            ${payload.p_payment_method}::text,
            ${payload.p_type}::text,
            null::uuid, -- customer
            null::numeric, -- discount val
            null::text, -- discount type
            0::numeric, -- discount amt
            37::numeric, -- subtotal
            null::text, -- plate
            null::text, -- mobile acc
            null::text, -- mobile num
            'Verification after UUID Fix'::text, -- notes
            ${payload.p_trade_ins}::jsonb
        ) as data
      `);
      
      const data = result[0].data as any;
      console.log("Result:", data);

      if (!data || !data.transaction_id) throw new Error("Transaction failed");

      // 6. Verify Trade-In Transaction Record
      const tiRecords = await db.select().from(tradeInTransactions)
          .where(eq(tradeInTransactions.transactionId, data.transaction_id));
      
      console.log("Trade-In Records Found:", tiRecords.length);
      if (tiRecords.length > 0) {
          console.log("Trade-In verified successfully! Record:", tiRecords[0]);
      } else {
          console.error("No trade-in records found!");
          process.exit(1);
      }

  } catch (e) {
      console.error("Error executing stored procedure:", e);
      process.exit(1);
  }
}

verifyTradeInFix().catch(console.error).then(() => process.exit(0));
