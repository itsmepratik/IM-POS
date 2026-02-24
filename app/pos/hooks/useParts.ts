"use client";

import { useState, useCallback } from "react";
import { Product } from "@/lib/hooks/data/useIntegratedPOSData";
import { useToast } from "@/components/ui/use-toast";

interface UsePartsProps {
  products: Product[];
  addToCart: (
    product: { id: number; name: string; price: number },
    details?: string,
    quantity?: number,
    source?: string,
    bottleType?: string,
  ) => void;
  calculateCartCount: (productId: string | number) => number;
  isMobile: boolean;
  setShowCart: (show: boolean) => void;
  setActiveCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
}

export function useParts({
  products,
  addToCart,
  calculateCartCount,
  isMobile,
  setShowCart,
  setActiveCategory,
  setSearchQuery,
}: UsePartsProps) {
  const { toast } = useToast();

  // Parts modal states
  const [isPartBrandModalOpen, setIsPartBrandModalOpen] = useState(false);
  const [selectedPartType, setSelectedPartType] = useState<string | null>(null);
  const [selectedPartBrand, setSelectedPartBrand] = useState<string | null>(
    null,
  );
  const [selectedParts, setSelectedParts] = useState<
    Array<{ id: number; name: string; price: number; quantity: number }>
  >([]);

  /** Get parts products by type */
  const getPartsByType = useCallback(
    (type: string) =>
      products.filter(
        (product) => product.category === "Parts" && product.type === type,
      ),
    [products],
  );

  /** Handle clicking a part product */
  const handlePartClick = useCallback(
    (part: { id: number; name: string; price: number }) => {
      // Check initial stock
      const product = products.find((p) => p.id === part.id);
      if (product && product.availableQuantity <= 0) {
        toast({
          title: "Out of Stock",
          description: "Item is out of stock.",
          variant: "destructive",
        });
        return;
      }

      setSelectedParts((prev) => {
        const existing = prev.find((p) => p.id === part.id);
        const currentQty = existing ? existing.quantity : 0;
        const inCart = calculateCartCount(part.id);
        const limit = product ? product.availableQuantity : 9999;

        if (currentQty + inCart + 1 > limit) {
          toast({
            title: "Stock Limit Reached",
            description: `Only ${limit} available.`,
            variant: "destructive",
          });
          return prev;
        }

        if (existing) {
          return prev.map((p) =>
            p.id === part.id ? { ...p, quantity: p.quantity + 1 } : p,
          );
        }
        return [...prev, { ...part, quantity: 1 }];
      });
    },
    [products, toast, calculateCartCount],
  );

  /** Handle quantity change for a selected part */
  const handlePartQuantityChange = useCallback(
    (partId: number, change: number) => {
      setSelectedParts((prev) => {
        // Check limits
        const product = products.find((p) => p.id === partId);
        const limit = product ? product.availableQuantity : 9999;
        const inCart = calculateCartCount(partId);
        const existing = prev.find((p) => p.id === partId);
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
            p.id === partId
              ? { ...p, quantity: Math.max(0, p.quantity + change) }
              : p,
          )
          .filter((p) => p.quantity > 0);
        return updated;
      });
    },
    [products, toast, calculateCartCount],
  );

  /** Add all selected parts to cart */
  const handleAddSelectedPartsToCart = useCallback(() => {
    // Volume/Bulk check
    let blocked = false;
    selectedParts.forEach((part) => {
      const product = products.find((p) => p.id === part.id);
      const limit = product ? product.availableQuantity : 9999;
      const inCart = calculateCartCount(part.id);

      if (inCart + part.quantity > limit) {
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
      return;
    }

    selectedParts.forEach((part) => {
      addToCart(
        {
          id: part.id,
          name: part.name,
          price: part.price,
        },
        undefined,
        part.quantity,
      );
    });
    setIsPartBrandModalOpen(false);
    setSelectedParts([]);
    setSelectedPartType(null);
    if (isMobile) setShowCart(true);
  }, [
    selectedParts,
    addToCart,
    products,
    calculateCartCount,
    toast,
    isMobile,
    setShowCart,
  ]);

  /** Add parts to cart and navigate to next step */
  const handleNextPartItem = useCallback(() => {
    handleAddSelectedPartsToCart();
    setActiveCategory("Additives & Fluids");
    setSearchQuery("");
  }, [handleAddSelectedPartsToCart, setActiveCategory, setSearchQuery]);

  return {
    // State
    isPartBrandModalOpen,
    setIsPartBrandModalOpen,
    selectedPartType,
    setSelectedPartType,
    selectedPartBrand,
    setSelectedPartBrand,
    selectedParts,
    setSelectedParts,

    // Actions
    getPartsByType,
    handlePartClick,
    handlePartQuantityChange,
    handleAddSelectedPartsToCart,
    handleNextPartItem,
  };
}
