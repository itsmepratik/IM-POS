"use client";

import { AlertTriangle, PackageX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface StockIndicatorProps {
  lowStockCount: number;
  outOfStockCount: number;
  className?: string;
  onLowStockClick?: () => void;
  onOutOfStockClick?: () => void;
}

export function StockIndicator({
  lowStockCount,
  outOfStockCount,
  className,
  onLowStockClick,
  onOutOfStockClick,
}: StockIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="relative px-2 h-9"
              onClick={onLowStockClick}
            >
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {lowStockCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center bg-amber-500 text-[10px] rounded-full"
                >
                  {lowStockCount > 99 ? "99+" : lowStockCount}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Low Stock Items: {lowStockCount}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="relative px-2 h-9"
              onClick={onOutOfStockClick}
            >
              <PackageX className="h-4 w-4 text-red-500" />
              {outOfStockCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-[10px] rounded-full"
                >
                  {outOfStockCount > 99 ? "99+" : outOfStockCount}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Out of Stock Items: {outOfStockCount}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
