"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, ImageIcon, AlertCircle } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useNotification } from "@/lib/contexts/NotificationContext";
import {
  isValidImageUrl,
  cacheImageValid,
  cacheImageInvalid,
  isImageCached,
} from "@/lib/utils/imageCache";
import { useImagePreloader } from "@/lib/hooks/useImagePreloader";
import { ImageErrorFallback } from "@/components/ui/image-error-boundary";
import { OpenBottleIcon, ClosedBottleIcon } from "@/components/ui/bottle-icons";
import { BrandLogo } from "../brand-logo";
import { Brand } from "@/lib/services/inventoryService";
import { LubricantProduct } from "@/lib/hooks/data/useIntegratedPOSData";

interface LubricantCategoryProps {
  searchQuery?: string;
  expandedBrand: string | null;
  setExpandedBrand: (brand: string | null) => void;
  onLubricantSelect: (lubricant: LubricantProduct) => void;
  lubricantProducts: LubricantProduct[];
  lubricantBrands: string[];
  brands?: Brand[];
  isLoading: boolean;
}

// Helper component for lubricant product images
function LubricantImage({
  imageUrl,
  brand,
  type,
}: {
  imageUrl: string;
  brand: string;
  type: string;
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

  const handleLoad = React.useCallback(() => {
    // Only cache if not already cached and not already loaded
    if (imageUrl && !hasLoadedRef.current && !isImageCached(imageUrl)) {
      setHasError(false);
      cacheImageValid(imageUrl);
      hasLoadedRef.current = true;
    }
  }, [imageUrl]);

  if (hasError || !isValidImageUrl(imageUrl)) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
        <ImageIcon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <ImageErrorFallback
      onError={handleError}
      className="w-full h-full rounded-md"
    >
      <Image
        src={imageUrl}
        alt={`${brand} ${type}`}
        className="object-contain rounded-md transition-opacity duration-200"
        fill
        sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, (max-width: 1024px) 96px, 128px"
        onError={handleError}
        onLoad={handleLoad}
        loading="lazy"
        quality={85}
      />
    </ImageErrorFallback>
  );
}

