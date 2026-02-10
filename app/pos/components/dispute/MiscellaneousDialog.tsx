"use client";

import { useState } from "react";
import { useStaffIDs } from "@/lib/hooks/useStaffIDs";
import { useBranch } from "@/lib/contexts/DataProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface MiscellaneousDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MiscellaneousDialog({ open, onOpenChange }: MiscellaneousDialogProps) {
  const { staffMembers } = useStaffIDs();
  const { currentBranch, inventoryLocationId } = useBranch();
  const { toast } = useToast();

  const [miscellaneousStep, setMiscellaneousStep] = useState<"amount" | "id">("amount");
  const [miscellaneousAmount, setMiscellaneousAmount] = useState(0.5);
  const [miscellaneousCashierId, setMiscellaneousCashierId] = useState("");
  const [miscellaneousCashierError, setMiscellaneousCashierError] = useState<string | null>(null);
  const [fetchedMiscellaneousCashier, setFetchedMiscellaneousCashier] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isProcessingMiscellaneous, setIsProcessingMiscellaneous] = useState(false);

  const resetState = () => {
    setMiscellaneousStep("amount");
    setMiscellaneousAmount(0.5);
    setMiscellaneousCashierId("");
    setMiscellaneousCashierError(null);
    setFetchedMiscellaneousCashier(null);
    setIsProcessingMiscellaneous(false);
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
        {miscellaneousStep === "amount" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-center text-xl">
                Miscellaneous Deduction
              </DialogTitle>
              <p className="text-center text-muted-foreground mt-2 text-sm">
                Enter the amount to deduct from the transaction
              </p>
            </DialogHeader>

            <div className="flex flex-col items-center justify-center py-4">
              <div className="flex items-center justify-center gap-4 mb-6">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={() =>
                    setMiscellaneousAmount(
                      Math.max(
                        0,
                        Math.round((miscellaneousAmount - 0.5) * 10) / 10
                      )
                    )
                  }
                >
                  <Minus className="h-5 w-5" />
                </Button>

                <div className="relative">
                  <Input
                    id="miscellaneous-amount"
                    type="number"
                    inputMode="decimal"
                    className="w-32 text-center text-xl font-medium h-12"
                    value={miscellaneousAmount}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        setMiscellaneousAmount(value);
                      } else {
                        setMiscellaneousAmount(0);
                      }
                    }}
                    step="0.5"
                    min="0"
                    autoFocus
                  />
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={() =>
                    setMiscellaneousAmount(
                      Math.round((miscellaneousAmount + 0.5) * 10) / 10
                    )
                  }
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Quick Select Section */}
            <div className="w-full mb-3 mt-auto">
              <p className="text-sm font-medium mb-3 px-2 text-left">
                Quick Select
              </p>
              <div className="grid grid-cols-4 gap-2 px-2">
                <Button
                  variant="outline"
                  className="w-full text-sm"
                  onClick={() => setMiscellaneousAmount(0.5)}
                >
                  0.5
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-sm"
                  onClick={() => setMiscellaneousAmount(1)}
                >
                  1
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-sm"
                  onClick={() => setMiscellaneousAmount(2)}
                >
                  2
                </Button>
                <Button
                  variant="outline"
                  className="w-full text-sm"
                  onClick={() => setMiscellaneousAmount(5)}
                >
                  5
                </Button>
              </div>
            </div>

            <DialogFooter className="flex flex-row gap-3 px-2">
              <Button
                variant="outline"
                className="flex-1 h-12 text-base"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 h-12 text-base bg-primary hover:bg-primary/90 text-black"
                onClick={() => {
                  if (miscellaneousAmount > 0) {
                    setMiscellaneousStep("id");
                  }
                }}
                disabled={miscellaneousAmount <= 0}
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {miscellaneousStep === "id" && !fetchedMiscellaneousCashier && (
          <>
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-semibold text-center">
                Enter Cashier ID
              </DialogTitle>
              <DialogDescription className="text-center">
                Please enter your cashier ID to proceed with the deduction.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center">
              <form
                className="flex flex-col items-center w-full"
                onSubmit={(e) => {
                  e.preventDefault();
                  const found = staffMembers.find(
                    (c) => c.id === miscellaneousCashierId
                  );
                  if (found) {
                    setFetchedMiscellaneousCashier(found);
                    setMiscellaneousCashierError(null);
                  } else {
                    setMiscellaneousCashierError(
                      "Invalid cashier ID. Please try again."
                    );
                  }
                }}
              >
                <Input
                  className="text-center text-2xl w-32 mb-2"
                  value={miscellaneousCashierId}
                  onChange={(e) => {
                    setMiscellaneousCashierId(
                      e.target.value.replace(/\D/g, "")
                    );
                    setMiscellaneousCashierError(null);
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
                  disabled={miscellaneousCashierId.length === 0}
                >
                  Verify ID
                </Button>
              </form>
              {miscellaneousCashierError && (
                <div className="text-destructive text-sm mt-2">
                  {miscellaneousCashierError}
                </div>
              )}
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setMiscellaneousStep("amount")}
              >
                Back
              </Button>
            </div>
          </>
        )}

        {miscellaneousStep === "id" && fetchedMiscellaneousCashier && (
          <>
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-semibold text-center">
                Confirm Deduction
              </DialogTitle>
              <DialogDescription className="text-center">
                Welcome, {fetchedMiscellaneousCashier.name}!
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center my-4">
              <div className="text-center space-y-2 mb-4">
                <div className="text-sm text-muted-foreground">
                  Cashier ID: {fetchedMiscellaneousCashier.id}
                </div>
                <div className="text-lg font-semibold text-red-600">
                  Amount to Deduct: OMR {miscellaneousAmount.toFixed(3)}
                </div>
                <div className="text-xs text-muted-foreground">
                  This will create a negative transaction
                </div>
              </div>

              {isProcessingMiscellaneous && (
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
                      Processing Deduction
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Creating transaction record...
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
                    setFetchedMiscellaneousCashier(null);
                    setMiscellaneousCashierId("");
                    setMiscellaneousCashierError(null);
                  }}
                  disabled={isProcessingMiscellaneous}
                >
                  Back
                </Button>
                <Button
                  className="flex-1 h-12 text-base bg-red-600 hover:bg-red-700"
                  onClick={async () => {
                    setIsProcessingMiscellaneous(true);

                    try {
                      // Create a negative transaction for miscellaneous deduction
                      const response = await fetch(
                        "/api/transactions/miscellaneous",
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            amount: miscellaneousAmount,
                            cashierId: fetchedMiscellaneousCashier.id,
                            locationId:
                              inventoryLocationId || currentBranch?.id || "default-location",
                            shopId: currentBranch?.id || "default-shop",
                          }),
                        }
                      );

                      if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(
                          errorData.message || "Failed to process deduction"
                        );
                      }

                      const result = await response.json();

                      // Show success toast
                      toast({
                        title: "Deduction Processed",
                        description: `OMR ${miscellaneousAmount.toFixed(
                          3
                        )} deducted. Reference: ${result.referenceNumber}`,
                      });

                      // Reset and close
                      resetState();
                      onOpenChange(false);
                    } catch (error) {
                      console.error(
                        "Error processing miscellaneous deduction:",
                        error
                      );
                      toast({
                        title: "Error",
                        description:
                          error instanceof Error
                            ? error.message
                            : "Failed to process deduction",
                        variant: "destructive",
                      });
                      setIsProcessingMiscellaneous(false);
                    }
                  }}
                  disabled={isProcessingMiscellaneous}
                >
                  {isProcessingMiscellaneous ? (
                    <div className="flex items-center justify-center w-full">
                      <Spinner className="text-black mr-2" />
                      Processing...
                    </div>
                  ) : (
                    "Confirm Deduction"
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
