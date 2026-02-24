"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Smartphone,
  Banknote,
  CreditCard,
  ChevronDown,
  Ticket,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CartItem } from "../../types";

interface CheckoutModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPaymentMethod:
    | "card"
    | "cash"
    | "mobile"
    | "on-hold"
    | "credit"
    | null;
  setSelectedPaymentMethod: (
    method: "card" | "cash" | "mobile" | "on-hold" | "credit" | null,
  ) => void;
  showOtherOptions: boolean;
  setShowOtherOptions: (show: boolean) => void;
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
}

export function CheckoutModal({
  isOpen,
  onOpenChange,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  showOtherOptions,
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
}: CheckoutModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!showSuccess) {
          onOpenChange(open);
          if (!open) {
            setShowOtherOptions(false);
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
          <div
            className={cn(
              "grid gap-4",
              showOtherOptions ? "grid-cols-2" : "grid-cols-3",
            )}
          >
            <Button
              variant={
                selectedPaymentMethod === "mobile" ? "chonky" : "outline"
              }
              className={cn(
                "h-24 flex flex-col items-center justify-center gap-2",
                selectedPaymentMethod === "mobile" && "ring-2 ring-primary",
              )}
              onClick={() => {
                setSelectedPaymentMethod("mobile");
                setShowOtherOptions(false);
                setIsOnHoldMode(false);
                setCarPlateNumber("");
              }}
            >
              <Smartphone className="w-6 h-6" />
              <span>Mobile Pay</span>
            </Button>
            <Button
              variant={selectedPaymentMethod === "cash" ? "chonky" : "outline"}
              className={cn(
                "h-24 flex flex-col items-center justify-center gap-2",
                selectedPaymentMethod === "cash" && "ring-2 ring-primary",
              )}
              onClick={() => {
                setSelectedPaymentMethod("cash");
                setShowOtherOptions(false);
                setIsOnHoldMode(false);
                setCarPlateNumber("");
                setPaymentRecipient(null);
              }}
            >
              <Banknote className="w-6 h-6" />
              <span>Cash</span>
            </Button>
            <Button
              variant={showOtherOptions ? "chonky" : "outline"}
              className={cn(
                "h-24 flex flex-col items-center justify-center gap-2",
                (selectedPaymentMethod === "card" ||
                  selectedPaymentMethod === "on-hold" ||
                  selectedPaymentMethod === "credit") &&
                  "ring-2 ring-primary",
              )}
              onClick={() => {
                setShowOtherOptions(!showOtherOptions);
                if (!showOtherOptions) {
                  setSelectedPaymentMethod(null);
                }
              }}
            >
              <ChevronDown className="w-6 h-6" />
              <span>Other</span>
            </Button>
          </div>

          {showOtherOptions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-3 gap-4"
            >
              <Button
                variant={
                  selectedPaymentMethod === "card" ? "chonky" : "outline"
                }
                className={cn(
                  "h-24 flex flex-col items-center justify-center gap-2",
                  selectedPaymentMethod === "card" && "ring-2 ring-primary",
                )}
                onClick={() => {
                  setSelectedPaymentMethod("card");
                  setIsOnHoldMode(false);
                  setCarPlateNumber("");
                  setPaymentRecipient(null);
                }}
              >
                <CreditCard className="w-6 h-6" />
                <span>Card</span>
              </Button>
              <Button
                variant={
                  selectedPaymentMethod === "on-hold" ? "chonky" : "outline"
                }
                className={cn(
                  "h-24 flex flex-col items-center justify-center gap-2",
                  selectedPaymentMethod === "on-hold" && "ring-2 ring-primary",
                )}
                onClick={() => {
                  setSelectedPaymentMethod("on-hold");
                  setIsOnHoldMode(true);
                  setCarPlateNumber("");
                  setPaymentRecipient(null);
                }}
              >
                <Ticket className="w-6 h-6" />
                <span>on-hold</span>
              </Button>
              <Button
                variant={
                  selectedPaymentMethod === "credit" ? "chonky" : "outline"
                }
                className={cn(
                  "h-24 flex flex-col items-center justify-center gap-2",
                  selectedPaymentMethod === "credit" && "ring-2 ring-primary",
                )}
                onClick={() => {
                  setSelectedPaymentMethod("credit");
                  setIsOnHoldMode(false);
                  setCarPlateNumber("");
                  setPaymentRecipient(null);
                }}
              >
                <Receipt className="w-6 h-6" />
                <span>Credit</span>
              </Button>
            </motion.div>
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
                  {staffMembers
                    .filter((staff) => {
                      const staffId = staff.id;
                      return staffId === "0020" || staffId === "0010";
                    })
                    .map((staff) => (
                      <Button
                        key={staff.id}
                        variant={
                          paymentRecipient === staff.name ? "chonky" : "outline"
                        }
                        className={cn(
                          "h-10 text-center",
                          paymentRecipient === staff.name &&
                            "ring-2 ring-primary",
                        )}
                        onClick={() => setPaymentRecipient(staff.name)}
                      >
                        {staff.id === "0010" ? "Foreman" : staff.name}
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
              disabled={
                !selectedPaymentMethod ||
                (selectedPaymentMethod === "mobile" && !paymentRecipient) ||
                ((isOnHoldMode || cartContainsAnyBatteries(cart)) &&
                  !carPlateNumber.trim())
              }
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
