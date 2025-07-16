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
  Printer,
  X,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSettingsUsers } from "@/lib/hooks/data/useSettingsUsers";
import { useToast } from "@/components/ui/use-toast";
import { useStaffIDs } from "@/lib/hooks/useStaffIDs";

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

// Create a function to generate the cashiers array from staffMembers
const useCashiersSelect = () => {
  const { staffMembers } = useStaffIDs();

  // Convert staffMembers to the format expected by the Select component
  const cashierOptions = [
    { id: "all-cashiers", name: "All Cashiers" },
    ...staffMembers.map((staff) => ({
      id: staff.name, // Use name as ID since that's what the filtering uses
      name: staff.name,
    })),
  ];

  return cashierOptions;
};

// Memoize the transaction card component
const TransactionCard = memo(
  ({
    transaction,
    isExpanded,
    onToggle,
    onViewReceipt,
  }: {
    transaction: TransactionDisplay;
    isExpanded: boolean;
    onToggle: () => void;
    onViewReceipt: (transaction: TransactionDisplay) => void;
  }) => {
    return (
      <Card className="p-4 sm:p-5">
        <div className="space-y-4 sm:space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <span
                  className={`text-base sm:text-lg font-medium ${
                    transaction.type === "refund"
                      ? "text-red-500"
                      : "text-green-500"
                  }`}
                >
                  {transaction.type === "refund" ? "Refund" : "Sale"}
                </span>
                <span className="text-sm sm:text-base text-muted-foreground">
                  {transaction.time || transaction.date}
                </span>
              </div>
              <div className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-1.5">
                • Cashier: {transaction.cashier}
              </div>
              <div className="text-sm sm:text-base mt-1 sm:mt-1.5">
                {transaction.items[0]}
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-5">
              <div
                className={`font-semibold ${
                  transaction.type === "refund"
                    ? "text-red-500"
                    : "text-green-500"
                }`}
              >
                <div className="flex flex-col items-end">
                  <span className="text-sm sm:text-base">OMR</span>
                  <span className="text-lg sm:text-2xl font-bold">
                    {Math.abs(transaction.amount).toFixed(2)}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 sm:h-9 sm:w-9 p-0 hover:bg-muted"
                onClick={onToggle}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
                )}
              </Button>
            </div>
          </div>

          {isExpanded && (
            <div className="pt-4 sm:pt-5 border-t space-y-4 sm:space-y-5 text-sm sm:text-base">
              <div className="grid grid-cols-2 gap-3 sm:gap-5">
                <div>
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="ml-1.5 sm:ml-2.5 font-medium">
                    {transaction.customerName}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Payment:</span>
                  <span className="ml-1.5 sm:ml-2.5">
                    {transaction.paymentMethod}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="ml-1.5 sm:ml-2.5 font-mono">
                    {transaction.reference}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cashier:</span>
                  <span className="ml-1.5 sm:ml-2.5 font-medium">
                    {transaction.cashier}
                  </span>
                </div>
                {transaction.notes && (
                  <div>
                    <span className="text-muted-foreground">Notes:</span>
                    <span className="ml-1.5 sm:ml-2.5">
                      {transaction.notes}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => onViewReceipt(transaction)}
                >
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="text-sm sm:text-base">View Receipt</span>
                </Button>
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
      className={`flex flex-row justify-between p-4 sm:p-5 border shadow-md rounded-md ${
        !transaction
          ? "bg-gray-600"
          : transaction.type === "refund"
          ? "bg-red-500"
          : "bg-green-600"
      }`}
    >
      <div className="flex flex-col text-white">
        <div className="text-lg sm:text-xl font-semibold">
          {!transaction
            ? "No transactions"
            : transaction.type === "refund"
            ? "Refund"
            : "Sale"}
        </div>
        {transaction && (
          <div className="text-sm sm:text-base opacity-90 mt-1 sm:mt-1.5">
            {transaction.items[0]}
          </div>
        )}
      </div>
      <div className="flex flex-col items-end text-white">
        {transaction && (
          <>
            <span className="text-sm sm:text-base">OMR</span>
            <span className="text-lg sm:text-2xl font-bold">
              {Math.abs(transaction.amount).toFixed(2)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// Receipt component for the dialog
function Receipt({ transaction }: { transaction: TransactionDisplay | null }) {
  if (!transaction) return null;

  // Mock receipt items based on the transaction
  const receiptItems = Array.from(
    { length: Number(transaction.items[0].split(" ")[0]) || 1 },
    (_, i) => ({
      id: `item-${i}`,
      name: `Item ${i + 1}`,
      quantity: Math.floor(Math.random() * 3) + 1,
      price: (Math.random() * 10 + 5).toFixed(2),
    })
  );

  // Calculate subtotal
  const subtotal = receiptItems.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );

  // Calculate tax (5%)
  const tax = subtotal * 0.05;

  // Calculate total
  const total = subtotal + tax;
  const itemCount = receiptItems.reduce((sum, item) => sum + item.quantity, 0);

  // Format receipt number from transaction reference
  const receiptNumber = transaction.reference.substring(0, 8);

  // Format date and time
  const currentDate =
    transaction.time?.split(" ")[0] ||
    transaction.date ||
    format(new Date(), "dd/MM/yyyy");
  const currentTime =
    transaction.time?.split(" ")[1] || format(new Date(), "HH:mm:ss");

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const content = document.getElementById("receipt-content")?.innerHTML;
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt - ${receiptNumber}</title>
            <style>
              body {
                font-family: 'Courier New', monospace;
                padding: 0;
                margin: 0;
                width: 80mm;
                font-size: 12px;
              }
              .receipt-container {
                padding: 5mm;
              }
              .receipt-header {
                text-align: center;
                margin-bottom: 10px;
              }
              .receipt-header h2 {
                margin: 0;
                font-size: 16px;
              }
              .receipt-header p {
                margin: 2px 0;
                font-size: 12px;
              }
              .receipt-info {
                border-top: 1px dashed #000;
                border-bottom: 1px dashed #000;
                padding: 5px 0;
                margin-bottom: 10px;
              }
              .receipt-info p {
                margin: 2px 0;
                font-size: 12px;
              }
              .receipt-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 10px;
                table-layout: fixed;
              }
              .receipt-table th {
                text-align: left;
                font-size: 12px;
                padding-bottom: 5px;
              }
              .receipt-table td {
                font-size: 12px;
                padding: 2px 0;
                word-wrap: break-word;
                word-break: break-word;
              }
              .receipt-table .qty {
                width: 30px;
              }
              .receipt-table .description {
                width: auto;
                max-width: 180px;
              }
              .receipt-table .price {
                width: 60px;
                text-align: right;
              }
              .receipt-table .amount {
                width: 70px;
                text-align: right;
              }
              .receipt-summary {
                margin-top: 10px;
                border-top: 1px dashed #000;
                padding-top: 5px;
              }
              .receipt-summary table {
                width: 100%;
              }
              .receipt-summary td {
                font-size: 12px;
              }
              .receipt-summary .total-label {
                font-weight: bold;
              }
              .receipt-summary .total-amount {
                text-align: right;
                font-weight: bold;
              }
              .receipt-footer {
                margin-top: 10px;
                text-align: center;
                font-size: 12px;
                border-top: 1px dashed #000;
                padding-top: 5px;
              }
              .receipt-footer p {
                margin: 3px 0;
              }
              .receipt-footer .arabic {
                font-size: 11px;
                direction: rtl;
                margin: 2px 0;
              }
              .barcode {
                margin-top: 10px;
                text-align: center;
              }
              .whatsapp {
                margin-top: 5px;
                text-align: center;
                font-size: 11px;
                font-weight: bold;
              }
              @media print {
                body {
                  width: 80mm;
                  margin: 0;
                  padding: 0;
                }
                @page {
                  margin: 0;
                  size: 80mm auto;
                }
              }
              .receipt-summary .discount-row {
                color: #22c55e;
                font-weight: bold;
              }
              .receipt-summary .discount-row td {
                color: #22c55e;
                font-weight: bold;
              }
            </style>
          </head>
          <body>
            <div class="receipt-container">
              <div class="receipt-header">
                <h2>H Automotives</h2>
                <p>Saham, Sultanate of Oman</p>
                <p>Ph: 92510750 | 26856848</p>
                <p>VATIN: OM1100006980</p>
              </div>
              
              <div class="receipt-info">
                <p>INVOICE</p>
                <p>Date: ${currentDate}</p>
                <p>Time: ${currentTime}    POS ID: ${receiptNumber}</p>
              </div>
              
              <table class="receipt-table">
                <thead>
                  <tr>
                    <th class="qty">Qty.</th>
                    <th class="description">Desc</th>
                    <th class="price">Price</th>
                    <th class="amount">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${receiptItems
                    .map(
                      (item) => `
                    <tr>
                      <td class="qty">${item.quantity}</td>
                      <td class="description">${item.name}</td>
                      <td class="price">${item.price}</td>
                      <td class="amount">${(
                        parseFloat(item.price) * item.quantity
                      ).toFixed(2)}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
              
              <div class="receipt-summary">
                <table>
                  <tr>
                    <td>Total w/o VAT</td>
                    <td class="total-amount">OMR ${subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td>VAT (5%)</td>
                    <td class="total-amount">OMR ${tax.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td class="total-label">Total with VAT</td>
                    <td class="total-amount">OMR ${total.toFixed(2)}</td>
                  </tr>
                </table>
              </div>
              
              <div class="receipt-footer">
                <p>Number of Items: ${itemCount}</p>
                <p>Payment Method: ${transaction.paymentMethod || "Cash"}</p>
                <p>Cashier: ${transaction.cashier}</p>
                <p>Keep this Invoice for your Exchanges</p>
                <p class="arabic">احتفظ بهذه الفاتورة للتبديل</p>
                <p>Exchange with in 15 Days</p>
                <p class="arabic">التبديل خلال 15 يوم</p>
                <p>Thank you for shopping with us.</p>
                <p class="arabic">شكراً للتسوق معنا</p>
              </div>
              
              <div class="whatsapp">
                WhatsApp 72702537 for latest offers
              </div>
              
              <div class="barcode">
                <!-- Barcode would go here in a real implementation -->
                ${receiptNumber}
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();

      // On mobile, we need a slight delay before printing
      setTimeout(() => {
        printWindow.print();
        // Close the window after print on desktop, but keep it open on mobile
        // as mobile browsers handle print differently
        if (
          !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          )
        ) {
          printWindow.close();
        }
      }, 500);
    }
  };

  return (
    <div className="flex-grow flex flex-col overflow-hidden">
      {/* This is the scrollable content area */}
      <div className="flex-grow overflow-y-auto p-6">
        <div
          id="receipt-content"
          className="bg-white border rounded-lg p-4 w-full max-w-sm mx-auto"
        >
          {/* Receipt Preview */}
          <div className="text-center mb-2">
            <h3 className="font-bold text-lg">H Automotives</h3>
            <p className="text-xs text-gray-500">Saham, Sultanate of Oman</p>
            <p className="text-xs text-gray-500">Ph: 92510750 | 26856848</p>
            <p className="text-xs text-gray-500">VATIN: OM1100006980</p>
          </div>

          <div className="border-t border-b border-dashed py-2 my-2">
            <p className="text-xs font-medium text-center mb-1">INVOICE</p>
            <div className="flex justify-between items-start text-xs">
              <div>
                <p>Date: {currentDate}</p>
                <p>Time: {currentTime}</p>
              </div>
              <div className="text-right">
                <p>POS ID: {receiptNumber}</p>
              </div>
            </div>
          </div>

          <div className="text-xs mb-3">
            <div className="grid grid-cols-12 gap-2 font-bold mb-1 border-b border-dashed pb-1">
              <span className="col-span-2">Qty</span>
              <span className="col-span-5">Desc</span>
              <span className="col-span-2 text-right">Price</span>
              <span className="col-span-3 text-right">Amount</span>
            </div>

            {receiptItems.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 mt-1">
                <span className="col-span-2">{item.quantity}</span>
                <span className="col-span-5 break-words">{item.name}</span>
                <span className="col-span-2 text-right">{item.price}</span>
                <span className="col-span-3 text-right">
                  {(parseFloat(item.price) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed pt-2 mb-3">
            <div className="flex justify-between text-xs">
              <span>Total w/o VAT</span>
              <span>OMR {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>VAT (5%)</span>
              <span>OMR {tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold mt-1">
              <span>Total with VAT</span>
              <span>OMR {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-xs text-gray-600 border-t border-dashed pt-2">
            <div className="text-center space-y-0.5">
              <p>Number of Items: {itemCount}</p>
              <p>Payment Method: {transaction.paymentMethod || "Cash"}</p>
              <p>Cashier: {transaction.cashier}</p>
            </div>
            <div className="text-center space-y-0.5 mt-2">
              <p>Keep this Invoice for your Exchanges</p>
              <p dir="rtl">احتفظ بهذه الفاتورة للتبديل</p>
              <p>Exchange with in 15 Days</p>
              <p dir="rtl">التبديل خلال 15 يوم</p>
              <p>Thank you for shopping with us.</p>
              <p dir="rtl">شكراً للتسوق معنا</p>
            </div>
            <div className="text-center pt-2 mt-2 border-t border-dashed">
              <p className="font-medium">WhatsApp 72702537 for latest offers</p>
              <p className="font-mono mt-1">{receiptNumber}</p>
            </div>
          </div>
        </div>
      </div>
      {/* This is the fixed footer for the print button */}
      <div className="p-6 border-t bg-background shrink-0">
        <Button
          onClick={handlePrint}
          className="w-full flex items-center justify-center gap-2"
        >
          <Printer className="h-4 w-4" />
          Print Receipt
        </Button>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const { transactions, isLoading } = useTransactions();
  const [timeOfDay, setTimeOfDay] = useState<DayTime>("full");
  const [selectedStore, setSelectedStore] = useState("all-stores");
  const [selectedCashier, setSelectedCashier] = useState("all-cashiers");
  const [selectedPeriod, setSelectedPeriod] =
    useState<TimeOptionValue>("today");
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionDisplay | null>(null);
  const [expandedTransactionId, setExpandedTransactionId] = useState<
    string | null
  >(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [scrollActive, setScrollActive] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Get cashier options for the select
  const cashierOptions = useCashiersSelect();

  const [hasMounted, setHasMounted] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [receiptOpen, setReceiptOpen] = useState(false);

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
    setExpandedTransactionId((prev) => (prev === id ? null : id));
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

  const handleViewReceipt = (transaction: TransactionDisplay) => {
    setSelectedTransaction(transaction);
    setReceiptOpen(true);
  };

  // If not mounted yet or data is loading, show loading state
  if (!hasMounted || isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-2xl font-semibold">
              <span className="hidden sm:inline">Transactions</span>
            </h1>
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
          <h1 className="text-2xl font-semibold">
            <span className="hidden sm:inline">Transactions</span>
          </h1>
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
                  {cashierOptions.map((cashier) => (
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
                  isExpanded={expandedTransactionId === transaction.id}
                  onToggle={() => toggleTransaction(transaction.id)}
                  onViewReceipt={handleViewReceipt}
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
        <div className="p-3 sm:p-4 px-4 sm:px-6 pb-4 sm:pb-6 w-full max-w-2xl">
          <Card className="p-3 sm:p-4 bg-blue-50 border shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-base sm:text-lg font-semibold text-blue-800">
                  Total credit:
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-sm sm:text-base text-blue-700 mr-1">
                  OMR
                </span>
                <span className="text-xl sm:text-2xl font-bold text-blue-800">
                  {Math.abs(totalCredit).toFixed(2)}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Receipt dialog */}
      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md md:max-w-lg max-h-[90vh] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="p-6 flex flex-row items-center justify-between border-b shrink-0">
            <DialogTitle className="text-xl font-bold">
              {selectedTransaction?.type === "refund" ? "Refund" : "Sale"}{" "}
              Receipt
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setReceiptOpen(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogHeader>
          <Receipt transaction={selectedTransaction} />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
