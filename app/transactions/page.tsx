"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Layout } from "@/components/layout";
import { useCompanyInfo } from "@/lib/hooks/useCompanyInfo";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  FileText,
  ChevronDown,
  ChevronUp,
  CalendarRange,
  CalendarIcon,
  Printer,
  X,
  Search,
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
  startOfDay,
  endOfDay,
  subMonths,
  subYears,
  isBefore,
  isAfter,
} from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useTransactions, Transaction } from "@/lib/client";
import {
  useTransactionsAPI,
  TransactionAPI,
} from "@/lib/hooks/data/useTransactionsAPI";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ReceiptComponent } from "@/app/pos/components/receipt-component";
import { BillComponent } from "@/app/pos/components/bill-component";
import { useSettingsUsers } from "@/lib/hooks/data/useSettingsUsers";
import { useToast } from "@/components/ui/use-toast";
import { useStaffIDs } from "@/lib/hooks/useStaffIDs";
import { useBranch } from "@/lib/contexts/DataProvider";
import { fetchShops } from "@/lib/services/inventoryService";

interface TransactionDisplay extends Omit<Transaction, "items"> {
  type:
    | "sale"
    | "refund"
    | "credit"
    | "on-hold"
    | "stock-transfer"
    | "on-hold-paid"
    | "credit-paid"
    | "warranty-claim";
  items: string[];
  customerName?: string;
  reference: string;
  storeId: string;
  date?: string;
  notes?: string;
  cashier: string;
  receiptHtml?: string | null;
  batteryBillHtml?: string | null;
  carPlateNumber?: string | null;
  originalReference?: string | null;
  shopName?: string | null;
  mobilePaymentAccount?: string | null;
  mobileNumber?: string | null;
  discountType?: string | null;
  discountValue?: string | null;
  discountAmount?: string | null;
  subtotalBeforeDiscount?: string | null;
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

// Stores will be dynamically loaded from database

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
                      : transaction.type === "expense"
                      ? "text-purple-600"
                      : transaction.type === "credit"
                      ? "text-blue-600"
                      : transaction.type === "on-hold"
                      ? "text-yellow-600"
                      : transaction.type === "stock-transfer"
                      ? "text-blue-600"
                      : transaction.type === "warranty-claim"
                      ? "text-cyan-600"
                      : transaction.type === "on-hold-paid" ||
                        transaction.type === "credit-paid"
                      ? "text-green-600"
                      : "text-green-500"
                  }`}
                >
                  {transaction.type === "refund"
                    ? "Refund"
                    : transaction.type === "warranty-claim"
                    ? "Warranty Claim"
                    : transaction.type === "expense"
                    ? "Expense"
                    : transaction.type === "credit"
                    ? "Credit"
                    : transaction.type === "on-hold"
                    ? "On Hold"
                    : transaction.type === "stock-transfer"
                    ? "Stock Transfer"
                    : transaction.type === "on-hold-paid"
                    ? "On-Hold Paid"
                    : transaction.type === "credit-paid"
                    ? "Credit Paid"
                    : "Sale"}
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
                    : transaction.type === "expense"
                    ? "text-purple-600"
                    : transaction.type === "credit"
                    ? "text-blue-600"
                    : transaction.type === "on-hold"
                    ? "text-yellow-600"
                    : transaction.type === "stock-transfer"
                    ? "text-blue-600"
                    : transaction.type === "warranty-claim"
                    ? "text-cyan-600"
                    : transaction.type === "on-hold-paid" ||
                      transaction.type === "credit-paid"
                    ? "text-green-600"
                    : "text-green-500"
                }`}
              >
                <div className="flex flex-col items-end">
                  <span className="text-sm sm:text-base">OMR</span>
                  <span className="text-lg sm:text-2xl font-bold">
                    {transaction.type === "refund" ? "-" : ""}
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
                {transaction.shopName && (
                  <div>
                    <span className="text-muted-foreground">Shop:</span>
                    <span className="ml-1.5 sm:ml-2.5 font-medium">
                      {transaction.shopName}
                    </span>
                  </div>
                )}
                {transaction.mobilePaymentAccount && (
                  <div>
                    <span className="text-muted-foreground">Account:</span>
                    <span className="ml-1.5 sm:ml-2.5 font-medium">
                      {transaction.mobilePaymentAccount}
                    </span>
                  </div>
                )}
                {transaction.mobileNumber && (
                  <div>
                    <span className="text-muted-foreground">Mobile:</span>
                    <span className="ml-1.5 sm:ml-2.5 font-medium">
                      {transaction.mobileNumber}
                    </span>
                  </div>
                )}
                {(transaction.type === "on-hold" || transaction.carPlateNumber) && transaction.carPlateNumber && (
                  <div>
                    <span className="text-muted-foreground">Car Plate:</span>
                    <span className="ml-1.5 sm:ml-2.5 font-medium">
                      {transaction.carPlateNumber}
                    </span>
                  </div>
                )}
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
                  className="flex items-center gap-1.5 text-black hover:bg-primary/50"
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
            : transaction.type === "expense"
            ? "bg-purple-600"
            : transaction.type === "credit"
            ? "bg-blue-600"
            : transaction.type === "on-hold"
            ? "bg-yellow-600"
            : transaction.type === "stock-transfer"
            ? "bg-blue-600"
            : transaction.type === "warranty-claim"
            ? "bg-cyan-600"
            : transaction.type === "on-hold-paid" ||
              transaction.type === "credit-paid"
            ? "bg-green-600"
            : "bg-green-600"
        }`}
      >
      <div className="flex flex-col text-white">
        <div className="text-lg sm:text-xl font-semibold">
          {!transaction
            ? "No transactions"
            : transaction.type === "refund"
            ? "Refund"
            : transaction.type === "expense"
            ? "Expense"
            : transaction.type === "credit"
            ? "Credit"
            : transaction.type === "on-hold"
            ? "On Hold"
            : transaction.type === "stock-transfer"
            ? "Stock Transfer"
            : transaction.type === "warranty-claim"
            ? "Warranty Claim"
            : transaction.type === "on-hold-paid"
            ? "On-Hold Paid"
            : transaction.type === "credit-paid"
            ? "Credit Paid"
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

// Receipt component for the dialog (fallback only - should rarely be used)
function Receipt({ transaction }: { transaction: TransactionDisplay | null }) {
  if (!transaction) return null;

  // This component is only used as a fallback when receipt generation fails
  // In normal operation, receipts are generated from items_sold in handleViewReceipt
  const receiptItems: Array<{ id: string; name: string; quantity: number; price: string }> = [];
  
  // Try to extract item count from transaction.items if available
  const itemCount = transaction.items && transaction.items.length > 0 
    ? Number(transaction.items[0].split(" ")[0]) || 0 
    : 0;
  
  // Generate placeholder items only if we have an item count
  if (itemCount > 0) {
    for (let i = 0; i < Math.min(itemCount, 10); i++) {
      receiptItems.push({
        id: `item-${i}`,
        name: `Item ${i + 1}`,
        quantity: 1,
        price: "0.000",
      });
    }
  }

  // Use actual subtotal from transaction if available
  const subtotalBeforeDiscount = transaction.subtotalBeforeDiscount
    ? parseFloat(transaction.subtotalBeforeDiscount)
    : transaction.amount || 0;

  // Get discount information
  const discountAmount = transaction.discountAmount
    ? parseFloat(transaction.discountAmount)
    : 0;
  const discountType = transaction.discountType;
  const discountValue = transaction.discountValue
    ? parseFloat(transaction.discountValue)
    : 0;

  // Calculate subtotal after discount
  const subtotalAfterDiscount = subtotalBeforeDiscount - discountAmount;

  // Calculate tax (5%) on subtotal after discount
  const tax = subtotalAfterDiscount * 0.05;

  // Calculate total
  const total = subtotalAfterDiscount + tax;
  const totalItemQuantity = receiptItems.reduce((sum, item) => sum + item.quantity, 0);

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
                    <td>Subtotal</td>
                    <td class="total-amount">OMR ${subtotalBeforeDiscount.toFixed(2)}</td>
                  </tr>
                  ${discountAmount > 0 ? `
                  <tr class="discount-row">
                    <td>Discount${discountType === "percentage" ? ` (${discountValue}%)` : ""}</td>
                    <td class="total-amount">-OMR ${discountAmount.toFixed(2)}</td>
                  </tr>
                  ` : ""}
                  <tr>
                    <td>Total w/o VAT</td>
                    <td class="total-amount">OMR ${subtotalAfterDiscount.toFixed(2)}</td>
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
                <p>Number of Items: ${totalItemQuantity}</p>
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
                WhatsApp ${brand?.whatsapp || ""} for latest offers
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
        {receiptItems.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Receipt details could not be loaded. This is a fallback view.
              Please try viewing the receipt again, or contact support if the issue persists.
            </p>
          </div>
        )}
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
              <span>Subtotal</span>
              <span>OMR {subtotalBeforeDiscount.toFixed(2)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-green-600 font-semibold">
                <span>
                  Discount{discountType === "percentage" ? ` (${discountValue}%)` : ""}
                </span>
                <span>-OMR {discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span>Total w/o VAT</span>
              <span>OMR {subtotalAfterDiscount.toFixed(2)}</span>
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
              <p>Number of Items: {totalItemQuantity}</p>
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
              <p className="font-medium">WhatsApp {brand?.whatsapp || ""} for latest offers</p>
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
  const [timeOfDay, setTimeOfDay] = useState<DayTime>("full");
  const [selectedStore, setSelectedStore] = useState("all-stores");
  const [selectedCashier, setSelectedCashier] = useState("all-cashiers");
  const [stores, setStores] = useState<Array<{ id: string; name: string }>>([
    { id: "all-stores", name: "All Stores" },
  ]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);

  const { branches } = useBranch();
  const { brand } = useCompanyInfo();

  // Fetch stores from database
  useEffect(() => {
    const loadStores = async () => {
      try {
        setIsLoadingStores(true);
        // Use fetchShops instead of fetchBranches to get shops
        const { fetchShops } = await import("@/lib/services/inventoryService");
        const allShops = await fetchShops();
        
        // Transform shops to store format
        const shopStores = allShops.map((shop) => ({
          id: shop.id,
          name: shop.displayName || shop.name,
        }));

        setStores([
          { id: "all-stores", name: "All Stores" },
          ...shopStores,
        ]);
      } catch (error) {
        console.error("Error loading stores:", error);
        // Fallback to default stores with actual shop UUIDs
        setStores([
          { id: "all-stores", name: "All Stores" },
          { id: "9d188fe2-201f-434a-bac3-8ee86240202e", name: "Saniya1" },
          { id: "937689e9-6bb7-4942-a007-d744624f1a4f", name: "Saniya2" },
        ]);
      } finally {
        setIsLoadingStores(false);
      }
    };

    loadStores();
  }, []);

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

  // Get staff data for transaction display
  const { staffMembers } = useStaffIDs();

  // Get cashier options for the select
  const cashierOptions = useCashiersSelect();

  const [hasMounted, setHasMounted] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>(undefined);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
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

  // Calculate date range for API based on selectedPeriod and custom date selection
  const dateRange = useMemo(() => {
    const today = new Date();
    
    // If custom date range is selected, use that
    if (date?.from) {
      const start = startOfDay(date.from);
      const end = date.to ? endOfDay(date.to) : endOfDay(date.from);
      return {
        startDate: format(start, "yyyy-MM-dd'T'HH:mm:ss"),
        endDate: format(end, "yyyy-MM-dd'T'HH:mm:ss"),
      };
    }
    
    // Otherwise, calculate based on selectedPeriod
    switch (selectedPeriod) {
      case "today": {
        const start = startOfDay(today);
        const end = endOfDay(today);
        return {
          startDate: format(start, "yyyy-MM-dd'T'HH:mm:ss"),
          endDate: format(end, "yyyy-MM-dd'T'HH:mm:ss"),
        };
      }
      case "weekly": {
        const start = startOfDay(subDays(today, 6));
        const end = endOfDay(today);
        return {
          startDate: format(start, "yyyy-MM-dd'T'HH:mm:ss"),
          endDate: format(end, "yyyy-MM-dd'T'HH:mm:ss"),
        };
      }
      case "monthly": {
        const start = startOfDay(subDays(today, 30));
        const end = endOfDay(today);
        return {
          startDate: format(start, "yyyy-MM-dd'T'HH:mm:ss"),
          endDate: format(end, "yyyy-MM-dd'T'HH:mm:ss"),
        };
      }
      case "yearly": {
        const start = startOfDay(subDays(today, 364));
        const end = endOfDay(today);
        return {
          startDate: format(start, "yyyy-MM-dd'T'HH:mm:ss"),
          endDate: format(end, "yyyy-MM-dd'T'HH:mm:ss"),
        };
      }
      default:
        return {
          startDate: undefined,
          endDate: undefined,
        };
    }
  }, [selectedPeriod, date]);

  // Use the new API hook with date range
  const {
    transactions: apiTransactions,
    isLoading,
    error,
  } = useTransactionsAPI(selectedStore, dateRange.startDate, dateRange.endDate);

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

  // Convert API transactions to the format expected by the UI
  const getTransactions = useCallback((): TransactionDisplay[] => {
    if (!apiTransactions) return [];

    // Debug: Log first transaction to check customer data
    if (apiTransactions.length > 0) {
      console.log("📊 Frontend - First transaction data:", {
        id: apiTransactions[0].id,
        customer_id: apiTransactions[0].customer_id,
        customers: apiTransactions[0].customers,
      });
    }

    return apiTransactions.map((t) => {
      // Convert cashier_id (UUID) to staff name using joined staff data
      const cashierName = t.cashier_id
        ? t.staff?.name || `Staff ${t.cashier_id.substring(0, 8)}...`
        : "Unknown";

      // Extract customer name from joined data
      const customerName = t.customers?.name || "Anonymous";

      // Extract shop name from joined data
      const shopName = t.shops?.display_name || t.shops?.name || null;

      // Use stored notes if available, otherwise compute from transaction type
      let computedNotes: string | undefined;
      
      if (t.notes) {
        // Use stored notes (preferred for stock transfers and other special cases)
        computedNotes = t.notes;
      } else if (t.type === "REFUND") {
        computedNotes = "Item returned";
      } else if (t.type === "EXPENSE") {
        computedNotes = "Miscellaneous expense";
      } else if (t.type === "ON_HOLD") {
        computedNotes = `Car Plate: ${t.car_plate_number || "N/A"}`;
      } else if (t.type === "ON_HOLD_PAID") {
        computedNotes = `Settled from: ${t.original_reference_number || "N/A"}`;
      } else if (t.type === "CREDIT_PAID") {
        computedNotes = `Settled from: ${t.original_reference_number || "N/A"}`;
      } else if (t.type === "STOCK_TRANSFER") {
        // Fallback for old transactions without notes
        computedNotes = "Stock transfer between locations";
      }

      // Debug: Log if we have a customer_id but no customer name
      if (t.customer_id && !t.customers?.name) {
        console.warn("⚠️ Transaction has customer_id but no customer data:", {
          transaction_id: t.id,
          customer_id: t.customer_id,
          customers_object: t.customers,
        });
      }

      return {
        id: t.id,
        amount: parseFloat(t.total_amount),
        time: new Date(t.created_at).toLocaleString(),
        paymentMethod: t.payment_method || "Cash",
        customer: customerName, // Use customer name from joined data
        items: t.items_sold?.length || 0,
        cashier: cashierName,
        status:
          t.type === "REFUND"
            ? "refunded"
            : t.type === "EXPENSE"
            ? "expensed"
            : t.type === "ON_HOLD"
            ? "on-hold"
            : t.type === "ON_HOLD_PAID"
            ? "completed"
            : t.type === "CREDIT_PAID"
            ? "completed"
            : t.type === "STOCK_TRANSFER"
            ? "transferred"
            : "completed",
        type:
          t.type === "REFUND"
            ? "refund"
            : t.type === "EXPENSE"
            ? "expense"
            : t.type === "CREDIT"
            ? "credit"
            : t.type === "ON_HOLD"
            ? "on-hold"
            : t.type === "ON_HOLD_PAID"
            ? "on-hold-paid"
            : t.type === "CREDIT_PAID"
            ? "credit-paid"
            : t.type === "STOCK_TRANSFER"
            ? "stock-transfer"
            : t.type === "WARRANTY_CLAIM"
            ? "warranty-claim"
            : "sale",
        items: [`${t.items_sold?.length || 0} items`],
        customerName: customerName, // Use customer name from joined data
        reference: t.reference_number,
        storeId: t.shop_id || "unknown",
        date: new Date(t.created_at).toLocaleDateString(),
        notes: computedNotes,
        cashier: cashierName,
        receiptHtml: t.receipt_html,
        batteryBillHtml: t.battery_bill_html,
        carPlateNumber: t.car_plate_number,
        originalReference: t.original_reference_number,
        shopName: shopName,
        mobilePaymentAccount: t.mobile_payment_account,
        mobileNumber: t.mobile_number || t.customers?.phone || null,
        discountType: t.discount_type || null,
        discountValue: t.discount_value || null,
        discountAmount: t.discount_amount || null,
        subtotalBeforeDiscount: t.subtotal_before_discount || null,
      };
    });
  }, [apiTransactions]);

  const displayTransactions = useMemo(() => {
    let transactions = getTransactions();

    // Apply time-of-day filter (only when period is "today")
    if (selectedPeriod === "today" && timeOfDay !== "full") {
      transactions = transactions.filter((transaction) => {
        // Find the original API transaction to get created_at timestamp
        const apiTransaction = apiTransactions.find(
          (t) => t.id === transaction.id
        );
        if (!apiTransaction) return true;
        
        // Get the transaction hour from created_at
        const transactionDate = new Date(apiTransaction.created_at);
        const hour = transactionDate.getHours();
        
        if (timeOfDay === "morning") {
          // Morning: 5:00 AM to 4:59 PM (5:00 to 16:59)
          return hour >= 5 && hour < 17;
        } else if (timeOfDay === "evening") {
          // Evening: 5:00 PM to 11:59 PM (17:00 to 23:59)
          return hour >= 17 && hour < 24;
        }
        return true;
      });
    }

    // Apply cashier filter
    if (selectedCashier && selectedCashier !== "all-cashiers") {
      transactions = transactions.filter(
        (transaction) => transaction.cashier === selectedCashier
      );
    }

    // Apply search filter
    if (!searchQuery.trim()) {
      return transactions;
    }

    const query = searchQuery.toLowerCase().trim();
    return transactions.filter((transaction) => {
      return (
        transaction.reference.toLowerCase().includes(query) ||
        transaction.cashier.toLowerCase().includes(query) ||
        (transaction.customerName &&
          transaction.customerName.toLowerCase().includes(query)) ||
        transaction.paymentMethod.toLowerCase().includes(query) ||
        transaction.type.toLowerCase().includes(query) ||
        transaction.amount.toString().includes(query)
      );
    });
  }, [getTransactions, searchQuery, selectedCashier, selectedPeriod, timeOfDay, apiTransactions]);

  // Calculate total credit (total amount considering sale as positive and refund as negative)
  const totalCredit = useMemo(() => {
    if (!displayTransactions || displayTransactions.length === 0) return 0;

    return displayTransactions.reduce((total, transaction) => {
      // transaction.amount already contains the correct sign from the database
      // Sales are positive, refunds are negative
      return total + transaction.amount;
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

  const [receiptTransactionData, setReceiptTransactionData] = useState<{
    cart: Array<{
      id: number;
      name: string;
      price: number;
      quantity: number;
      details?: string;
      uniqueId: string;
    }>;
    paymentMethod: string;
    cashier?: string;
    discount?: { type: "percentage" | "amount"; value: number } | null;
    paymentRecipient?: string | null;
    receiptNumber: string;
    currentDate: string;
    currentTime: string;
  } | null>(null);
  const [billTransactionData, setBillTransactionData] = useState<{
    cart: Array<{
      id: number;
      name: string;
      price: number;
      quantity: number;
      details?: string;
      uniqueId: string;
    }>;
    billNumber: string;
    currentDate: string;
    currentTime: string;
    customerName?: string;
    cashier?: string;
    appliedDiscount?: { type: "percentage" | "amount"; value: number } | null;
    appliedTradeInAmount?: number;
    isWarrantyClaim: boolean;
  } | null>(null);
  const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false);
  const [isBillPreviewOpen, setIsBillPreviewOpen] = useState(false);

  const handleViewReceipt = async (transaction: TransactionDisplay) => {
    try {
      // Fetch full transaction data to convert to ReceiptComponent format
      const response = await fetch(`/api/transactions/${transaction.id}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch transaction: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.ok || !data.transaction) {
        throw new Error(data.error || "Failed to fetch transaction");
      }

      const tx = data.transaction;

      // Check transaction type
      const isWarrantyClaim = tx.type === "WARRANTY_CLAIM" || transaction.type === "warranty-claim";

      // Fetch product names and category/type for items_sold
      // Extract productIds, handling both string and number formats, and normalize to strings
      const productIds = (tx.items_sold || [])
        .map((item: any) => {
          const id = item.productId || item.product_id;
          // Normalize to string for consistent lookup
          return id ? String(id) : null;
        })
        .filter((id: string | null) => id && id !== "9999" && id !== "null" && id !== "undefined");

      let productNamesMap = new Map<string, string>();
      let productInfoMap = new Map<string, { category: string; type: string }>(); // Store full product info for battery detection
      if (productIds.length > 0) {
        try {
          // Fetch products via API route to avoid client-side Supabase issues
          const productsResponse = await fetch(`/api/products/by-ids?ids=${encodeURIComponent(JSON.stringify(productIds))}`);
          
          if (productsResponse.ok) {
            const productsData = await productsResponse.json();
            const products = productsData.products || [];
            
            products.forEach((p: any) => {
              const normalizedId = String(p.id);
              const brandName = (p.brandName || "").trim();
              let productName = (p.name || "").trim();
              
              // Remove product ID if it's prepended to the name
              if (productName && normalizedId) {
                const nameLower = productName.toLowerCase();
                const idLower = normalizedId.toLowerCase();
                
                if (nameLower.startsWith(idLower)) {
                  const afterId = productName.substring(normalizedId.length).trim();
                  if (afterId.length > 0 && /^[\s\-_:]/.test(afterId)) {
                    productName = afterId.replace(/^[\s\-_:]+/, "").trim();
                  } else if (afterId.length === 0) {
                    productName = `Product ${normalizedId}`;
                  }
                }
              }
              
              // Remove volume descriptions/details in parentheses (e.g., "(1L (closed bottle))")
              // Iteratively remove parentheses content until no parentheses remain
              let previousName = "";
              while (productName !== previousName) {
                previousName = productName;
                // Remove outermost parentheses and their content
                productName = productName.replace(/\s*\([^()]*\)/g, "").trim();
              }
              
              // Remove any existing brand name from the beginning to avoid duplicates
              if (brandName && productName) {
                const brandLower = brandName.toLowerCase();
                const nameLower = productName.toLowerCase();
                
                // Check if product name starts with brand name (case-insensitive)
                if (nameLower.startsWith(brandLower)) {
                  // Remove brand name and any separator that follows
                  const afterBrand = productName.substring(brandName.length).trim();
                  if (afterBrand.length > 0 && /^[\s\-]/.test(afterBrand)) {
                    productName = afterBrand.replace(/^[\s\-]+/, "").trim();
                  } else if (afterBrand.length === 0) {
                    // Product name is just the brand, keep it as is
                    productName = brandName;
                  }
                }
              }
              
              // Format: Brand first, then product name
              let formattedName: string;
              if (brandName && productName) {
                formattedName = `${brandName} ${productName}`;
              } else if (brandName) {
                formattedName = brandName;
              } else if (productName) {
                formattedName = productName;
              } else {
                formattedName = `Product ${normalizedId}`;
              }
              
              productNamesMap.set(normalizedId, formattedName);
              productInfoMap.set(normalizedId, { 
                category: p.category || "", 
                type: p.type || "" 
              });
            });
          } else {
            console.error("Failed to fetch products:", await productsResponse.text());
          }
        } catch (err) {
          console.error("Error fetching product names:", err);
        }
      }

      // Convert items_sold to CartItem format and create productId mapping
      const uniqueIdToProductIdMap = new Map<string, string>();
      const cart = (tx.items_sold || []).map((item: any, index: number) => {
        // Normalize productId to string for consistent lookup
        const productId = String(item.productId || item.product_id || "");
        
        // Get product name from map, with proper fallback
        let productName: string;
        if (productId === "9999" || productId === "") {
          productName = item.volumeDescription || "Labor - Custom Service";
        } else {
          // Ensure we're using normalized productId for lookup
          const normalizedProductId = String(productId).trim();
          productName = productNamesMap.get(normalizedProductId);
          
          if (!productName) {
            // Debug: log when product name is not found
            console.warn(`Product name not found for productId: ${normalizedProductId}`, {
              availableIds: Array.from(productNamesMap.keys()),
              itemData: item
            });
            
            // Fallback: try to extract name from item if available
            productName = item.name || item.productName;
            
            // If we got a name from item, clean it
            if (productName) {
              // Clean the name if it contains the product ID
              if (productName.includes(normalizedProductId)) {
                productName = productName.replace(new RegExp(normalizedProductId, "gi"), "").trim();
                productName = productName.replace(/^[\s\-_:]+/, "").trim();
              }
            }
            
            // Final fallback
            if (!productName || productName === normalizedProductId) {
              productName = `Product ${normalizedProductId}`;
            }
          }
        }

        // Use a separator that won't appear in UUIDs (UUIDs use hyphens, so use double colon)
        const uniqueId = `${productId}::${index}`;
        uniqueIdToProductIdMap.set(uniqueId, productId);

        const rawDetails = item.volumeDescription || item.volume_description;
        const finalDetails = (rawDetails && rawDetails.trim().toLowerCase() !== productName.trim().toLowerCase()) 
          ? rawDetails 
          : undefined;

        return {
          id: index + 1,
          name: productName,
          price: parseFloat(item.sellingPrice || item.selling_price || 0),
          quantity: item.quantity || 1,
          details: finalDetails,
          uniqueId,
        };
      });

      // Helper function to check if cart contains only batteries
      const cartContainsOnlyBatteries = (): boolean => {
        if (cart.length === 0) return false;

        // Filter out discount items
        const actualProductItems = cart.filter(
          (item) => !item.name.toLowerCase().includes("discount on old battery")
        );

        if (actualProductItems.length === 0) return false;

        const isBatteryType = (type?: string): boolean => {
          if (!type) return false;
          const normalizedType = type.toLowerCase().trim();
          return normalizedType === "battery" || normalizedType === "batteries";
        };

        // Check if all items are batteries
        return actualProductItems.every((item) => {
          // Get productId from mapping
          const productId = uniqueIdToProductIdMap.get(item.uniqueId);
          if (!productId) return false;
          
          const productInfo = productInfoMap.get(productId);
          if (!productInfo) return false;
          
          return productInfo.category === "Parts" && isBatteryType(productInfo.type);
        });
      };

      // Format date and time
      const txDate = new Date(tx.created_at);
      const currentDate = txDate.toLocaleDateString("en-GB");
      const currentTime = txDate.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      // Get cashier name
      let cashierName: string | undefined;
      if (tx.cashier_id && staffMembers) {
        const cashier = staffMembers.find((s) => s.id === tx.cashier_id);
        cashierName = cashier?.name;
      }

      // Parse discount
      let discount: { type: "percentage" | "amount"; value: number } | null = null;
      if (tx.discount_type && tx.discount_amount) {
        discount = {
          type: tx.discount_type as "percentage" | "amount",
          value: parseFloat(tx.discount_value || "0"),
        };
      }

      // Determine which component to use
      const isBatteryOnly = cartContainsOnlyBatteries();

      if (isWarrantyClaim || (tx.type === "SALE" && isBatteryOnly)) {
        // Use BillComponent for warranty claims or battery-only sales
        setBillTransactionData({
          cart,
          billNumber: tx.reference_number || transaction.reference,
          currentDate,
          currentTime,
          customerName: tx.customers?.name || tx.car_plate_number || transaction.customerName || "Guest",
          cashier: cashierName,
          appliedDiscount: discount,
          appliedTradeInAmount: undefined, // TODO: Calculate from trade-in transactions if needed
          isWarrantyClaim: isWarrantyClaim,
        });
        setIsBillPreviewOpen(true);
      } else {
        // Use ReceiptComponent for regular sales
        setReceiptTransactionData({
          cart,
          paymentMethod: tx.payment_method || "cash",
          cashier: cashierName,
          discount,
          paymentRecipient: tx.mobile_payment_account || undefined,
          receiptNumber: tx.reference_number || transaction.reference,
          currentDate,
          currentTime,
        });
        setIsReceiptPreviewOpen(true);
      }
    } catch (error) {
      console.error("Error fetching transaction:", error);
      // Fallback to the dialog view
      setSelectedTransaction(transaction);
      setReceiptOpen(true);
    }
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
            {hasMounted && !isLoadingStores ? (
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

        {/* Search Bar */}
        <div className="w-full">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search transactions by reference, cashier, payment method..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 w-full sm:w-[400px] md:w-[500px] lg:w-[600px]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
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

        {/* Search Results Indicator */}
        {searchQuery.trim() && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            <span>
              {displayTransactions.length === 0
                ? "No transactions found"
                : `Found ${displayTransactions.length} transaction${
                    displayTransactions.length === 1 ? "" : "s"
                  }`}{" "}
              matching "{searchQuery}"
            </span>
          </div>
        )}

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
            <h2 className="text-xl font-semibold mb-2">
              {searchQuery.trim()
                ? "No matching transactions"
                : "No transactions"}
            </h2>
            {searchQuery.trim() && (
              <p className="text-muted-foreground mb-4">
                Try adjusting your search terms or clear the search to see all
                transactions.
              </p>
            )}
          </Card>
        )}
      </div>

      {/* Section 2: Fixed total credit card at the bottom, responsive to sidebar */}
      <div
        className="fixed bottom-0 right-0 left-0 md:left-8 lg:left-56 z-50 w-auto flex justify-center"
        style={{ transition: "left 300ms ease-in-out", willChange: "left" }}
      >
        <div className="p-3 sm:p-4 px-4 sm:px-6 pb-4 sm:pb-6 w-full max-w-2xl">
          <Card className="p-3 sm:p-4 bg-orange-50 border shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-base sm:text-lg font-semibold text-orange-800">
                  Total credit:
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-sm sm:text-base text-orange-700 mr-1">
                  OMR
                </span>
                <span className="text-xl sm:text-2xl font-bold text-orange-800">
                  {totalCredit < 0 ? "-" : ""}
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
              {selectedTransaction?.type === "refund"
                ? "Refund"
                : selectedTransaction?.type === "expense"
                ? "Expense"
                : "Sale"}{" "}
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

      {/* Receipt Preview Dialog - Using ReceiptComponent from POS */}
      <Dialog open={isReceiptPreviewOpen} onOpenChange={setIsReceiptPreviewOpen}>
        <DialogContent className="w-[95%] max-w-[520px] p-4 rounded-lg max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Receipt Preview
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2">
            {receiptTransactionData && (
              <ReceiptComponent
                cart={receiptTransactionData.cart}
                paymentMethod={receiptTransactionData.paymentMethod}
                cashier={receiptTransactionData.cashier}
                discount={receiptTransactionData.discount}
                paymentRecipient={receiptTransactionData.paymentRecipient}
                receiptNumber={receiptTransactionData.receiptNumber}
                currentDate={receiptTransactionData.currentDate}
                currentTime={receiptTransactionData.currentTime}
                onClose={() => setIsReceiptPreviewOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bill Preview Dialog - Using BillComponent from POS (for battery sales and warranty claims) */}
      <Dialog open={isBillPreviewOpen} onOpenChange={setIsBillPreviewOpen}>
        <DialogContent className="w-[95%] max-w-[520px] p-4 rounded-lg max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              {billTransactionData?.isWarrantyClaim ? "Warranty Claim Certificate" : "Battery Bill Preview"}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2">
            {billTransactionData && (
              <BillComponent
                cart={billTransactionData.cart}
                billNumber={billTransactionData.billNumber}
                currentDate={billTransactionData.currentDate}
                currentTime={billTransactionData.currentTime}
                customerName={billTransactionData.customerName}
                cashier={billTransactionData.cashier}
                appliedDiscount={billTransactionData.appliedDiscount}
                appliedTradeInAmount={billTransactionData.appliedTradeInAmount}
                hideButton={false}
                isWarrantyClaim={billTransactionData.isWarrantyClaim}
                onClose={() => setIsBillPreviewOpen(false)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}