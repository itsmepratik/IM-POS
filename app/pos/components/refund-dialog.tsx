"use client";

import React, { useState } from "react";
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
        uniqueId: "1028-",
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
        uniqueId: "1029-",
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
        uniqueId: "1030-",
      },
    ],
  },
];

// Add mock cashier data similar to the main page
const cashiers = [
  { id: 1, name: "Hossain (Owner)" },
  { id: 2, name: "Adnan Hossain" },
  { id: 3, name: "Fatima Al-Zadjali" },
  { id: 4, name: "Sara Al-Kindi" },
  { id: 5, name: "Khalid Al-Habsi" },
  { id: 101, name: "Test Cashier 101" },
  { id: 111, name: "Test Cashier 111" },
];

export function RefundDialog({ isOpen, onClose }: RefundDialogProps) {
  // Paste the original RefundDialog implementation here (or move it above WarrantyDialog)
  // For brevity, you can copy the previous implementation from before the WarrantyDialog was added.
}

export function WarrantyDialog({ isOpen, onClose }: RefundDialogProps) {
  const { toast } = useToast();
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
    id: number;
    name: string;
  } | null>(null);
  const [cashierIdError, setCashierIdError] = useState<string | null>(null);
  const [selectedCashier, setSelectedCashier] = useState<string | null>(null);

  // Calculate claim amount (same as refund for now)
  const claimAmount =
    currentReceipt?.items
      .filter((item) => selectedItems.includes(item.uniqueId))
      .reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;

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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[90%] max-w-[600px] h-auto max-h-[85vh] rounded-lg overflow-auto flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-2">
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
            <ScrollArea className="h-full max-h-full">
              <div className="px-6 pb-6 space-y-4">
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
                        Enter the receipt number to process a warranty claim.
                        You can find this on the customer's receipt.
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
                      <div className="rounded-lg border p-4 bg-muted/50">
                        <div className="flex items-center gap-2 text-sm font-medium mb-2">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          Sample Receipt Numbers
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
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
                            <span className="text-muted-foreground">
                              Total:
                            </span>{" "}
                            OMR {currentReceipt.total.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-medium mb-2">
                        Select Items for Claim
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
                                onClick={() =>
                                  toggleItemSelection(item.uniqueId)
                                }
                              >
                                <Checkbox
                                  checked={selectedItems.includes(
                                    item.uniqueId
                                  )}
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
                                        {(item.price * item.quantity).toFixed(
                                          2
                                        )}
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
                          .filter((item) =>
                            selectedItems.includes(item.uniqueId)
                          )
                          .map((item) => (
                            <Card
                              key={item.uniqueId}
                              className="overflow-hidden"
                            >
                              <CardContent className="p-4">
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
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                      <div className="rounded-lg border p-4 bg-muted/50 mt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          <div className="text-sm font-medium">
                            Warranty Policy
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>
                            Warranty claims are subject to product inspection
                            and approval.
                          </p>
                          <p>Original receipt is required for all claims.</p>
                          <p>
                            Claims may take up to 7 business days to process.
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
                      className="flex flex-col items-center justify-center py-8"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          delay: 0.2,
                          type: "spring",
                          stiffness: 200,
                        }}
                        className="rounded-full bg-green-100 p-4 mb-6"
                      >
                        <Check className="w-8 h-8 text-green-600" />
                      </motion.div>
                      <h3 className="text-xl font-semibold mb-2">
                        Claim Complete
                      </h3>
                      <p className="text-center text-muted-foreground mb-6">
                        The warranty claim of{" "}
                        <span className="font-semibold">
                          OMR {claimAmount.toFixed(2)}
                        </span>{" "}
                        has been submitted successfully.
                      </p>
                      {currentReceipt && (
                        <div className="w-full max-w-sm rounded-lg border p-4 mb-4">
                          <div className="text-sm font-medium mb-2">
                            Claim Details
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">
                                Receipt #:
                              </span>{" "}
                              {currentReceipt.receiptNumber}
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Date:
                              </span>{" "}
                              {new Date().toLocaleDateString("en-GB")}
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Time:
                              </span>{" "}
                              {new Date().toLocaleTimeString("en-GB")}
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                Items:
                              </span>{" "}
                              {selectedItems.length}
                            </div>
                            <div className="col-span-2">
                              <span className="text-muted-foreground">
                                Claim Amount:
                              </span>{" "}
                              OMR {claimAmount.toFixed(2)}
                            </div>
                            {selectedCashier && (
                              <div className="col-span-2">
                                <span className="text-muted-foreground">
                                  Authorized by:
                                </span>{" "}
                                {selectedCashier}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Show BillComponent if all claimed items are batteries */}
                      {currentReceipt &&
                        (() => {
                          const claimedItems = currentReceipt.items.filter(
                            (item) => selectedItems.includes(item.uniqueId)
                          );

                          // Check if all claimed items are batteries
                          const allBatteries =
                            claimedItems.length > 0 &&
                            claimedItems.every((item) =>
                              item.name.toLowerCase().includes("battery")
                            );

                          if (!allBatteries) {
                            return (
                              <div className="w-full text-center py-4">
                                <p className="text-muted-foreground">
                                  Bill preview is only available if all claimed
                                  items are batteries.
                                </p>
                                <Button
                                  variant="outline"
                                  className="mt-2"
                                  onClick={() =>
                                    console.log(
                                      "Bill Preview button clicked (placeholder)"
                                    )
                                  }
                                >
                                  Bill Preview
                                </Button>
                              </div>
                            );
                          }

                          return (
                            <div className="w-full max-w-lg mt-4 mb-6">
                              <BillComponent
                                cart={claimedItems}
                                billNumber={currentReceipt.receiptNumber}
                                currentDate={new Date().toLocaleDateString(
                                  "en-GB"
                                )}
                                currentTime={new Date().toLocaleTimeString(
                                  "en-GB"
                                )}
                                cashier={selectedCashier ?? undefined}
                              />
                            </div>
                          );
                        })()}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className="px-6 py-4 border-t">
            {step === "search" && (
              <Button variant="outline" onClick={handleCloseDialog}>
                Close
              </Button>
            )}
            {step === "select" && (
              <>
                <Button variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={handleProceedToConfirm}
                  disabled={selectedItems.length === 0}
                >
                  Continue
                </Button>
              </>
            )}
            {step === "confirm" && (
              <>
                <Button variant="outline" onClick={() => setStep("select")}>
                  Back
                </Button>
                <Button
                  onClick={() => setIsConfirmDialogOpen(true)}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  Submit Claim
                </Button>
              </>
            )}
            {step === "complete" && (
              <Button onClick={handleCloseDialog}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Warranty Claim</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to submit this warranty claim for OMR{" "}
              {claimAmount.toFixed(2)}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClaim}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Submit Claim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={isCashierSelectOpen}
        onOpenChange={(open) => {
          setIsCashierSelectOpen(open);
          if (!open) {
            setEnteredCashierId("");
            setFetchedCashier(null);
            setCashierIdError(null);
            if (!selectedCashier) setIsConfirmDialogOpen(true);
          }
        }}
      >
        <DialogContent
          className="w-[90%] max-w-[400px] p-6 rounded-lg"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          {!fetchedCashier ? (
            <>
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-semibold text-center">
                  Enter Cashier ID
                </DialogTitle>
                <DialogDescription className="text-center">
                  Please enter your cashier ID to proceed with the claim.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center">
                <form
                  className="flex flex-col items-center w-full"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const found = cashiers.find(
                      (c) => c.id.toString() === enteredCashierId
                    );
                    if (found) {
                      setFetchedCashier(found);
                      setSelectedCashier(found.name);
                      setCashierIdError(null);
                    } else {
                      setCashierIdError(
                        "Invalid cashier ID. Please try again."
                      );
                    }
                  }}
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
                    autoFocus
                    placeholder="ID"
                  />
                  <Button
                    className="w-full mt-4"
                    type="submit"
                    disabled={enteredCashierId.length === 0}
                  >
                    Proceed
                  </Button>
                </form>
                {cashierIdError && (
                  <div className="text-destructive text-sm mt-2">
                    {cashierIdError}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-semibold text-center">
                  Welcome, {fetchedCashier.name}!
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center my-4">
                <div className="text-muted-foreground mb-4">
                  ID: {fetchedCashier.id}
                </div>
                <Button
                  className="w-full h-12 text-base"
                  onClick={handleFinalizeClaim}
                >
                  Submit Claim
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
