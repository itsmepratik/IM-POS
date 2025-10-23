"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, ArrowLeft, Check, AlertCircle, Printer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { BillComponent } from "./bill-component";
import { RefundReceipt } from "./refund-receipt";
import { format } from "date-fns";
import { useStaffIDs } from "@/lib/hooks/useStaffIDs";
import { useCompanyInfo } from "@/lib/hooks/useCompanyInfo";
import { useBranch } from "@/lib/contexts/DataProvider";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  details?: string;
  uniqueId: string;
}

interface Receipt {
  receiptNumber: string;
  date: string;
  time: string;
  items: CartItem[];
  total: number;
  paymentMethod: string;
}

interface RefundDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Transaction data will now come from the API

// Helper function to parse items_sold from transaction
// Helper function to fetch product names by IDs from Supabase directly
const fetchProductNames = async (
  productIds: string[]
): Promise<Map<string, string>> => {
  if (productIds.length === 0) return new Map();

  try {
    // Import Supabase client dynamically
    const { createClient } = await import("@/supabase/client");
    const supabase = createClient();

    console.log("🔍 Fetching product names for IDs:", productIds);

    // Query products table directly for these specific IDs (UUIDs)
    const { data: productsData, error } = await supabase
      .from("products")
      .select("id, name, brand")
      .in("id", productIds);

    if (error) {
      console.error("❌ Error fetching product names:", error);
      return new Map();
    }

    console.log("✅ Fetched products:", productsData);

    // Create a map of product ID (UUID string) to product name
    const productNameMap = new Map<string, string>();
    productsData?.forEach((product: any) => {
      const fullName = product.brand
        ? `${product.brand} ${product.name}`
        : product.name;
      productNameMap.set(product.id, fullName);
    });

    console.log("📊 Product name map:", Object.fromEntries(productNameMap));

    return productNameMap;
  } catch (error) {
    console.error("❌ Exception fetching product names:", error);
    return new Map();
  }
};

async function parseTransactionItems(items: any[]): Promise<CartItem[]> {
  console.log("🔄 Parsing transaction items:", JSON.stringify(items, null, 2));

  // Extract product IDs that need name lookup
  const productIds = items
    .map((item: any) => {
      const id = item.productId || item.id || item.product_id;
      console.log(`  📦 Item raw data:`, JSON.stringify(item, null, 2));
      console.log(`  🔑 Extracted ID: "${id}" (type: ${typeof id})`);
      return id;
    })
    .filter((id: any) => {
      if (!id) {
        console.log(`  ❌ Filtered out: ID is null/undefined`);
        return false;
      }
      if (typeof id !== "string") {
        console.log(`  ❌ Filtered out: "${id}" is not a string`);
        return false;
      }
      console.log(`  ✅ Keeping ID: ${id}`);
      return true;
    });

  console.log("🔢 Final extracted product IDs (UUIDs):", productIds);

  // Fetch product names for these IDs
  const productNameMap = await fetchProductNames(productIds);

  return items.map((item: any, index: number) => {
    // Handle both old format (name, price) and new format (productId, sellingPrice)
    const productId = item.productId || item.id || `${index}`;

    // Try to get name from multiple sources, with fallback to fetched product name
    const fetchedName = productNameMap.get(productId);
    const itemName =
      item.name ||
      item.productName ||
      item.product_name ||
      fetchedName || // Use fetched product name with brand
      `Product ${productId}`;

    console.log(
      `  🏷️ Product ${productId}: Fetched="${fetchedName}", Final="${itemName}"`
    );

    const itemPrice = item.price || item.sellingPrice || 0;
    const itemQuantity = item.quantity || 1;
    const itemId = item.id || item.productId || index;

    return {
      id: typeof itemId === "string" ? parseInt(itemId) || index : itemId,
      name: itemName,
      price: parseFloat(itemPrice.toString()),
      quantity: itemQuantity,
      uniqueId: `${itemId}-${Date.now()}-${index}`,
      details: item.details || item.volumeDescription || undefined,
    };
  });
}

// Get cashier data from the hook

