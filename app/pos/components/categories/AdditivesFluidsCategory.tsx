"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Droplet, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNotification } from "@/lib/contexts/NotificationContext";
import Image from "next/image";
import {
  isValidImageUrl,
  cacheImageValid,
  cacheImageInvalid,
  isImageCached,
} from "@/lib/utils/imageCache";
import { ImageErrorFallback } from "@/components/ui/image-error-boundary";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrandLogo } from "../brand-logo";
import { Brand } from "@/lib/services/inventoryService";

interface Product {
  id: number;
  name: string;
  price: number;
  category:
    | "Filters"
    | "Parts"
    | "Additives & Fluids"
    | "Lubricants"
    | "Batteries";
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
  brand?: string;
}

interface AdditivesFluidsCategoryProps {
  searchQuery?: string;
  expandedBrand: string | null;
  setExpandedBrand: (brand: string | null) => void;
  addToCart: (item: CartItem) => void;
  products: Product[];
  brands?: Brand[];
  isLoading: boolean;
}

function AdditiveFluidImage({
  imageUrl,
  productName,
  onColorExtracted,
}: {
  imageUrl?: string;
  productName: string;
  onColorExtracted?: (color: string) => void;
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
      if (e && "currentTarget" in e) {
        e.currentTarget.onerror = null;
      }
    },
    [imageUrl],
  );

  const handleLoad = React.useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      // Only cache if not already cached and not already loaded
      if (imageUrl && !hasLoadedRef.current && !isImageCached(imageUrl)) {
        setHasError(false);
        cacheImageValid(imageUrl);
        hasLoadedRef.current = true;
      }

      if (onColorExtracted && e.currentTarget) {
        try {
          const img = e.currentTarget;
          const canvas = document.createElement("canvas");
          canvas.width = 1;
          canvas.height = 1;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (ctx) {
            // Sample top-left edge pixel
            ctx.drawImage(img, 0, 0, 1, 1, 0, 0, 1, 1);
            const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
            if (a < 250) {
              onColorExtracted("transparent");
            } else {
              onColorExtracted(`rgb(${r},${g},${b})`);
            }
          }
        } catch (err) {
          onColorExtracted("transparent");
        }
      }
    },
    [imageUrl, onColorExtracted],
  );

  // Show fallback icon if no valid image URL or error occurred
  if (!imageUrl || !isValidImageUrl(imageUrl) || hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center rounded-md bg-muted/80">
        <Droplet className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary/70" />
      </div>
    );
  }

  return (
    <ImageErrorFallback onError={handleError} className="w-full h-full">
      <Image
        src={imageUrl}
        alt={productName}
        className="object-contain p-1 transition-opacity duration-200"
        fill
        sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, 128px"
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
        quality={85}
        crossOrigin="anonymous"
      />
    </ImageErrorFallback>
  );
}

