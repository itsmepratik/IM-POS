
import { db } from "../lib/db/client";
import { sql, eq } from "drizzle-orm";
import { inventory, shops, locations, tradeInPrices, tradeInTransactions } from "../lib/db/schema";

async function verifyTradeIn() {
  console.log("Starting Trade-In verification...");

  // 1. Get Location & Shop
  const [location] = await db.select().from(locations).limit(1);
  const [shop] = await db.select().from(shops).limit(1);
  if (!location || !shop) throw new Error("Missing location or shop");

  // 2. Ensure Trade-In Price exists
  const [existingPrice] = await db.select().from(tradeInPrices).limit(1);
  if (!existingPrice) {
      console.log("Inserting mock trade-in price...");
      await db.insert(tradeInPrices).values({
          size: "55Test",
          condition: "Scrap",
          tradeInValue: "2.500"
      });
  }

  // 3. Get a product to sell (Standard Stock)
  const stockItem = await db.query.inventory.findFirst({
      where: (inventory, { eq, gt, and }) => and(
          eq(inventory.locationId, location.id),
          gt(inventory.standardStock, 10)
      )
  });
  
  if (!stockItem) throw new Error("No safe product to sell found");

  // 4. Construct Payload
  const cart = [{
      productId: stockItem.productId,
      quantity: 1,
      sellingPrice: 10,
      source: "CLOSED"
  }];

  const tradeIns = [{
      productId: "00000000-0000-0000-0000-000000000000", // Valid UUID format, but dummy
      quantity: 1,
      tradeInValue: 2.5,
      size: "55Test",
      condition: "scrap", // Match default expectation
      name: "Trade-in battery - 55Test (Scrap)",
      costPrice: 2.5
  }];

  const payload = {
    p_location_id: location.id,
    p_shop_id: shop.id,
    p_cashier_id: null,
    p_items: JSON.stringify(cart),
    p_total_amount: "7.5", // 10 - 2.5
    p_payment_method: "CASH",
    p_type: "SALE",
    p_customer_id: null,
    p_discount_value: null,
    p_discount_type: null,
    p_discount_amount: "0",
    p_subtotal: "10",
    p_car_plate: "TRADE-TEST",
    p_mobile_acc: null,
    p_mobile_num: null,
    p_notes: "Trade-In Verification Test",
    p_trade_ins: JSON.stringify(tradeIns)
  };

  // 5. Execute
  console.log("Executing stored procedure with trade-in...");
  
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
            ${payload.p_customer_id}::uuid,
            ${payload.p_discount_value}::numeric,
            ${payload.p_discount_type}::text,
            ${payload.p_discount_amount}::numeric,
            ${payload.p_subtotal}::numeric,
            ${payload.p_car_plate}::text,
            ${payload.p_mobile_acc}::text,
            ${payload.p_mobile_num}::text,
            ${payload.p_notes}::text,
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
          console.log("Trade-In verified successfully!", tiRecords[0]);
      } else {
          console.error("No trade-in records found!");
          process.exit(1);
      }

  } catch (e) {
      console.error("Error executing stored procedure:", e);
      process.exit(1);
  }
}

verifyTradeIn().catch(console.error).then(() => process.exit(0));
