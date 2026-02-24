"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Minus, ArrowRight, ImageIcon } from "lucide-react";
import { OpenBottleIcon, ClosedBottleIcon } from "@/components/ui/bottle-icons";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { LubricantProduct } from "@/lib/hooks/data/useIntegratedPOSData";
import { parseVolumeString } from "@/lib/utils/volume-parser";

interface VolumeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOil: LubricantProduct | null;
  selectedVolumes: Array<{
    size: string;
    price: number;
    quantity: number;
    bottleType?: "open" | "closed";
    availableQuantity?: number;
  }>;
  onVolumeClick: (volume: { size: string; price: number }) => void;
  onQuantityChange: (
    size: string,
    change: number,
    bottleType?: "open" | "closed",
  ) => void;
  onAddSelectedToCart: () => void;
  onNextItem: () => void;
  onCancel: () => void;
  calculateCartOpenVolume: (productId: string | number) => number;
  calculateCartClosedCount: (productId: string | number) => number;
  calculateTotalOpenVolumeSelected: (
    volumes: Array<{
      size: string;
      quantity: number;
      bottleType?: "open" | "closed";
    }>,
  ) => number;
}

export function VolumeModal({
  isOpen,
  onOpenChange,
  selectedOil,
  selectedVolumes,
  onVolumeClick,
  onQuantityChange,
  onAddSelectedToCart,
  onNextItem,
  onCancel,
  calculateCartOpenVolume,
  calculateCartClosedCount,
  calculateTotalOpenVolumeSelected,
}: VolumeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90%] max-w-[500px] rounded-lg max-h-[85vh] flex flex-col overflow-hidden gap-0">
        <>
          <DialogHeader className="p-0 shrink-0 pb-6">
            <DialogTitle className="text-base sm:text-l font-semibold">
              {selectedOil?.brand} - {selectedOil?.name}
            </DialogTitle>
            <div className="text-xs sm:text-sm text-muted-foreground font-normal mt-1">
              {selectedOil?.type}
            </div>
            <DialogDescription className="sr-only">
              Select the volume for this lubricant product
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-1 px-0 min-h-0">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="relative w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] border-2 border-border rounded-lg overflow-hidden bg-muted">
                {selectedOil?.image ? (
                  <Image
                    src={selectedOil.image}
                    alt={`${selectedOil.brand} ${selectedOil.type}`}
                    className="object-contain p-2"
                    fill
                    sizes="(max-width: 768px) 120px, 160px"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {/* Volume buttons grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                {selectedOil?.volumes.map((volume) => (
                  <Button
                    key={`volume-button-${volume.size}`}
                    variant="outline"
                    className="h-auto py-2 sm:py-3 px-2 sm:px-4 flex flex-col items-center gap-1"
                    onClick={() => onVolumeClick(volume)}
                  >
                    <div className="text-sm sm:text-base font-bold">
                      {volume.size}
                    </div>
                    <div className="text-xs sm:text-sm text-foreground">
                      OMR {volume.price.toFixed(3)}
                    </div>
                  </Button>
                ))}
              </div>

              {/* Selected volumes list */}
              {selectedVolumes.length > 0 && (
                <div className="border rounded-lg">
                  <div className="h-[180px] sm:h-[220px] overflow-y-auto scrollbar-none">
                    <div className="px-2 sm:px-3 py-2">
                      {selectedVolumes.map((volume, index) => (
                        <div
                          key={`${volume.size}-${volume.bottleType || "default"}`}
                          className={cn(
                            "flex flex-col py-1.5",
                            index === selectedVolumes.length - 1 &&
                              "mb-2 sm:mb-4",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={() =>
                                  onQuantityChange(
                                    volume.size,
                                    -1,
                                    volume.bottleType,
                                  )
                                }
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-5 text-center text-sm">
                                {volume.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                disabled={(() => {
                                  // Open bottle validation
                                  if (
                                    volume.bottleType === "open" &&
                                    selectedOil?.totalOpenVolume !== undefined
                                  ) {
                                    const currentTotalOpenVolume =
                                      selectedVolumes
                                        .filter(
                                          (v) =>
                                            !(
                                              v.size === volume.size &&
                                              v.bottleType === volume.bottleType
                                            ),
                                        )
                                        .filter((v) => v.bottleType === "open")
                                        .reduce((total, v) => {
                                          const volumeAmount =
                                            parseVolumeString(v.size);
                                          return (
                                            total + volumeAmount * v.quantity
                                          );
                                        }, 0);

                                    const cartOpenVolume =
                                      calculateCartOpenVolume(selectedOil.id);
                                    const volumeAmount = parseVolumeString(
                                      volume.size,
                                    );
                                    const newQuantity = volume.quantity + 1;
                                    const newModalTotal =
                                      currentTotalOpenVolume +
                                      volumeAmount * newQuantity;
                                    const newTotal =
                                      newModalTotal + cartOpenVolume;

                                    return (
                                      newTotal > selectedOil.totalOpenVolume
                                    );
                                  }

                                  // Closed bottle validation
                                  if (
                                    !volume.bottleType ||
                                    volume.bottleType === "closed"
                                  ) {
                                    if (
                                      volume.availableQuantity === undefined &&
                                      !selectedOil?.volumes?.[0]?.bottleStates
                                        ?.closed
                                    )
                                      return false;

                                    const availableClosed =
                                      selectedOil?.volumes?.[0]?.bottleStates
                                        ?.closed || 0;
                                    const cartClosedCount =
                                      calculateCartClosedCount(selectedOil!.id);
                                    const modalClosedCount = selectedVolumes
                                      .filter(
                                        (v) =>
                                          !v.bottleType ||
                                          v.bottleType === "closed",
                                      )
                                      .reduce((sum, v) => sum + v.quantity, 0);

                                    return (
                                      cartClosedCount + modalClosedCount + 1 >
                                      availableClosed
                                    );
                                  }

                                  return false;
                                })()}
                                onClick={() =>
                                  onQuantityChange(
                                    volume.size,
                                    1,
                                    volume.bottleType,
                                  )
                                }
                                title={
                                  volume.bottleType === "open" &&
                                  selectedOil?.totalOpenVolume !== undefined
                                    ? (() => {
                                        const currentTotalOpenVolume =
                                          calculateTotalOpenVolumeSelected(
                                            selectedVolumes,
                                          );
                                        const cartOpenVolume =
                                          calculateCartOpenVolume(
                                            selectedOil.id,
                                          );
                                        const volumeAmount = parseVolumeString(
                                          volume.size,
                                        );
                                        const newTotal =
                                          currentTotalOpenVolume +
                                          volumeAmount +
                                          cartOpenVolume;
                                        if (
                                          newTotal > selectedOil.totalOpenVolume
                                        ) {
                                          return `Only ${selectedOil.totalOpenVolume.toFixed(1).replace(/\.0$/, "")}L available in open bottles`;
                                        }
                                        return undefined;
                                      })()
                                    : undefined
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-[60px_24px_1fr] items-center min-w-0 flex-1">
                              <span className="font-bold text-sm">
                                {volume.size}
                              </span>

                              <div className="flex items-center justify-center">
                                {volume.bottleType &&
                                  (volume.bottleType === "closed" ? (
                                    <ClosedBottleIcon className="h-4 w-4 text-primary flex-shrink-0" />
                                  ) : (
                                    <OpenBottleIcon className="h-4 w-4 text-primary flex-shrink-0" />
                                  ))}
                              </div>

                              <span className="font-bold text-sm text-right w-full text-foreground">
                                OMR{" "}
                                {(volume.price * volume.quantity).toFixed(3)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-0 bg-background shrink-0 pt-6">
            <div className="flex justify-between gap-2 sm:gap-3">
              <Button
                variant="outline"
                className="px-2 sm:px-6 text-sm sm:text-base"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="chonky"
                  className="px-2 sm:px-6 text-sm sm:text-base"
                  onClick={onAddSelectedToCart}
                  disabled={selectedVolumes.length === 0}
                >
                  Go to Cart
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 sm:h-10 sm:w-10"
                  onClick={onNextItem}
                  disabled={selectedVolumes.length === 0}
                >
                  <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            </div>
          </div>
        </>
      </DialogContent>
    </Dialog>
  );
}
