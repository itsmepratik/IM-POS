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
    0
  );

  // Apply 5% VAT (this is just an example - adjust according to local regulations)
  const vatRate = 0.05;
  const vatAmount = subtotal * vatRate;
  const total = subtotal + vatAmount;

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



