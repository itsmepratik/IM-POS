"use client";

import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { BrandCard } from "../shared/BrandCard";
import { Brand } from "@/lib/services/inventoryService";
import { useImagePreloader } from "@/lib/hooks/useImagePreloader";
import { POSProduct } from "@/lib/types/unified-product";

interface Part {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface PartsCategoryProps {
  searchQuery?: string;
  selectedPartType: string | null;
  setSelectedPartType: (type: string | null) => void;
  setSelectedPartBrand: (brand: string) => void;
  setSelectedParts: (parts: Part[]) => void;
  setIsPartBrandModalOpen: (open: boolean) => void;
  partTypes: string[];
  partBrands: string[];
  brands?: Brand[];
  products: POSProduct[];
  isLoading: boolean;
}

export function PartsCategory({
  searchQuery = "",
  selectedPartType,
  setSelectedPartType,
  setSelectedPartBrand,
  setSelectedParts,
  setIsPartBrandModalOpen,
  partTypes,
  partBrands,
  brands,
  products,
  isLoading,
}: PartsCategoryProps) {
  // Get brands for a specific part type
  const getBrandsForType = useMemo(() => {
    return (type: string): string[] => {
      return Array.from(
        new Set(
          products
            .filter(
              (p) =>
                p.category === "Parts" &&
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

    return partBrands
      .map((brandName) => {
        const brandData = brands.find(
          (b) => b.name.toLowerCase() === brandName.toLowerCase()
        );
        return brandData?.imageUrl || null;
      })
      .filter((url): url is string => url !== null);
  }, [brands, partBrands]);

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
      {partTypes
        .filter((type) =>
          type.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map((type) => (
          <div key={type} className="border rounded-lg overflow-hidden">
            <Button
              variant="ghost"
              className="w-full p-4 flex items-center justify-between hover:bg-accent"
              onClick={() =>
                setSelectedPartType(selectedPartType === type ? null : type)
              }
            >
              <span className="font-semibold text-lg">{type}</span>
              {selectedPartType === type ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
            {selectedPartType === type && (
              <div
                className="p-4 bg-muted/50 grid gap-4 grid-cols-2 md:grid-cols-4"
              >
                {getBrandsForType(type).map((brand) => (
                  <BrandCard
                    key={brand}
                    brand={brand}
                    brands={brands}
                    onClick={() => {
                      setSelectedPartBrand(brand);
                      setSelectedParts([]);
                      setIsPartBrandModalOpen(true);
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
