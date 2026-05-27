"use client";

import { useState, useCallback, useRef } from "react";
import { SelectedVolume } from "../types";
import { LubricantProduct } from "@/lib/hooks/data/useIntegratedPOSData";
import { useToast } from "@/components/ui/use-toast";
import { useNotification } from "@/lib/contexts/NotificationContext";
import { createLubricantVolumeAlert } from "@/lib/utils/alert-helpers";
import { parseVolumeString } from "@/lib/utils/volume-parser";

interface UseLubricantVolumeProps {
  addToCart: (
    product: { id: number; name: string; price: number; brand?: string },
    details?: string,
    quantity?: number,
    source?: string,
    bottleType?: "open" | "closed",
  ) => void;
  calculateCartClosedCount: (productId: string | number) => number;
  calculateCartClosedCountBySize?: (
    productId: string | number,
    size: string,
  ) => number;
  calculateCartOpenVolume: (productId: string | number) => number;
  isMobile: boolean;
  setShowCart: (show: boolean) => void;
  setActiveCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
}

export function useLubricantVolume({
  addToCart,
  calculateCartClosedCount,
  calculateCartClosedCountBySize,
  calculateCartOpenVolume,
  isMobile,
  setShowCart,
  setActiveCategory,
  setSearchQuery,
}: UseLubricantVolumeProps) {
  const { toast } = useToast();
  const { addPersistentNotification } = useNotification();
  const lastNotificationRef = useRef<{ key: string; timestamp: number } | null>(
    null,
  );

  const calcCartClosedCountBySize = useCallback(
    (productId: string | number, size: string) => {
      if (calculateCartClosedCountBySize) {
        return calculateCartClosedCountBySize(productId, size);
      }
      // Fallback (non-size-aware): treat all closed bottles as the same pool
      return calculateCartClosedCount(productId);
    },
    [calculateCartClosedCountBySize, calculateCartClosedCount],
  );

  // Volume modal states
  const [selectedOil, setSelectedOil] = useState<LubricantProduct | null>(null);
  const [isVolumeModalOpen, setIsVolumeModalOpen] = useState(false);
  const [selectedVolumes, setSelectedVolumes] = useState<
    Array<{
      size: string;
      price: number;
      quantity: number;
      bottleType?: "open" | "closed";
      availableQuantity?: number;
    }>
  >([]);
  const [currentBottleVolumeSize, setCurrentBottleVolumeSize] = useState<
    string | null
  >(null);
  const [showBottleTypeDialog, setShowBottleTypeDialog] = useState(false);

  const handleLubricantSelect = useCallback((lubricant: LubricantProduct) => {
    setSelectedOil(lubricant);
    setSelectedVolumes([]);
    setIsVolumeModalOpen(true);
  }, []);

  /** Calculate total open volume selected in the modal */
  const calculateTotalOpenVolumeSelected = useCallback(
    (volumes: SelectedVolume[]): number => {
      return volumes
        .filter((v) => v.bottleType === "open")
        .reduce((total, v) => {
          const volumeAmount = parseVolumeString(v.size);
          return total + volumeAmount * v.quantity;
        }, 0);
    },
    [],
  );

  /** Handle volume selection with bottle type prompt for smaller volumes */
  const handleVolumeClick = useCallback(
    (volume: { size: string; price: number }) => {
      if (!selectedOil) return;
      const sizeNum = parseVolumeString(volume.size);
      const isSmallVolume = sizeNum < 4;

      if (isSmallVolume) {
        setCurrentBottleVolumeSize(volume.size);
        setIsVolumeModalOpen(false);
        setShowBottleTypeDialog(true);
      } else {
        // Directly add as closed — inline call to addVolumeWithBottleType
        addVolumeWithBottleType(volume.size, "closed");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedOil],
  );

  /** Add volume with selected bottle type */
  const addVolumeWithBottleType = useCallback(
    (size: string, bottleType: "open" | "closed") => {
      if (!selectedOil) return;

      const volumeDetails = selectedOil.volumes.find((v) => v.size === size);
      if (!volumeDetails) return;

      // Add to selectedVolumes
      setSelectedVolumes((prev) => {
        // Validate Open Bottle Stock against latest modal state
        if (
          bottleType === "open" &&
          selectedOil.totalOpenVolume !== undefined
        ) {
          const cartOpenVolume = calculateCartOpenVolume(selectedOil.id);
          const currentModalOpenVolume = prev
            .filter((v) => v.bottleType === "open")
            .reduce((total, v) => {
              const volumeAmount = parseVolumeString(v.size);
              return total + volumeAmount * v.quantity;
            }, 0);
          const volumeAmount = parseVolumeString(size);
          const newTotal = cartOpenVolume + currentModalOpenVolume + volumeAmount;

          if (newTotal > selectedOil.totalOpenVolume) {
            toast({
              title: "Insufficient Open Bottle Stock",
              description: `Only ${selectedOil.totalOpenVolume.toFixed(2)}L available.`,
              variant: "destructive",
            });
            return prev;
          }
        }

        // Validate closed stock against latest modal state
        if (bottleType === "closed") {
          const maxBottleLiters = Math.max(
          parseVolumeString(selectedOil.type || ""),
            ...selectedOil.volumes
              .map((v) => parseVolumeString(v.size))
              .filter((n) => Number.isFinite(n) && n > 0),
            1,
          );
          const cartClosedBottleEquivalent = selectedOil.volumes.reduce(
            (sum, v) => {
              const liters = parseVolumeString(v.size);
              if (!Number.isFinite(liters) || liters <= 0) return sum;
              const qty = calcCartClosedCountBySize(selectedOil.id, v.size);
              return sum + qty * (liters / maxBottleLiters);
            },
            0,
          );
          const modalClosedBottleEquivalent = prev
            .filter((v) => !v.bottleType || v.bottleType === "closed")
            .reduce((sum, v) => {
              const liters = parseVolumeString(v.size);
              if (!Number.isFinite(liters) || liters <= 0) return sum;
              return sum + (v.quantity || 0) * (liters / maxBottleLiters);
            }, 0);
          const requestedBottleEquivalent =
            parseVolumeString(size) / maxBottleLiters;
          const availableClosedTotal = Number(
            selectedOil?.volumes?.[0]?.bottleStates?.closed ?? 0,
          );

          if (
            cartClosedBottleEquivalent +
              modalClosedBottleEquivalent +
              requestedBottleEquivalent >
            availableClosedTotal + 1e-9
          ) {
            toast({
              title: "Insufficient Closed Bottle Stock",
              description: `Only ${availableClosedTotal} closed bottles available.`,
              variant: "destructive",
            });
            return prev;
          }
        }

        const existing = prev.find(
          (v) => v.size === size && v.bottleType === bottleType,
        );
        if (existing) {
          return prev.map((v) =>
            v.size === size && v.bottleType === bottleType
              ? { ...v, quantity: v.quantity + 1 }
              : v,
          );
        }
        return [...prev, { ...volumeDetails, quantity: 1, bottleType }];
      });

      // Reset and Swap Back
      setShowBottleTypeDialog(false);
      setCurrentBottleVolumeSize(null);
      setIsVolumeModalOpen(true);
    },
    [
      selectedOil,
      calculateCartClosedCount,
      calcCartClosedCountBySize,
      calculateCartOpenVolume,
      toast,
    ],
  );

  /** Handle quantity change for a selected volume */
  const handleQuantityChange = useCallback(
    (size: string, change: number, bottleType?: "open" | "closed") => {
      setSelectedVolumes((prev) => {
        const volumeToChange = prev.find(
          (v) =>
            v.size === size && (!bottleType || v.bottleType === bottleType),
        );

        // Validate incrementing open bottle volume
        if (
          change > 0 &&
          volumeToChange?.bottleType === "open" &&
          selectedOil?.totalOpenVolume !== undefined
        ) {
          const currentTotalOpenVolume = prev
            .filter(
              (v) =>
                !(
                  v.size === size &&
                  (!bottleType || v.bottleType === bottleType)
                ),
            )
            .filter((v) => v.bottleType === "open")
            .reduce((total, v) => {
              const volumeAmount = parseVolumeString(v.size);
              return total + volumeAmount * v.quantity;
            }, 0);

          const cartOpenVolume = calculateCartOpenVolume(selectedOil.id);
          const volumeAmount = parseVolumeString(size);
          const newQuantity = volumeToChange.quantity + change;
          const newModalTotal =
            currentTotalOpenVolume + volumeAmount * newQuantity;
          const newTotal = newModalTotal + cartOpenVolume;

          if (newTotal > selectedOil.totalOpenVolume) {
            const availableVolume = selectedOil.totalOpenVolume;
            const formattedAvailable = availableVolume
              .toFixed(1)
              .replace(/\.0$/, "");
            const formattedAttempted = newTotal.toFixed(1).replace(/\.0$/, "");

            toast({
              title: "Insufficient Open Bottle Volume",
              description: `Only ${formattedAvailable}L available in open bottles. Cannot select ${formattedAttempted}L.`,
              variant: "destructive",
            });

            // Persistent notification with dedup
            if (selectedOil?.id && selectedOil?.name) {
              const notificationKey = `${selectedOil.id}-${size}-${volumeToChange?.bottleType || "open"}-${formattedAttempted}`;
              const now = Date.now();
              const lastNotification = lastNotificationRef.current;

              if (
                lastNotification &&
                lastNotification.key === notificationKey &&
                now - lastNotification.timestamp < 2000
              ) {
                return prev;
              }

              lastNotificationRef.current = {
                key: notificationKey,
                timestamp: now,
              };

              const alertParams = createLubricantVolumeAlert({
                productId: selectedOil.id.toString(),
                productName: selectedOil.name,
                availableVolume: availableVolume,
                attemptedVolume: newTotal,
                size: size,
                bottleType: volumeToChange?.bottleType || "open",
              });
              addPersistentNotification(alertParams).catch((error) => {
                console.error("Error creating persistent notification:", error);
              });
            }

            return prev;
          }
        }

        // Validate incrementing closed bottle quantity by size
        if (
          change > 0 &&
          (volumeToChange?.bottleType === "closed" || !volumeToChange?.bottleType)
        ) {
          const maxBottleLiters = Math.max(
            parseVolumeString(selectedOil?.type || ""),
            ...(selectedOil?.volumes ?? [])
              .map((v) => parseVolumeString(v.size))
              .filter((n) => Number.isFinite(n) && n > 0),
            1,
          );
          const cartClosedBottleEquivalent = (selectedOil?.volumes ?? []).reduce(
            (sum, v) => {
              const liters = parseVolumeString(v.size);
              if (!Number.isFinite(liters) || liters <= 0) return sum;
              const qty = calcCartClosedCountBySize(selectedOil!.id, v.size);
              return sum + qty * (liters / maxBottleLiters);
            },
            0,
          );
          const availableClosed = Number(
            selectedOil?.volumes?.[0]?.bottleStates?.closed ?? 0,
          );
          const otherModalClosedBottleEquivalent = prev
            .filter(
              (v) =>
                !(
                  v.size === size &&
                  (!bottleType || v.bottleType === bottleType)
                ),
            )
            .filter((v) => !v.bottleType || v.bottleType === "closed")
            .reduce((sum, v) => {
              const liters = parseVolumeString(v.size);
              if (!Number.isFinite(liters) || liters <= 0) return sum;
              return sum + (v.quantity || 0) * (liters / maxBottleLiters);
            }, 0);
          const sizeBottleEquivalent =
            parseVolumeString(size) / maxBottleLiters;
          const nextQty = (volumeToChange?.quantity || 0) + change;

          // Enforce bottle-equivalent total pool for closed bottles.
          if (
            cartClosedBottleEquivalent +
              otherModalClosedBottleEquivalent +
              nextQty * sizeBottleEquivalent >
            availableClosed + 1e-9
          ) {
            toast({
              title: "Insufficient Closed Bottle Stock",
              description: `Only ${availableClosed} closed bottles available.`,
              variant: "destructive",
            });
            return prev;
          }
        }

        // Proceed with quantity change
        const updated = prev
          .map((v) =>
            v.size === size && (!bottleType || v.bottleType === bottleType)
              ? { ...v, quantity: Math.max(0, v.quantity + change) }
              : v,
          )
          .filter((v) => v.quantity > 0);
        return updated;
      });
    },
    [
      selectedOil,
      calculateCartOpenVolume,
      calculateCartClosedCount,
      calcCartClosedCountBySize,
      toast,
      addPersistentNotification,
    ],
  );

  /** Add all currently selected volumes to cart */
  const addCurrentSelectionToCart = useCallback(() => {
    selectedVolumes.forEach((volume) => {
      if (selectedOil) {
        const detailsText =
          volume.size +
          (volume.bottleType ? ` ${volume.bottleType} bottle` : "");
        const details = detailsText;
        const fullDisplayName = `${selectedOil.name} (${detailsText})`;
        const source = volume.bottleType === "open" ? "OPEN" : "CLOSED";

        addToCart(
          {
            id: selectedOil.id,
            name: selectedOil.name, // Pass the original name, CartContext will handle brand prepending
            price: volume.price,
            brand: selectedOil.brand,
          },
          details,
          volume.quantity,
          source,
          volume.bottleType || "closed",
        );
      }
    });
  }, [selectedVolumes, selectedOil, addToCart]);

  /** Add selection to cart and close modal */
  const handleAddSelectedToCart = useCallback(() => {
    addCurrentSelectionToCart();
    setIsVolumeModalOpen(false);
    setSelectedOil(null);
    setSelectedVolumes([]);
    if (isMobile) setShowCart(true);
  }, [addCurrentSelectionToCart, isMobile, setShowCart]);

  /** Add selection to cart and navigate to next category */
  const handleNextItem = useCallback(() => {
    addCurrentSelectionToCart();
    setActiveCategory("Filters");
    setIsVolumeModalOpen(false);
    setSelectedOil(null);
    setSelectedVolumes([]);
    setSearchQuery("");
  }, [addCurrentSelectionToCart, setActiveCategory, setSearchQuery]);

  /** Toggle bottle type for a volume entry */
  const toggleBottleType = useCallback((size: string) => {
    setSelectedVolumes((prev) =>
      prev.map((v) =>
        v.size === size
          ? { ...v, bottleType: v.bottleType === "open" ? "closed" : "open" }
          : v,
      ),
    );
  }, []);

  return {
    // State
    selectedOil,
    setSelectedOil,
    isVolumeModalOpen,
    setIsVolumeModalOpen,
    selectedVolumes,
    setSelectedVolumes,
    currentBottleVolumeSize,
    setCurrentBottleVolumeSize,
    showBottleTypeDialog,
    setShowBottleTypeDialog,

    // Actions
    handleLubricantSelect,
    handleVolumeClick,
    addVolumeWithBottleType,
    handleQuantityChange,
    addCurrentSelectionToCart,
    handleAddSelectedToCart,
    handleNextItem,
    toggleBottleType,
    calculateTotalOpenVolumeSelected,
  };
}
