"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CartItem as CartItemType } from "../../types";
import { BillComponent } from "../bill-component";
import { ReceiptComponent } from "../receipt-component";

interface ReceiptPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cart: CartItemType[];
  cartContainsOnlyBatteries: (cartItems: CartItemType[]) => boolean;
  transactionData: {
    receiptNumber: string;
    currentDate: string;
    currentTime: string;
  };
  selectedCashier: { id: string; name: string } | null;
  appliedDiscount: { type: "percentage" | "amount"; value: number } | null;
  appliedTradeInAmount: number;
  customerName: string;
  carPlateNumber: string;
  selectedPaymentMethod: string | null;
  paymentRecipient: string | null;
  onClose: () => void;
  resetPOSState: () => void;
}

export function ReceiptPreviewDialog({
  open,
  onOpenChange,
  cart,
  cartContainsOnlyBatteries,
  transactionData,
  selectedCashier,
  appliedDiscount,
  appliedTradeInAmount,
  customerName,
  carPlateNumber,
  selectedPaymentMethod,
  paymentRecipient,
  onClose,
  resetPOSState,
}: ReceiptPreviewDialogProps) {
  if (!open) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(openState) => {
        onOpenChange(openState);
        if (!openState) {
          resetPOSState();
        }
      }}
    >
      <DialogContent className="w-[95%] max-w-[520px] p-4 rounded-lg max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {cartContainsOnlyBatteries(cart)
              ? "Bill Preview"
              : "Receipt Preview"}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          {cartContainsOnlyBatteries(cart) ? (
            <BillComponent
              key={`bill-${transactionData.receiptNumber || "fallback"}`}
              cart={cart}
              billNumber={transactionData.receiptNumber || "PENDING"}
              currentDate={
                transactionData.currentDate ||
                new Date().toLocaleDateString("en-GB")
              }
              currentTime={
                transactionData.currentTime ||
                new Date().toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              }
              cashier={selectedCashier?.name ?? undefined}
              appliedDiscount={appliedDiscount}
              appliedTradeInAmount={appliedTradeInAmount}
              customerName={customerName}
              carPlateNumber={carPlateNumber}
              onClose={onClose}
            />
          ) : (
            <ReceiptComponent
              key={`receipt-${transactionData.receiptNumber || "fallback"}`}
              cart={cart}
              paymentMethod={selectedPaymentMethod || "cash"}
              cashier={selectedCashier?.name ?? undefined}
              discount={appliedDiscount}
              paymentRecipient={
                selectedPaymentMethod === "mobile"
                  ? paymentRecipient
                  : undefined
              }
              receiptNumber={transactionData.receiptNumber || "PENDING"}
              currentDate={
                transactionData.currentDate ||
                new Date().toLocaleDateString("en-GB")
              }
              currentTime={
                transactionData.currentTime ||
                new Date().toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })
              }
              onClose={onClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
