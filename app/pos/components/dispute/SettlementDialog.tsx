"use client";

import { useState } from "react";
import { useStaffIDs } from "@/lib/hooks/useStaffIDs";
import { useBranch } from "@/lib/contexts/DataProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface SettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettlementDialog({ open, onOpenChange }: SettlementDialogProps) {
  const { staffMembers } = useStaffIDs();
  const { currentBranch, inventoryLocationId } = useBranch();
  const { toast } = useToast();

  const [settlementStep, setSettlementStep] = useState<"reference" | "id">("reference");
  const [settlementReference, setSettlementReference] = useState("");
  const [settlementCashierId, setSettlementCashierId] = useState("");
  const [settlementCashierError, setSettlementCashierError] = useState<string | null>(null);
  const [fetchedSettlementCashier, setFetchedSettlementCashier] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isProcessingSettlement, setIsProcessingSettlement] = useState(false);
  const [settlementError, setSettlementError] = useState<string | null>(null);

  const resetState = () => {
    setSettlementStep("reference");
    setSettlementReference("");
    setSettlementCashierId("");
    setSettlementCashierError(null);
    setSettlementError(null);
    setFetchedSettlementCashier(null);
    setIsProcessingSettlement(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      resetState();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="w-[90%] max-w-md p-6 rounded-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {settlementStep === "reference" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-semibold">
                Settlement
              </DialogTitle>
              <p className="text-center text-muted-foreground mt-2 text-sm">
                Convert a credited sale into a regular sale
              </p>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label
                  htmlFor="settlement-reference"
                  className="text-sm font-medium"
                >
                  Reference/Bill Number
                </label>
                <Input
                  id="settlement-reference"
                  type="text"
                  placeholder="Enter reference or bill number"
                  value={settlementReference}
                  onChange={(e) => setSettlementReference(e.target.value)}
                  className="w-full"
                  autoFocus
                />
              </div>
            </div>

            <DialogFooter className="flex flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1 h-12 text-base"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-12 text-base"
                onClick={() => {
                  if (settlementReference.trim()) {
                    setSettlementStep("id");
                  }
                }}
                disabled={!settlementReference.trim()}
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {settlementStep === "id" && !fetchedSettlementCashier && (
          <>
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-semibold text-center">
                Enter Cashier ID
              </DialogTitle>
              <DialogDescription className="text-center">
                Please enter your cashier ID to proceed with settlement.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center">
              <form
                className="flex flex-col items-center w-full"
                onSubmit={(e) => {
                  e.preventDefault();
                  const found = staffMembers.find(
                    (c) => c.id === settlementCashierId
                  );
                  if (found) {
                    setFetchedSettlementCashier(found);
                    setSettlementCashierError(null);
                  } else {
                    setSettlementCashierError(
                      "Invalid cashier ID. Please try again."
                    );
                  }
                }}
              >
                <Input
                  className="text-center text-2xl w-32 mb-2"
                  value={settlementCashierId}
                  onChange={(e) => {
                    setSettlementCashierId(e.target.value.replace(/\D/g, ""));
                    setSettlementCashierError(null);
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
                  disabled={settlementCashierId.length === 0}
                >
                  Verify ID
                </Button>
              </form>
              {(settlementCashierError || settlementError) && (
                <div className="text-destructive text-sm mt-2">
                  {settlementCashierError || settlementError}
                </div>
              )}
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setSettlementStep("reference")}
              >
                Back
              </Button>
            </div>
          </>
        )}

        {settlementStep === "id" && fetchedSettlementCashier && (
          <>
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-semibold text-center">
                Confirm Settlement
              </DialogTitle>
              <DialogDescription className="text-center">
                Welcome, {fetchedSettlementCashier.name}!
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center my-4">
              <div className="text-center space-y-2 mb-4">
                <div className="text-sm text-muted-foreground">
                  Cashier ID: {fetchedSettlementCashier.id}
                </div>
                <div className="text-sm text-muted-foreground">
                  Reference: {settlementReference}
                </div>
              </div>

              {isProcessingSettlement && (
                <div className="flex flex-col items-center justify-center gap-4 mb-4 py-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="h-12 w-12 border-3 border-primary border-t-transparent rounded-full"
                  />
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold text-primary">
                      Processing Settlement
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Converting credit sale to regular sale...
                    </p>
                    <div className="w-full max-w-xs mx-auto">
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <motion.div
                          className="bg-gradient-to-r from-primary to-primary/80 h-2 rounded-full"
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
                  </div>
                </div>
              )}

              <div className="flex flex-row gap-3 w-full">
                <Button
                  variant="outline"
                  className="flex-1 h-12 text-base"
                  onClick={() => {
                    setFetchedSettlementCashier(null);
                    setSettlementCashierId("");
                    setSettlementCashierError(null);
                  }}
                  disabled={isProcessingSettlement}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 h-12 text-base"
                  onClick={async () => {
                    setIsProcessingSettlement(true);

                    try {
                      // Call the settlement API
                      const response = await fetch(
                        "/api/settle-transaction",
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            referenceNumber: settlementReference.trim(),
                            cashierId: fetchedSettlementCashier.id,
                            paymentMethod: "CASH",
                          }),
                        }
                      );

                      const result = await response.json();

                      if (!response.ok || !result.success) {
                        throw new Error(result.error || "Settlement failed");
                      }

                      // Show success toast
                      toast({
                        title: "Settlement Processed",
                        description: `Reference ${settlementReference} has been converted to a regular sale by ${fetchedSettlementCashier.name}.`,
                      });

                      // Reset and close
                      resetState();
                      onOpenChange(false);
                    } catch (error) {
                      console.error("Settlement error:", error);
                      const errorMessage = error instanceof Error
                        ? error.message
                        : "Failed to process settlement. Please try again.";

                      toast({
                        title: "Settlement Failed",
                        description: errorMessage,
                        variant: "destructive",
                      });

                      // Set error state to show in modal
                      setSettlementError(errorMessage);
                      setIsProcessingSettlement(false);

                      // Go back to cashier ID step for retry
                      setSettlementStep("id");
                      setFetchedSettlementCashier(null);
                      setSettlementCashierId("");
                    }
                  }}
                  disabled={isProcessingSettlement}
                >
                  {isProcessingSettlement ? (
                    <div className="flex items-center justify-center w-full">
                      <Spinner className="text-black mr-2" />
                      Processing...
                    </div>
                  ) : (
                    "Confirm Settlement"
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
