/**
 * Stock Indicator Component for POS Integration
 *
 * Shows real-time stock availability and alerts for products in the POS system
 */

"use client";

import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, PackageX } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StockIndicatorProps {
  availableQuantity: number;
  isAvailable: boolean;
  productName?: string;
  lowStockThreshold?: number;
  className?: string;
  showDetails?: boolean;
}

export function StockIndicator({
  availableQuantity,
  isAvailable,
  productName,
  lowStockThreshold = 5,
  className,
  showDetails = false,
}: StockIndicatorProps) {
  // Determine stock status
  const isOutOfStock = !isAvailable || availableQuantity === 0;
  const isLowStock =
    availableQuantity > 0 && availableQuantity <= lowStockThreshold;
  const isInStock = availableQuantity > lowStockThreshold;

  // Get appropriate styling and content
  let badgeVariant: "default" | "secondary" | "destructive" | "outline";
  let icon: React.ReactNode;
  let text: string;
  let textColor: string;

  if (isOutOfStock) {
    badgeVariant = "destructive";
    icon = <PackageX className="h-3 w-3" />;
    text = "Out of Stock";
    textColor = "text-red-600";
  } else if (isLowStock) {
    badgeVariant = "outline";
    icon = <AlertTriangle className="h-3 w-3" />;
    text = `Low Stock (${availableQuantity})`;
    textColor = "text-amber-600";
  } else {
    badgeVariant = "secondary";
    icon = <Package className="h-3 w-3" />;
    text = `In Stock (${availableQuantity})`;
    textColor = "text-green-600";
  }

  if (showDetails) {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        <div className={cn("flex items-center gap-1", textColor)}>
          {icon}
          <span className="font-medium">{text}</span>
        </div>
        {productName && (
          <span className="text-muted-foreground truncate">{productName}</span>
        )}
      </div>
    );
  }

  return (
    <Badge
      variant={badgeVariant}
      className={cn(
        "flex items-center gap-1 text-xs",
        isOutOfStock && "border-red-200 text-red-700 bg-red-50",
        isLowStock && "border-amber-200 text-amber-700 bg-amber-50",
        isInStock && "border-green-200 text-green-700 bg-green-50",
        className
      )}
    >
      {icon}
      {showDetails ? text : availableQuantity.toString()}
    </Badge>
  );
}

/**
 * Compact stock indicator for use in product cards
 */
export function CompactStockIndicator({
  availableQuantity,
  isAvailable,
  className,
}: Pick<
  StockIndicatorProps,
  "availableQuantity" | "isAvailable" | "className"
>) {
  const isOutOfStock = !isAvailable || availableQuantity === 0;

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs font-medium",
        isOutOfStock
          ? "text-red-600"
          : availableQuantity <= 5
          ? "text-amber-600"
          : "text-green-600",
        className
      )}
    >
      <div
        className={cn(
          "h-2 w-2 rounded-full",
          isOutOfStock
            ? "bg-red-500"
            : availableQuantity <= 5
            ? "bg-amber-500"
            : "bg-green-500"
        )}
      />
      <span>{isOutOfStock ? "Out" : availableQuantity}</span>
    </div>
  );
}

/**
 * Stock status for lubricant products with bottle state information
 */
export function LubricantStockIndicator({
  volumes,
  className,
}: {
  volumes: Array<{
    size: string;
    availableQuantity: number;
    bottleStates?: { open: number; closed: number };
  }>;
  className?: string;
}) {
  const totalStock = volumes.reduce(
    (sum, vol) => sum + vol.availableQuantity,
    0
  );
  const isAvailable = totalStock > 0;

  if (!isAvailable) {
    return (
      <Badge
        variant="destructive"
        className={cn("flex items-center gap-1", className)}
      >
        <PackageX className="h-3 w-3" />
        Out of Stock
      </Badge>
    );
  }

  const hasLowStock = volumes.some(
    (vol) => vol.availableQuantity > 0 && vol.availableQuantity <= 3
  );

  return (
    <div className={cn("flex flex-col gap-1 text-xs", className)}>
      <div className="flex items-center gap-2">
        <CompactStockIndicator
          availableQuantity={totalStock}
          isAvailable={isAvailable}
        />
        <span className="text-muted-foreground">
          {volumes.length} size{volumes.length !== 1 ? "s" : ""}
        </span>
      </div>

      {hasLowStock && (
        <div className="flex items-center gap-1 text-amber-600">
          <AlertTriangle className="h-3 w-3" />
          <span>Some sizes low</span>
        </div>
      )}
    </div>
  );
}
