"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { X, Minus, Plus } from "lucide-react";
import { CartItem as CartItemType } from "../types";

interface CartItemProps {
  item: CartItemType;
  updateQuantity: (id: number, quantity: number, uniqueId?: string) => void;
  removeFromCart: (id: number, uniqueId?: string) => void;
}

export const CartItem = memo(
  ({ item, updateQuantity, removeFromCart }: CartItemProps) => (
    <div className="grid grid-cols-[1fr_auto] gap-3 py-3 first:pt-0 items-start border-b last:border-b-0">
      {/* Item details */}
      <div className="min-w-0">
        <div className="font-medium text-[clamp(0.875rem,2vw,1rem)] mb-1">
          {item.name}
        </div>
        <div className="text-[clamp(0.75rem,1.5vw,0.875rem)] text-muted-foreground">
          OMR {item.price.toFixed(3)} each
        </div>
        <div className="font-medium text-[clamp(0.875rem,2vw,1rem)] mt-1">
          OMR {(item.price * item.quantity).toFixed(3)}
        </div>
      </div>

      {/* Right side controls: quantity and delete */}
      <div className="flex flex-col gap-2 items-end">
        {/* Delete button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={() => removeFromCart(item.id, item.uniqueId)}
          aria-label="Remove item"
        >
          <X className="h-3 w-3" />
        </Button>

        {/* Quantity controls - horizontal */}
        <div className="flex items-center gap-1 mt-1">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() =>
              updateQuantity(
                item.id,
                Math.max(1, item.quantity - 1),
                item.uniqueId
              )
            }
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-5 text-center font-medium text-xs">
            {item.quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() =>
              updateQuantity(item.id, item.quantity + 1, item.uniqueId)
            }
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
);
CartItem.displayName = "CartItem";