export function LubricantCategory({
  searchQuery = "",
  expandedBrand,
  setExpandedBrand,
  onLubricantSelect,
  lubricantProducts,
  lubricantBrands,
  brands,
  isLoading,
}: LubricantCategoryProps) {
  const { addPersistentNotification } = useNotification();
  const [brandColors, setBrandColors] = useState<Record<string, string>>({});

  // Filter brands based on search query
  const filteredLubricantBrands = useMemo(() => {
    return lubricantBrands.filter((brand) =>
      brand.toLowerCase().includes(searchQuery.toLowerCase()),
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {filteredLubricantBrands.map((brand) => (
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
                {brand}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1 px-6 pb-6 sm:px-2">
              <div className="space-y-6 pb-8 pt-2">
                {/* Petrol Products */}
                {lubricantProducts.filter(
                  (p) => p.brand === brand && p.specification === "Petrol",
                ).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                      Petrol
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {lubricantProducts
                        .filter(
                          (p) =>
                            p.brand === brand && p.specification === "Petrol",
                        )
                        .map((lubricant) => (
                          <Button
                            key={lubricant.id}
                            variant="outline"
                            className={`border-2 rounded-[18px] flex flex-col items-center justify-between p-3 sm:p-4 h-[180px] sm:h-[200px] md:h-[220px] overflow-hidden shadow-sm hover:shadow-md transition-all relative ${
                              !lubricant.isAvailable
                                ? "opacity-60 cursor-not-allowed bg-muted"
                                : ""
                            }`}
                            onClick={() => {
                              if (!lubricant.isAvailable) {
                                addPersistentNotification({
                                  type: "error",
                                  title: "Out of Stock",
                                  message: `${lubricant.name} is currently out of stock.`,
                                  category: "stock",
                                });
                                return;
                              }
                              onLubricantSelect(lubricant);
                            }}
                          >
                            {/* Available Stock Icons - Top Right of Card */}
                            {/* Available Stock Icons - Top Right of Card */}
                            {((lubricant.volumes?.[0]?.bottleStates?.closed ??
                              lubricant.volumes?.reduce(
                                (s, v) => s + (v.availableQuantity || 0),
                                0,
                              ) ??
                              0) > 0 ||
                              (lubricant.volumes?.[0]?.bottleStates?.open ||
                                0) > 0) && (
                              <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-10">
                                {(lubricant.volumes?.[0]?.bottleStates
                                  ?.closed ??
                                  lubricant.volumes?.reduce(
                                    (s, v) => s + (v.availableQuantity || 0),
                                    0,
                                  ) ??
                                  0) > 0 && (
                                  <div
                                    className="bg-muted px-1.5 py-1 rounded-md border border-border shadow-sm flex items-center gap-1"
                                    title={`${lubricant.volumes?.[0]?.bottleStates?.closed ?? lubricant.volumes?.reduce((s, v) => s + (v.availableQuantity || 0), 0)} Closed Bottles`}
                                  >
                                    <ClosedBottleIcon className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-[10px] font-medium text-muted-foreground leading-none">
                                      {lubricant.volumes?.[0]?.bottleStates
                                        ?.closed ??
                                        lubricant.volumes?.reduce(
                                          (s, v) =>
                                            s + (v.availableQuantity || 0),
                                          0,
                                        )}
                                    </span>
                                  </div>
                                )}
                                {(lubricant.volumes?.[0]?.bottleStates?.open ||
                                  0) > 0 && (
                                  <div
                                    className="bg-blue-100 px-1.5 py-1 rounded-md border border-blue-200 shadow-sm flex items-center gap-1"
                                    title={`${lubricant.volumes?.[0]?.bottleStates?.open} Open Bottles (${lubricant.totalOpenVolume?.toFixed(2)}L)`}
                                  >
                                    <OpenBottleIcon className="w-3 h-3 text-blue-700" />
                                    <span className="text-[10px] font-bold text-blue-700 leading-none">
                                      {
                                        lubricant.volumes?.[0]?.bottleStates
                                          ?.open
                                      }
                                      {lubricant.totalOpenVolume !==
                                        undefined &&
                                        lubricant.totalOpenVolume > 0 && (
                                          <span className="ml-0.5 text-[9px] opacity-80">
                                            (
                                            {Number(
                                              lubricant.totalOpenVolume,
                                            ).toFixed(1)}
                                            L)
                                          </span>
                                        )}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mt-1 mb-1 shrink-0">
                              {lubricant.image ? (
                                <LubricantImage
                                  imageUrl={lubricant.image}
                                  brand={lubricant.brand}
                                  type={lubricant.type}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
                                  <ImageIcon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-muted-foreground" />
                                </div>
                              )}

                              {/* Out of Stock Overlay */}
                              {!lubricant.isAvailable && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-md z-10">
                                  <Badge
                                    variant="destructive"
                                    className="text-[10px]"
                                  >
                                    Out of Stock
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <div className="text-center flex-1 flex flex-col justify-end w-full gap-1">
                              <div className="flex flex-col w-full">
                                <span
                                  className="text-center font-semibold text-[10px] sm:text-xs w-full px-1 word-wrap whitespace-normal leading-tight hyphens-auto line-clamp-2"
                                  style={{ lineHeight: 1.1 }}
                                >
                                  {lubricant.name}
                                </span>
                              </div>
                              <span className="block text-sm font-bold text-[#6d6d6d] mt-0">
                                OMR {lubricant.basePrice.toFixed(3)}
                              </span>
                            </div>
                          </Button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Diesel Products */}
                {lubricantProducts.filter(
                  (p) => p.brand === brand && p.specification === "Diesel",
                ).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                      Diesel
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {lubricantProducts
                        .filter(
                          (p) =>
                            p.brand === brand && p.specification === "Diesel",
                        )
                        .map((lubricant) => (
                          <Button
                            key={lubricant.id}
                            variant="outline"
                            className="border-2 rounded-[18px] flex flex-col items-center justify-between p-3 sm:p-4 h-[180px] sm:h-[200px] md:h-[220px] overflow-hidden shadow-sm hover:shadow-md transition-all relative"
                            onClick={() => {
                              if (!lubricant.isAvailable) {
                                addPersistentNotification({
                                  type: "error",
                                  title: "Out of Stock",
                                  message: `${lubricant.name} is currently out of stock.`,
                                  category: "stock",
                                });
                                return;
                              }
                              onLubricantSelect(lubricant);
                            }}
                          >
                            {/* Available Stock Icons - Top Right of Card */}
                            {((lubricant.volumes?.[0]?.bottleStates?.closed ??
                              lubricant.volumes?.reduce(
                                (s, v) => s + (v.availableQuantity || 0),
                                0,
                              ) ??
                              0) > 0 ||
                              (lubricant.volumes?.[0]?.bottleStates?.open ||
                                0) > 0) && (
                              <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-10">
                                {(lubricant.volumes?.[0]?.bottleStates
                                  ?.closed ??
                                  lubricant.volumes?.reduce(
                                    (s, v) => s + (v.availableQuantity || 0),
                                    0,
                                  ) ??
                                  0) > 0 && (
                                  <div
                                    className="bg-muted px-1.5 py-1 rounded-md border border-border shadow-sm flex items-center gap-1"
                                    title={`${lubricant.volumes?.[0]?.bottleStates?.closed ?? lubricant.volumes?.reduce((s, v) => s + (v.availableQuantity || 0), 0)} Closed Bottles`}
                                  >
                                    <ClosedBottleIcon className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-[10px] font-medium text-muted-foreground leading-none">
                                      {lubricant.volumes?.[0]?.bottleStates
                                        ?.closed ??
                                        lubricant.volumes?.reduce(
                                          (s, v) =>
                                            s + (v.availableQuantity || 0),
                                          0,
                                        )}
                                    </span>
                                  </div>
                                )}
                                {(lubricant.volumes?.[0]?.bottleStates?.open ||
                                  0) > 0 && (
                                  <div
                                    className="bg-blue-100 px-1.5 py-1 rounded-md border border-blue-200 shadow-sm flex items-center gap-1"
                                    title={`${lubricant.volumes?.[0]?.bottleStates?.open} Open Bottles`}
                                  >
                                    <OpenBottleIcon className="w-3 h-3 text-blue-700" />
                                    <span className="text-[10px] font-bold text-blue-700 leading-none">
                                      {
                                        lubricant.volumes?.[0]?.bottleStates
                                          ?.open
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mt-1 mb-1 shrink-0">
                              {lubricant.image ? (
                                <LubricantImage
                                  imageUrl={lubricant.image}
                                  brand={lubricant.brand}
                                  type={lubricant.type}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
                                  <ImageIcon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-muted-foreground" />
                                </div>
                              )}

                              {/* Out of Stock Overlay */}
                              {!lubricant.isAvailable && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-md z-10">
                                  <Badge
                                    variant="destructive"
                                    className="text-[10px]"
                                  >
                                    Out of Stock
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <div className="text-center flex-1 flex flex-col justify-end w-full gap-1">
                              <div className="flex flex-col w-full">
                                <span
                                  className="text-center font-semibold text-[10px] sm:text-xs w-full px-1 word-wrap whitespace-normal leading-tight hyphens-auto line-clamp-2"
                                  style={{ lineHeight: 1.1 }}
                                >
                                  {lubricant.name}
                                </span>
                              </div>
                              <span className="block text-sm font-bold text-[#6d6d6d] mt-0">
                                OMR {lubricant.basePrice.toFixed(3)}
                              </span>
                            </div>
                          </Button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Other Products (Unspecified or Other types) */}
                {lubricantProducts.filter(
                  (p) =>
                    p.brand === brand &&
                    p.specification !== "Petrol" &&
                    p.specification !== "Diesel",
                ).length > 0 && (
                  <div>
                    {lubricantProducts.some(
                      (p) =>
                        p.brand === brand &&
                        (p.specification === "Petrol" ||
                          p.specification === "Diesel"),
                    ) && (
                      <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                        Other
                      </h3>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {lubricantProducts
                        .filter(
                          (p) =>
                            p.brand === brand &&
                            p.specification !== "Petrol" &&
                            p.specification !== "Diesel",
                        )
                        .map((lubricant) => (
                          <Button
                            key={lubricant.id}
                            variant="outline"
                            className="border-2 rounded-[18px] flex flex-col items-center justify-between p-3 sm:p-4 h-[180px] sm:h-[200px] md:h-[220px] overflow-hidden shadow-sm hover:shadow-md transition-all relative"
                            onClick={() => {
                              if (!lubricant.isAvailable) {
                                addPersistentNotification({
                                  type: "error",
                                  title: "Out of Stock",
                                  message: `${lubricant.name} is currently out of stock.`,
                                  category: "stock",
                                });
                                return;
                              }
                              onLubricantSelect(lubricant);
                            }}
                          >
                            {/* Available Stock Icons - Top Right of Card */}
                            {((lubricant.volumes?.[0]?.bottleStates?.closed ??
                              lubricant.volumes?.reduce(
                                (s, v) => s + (v.availableQuantity || 0),
                                0,
                              ) ??
                              0) > 0 ||
                              (lubricant.volumes?.[0]?.bottleStates?.open ||
                                0) > 0) && (
                              <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-10">
                                {(lubricant.volumes?.[0]?.bottleStates
                                  ?.closed ??
                                  lubricant.volumes?.reduce(
                                    (s, v) => s + (v.availableQuantity || 0),
                                    0,
                                  ) ??
                                  0) > 0 && (
                                  <div
                                    className="bg-muted px-1.5 py-1 rounded-md border border-border shadow-sm flex items-center gap-1"
                                    title={`${lubricant.volumes?.[0]?.bottleStates?.closed ?? lubricant.volumes?.reduce((s, v) => s + (v.availableQuantity || 0), 0)} Closed Bottles`}
                                  >
                                    <ClosedBottleIcon className="w-3 h-3 text-muted-foreground" />
                                    <span className="text-[10px] font-medium text-muted-foreground leading-none">
                                      {lubricant.volumes?.[0]?.bottleStates
                                        ?.closed ??
                                        lubricant.volumes?.reduce(
                                          (s, v) =>
                                            s + (v.availableQuantity || 0),
                                          0,
                                        )}
                                    </span>
                                  </div>
                                )}
                                {(lubricant.volumes?.[0]?.bottleStates?.open ||
                                  0) > 0 && (
                                  <div
                                    className="bg-blue-100 px-1.5 py-1 rounded-md border border-blue-200 shadow-sm flex items-center gap-1"
                                    title={`${lubricant.volumes?.[0]?.bottleStates?.open} Open Bottles`}
                                  >
                                    <OpenBottleIcon className="w-3 h-3 text-blue-700" />
                                    <span className="text-[10px] font-bold text-blue-700 leading-none">
                                      {
                                        lubricant.volumes?.[0]?.bottleStates
                                          ?.open
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mt-1 mb-1 shrink-0">
                              {lubricant.image ? (
                                <LubricantImage
                                  imageUrl={lubricant.image}
                                  brand={lubricant.brand}
                                  type={lubricant.type}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
                                  <ImageIcon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-muted-foreground" />
                                </div>
                              )}

                              {/* Out of Stock Overlay */}
                              {!lubricant.isAvailable && (
                                <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-md z-10">
                                  <Badge
                                    variant="destructive"
                                    className="text-[10px]"
                                  >
                                    Out of Stock
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <div className="text-center flex-1 flex flex-col justify-end w-full gap-1">
                              <div className="flex flex-col w-full">
                                <span
                                  className="text-center font-semibold text-[10px] sm:text-xs w-full px-1 word-wrap whitespace-normal leading-tight hyphens-auto line-clamp-2"
                                  style={{ lineHeight: 1.1 }}
                                >
                                  {lubricant.name}
                                </span>
                              </div>
                              <span className="block text-sm font-bold text-[#6d6d6d] mt-0">
                                OMR {lubricant.basePrice.toFixed(3)}
                              </span>
                            </div>
                          </Button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}
