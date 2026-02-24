"use client";

import { useCallback } from "react";
import { CartItem } from "../types";
import { Product } from "@/lib/hooks/data/useIntegratedPOSData";
import { useToast } from "@/components/ui/use-toast";

/**
 * Helper to check if a type string indicates a battery
 * (case-insensitive, handles both singular and plural).
 */
function isBatteryType(type?: string): boolean {
  if (!type) return false;
  const normalizedType = type.toLowerCase().trim();
  return normalizedType === "battery" || normalizedType === "batteries";
}

interface UseCartHelpersProps {
  cart: CartItem[];
  products: Product[];
  addToCart: (
    product: { id: number; name: string; price: number },
    details?: string,
    quantity?: number,
    source?: string,
    bottleType?: string,
  ) => void;
}

export function useCartHelpers({
  cart,
  products,
  addToCart,
}: UseCartHelpersProps) {
  const { toast } = useToast();

  /** Calculate total closed bottles of a specific product already in cart */
  const calculateCartClosedCount = useCallback(
    (productId: string | number): number => {
      return cart.reduce((total, item) => {
        const matches = item.id === productId || item.originalId === productId;
        if (
          matches &&
          (item.source === "CLOSED" ||
            (!item.source && !item.bottleType) ||
            item.bottleType === "closed")
        ) {
          return total + (item.quantity || 0);
        }
        return total;
      }, 0);
    },
    [cart],
  );

  /** Calculate total open volume of a specific product already in cart */
  const calculateCartOpenVolume = useCallback(
    (productId: string | number): number => {
      return cart.reduce((total, item) => {
        const matches = item.id === productId || item.originalId === productId;
        if (matches && (item.source === "OPEN" || item.bottleType === "open")) {
          return total + (item.quantity || 0);
        }
        return total;
      }, 0);
    },
    [cart],
  );

  /** Generic helper to calculate total quantity of any product in cart (excludes lubricant volume entries) */
  const calculateCartCount = useCallback(
    (productId: string | number): number => {
      return cart.reduce((total, item) => {
        const matches = item.id === productId || item.originalId === productId;
        if (
          matches &&
          !item.bottleType &&
          item.source !== "OPEN" &&
          item.source !== "CLOSED"
        ) {
          return total + (item.quantity || 0);
        }
        return total;
      }, 0);
    },
    [cart],
  );

  /** Check if the cart contains only batteries */
  const cartContainsOnlyBatteries = useCallback(
    (cartItems: CartItem[]): boolean => {
      if (cartItems.length === 0) return false;

      const actualProductItems = cartItems.filter(
        (item) => !item.name.toLowerCase().includes("discount on old battery"),
      );

      if (actualProductItems.length === 0) return false;

      return actualProductItems.every((item) => {
        const productInfo = products.find((p) => p.id === item.id);
        const isProductBattery =
          productInfo?.category === "Parts" && isBatteryType(productInfo?.type);
        const isCartItemBattery =
          item.category === "Parts" && isBatteryType(item.type);
        return isProductBattery || isCartItemBattery;
      });
    },
    [products],
  );

  /** Check if the cart contains any battery products */
  const cartContainsAnyBatteries = useCallback(
    (cartItems: CartItem[]): boolean => {
      if (cartItems.length === 0) return false;
      return cartItems.some((item) => {
        const productInfo = products.find((p) => p.id === item.id);
        const isProductBattery =
          productInfo?.category === "Parts" && isBatteryType(productInfo?.type);
        const isCartItemBattery =
          item.category === "Parts" && isBatteryType(item.type);
        return isProductBattery || isCartItemBattery;
      });
    },
    [products],
  );

  /** Add to cart with stock validation */
  const handleSafeAddToCart = useCallback(
    (
      item: { id: number; name: string; price: number },
      details?: string,
      quantity = 1,
      source?: string,
      bottleType?: string,
    ) => {
      const product = products.find((p) => p.id === item.id);

      if (product) {
        const currentInCart = calculateCartCount(item.id);
        const available = product.availableQuantity;

        if (currentInCart + quantity > available) {
          toast({
            title: "Stock Limit Reached",
            description: `Only ${available} available. You already have ${currentInCart} in cart.`,
            variant: "destructive",
          });
          return;
        }
      }

      addToCart(item, details, quantity, source, bottleType);
    },
    [products, calculateCartCount, addToCart, toast],
  );

  return {
    calculateCartClosedCount,
    calculateCartOpenVolume,
    calculateCartCount,
    cartContainsOnlyBatteries,
    cartContainsAnyBatteries,
    handleSafeAddToCart,
  };
}
