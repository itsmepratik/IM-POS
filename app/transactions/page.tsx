"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  ChevronDown,
  ChevronUp,
  CalendarRange,
  CalendarIcon,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  format,
  addDays,
  subDays,
  startOfYear,
  isWithinInterval,
  startOfMonth,
  subMonths,
  subYears,
  isBefore,
  isAfter,
} from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useTransactions, Transaction } from "@/lib/client";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

interface TransactionDisplay extends Omit<Transaction, "items"> {
  type: "sale" | "refund";
  items: string[];
  customerName?: string;
  reference: string;
  storeId: string;
  date?: string;
  notes?: string;
  cashier: string;
}

type DayTime = "morning" | "evening" | "full";

const timeOptions = [
  { value: "today", label: "Today" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
] as const;

type TimeOptionValue = (typeof timeOptions)[number]["value"];

const weeklyOptions = [
  { value: "current", label: "Current Week" },
  { value: "last", label: "Last Week" },
  { value: "last2", label: "2 Weeks Ago" },
  { value: "last3", label: "3 Weeks Ago" },
] as const;

const monthlyOptions = [
  { value: "current", label: "Current Month" },
  { value: "last", label: "Last Month" },
  { value: "last2", label: "2 Months Ago" },
  { value: "last3", label: "3 Months Ago" },
  { value: "last6", label: "6 Months Ago" },
] as const;

const yearlyOptions = [
  { value: "2024", label: "2024" },
  { value: "2023", label: "2023" },
  { value: "2022", label: "2022" },
  { value: "2021", label: "2021" },
] as const;

const stores = [
  { id: "all-stores", name: "All Stores" },
  { id: "store1", name: "Store 1" },
  { id: "store2", name: "Store 2" },
  { id: "store3", name: "Store 3" },
] as const;

const cashiers = [
  { id: "all-cashiers", name: "All Cashiers" },
  { id: "Mohammed Al-Farsi", name: "Mohammed Al-Farsi" },
  { id: "Ahmed Al-Balushi", name: "Ahmed Al-Balushi" },
  { id: "Hossan", name: "Hossan" },
] as const;

// Memoize the transaction card component
const TransactionCard = memo(
  ({
    transaction,
    isExpanded,
    onToggle,
  }: {
    transaction: TransactionDisplay;
    isExpanded: boolean;
    onToggle: () => void;
  }) => {
    return (
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium ${
                    transaction.type === "refund"
                      ? "text-red-500"
                      : "text-green-500"
                  }`}
                >
                  {transaction.type === "refund" ? "Refund" : "Sale"}
                </span>
                <span className="text-sm text-muted-foreground">
                  {transaction.time || transaction.date}
                </span>
                <span className="text-sm text-muted-foreground">
                  • Cashier: {transaction.cashier}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {transaction.items.join(", ")}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div
                className={`text-lg font-semibold flex items-center ${
                  transaction.type === "refund"
                    ? "text-red-500"
                    : "text-green-500"
                }`}
              >
                <span className="inline-block min-w-[80px] text-center whitespace-pre-wrap leading-tight text-[1.1rem]">
                  {"OMR\n"}
                  {Math.abs(transaction.amount).toFixed(2)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 hover:bg-muted"
                onClick={onToggle}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {isExpanded && (
            <div className="pt-4 border-t space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="ml-2 font-medium">
                    {transaction.customerName}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment:</span>
                  <span className="ml-2">{transaction.paymentMethod}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="ml-2 font-mono">
                    {transaction.reference}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cashier:</span>
                  <span className="ml-2 font-medium">
                    {transaction.cashier}
                  </span>
                </div>
                {transaction.notes && (
                  <div>
                    <span className="text-muted-foreground">Notes:</span>
                    <span className="ml-2">{transaction.notes}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }
);
TransactionCard.displayName = "TransactionCard";

// Add a fixed sales summary card at the bottom of the page
function FixedSalesCard({
  transaction,
}: {
  transaction: TransactionDisplay | null;
}) {
  return (
    <div
      className={`flex flex-row justify-between p-3 border shadow-md text-white ${
        !transaction
          ? "bg-gray-600"
          : transaction.type === "refund"
          ? "bg-red-500"
          : "bg-green-600"
      }`}
    >
      <div className="flex items-center">
        <div className="text-lg font-medium mr-2">
          {!transaction
            ? "No transactions"
            : transaction.type === "refund"
            ? "Refund"
            : "Sale"}
        </div>
        {transaction && (
          <div className="text-sm opacity-80">
            {transaction.items.join(", ")}
          </div>
        )}
      </div>
      <div className="text-lg font-bold">
        {transaction ? `OMR ${Math.abs(transaction.amount).toFixed(2)}` : "--"}
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const { transactions, isLoading } = useTransactions();

  const [selectedPeriod, setSelectedPeriod] =
    useState<TimeOptionValue>("today");
  const [timeOfDay, setTimeOfDay] = useState<DayTime>("morning");
  const [expandedTransactions, setExpandedTransactions] = useState<string[]>(
    []
  );
  const [selectedStore, setSelectedStore] = useState("all-stores");
  const [selectedCashier, setSelectedCashier] = useState("all-cashiers");
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // Check for time of day
    const hour = new Date().getHours();
    if (hour < 12) {
      setTimeOfDay("morning");
    } else if (hour < 18) {
      setTimeOfDay("evening");
    } else {
      setTimeOfDay("full");
    }

    // Set hasMounted to prevent hydration mismatch
    setHasMounted(true);
  }, []);

  const getMinMaxDates = useCallback(() => {
    const today = new Date();
    switch (selectedPeriod) {
      case "weekly":
        return {
          minDate: subDays(today, 6), // Last 7 days including today
          maxDate: today,
        };
      case "monthly":
        return {
          minDate: subDays(today, 30), // Last 31 days including today
          maxDate: today,
        };
      case "yearly":
        return {
          minDate: subDays(today, 364), // Last 365 days including today
          maxDate: today,
        };
      default:
        return {
          minDate: today,
          maxDate: today,
        };
    }
  }, [selectedPeriod]);

  const getDateRangeText = useCallback(() => {
    if (!date?.from) {
      // Simply return "Select dates" without the range info
      return "Select dates";
    }

    // Show selected date range
    if (date.to) {
      return `${format(date.from, "MMM d")} - ${format(
        date.to,
        "MMM d, yyyy"
      )}`;
    }
    return format(date.from, "MMM d, yyyy");
  }, [date]);

  // Convert transactions from our data hook to the format expected by the UI
  const getTransactions = useCallback((): TransactionDisplay[] => {
    if (!transactions) return [];

    let result: TransactionDisplay[] = [];

    if (selectedPeriod === "today") {
      if (timeOfDay === "full") {
        result = [
          ...transactions.today.morning,
          ...transactions.today.evening,
        ].map((t) => ({
          ...t,
          type: t.status === "refunded" ? "refund" : "sale",
          items: [`${t.items} items`],
          customerName: t.customer || "Anonymous",
          reference: t.id,
          storeId: "store1",
          notes: t.status === "refunded" ? "Item returned" : undefined,
          cashier: t.cashier || "Unknown",
        }));
      } else {
        result = transactions.today[timeOfDay].map((t) => ({
          ...t,
          type: t.status === "refunded" ? "refund" : "sale",
          items: [`${t.items} items`],
          customerName: t.customer || "Anonymous",
          reference: t.id,
          storeId: "store1",
          notes: t.status === "refunded" ? "Item returned" : undefined,
          cashier: t.cashier || "Unknown",
        }));
      }
    } else if (selectedPeriod === "weekly") {
      result = transactions.thisWeek.map((t) => ({
        ...t,
        type: t.status === "refunded" ? "refund" : "sale",
        items: [`${t.items} items`],
        customerName: t.customer || "Anonymous",
        reference: t.id,
        storeId: "store1",
        date: t.time,
        notes: t.status === "refunded" ? "Item returned" : undefined,
        cashier: t.cashier || "Unknown",
      }));
    } else if (selectedPeriod === "monthly") {
      result = transactions.thisMonth.map((t) => ({
        ...t,
        type: t.status === "refunded" ? "refund" : "sale",
        items: [`${t.items} items`],
        customerName: t.customer || "Anonymous",
        reference: t.id,
        storeId: "store1",
        date: t.time,
        notes: t.status === "refunded" ? "Item returned" : undefined,
        cashier: t.cashier || "Unknown",
      }));
    } else if (selectedPeriod === "yearly") {
      // For yearly, we'll use thisMonth as a placeholder
      result = transactions.thisMonth.map((t) => ({
        ...t,
        type: t.status === "refunded" ? "refund" : "sale",
        items: [`${t.items} items`],
        customerName: t.customer || "Anonymous",
        reference: t.id,
        storeId: "store1",
        date: t.time,
        notes: t.status === "refunded" ? "Item returned" : undefined,
        cashier: t.cashier || "Unknown",
      }));
    }

    // Filter by store if needed
    if (selectedStore !== "all-stores") {
      result = result.filter((t) => t.storeId === selectedStore);
    }

    // Filter by cashier if needed
    if (selectedCashier !== "all-cashiers") {
      result = result.filter((t) => t.cashier === selectedCashier);
    }

    return result;
  }, [transactions, selectedPeriod, timeOfDay, selectedStore, selectedCashier]);

  const displayTransactions = useMemo(
    () => getTransactions(),
    [getTransactions]
  );

  // Calculate total credit (total amount considering sale as positive and refund as negative)
  const totalCredit = useMemo(() => {
    if (!displayTransactions || displayTransactions.length === 0) return 0;

    return displayTransactions.reduce((total, transaction) => {
      const amount =
        transaction.type === "refund"
          ? -transaction.amount
          : transaction.amount;
      return total + amount;
    }, 0);
  }, [displayTransactions]);

  const toggleTransaction = useCallback((id: string) => {
    setExpandedTransactions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const getBackgroundPosition = () => {
    switch (timeOfDay) {
      case "morning":
        return "left-1 right-[66.666%] bg-background";
      case "evening":
        return "left-[33.333%] right-[33.333%] bg-zinc-800";
      case "full":
        return "left-[66.666%] right-1 bg-purple-600";
      default:
        return "left-1 right-[66.666%] bg-background";
    }
  };

  // If not mounted yet or data is loading, show loading state
  if (!hasMounted || isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-semibold">Transactions</h1>
            <div className="w-[180px] h-10" />{" "}
            {/* Placeholder to maintain layout */}
          </div>
          <div className="flex justify-center items-center h-[60vh]">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-muted-foreground">Loading transactions...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Find the first sale transaction
  const firstSale = displayTransactions.find((t) => t.type === "sale") || null;

  return (
    <Layout>
      {/* Section 1: Main content */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-semibold">Transactions</h1>
          <div className="flex gap-2">
            {hasMounted ? (
              <Select value={selectedStore} onValueChange={setSelectedStore}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select store" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((store) => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="w-[180px] h-10" />
            )}

            {hasMounted ? (
              <Select
                value={selectedCashier}
                onValueChange={setSelectedCashier}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select cashier" />
                </SelectTrigger>
                <SelectContent>
                  {cashiers.map((cashier) => (
                    <SelectItem key={cashier.id} value={cashier.id}>
                      {cashier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="w-[180px] h-10" />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {hasMounted ? (
              <Select
                value={selectedPeriod}
                onValueChange={(value: string) => {
                  // Reset date selection when period changes
                  setDate(undefined);
                  setSelectedPeriod(value as TimeOptionValue);
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="w-[140px] h-10" />
            )}

            {hasMounted && selectedPeriod !== "today" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant="outline"
                    size="default"
                    className={cn(
                      "w-[240px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarRange className="mr-2 h-4 w-4" />
                    {getDateRangeText()}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={new Date()}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={1}
                    disabled={{
                      before: getMinMaxDates().minDate,
                      after: getMinMaxDates().maxDate,
                    }}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          {selectedPeriod === "today" && (
            <div className="inline-flex items-center rounded-full border p-1 w-fit bg-muted relative">
              <div
                className={`absolute inset-y-1 rounded-full transition-all duration-300 ease-in-out shadow-sm ${getBackgroundPosition()}`}
              />
              <button
                className={`px-6 py-1.5 rounded-full text-sm font-medium relative transition-colors duration-300 ${
                  timeOfDay === "morning"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setTimeOfDay("morning")}
              >
                Morning
              </button>
              <button
                className={`px-6 py-1.5 rounded-full text-sm font-medium relative transition-colors duration-300 ${
                  timeOfDay === "evening"
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setTimeOfDay("evening")}
              >
                Evening
              </button>
              <button
                className={`px-6 py-1.5 rounded-full text-sm font-medium relative transition-colors duration-300 ${
                  timeOfDay === "full"
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => setTimeOfDay("full")}
              >
                Full Day
              </button>
            </div>
          )}
        </div>

        {displayTransactions && displayTransactions.length > 0 ? (
          <div className="space-y-4 pb-20">
            <div className="grid gap-4" id="transaction-cards-container">
              {displayTransactions.map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  isExpanded={expandedTransactions.includes(transaction.id)}
                  onToggle={() => toggleTransaction(transaction.id)}
                />
              ))}
            </div>
          </div>
        ) : (
          <Card className="flex flex-col items-center justify-center py-16 px-4 text-center mb-20">
            <div className="rounded-full bg-muted p-6 mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No transactions</h2>
          </Card>
        )}
      </div>

      {/* Section 2: Fixed total credit card at the bottom, responsive to sidebar */}
      <div
        className="fixed bottom-0 right-0 left-0 md:left-8 lg:left-56 z-50 w-auto flex justify-center"
        style={{ transition: "left 300ms ease-in-out", willChange: "left" }}
      >
        <div className="p-4 px-6 pb-6 w-full max-w-2xl">
          <Card className="p-4 bg-blue-50 border shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-semibold text-blue-800">
                  Total credit:
                </span>
              </div>
              <div>
                <span className="text-xl font-bold text-blue-800 min-w-[110px] text-right inline-block">
                  OMR {Math.abs(totalCredit).toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
