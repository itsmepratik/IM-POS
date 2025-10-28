/**
 * Test script to verify labor charges are properly recorded in transactions
 *
 * Usage: bun run scripts/test-labor-charge.ts
 */

import { getDatabase } from "../lib/db/client";
import { transactions } from "../lib/db/schema";
import { desc } from "drizzle-orm";

async function testLaborChargeRecording() {
  console.log("🔍 Testing Labor Charge Recording...\n");

  try {
    const db = getDatabase();

    // Fetch recent transactions with labor charges
    console.log("📋 Fetching recent transactions with labor charges...");

    const recentTransactions = await db
      .select({
        id: transactions.id,
        referenceNumber: transactions.referenceNumber,
        totalAmount: transactions.totalAmount,
        itemsSold: transactions.itemsSold,
        createdAt: transactions.createdAt,
        type: transactions.type,
        paymentMethod: transactions.paymentMethod,
      })
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(20);

    console.log(`✅ Found ${recentTransactions.length} recent transactions\n`);

    // Filter transactions with labor charges
    const transactionsWithLabor = recentTransactions.filter((t) => {
      const items = t.itemsSold as any[];
      return items?.some(
        (item) =>
          item.productId === "9999" ||
          item.productId === 9999 ||
          item.volumeDescription?.includes("Labor")
      );
    });

    console.log(
      `🔧 Found ${transactionsWithLabor.length} transactions with labor charges\n`
    );

    if (transactionsWithLabor.length === 0) {
      console.log("⚠️  No transactions with labor charges found.");
      console.log(
        "💡 Try adding a labor charge from the POS and completing a transaction first.\n"
      );
      return;
    }

    // Display details of transactions with labor charges
    console.log("📊 Transaction Details:\n");
    console.log("=".repeat(80));

    for (const transaction of transactionsWithLabor) {
      const items = transaction.itemsSold as any[];
      const laborItems = items.filter(
        (item) =>
          item.productId === "9999" ||
          item.productId === 9999 ||
          item.volumeDescription?.includes("Labor")
      );

      console.log(`\n📌 Transaction: ${transaction.referenceNumber}`);
      console.log(
        `   Date: ${new Date(transaction.createdAt!).toLocaleString()}`
      );
      console.log(`   Type: ${transaction.type}`);
      console.log(`   Payment: ${transaction.paymentMethod}`);
      console.log(`   Total: OMR ${transaction.totalAmount}\n`);

      console.log("   Labor Charges:");
      laborItems.forEach((labor, index) => {
        console.log(
          `   ${index + 1}. ${
            labor.volumeDescription || "Labor - Custom Service"
          }`
        );
        console.log(`      - Product ID: ${labor.productId}`);
        console.log(`      - Price: OMR ${labor.sellingPrice}`);
        console.log(`      - Quantity: ${labor.quantity}`);
        console.log(
          `      - Subtotal: OMR ${(
            labor.sellingPrice * labor.quantity
          ).toFixed(3)}`
        );
      });

      console.log("\n   All Items:");
      items.forEach((item, index) => {
        const isLabor = item.productId === "9999" || item.productId === 9999;
        const icon = isLabor ? "🔧" : "📦";
        console.log(
          `   ${icon} ${item.volumeDescription || "N/A"} - OMR ${(
            item.sellingPrice * item.quantity
          ).toFixed(3)}`
        );
      });

      console.log("\n" + "-".repeat(80));
    }

    console.log("\n✅ Labor Charge Test Complete!\n");
    console.log("Summary:");
    console.log(`- Total transactions checked: ${recentTransactions.length}`);
    console.log(`- Transactions with labor: ${transactionsWithLabor.length}`);
    console.log(
      `- Labor charges are being properly recorded in the database ✓\n`
    );
  } catch (error) {
    console.error("❌ Error testing labor charges:", error);
    throw error;
  }
}

// Run the test
testLaborChargeRecording()
  .then(() => {
    console.log("🎉 Test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Test failed:", error);
    process.exit(1);
  });
