"use client";

import { Button } from "@/components/ui/button";
import { X, Scissors, PercentIcon, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { CartItem as CartItemType } from "../../types";

interface CartSummaryProps {
  cart: CartItemType[];
  subtotal: number;
  total: number;
  discountAmount: number;
  appliedDiscount: { type: "percentage" | "amount"; value: number } | null;
  appliedTradeInAmount: number;
  isCheckoutLoading: boolean;
  cartContainsAnyBatteries: (cartItems: CartItemType[]) => boolean;
  onRemoveDiscount: () => void;
  onOpenDiscount: () => void;
  onOpenTradeIn: () => void;
  onCheckout: () => void;
  currentCustomer: any | null;
  onOpenCustomer: () => void;
  onRemoveCustomer: () => void;
}

export function CartSummary({
  cart,
  subtotal,
  total,
  discountAmount,
  appliedDiscount,
  appliedTradeInAmount,
  isCheckoutLoading,
  cartContainsAnyBatteries,
  onRemoveDiscount,
  onOpenDiscount,
  onOpenTradeIn,
  onCheckout,
  currentCustomer,
  onOpenCustomer,
  onRemoveCustomer,
}: CartSummaryProps) {
  return (
    <>
      <div className="space-y-1 mb-2">
        <div className="flex justify-between text-[clamp(1rem,2.5vw,1.125rem)] font-semibold">
          <span>Subtotal</span>
          <span>OMR {subtotal.toFixed(3)}</span>
        </div>

        {appliedDiscount && (
          <div className="flex justify-between text-[clamp(0.875rem,2vw,1rem)] text-muted-foreground">
            <div className="flex justify-between items-center">
              <span>
                Discount{" "}
                {appliedDiscount.type === "percentage"
                  ? `(${appliedDiscount.value}%)`
                  : "(Amount)"}
              </span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 rounded-full"
                onClick={onRemoveDiscount}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <span>- OMR {discountAmount.toFixed(3)}</span>
          </div>
        )}

        {appliedTradeInAmount > 0 && (
          <div className="flex justify-between text-[clamp(0.875rem,2vw,1rem)] text-green-600">
            <span>Trade-In Amount</span>
            <span>- OMR {appliedTradeInAmount.toFixed(3)}</span>
          </div>
        )}

        <div className="flex justify-between text-[clamp(1rem,2.5vw,1.125rem)] font-semibold">
          <span>Total</span>
          <span>OMR {total.toFixed(3)}</span>
        </div>
      </div>

      <div className="space-y-2">
        {/* Customer Row */}
        <div className="flex w-full min-w-0">
          {currentCustomer ? (
            <>
              <Button
                variant="chonky-secondary"
                className={cn(
                  "h-auto py-[9px] rounded-[12px] rounded-r-none flex items-center justify-center gap-2 bg-blue-50 border border-blue-200 border-r-0 text-blue-700 hover:bg-blue-100 flex-1 min-w-0 px-2",
                )}
                onClick={onOpenCustomer}
                disabled={cart.length === 0}
              >
                <User className="h-4 w-4 shrink-0" />
                <span className="truncate block max-w-full text-left font-medium">
                  {currentCustomer.name}
                </span>
              </Button>
              <Button
                variant="chonky-secondary"
                className={cn(
                  "h-auto py-[9px] px-3 rounded-[12px] rounded-l-none border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 shrink-0 border-l border-l-blue-300",
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveCustomer();
                }}
                disabled={cart.length === 0}
                title="Remove Customer"
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              variant="chonky-secondary"
              className={cn(
                "h-auto py-[9px] rounded-[12px] flex items-center justify-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 flex-1 min-w-0",
              )}
              onClick={onOpenCustomer}
              disabled={cart.length === 0}
            >
              <User className="h-4 w-4 shrink-0" />
              <span className="truncate block max-w-full">Add Customer</span>
            </Button>
          )}
        </div>

        {/* Action & Checkout Row */}
        <div className="flex gap-2">
          {/* Discount Button */}
          <Button
            variant="chonky-secondary"
            className={cn(
              "h-auto py-[9px] rounded-[12px] flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800",
              cartContainsAnyBatteries(cart) ? "flex-[0.5]" : "flex-[0.5]",
            )}
            onClick={onOpenDiscount}
            disabled={cart.length === 0}
          >
            <Scissors className="h-4 w-4 shrink-0" />
            <span className="truncate hidden sm:inline-block">
              {appliedDiscount ? "Edit Discount" : "Discount"}
            </span>
          </Button>

          {/* Trade In Button (Optional) */}
          {cartContainsAnyBatteries(cart) && (
            <Button
              variant="chonky-secondary"
              className="h-auto py-[9px] rounded-[12px] flex-[0.5] flex items-center justify-center gap-2 bg-secondary hover:bg-accent text-foreground border-input border"
              onClick={onOpenTradeIn}
              disabled={cart.length === 0}
            >
              <PercentIcon className="h-4 w-4 shrink-0" />
              <span className="truncate hidden sm:inline-block">
                {appliedTradeInAmount > 0 ? "Edit Trade-In" : "Trade In"}
              </span>
            </Button>
          )}

          {/* Checkout Button */}
          <Button
            variant="chonky"
            className="flex-1 h-auto py-[9px] rounded-[12px]"
            disabled={cart.length === 0 || isCheckoutLoading}
            onClick={onCheckout}
          >
            {isCheckoutLoading ? (
              <div className="flex items-center justify-center w-full">
                <Spinner className="text-black mr-2" />
                Processing...
              </div>
            ) : (
              "Checkout"
            )}
          </Button>
        </div>
      </div>
    </>
  );
}
