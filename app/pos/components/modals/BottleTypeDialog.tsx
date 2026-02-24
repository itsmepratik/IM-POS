"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OpenBottleIcon, ClosedBottleIcon } from "@/components/ui/bottle-icons";

interface BottleTypeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  volumeSize: string | null;
  onSelect: (type: "open" | "closed") => void;
}

export function BottleTypeDialog({
  isOpen,
  onOpenChange,
  volumeSize,
  onSelect,
}: BottleTypeDialogProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="w-[90%] max-w-[400px] p-6 rounded-lg"
        aria-describedby={undefined}
      >
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-semibold text-center">
            Select Bottle Type
          </DialogTitle>
          <DialogDescription className="sr-only">
            Select bottle type for {volumeSize}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 mt-2">
          <Button
            variant="outline"
            className="h-32 flex flex-col items-center justify-center gap-3 hover:border-foreground/30 hover:bg-muted/50 transition-colors"
            onClick={() => onSelect("open")}
          >
            <div className="p-3 bg-muted rounded-full">
              <OpenBottleIcon className="w-8 h-8 text-foreground" />
            </div>
            <span className="font-medium">Open Bottle</span>
          </Button>

          <Button
            variant="outline"
            className="h-32 flex flex-col items-center justify-center gap-3 hover:border-foreground/30 hover:bg-muted/50 transition-colors"
            onClick={() => onSelect("closed")}
          >
            <div className="p-3 bg-muted rounded-full">
              <ClosedBottleIcon className="w-8 h-8 text-foreground" />
            </div>
            <span className="font-medium">Closed Bottle</span>
          </Button>
        </div>

        <Button
          variant="ghost"
          className="w-full mt-4"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
      </DialogContent>
    </Dialog>
  );
}
