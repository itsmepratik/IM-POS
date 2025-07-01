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

// This would normally come from a database
// For this mock, we'll create some sample receipts
const mockReceipts: Receipt[] = [
  {
    receiptNumber: "A1234",
    date: "01/05/2023",
    time: "14:30:45",
    paymentMethod: "Card",
    total: 129.99,
    items: [
      {
        id: 1028,
        name: "Premium Battery",
        price: 129.99,
        quantity: 1,
        uniqueId: "1028-battery",
      },
    ],
  },
  {
    receiptNumber: "A2345",
    date: "02/05/2023",
    time: "10:15:22",
    paymentMethod: "Cash",
    total: 69.99,
    items: [
      {
        id: 1029,
        name: "Economy Battery",
        price: 69.99,
        quantity: 1,
        uniqueId: "1029-battery",
      },
    ],
  },
  {
    receiptNumber: "A3456",
    date: "03/05/2023",
    time: "16:45:10",
    paymentMethod: "Mobile Pay",
    total: 149.99,
    items: [
      {
        id: 1030,
        name: "Heavy Duty Battery",
        price: 149.99,
        quantity: 1,
        uniqueId: "1030-battery",
      },
    ],
  },
  {
    receiptNumber: "A4567",
    date: "04/05/2023",
    time: "13:22:18",
    paymentMethod: "Cash",
    total: 99.99,
    items: [
      {
        id: 1031,
        name: "Premium Battery with Trade-in",
        price: 129.99,
        quantity: 1,
        uniqueId: "1031-battery",
      },
      {
        id: 1032,
        name: "Discount on old battery",
        price: -30.0,
        quantity: 1,
        uniqueId: "1032-discount",
      },
    ],
  },
  {
    receiptNumber: "B1234",
    date: "05/05/2023",
    time: "09:20:15",
    paymentMethod: "Card",
    total: 89.75,
    items: [
      {
        id: 2001,
        name: "Shell Helix Ultra 5W-30",
        price: 45.99,
        quantity: 1,
        uniqueId: "2001-oil",
        details: "Synthetic Engine Oil",
      },
      {
        id: 2002,
        name: "Toyota Oil Filter",
        price: 12.5,
        quantity: 1,
        uniqueId: "2002-filter",
      },
      {
        id: 2003,
        name: "Air Filter Premium",
        price: 18.99,
        quantity: 1,
        uniqueId: "2003-filter",
      },
      {
        id: 2004,
        name: "Oil Change Service",
        price: 12.27,
        quantity: 1,
        uniqueId: "2004-service",
      },
    ],
  },
  {
    receiptNumber: "B2345",
    date: "07/05/2023",
    time: "11:35:40",
    paymentMethod: "Cash",
    total: 156.45,
    items: [
      {
        id: 3001,
        name: "Castrol EDGE 0W-20",
        price: 52.99,
        quantity: 2,
        uniqueId: "3001-oil",
        details: "Full Synthetic",
      },
      {
        id: 3002,
        name: "Mobil 1 Extended Performance Oil Filter",
        price: 24.99,
        quantity: 1,
        uniqueId: "3002-filter",
      },
      {
        id: 3003,
        name: "Fuel System Cleaner",
        price: 15.49,
        quantity: 1,
        uniqueId: "3003-additive",
      },
      {
        id: 3004,
        name: "Wiper Blade Set",
        price: 9.99,
        quantity: 1,
        uniqueId: "3004-parts",
      },
    ],
  },
  {
    receiptNumber: "B3456",
    date: "10/05/2023",
    time: "14:15:30",
    paymentMethod: "Mobile Pay",
    total: 67.98,
    items: [
      {
        id: 4001,
        name: "Brake Fluid DOT 4",
        price: 12.99,
        quantity: 2,
        uniqueId: "4001-fluid",
      },
      {
        id: 4002,
        name: "Cabin Air Filter",
        price: 22.5,
        quantity: 1,
        uniqueId: "4002-filter",
      },
      {
        id: 4003,
        name: "Coolant 1L",
        price: 19.5,
        quantity: 1,
        uniqueId: "4003-fluid",
        details: "Long Life",
      },
    ],
  },
];

