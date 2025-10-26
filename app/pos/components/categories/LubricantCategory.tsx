"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, ImageIcon } from "lucide-react";
import Image from "next/image";
import {
  isValidImageUrl,
  cacheImageValid,
  cacheImageInvalid,
} from "@/lib/utils/imageCache";
import { useImagePreloader } from "@/lib/hooks/useImagePreloader";
import { ImageErrorFallback } from "@/components/ui/image-error-boundary";

interface LubricantProduct {
  id: number;
  brand: string;
  name: string;
  basePrice: number;
  type: string;
  image?: string;
  volumes: {
    size: string;
    price: number;
    availableQuantity?: number;
  }[];
}

interface LubricantCategoryProps {
  searchQuery?: string;
  expandedBrand: string | null;
  setExpandedBrand: (brand: string | null) => void;
  onLubricantSelect: (lubricant: LubricantProduct) => void;
  lubricantProducts: LubricantProduct[];
  lubricantBrands: string[];
  isLoading: boolean;
}

export function LubricantCategory({
  searchQuery = "",
  expandedBrand,
  setExpandedBrand,
  onLubricantSelect,
  lubricantProducts,
  lubricantBrands,
  isLoading,
}: LubricantCategoryProps) {
  // Filter brands based on search query
  const filteredLubricantBrands = useMemo(() => {
    return lubricantBrands.filter((brand) =>
      brand.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, lubricantBrands]);

  // Extract lubricant product image URLs for preloading
  const lubricantImageUrls = useMemo(() => {
    return lubricantProducts
      .filter((product) => product.image && isValidImageUrl(product.image))
      .map((product) => product.image!);
  }, [lubricantProducts]);

  // Preload lubricant product images
  const {
    totalImages: lubricantImageCount,
    isPreloading: isPreloadingLubricants,
  } = useImagePreloader({
    urls: lubricantImageUrls,
    enabled: !isLoading && lubricantImageUrls.length > 0,
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
      {filteredLubricantBrands.map((brand) => (
        <div key={brand} className="border rounded-lg overflow-hidden">
          <Button
            variant="ghost"
            className="w-full p-4 flex items-center justify-between hover:bg-accent"
            onClick={() =>
              setExpandedBrand(expandedBrand === brand ? null : brand)
            }
          >
            <span className="font-semibold text-lg">{brand}</span>
            {expandedBrand === brand ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </Button>
          {expandedBrand === brand && (
            <div className="p-4 bg-muted/50 grid grid-cols-2 sm:grid-cols-3 gap-4">
              {lubricantProducts
                .filter((lubricant) => lubricant.brand === brand)
                .map((lubricant) => (
                  <Button
                    key={lubricant.id}
                    variant="outline"
                    className="border-2 rounded-[33px] flex flex-col items-center justify-between p-3 sm:p-4 h-[160px] sm:h-[180px] md:h-[200px] overflow-hidden"
                    onClick={() => onLubricantSelect(lubricant)}
                  >
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mt-1 mb-1">
                      {lubricant.image ? (
                        <ImageErrorFallback
                          onError={(error) => {
                            cacheImageInvalid(lubricant.image!);
                            console.error(
                              `Error loading lubricant image for ${lubricant.brand} ${lubricant.type}:`,
                              error
                            );
                          }}
                          className="w-full h-full rounded-md"
                        >
                          <Image
                            src={lubricant.image}
                            alt={`${lubricant.brand} ${lubricant.type}`}
                            className="object-contain rounded-md transition-opacity duration-200"
                            fill
                            sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, (max-width: 1024px) 96px, 128px"
                            onError={(e) => {
                              cacheImageInvalid(lubricant.image!);
                              e.currentTarget.onerror = null;
                            }}
                            onLoad={() => {
                              if (lubricant.image) {
                                cacheImageValid(lubricant.image);
                              }
                            }}
                            loading="lazy"
                            quality={85}
                          />
                        </ImageErrorFallback>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
                          <ImageIcon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="text-center flex-1 flex flex-col justify-between">
                      <span
                        className="text-center font-medium text-xs sm:text-sm w-full px-1 word-wrap whitespace-normal leading-tight hyphens-auto"
                        style={{ lineHeight: 1.1 }}
                      >
                        {lubricant.name}
                      </span>
                      <span className="block text-sm text-primary mt-2">
                        OMR {lubricant.basePrice.toFixed(3)}
                      </span>
                    </div>
                  </Button>
                ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
