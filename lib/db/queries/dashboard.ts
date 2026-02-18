import { getDatabase } from "@/lib/db/client";
import { transactions, shops } from "@/lib/db/schema";
import { unstable_cache } from "next/cache";
import { and, eq, gte, lte, sql, desc } from "drizzle-orm";
import { startOfDay, endOfDay, subDays, format } from "date-fns";
import { CheckoutItem } from "@/lib/services/checkout-service";

export const CACHE_TAG_DASHBOARD = "dashboard-metrics";

export interface DashboardSummary {
  sales: {
    totalSales: number;
    previousPeriodSales: number;
    changePercentage: number;
    transactionCount: number;
    topProducts: { name: string; units: number; revenue: number }[];
    salesTrend: { date: string; value: number }[];
  };
  lastUpdated: Date;
}

/**
 * Fetches dashboard summary for default view (Today vs Yesterday)
 * Cached for 5 minutes
 */
export const getDashboardSummary = unstable_cache(
  async (branchId?: string | null) => {
    const db = getDatabase();
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const yesterdayStart = startOfDay(subDays(now, 1));
    const yesterdayEnd = endOfDay(subDays(now, 1));
    
    // Fetch transactions for Today and Yesterday
    // We fetch raw data and aggregate in JS to avoid complex SQL for itemsSold JSONB
    const txs = await db.select({
      totalAmount: transactions.totalAmount,
      createdAt: transactions.createdAt,
      itemsSold: transactions.itemsSold,
      paymentMethod: transactions.paymentMethod,
    })
    .from(transactions)
    .where(
      and(
        branchId && branchId !== "all" ? eq(transactions.shopId, branchId) : undefined,
        gte(transactions.createdAt, yesterdayStart),
        lte(transactions.createdAt, todayEnd)
      )
    );

    let todaySales = 0;
    let yesterdaySales = 0;
    let todayCount = 0;
    const productMap = new Map<string, { name: string; units: number; revenue: number }>();

    // Process transactions
    for (const tx of txs) {
      if (!tx.createdAt) continue;
      const txDate = new Date(tx.createdAt);
      const amount = Number(tx.totalAmount) || 0;
      
      // Check if Today
      if (txDate >= todayStart && txDate <= todayEnd) {
        todaySales += amount;
        todayCount++;

        // Process Top Products (Only for Today)
        const items = tx.itemsSold as CheckoutItem[];
        if (Array.isArray(items)) {
          for (const item of items) {
             const key = item.productId;
             const existing = productMap.get(key) || { name: item.volumeDescription || item.productId, units: 0, revenue: 0 };
             existing.units += item.quantity;
             existing.revenue += (item.sellingPrice * item.quantity);
             existing.name = item.volumeDescription || existing.name; // Update name if available
             productMap.set(key, existing);
          }
        }
      } 
      // Check if Yesterday
      else if (txDate >= yesterdayStart && txDate <= yesterdayEnd) {
        yesterdaySales += amount;
      }
    }

    // Sort Top Products
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.units - a.units)
      .slice(0, 5);

    // Change Percentage
    const changePercentage = yesterdaySales > 0 
      ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 
      : 0;

    return {
      sales: {
        totalSales: todaySales,
        previousPeriodSales: yesterdaySales,
        changePercentage,
        transactionCount: todayCount,
        topProducts,
        salesTrend: [], // Populate if needed, or leave for client to fetch extensive history
      },
      lastUpdated: new Date()
    };
  },
  ["dashboard-summary"],
  {
    revalidate: 300, // 5 minutes cache
    tags: [CACHE_TAG_DASHBOARD]
  }
);