export function AdditivesFluidsCategory({
  searchQuery = "",
  expandedBrand,
  setExpandedBrand,
  addToCart,
  products,
  brands,
  isLoading,
}: AdditivesFluidsCategoryProps) {
  const { addPersistentNotification } = useNotification();
  const [brandColors, setBrandColors] = useState<Record<string, string>>({});
  const [productColors, setProductColors] = useState<Record<string, string>>(
    {},
  );

  // Get unique brands for additives & fluids
  const additiveBrands = useMemo(() => {
    return Array.from(
      new Set(
        products
          .filter((p) => p.category === "Additives & Fluids")
          .map((p) => p.brand || "Other"), // Use "Other" for undefined brands
      ),
    ).filter((brand) =>
      brand.toLowerCase().includes(searchQuery.toLowerCase()),
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {additiveBrands.map((brand) => (
        <Dialog
          key={brand}
          open={expandedBrand === brand}
          onOpenChange={(open) => setExpandedBrand(open ? brand : null)}
        >
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full h-full min-h-[150px] sm:min-h-[170px] md:min-h-[190px] flex-col overflow-hidden p-0 rounded-xl hover:bg-accent border-2 transition-all hover:scale-[1.02] group"
              onClick={() => setExpandedBrand(brand)}
            >
              <div
                className="relative flex-1 w-full transition-colors min-h-[100px] sm:min-h-[120px]"
                style={{ backgroundColor: brandColors[brand] || "#ffffff" }}
              >
                <div className="absolute inset-2 sm:inset-2 md:inset-3">
                  <BrandLogo
                    brand={brand}
                    brands={brands}
                    imageUrl={brands?.find((b) => b.name === brand)?.imageUrl}
                    onColorExtracted={(color) => {
                      setBrandColors((prev) => {
                        if (prev[brand] === color) return prev;
                        return { ...prev, [brand]: color };
                      });
                    }}
                  />
                </div>
              </div>
              <div className="w-full bg-slate-50 border-t py-1 sm:py-1.5 px-3 shrink-0 flex items-center justify-center min-h-[32px] sm:min-h-[36px]">
                <span className="font-semibold text-center text-sm md:text-base break-words w-full line-clamp-1 block text-foreground leading-tight">
                  {brand}
                </span>
              </div>
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-[90vw] w-[90vw] h-[90vh] max-h-[90vh] flex flex-col overflow-hidden p-0 sm:p-6 pb-0 sm:pb-0">
            <DialogHeader className="shrink-0 px-6 pt-6 sm:px-0 sm:pt-0">
              <DialogTitle className="flex items-center gap-3 text-2xl mb-2">
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <BrandLogo
                    brand={brand}
                    brands={brands}
                    imageUrl={brands?.find((b) => b.name === brand)?.imageUrl}
                  />
                </div>
                <span>{brand} Additives & Fluids</span>
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 h-full px-6 sm:px-0">
                <div className="pb-24 pt-2">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {/* Render additive/fluid products */}
                    {products
                      .filter(
                        (p) =>
                          p.category === "Additives & Fluids" &&
                          (p.brand || "Other") === brand,
                      )
                      .map((product) => {
                        const available = product.availableQuantity ?? 0;
                        const isOutOfStock = available <= 0;

                        return (
                          <Button
                            key={product.id}
                            variant="outline"
                            disabled={false} // Always clickable to show notification
                            className={`border-2 rounded-[18px] flex flex-col items-center justify-between p-3 sm:p-4 h-[180px] sm:h-[200px] md:h-[220px] overflow-hidden shadow-sm hover:shadow-md transition-all relative ${
                              isOutOfStock ? "opacity-60 bg-muted/50" : ""
                            }`}
                            onClick={() => {
                              if (isOutOfStock) {
                                addPersistentNotification({
                                  type: "error",
                                  title: "Out of Stock",
                                  message: `${product.name} is currently out of stock.`,
                                  category: "stock",
                                });
                                return;
                              }
                              addToCart({
                                id: product.id,
                                name: product.name,
                                price: product.price,
                                brand: product.brand,
                              });
                            }}
                          >
                            <div
                              className="relative flex-1 w-full mt-2 mb-2 min-h-[60px] rounded-lg transition-colors"
                              style={{
                                backgroundColor:
                                  productColors[product.id] || "transparent",
                              }}
                            >
                              <AdditiveFluidImage
                                imageUrl={product.imageUrl}
                                productName={product.name}
                                onColorExtracted={(color) => {
                                  setProductColors((prev) => {
                                    if (prev[product.id] === color) return prev;
                                    return { ...prev, [product.id]: color };
                                  });
                                }}
                              />
                              {/* Out of Stock Overlay */}
                              {isOutOfStock && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-md z-1">
                                  <Badge
                                    variant="destructive"
                                    className="text-[10px]"
                                  >
                                    Out of Stock
                                  </Badge>
                                </div>
                              )}
                            </div>

                            <div className="text-center shrink-0 flex flex-col justify-end w-full gap-0.5 mt-1 z-10">
                              <div className="flex flex-col w-full">
                                <span
                                  className="text-center font-semibold text-[10px] sm:text-xs w-full px-1 word-wrap whitespace-normal leading-tight hyphens-auto line-clamp-2"
                                  style={{ lineHeight: 1.1 }}
                                >
                                  {product.name}
                                </span>
                              </div>
                              <span className="block text-sm font-bold text-[#6d6d6d] mt-0">
                                OMR {product.price.toFixed(3)}
                              </span>
                            </div>
                          </Button>
                        );
                      })}
                  </div>
                </div>
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}
