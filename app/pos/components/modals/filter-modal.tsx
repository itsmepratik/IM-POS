import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, Minus, Plus, ImageIcon } from "lucide-react";
import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  isValidImageUrl,
  cacheImageValid,
  cacheImageInvalid,
  isImageCached,
} from "@/lib/utils/imageCache";
import { ImageErrorFallback } from "@/components/ui/image-error-boundary";
import { useImagePreloader } from "@/lib/hooks/useImagePreloader";
import { useNotification } from "@/lib/contexts/NotificationContext";

interface Filter {
  id: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  originalId?: string;
  availableQuantity?: number;
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
    availableQuantity?: number; // Optional since it might not be in all data initially
  }>;
  selectedFilters: Filter[];
  onFilterClick: (filter: {
    id: number;
    name: string;
    price: number;
    imageUrl?: string;
    originalId?: string;
    availableQuantity?: number;
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
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
        <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <ImageErrorFallback
      onError={handleError}
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
  const { addPersistentNotification } = useNotification();

  // Create preloader items from filters
  const preloaderItems = useMemo(() => {
    return filters
      .filter((filter) => filter.imageUrl && isValidImageUrl(filter.imageUrl))
      .map((filter) => filter.imageUrl!);
  }, [filters]);

  // Preload filter images when modal opens
  const { totalImages, isPreloading } = useImagePreloader({
    urls: preloaderItems,
    enabled: isOpen && preloaderItems.length > 0,
  });
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
      }}
    >
      <DialogContent className="w-[95%] max-w-[700px] rounded-lg max-h-[85vh] flex flex-col overflow-hidden gap-0">
        <DialogHeader className="p-0 shrink-0 pb-6">
          <DialogTitle className="text-[clamp(1.125rem,3vw,1.25rem)] font-semibold">
            {selectedFilterBrand} - {selectedFilterType}

          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 py-1 px-0">
          <div className="space-y-6 w-full flex flex-col max-w-full">
            {/* Filter options grid */}
            <div
              className="grid gap-4 w-full"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              }}
            >
              {[...filters].sort((a, b) => a.name.localeCompare(b.name)).map((filter) => {
                const available = filter.availableQuantity ?? 0;
                const isOutOfStock = available <= 0;
                const isSelected = selectedFilters.some((sf) => sf.id === filter.id);

                return (
                  <Button
                    key={filter.id}
                    variant={isSelected ? "chonky" : "outline"}
                    disabled={false} // Always clickable to show notification
                    className={`border-2 rounded-[18px] flex flex-col items-center justify-between p-3 sm:p-4 h-[180px] sm:h-[200px] md:h-[220px] overflow-hidden shadow-sm hover:shadow-md transition-all relative ${
                      isOutOfStock 
                      ? "opacity-60 bg-muted/50" 
                      : isSelected ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => {
                      if (isOutOfStock) {
                         addPersistentNotification({
                           type: "error",
                           title: "Out of Stock",
                           message: `${filter.name} is currently out of stock.`,
                           category: "stock"
                         });
                         return;
                      }
                      onFilterClick(filter);
                    }}
                    type="button"
                  >
                    {/* Stock Badge - REMOVED per user request */}

                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mb-2 flex items-center justify-center">
                      <FilterImage
                        imageUrl={filter.imageUrl}
                        brand={selectedFilterBrand || ""}
                        type={selectedFilterType || ""}
                        filterName={filter.name}
                      />
                      {/* Out of Stock Overlay - Matches Lubricant Style */}
                      {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px] rounded-md z-1">
                           <Badge variant="destructive" className="text-[10px]">Out of Stock</Badge>
                        </div>
                      )}
                    </div>
                    <span
                      className="text-center font-medium text-xs sm:text-sm w-full px-1 whitespace-normal leading-tight hyphens-auto break-words"
                      style={{ lineHeight: 1.1 }}
                    >
                      {filter.name}
                    </span>
                    <span className="block text-xs sm:text-sm text-[#6d6d6d] mt-1">
                      OMR {filter.price.toFixed(3)}
                    </span>
                  </Button>
                );
              })}
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
                        <span className="font-medium text-[clamp(0.875rem,2vw,1rem)] whitespace-nowrap pl-2 flex-shrink-0 text-[#6d6d6d]">
                          OMR {(filter.price * filter.quantity).toFixed(3)}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>

        <div className="p-0 bg-background shrink-0 pt-6">
          <div className="flex justify-between gap-3 w-full">
            <Button
              variant="chonky-secondary"
              className="px-4 sm:px-6 text-[clamp(0.875rem,2vw,1rem)]"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                variant="chonky"
                className="px-4 sm:px-6 text-[clamp(0.875rem,2vw,1rem)]"
                onClick={onAddToCart}
                disabled={selectedFilters.length === 0}
              >
                Go to Cart
              </Button>
              <Button
                variant="chonky-secondary"
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
