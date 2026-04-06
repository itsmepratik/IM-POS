"use client";

import { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { CartItem as CartItemType } from "../../types";

interface MobileCartProps {
  cart: CartItemType[];
  showCart: boolean;
  cartVisible: boolean;
  setShowCart: (show: boolean) => void;
  updateQuantity: (
    id: number,
    quantity: number,
    uniqueId?: string,
  ) => boolean | void;
  removeFromCart: (id: number, uniqueId?: string) => void;
  subtotal: number;
  total: number;
  discountAmount: number;
  appliedDiscount: { type: "percentage" | "amount"; value: number } | null;
  appliedTradeInAmount: number;
  isCheckoutLoading: boolean;
  cartContainsAnyBatteries: (cartItems: CartItemType[]) => boolean;
  onClearCart: () => void;
  onRemoveDiscount: () => void;
  onOpenDiscount: () => void;
  onOpenTradeIn: () => void;
  onCheckout: () => void;
  currentCustomer: any | null;
  onOpenCustomer: () => void;
  onRemoveCustomer: () => void;
}

export function MobileCart({
  cart,
  showCart,
  cartVisible,
  setShowCart,
  updateQuantity,
  removeFromCart,
  subtotal,
  total,
  discountAmount,
  appliedDiscount,
  appliedTradeInAmount,
  isCheckoutLoading,
  cartContainsAnyBatteries,
  onClearCart,
  onRemoveDiscount,
  onOpenDiscount,
  onOpenTradeIn,
  onCheckout,
  currentCustomer,
  onOpenCustomer,
  onRemoveCustomer,
}: MobileCartProps) {
  const mobileCartEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cart.length > 0 && showCart) {
      mobileCartEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [cart.length, showCart]);

  return (
    <div
      className={cn(
        "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:hidden transition-all duration-300",
        showCart
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none",
        !cartVisible && "hidden",
      )}
    >
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full sm:w-[400px] bg-background shadow-lg transition-transform duration-300 ease-out",
          showCart ? "translate-x-0" : "translate-x-full",
        )}
      >
        <Card className="h-full flex flex-col border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4">
            <CardTitle className="text-[clamp(1.125rem,3vw,1.25rem)]">
              Cart
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="chonky-destructive"
                className="flex items-center gap-2 text-[clamp(0.875rem,2vw,1rem)] h-auto px-4 py-[9px] rounded-[12px]"
                onClick={onClearCart}
                disabled={cart.length === 0}
              >
                <Trash2 className="h-4 w-4" />
                Clear Cart
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 bg-muted hover:bg-muted/80 text-foreground border border-input shadow-sm rounded-[12px] transition-colors"
                onClick={() => setShowCart(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
            <ScrollArea className="flex-1 -mx-4 px-4 overflow-y-auto">
              <div className="space-y-2 pb-2">
                {cart.map((item) => (
                  <CartItem
                    key={item.uniqueId}
                    item={item}
                    updateQuantity={updateQuantity}
                    removeFromCart={removeFromCart}
                  />
                ))}
                <div ref={mobileCartEndRef} />
              </div>
            </ScrollArea>
            <div className="mt-2 space-y-2 border-t pt-3 sticky bottom-0 bg-background w-full">
              <CartSummary
                cart={cart}
                subtotal={subtotal}
                total={total}
                discountAmount={discountAmount}
                appliedDiscount={appliedDiscount}
                appliedTradeInAmount={appliedTradeInAmount}
                isCheckoutLoading={isCheckoutLoading}
                cartContainsAnyBatteries={cartContainsAnyBatteries}
                onRemoveDiscount={onRemoveDiscount}
                onOpenDiscount={onOpenDiscount}
                onOpenTradeIn={onOpenTradeIn}
                onCheckout={onCheckout}
                currentCustomer={currentCustomer}
                onOpenCustomer={onOpenCustomer}
                onRemoveCustomer={onRemoveCustomer}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
