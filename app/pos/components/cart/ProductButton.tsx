"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Package } from "lucide-react";
import { Product } from "@/lib/hooks/data/useIntegratedPOSData";

interface ProductButtonProps {
  product: Product;
  addToCart: (product: Product) => void;
}

export const ProductButton = memo(
  ({ product, addToCart }: ProductButtonProps) => (
    <Button
      key={product.id}
      variant="outline"
      className="h-[160px] sm:h-[180px] flex flex-col items-center justify-between text-center p-4 hover:shadow-md transition-all overflow-hidden"
      onClick={() => addToCart(product)}
    >
      <div className="flex items-center justify-center h-10 w-10 mb-2">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <Package className="h-4 w-4 text-primary opacity-70" />
        </div>
      </div>
      <div className="text-center flex-1 flex flex-col justify-between">
        <span
          className="font-medium text-xs sm:text-sm word-wrap whitespace-normal leading-tight hyphens-auto"
          style={{ lineHeight: 1.1 }}
        >
          {product.name}
        </span>
        <span className="block text-sm font-medium text-foreground mt-2">
          OMR {product.price.toFixed(3)}
        </span>
      </div>
    </Button>
  )
);
ProductButton.displayName = "ProductButton";
