"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PercentIcon, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discountType: "percentage" | "amount";
  setDiscountType: (type: "percentage" | "amount") => void;
  discountValue: number;
  setDiscountValue: (value: number) => void;
  subtotal: number;
  onApply: () => void;
}

export function DiscountDialog({
  open,
  onOpenChange,
  discountType,
  setDiscountType,
  discountValue,
  setDiscountValue,
  subtotal,
  onApply,
}: DiscountDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90%] max-w-[400px] p-6 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            Apply Discount
          </DialogTitle>
          <DialogDescription className="text-center">
            Select discount type and enter value
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={discountType === "percentage" ? "chonky" : "outline"}
              className={cn(
                "h-20 flex flex-col items-center justify-center gap-2",
                discountType === "percentage" && "ring-2 ring-primary",
              )}
              onClick={() => setDiscountType("percentage")}
            >
              <PercentIcon className="w-6 h-6" />
              <span>Percentage (%)</span>
            </Button>
            <Button
              variant={discountType === "amount" ? "chonky" : "outline"}
              className={cn(
                "h-20 flex flex-col items-center justify-center gap-2",
                discountType === "amount" && "ring-2 ring-primary",
              )}
              onClick={() => setDiscountType("amount")}
            >
              <Calculator className="w-6 h-6" />
              <span>Amount (OMR)</span>
            </Button>
          </div>

          <div className="space-y-3">
            <Label htmlFor="discount-value">
              {discountType === "percentage"
                ? "Discount percentage"
                : "Discount amount (OMR)"}
            </Label>
            <Input
              id="discount-value"
              type="number"
              placeholder={
                discountType === "percentage" ? "e.g. 10" : "e.g. 5.00"
              }
              min="0"
              step={discountType === "percentage" ? "1" : "0.1"}
              max={discountType === "percentage" ? "100" : undefined}
              value={discountValue === 0 ? "" : discountValue}
              onChange={(e) =>
                setDiscountValue(parseFloat(e.target.value) || 0)
              }
              autoFocus
            />

            <div className="text-sm text-muted-foreground">
              {discountType === "percentage"
                ? `This will reduce the total by ${(
                    subtotal * (discountValue / 100) || 0
                  ).toFixed(3)} OMR`
                : `This will reduce the total by ${Math.min(
                    discountValue,
                    subtotal,
                  ).toFixed(3)} OMR`}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="chonky-secondary"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            variant="chonky"
            onClick={onApply}
            disabled={discountValue <= 0}
          >
            Apply Discount
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
