"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Smartphone,
  Banknote,
  CreditCard,
  Ticket,
  Receipt,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CartItem } from "../../types";
import { validateSplitPayment } from "@/lib/payments/split-payments";
import { getMobilePayRecipients } from "@/lib/payments/methods";

export type CheckoutPaymentMethod =
  | "card"
  | "cash"
  | "mobile"
  | "on-hold"
  | "credit"
  | "split"
  | null;

interface CheckoutModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPaymentMethod: CheckoutPaymentMethod;
  setSelectedPaymentMethod: (method: CheckoutPaymentMethod) => void;
  /** @deprecated The "Other" gate was removed — all methods render directly. Kept optional for backwards compatibility. */
  showOtherOptions?: boolean;
  /** @deprecated No-op now that all methods render directly. */
  setShowOtherOptions?: (show: boolean) => void;
  isOnHoldMode: boolean;
  setIsOnHoldMode: (mode: boolean) => void;
  carPlateNumber: string;
  setCarPlateNumber: (plate: string) => void;
  paymentRecipient: string | null;
  setPaymentRecipient: (recipient: string | null) => void;
  total: number;
  cart: CartItem[];
  cartContainsAnyBatteries: (cartItems: CartItem[]) => boolean;
  staffMembers: Array<{ id: string; name: string }>;
  onPaymentComplete: () => void;
  showSuccess: boolean;
  splitCashAmount?: number;
  splitCardAmount?: number;
  setSplitCashAmount?: (value: number) => void;
  setSplitCardAmount?: (value: number) => void;
}

function parseAmountInput(raw: string): number {
  const parsed: number = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 1000) / 1000;
}

