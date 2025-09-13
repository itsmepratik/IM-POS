"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Droplet } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  category: "Filters" | "Parts" | "Additives & Fluids" | "Lubricants";
  availableQuantity: number;
  brand?: string;
  type?: string;
  imageUrl?: string;
  isAvailable: boolean;
}

interface CartItem {
  id: number;
  name: string;
  price: number;
}

interface AdditivesFluidsCategoryProps {
  searchQuery?: string;
  expandedBrand: string | null;
  setExpandedBrand: (brand: string | null) => void;
  addToCart: (item: CartItem) => void;
  products: Product[];
  isLoading: boolean;
}

export function AdditivesFluidsCategory({
  searchQuery = "",
  expandedBrand,
  setExpandedBrand,
  addToCart,
  products,
  isLoading,
}: AdditivesFluidsCategoryProps) {
  // Get unique brands for additives & fluids
  const additiveBrands = useMemo(() => {
    return Array.from(
      new Set(
        products
          .filter((p) => p.category === "Additives & Fluids")
          .map((p) => p.brand || "Other") // Use "Other" for undefined brands
      )
    ).filter((brand) =>
      brand.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

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
    <>
      {additiveBrands.map((brand) => (
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
            <div className="p-4 bg-muted/50 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4">
              {products
                .filter(
                  (p) =>
                    p.category === "Additives & Fluids" &&
                    (p.brand || "Other") === brand // Handle null/undefined brands
                )
                .map((product) => (
                  <Button
                    key={product.id}
                    variant="outline"
                    className="border-2 rounded-[33px] flex flex-col items-center justify-between p-4 h-auto min-h-[150px] transition-all hover:shadow-md overflow-hidden"
                    onClick={() => {
                      addToCart({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                      });
                    }}
                  >
                    {/* Product icon with fixed dimensions */}
                    <div className="w-12 h-12 mb-3 flex-shrink-0 flex items-center justify-center rounded-md bg-muted/80">
                      <Droplet className="h-6 w-6 text-primary/70" />
                    </div>

                    {/* Product information with proper text handling */}
                    <div className="w-full flex flex-col items-center space-y-2">
                      {/* Product name with line clamping */}
                      <div className="text-center w-full">
                        <p className="text-sm font-medium line-clamp-2 leading-tight">
                          {product.name}
                        </p>
                      </div>

                      {/* Price with consistent formatting */}
                      <div className="mt-auto">
                        <span className="text-sm text-primary font-medium">
                          OMR {product.price.toFixed(3)}
                        </span>
                      </div>
                    </div>
                  </Button>
                ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
