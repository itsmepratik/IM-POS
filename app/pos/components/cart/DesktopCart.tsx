"use client";

import { useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { CartItem as CartItemType } from "../../types";

interface DesktopCartProps {
  cart: CartItemType[];
  updateQuantity: (uniqueId: string, quantity: number) => void;
  removeFromCart: (uniqueId: string) => void;
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
}

export function DesktopCart({
  cart,
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
}: DesktopCartProps) {
  const desktopCartEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cart.length > 0) {
      desktopCartEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [cart.length]);

  return (
    <div className="hidden lg:block lg:w-[400px] xl:w-[450px] 2xl:w-[500px]">
      <Card className="h-[calc(100vh-4rem)] flex flex-col">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 px-4">
          <CardTitle>Cart</CardTitle>
          <Button
            variant="chonky-destructive"
            className="flex items-center gap-2 rounded-[12px] px-4 py-[9px] h-auto"
            onClick={onClearCart}
            disabled={cart.length === 0}
          >
            <Trash2 className="h-4 w-4" />
            Clear Cart
          </Button>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-4 min-h-0">
          <ScrollArea className="flex-1 -mx-4 px-4">
            <div className="space-y-2 pb-2">
              {cart.map((item) => (
                <CartItem
                  key={item.uniqueId}
                  item={item}
                  updateQuantity={updateQuantity}
                  removeFromCart={removeFromCart}
                />
              ))}
              <div ref={desktopCartEndRef} />
            </div>
          </ScrollArea>
          <div className="pt-3 mt-auto border-t">
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
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