export function CheckoutModal({
  isOpen,
  onOpenChange,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  setShowOtherOptions,
  isOnHoldMode,
  setIsOnHoldMode,
  carPlateNumber,
  setCarPlateNumber,
  paymentRecipient,
  setPaymentRecipient,
  total,
  cart,
  cartContainsAnyBatteries,
  staffMembers,
  onPaymentComplete,
  showSuccess,
  splitCashAmount,
  splitCardAmount,
  setSplitCashAmount,
  setSplitCardAmount,
}: CheckoutModalProps) {
  const [internalCash, setInternalCash] = useState<number>(0);
  const [internalCard, setInternalCard] = useState<number>(0);

  const cashAmount: number = splitCashAmount ?? internalCash;
  const cardAmount: number = splitCardAmount ?? internalCard;
  const updateCash: (value: number) => void =
    setSplitCashAmount ?? setInternalCash;
  const updateCard: (value: number) => void =
    setSplitCardAmount ?? setInternalCard;

  const isSplit: boolean = selectedPaymentMethod === "split";
  const splitCheck = validateSplitPayment({
    cashAmount,
    cardAmount,
    total,
  });

  const requiresPlate: boolean =
    isOnHoldMode || cartContainsAnyBatteries(cart);
  const plateMissing: boolean =
    requiresPlate && carPlateNumber.trim().length === 0;
  const mobileRecipientMissing: boolean =
    selectedPaymentMethod === "mobile" && !paymentRecipient;

  const isCompleteDisabled: boolean = isSplit
    ? !splitCheck.valid || plateMissing
    : !selectedPaymentMethod || mobileRecipientMissing || plateMissing;

  function selectSingle(
    method: Exclude<CheckoutPaymentMethod, "split" | null>,
  ): void {
    setSelectedPaymentMethod(method);
    setShowOtherOptions?.(false);
    setIsOnHoldMode(method === "on-hold");
    if (method !== "on-hold") {
      // Keep the plate for battery carts (still required); otherwise clear.
      if (!cartContainsAnyBatteries(cart)) setCarPlateNumber("");
    } else {
      setCarPlateNumber("");
    }
    if (method !== "mobile") setPaymentRecipient(null);
  }

  function selectSplit(): void {
    setSelectedPaymentMethod("split");
    setShowOtherOptions?.(false);
    setIsOnHoldMode(false);
    setPaymentRecipient(null);
    if (!cartContainsAnyBatteries(cart)) setCarPlateNumber("");
  }

  function methodButtonClass(active: boolean): string {
    return cn(
      "h-24 min-w-0 flex flex-col items-center justify-center gap-1.5 px-2 text-center",
      active && "ring-2 ring-primary",
    );
  }

  function methodLabelClass(extra?: string): string {
    return cn("text-center text-xs sm:text-sm leading-tight", extra);
  }

  function splitEvenly(): void {
    if (!Number.isFinite(total) || total <= 0) {
      updateCash(0);
      updateCard(0);
      return;
    }
    // Derive the second leg from the first so the pair always sums
    // exactly to the total (halving can leave a 1-mill residue).
    const cash: number = Math.round((total / 2) * 1000) / 1000;
    updateCash(cash);
    updateCard(Math.round((total - cash) * 1000) / 1000);
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!showSuccess) {
          onOpenChange(open);
          if (!open) {
            setShowOtherOptions?.(false);
          }
        }
      }}
    >
      <DialogContent
        className="w-[90%] max-w-[500px] p-6 rounded-lg max-h-[90vh] overflow-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="pb-4 sticky top-0 bg-background z-10 pr-8">
          <DialogTitle className="text-xl font-semibold text-center">
            Select Payment Method
          </DialogTitle>
          <DialogDescription className="sr-only">
            Choose how the customer will pay for this transaction
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* All methods render directly — no "Other" gate. */}
          <div className="grid gap-4 grid-cols-3">
            <Button
              variant={selectedPaymentMethod === "mobile" ? "chonky" : "outline"}
              className={methodButtonClass(
                selectedPaymentMethod === "mobile",
              )}
              onClick={() => selectSingle("mobile")}
            >
              <Smartphone className="w-6 h-6 shrink-0" />
              <span className={methodLabelClass()}>Mobile Pay</span>
            </Button>
            <Button
              variant={selectedPaymentMethod === "cash" ? "chonky" : "outline"}
              className={methodButtonClass(selectedPaymentMethod === "cash")}
              onClick={() => selectSingle("cash")}
            >
              <Banknote className="w-6 h-6 shrink-0" />
              <span className={methodLabelClass()}>Cash</span>
            </Button>
            <Button
              variant={selectedPaymentMethod === "card" ? "chonky" : "outline"}
              className={methodButtonClass(selectedPaymentMethod === "card")}
              onClick={() => selectSingle("card")}
            >
              <CreditCard className="w-6 h-6 shrink-0" />
              <span className={methodLabelClass()}>Card</span>
            </Button>
            <Button
              variant={selectedPaymentMethod === "credit" ? "chonky" : "outline"}
              className={methodButtonClass(
                selectedPaymentMethod === "credit",
              )}
              onClick={() => selectSingle("credit")}
            >
              <Receipt className="w-6 h-6 shrink-0" />
              <span className={methodLabelClass()}>Credit</span>
            </Button>
            <Button
              variant={
                selectedPaymentMethod === "on-hold" ? "chonky" : "outline"
              }
              className={methodButtonClass(
                selectedPaymentMethod === "on-hold",
              )}
              onClick={() => selectSingle("on-hold")}
            >
              <Ticket className="w-6 h-6 shrink-0" />
              <span className={methodLabelClass()}>on-hold</span>
            </Button>
            <Button
              variant={isSplit ? "chonky" : "outline"}
              className={methodButtonClass(isSplit)}
              onClick={selectSplit}
            >
              <ArrowLeftRight className="w-6 h-6 shrink-0" />
              <span className={methodLabelClass()}>Split</span>
            </Button>
          </div>

          {isSplit && (
            <div className="rounded-lg border p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2 min-w-0">
                  <label
                    htmlFor="split-cash-amount"
                    className="text-sm font-medium text-gray-600"
                  >
                    Cash amount
                  </label>
                  <Input
                    id="split-cash-amount"
                    type="number"
                    min={0}
                    step="0.001"
                    inputMode="decimal"
                    className="w-full"
                    value={Number.isFinite(cashAmount) ? cashAmount : 0}
                    onChange={(e) => {
                      const next: number = parseAmountInput(e.target.value);
                      updateCash(next);
                    }}
                    placeholder="0.000"
                  />
                </div>
                <div className="space-y-2 min-w-0">
                  <label
                    htmlFor="split-card-amount"
                    className="text-sm font-medium text-gray-600"
                  >
                    Card amount
                  </label>
                  <Input
                    id="split-card-amount"
                    type="number"
                    min={0}
                    step="0.001"
                    inputMode="decimal"
                    className="w-full"
                    value={Number.isFinite(cardAmount) ? cardAmount : 0}
                    onChange={(e) => {
                      const next: number = parseAmountInput(e.target.value);
                      updateCard(next);
                    }}
                    placeholder="0.000"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-gray-600">
                  Remaining: OMR {splitCheck.remaining.toFixed(3)}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={splitEvenly}
                >
                  Split evenly
                </Button>
              </div>
              {!splitCheck.valid && (
                <p role="alert" className="text-sm text-destructive">
                  {splitCheck.errors[0] ??
                    "Cash + card must equal the total amount."}
                </p>
              )}
            </div>
          )}

          <div className="border-t pt-6">
            {/* Car plate input */}
            {(isOnHoldMode || cartContainsAnyBatteries(cart)) && (
              <div className="w-full mb-4">
                <div className="text-sm font-medium text-gray-600 mb-2">
                  Car Plate Number
                </div>
                <input
                  type="text"
                  value={carPlateNumber}
                  onChange={(e) =>
                    setCarPlateNumber(e.target.value.toUpperCase())
                  }
                  placeholder="e.g., ABC-123"
                  className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  maxLength={10}
                />
              </div>
            )}

            {/* Payment recipient - mobile only */}
            {selectedPaymentMethod === "mobile" && (
              <div className="w-full mb-4">
                <div className="text-sm font-medium text-gray-600 mb-2">
                  Select payment recipient:
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {getMobilePayRecipients(staffMembers).map((recipient) => (
                    <Button
                      key={recipient.id}
                      variant={
                        paymentRecipient === recipient.name
                          ? "chonky"
                          : "outline"
                      }
                      className={cn(
                        "h-10 text-center",
                        paymentRecipient === recipient.name &&
                          "ring-2 ring-primary",
                      )}
                      onClick={() => setPaymentRecipient(recipient.name)}
                    >
                      {recipient.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between text-lg font-semibold mb-6">
              <span>Total Amount</span>
              <span>OMR {total.toFixed(3)}</span>
            </div>
            <Button
              className="w-full h-12 text-base"
              variant="chonky"
              disabled={isCompleteDisabled}
              onClick={onPaymentComplete}
            >
              {isOnHoldMode ? "Confirm" : "Complete Payment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
