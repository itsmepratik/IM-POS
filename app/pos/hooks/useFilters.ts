"use client";

import { useState, useCallback } from "react";
import { Product } from "@/lib/hooks/data/useIntegratedPOSData";
import { useToast } from "@/components/ui/use-toast";

interface UseFiltersProps {
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

export function useFilters({
  products,
  addToCart,
  calculateCartCount,
  isMobile,
  setShowCart,
  setActiveCategory,
  setSearchQuery,
}: UseFiltersProps) {
  const { toast } = useToast();

  // Filter modal states
  const [isFilterBrandModalOpen, setIsFilterBrandModalOpen] = useState(false);
  const [selectedFilterType, setSelectedFilterType] = useState<string | null>(
    null,
  );
  const [selectedFilterBrand, setSelectedFilterBrand] = useState<string | null>(
    null,
  );
  const [selectedFilters, setSelectedFilters] = useState<
    Array<{ id: number; name: string; price: number; quantity: number }>
  >([]);

  /** Get filter products by type */
  const getFiltersByType = useCallback(
    (type: string) =>
      products.filter(
        (product) => product.category === "Filters" && product.type === type,
      ),
    [products],
  );

  /** Handle clicking a filter product */
  const handleFilterClick = useCallback(
    (filter: Product) => {
      // Check stock before adding to selection
      if (filter.availableQuantity <= 0) {
        toast({
          title: "Out of Stock",
          description: "This item is currently out of stock.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFilters((prev) => {
        const existing = prev.find((f) => f.id === filter.id);
        const currentSelected = existing ? existing.quantity : 0;
        const inCart = calculateCartCount(filter.id);

        // Check validation
        if (currentSelected + inCart + 1 > filter.availableQuantity) {
          toast({
            title: "Stock Limit Reached",
            description: `Only ${filter.availableQuantity} available.`,
            variant: "destructive",
          });
          return prev;
        }

        if (existing) {
          return prev.map((f) =>
            f.id === filter.id ? { ...f, quantity: f.quantity + 1 } : f,
          );
        }
        return [...prev, { ...filter, quantity: 1 }];
      });
    },
    [toast, calculateCartCount],
  );

  /** Handle quantity change for a selected filter */
  const handleFilterQuantityChange = useCallback(
    (filterId: number, change: number) => {
      setSelectedFilters((prev) => {
        // Find the filter to access availability
        const product = products.find((p) => p.id === filterId);
        const limit = product ? product.availableQuantity : 9999;
        const inCart = calculateCartCount(filterId);

        const existing = prev.find((f) => f.id === filterId);
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
          .map((f) =>
            f.id === filterId
              ? { ...f, quantity: Math.max(0, f.quantity + change) }
              : f,
          )
          .filter((f) => f.quantity > 0);
        return updated;
      });
    },
    [products, toast, calculateCartCount],
  );

  /** Add all selected filters to cart */
  const addFiltersToCart = useCallback((): boolean => {
    // Final check before bulk add
    let blocked = false;
    selectedFilters.forEach((filter) => {
      const product = products.find((p) => p.id === filter.id);
      const limit = product ? product.availableQuantity : 9999;
      const inCart = calculateCartCount(filter.id);

      if (inCart + filter.quantity > limit) {
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

    selectedFilters.forEach((filter) => {
      addToCart(
        {
          id: filter.id,
          name: filter.name,
          price: filter.price,
        },
        undefined,
        filter.quantity,
      );
    });
    return true;
  }, [selectedFilters, addToCart, products, calculateCartCount, toast]);

  /** Add selected filters to cart and close modal */
  const handleAddSelectedFiltersToCart = useCallback(() => {
    const success = addFiltersToCart();
    if (success) {
      setIsFilterBrandModalOpen(false);
      setSelectedFilters([]);
      if (isMobile) setShowCart(true);
    }
  }, [addFiltersToCart, isMobile, setShowCart]);

  /** Add filters to cart and navigate to next category */
  const handleNextFilterItem = useCallback(() => {
    const success = addFiltersToCart();
    if (success) {
      setActiveCategory("Parts");
      setIsFilterBrandModalOpen(false);
      setSelectedFilters([]);
      setSearchQuery("");
      // Do NOT show cart to allow flow to continue
    }
  }, [addFiltersToCart, setActiveCategory, setSearchQuery]);

  return {
    // State
    isFilterBrandModalOpen,
    setIsFilterBrandModalOpen,
    selectedFilterType,
    setSelectedFilterType,
    selectedFilterBrand,
    setSelectedFilterBrand,
    selectedFilters,
    setSelectedFilters,

    // Actions
    getFiltersByType,
    handleFilterClick,
    handleFilterQuantityChange,
    addFiltersToCart,
    handleAddSelectedFiltersToCart,
    handleNextFilterItem,
  };
}
