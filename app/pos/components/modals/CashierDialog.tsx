"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

interface CashierDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  enteredCashierId: string;
  setEnteredCashierId: (id: string) => void;
  fetchedCashier: { id: string; name: string } | null;
  setFetchedCashier: (cashier: { id: string; name: string } | null) => void;
  cashierIdError: string | null;
  setCashierIdError: (error: string | null) => void;
  setSelectedCashier: (cashier: { id: string; name: string } | null) => void;
  selectedCashier: { id: string; name: string } | null;
  setPaymentRecipient: (recipient: string | null) => void;
  setIsCheckoutModalOpen: (open: boolean) => void;
  selectedPaymentMethod: string | null;
  paymentRecipient: string | null;
  isProcessingCheckout: boolean;
  onFinalizePayment: () => void;
  staffMembers: Array<{ id: string; name: string }>;
}

export function CashierDialog({
  isOpen,
  onOpenChange,
  enteredCashierId,
  setEnteredCashierId,
  fetchedCashier,
  setFetchedCashier,
  cashierIdError,
  setCashierIdError,
  setSelectedCashier,
  selectedCashier,
  setPaymentRecipient,
  setIsCheckoutModalOpen,
  selectedPaymentMethod,
  paymentRecipient,
  isProcessingCheckout,
  onFinalizePayment,
  staffMembers,
}: CashierDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (open) {
          setEnteredCashierId("");
          setFetchedCashier(null);
          setCashierIdError(null);
        } else {
          setEnteredCashierId("");
          setFetchedCashier(null);
          setCashierIdError(null);
          setPaymentRecipient(null);
          if (!selectedCashier) setIsCheckoutModalOpen(true);
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
                Please enter your cashier ID to proceed.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center">
              <form
                className="flex flex-col items-center w-full"
                onSubmit={(e) => {
                  e.preventDefault();
                  const found = staffMembers.find(
                    (c) => c.id === enteredCashierId,
                  );
                  if (found) {
                    setFetchedCashier(found);
                    setSelectedCashier(found);
                    setCashierIdError(null);
                  } else {
                    setCashierIdError("Invalid cashier ID. Please try again.");
                  }
                }}
              >
                <Input
                  key={`cashier-id-input-${isOpen}`}
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
                  variant="chonky"
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
                variant="chonky"
                onClick={onFinalizePayment}
                disabled={
                  (selectedPaymentMethod === "mobile" && !paymentRecipient) ||
                  isProcessingCheckout
                }
              >
                {isProcessingCheckout ? (
                  <div className="flex items-center justify-center w-full">
                    <Spinner className="text-black w-5 h-5" />
                  </div>
                ) : (
                  "Confirm Payment"
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
