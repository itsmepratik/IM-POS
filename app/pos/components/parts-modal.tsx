import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowRight, Minus, Plus, ImageIcon } from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface Part {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface PartsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedPartBrand: string | null;
  selectedPartType: string | null;
  parts: Array<{ id: number; name: string; price: number }>;
  selectedParts: Part[];
  onPartClick: (part: { id: number; name: string; price: number }) => void;
  onQuantityChange: (partId: number, change: number) => void;
  onAddToCart: () => void;
  onNext: () => void;
}

// Helper for part image
function PartImage({
  brand,
  type,
  partName,
}: {
  brand: string;
  type: string;
  partName: string;
}) {
  // Create a safe version of the path that handles undefined values
  const safeLowercase = (str: string | undefined) =>
    str ? str.toLowerCase().replace(/ /g, "-") : "";

  const imgSrc = `/parts/${safeLowercase(brand)}-${safeLowercase(
    type
  )}-${safeLowercase(partName)}.jpg`;
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
        <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={`${brand || ""} ${type || ""} ${partName || ""}`}
      className="object-contain w-full h-full p-2"
      fill
      sizes="(max-width: 768px) 64px, 96px"
      onError={() => setError(true)}
    />
  );
}

export function PartsModal({
  isOpen,
  onOpenChange,
  selectedPartBrand,
  selectedPartType,
  parts,
  selectedParts,
  onPartClick,
  onQuantityChange,
  onAddToCart,
  onNext,
}: PartsModalProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        onOpenChange(open);
      }}
    >
      <DialogContent className="w-[95%] max-w-[700px] p-6 rounded-lg max-h-[90vh] overflow-y-auto flex flex-col">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-[clamp(1.125rem,3vw,1.25rem)] font-semibold">
            {selectedPartBrand} - {selectedPartType}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 w-full flex flex-col max-w-full">
          {/* Part options grid */}
          <div
            className="grid gap-4 w-full"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            }}
          >
            {parts.map((part) => (
              <button
                key={part.id}
                className="flex flex-col items-center justify-center rounded-lg border bg-background shadow-sm p-3 sm:p-4 h-[140px] sm:h-[160px] transition hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary/50 w-full"
                onClick={() => onPartClick(part)}
                type="button"
              >
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 mb-2 flex items-center justify-center">
                  <PartImage
                    brand={selectedPartBrand || ""}
                    type={selectedPartType || ""}
                    partName={part.name}
                  />
                </div>
                <span
                  className="text-center font-medium text-xs sm:text-sm w-full px-1 whitespace-normal leading-tight hyphens-auto break-words"
                  style={{ lineHeight: 1.1 }}
                >
                  {part.name}
                </span>
                <span className="block text-xs sm:text-sm text-primary mt-1">
                  OMR {part.price.toFixed(3)}
                </span>
              </button>
            ))}
          </div>

          {/* Selected parts list */}
          {selectedParts.length > 0 && (
            <div className="border rounded-lg bg-muted/50 w-full max-w-full">
              <ScrollArea className="h-[140px] sm:h-[160px] px-1 py-2 w-full max-w-full">
                <div className="space-y-5 w-full max-w-full">
                  {selectedParts.map((part) => (
                    <div
                      key={part.id}
                      className="w-full flex items-center gap-2 min-w-0 px-2 max-w-full"
                    >
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => onQuantityChange(part.id, -1)}
                        >
                          <Minus className="h-2.5 w-2.5" />
                        </Button>
                        <span className="w-4 text-center text-[clamp(0.875rem,2vw,1rem)]">
                          {part.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => onQuantityChange(part.id, 1)}
                        >
                          <Plus className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                      <span
                        className="font-medium text-[clamp(0.875rem,2vw,1rem)] whitespace-normal break-words line-clamp-2 flex-1 min-w-0"
                        style={{ lineHeight: 1 }}
                      >
                        {part.name}
                      </span>
                      <span className="font-medium text-[clamp(0.875rem,2vw,1rem)] whitespace-nowrap pl-2 flex-shrink-0">
                        OMR {(part.price * part.quantity).toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          <div className="flex justify-between gap-3 pt-2 w-full">
            <Button
              variant="outline"
              className="px-4 sm:px-6 text-[clamp(0.875rem,2vw,1rem)]"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                className="px-4 sm:px-6 text-[clamp(0.875rem,2vw,1rem)]"
                onClick={onAddToCart}
                disabled={selectedParts.length === 0}
              >
                Go to Cart
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10"
                onClick={onNext}
                disabled={selectedParts.length === 0}
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
