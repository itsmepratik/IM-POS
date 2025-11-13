"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/supabase/client";

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
  car_plate_number: string | null;
  mobile_payment_account: string | null;
  mobile_number: string | null;
  created_at: string;
  customer_id: string | null;
  customers?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  shops?: {
    id: string;
    name: string;
    display_name: string | null;
  } | null;
  staff?: {
    id: string;
    staff_id: string;
    name: string;
  } | null;
}

export interface TransactionsAPIResponse {
  ok: boolean;
  transactions: TransactionAPI[];
}

export function useTransactionsAPI(
  shopId?: string,
  startDate?: string,
  endDate?: string
) {
  const [transactions, setTransactions] = useState<TransactionAPI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const subscriptionRef = useRef<ReturnType<typeof createClient>["channel"] | null>(null);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = new URL("/api/transactions/fetch", window.location.origin);
      if (shopId && shopId !== "all-stores") {
        url.searchParams.set("shopId", shopId);
      }
      if (startDate) {
        url.searchParams.set("startDate", startDate);
      }
      if (endDate) {
        url.searchParams.set("endDate", endDate);
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
  }, [shopId, startDate, endDate]);

  // Set up real-time subscription
  useEffect(() => {
    fetchTransactions();

    // Set up Supabase real-time subscription
    const supabase = createClient();
    
    // Create a channel for transactions table
    const channel = supabase
      .channel("transactions-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transactions",
          ...(shopId && shopId !== "all-stores" ? { filter: `shop_id=eq.${shopId}` } : {}),
        },
        async (payload) => {
          console.log("🔄 New transaction detected:", payload.new);
          
          // Fetch the new transaction with all relations
          try {
            const url = new URL("/api/transactions/fetch", window.location.origin);
            url.searchParams.set("referenceNumber", payload.new.reference_number);
            
            const response = await fetch(url.toString());
            if (response.ok) {
              const data: TransactionsAPIResponse = await response.json();
              if (data.ok && data.transactions.length > 0) {
                const newTransaction = data.transactions[0];
                
                // Add the new transaction to the beginning of the list
                setTransactions((prev) => {
                  // Check if transaction already exists to avoid duplicates
                  if (prev.some((t) => t.id === newTransaction.id)) {
                    return prev;
                  }
                  return [newTransaction, ...prev];
                });
              }
            }
          } catch (error) {
            console.error("Error fetching new transaction details:", error);
            // Fallback: refetch all transactions
            fetchTransactions();
          }
        }
      )
      .subscribe((status) => {
        console.log("📡 Transactions subscription status:", status);
      });

    subscriptionRef.current = channel;

    // Cleanup subscription on unmount or when shopId changes
    return () => {
      console.log("🔌 Unsubscribing from transactions channel");
      supabase.removeChannel(channel);
    };
  }, [shopId, startDate, endDate, fetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
  };
}
