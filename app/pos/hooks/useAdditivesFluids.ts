"use client";

import { useState, useCallback } from "react";
import { Product } from "@/lib/hooks/data/useIntegratedPOSData";
import { useToast } from "@/components/ui/use-toast";

interface SelectedAdditive {
  id: number;
  name: string;
  price: number;
  quantity: number;
  brand?: string;
}

interface UseAdditivesFluidsProps {
  products: Product[];
  addToCart: (
    product: { id: number; name: string; price: number; brand?: string },
    details?: string,
    quantity?: number,
    source?: string,
    bottleType?: string,
  ) => void;
  calculateCartCount: (productId: string | number) => number;
  isMobile: boolean;
  setShowCart: (show: boolean) => void;
}

export function useAdditivesFluids({
  products,
  addToCart,
  calculateCartCount,
  isMobile,
  setShowCart,
}: UseAdditivesFluidsProps) {
  const { toast } = useToast();
  const [selectedAdditives, setSelectedAdditives] = useState<SelectedAdditive[]>(
    [],
  );
  const [lastAddedAdditiveId, setLastAddedAdditiveId] = useState<number | null>(
    null,
  );

  const handleAdditiveClick = useCallback(
    (product: {
      id: number;
      name: string;
      price: number;
      brand?: string;
      availableQuantity?: number;
    }) => {
      const fullProduct = products.find((p) => p.id === product.id);
      const limit = fullProduct?.availableQuantity ?? product.availableQuantity ?? 9999;

      if (limit <= 0) {
        toast({
          title: "Out of Stock",
          description: "Item is out of stock.",
          variant: "destructive",
        });
        return;
      }

      setSelectedAdditives((prev) => {
        const existing = prev.find((p) => p.id === product.id);
        const currentQty = existing ? existing.quantity : 0;
        const inCart = calculateCartCount(product.id);

        if (currentQty + inCart + 1 > limit) {
          toast({
            title: "Stock Limit Reached",
            description: `Only ${limit} available.`,
            variant: "destructive",
          });
          return prev;
        }

        if (existing) {
          setLastAddedAdditiveId(product.id);
          return prev.map((p) =>
            p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p,
          );
        }
        setLastAddedAdditiveId(product.id);
        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            brand: product.brand,
            quantity: 1,
          },
        ];
      });
    },
    [products, toast, calculateCartCount],
  );

  const handleAdditiveQuantityChange = useCallback(
    (productId: number, change: number) => {
      setSelectedAdditives((prev) => {
        const fullProduct = products.find((p) => p.id === productId);
        const limit = fullProduct?.availableQuantity ?? 9999;
        const inCart = calculateCartCount(productId);
        const existing = prev.find((p) => p.id === productId);
        const currentQty = existing?.quantity || 0;

        if (change > 0 && currentQty + inCart + change > limit) {
          toast({
            title: "Stock Limit Reached",
            description: `Cannot add more. Limit is ${limit}.`,
            variant: "destructive",
          });
          return prev;
        }

        const updated = prev
          .map((p) =>
            p.id === productId
              ? { ...p, quantity: Math.max(0, p.quantity + change) }
              : p,
          )
          .filter((p) => p.quantity > 0);
        if (updated.length === 0) {
          setLastAddedAdditiveId(null);
        } else if (!updated.some((p) => p.id === lastAddedAdditiveId)) {
          setLastAddedAdditiveId(updated[updated.length - 1].id);
        }
        return updated;
      });
    },
    [products, toast, calculateCartCount, lastAddedAdditiveId],
  );

  const addSelectedAdditivesToCart = useCallback((): boolean => {
    let blocked = false;
    selectedAdditives.forEach((item) => {
      const fullProduct = products.find((p) => p.id === item.id);
      const limit = fullProduct?.availableQuantity ?? 9999;
      const inCart = calculateCartCount(item.id);

      if (inCart + item.quantity > limit) {
        blocked = true;
      }
    });

    if (blocked) {
      toast({
        title: "Stock Validation Failed",
        description:
          "Some items exceed available stock. Please adjust quantities.",
        variant: "destructive",
      });
      return false;
    }

    selectedAdditives.forEach((item) => {
      addToCart(
        {
          id: item.id,
          name: item.name,
          price: item.price,
          brand: item.brand,
        },
        undefined,
        item.quantity,
      );
    });
    return true;
  }, [selectedAdditives, addToCart, products, calculateCartCount, toast]);

  const handleAddSelectedAdditivesToCart = useCallback(() => {
    const success = addSelectedAdditivesToCart();
    if (success) {
      setSelectedAdditives([]);
      setLastAddedAdditiveId(null);
      if (isMobile) setShowCart(true);
    }
    return success;
  }, [addSelectedAdditivesToCart, isMobile, setShowCart]);

  const handleNextAdditiveItem = useCallback(() => {
    const success = addSelectedAdditivesToCart();
    if (success) {
      setSelectedAdditives([]);
      setLastAddedAdditiveId(null);
      if (isMobile) setShowCart(true);
    }
    return success;
  }, [addSelectedAdditivesToCart, isMobile, setShowCart]);

  const clearSelectedAdditives = useCallback(() => {
    setSelectedAdditives([]);
    setLastAddedAdditiveId(null);
  }, []);

  return {
    selectedAdditives,
    setSelectedAdditives,
    lastAddedAdditiveId,
    handleAdditiveClick,
    handleAdditiveQuantityChange,
    handleAddSelectedAdditivesToCart,
    handleNextAdditiveItem,
    clearSelectedAdditives,
  };
}