export function RefundDialog({ isOpen, onClose }: RefundDialogProps) {
  const { toast } = useToast();
  const { staffMembers } = useStaffIDs();
  const { brand, registered } = useCompanyInfo();
  const { currentBranch } = useBranch();
  const [receiptNumber, setReceiptNumber] = useState("");
  const [currentReceipt, setCurrentReceipt] = useState<Receipt | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [refundComplete, setRefundComplete] = useState(false);
  const [step, setStep] = useState<
    "search" | "select" | "confirm" | "processing" | "complete"
  >("search");
  const [isCashierSelectOpen, setIsCashierSelectOpen] = useState(false);
  const [enteredCashierId, setEnteredCashierId] = useState<string>("");
  const [fetchedCashier, setFetchedCashier] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [cashierIdError, setCashierIdError] = useState<string | null>(null);
  const [selectedCashier, setSelectedCashier] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showRefundReceipt, setShowRefundReceipt] = useState(false);
  const [customerName, setCustomerName] = useState<string>("");
  const [tradeInAmount, setTradeInAmount] = useState<number>(0);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
  } | null>(null);

  // Calculate refund amount
  const refundAmount =
    currentReceipt?.items
      .filter((item) => selectedItems.includes(item.uniqueId))
      .reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

  // Handle looking up a receipt
  const handleLookupReceipt = async () => {
    if (!receiptNumber.trim()) {
      toast({
        title: "Receipt number required",
        description: "Please enter a receipt number to search.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      // Call the transactions API to find the receipt
      const response = await fetch(
        `/api/transactions/fetch?referenceNumber=${encodeURIComponent(
          receiptNumber.trim()
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("API Error Response:", data);
        throw new Error(
          data.details ||
            data.error ||
            `Failed to fetch transaction: ${response.statusText}`
        );
      }

      if (!data.ok || !data.transactions || data.transactions.length === 0) {
        toast({
          title: "Receipt not found",
          description: `No transaction found with reference number: ${receiptNumber}`,
          variant: "destructive",
        });
        return;
      }

      // Convert API response to the format expected by the UI
      const transaction = data.transactions[0];

      // Convert the transaction to Receipt format for the UI
      const parsedItems = await parseTransactionItems(
        transaction.items_sold || []
      );
      const receiptData: Receipt = {
        receiptNumber: transaction.reference_number,
        date: new Date(transaction.created_at).toLocaleDateString("en-GB"),
        time: new Date(transaction.created_at).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        paymentMethod: transaction.payment_method || "Cash",
        total: Math.abs(parseFloat(transaction.total_amount.toString())),
        items: parsedItems,
      };

      // Store customer info if available
      if (transaction.customers) {
        setCurrentCustomer({
          id: transaction.customers.id,
          name: transaction.customers.name,
          email: transaction.customers.email,
          phone: transaction.customers.phone,
        });
      }

      setCurrentReceipt(receiptData);
      setStep("select");
      setSelectedItems([]);

      toast({
        title: "Receipt found",
        description: `Found transaction ${receiptNumber} with ${receiptData.items.length} items.`,
      });
    } catch (error) {
      console.error("Error looking up receipt:", error);
      toast({
        title: "Search failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to search for receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const toggleItemSelection = (uniqueId: string) => {
    setSelectedItems((prev) =>
      prev.includes(uniqueId)
        ? prev.filter((id) => id !== uniqueId)
        : [...prev, uniqueId]
    );
  };

  const handleProceedToConfirm = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to refund.",
        variant: "destructive",
      });
      return;
    }
    setStep("confirm");
  };

  const handleConfirmRefund = () => {
    setIsConfirmDialogOpen(false);
    setIsCashierSelectOpen(true);
  };

  const handleFinalizeRefund = async (cashier?: {
    id: string;
    name: string;
  }) => {
    // Use passed cashier or fallback to selectedCashier
    const activeCashier = cashier || selectedCashier;

    if (!currentReceipt || !activeCashier || isProcessingRefund) return;

    setIsProcessingRefund(true);

    try {
      // Get the selected items for the refund
      const selectedRefundItems = currentReceipt.items
        .filter((item) => selectedItems.includes(item.uniqueId))
        .map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        }));

      const refundAmount = selectedRefundItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // Close cashier dialog first to show main dialog loading state
      setIsCashierSelectOpen(false);
      setEnteredCashierId("");
      setFetchedCashier(null);
      setCashierIdError(null);

      // Set loading state in main dialog
      setStep("processing");

      // Call the refund API
      const response = await fetch("/api/transactions/refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalReferenceNumber: currentReceipt.receiptNumber,
          refundAmount,
          refundItems: selectedRefundItems,
          reason: "Customer refund request",
          cashierId: activeCashier.id,
          shopId: currentBranch?.id || "default-shop",
          locationId: currentBranch?.id || "default-location",
          customerId: currentCustomer?.id,
          carPlateNumber: currentReceipt.receiptNumber.includes("B")
            ? "N/A"
            : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to process refund");
      }

      console.log("✅ Refund processed successfully:", result.refund);

      // Show success message
      toast({
        title: "Refund Processed Successfully",
        description: `Refund of OMR ${refundAmount.toFixed(
          3
        )} has been recorded. Reference: ${result.refund.referenceNumber}`,
      });

      setStep("complete");
      setRefundComplete(true);
    } catch (error) {
      console.error("❌ Refund processing failed:", error);

      // Show error message and go back to confirm step for retry
      toast({
        title: "Refund Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to process refund. Please try again.",
        variant: "destructive",
      });

      // Reset cashier dialog state on error
      setIsCashierSelectOpen(true);
      setEnteredCashierId("");
      setFetchedCashier(null);
      setCashierIdError(null);

      // Go back to confirm step on error
      setStep("confirm");
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const handleCloseDialog = () => {
    if (step === "complete") {
      setReceiptNumber("");
      setCurrentReceipt(null);
      setSelectedItems([]);
      setRefundComplete(false);
      setStep("search");
      setEnteredCashierId("");
      setFetchedCashier(null);
      setCashierIdError(null);
      setSelectedCashier(null);
      setShowRefundReceipt(false);
      onClose();
    } else if (step === "search") {
      onClose();
    } else if (step === "processing") {
      // Don't allow closing during processing
      return;
    } else {
      setReceiptNumber("");
      setCurrentReceipt(null);
      setSelectedItems([]);
      setStep("search");
    }
  };

  // Test handlers removed - now using real API calls

  // When preparing a refund, calculate if there's a trade-in amount
  useEffect(() => {
    if (currentReceipt && selectedItems.length > 0) {
      // Check if there's a trade-in discount in the selected items
      const tradeInItems = currentReceipt.items.filter(
        (item) =>
          selectedItems.includes(item.uniqueId) &&
          item.name.toLowerCase().includes("discount on old battery")
      );

      if (tradeInItems.length > 0) {
        // Calculate total trade-in amount (absolute value of negative prices)
        const calculatedTradeInAmount = tradeInItems.reduce(
          (sum, item) => sum + Math.abs(item.price * item.quantity),
          0
        );
        setTradeInAmount(calculatedTradeInAmount);
      } else {
        setTradeInAmount(0);
      }
    }
  }, [currentReceipt, selectedItems]);

  // Add print function that delegates to the component's print functionality
  const handlePrint = () => {
    // Get the selected items for the refund
    const selectedRefundItems =
      currentReceipt?.items.filter((item) =>
        selectedItems.includes(item.uniqueId)
      ) || [];

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the receipt.");
      return;
    }
    // Build thermal-style HTML to match previewed RefundReceipt
    const displayItems = selectedRefundItems.filter(
      (item) => !item.name.toLowerCase().includes("discount")
    );
    const itemCount = displayItems.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const subtotal = refundAmount / 1.05; // remove 5% VAT if any
    const refundId = `R${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Refund Receipt</title>
        <style>
          @page { margin: 1.5mm 0 10mm 0; }
          body { font-family: sans-serif !important; padding: 0; margin: 0; width: 80mm; font-size: 12px; }
          * { font-family: sans-serif !important; }
          .receipt-container { width: 76mm; padding: 1.5mm 1mm 10mm 1mm; margin: 0 auto; }
          .receipt-header { text-align: center; margin-bottom: 10px; }
          .receipt-header h1 { font-size: 16px; margin: 0; font-weight: bold; }
          .receipt-header p { font-size: 12px; margin: 2px 0; color: #555; }
          .receipt-divider { border-top: 1px dashed #000; margin: 5px 0; }
          .receipt-info { font-size: 12px; margin: 5px 0; }
          .receipt-info p { margin: 2px 0; display: flex; justify-content: space-between; align-items: center; }
          .receipt-title { text-align: center; font-weight: bold; margin: 10px 0; font-size: 13px; color: #D9534F; text-transform: uppercase; }
          .receipt-table { width: 100%; border-collapse: collapse; margin: 10px 0; table-layout: fixed; }
          .receipt-table th { font-size: 12px; padding: 2px 0; }
          .receipt-table td { font-size: 12px; padding: 2px 0; }
          .receipt-table .sno { width: 20px; }
          .receipt-table .description { width: auto; }
          .receipt-table .price { width: 44px; text-align: right; padding-right: 3px; white-space: nowrap; word-break: keep-all; font-variant-numeric: tabular-nums; }
          .receipt-table .qty { width: 14px; text-align: center; padding-left: 8px; padding-right: 0px; white-space: nowrap; word-break: keep-all; font-variant-numeric: tabular-nums; }
          .receipt-table .amount { width: 64px; text-align: right; padding-left: 21px; white-space: nowrap; word-break: keep-all; font-variant-numeric: tabular-nums; }
          .receipt-table .row-top td { padding-bottom: 0; }
          .receipt-table .row-bottom td { padding-top: 0; }
          .receipt-summary { margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
          .receipt-summary table { width: 100%; }
          .receipt-summary td { font-size: 12px; padding: 2px 0; }
          .receipt-summary .total-label { font-weight: bold; }
          .receipt-summary .total-amount { text-align: right; font-weight: bold; }
          .receipt-footer { margin-top: 10px; text-align: center; font-size: 12px; border-top: 1px dashed #000; padding-top: 5px; }
          .receipt-footer p { margin: 3px 0; }
          .arabic { font-size: 11px; direction: rtl; margin: 2px 0; }
          @media print { body { width: 80mm; margin: 0; padding: 0; } @page { margin: 1.5mm 0 10mm 0; size: 80mm auto; } }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="receipt-header">
            <h1>${brand.name || ""}</h1>
            ${
              Array.isArray(brand.addressLines) && brand.addressLines.length
                ? `<p>${brand.addressLines.filter(Boolean).join(", ")}</p>`
                : ""
            }
            ${
              Array.isArray(brand.phones) && brand.phones.length
                ? `<p>Ph: ${brand.phones.filter(Boolean).join(" | ")}</p>`
                : ""
            }
          </div>

          <div class="receipt-divider"></div>

          <div class="receipt-title">REFUND RECEIPT</div>

          <div class="receipt-info">
            <p><span>Refund: ${refundId}</span></p>
            <p><span>Original Invoice: ${
              currentReceipt?.receiptNumber || ""
            }</span></p>
            <p><span>Date: ${format(
              new Date(),
              "dd/MM/yyyy"
            )}</span><span>Time: ${format(new Date(), "HH:mm:ss")}</span></p>
            ${
              customerName
                ? `<p style="justify-content:flex-start;">Customer: ${customerName}</p>`
                : ""
            }
          </div>

          <div class="receipt-divider"></div>

          <table class="receipt-table">
            <thead>
              <tr>
                <th class="sno">#</th>
                <th class="description">Description</th>
                <th class="price">Price</th>
                <th class="qty">Qty</th>
                <th class="amount">Amt</th>
              </tr>
            </thead>
            <tbody>
              ${displayItems
                .map(
                  (item, index) => `
                <tr class="row-top">
                  <td class="sno">${index + 1}</td>
                  <td class="description" colspan="4">${item.name}${
                    item.details ? ` (${item.details})` : ""
                  }</td>
                  <td class="price" style="display:none;"></td>
                  <td class="qty" style="display:none;"></td>
                  <td class="amount" style="display:none;"></td>
                </tr>
                <tr class="row-bottom">
                  <td class="sno"></td>
                  <td class="description"></td>
                  <td class="price">${item.price.toFixed(3)}</td>
                  <td class="qty">(x${item.quantity})</td>
                  <td class="amount">${(item.price * item.quantity).toFixed(
                    3
                  )}</td>
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
                <td class="total-amount">OMR ${subtotal.toFixed(3)}</td>
              </tr>
              <tr>
                <td class="total-label">TOTAL REFUND</td>
                <td class="total-amount" style="color:#D9534F;">OMR ${refundAmount.toFixed(
                  3
                )}</td>
              </tr>
            </table>
          </div>

          <div class="receipt-footer">
            ${
              selectedCashier?.name || fetchedCashier?.name
                ? `<p>Processed by: ${
                    selectedCashier?.name || fetchedCashier?.name
                  }</p>`
                : ""
            }
            <p>Number of Items: ${itemCount}</p>
            <p>Thank you for shopping with us.</p>
            <p class="arabic">شكراً للتسوق معنا</p>
            ${
              brand.whatsapp
                ? `<p style="font-weight:bold; margin-top:6px;">WhatsApp ${brand.whatsapp}</p>`
                : ""
            }
          </div>
        </div>
      </body>
      </html>
    `;

    const htmlWithAutoPrint = htmlContent.replace(
      /<\/body>/,
      `<script>
         window.onload = function() {
           setTimeout(function(){
             try { window.focus(); window.print(); } catch (e) { }
           }, 300);
         };
       <\/script></body>`
    );

    printWindow.document.open();
    printWindow.document.write(htmlWithAutoPrint);
    printWindow.document.close();
  };

  // Scroll to top when showing the receipt
  useEffect(() => {
    if (showRefundReceipt) {
      // Use setTimeout to ensure the DOM has updated
      setTimeout(() => {
        const dialogContent = document.querySelector(".DialogContent");
        const contentContainer = document.querySelector(
          ".flex-1.overflow-y-auto"
        );
        if (dialogContent) {
          dialogContent.scrollTop = 0;
        }
        if (contentContainer) {
          contentContainer.scrollTop = 0;
        }
      }, 50);
    }
  }, [showRefundReceipt]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95%] max-w-[600px] h-auto max-h-[80vh] rounded-lg flex flex-col print:p-0 print:border-0 print:max-h-none print:h-auto print:overflow-visible p-3 sm:p-4">
          <DialogHeader className="px-3 pt-2 pb-2 flex-shrink-0 z-10 bg-background sticky top-0">
            <DialogTitle className="text-xl flex items-center gap-2">
              {step !== "search" && step !== "processing" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 mr-1"
                  onClick={() => setStep("search")}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              {step === "search" && "Refund Process"}
              {step === "select" && "Select Items to Refund"}
              {step === "confirm" && "Confirm Refund"}
              {step === "processing" && "Processing Refund"}
              {step === "complete" && "Refund Complete"}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto print:overflow-visible max-h-[calc(80vh-130px)] pt-2">
            <div className="px-3 pb-3 space-y-3">
              <AnimatePresence mode="wait">
                {step === "search" && (
                  <motion.div
                    key="search"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="text-sm text-muted-foreground">
                      Enter the receipt number to process a refund. You can find
                      this on the customer's receipt.
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Receipt Number (e.g., A1234)"
                          className="pl-10"
                          value={receiptNumber}
                          onChange={(e) => setReceiptNumber(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && receiptNumber) {
                              handleLookupReceipt();
                            }
                          }}
                        />
                      </div>
                      <Button
                        onClick={handleLookupReceipt}
                        disabled={!receiptNumber || isSearching}
                      >
                        {isSearching ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                            />
                            Searching...
                          </>
                        ) : (
                          "Search"
                        )}
                      </Button>
                    </div>

                    {isSearching && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="h-6 w-6 border-3 border-blue-500 border-t-transparent rounded-full flex-shrink-0"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900">
                            Searching for receipt...
                          </p>
                          <p className="text-xs text-blue-700">
                            Please wait while we retrieve the transaction
                            details
                          </p>
                          <div className="mt-2 w-full bg-blue-100 rounded-full h-1.5">
                            <motion.div
                              className="bg-blue-500 h-1.5 rounded-full"
                              initial={{ width: "0%" }}
                              animate={{ width: "100%" }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div className="rounded-lg border p-3 bg-muted/50">
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        Enter Transaction Reference Number
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>Example: A1234, B5678, etc.</p>
                        <p>
                          Search will find transactions by reference number.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
                {step === "select" && currentReceipt && (
                  <motion.div
                    key="select"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="rounded-lg border p-4 mb-4">
                      <div className="text-sm font-medium mb-2">
                        Receipt Information
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Receipt #:
                          </span>{" "}
                          {currentReceipt.receiptNumber}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date:</span>{" "}
                          {currentReceipt.date}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Time:</span>{" "}
                          {currentReceipt.time}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Payment:
                          </span>{" "}
                          {currentReceipt.paymentMethod}
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Total:</span>{" "}
                          OMR {currentReceipt.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium mb-2">
                      Select Items to Refund
                    </div>
                    <div className="space-y-2">
                      {currentReceipt.items.map((item) => (
                        <Card key={item.uniqueId} className="overflow-hidden">
                          <CardContent className="p-0">
                            <div
                              className={cn(
                                "p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors",
                                selectedItems.includes(item.uniqueId) &&
                                  "bg-muted"
                              )}
                              onClick={() => toggleItemSelection(item.uniqueId)}
                            >
                              <Checkbox
                                checked={selectedItems.includes(item.uniqueId)}
                                onCheckedChange={() =>
                                  toggleItemSelection(item.uniqueId)
                                }
                                className="h-5 w-5"
                              />
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="font-medium">
                                      {item.name}
                                    </div>
                                    {item.details && (
                                      <div className="text-xs text-muted-foreground">
                                        {item.details}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium">
                                      OMR{" "}
                                      {(item.price * item.quantity).toFixed(2)}
                                    </div>
                                    {item.quantity > 1 && (
                                      <div className="text-xs text-muted-foreground">
                                        {item.quantity} × OMR{" "}
                                        {item.price.toFixed(2)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {selectedItems.length > 0 && (
                      <div className="rounded-lg border p-4 bg-muted/50 mt-4">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Total Refund Amount</span>
                          <span>OMR {refundAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
                {step === "confirm" && currentReceipt && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="rounded-lg border p-4 mb-4">
                      <div className="text-sm font-medium mb-2">
                        Refund Summary
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Receipt #:
                          </span>{" "}
                          {currentReceipt.receiptNumber}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date:</span>{" "}
                          {currentReceipt.date}
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">
                            Items to Refund:
                          </span>{" "}
                          {selectedItems.length}
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">
                            Refund Amount:
                          </span>{" "}
                          OMR {refundAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium mb-2">
                      Items to Refund
                    </div>
                    <div className="space-y-2">
                      {currentReceipt.items
                        .filter((item) => selectedItems.includes(item.uniqueId))
                        .map((item) => (
                          <Card key={item.uniqueId} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  {item.details && (
                                    <div className="text-xs text-muted-foreground">
                                      {item.details}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">
                                    OMR{" "}
                                    {(item.price * item.quantity).toFixed(2)}
                                  </div>
                                  {item.quantity > 1 && (
                                    <div className="text-xs text-muted-foreground">
                                      {item.quantity} × OMR{" "}
                                      {item.price.toFixed(2)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                    <div className="rounded-lg border p-4 bg-muted/50 mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <div className="text-sm font-medium">Refund Policy</div>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>
                          Refunds are subject to store policy. Items must be in
                          resellable condition. Refunds will be issued to the
                          original payment method when possible.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
                {step === "processing" && (
                  <motion.div
                    key="processing"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center justify-center py-12 space-y-6"
                  >
                    <div className="relative">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="h-16 w-16 border-4 border-primary border-t-transparent rounded-full"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="absolute inset-0 h-16 w-16 border-4 border-primary/20 rounded-full"
                      />
                    </div>

                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-semibold text-primary">
                        Processing Refund
                      </h3>
                      <p className="text-muted-foreground">
                        Please wait while we process your refund...
                      </p>
                      <div className="w-full max-w-xs mx-auto">
                        <div className="w-full bg-muted rounded-full h-2">
                          <motion.div
                            className="bg-primary h-2 rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4 w-full max-w-sm">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Receipt #:
                          </span>
                          <span className="font-medium">
                            {currentReceipt?.receiptNumber}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Refund Amount:
                          </span>
                          <span className="font-medium">
                            OMR {refundAmount.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Authorized by:
                          </span>
                          <span className="font-medium">
                            {selectedCashier?.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                {step === "complete" && (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {!showRefundReceipt ? (
                      <div className="flex flex-col items-center justify-center py-6">
                        <div className="rounded-full bg-green-100 p-3 mb-4">
                          <Check className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                          Refund Complete
                        </h3>
                        <p className="text-muted-foreground text-center mb-4">
                          The refund of OMR {refundAmount.toFixed(2)} has been
                          processed successfully.
                        </p>
                        <div className="border rounded-lg p-4 w-full">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Receipt #:
                              </span>{" "}
                              {currentReceipt?.receiptNumber}
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Date:
                              </span>{" "}
                              {new Date().toLocaleDateString()}
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Time:
                              </span>{" "}
                              {new Date().toLocaleTimeString()}
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Cashier:
                              </span>{" "}
                              {typeof selectedCashier === "string"
                                ? selectedCashier
                                : selectedCashier?.name || "Unknown"}
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">
                                Refund Amount:
                              </span>{" "}
                              <span className="font-medium">
                                OMR {refundAmount.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-4 text-center">
                          Bill Preview
                        </h3>
                        <div className="overflow-hidden rounded-lg">
                          {/* Always show thermal receipt for refunds regardless of item type */}
                          <ScrollArea className="h-[60vh]">
                            <RefundReceipt
                              items={
                                currentReceipt?.items.filter((item) =>
                                  selectedItems.includes(item.uniqueId)
                                ) || []
                              }
                              receiptNumber={`R${
                                currentReceipt?.receiptNumber || ""
                              }`}
                              originalReceiptNumber={
                                currentReceipt?.receiptNumber || ""
                              }
                              currentDate={format(new Date(), "dd/MM/yyyy")}
                              currentTime={format(new Date(), "HH:mm:ss")}
                              customerName={customerName || ""}
                              cashier={selectedCashier?.name || ""}
                              refundAmount={refundAmount}
                              hidePrintButton={true}
                            />
                          </ScrollArea>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <DialogFooter className="px-3 py-3 border-t print:hidden flex-shrink-0 flex-wrap gap-y-2">
            {step === "search" && (
              <Button variant="ghost" onClick={handleCloseDialog}>
                Cancel
              </Button>
            )}
            {step === "select" && (
              <div className="flex gap-2 sm:gap-3 w-full justify-end flex-wrap">
                <Button variant="ghost" onClick={() => setStep("search")}>
                  Back
                </Button>
                <Button onClick={handleProceedToConfirm}>
                  Continue to Confirm
                </Button>
              </div>
            )}
            {step === "confirm" && (
              <div className="flex gap-2 sm:gap-3 w-full justify-end flex-wrap">
                <Button variant="ghost" onClick={() => setStep("select")}>
                  Back
                </Button>
                <Button
                  onClick={() => setIsConfirmDialogOpen(true)}
                  variant="destructive"
                >
                  Process Refund
                </Button>
              </div>
            )}
            {step === "processing" && (
              <div className="flex justify-center w-full">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full"
                  />
                  Processing refund...
                </div>
              </div>
            )}
            {step === "complete" && (
              <div className="flex gap-2 sm:gap-3 w-full justify-end flex-wrap">
                {!showRefundReceipt && (
                  <Button
                    onClick={() => setShowRefundReceipt(true)}
                    className="gap-2"
                  >
                    <Printer className="h-4 w-4" /> View Refund Bill
                  </Button>
                )}
                {showRefundReceipt && (
                  <div className="flex gap-2 sm:gap-3 w-full justify-end flex-wrap">
                    <Button
                      variant="outline"
                      onClick={() => setShowRefundReceipt(false)}
                      className="gap-2"
                    >
                      Back
                    </Button>
                    <Button onClick={handlePrint} className="gap-2">
                      <Printer className="h-4 w-4" /> Print Refund Bill
                    </Button>
                    <Button onClick={handleCloseDialog}>Done</Button>
                  </div>
                )}
                {!showRefundReceipt && (
                  <Button onClick={handleCloseDialog}>Done</Button>
                )}
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
      >
        <AlertDialogContent className="p-4 sm:p-5">
          <AlertDialogHeader className="space-y-1">
            <AlertDialogTitle>Confirm Refund</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to process this refund for OMR{" "}
              {refundAmount.toFixed(2)}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-wrap gap-y-2">
            <div className="flex gap-2 sm:gap-3 w-full justify-end flex-wrap">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmRefund}>
                Confirm
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cashier Selection Dialog */}
      <AlertDialog
        open={isCashierSelectOpen}
        onOpenChange={(open) => {
          if (!open && !isProcessingRefund) {
            setIsCashierSelectOpen(false);
            setEnteredCashierId("");
            setFetchedCashier(null);
            setCashierIdError(null);
          }
        }}
      >
        <AlertDialogContent className="p-4 sm:p-5">
          <AlertDialogHeader className="space-y-1">
            <AlertDialogTitle>Enter Cashier ID</AlertDialogTitle>
            <AlertDialogDescription>
              Please enter your cashier ID to authorize this refund.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Processing overlay */}
          {isProcessingRefund && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-50">
              <div className="bg-background border rounded-lg p-6 flex flex-col items-center gap-3 shadow-lg">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full"
                />
                <div className="text-center">
                  <p className="font-medium text-primary">Processing Refund</p>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we process your refund...
                  </p>
                </div>
              </div>
            </div>
          )}

          <div
            className={cn(
              "flex flex-col items-center py-2",
              isProcessingRefund && "opacity-50 pointer-events-none"
            )}
          >
            <Input
              className="text-center text-2xl w-32 mb-2"
              value={enteredCashierId}
              onChange={(e) => {
                setEnteredCashierId(e.target.value.replace(/\D/g, ""));
                setCashierIdError(null);
              }}
              maxLength={6}
              inputMode="numeric"
              type="tel"
              pattern="[0-9]*"
              autoFocus={!isProcessingRefund}
              placeholder="ID"
              disabled={isProcessingRefund}
            />
            {cashierIdError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-destructive text-sm mt-2"
              >
                {cashierIdError}
              </motion.div>
            )}
            {fetchedCashier && !isProcessingRefund && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-green-600 text-sm mt-2 flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Authorized: {fetchedCashier.name}
              </motion.div>
            )}
            {isProcessingRefund && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-blue-600 text-sm mt-2 flex items-center gap-2"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"
                />
                Processing refund...
              </motion.div>
            )}
          </div>
          <AlertDialogFooter className="flex-wrap gap-y-2">
            <div className="flex gap-2 sm:gap-3 w-full justify-end flex-wrap">
              <AlertDialogCancel disabled={isProcessingRefund}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  const found = staffMembers.find(
                    (c) => c.id === enteredCashierId
                  );
                  if (found) {
                    setFetchedCashier(found);
                    setSelectedCashier(found);
                    setCashierIdError(null);
                    // Pass the cashier directly to avoid async state issues
                    handleFinalizeRefund(found);
                  } else {
                    setCashierIdError("Invalid cashier ID. Please try again.");
                  }
                }}
                disabled={isProcessingRefund || !enteredCashierId.trim()}
              >
                {isProcessingRefund ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Processing...
                  </>
                ) : (
                  "Authorize"
                )}
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function WarrantyDialog({ isOpen, onClose }: RefundDialogProps) {
  const { toast } = useToast();
  const { staffMembers } = useStaffIDs();
  const { brand, registered } = useCompanyInfo();
  const [receiptNumber, setReceiptNumber] = useState("");
  const [currentReceipt, setCurrentReceipt] = useState<Receipt | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [claimComplete, setClaimComplete] = useState(false);
  const [isProcessingRefund, setIsProcessingRefund] = useState(false);
  const [step, setStep] = useState<
    "search" | "select" | "confirm" | "processing" | "complete"
  >("search");
  const [isCashierSelectOpen, setIsCashierSelectOpen] = useState(false);
  const [enteredCashierId, setEnteredCashierId] = useState<string>("");
  const [fetchedCashier, setFetchedCashier] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [cashierIdError, setCashierIdError] = useState<string | null>(null);
  const [selectedCashier, setSelectedCashier] = useState<null | {
    id: string;
    name: string;
  }>(null);
  const [showRefundReceipt, setShowRefundReceipt] = useState(false);
  const [customerName, setCustomerName] = useState<string>("");
  const [tradeInAmount, setTradeInAmount] = useState<number>(0);
  const [isSearching, setIsSearching] = useState(false);

  // Calculate claim amount (same as refund for now)
  const claimAmount =
    currentReceipt?.items
      .filter((item) => selectedItems.includes(item.uniqueId))
      .reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

  // Handle looking up a receipt
  const handleLookupReceipt = async () => {
    if (!receiptNumber.trim()) {
      toast({
        title: "Receipt number required",
        description: "Please enter a receipt number to search.",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    try {
      // Call the transactions API to find the receipt
      const response = await fetch(
        `/api/transactions/fetch?referenceNumber=${encodeURIComponent(
          receiptNumber.trim()
        )}`
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("API Error Response:", data);
        throw new Error(
          data.details ||
            data.error ||
            `Failed to fetch transaction: ${response.statusText}`
        );
      }

      if (!data.ok || !data.transactions || data.transactions.length === 0) {
        toast({
          title: "Receipt not found",
          description: `No transaction found with reference number: ${receiptNumber}`,
          variant: "destructive",
        });
        return;
      }

      // Convert API response to the format expected by the UI
      const transaction = data.transactions[0];

      // Convert the transaction to Receipt format for the UI
      const parsedItems = await parseTransactionItems(
        transaction.items_sold || []
      );
      const receiptData: Receipt = {
        receiptNumber: transaction.reference_number,
        date: new Date(transaction.created_at).toLocaleDateString("en-GB"),
        time: new Date(transaction.created_at).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        paymentMethod: transaction.payment_method || "Cash",
        total: Math.abs(parseFloat(transaction.total_amount.toString())),
        items: parsedItems,
      };

      // Store customer info if available
      if (transaction.customers) {
        setCurrentCustomer({
          id: transaction.customers.id,
          name: transaction.customers.name,
          email: transaction.customers.email,
          phone: transaction.customers.phone,
        });
      }

      setCurrentReceipt(receiptData);
      setStep("select");
      setSelectedItems([]);

      toast({
        title: "Receipt found",
        description: `Found transaction ${receiptNumber} with ${receiptData.items.length} items.`,
      });
    } catch (error) {
      console.error("Error looking up receipt:", error);
      toast({
        title: "Search failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to search for receipt. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const toggleItemSelection = (uniqueId: string) => {
    setSelectedItems((prev) =>
      prev.includes(uniqueId)
        ? prev.filter((id) => id !== uniqueId)
        : [...prev, uniqueId]
    );
  };

  const handleProceedToConfirm = () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select at least one item to claim.",
        variant: "destructive",
      });
      return;
    }
    setStep("confirm");
  };

  const handleConfirmClaim = () => {
    setIsConfirmDialogOpen(false);
    setIsCashierSelectOpen(true);
  };

  const handleFinalizeClaim = async (cashier?: {
    id: string;
    name: string;
  }) => {
    // Use passed cashier or fallback to selectedCashier
    const activeCashier = cashier || selectedCashier;

    if (!currentReceipt || !activeCashier || isProcessingRefund) return;

    setIsProcessingRefund(true);

    try {
      // Close cashier dialog first to show main dialog loading state
      setIsCashierSelectOpen(false);
      setEnteredCashierId("");
      setFetchedCashier(null);
      setCashierIdError(null);

      // Set loading state in main dialog
      setStep("processing");

      // Simulate processing time for warranty claim
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setStep("complete");
      setClaimComplete(true);
    } catch (error) {
      console.error("Warranty claim processing error:", error);
      toast({
        title: "Claim Failed",
        description: "Failed to process warranty claim. Please try again.",
        variant: "destructive",
        duration: 5000,
      });

      // Reset cashier dialog state on error
      setIsCashierSelectOpen(true);
      setEnteredCashierId("");
      setFetchedCashier(null);
      setCashierIdError(null);

      setStep("confirm");
    } finally {
      setIsProcessingRefund(false);
    }
  };

  const handleCloseDialog = () => {
    if (step === "complete") {
      setReceiptNumber("");
      setCurrentReceipt(null);
      setSelectedItems([]);
      setClaimComplete(false);
      setStep("search");
      setEnteredCashierId("");
      setFetchedCashier(null);
      setCashierIdError(null);
      setSelectedCashier(null);
      setShowRefundReceipt(false);
      onClose();
    } else if (step === "search") {
      onClose();
    } else {
      setReceiptNumber("");
      setCurrentReceipt(null);
      setSelectedItems([]);
      setStep("search");
    }
  };

  // Add print function that delegates to the component's print functionality
  const handlePrint = () => {
    // Get selected items for the warranty claim
    const selectedClaimItems =
      currentReceipt?.items.filter((item) =>
        selectedItems.includes(item.uniqueId)
      ) || [];

    // Generate a random bill number with W prefix
    const warrantyBillNumber = `W${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`;

    // Open a new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the warranty claim receipt.");
      return;
    }

    // Use the A5 format HTML for battery warranty claims
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Warranty Claim Certificate</title>
        <style>
          @page {
            size: A5;
            margin: 0;
          }
          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: sans-serif;
            font-size: 10pt;
            line-height: 1.3;
            width: 100%;
            color: #000;
          }
          .bill-container {
            width: calc(100% - 4mm); 
            height: 100%;
            padding: 2mm;
            margin: 0 auto; 
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
          }
          .header-table td {
            vertical-align: top;
            padding: 0;
          }
          .left-header {
            width: 30%;
            text-align: left;
            font-size: 8px !important;
            -webkit-text-size-adjust: none;
            transform-origin: left top;
            transform: scale(0.8);
          }
          .center-header {
            width: 40%;
            text-align: center;
          }
          .right-header {
            width: 30%;
            text-align: right;
            font-size: 8px !important;
            -webkit-text-size-adjust: none;
            transform-origin: right top;
            transform: scale(0.8);
            direction: rtl;
          }
          .company-name {
            color: #0000CC;
            font-size: 9pt;
            font-weight: bold;
            text-transform: uppercase;
            white-space: nowrap;
          }
          .company-arabic-name {
            color: #0000CC;
            font-size: 8pt;
            font-weight: bold;
            margin-top: 2px;
          }
          .cr-number {
            font-weight: normal;
          }
          .service-description {
            text-align: center;
            font-weight: bold;
            font-size: 9px;
            margin: 15px 0;
            border-top: 1px solid #ccc;
            border-bottom: 1px solid #ccc;
            padding: 6px 0;
          }
          .service-description-arabic {
            font-size: 8px;
            margin-top: 2px;
          }
          .warranty-claim-text {
            text-align: center;
            font-weight: bold;
            font-size: 9px;
            margin-top: 5px;
            color: #D9534F;
            display: block;
          }
          .bill-info-table {
            width: 100%;
            margin-bottom: 12px;
          }
          .bill-info-table td {
            vertical-align: top;
            padding: 0;
          }
          .bill-number {
            text-align: left;
            font-size: 9px;
          }
          .print-date {
            text-align: right;
            font-size: 9px;
          }
          .customer-info {
            text-align: left;
            font-size: 9px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          .car-plate {
            text-align: right;
            font-size: 9px;
            font-weight: bold;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 9px;
          }
          .items-table th, .items-table td {
            padding: 6px 5px;
            text-align: left;
          }
          .items-table th {
            font-weight: bold;
          }
          .items-table td, .items-table th {
            border-bottom: 1px solid #ddd;
          }
          .items-table th:nth-child(3), .items-table td:nth-child(3),
          .items-table th:nth-child(4), .items-table td:nth-child(4),
          .items-table th:nth-child(5), .items-table td:nth-child(5) {
            text-align: right;
          }
          .items-table tr:last-child td {
            border-bottom: none;
          }
          .summary-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
          }
          .summary-table td {
            padding: 3px 0;
          }
          .summary-table .label {
            text-align: left;
          }
          .summary-table .amount {
            text-align: right;
            font-weight: bold;
          }
          .summary-divider {
            border-top: 1px solid #000;
            margin: 6px 0;
          }
          .trade-in {
            color: #D9534F;
          }
          .total-row {
            font-weight: bold;
            font-size: 10px;
            color: #0000CC;
          }
          .cashier-section {
            display: flex;
            justify-content: space-between;
            margin-top: 5px;
            margin-bottom: 0;
            font-size: 8px !important;
            -webkit-text-size-adjust: none;
          }
          .cashier-info {
            text-align: left;
            transform-origin: left center;
          }
          .signature-line {
            text-align: right;
          }
          .signature-line .line {
            display: inline-block;
            border-top: 1px solid #777;
            width: 150px;
            text-align: center;
            padding-top: 3px;
            font-size: 8px !important;
            -webkit-text-size-adjust: none;
            transform-origin: right center;
            transform: scale(0.8);
            color: #777;
          }
          .footer {
            text-align: center;
            font-size: 8px !important;
            -webkit-text-size-adjust: none;
            transform-origin: center top;
            transform: scale(0.8);
            color: #333;
            width: 100%;
            padding-top: 0;
            margin-top: 0;
            margin-bottom: 0;
            position: relative;
            left: 0;
            right: 0;
          }
          .footer-contact {
            font-weight: bold;
            margin-bottom: 1px;
          }
          .footer-phone-numbers {
            margin-bottom: 1px;
          }
          .footer-thank-you {
            font-style: italic;
            font-size: 7px !important;
            -webkit-text-size-adjust: none;
            line-height: 1.2;
          }
        </style>
      </head>
      <body>
        <div class="bill-container">
          <!-- Header with three columns -->
          <table class="header-table">
            <tr>
              <td class="left-header">
                ${
                  registered.crNumber
                    ? `<div>C.R. No.: ${registered.crNumber}</div>`
                    : ""
                }
                ${
                  Array.isArray(registered.addressLines) &&
                  registered.addressLines[0]
                    ? `<div>${registered.addressLines[0]}</div>`
                    : ""
                }
                ${
                  Array.isArray(registered.addressLines) &&
                  registered.addressLines[1]
                    ? `<div>${registered.addressLines[1]}</div>`
                    : ""
                }
                ${
                  Array.isArray(registered.addressLines) &&
                  registered.addressLines[2]
                    ? `<div>${registered.addressLines[2]}</div>`
                    : ""
                }
              </td>
              <td class="center-header">
                <div class="company-name">${registered.name || ""}</div>
                ${
                  registered.arabicName
                    ? `<div class="company-arabic-name">${registered.arabicName}</div>`
                    : ""
                }
              </td>
              <td class="right-header">
                ${
                  registered.crNumber
                    ? `<div class="cr-number">السجل التجاري: ${registered.crNumber}</div>`
                    : ""
                }
                ${
                  Array.isArray(registered.addressLines) &&
                  registered.addressLines[0]
                    ? `<div>ولاية ${registered.addressLines[0]}</div>`
                    : ""
                }
                ${
                  Array.isArray(registered.addressLines) &&
                  registered.addressLines[1]
                    ? `<div>${registered.addressLines[1]}</div>`
                    : ""
                }
                ${
                  Array.isArray(registered.addressLines) &&
                  registered.addressLines[2]
                    ? `<div>${registered.addressLines[2]}</div>`
                    : ""
                }
              </td>
            </tr>
          </table>

          <!-- Service description -->
          <div class="service-description">
            TYRE REPAIRING & LUBRICANT CHANGING OF VEHICLES
                          <div class="service-description-arabic">إصلاح الإطارات وتغيير مواد التشحيم للمركبات</div>
          </div>
          
          <!-- Warranty claim text -->
          <div style="text-align: center; font-weight: bold; font-size: 9px; margin: 8px 0; color: #D9534F; border-bottom: 1px solid #ccc; padding-bottom: 6px;">
            <span style="border: 1px solid #D9534F; padding: 2px 8px; display: inline-block;">WARRANTY CLAIM CERTIFICATE</span>
            <div style="font-size: 9px; margin-top: 4px; color: #D9534F;">شهادة ضمان</div>
          </div>

          <!-- Bill info with two columns -->
          <table class="bill-info-table" style="width: 100%;">
            <tr>
              <td class="bill-number">Bill no.: ${warrantyBillNumber}</td>
              <td class="print-date">Printed on: ${format(
                new Date(),
                "dd/MM/yyyy"
              )} ${format(new Date(), "HH:mm:ss")}</td>
            </tr>
          </table>
          <div style="width: 100%; border-bottom: 1px dashed #999; margin: 3px 0;"></div>

          <!-- Customer info with two columns -->
          <table class="bill-info-table">
            <tr>
              <td class="customer-info">To, Mr./Mrs.: ${customerName || ""}</td>
              <td class="car-plate">Warranty Type: Battery</td>
            </tr>
          </table>

          <!-- Items table -->
          <table class="items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${selectedClaimItems
                .map(
                  (item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.name}${
                    item.details ? " (" + item.details + ")" : ""
                  }</td>
                  <td>${item.quantity}</td>
                  <td>${item.price.toFixed(3)}</td>
                  <td>${(item.price * item.quantity).toFixed(3)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <!-- Summary section -->
          <table class="summary-table">
            <tr class="total-row">
              <td class="label">WARRANTY AMOUNT:</td>
              <td class="amount">${claimAmount.toFixed(3)} OMR</td>
            </tr>
          </table>
          
          <div style="flex-grow: 1;"></div>
          
          <div class="cashier-section">
            <div class="cashier-info">Cashier: ${
              selectedCashier?.name || fetchedCashier?.name || ""
            }</div>
            <div class="signature-line">
              <div class="line">Authorized Signature</div>
            </div>
          </div>

          <hr style="width: 100%; border: none; border-top: 1px solid #ccc; margin: 5px 0 2px 0;" />
          <div class="footer" style="border-top: none;">
            ${
              registered.contactNumber
                ? `<div class="footer-contact">Contact no.: ${registered.contactNumber}</div>`
                : ""
            }
            <div class="footer-thank-you" style="white-space: pre-line;">Thank you for trusting us with your warranty claim\nشكراً لثقتكم بنا</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.document.title = "";

    setTimeout(() => {
      printWindow.print();
      // Don't automatically close the print window on mobile devices
      if (
        !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      ) {
        // Removed auto close to prevent about:blank text
        // printWindow.close();
      }
    }, 500);
  };

  // Scroll to top when showing the receipt
  useEffect(() => {
    if (showRefundReceipt) {
      // Use setTimeout to ensure the DOM has updated
      setTimeout(() => {
        const dialogContent = document.querySelector(".DialogContent");
        const contentContainer = document.querySelector(
          ".flex-1.overflow-y-auto"
        );
        if (dialogContent) {
          dialogContent.scrollTop = 0;
        }
        if (contentContainer) {
          contentContainer.scrollTop = 0;
        }
      }, 50);
    }
  }, [showRefundReceipt]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95%] max-w-[600px] h-auto max-h-[80vh] rounded-lg overflow-auto flex flex-col p-3 sm:p-4">
          <DialogHeader className="px-3 pt-2 pb-2">
            <DialogTitle className="text-xl flex items-center gap-2">
              {step !== "search" && step !== "processing" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 mr-1"
                  onClick={() => setStep("search")}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              {step === "search" && "Warranty Claim"}
              {step === "select" && "Select Items for Claim"}
              {step === "confirm" && "Confirm Warranty Claim"}
              {step === "processing" && "Processing Warranty Claim"}
              {step === "complete" && "Claim Complete"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <div className="px-3 pb-3 space-y-3">
              <AnimatePresence mode="wait">
                {step === "search" && (
                  <motion.div
                    key="search"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="text-sm text-muted-foreground">
                      Enter the receipt number to process a warranty claim. You
                      can find this on the customer's receipt.
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Receipt Number (e.g., A1234)"
                          className="pl-10"
                          value={receiptNumber}
                          onChange={(e) => setReceiptNumber(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && receiptNumber) {
                              handleLookupReceipt();
                            }
                          }}
                        />
                      </div>
                      <Button
                        onClick={handleLookupReceipt}
                        disabled={!receiptNumber || isSearching}
                      >
                        {isSearching ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: "linear",
                              }}
                              className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                            />
                            Searching...
                          </>
                        ) : (
                          "Search"
                        )}
                      </Button>
                    </div>

                    {isSearching && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="h-6 w-6 border-3 border-blue-500 border-t-transparent rounded-full flex-shrink-0"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900">
                            Searching for receipt...
                          </p>
                          <p className="text-xs text-blue-700">
                            Please wait while we retrieve the transaction
                            details
                          </p>
                          <div className="mt-2 w-full bg-blue-100 rounded-full h-1.5">
                            <motion.div
                              className="bg-blue-500 h-1.5 rounded-full"
                              initial={{ width: "0%" }}
                              animate={{ width: "100%" }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div className="rounded-lg border p-3 bg-muted/50">
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        Enter Transaction Reference Number
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>Example: A1234, B5678, etc.</p>
                        <p>
                          Search will find transactions by reference number.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
                {step === "select" && currentReceipt && (
                  <motion.div
                    key="select"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="rounded-lg border p-4 mb-4">
                      <div className="text-sm font-medium mb-2">
                        Receipt Information
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Receipt #:
                          </span>{" "}
                          {currentReceipt.receiptNumber}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date:</span>{" "}
                          {currentReceipt.date}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Time:</span>{" "}
                          {currentReceipt.time}
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Payment:
                          </span>{" "}
                          {currentReceipt.paymentMethod}
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Total:</span>{" "}
                          OMR {currentReceipt.total.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium mb-2">
                      Select Items for Warranty Claim
                    </div>
                    <div className="space-y-2">
                      {currentReceipt.items.map((item) => (
                        <Card key={item.uniqueId} className="overflow-hidden">
                          <CardContent className="p-0">
                            <div
                              className={cn(
                                "p-4 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors",
                                selectedItems.includes(item.uniqueId) &&
                                  "bg-muted"
                              )}
                              onClick={() => toggleItemSelection(item.uniqueId)}
                            >
                              <Checkbox
                                checked={selectedItems.includes(item.uniqueId)}
                                onCheckedChange={() =>
                                  toggleItemSelection(item.uniqueId)
                                }
                                className="h-5 w-5"
                              />
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="font-medium">
                                      {item.name}
                                    </div>
                                    {item.details && (
                                      <div className="text-xs text-muted-foreground">
                                        {item.details}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="font-medium">
                                      OMR{" "}
                                      {(item.price * item.quantity).toFixed(2)}
                                    </div>
                                    {item.quantity > 1 && (
                                      <div className="text-xs text-muted-foreground">
                                        {item.quantity} × OMR{" "}
                                        {item.price.toFixed(2)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {selectedItems.length > 0 && (
                      <div className="rounded-lg border p-4 bg-muted/50 mt-4">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Total Claim Amount</span>
                          <span>OMR {claimAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
                {step === "confirm" && currentReceipt && (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    <div className="rounded-lg border p-4 mb-4">
                      <div className="text-sm font-medium mb-2">
                        Claim Summary
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Receipt #:
                          </span>{" "}
                          {currentReceipt.receiptNumber}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date:</span>{" "}
                          {currentReceipt.date}
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">
                            Items to Claim:
                          </span>{" "}
                          {selectedItems.length}
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">
                            Claim Amount:
                          </span>{" "}
                          OMR {claimAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium mb-2">
                      Items to Claim
                    </div>
                    <div className="space-y-2">
                      {currentReceipt.items
                        .filter((item) => selectedItems.includes(item.uniqueId))
                        .map((item) => (
                          <Card key={item.uniqueId} className="overflow-hidden">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-medium">{item.name}</div>
                                  {item.details && (
                                    <div className="text-xs text-muted-foreground">
                                      {item.details}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="font-medium">
                                    OMR{" "}
                                    {(item.price * item.quantity).toFixed(2)}
                                  </div>
                                  {item.quantity > 1 && (
                                    <div className="text-xs text-muted-foreground">
                                      {item.quantity} × OMR{" "}
                                      {item.price.toFixed(2)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                    <div className="rounded-lg border p-4 bg-muted/50 mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <div className="text-sm font-medium">Claim Policy</div>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>
                          Claims are subject to store policy. Items must be in
                          resellable condition. Claims will be issued to the
                          original payment method when possible.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
                {step === "complete" && (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4"
                  >
                    {!showRefundReceipt ? (
                      <div className="flex flex-col items-center justify-center py-6">
                        <div className="rounded-full bg-green-100 p-3 mb-4">
                          <Check className="h-6 w-6 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">
                          Claim Complete
                        </h3>
                        <p className="text-muted-foreground text-center mb-4">
                          The claim of OMR {claimAmount.toFixed(2)} has been
                          processed successfully.
                        </p>
                        <div className="border rounded-lg p-4 w-full">
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Receipt #:
                              </span>{" "}
                              {currentReceipt?.receiptNumber}
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Date:
                              </span>{" "}
                              {new Date().toLocaleDateString()}
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Time:
                              </span>{" "}
                              {new Date().toLocaleTimeString()}
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Cashier:
                              </span>{" "}
                              {selectedCashier?.name || "Unknown"}
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">
                                Claim Amount:
                              </span>{" "}
                              <span className="font-medium">
                                OMR {claimAmount.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <h3 className="text-lg font-semibold mb-4 text-center">
                          Warranty Certificate
                        </h3>
                        <div className="overflow-hidden rounded-lg">
                          {/* Use BillComponent for warranty claims since they're only for batteries */}
                          <BillComponent
                            cart={
                              currentReceipt?.items.filter((item) =>
                                selectedItems.includes(item.uniqueId)
                              ) || []
                            }
                            billNumber={`W${Math.floor(Math.random() * 10000)
                              .toString()
                              .padStart(4, "0")}`}
                            currentDate={format(new Date(), "dd/MM/yyyy")}
                            currentTime={format(new Date(), "HH:mm:ss")}
                            customerName={customerName || ""}
                            cashier={
                              selectedCashier?.name ||
                              fetchedCashier?.name ||
                              ""
                            }
                            hideButton={true}
                            isWarrantyClaim={true}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <DialogFooter className="px-3 py-3 border-t flex-wrap gap-y-2">
            {step === "search" && (
              <div className="flex gap-2 sm:gap-3 w-full justify-end flex-wrap">
                <Button variant="outline" onClick={handleCloseDialog}>
                  Close
                </Button>
              </div>
            )}
            {step === "select" && (
              <div className="flex gap-2 sm:gap-3 w-full justify-end flex-wrap">
                <Button variant="ghost" onClick={() => setStep("search")}>
                  Back
                </Button>
                <Button onClick={handleProceedToConfirm}>
                  Continue to Confirm
                </Button>
              </div>
            )}
            {step === "confirm" && (
              <div className="flex gap-2 sm:gap-3 w-full justify-end flex-wrap">
                <Button variant="ghost" onClick={() => setStep("select")}>
                  Back
                </Button>
                <Button
                  onClick={() => setIsConfirmDialogOpen(true)}
                  variant="destructive"
                >
                  Process Claim
                </Button>
              </div>
            )}
            {step === "processing" && (
              <div className="flex justify-center w-full">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full"
                  />
                  Processing warranty claim...
                </div>
              </div>
            )}
            {step === "complete" && (
              <div className="flex gap-2 sm:gap-3 w-full justify-end flex-wrap">
                {!showRefundReceipt && (
                  <Button
                    onClick={() => setShowRefundReceipt(true)}
                    className="gap-2"
                  >
                    <Printer className="h-4 w-4" /> View Warranty Bill
                  </Button>
                )}
                {showRefundReceipt && (
                  <div className="flex gap-2 sm:gap-3 w-full justify-end flex-wrap">
                    <Button
                      variant="outline"
                      onClick={() => setShowRefundReceipt(false)}
                      className="gap-2"
                    >
                      Back
                    </Button>
                    <Button onClick={handlePrint} className="gap-2">
                      <Printer className="h-4 w-4" /> Print Warranty Bill
                    </Button>
                    <Button onClick={handleCloseDialog}>Done</Button>
                  </div>
                )}
                {!showRefundReceipt && (
                  <Button onClick={handleCloseDialog}>Done</Button>
                )}
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog for Warranty Claims */}
      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
      >
        <AlertDialogContent className="p-4 sm:p-5">
          <AlertDialogHeader className="space-y-1">
            <AlertDialogTitle>Confirm Warranty Claim</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to process this warranty claim for OMR{" "}
              {claimAmount.toFixed(2)}? This will generate an official A5
              warranty bill.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-wrap gap-y-2">
            <div className="flex gap-2 sm:gap-3 w-full justify-end flex-wrap">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmClaim}>
                Confirm
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cashier Selection Dialog */}
      <AlertDialog
        open={isCashierSelectOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCashierSelectOpen(false);
            setEnteredCashierId("");
            setFetchedCashier(null);
            setCashierIdError(null);
          }
        }}
      >
        <AlertDialogContent className="p-4 sm:p-5">
          <AlertDialogHeader className="space-y-1">
            <AlertDialogTitle>Enter Cashier ID</AlertDialogTitle>
            <AlertDialogDescription>
              Please enter your cashier ID to authorize this warranty claim.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-col items-center py-2">
            <Input
              className="text-center text-2xl w-32 mb-2"
              value={enteredCashierId}
              onChange={(e) => {
                setEnteredCashierId(e.target.value.replace(/\D/g, ""));
                setCashierIdError(null);
              }}
              maxLength={6}
              inputMode="numeric"
              type="tel"
              pattern="[0-9]*"
              autoFocus
              placeholder="ID"
            />
            {cashierIdError && (
              <div className="text-destructive text-sm mt-2">
                {cashierIdError}
              </div>
            )}
            {fetchedCashier && (
              <div className="text-green-600 text-sm mt-2">
                Authorized: {fetchedCashier.name}
              </div>
            )}
          </div>
          <AlertDialogFooter className="flex-wrap gap-y-2">
            <div className="flex gap-2 sm:gap-3 w-full justify-end flex-wrap">
              <AlertDialogCancel disabled={isProcessingRefund}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  const found = staffMembers.find(
                    (c) => c.id === enteredCashierId
                  );
                  if (found) {
                    setFetchedCashier(found);
                    setSelectedCashier(found);
                    setCashierIdError(null);
                    // Pass the cashier directly to avoid async state issues
                    handleFinalizeClaim(found);
                  } else {
                    setCashierIdError("Invalid cashier ID. Please try again.");
                  }
                }}
                disabled={isProcessingRefund || !enteredCashierId.trim()}
              >
                {isProcessingRefund ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                    Processing...
                  </>
                ) : (
                  "Authorize"
                )}
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
