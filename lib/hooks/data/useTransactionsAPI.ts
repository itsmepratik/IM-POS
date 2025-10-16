"use client";

import { useState, useEffect, useCallback } from "react";

export interface TransactionAPI {
  id: string;
  reference_number: string;
  location_id: string;
  shop_id: string | null;
  cashier_id: string | null;
  type: string;
  total_amount: string;
  items_sold: any[];
  payment_method: string | null;
  receipt_html: string | null;
  battery_bill_html: string | null;
  original_reference_number: string | null;
  created_at: string;
  customer_id: string | null;
  customers?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
}

export interface TransactionsAPIResponse {
  ok: boolean;
  transactions: TransactionAPI[];
}

export function useTransactionsAPI(shopId?: string) {
  const [transactions, setTransactions] = useState<TransactionAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = new URL("/api/transactions/fetch", window.location.origin);
      if (shopId && shopId !== "all-stores") {
        url.searchParams.set("shopId", shopId);
      }

      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }

      const data: TransactionsAPIResponse = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "Failed to fetch transactions");
      }

      setTransactions(data.transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
  };
}
