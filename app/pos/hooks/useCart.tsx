"use client";

import { useCart as useCartContext } from "../context/CartContext";
import { CartItem } from "../types";

// Re-export the context hook for convenience
export function useCart() {
  return useCartContext();
}

// Additional utility functions for cart management
export function calculateCartTotals(cart: CartItem[]) {
  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  const vatAmount = 0;
  const total = subtotal;

  return {
    subtotal,
    vatAmount,
    total,
  };
}

export function formatCartForReceipt(cart: CartItem[]) {
  return cart.map((item) => ({
    ...item,
    lineTotal: item.price * item.quantity,
  }));
}

export function getCartSummary(cart: CartItem[]) {
  const itemCount = cart.reduce((count, item) => count + item.quantity, 0);
  const totals = calculateCartTotals(cart);

  return {
    itemCount,
    ...totals,
  };
}
