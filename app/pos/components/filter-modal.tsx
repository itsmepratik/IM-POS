import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, Minus, Plus, ImageIcon } from "lucide-react";
import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  isValidImageUrl,
  cacheImageValid,
  cacheImageInvalid,
} from "@/lib/utils/imageCache";
import { ImageErrorFallback } from "@/components/ui/image-error-boundary";
import { useImagePreloader } from "@/lib/hooks/useImagePreloader";

interface Filter {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  originalId?: string;
}

interface FilterModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFilterBrand: string | null;
  selectedFilterType: string | null;
  filters: Array<{
    id: number;
    name: string;
    price: number;
    imageUrl?: string;
    originalId?: string;
  }>;
  selectedFilters: Filter[];
  onFilterClick: (filter: {
    id: number;
    name: string;
    price: number;
    imageUrl?: string;
    originalId?: string;
  }) => void;
  onQuantityChange: (filterId: number, change: number) => void;
  onAddToCart: () => void;
  onNext: () => void;
}

// Helper for filter image
function FilterImage({
  imageUrl,
  brand,
  type,
  filterName,
}: {
  imageUrl?: string;
  brand: string;
  type: string;
  filterName: string;
}) {
  const [hasError, setHasError] = React.useState(false);

  // Debug logging
  React.useEffect(() => {
    console.log(`[FilterImage] ${filterName}:`, {
      imageUrl,
      isValid: imageUrl ? isValidImageUrl(imageUrl) : false,
      brand,
      type,
    });
  }, [imageUrl, filterName, brand, type]);

  const handleError = React.useCallback(
    (e?: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setHasError(true);
      if (imageUrl) {
        cacheImageInvalid(imageUrl);
        console.warn(`[FilterImage] Failed to load: ${filterName}`, imageUrl);
      }
      if (e) {
        e.currentTarget.onerror = null;
      }
    },
    [imageUrl, filterName]
  );

  const handleLoad = React.useCallback(() => {
    setHasError(false);
    if (imageUrl) {
      cacheImageValid(imageUrl);
      console.log(`[FilterImage] Loaded successfully: ${filterName}`, imageUrl);
    }
  }, [imageUrl, filterName]);

  // Show fallback icon if no valid image URL or error occurred
  if (!imageUrl || !isValidImageUrl(imageUrl) || hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
        <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <ImageErrorFallback
      onError={(error) => {
        console.error(`[FilterImage] Error boundary: ${filterName}`, error);
        handleError();
      }}
      className="w-full h-full"
    >
      <Image
        src={imageUrl}
        alt={`${brand} ${type} ${filterName}`}
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

export function FilterModal({
  isOpen,
  onOpenChange,
  selectedFilterBrand,
  selectedFilterType,
  filters,
  selectedFilters,
  onFilterClick,
  onQuantityChange,
  onAddToCart,
  onNext,
}: FilterModalProps) {
  // Extract image URLs for preloading
  const imageUrls = useMemo(() => {
    return filters
      .filter((filter) => filter.imageUrl && isValidImageUrl(filter.imageUrl))
      .map((filter) => filter.imageUrl!);
  }, [filters]);

  // Preload filter images when modal opens
  const { totalImages, isPreloading } = useImagePreloader({
    urls: imageUrls,
    enabled: isOpen && imageUrls.length > 0,
  });
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
      }}
    >
      <DialogContent className="w-[95%] max-w-[700px] p-6 rounded-lg max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-[clamp(1.125rem,3vw,1.25rem)] font-semibold">
            {selectedFilterBrand} - {selectedFilterType}
            {isPreloading && totalImages > 0 && (
              <span className="ml-2 text-sm text-muted-foreground">
                (Loading {totalImages} images...)
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 w-full flex flex-col max-w-full">
          {/* Filter options grid */}
          <div
            className="grid gap-4 w-full"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            }}
          >
            {filters.map((filter) => (
              <button
                key={filter.id}
                className="flex flex-col items-center justify-center border-2 rounded-[33px] bg-background shadow-sm p-3 sm:p-4 h-[160px] sm:h-[180px] md:h-[200px] transition hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/50 w-full"
                onClick={() => onFilterClick(filter)}
                type="button"
              >
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mb-2 flex items-center justify-center">
                  <FilterImage
                    imageUrl={filter.imageUrl}
                    brand={selectedFilterBrand || ""}
                    type={selectedFilterType || ""}
                    filterName={filter.name}
                  />
                </div>
                <span
                  className="text-center font-medium text-xs sm:text-sm w-full px-1 whitespace-normal leading-tight hyphens-auto break-words"
                  style={{ lineHeight: 1.1 }}
                >
                  {filter.name}
                </span>
                <span className="block text-xs sm:text-sm text-primary mt-1">
                  OMR {filter.price.toFixed(3)}
                </span>
              </button>
            ))}
          </div>

          {/* Selected filters list - bulletproof against overflow */}
          {selectedFilters.length > 0 && (
            <div className="border rounded-lg bg-muted/50 w-full max-w-full">
              <ScrollArea className="h-[140px] sm:h-[160px] px-1 py-2 w-full max-w-full">
                <div className="space-y-5 w-full max-w-full">
                  {selectedFilters.map((filter) => (
                    <div
                      key={filter.id}
                      className="w-full flex items-center gap-2 min-w-0 px-2 max-w-full"
                    >
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => onQuantityChange(filter.id, -1)}
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </Button>
                        <span className="w-4 text-center text-[clamp(0.875rem,2vw,1rem)]">
                          {filter.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => onQuantityChange(filter.id, 1)}
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                      <span
                        className="font-medium text-[clamp(0.875rem,2vw,1rem)] whitespace-normal break-words line-clamp-2 flex-1 min-w-0"
                        style={{ lineHeight: 1 }}
                      >
                        {filter.name}
                      </span>
                      <span className="font-medium text-[clamp(0.875rem,2vw,1rem)] whitespace-nowrap pl-2 flex-shrink-0">
                        OMR {(filter.price * filter.quantity).toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="flex justify-between gap-3 pt-2 w-full">
            <Button
              variant="outline"
              className="px-4 sm:px-6 text-[clamp(0.875rem,2vw,1rem)]"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                className="px-4 sm:px-6 text-[clamp(0.875rem,2vw,1rem)]"
                onClick={onAddToCart}
                disabled={selectedFilters.length === 0}
              >
                Go to Cart
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={onNext}
                disabled={selectedFilters.length === 0}
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
