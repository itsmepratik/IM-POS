"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Search, ArrowLeft, Check, AlertCircle, Printer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import {
  WarrantyClaimBill,
  WarrantyClaimBillRef,
} from "../warranty-claim-bill";
import { format } from "date-fns";
import { useStaffIDs } from "@/lib/hooks/useStaffIDs";
import { useCompanyInfo } from "@/lib/hooks/useCompanyInfo";
import { useBranch } from "@/lib/contexts/DataProvider";
import { isBatteryTransaction } from "@/lib/types/dispute";
import type { DisputedItem } from "@/lib/types/dispute";
import {
  Receipt,
  RefundDialogProps,
  fetchProductDetails,
  parseTransactionItems,
} from "./utils";

export function WarrantyDialog({ isOpen, onClose }: RefundDialogProps) {
  const { toast } = useToast();
  const { staffMembers } = useStaffIDs();
  const { brand } = useCompanyInfo();
  const { currentBranch, inventoryLocationId } = useBranch();
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
  const [currentCustomer, setCurrentCustomer] = useState<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
  } | null>(null);
  const [warrantyClaimTransaction, setWarrantyClaimTransaction] = useState<{
    referenceNumber: string;
    batteryBillHtml: string | null;
  } | null>(null);
  const warrantyBillRef = React.useRef<WarrantyClaimBillRef>(null);

  // Calculate claim amount (same as refund for now)
  const claimAmount =
    currentReceipt?.items
      .filter((item) => selectedItems.includes(item.uniqueId))
      .reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

  // Validate if a transaction contains only battery products
  const validateBatteryTransaction = async (
    items: any[],
  ): Promise<{
    isValid: boolean;
    error?: string;
  }> => {
    if (!items || items.length === 0) {
      return {
        isValid: false,
        error: "Transaction contains no items",
      };
    }

    // Extract product IDs from transaction items
    const productIds = items
      .map((item: any) => item.productId || item.id || item.product_id)
      .filter((id: any) => id && typeof id === "string");

    if (productIds.length === 0) {
      return {
        isValid: false,
        error: "Could not identify products in this transaction",
      };
    }

    // Fetch product details with category and type
    const productDetailsMap = await fetchProductDetails(productIds);

    if (productDetailsMap.size === 0) {
      return {
        isValid: false,
        error: "Could not fetch product details for validation",
      };
    }

    // Convert map to array for validation
    const productRecords = Array.from(productDetailsMap.values());

    // Validate that all products are batteries
    const isValid = isBatteryTransaction(productRecords);

    if (!isValid) {
      return {
        isValid: false,
        error:
          "Warranty claims are only available for battery purchases. This transaction contains non-battery items.",
      };
    }

    return { isValid: true };
  };

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
          receiptNumber.trim(),
        )}`,
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.details ||
            data.error ||
            `Failed to fetch transaction: ${response.statusText}`,
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

      // Validate that this is a battery-only transaction
      const validation = await validateBatteryTransaction(
        transaction.items_sold || [],
      );

      if (!validation.isValid) {
        toast({
          title: "Invalid Transaction Type",
          description:
            validation.error ||
            "This transaction is not eligible for warranty claims.",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }

      // Convert the transaction to Receipt format for the UI
      const parsedItems = await parseTransactionItems(
        transaction.items_sold || [],
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
        setCustomerName(transaction.customers.name);
      }

      setCurrentReceipt(receiptData);
      setStep("select");
      setSelectedItems([]);

      toast({
        title: "Receipt found",
        description: `Found battery transaction ${receiptNumber} with ${receiptData.items.length} items.`,
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
        : [...prev, uniqueId],
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

    // Validate branch and location
    if (!currentBranch) {
      toast({
        title: "Branch Required",
        description:
          "Please select a branch before processing the warranty claim.",
        variant: "destructive",
      });
      return;
    }

    const shopId = currentBranch.id;

    // Get locationId - prefer inventoryLocationId, otherwise fetch from shop
    let locationId = inventoryLocationId;
    if (!locationId && shopId) {
      try {
        const { fetchShops } = await import("@/lib/services/inventoryService");
        const shops = await fetchShops();
        const shop = shops.find((s) => s.id === shopId);
        if (shop) {
          locationId = shop.locationId;
        } else {
          throw new Error(`Shop ${shopId} not found`);
        }
      } catch (error) {
        console.error("Error fetching shop location:", error);
        throw new Error(
          "Could not determine location. Please ensure a branch is selected.",
        );
      }
    }

    if (!locationId) {
      toast({
        title: "Error",
        description: "Location ID is required. Please select a branch.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingRefund(true);

    try {
      // Close cashier dialog first to show main dialog loading state
      setIsCashierSelectOpen(false);
      setEnteredCashierId("");
      setFetchedCashier(null);
      setCashierIdError(null);

      // Set loading state in main dialog
      setStep("processing");

      // Get selected items and transform to DisputedItem format
      const selectedClaimItems: DisputedItem[] = currentReceipt.items
        .filter((item) => selectedItems.includes(item.uniqueId))
        .map((item) => {
          const productId = (item as any).productId;
          if (!productId || typeof productId !== "string") {
            throw new Error(`Invalid product ID for item: ${item.name}`);
          }

          return {
            productId,
            quantity: item.quantity,
            sellingPrice: item.price,
            volumeDescription: (item as any).volumeDescription || item.details,
          };
        });

      if (selectedClaimItems.length === 0) {
        throw new Error("No items selected for warranty claim");
      }

      // Call the dispute API with WARRANTY_CLAIM type
      const response = await fetch("/api/dispute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          originalBillNumber: currentReceipt.receiptNumber,
          disputeType: "WARRANTY_CLAIM",
          locationId,
          shopId,
          cashierId: activeCashier.id,
          disputedItems: selectedClaimItems,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            result.details ||
            "Failed to process warranty claim. Please try again.",
        );
      }

      // Store warranty claim transaction data
      if (result.data?.disputeTransaction) {
        setWarrantyClaimTransaction({
          referenceNumber: result.data.disputeTransaction.referenceNumber,
          batteryBillHtml: result.data.batteryBillHtml || null,
        });
      }

      setStep("complete");
      setClaimComplete(true);

      toast({
        title: "Warranty Claim Processed",
        description: `Warranty claim ${result.data?.disputeTransaction?.referenceNumber || "processed"} has been recorded successfully.`,
        duration: 5000,
      });
    } catch (error) {
      console.error("Warranty claim processing error:", error);
      toast({
        title: "Claim Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to process warranty claim. Please try again.",
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
      setCurrentCustomer(null);
      setCustomerName("");
      setWarrantyClaimTransaction(null);
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
    // Check if we have a warranty claim transaction with HTML from API
    if (warrantyClaimTransaction?.batteryBillHtml) {
      // Use the HTML generated by the API
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Please allow popups to print the warranty claim receipt.");
        return;
      }
      printWindow.document.open();
      printWindow.document.write(warrantyClaimTransaction.batteryBillHtml);
      printWindow.document.close();
      printWindow.document.title = "";

      setTimeout(() => {
        printWindow.print();
        if (
          !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent,
          )
        ) {
          // Don't auto-close on mobile devices
        }
      }, 500);
      return;
    }

    // Fallback: Use component print logic
    if (warrantyBillRef.current) {
      warrantyBillRef.current.print();
    } else {
      // Fallback if ref is not available (should not happen if visible)
      console.error("Print ref not available");
      toast({
        title: "Print Error",
        description:
          "Could not access warranty bill for printing. Please try closing giving it a moment.",
        variant: "destructive",
      });
    }
  };

  // Scroll to top when showing the receipt
  useEffect(() => {
    if (showRefundReceipt) {
      // Use setTimeout to ensure the DOM has updated
      setTimeout(() => {
        const dialogContent = document.querySelector(".DialogContent");
        const contentContainer = document.querySelector(
          ".flex-1.overflow-y-auto",
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
        <DialogContent className="w-[95%] max-w-[600px] h-auto max-h-[85vh] rounded-lg flex flex-col overflow-hidden text-sm sm:text-base">
          <DialogHeader className="p-0 bg-background shrink-0 pb-6">
            <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
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
          <div className="flex-1 overflow-y-auto py-1 px-0">
            <div className="space-y-3">
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
                        variant="chonky"
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
                                  "bg-muted",
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
                          <WarrantyClaimBill
                            ref={warrantyBillRef}
                            cart={
                              currentReceipt?.items.filter((item) =>
                                selectedItems.includes(item.uniqueId),
                              ) || []
                            }
                            billNumber={
                              warrantyClaimTransaction?.referenceNumber ||
                              `WBX${Math.floor(Math.random() * 10000)
                                .toString()
                                .padStart(4, "0")}`
                            }
                            currentDate={format(new Date(), "dd/MM/yyyy")}
                            currentTime={format(new Date(), "HH:mm:ss")}
                            customerName={customerName || ""}
                            cashier={
                              selectedCashier?.name ||
                              fetchedCashier?.name ||
                              ""
                            }
                            hideButton={true}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <DialogFooter className="p-0 bg-background shrink-0 flex-wrap gap-y-2 pt-6">
            {step === "search" && (
              <div className="flex gap-2 sm:gap-3 w-full justify-end flex-wrap">
                <Button variant="chonky-secondary" onClick={handleCloseDialog}>
                  Close
                </Button>
              </div>
            )}
            {step === "select" && (
              <div className="flex gap-2 sm:gap-3 w-full justify-end flex-wrap">
                <Button
                  variant="chonky-secondary"
                  onClick={() => setStep("search")}
                >
                  Back
                </Button>
                <Button onClick={handleProceedToConfirm} variant="chonky">
                  Continue to Confirm
                </Button>
              </div>
            )}
            {step === "confirm" && (
              <div className="flex gap-2 sm:gap-3 w-full justify-end flex-wrap">
                <Button
                  variant="chonky-secondary"
                  onClick={() => setStep("select")}
                >
                  Back
                </Button>
                <Button
                  onClick={() => setIsConfirmDialogOpen(true)}
                  variant="chonky-destructive"
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
                    className="flex-1 gap-2"
                    variant="chonky-secondary"
                  >
                    <Printer className="h-4 w-4" /> View Warranty Bill
                  </Button>
                )}
                {showRefundReceipt && (
                  <div className="flex flex-row gap-4 w-full">
                    <Button
                      variant="chonky-secondary"
                      onClick={() => setShowRefundReceipt(false)}
                      className="flex-1 gap-2"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handlePrint}
                      className="flex-1 gap-2"
                      variant="chonky-secondary"
                    >
                      <Printer className="h-4 w-4" /> Print Warranty Bill
                    </Button>
                    <Button
                      onClick={handleCloseDialog}
                      variant="chonky"
                      className="flex-1"
                    >
                      Done
                    </Button>
                  </div>
                )}
                {!showRefundReceipt && (
                  <Button
                    onClick={handleCloseDialog}
                    variant="chonky"
                    className="flex-1"
                  >
                    Done
                  </Button>
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
              <AlertDialogAction
                onClick={handleConfirmClaim}
                className={cn(buttonVariants({ variant: "chonky" }))}
              >
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
                setEnteredCashierId(e.target.value.replace(/\\D/g, ""));
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
                    (c) => c.id === enteredCashierId.trim(),
                  );
                  if (found) {
                    // Ensure we use the staff_id text (found.id) not UUID
                    const cashierForApi = {
                      id: found.id, // staff_id text like "0010"
                      name: found.name,
                    };
                    setFetchedCashier(cashierForApi);
                    setSelectedCashier(cashierForApi);
                    setCashierIdError(null);
                    // Pass the cashier directly to avoid async state issues
                    handleFinalizeClaim(cashierForApi);
                  } else {
                    setCashierIdError("Invalid cashier ID. Please try again.");
                  }
                }}
                disabled={isProcessingRefund || !enteredCashierId.trim()}
                className={cn(buttonVariants({ variant: "chonky" }))}
              >
                {isProcessingRefund ? (
                  <div className="flex items-center justify-center w-full">
                    <Spinner className="text-white mr-2" />
                    Processing...
                  </div>
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