// Get cashier data from the hook

export function RefundDialog({ isOpen, onClose }: RefundDialogProps) {
  const { toast } = useToast();
  const { staffMembers } = useStaffIDs();
  const [receiptNumber, setReceiptNumber] = useState("");
  const [currentReceipt, setCurrentReceipt] = useState<Receipt | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [refundComplete, setRefundComplete] = useState(false);
  const [step, setStep] = useState<
    "search" | "select" | "confirm" | "complete"
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

  // Calculate refund amount
  const refundAmount =
    currentReceipt?.items
      .filter((item) => selectedItems.includes(item.uniqueId))
      .reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

  // Add function to check if refund contains only batteries
  const containsOnlyBatteries = (items: CartItem[]): boolean => {
    if (!items || items.length === 0) return false;
    return items.every(
      (item) =>
        item.name.toLowerCase().includes("battery") ||
        (item.uniqueId && item.uniqueId.includes("battery"))
    );
  };

  // Handle looking up a receipt
  const handleLookupReceipt = () => {
    const receipt = mockReceipts.find(
      (r) => r.receiptNumber.toLowerCase() === receiptNumber.toLowerCase()
    );
    if (receipt) {
      setCurrentReceipt(receipt);
      setStep("select");
      setSelectedItems([]);
    } else {
      toast({
        title: "Receipt not found",
        description: "Please check the receipt number and try again.",
        variant: "destructive",
      });
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

  const handleFinalizeRefund = () => {
    setIsCashierSelectOpen(false);
    setStep("complete");
    setRefundComplete(true);
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
    } else {
      setReceiptNumber("");
      setCurrentReceipt(null);
      setSelectedItems([]);
      setStep("search");
    }
  };

  // Add test handlers to pre-populate receipt and selections for testing
  const testOilFilterRefund = () => {
    // Use receipt B1234 which has oils and filters
    setReceiptNumber("B1234");
    const receipt = mockReceipts.find((r) => r.receiptNumber === "B1234");
    if (receipt) {
      setCurrentReceipt(receipt);
      // Select the oil and filter items
      setSelectedItems(["2001-oil", "2002-filter"]);
      setStep("select");
    }
  };

  const testMultipleItemsRefund = () => {
    // Use receipt B2345 which has multiple items
    setReceiptNumber("B2345");
    const receipt = mockReceipts.find((r) => r.receiptNumber === "B2345");
    if (receipt) {
      setCurrentReceipt(receipt);
      // Select all items
      setSelectedItems(receipt.items.map((item) => item.uniqueId));
      setStep("select");
    }
  };

  // Add test for a battery refund
  const testBatteryRefund = () => {
    // Use receipt A1234 which has a battery
    setReceiptNumber("A1234");
    const receipt = mockReceipts.find((r) => r.receiptNumber === "A1234");
    if (receipt) {
      setCurrentReceipt(receipt);
      setSelectedItems(["1028-battery"]);
      setStep("select");
    }
  };

  // Add test for a battery with trade-in refund
  const testBatteryWithTradeInRefund = () => {
    // Use receipt A4567 which has a battery with trade-in
    setReceiptNumber("A4567");
    const receipt = mockReceipts.find((r) => r.receiptNumber === "A4567");
    if (receipt) {
      setCurrentReceipt(receipt);
      // Select all items including the discount
      setSelectedItems(receipt.items.map((item) => item.uniqueId));
      setTradeInAmount(30.0); // Set the trade-in amount
      setStep("select");
    }
  };

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

    // Generate HTML content for thermal receipt printing
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Refund Receipt</title>
        <style>
          @page {
            size: 80mm 297mm;
            margin: 0;
          }
          html, body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            width: 100%;
            font-size: 10pt;
          }
          .receipt {
            width: 76mm;
            padding: 5mm 2mm;
            margin: 0 auto;
          }
          .receipt-header {
            text-align: center;
            margin-bottom: 10px;
          }
          .receipt-header h1 {
            font-size: 14pt;
            margin: 0;
            font-weight: bold;
          }
          .receipt-header p {
            font-size: 8pt;
            margin: 2px 0;
            color: #555;
          }
          .receipt-divider {
            border-top: 1px dashed #000;
            margin: 5px 0;
          }
          .receipt-info {
            font-size: 9pt;
            margin: 5px 0;
          }
          .receipt-title {
            text-align: center;
            font-weight: bold;
            margin: 10px 0;
            font-size: 11pt;
            color: #D9534F;
          }
          .receipt-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 8pt;
          }
          .receipt-table th, .receipt-table td {
            text-align: left;
            padding: 2px 0;
          }
          .receipt-items {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 8pt;
          }
          .receipt-items th, .receipt-items td {
            padding: 3px 0;
          }
          .receipt-items th {
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          .receipt-items td.price {
            text-align: right;
          }
          .receipt-summary {
            margin: 10px 0;
            font-size: 9pt;
          }
          .receipt-summary table {
            width: 100%;
          }
          .receipt-footer {
            margin-top: 15px;
            font-size: 8pt;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="receipt-header">
            <h1>H Automotives</h1>
            <p>Saham, Sultanate of Oman</p>
            <p>Ph: 92510750 | 26856848</p>
          </div>
          
          <div class="receipt-divider"></div>
          
          <div class="receipt-title">REFUND RECEIPT</div>
          
          <div class="receipt-info">
            <p>Original Receipt: ${currentReceipt?.receiptNumber || ""}</p>
            <p>Date: ${format(new Date(), "dd/MM/yyyy")}</p>
            <p>Time: ${format(new Date(), "HH:mm:ss")}</p>
            <p>Refund ID: R${Math.floor(Math.random() * 10000)
              .toString()
              .padStart(4, "0")}</p>
            ${customerName ? `<p>Customer: ${customerName}</p>` : ""}
          </div>
          
          <div class="receipt-divider"></div>
          
          <table class="receipt-items">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th style="text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${selectedRefundItems
                .map(
                  (item) => `
                <tr>
                  <td>${item.name}${
                    item.details ? ` (${item.details})` : ""
                  }</td>
                  <td>${item.quantity}</td>
                  <td class="price">OMR ${(item.price * item.quantity).toFixed(
                    3
                  )}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          
          <div class="receipt-divider"></div>
          
          <div class="receipt-summary">
            <table>
              <tr>
                <td style="font-weight: bold;">TOTAL REFUND AMOUNT:</td>
                <td style="text-align: right; font-weight: bold; color: #D9534F;">
                  OMR ${refundAmount.toFixed(3)}
                </td>
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
            <div class="receipt-divider"></div>
            <p>Thank you for shopping with us</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

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
        <DialogContent className="w-[95%] max-w-[600px] h-auto max-h-[80vh] rounded-lg flex flex-col print:p-0 print:border-0 print:max-h-none print:h-auto print:overflow-visible p-3 sm:p-4">
          <DialogHeader className="px-3 pt-2 pb-2 flex-shrink-0 z-10 bg-background sticky top-0">
            <DialogTitle className="text-xl flex items-center gap-2">
              {step !== "search" && (
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
                        disabled={!receiptNumber}
                      >
                        Search
                      </Button>
                    </div>

                    {/* Add test buttons for quick testing */}
                    <div className="flex flex-col gap-2 rounded-lg border p-3 bg-muted/50">
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        Test Refund Scenarios
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={testBatteryRefund}
                          className="h-auto py-1.5 text-xs"
                        >
                          Test Battery Refund
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={testBatteryWithTradeInRefund}
                          className="h-auto py-1.5 text-xs"
                        >
                          Test Battery with Trade-in
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={testOilFilterRefund}
                          className="h-auto py-1.5 text-xs"
                        >
                          Test Oil & Filter Refund
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={testMultipleItemsRefund}
                          className="h-auto py-1.5 text-xs"
                        >
                          Test Multiple Items Refund
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-lg border p-4 bg-muted/50">
                      <div className="flex items-center gap-2 text-sm font-medium mb-2">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        Sample Receipt Numbers
                      </div>
                      <div className="text-xs text-muted-foreground grid grid-cols-2 gap-x-2">
                        {mockReceipts.map((receipt) => (
                          <div
                            key={receipt.receiptNumber}
                            className="flex justify-between"
                          >
                            <span>{receipt.receiptNumber}</span>
                            <span>OMR {receipt.total.toFixed(2)}</span>
                          </div>
                        ))}
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
              Please enter your cashier ID to authorize this refund.
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
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  const found = staffMembers.find(
                    (c) => c.id === enteredCashierId
                  );
                  if (found) {
                    setFetchedCashier(found);
                    setSelectedCashier(found);
                    setCashierIdError(null);
                    handleFinalizeRefund();
                  } else {
                    setCashierIdError("Invalid cashier ID. Please try again.");
                  }
                }}
              >
                Authorize
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
  const [receiptNumber, setReceiptNumber] = useState("");
  const [currentReceipt, setCurrentReceipt] = useState<Receipt | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [claimComplete, setClaimComplete] = useState(false);
  const [step, setStep] = useState<
    "search" | "select" | "confirm" | "complete"
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

  // Calculate claim amount (same as refund for now)
  const claimAmount =
    currentReceipt?.items
      .filter((item) => selectedItems.includes(item.uniqueId))
      .reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

  // Add the missing containsOnlyBatteries function
  const containsOnlyBatteries = (items: CartItem[]): boolean => {
    if (items.length === 0) return false;

    // Filter out the special discount item before checking if all remaining are batteries
    const actualProductItems = items.filter(
      (item) => !item.name.toLowerCase().includes("discount on old battery")
    );

    // If, after filtering out the discount, there are no actual products, it's not a battery-only sale.
    if (actualProductItems.length === 0) return false;

    // Check if all items are batteries (based on name since we don't have category/type info here)
    return actualProductItems.every((item) =>
      item.name.toLowerCase().includes("battery")
    );
  };

  // Handle looking up a receipt
  const handleLookupReceipt = () => {
    const receipt = mockReceipts.find(
      (r) => r.receiptNumber.toLowerCase() === receiptNumber.toLowerCase()
    );
    if (receipt) {
      setCurrentReceipt(receipt);
      setStep("select");
      setSelectedItems([]);
    } else {
      toast({
        title: "Receipt not found",
        description: "Please check the receipt number and try again.",
        variant: "destructive",
      });
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

  const handleFinalizeClaim = () => {
    setIsCashierSelectOpen(false);
    setStep("complete");
    setClaimComplete(true);
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

    // Generate HTML content for thermal receipt printing
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Warranty Claim Receipt</title>
        <style>
          @page {
            size: 80mm 297mm;
            margin: 0;
          }
          html, body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            width: 100%;
            font-size: 10pt;
          }
          .receipt {
            width: 76mm;
            padding: 5mm 2mm;
            margin: 0 auto;
          }
          .receipt-header {
            text-align: center;
            margin-bottom: 10px;
          }
          .receipt-header h1 {
            font-size: 14pt;
            margin: 0;
            font-weight: bold;
          }
          .receipt-header p {
            font-size: 8pt;
            margin: 2px 0;
            color: #555;
          }
          .receipt-divider {
            border-top: 1px dashed #000;
            margin: 5px 0;
          }
          .receipt-info {
            font-size: 9pt;
            margin: 5px 0;
          }
          .receipt-title {
            text-align: center;
            font-weight: bold;
            margin: 10px 0;
            font-size: 11pt;
            color: #D9534F;
          }
          .receipt-items {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 8pt;
          }
          .receipt-items th, .receipt-items td {
            padding: 3px 0;
          }
          .receipt-items th {
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          .receipt-items td.price {
            text-align: right;
          }
          .receipt-summary {
            margin: 10px 0;
            font-size: 9pt;
          }
          .receipt-summary table {
            width: 100%;
          }
          .receipt-footer {
            margin-top: 15px;
            font-size: 8pt;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="receipt-header">
            <h1>H Automotives</h1>
            <p>Saham, Sultanate of Oman</p>
            <p>Ph: 92510750 | 26856848</p>
          </div>
          
          <div class="receipt-divider"></div>
          
          <div class="receipt-title">WARRANTY CLAIM RECEIPT</div>
          
          <div class="receipt-info">
            <p>Original Receipt: ${currentReceipt?.receiptNumber || ""}</p>
            <p>Date: ${format(new Date(), "dd/MM/yyyy")}</p>
            <p>Time: ${format(new Date(), "HH:mm:ss")}</p>
            <p>Claim ID: ${warrantyBillNumber}</p>
            ${customerName ? `<p>Customer: ${customerName}</p>` : ""}
          </div>
          
          <div class="receipt-divider"></div>
          
          <table class="receipt-items">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th style="text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${selectedClaimItems
                .map(
                  (item) => `
                <tr>
                  <td>${item.name}${
                    item.details ? ` (${item.details})` : ""
                  }</td>
                  <td>${item.quantity}</td>
                  <td class="price">OMR ${(item.price * item.quantity).toFixed(
                    3
                  )}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          
          <div class="receipt-divider"></div>
          
          <div class="receipt-summary">
            <table>
              <tr>
                <td style="font-weight: bold;">TOTAL CLAIM AMOUNT:</td>
                <td style="text-align: right; font-weight: bold; color: #D9534F;">
                  OMR ${claimAmount.toFixed(3)}
                </td>
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
            <div class="receipt-divider"></div>
            <p>Thank you for trusting us with your warranty claim</p>
            <p>شكراً لثقتكم بنا</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

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
              {step !== "search" && (
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
                        disabled={!receiptNumber}
                      >
                        Search
                      </Button>
                    </div>
                    <div className="rounded-lg border p-3 bg-muted/50">
                      <div className="flex items-center gap-2 text-sm font-medium mb-1">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        Sample Receipt Numbers
                      </div>
                      <div className="text-xs text-muted-foreground grid grid-cols-2 gap-x-2">
                        {mockReceipts.map((receipt) => (
                          <div
                            key={receipt.receiptNumber}
                            className="flex justify-between"
                          >
                            <span>{receipt.receiptNumber}</span>
                            <span>OMR {receipt.total.toFixed(2)}</span>
                          </div>
                        ))}
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
                          Bill Preview
                        </h3>
                        <div className="overflow-hidden rounded-lg">
                          {/* Always show thermal receipt for warranty claims regardless of item type */}
                          <ScrollArea className="h-[60vh]">
                            <RefundReceipt
                              items={
                                currentReceipt?.items.filter((item) =>
                                  selectedItems.includes(item.uniqueId)
                                ) || []
                              }
                              receiptNumber={`W${Math.floor(
                                Math.random() * 10000
                              )
                                .toString()
                                .padStart(4, "0")}`}
                              originalReceiptNumber={
                                currentReceipt?.receiptNumber || ""
                              }
                              currentDate={format(new Date(), "dd/MM/yyyy")}
                              currentTime={format(new Date(), "HH:mm:ss")}
                              customerName={customerName}
                              cashier={
                                selectedCashier?.name ||
                                fetchedCashier?.name ||
                                ""
                              }
                              refundAmount={claimAmount}
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
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  const found = staffMembers.find(
                    (c) => c.id === enteredCashierId
                  );
                  if (found) {
                    setFetchedCashier(found);
                    setSelectedCashier(found);
                    setCashierIdError(null);
                    handleFinalizeClaim();
                  } else {
                    setCashierIdError("Invalid cashier ID. Please try again.");
                  }
                }}
              >
                Authorize
              </AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
