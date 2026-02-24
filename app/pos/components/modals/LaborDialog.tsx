"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus } from "lucide-react";
import { useState } from "react";

interface LaborDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddToCart: (amount: number) => void;
}

export function LaborDialog({
  open,
  onOpenChange,
  onAddToCart,
}: LaborDialogProps) {
  const [laborAmount, setLaborAmount] = useState(0.5);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95%] max-w-[550px] p-6 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Add Labor Charge
          </DialogTitle>
          <p className="text-center text-muted-foreground mt-2 text-sm">
            Enter a custom amount for labor service
          </p>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-4">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={() =>
                setLaborAmount(
                  Math.max(0, Math.round((laborAmount - 0.5) * 10) / 10),
                )
              }
            >
              <Minus className="h-5 w-5" />
            </Button>

            <div className="relative">
              <Input
                id="labor-amount"
                type="number"
                inputMode="decimal"
                className="w-32 text-center text-xl font-medium h-12"
                value={laborAmount}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    setLaborAmount(value);
                  } else {
                    setLaborAmount(0);
                  }
                }}
                step="0.5"
                min="0"
                autoFocus
              />
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={() =>
                setLaborAmount(Math.round((laborAmount + 0.5) * 10) / 10)
              }
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Quick Select Section */}
        <div className="w-full mb-3 mt-auto">
          <p className="text-sm font-medium mb-3 px-2 text-left">
            Quick Select
          </p>
          <div className="grid grid-cols-4 gap-2 px-2">
            <Button
              variant="outline"
              className="w-full text-sm"
              onClick={() => setLaborAmount(0.5)}
            >
              0.5
            </Button>
            <Button
              variant="outline"
              className="w-full text-sm"
              onClick={() => setLaborAmount(1)}
            >
              1
            </Button>
            <Button
              variant="outline"
              className="w-full text-sm"
              onClick={() => setLaborAmount(2)}
            >
              2
            </Button>
            <Button
              variant="outline"
              className="w-full text-sm"
              onClick={() => setLaborAmount(3)}
            >
              3
            </Button>
          </div>
        </div>

        <DialogFooter className="flex flex-row gap-3 px-2">
          <Button
            variant="outline"
            className="flex-1 h-12 text-base"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-12 text-base"
            variant="chonky"
            onClick={() => {
              if (laborAmount > 0) {
                onAddToCart(laborAmount);
                setLaborAmount(0.5);
                onOpenChange(false);
              }
            }}
            disabled={laborAmount <= 0}
          >
            Add to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
