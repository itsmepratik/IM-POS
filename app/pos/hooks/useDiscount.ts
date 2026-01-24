"use client";

import { useState, useCallback } from "react";

export interface AppliedDiscount {
  type: "percentage" | "amount";
  value: number;
}

interface UseDiscountReturn {
  // State
  isDiscountDialogOpen: boolean;
  discountType: "percentage" | "amount";
  discountValue: number;
  appliedDiscount: AppliedDiscount | null;

  // Actions
  setIsDiscountDialogOpen: (open: boolean) => void;
  setDiscountType: (type: "percentage" | "amount") => void;
  setDiscountValue: (value: number) => void;
  applyDiscount: () => void;
  removeDiscount: () => void;
  calculateDiscountAmount: (subtotal: number) => number;
  resetDiscount: () => void;
}

export function useDiscount(): UseDiscountReturn {
  // Discount state
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [discountType, setDiscountType] = useState<"percentage" | "amount">("amount");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [appliedDiscount, setAppliedDiscount] = useState<AppliedDiscount | null>(null);

  // Apply the current discount values
  const applyDiscount = useCallback(() => {
    if (discountValue > 0) {
      setAppliedDiscount({
        type: discountType,
        value: discountValue,
      });
    }
    setIsDiscountDialogOpen(false);
  }, [discountType, discountValue]);

  // Remove applied discount
  const removeDiscount = useCallback(() => {
    setAppliedDiscount(null);
    setDiscountValue(0);
    setDiscountType("amount");
  }, []);

  // Calculate the discount amount based on subtotal
  const calculateDiscountAmount = useCallback((subtotal: number): number => {
    if (!appliedDiscount) return 0;
    
    if (appliedDiscount.type === "percentage") {
      return (subtotal * appliedDiscount.value) / 100;
    }
    return appliedDiscount.value;
  }, [appliedDiscount]);

  // Reset all discount state (useful after checkout)
  const resetDiscount = useCallback(() => {
    setAppliedDiscount(null);
    setDiscountValue(0);
    setDiscountType("amount");
    setIsDiscountDialogOpen(false);
  }, []);

  return {
    // State
    isDiscountDialogOpen,
    discountType,
    discountValue,
    appliedDiscount,

    // Actions
    setIsDiscountDialogOpen,
    setDiscountType,
    setDiscountValue,
    applyDiscount,
    removeDiscount,
    calculateDiscountAmount,
    resetDiscount,
  };
}
