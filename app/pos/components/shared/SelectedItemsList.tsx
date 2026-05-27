"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus } from "lucide-react";

export interface SelectedItemRow {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface SelectedItemsListProps {
  items: SelectedItemRow[];
  onQuantityChange: (itemId: number, change: number) => void;
  lastAddedItemId?: number | null;
  className?: string;
}

export function SelectedItemsList({
  items,
  onQuantityChange,
  lastAddedItemId,
  className,
}: SelectedItemsListProps) {
  if (items.length === 0) return null;

  return (
    <div className={`border rounded-lg bg-muted/50 w-full max-w-full ${className ?? ""}`}>
      <ScrollArea className="h-[140px] sm:h-[160px] px-1 py-2 w-full max-w-full">
        <div className="space-y-5 w-full max-w-full">
          {items.map((item) => {
            const isLastAdded = lastAddedItemId === item.id;

            return (
              <div
                key={item.id}
                className={`w-full flex items-center gap-2 min-w-0 px-2 max-w-full ${isLastAdded ? "rounded-md bg-primary/10 ring-1 ring-primary/20" : ""}`}
              >
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => onQuantityChange(item.id, -1)}
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </Button>
                  <span className="w-4 text-center text-[clamp(0.875rem,2vw,1rem)]">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => onQuantityChange(item.id, 1)}
                  >
                    <Plus className="h-2.5 w-2.5" />
                  </Button>
                </div>
                <span
                  className="font-medium text-[clamp(0.875rem,2vw,1rem)] whitespace-normal break-words line-clamp-2 flex-1 min-w-0"
                  style={{ lineHeight: 1 }}
                >
                  {item.name}
                  {isLastAdded && (
                    <Badge variant="secondary" className="ml-2 align-middle text-[10px]">
                      Last added
                    </Badge>
                  )}
                </span>
                <span className="font-medium text-[clamp(0.875rem,2vw,1rem)] whitespace-nowrap pl-2 flex-shrink-0 text-[#6d6d6d]">
                  OMR {(item.price * item.quantity).toFixed(3)}
                </span>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

