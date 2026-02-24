"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, Shield, DollarSign, MoreHorizontal } from "lucide-react";

interface DisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefund: () => void;
  onWarranty: () => void;
  onSettlement: () => void;
  onMiscellaneous: () => void;
}

export function DisputeDialog({
  open,
  onOpenChange,
  onRefund,
  onWarranty,
  onSettlement,
  onMiscellaneous,
}: DisputeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90%] max-w-sm p-6 rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-semibold">
            Dispute Options
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <Button
            className="flex flex-col items-center justify-center gap-2 h-20 p-3"
            variant="chonky-secondary"
            onClick={() => {
              onOpenChange(false);
              onRefund();
            }}
          >
            <RotateCcw className="h-6 w-6 text-blue-600" />
            <span className="font-medium text-sm">Refund</span>
          </Button>

          <Button
            className="flex flex-col items-center justify-center gap-2 h-20 p-3"
            variant="chonky-secondary"
            onClick={() => {
              onOpenChange(false);
              onWarranty();
            }}
          >
            <Shield className="h-6 w-6 text-green-600" />
            <span className="font-medium text-sm">Warranty</span>
          </Button>

          <Button
            className="flex flex-col items-center justify-center gap-2 h-20 p-3"
            variant="chonky-secondary"
            onClick={() => {
              onOpenChange(false);
              onSettlement();
            }}
          >
            <DollarSign className="h-6 w-6 text-purple-600" />
            <span className="font-medium text-sm">Settlement</span>
          </Button>

          <Button
            className="flex flex-col items-center justify-center gap-2 h-20 p-3"
            variant="chonky-secondary"
            onClick={() => {
              onOpenChange(false);
              onMiscellaneous();
            }}
          >
            <MoreHorizontal className="h-6 w-6 text-primary" />
            <span className="font-medium text-sm">Misc</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
