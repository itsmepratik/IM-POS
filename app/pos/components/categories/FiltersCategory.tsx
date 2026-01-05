"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { BrandCard } from "../shared/BrandCard";
import { Brand } from "@/lib/services/inventoryService";
import { useImagePreloader } from "@/lib/hooks/useImagePreloader";
import { POSProduct } from "@/lib/types/unified-product";

interface FiltersCategoryProps {
  searchQuery?: string;
  selectedFilterType: string | null;
  setSelectedFilterType: (type: string | null) => void;
  setSelectedFilterBrand: (brand: string) => void;
  setSelectedFilters: (
    filters: Array<{
      id: number;
      name: string;
      price: number;
      quantity: number;
    }>
  ) => void;
  setIsFilterBrandModalOpen: (open: boolean) => void;
  filterTypes: string[];
  filterBrands: string[];
  brands?: Brand[];
  products: POSProduct[];
  isLoading: boolean;
}

export function FiltersCategory({
  searchQuery = "",
  selectedFilterType,
  setSelectedFilterType,
  setSelectedFilterBrand,
  setSelectedFilters,
  setIsFilterBrandModalOpen,
  filterTypes,
  filterBrands,
  brands,
  products,
  isLoading,
}: FiltersCategoryProps) {
  // Get brands for a specific filter type
  const getBrandsForType = useMemo(() => {
    return (type: string): string[] => {
      return Array.from(
        new Set(
          products
            .filter(
              (p) =>
                p.category === "Filters" &&
                p.type === type &&
                p.brand
            )
            .map((p) => p.brand!)
        )
      );
    };
  }, [products]);

  // Extract brand image URLs for preloading
  const brandImageUrls = React.useMemo(() => {
    if (!brands) return [];

    return filterBrands
      .map((brandName) => {
        const brandData = brands.find(
          (b) => b.name.toLowerCase() === brandName.toLowerCase()
        );
        return brandData?.image_url || null;
      })
      .filter((url): url is string => url !== null);
  }, [brands, filterBrands]);

  // Preload brand images
  const { totalImages, isPreloading } = useImagePreloader({
    urls: brandImageUrls,
    enabled: !isLoading && brandImageUrls.length > 0,
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="h-6 bg-gray-200 animate-pulse rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {filterTypes
        .filter((type) =>
          type.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map((type) => (
          <div key={type} className="border rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              className="w-full p-4 flex items-center justify-between hover:bg-accent"
              onClick={() =>
                setSelectedFilterType(selectedFilterType === type ? null : type)
              }
            >
              <span className="font-semibold text-lg">{type}</span>
              {/* Assuming 'filter' and its 'price' property would be available here if a price display is intended */}
              {/* This part of the change is syntactically incorrect in the original context.
                  If you intended to add a price display, please ensure 'filter' is defined
                  and placed correctly within the JSX structure.
                  For now, I'm placing it as a placeholder next to the type name, assuming 'filter'
                  would be derived from 'type' or another source. */}
              {/* Example of how it might look if 'filter' was available and you wanted to display a price: */}
              {/* {filter && (
                <span className="font-medium text-[clamp(0.75rem,1.5vw,0.85rem)] text-foreground">
                  OMR {filter.price.toFixed(3)}
                </span>
              )} */}
              {selectedFilterType === type ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
            {selectedFilterType === type && (
              <div
                className="p-4 bg-muted/50 grid gap-4 grid-cols-2 md:grid-cols-4"
              >
                {getBrandsForType(type).map((brand) => (
                  <BrandCard
                    key={brand}
                    brand={brand}
                    brands={brands}
                    onClick={() => {
                      setSelectedFilterBrand(brand);
                      setSelectedFilters([]);
                      setIsFilterBrandModalOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
    </div>
  );
}
