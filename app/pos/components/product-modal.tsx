import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Minus, Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

// Common type for all product variants
interface ProductVariant {
  id: number;
  name: string;
  price: number;
  quantity: number;
  isOpenBottle?: boolean;
}

interface ProductModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  productType: string;
  variants: Array<{ id: number; name: string; price: number }>;
  onAddToCart: (selectedVariants: ProductVariant[]) => void;
}

export function ProductModal({
  isOpen,
  onOpenChange,
  productName,
  productType,
  variants,
  onAddToCart,
}: ProductModalProps) {
  const [selectedVariants, setSelectedVariants] = useState<ProductVariant[]>(
    []
  );

  // Reset selections when modal opens/closes or product changes
  useEffect(() => {
    if (!isOpen) {
      setSelectedVariants([]);
    }
  }, [isOpen, productName, productType]);

  const handleVariantClick = (variant: {
    id: number;
    name: string;
    price: number;
  }) => {
    // Check if this variant already exists in selectedVariants
    const existingVariantIndex = selectedVariants.findIndex(
      (v) => v.id === variant.id
    );

    if (existingVariantIndex >= 0) {
      // Remove it if already selected
      const newSelectedVariants = [...selectedVariants];
      newSelectedVariants.splice(existingVariantIndex, 1);
      setSelectedVariants(newSelectedVariants);
    } else {
      // Add to selected variants with quantity 1
      setSelectedVariants((prev) => [
        ...prev,
        {
          ...variant,
          quantity: 1,
        },
      ]);
    }
  };

  const handleQuantityChange = (variantId: number, change: number) => {
    setSelectedVariants((prev) => {
      return prev
        .map((variant) => {
          if (variant.id === variantId) {
            const newQuantity = Math.max(0, variant.quantity + change);
            return { ...variant, quantity: newQuantity };
          }
          return variant;
        })
        .filter((variant) => variant.quantity > 0);
    });
  };

  const toggleOpenBottle = (variantId: number) => {
    setSelectedVariants((prev) => {
      return prev.map((variant) => {
        if (variant.id === variantId) {
          return { ...variant, isOpenBottle: !variant.isOpenBottle };
        }
        return variant;
      });
    });
  };

  const handleAddToCart = () => {
    onAddToCart(selectedVariants);
    onOpenChange(false);
  };

  const isLubricant =
    productType.toLowerCase().includes("0w-20") ||
    productType.toLowerCase().includes("5w-30") ||
    productType.toLowerCase().includes("engine lubricant");

  // Get image path based on product type
  const getImagePath = () => {
    const basePath = isLubricant ? "/lubricants/" : "/filters/";
    const defaultImage = isLubricant
      ? "default-lubricant.jpg"
      : "default-filter.jpg";

    try {
      // Special case for Shell 20W-50 to use the lubricant.png image
      if (isLubricant && productName === "Shell" && productType === "20W-50") {
        return "/images/lubricant.png";
      }

      // Format: brand-type.jpg (lowercase, spaces replaced with hyphens)
      return `${basePath}${productName.toLowerCase()}-${productType
        .toLowerCase()
        .replace(/ /g, "-")}.jpg`;
    } catch (error) {
      return `${basePath}${defaultImage}`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95%] max-w-[500px] p-6 rounded-lg">
        <DialogHeader className="pb-4 text-center">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-[clamp(1.125rem,3vw,1.25rem)] font-semibold mx-auto">
              {productName} - {productType}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex justify-center mb-6">
          <div className="relative w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] border-2 border-border rounded-lg overflow-hidden bg-muted">
            <img
              src={getImagePath()}
              alt={`${productName} ${productType}`}
              className="object-contain w-full h-full p-2"
              onError={(e) => {
                console.log(
                  `Error loading image for ${productName} ${productType}`
                );
                e.currentTarget.onerror = null; // Prevent infinite error loops
                e.currentTarget.src = isLubricant
                  ? "/lubricants/default-lubricant.jpg"
                  : "/filters/default-filter.jpg";
              }}
            />
          </div>
        </div>

        {/* Variant selection grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {variants.map((variant) => {
            const isSelected = selectedVariants.some(
              (v) => v.id === variant.id
            );
            return (
              <Button
                key={variant.id}
                variant={isSelected ? "secondary" : "outline"}
                className={`h-auto py-4 px-4 flex flex-col items-center gap-1.5 ${
                  isSelected ? "bg-orange-50" : ""
                }`}
                onClick={() => handleVariantClick(variant)}
              >
                <div className="text-[clamp(0.875rem,2vw,1rem)] font-medium text-center line-clamp-2">
                  {variant.name}
                </div>
                <div className="text-[clamp(0.75rem,1.5vw,0.875rem)] text-muted-foreground">
                  OMR {variant.price.toFixed(3)}
                </div>
              </Button>
            );
          })}
        </div>

        {/* Selected variants with quantity controls - only show when variants are selected */}
        {selectedVariants.length > 0 && (
          <div className="border rounded-md mb-6">
            <div className="p-3">
              <div className="space-y-3">
                {selectedVariants.map((variant) => (
                  <div key={variant.id} className="flex flex-col space-y-2">
                    <div className="flex items-center justify-between">
                      {/* Left side: quantity controls */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-md"
                          onClick={() => handleQuantityChange(variant.id, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-5 text-center text-[clamp(0.875rem,2vw,1rem)]">
                          {variant.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-md"
                          onClick={() => handleQuantityChange(variant.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Middle: variant name */}
                      <div className="flex-1 px-3">
                        <span className="font-medium text-[clamp(0.875rem,2vw,1rem)]">
                          {variant.name}
                        </span>
                        {isLubricant &&
                          (variant.name === "1L" ||
                            variant.name === "500ml") && (
                            <div
                              className="text-sm cursor-pointer text-orange-500"
                              onClick={() => toggleOpenBottle(variant.id)}
                            >
                              Open Bottle
                            </div>
                          )}
                      </div>

                      {/* Right: price */}
                      <div className="text-right">
                        <span className="font-medium text-[clamp(0.875rem,2vw,1rem)] whitespace-nowrap">
                          OMR {(variant.price * variant.quantity).toFixed(3)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between gap-3 pt-2">
          <Button
            variant="outline"
            className="w-1/3 px-4 text-[clamp(0.875rem,2vw,1rem)]"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="w-2/3 px-4 text-[clamp(0.875rem,2vw,1rem)]"
            onClick={handleAddToCart}
            disabled={
              selectedVariants.length === 0 ||
              selectedVariants.every((v) => v.quantity === 0)
            }
          >
            Go to Cart
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
