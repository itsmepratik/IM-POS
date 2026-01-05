"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Droplet, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNotification } from "@/app/notification-context";
import Image from "next/image";
import {
  isValidImageUrl,
  cacheImageValid,
  cacheImageInvalid,
  isImageCached,
} from "@/lib/utils/imageCache";
import { ImageErrorFallback } from "@/components/ui/image-error-boundary";

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

// Helper component for additive/fluid product images
function AdditiveFluidImage({
  imageUrl,
  productName,
}: {
  imageUrl?: string;
  productName: string;
}) {
  const [hasError, setHasError] = React.useState(false);
  const hasLoadedRef = React.useRef(false);

  // Reset loaded ref when imageUrl changes
  React.useEffect(() => {
    hasLoadedRef.current = false;
  }, [imageUrl]);

  const handleError = React.useCallback(
    (e?: React.SyntheticEvent<HTMLImageElement, Event> | Error) => {
      setHasError(true);
      if (imageUrl) {
        cacheImageInvalid(imageUrl);
      }
      if (e && 'currentTarget' in e) {
        e.currentTarget.onerror = null;
      }
    },
    [imageUrl]
  );

  const handleLoad = React.useCallback(() => {
    // Only cache if not already cached and not already loaded
    if (imageUrl && !hasLoadedRef.current && !isImageCached(imageUrl)) {
      setHasError(false);
      cacheImageValid(imageUrl);
      hasLoadedRef.current = true;
    }
  }, [imageUrl]);

  // Show fallback icon if no valid image URL or error occurred
  if (!imageUrl || !isValidImageUrl(imageUrl) || hasError) {
    return (
      <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-md bg-muted/80">
        <Droplet className="h-6 w-6 text-primary/70" />
      </div>
    );
  }

  return (
    <div className="w-12 h-12 flex-shrink-0 relative rounded-md overflow-hidden bg-muted/80">
      <ImageErrorFallback
        onError={handleError}
        className="w-full h-full"
      >
        <Image
          src={imageUrl}
          alt={productName}
          className="object-contain p-1 transition-opacity duration-200"
          fill
          sizes="48px"
          onError={handleError}
          onLoad={handleLoad}
          loading="lazy"
          quality={85}
        />
      </ImageErrorFallback>
    </div>
  );
}

export function AdditivesFluidsCategory({
  searchQuery = "",
  expandedBrand,
  setExpandedBrand,
  addToCart,
  products,
  isLoading,
}: AdditivesFluidsCategoryProps) {
  const { addPersistentNotification } = useNotification();

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
                .map((product) => {
                  const available = product.availableQuantity ?? 0;
                  const isOutOfStock = available <= 0;
                  
                  return (
                  <Button
                    key={product.id}
                    variant="outline"
                    disabled={false} // Always clickable to show notification
                    className={`border-2 rounded-[18px] flex flex-col items-center justify-between p-4 h-auto min-h-[150px] transition-all overflow-hidden relative ${
                        isOutOfStock 
                        ? "opacity-60 bg-muted/50" 
                        : "hover:shadow-md"
                    }`}
                    onClick={() => {
                        if (isOutOfStock) {
                               addPersistentNotification({
                                 type: "error",
                                 title: "Out of Stock",
                                 message: `${product.name} is currently out of stock.`,
                                 category: "stock"
                               });
                               return;
                        }
                        addToCart({
                          id: product.id,
                          name: product.name,
                          price: product.price,
                        });
                    }}
                  >
                    {/* Stock Badge - REMOVED per user request */}
                    
                    {/* Product image with fallback to icon */}
                    <div className="mb-3 relative">
                      <AdditiveFluidImage
                        imageUrl={product.imageUrl}
                        productName={product.name}
                      />
                      {/* Out of Stock Overlay - Matches Lubricant Style */}
                      {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-md z-1">
                            <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>
                        </div>
                       )}
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
                        <span className="font-medium text-[clamp(0.75rem,1.5vw,0.85rem)] text-foreground">
                          OMR {product.price.toFixed(3)}
                        </span>
                      </div>
                    </div>
                  </Button>
                )})}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
