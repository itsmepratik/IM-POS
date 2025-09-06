"use client";

import { useState, useEffect, useCallback } from "react";

export interface Transaction {
  id: string;
  time: string;
  amount: number;
  paymentMethod: string;
  customer?: string;
  items: number;
  cashier: string;
  status: "completed" | "refunded" | "pending";
}

export interface AllTransactions {
  today: {
    morning: Transaction[];
    evening: Transaction[];
  };
  yesterday: Transaction[];
  thisWeek: Transaction[];
  thisMonth: Transaction[];
}

/**
 * Custom React hook for managing transactions
 * @returns {Object} An object containing the following properties:
 *   @property {AllTransactions | null} transactions - The current transactions data
 *   @property {boolean} isLoading - Indicates if transactions are being loaded
 *   @property {Error | null} error - Any error that occurred during data fetching
 *   @property {Function} fetchTransactions - Function to fetch transactions data
 *   @property {Function} addTransaction - Function to add a new transaction
 *   @property {Function} updateTransaction - Function to update an existing transaction
 */
export function useTransactions() {
  const [transactions, setTransactions] = useState<AllTransactions | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to fetch transactions
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First try to load from localStorage
      const savedTransactions = localStorage.getItem("transactions");

      if (savedTransactions) {
        setTransactions(JSON.parse(savedTransactions));
        setIsLoading(false);
        return;
      }

      // If no localStorage data, simulate a fetch from future DB
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Initial transactions data - this would be replaced with real API call later
      const initialData: AllTransactions = {
        today: {
          morning: [
            {
              id: "TRX-0012",
              time: "09:15 AM",
              amount: 55.99,
              paymentMethod: "Card",
              customer: "Ahmed Al-Balushi",
              items: 2,
              cashier: "Mohammed Al-Farsi",
              status: "completed",
            },
            {
              id: "TRX-0013",
              time: "10:22 AM",
              amount: 132.5,
              paymentMethod: "Cash",
              items: 5,
              cashier: "Mohammed Al-Farsi",
              status: "completed",
            },
            {
              id: "TRX-0014",
              time: "11:47 AM",
              amount: 24.99,
              paymentMethod: "Card",
              customer: "Khalid Al-Habsi",
              items: 1,
              cashier: "Mohammed Al-Farsi",
              status: "refunded",
            },
            {
              id: "TRX-0017",
              time: "08:30 AM",
              amount: 42.75,
              paymentMethod: "Cash",
              items: 3,
              cashier: "Adnan",
              status: "completed",
            },
            {
              id: "TRX-0018",
              time: "10:05 AM",
              amount: 89.99,
              paymentMethod: "Card",
              customer: "Omar Al-Rashdi",
              items: 4,
              cashier: "Adnan",
              status: "completed",
            },
          ],
          evening: [
            {
              id: "TRX-0015",
              time: "02:10 PM",
              amount: 89.97,
              paymentMethod: "Cash",
              items: 3,
              cashier: "Mohammed Al-Farsi",
              status: "completed",
            },
            {
              id: "TRX-0016",
              time: "03:45 PM",
              amount: 202.75,
              paymentMethod: "Bank Transfer",
              customer: "Fatima Al-Zadjali",
              items: 8,
              cashier: "Ahmed Al-Balushi",
              status: "completed",
            },
            {
              id: "TRX-0019",
              time: "02:45 PM",
              amount: 156.5,
              paymentMethod: "Card",
              customer: "Zainab Al-Balushi",
              items: 6,
              cashier: "Adnan",
              status: "completed",
            },
            {
              id: "TRX-0020",
              time: "04:20 PM",
              amount: 32.99,
              paymentMethod: "Cash",
              items: 2,
              cashier: "Adnan",
              status: "refunded",
            },
            {
              id: "TRX-0021",
              time: "05:15 PM",
              amount: 102.25,
              paymentMethod: "Bank Transfer",
              customer: "Ibrahim Al-Mawali",
              items: 4,
              cashier: "Mohammed Al-Farsi",
              status: "completed",
            },
          ],
        },
        yesterday: [
          {
            id: "TRX-0007",
            time: "09:30 AM",
            amount: 45.99,
            paymentMethod: "Cash",
            items: 2,
            cashier: "Mohammed Al-Farsi",
            status: "completed",
          },
          {
            id: "TRX-0008",
            time: "11:15 AM",
            amount: 78.5,
            paymentMethod: "Card",
            customer: "Salem Al-Siyabi",
            items: 3,
            cashier: "Mohammed Al-Farsi",
            status: "completed",
          },
          {
            id: "TRX-0009",
            time: "02:20 PM",
            amount: 120.25,
            paymentMethod: "Card",
            items: 4,
            cashier: "Ahmed Al-Balushi",
            status: "refunded",
          },
          {
            id: "TRX-0010",
            time: "04:45 PM",
            amount: 35.99,
            paymentMethod: "Cash",
            items: 1,
            cashier: "Mohammed Al-Farsi",
            status: "completed",
          },
          {
            id: "TRX-0011",
            time: "05:50 PM",
            amount: 189.99,
            paymentMethod: "Bank Transfer",
            customer: "Nasser Al-Mandhari",
            items: 6,
            cashier: "Ahmed Al-Balushi",
            status: "completed",
          },
        ],
        thisWeek: [
          {
            id: "TRX-0001",
            time: "Mon 10:15 AM",
            amount: 112.99,
            paymentMethod: "Card",
            customer: "Aisha Al-Raisi",
            items: 4,
            cashier: "Mohammed Al-Farsi",
            status: "completed",
          },
          {
            id: "TRX-0002",
            time: "Tue 02:30 PM",
            amount: 65.5,
            paymentMethod: "Cash",
            items: 2,
            cashier: "Ahmed Al-Balushi",
            status: "completed",
          },
          {
            id: "TRX-0003",
            time: "Wed 11:45 AM",
            amount: 210.75,
            paymentMethod: "Bank Transfer",
            customer: "Saif Al-Amri",
            items: 7,
            cashier: "Mohammed Al-Farsi",
            status: "completed",
          },
          {
            id: "TRX-0004",
            time: "Thu 09:20 AM",
            amount: 45.99,
            paymentMethod: "Card",
            items: 1,
            cashier: "Mohammed Al-Farsi",
            status: "refunded",
          },
          {
            id: "TRX-0005",
            time: "Thu 03:15 PM",
            amount: 89.99,
            paymentMethod: "Cash",
            items: 3,
            cashier: "Ahmed Al-Balushi",
            status: "completed",
          },
          {
            id: "TRX-0006",
            time: "Fri 04:50 PM",
            amount: 155.25,
            paymentMethod: "Card",
            customer: "Layla Al-Kindi",
            items: 5,
            cashier: "Mohammed Al-Farsi",
            status: "completed",
          },
          {
            id: "TRX-0022",
            time: "Sat 09:45 AM",
            amount: 76.5,
            paymentMethod: "Card",
            customer: "Haitham Al-Lawati",
            items: 3,
            cashier: "Adnan",
            status: "completed",
          },
          {
            id: "TRX-0023",
            time: "Sat 02:30 PM",
            amount: 145.25,
            paymentMethod: "Bank Transfer",
            customer: "Salma Al-Harthy",
            items: 5,
            cashier: "Ahmed Al-Balushi",
            status: "completed",
          },
          {
            id: "TRX-0024",
            time: "Sun 11:20 AM",
            amount: 49.99,
            paymentMethod: "Cash",
            items: 2,
            cashier: "Adnan",
            status: "refunded",
          },
        ],
        thisMonth: [
          {
            id: "TRX-M001",
            time: "Jan 05",
            amount: 320.99,
            paymentMethod: "Bank Transfer",
            customer: "Maryam Al-Zadjali",
            items: 9,
            cashier: "Ahmed Al-Balushi",
            status: "completed",
          },
          {
            id: "TRX-M002",
            time: "Jan 08",
            amount: 45.5,
            paymentMethod: "Cash",
            items: 2,
            cashier: "Mohammed Al-Farsi",
            status: "completed",
          },
          {
            id: "TRX-M003",
            time: "Jan 12",
            amount: 112.75,
            paymentMethod: "Card",
            customer: "Hamed Al-Harthi",
            items: 4,
            cashier: "Mohammed Al-Farsi",
            status: "refunded",
          },
          {
            id: "TRX-M004",
            time: "Jan 15",
            amount: 78.99,
            paymentMethod: "Cash",
            items: 3,
            cashier: "Ahmed Al-Balushi",
            status: "completed",
          },
          {
            id: "TRX-M005",
            time: "Jan 19",
            amount: 245.5,
            paymentMethod: "Bank Transfer",
            customer: "Yasmin Al-Maamari",
            items: 8,
            cashier: "Mohammed Al-Farsi",
            status: "completed",
          },
          {
            id: "TRX-M006",
            time: "Jan 22",
            amount: 56.25,
            paymentMethod: "Card",
            items: 2,
            cashier: "Ahmed Al-Balushi",
            status: "completed",
          },
          {
            id: "TRX-M007",
            time: "Jan 25",
            amount: 132.99,
            paymentMethod: "Cash",
            customer: "Khalid Al-Habsi",
            items: 5,
            cashier: "Mohammed Al-Farsi",
            status: "completed",
          },
          {
            id: "TRX-M008",
            time: "Jan 28",
            amount: 189.75,
            paymentMethod: "Card",
            items: 6,
            cashier: "Ahmed Al-Balushi",
            status: "refunded",
          },
          {
            id: "TRX-M009",
            time: "Jan 31",
            amount: 134.5,
            paymentMethod: "Card",
            customer: "Abdullah Al-Rawahi",
            items: 4,
            cashier: "Adnan",
            status: "completed",
          },
          {
            id: "TRX-M010",
            time: "Feb 02",
            amount: 89.25,
            paymentMethod: "Cash",
            items: 3,
            cashier: "Mohammed Al-Farsi",
            status: "completed",
          },
          {
            id: "TRX-M011",
            time: "Feb 05",
            amount: 215.75,
            paymentMethod: "Bank Transfer",
            customer: "Noura Al-Abri",
            items: 7,
            cashier: "Adnan",
            status: "completed",
          },
        ],
      };

      setTransactions(initialData);

      // Save to localStorage
      localStorage.setItem("transactions", JSON.stringify(initialData));
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Unknown error occurred")
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Function to add a transaction
  const addTransaction = useCallback(
    async (
      transaction: Omit<Transaction, "id">,
      period: keyof AllTransactions | "today.morning" | "today.evening"
    ) => {
      try {
        if (!transactions) {
          return null;
        }

        const newTransaction: Transaction = {
          ...transaction,
          id: `TRX-${Date.now().toString().substring(7)}`,
        };

        const updatedTransactions = { ...transactions };

        // Handle the special case for today's morning/evening
        if (period === "today.morning") {
          updatedTransactions.today.morning = [
            ...updatedTransactions.today.morning,
            newTransaction,
          ];
        } else if (period === "today.evening") {
          updatedTransactions.today.evening = [
            ...updatedTransactions.today.evening,
            newTransaction,
          ];
        } else {
          // For other periods
          updatedTransactions[period as keyof AllTransactions] = [
            ...(updatedTransactions[
              period as keyof AllTransactions
            ] as Transaction[]),
            newTransaction,
          ];
        }

        setTransactions(updatedTransactions);

        // Save to localStorage
        localStorage.setItem(
          "transactions",
          JSON.stringify(updatedTransactions)
        );
        return newTransaction;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to add transaction")
        );
        return null;
      }
    },
    [transactions]
  );

  // Function to update a transaction
  const updateTransaction = useCallback(
    async (
      transaction: Transaction,
      period: keyof AllTransactions | "today.morning" | "today.evening"
    ) => {
      try {
        if (!transactions) {
          return false;
        }

        const updatedTransactions = { ...transactions };

        // Handle the special case for today's morning/evening
        if (period === "today.morning") {
          updatedTransactions.today.morning =
            updatedTransactions.today.morning.map((t) =>
              t.id === transaction.id ? transaction : t
            );
        } else if (period === "today.evening") {
          updatedTransactions.today.evening =
            updatedTransactions.today.evening.map((t) =>
              t.id === transaction.id ? transaction : t
            );
        } else {
          // For other periods
          updatedTransactions[period as keyof AllTransactions] = (
            updatedTransactions[
              period as keyof AllTransactions
            ] as Transaction[]
          ).map((t) => (t.id === transaction.id ? transaction : t));
        }

        setTransactions(updatedTransactions);

        // Save to localStorage
        localStorage.setItem(
          "transactions",
          JSON.stringify(updatedTransactions)
        );
        return true;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to update transaction")
        );
        return false;
      }
    },
    [transactions]
  );

  return {
    transactions,
    isLoading,
    error,
    fetchTransactions,
    addTransaction,
    updateTransaction,
  };
}
