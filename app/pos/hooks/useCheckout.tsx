"use client";

import { useState, useCallback, useRef } from "react";
import { CartItem, TradeinBattery } from "../types";
import {
  Product,
  LubricantProduct,
} from "@/lib/hooks/data/useIntegratedPOSData";
import { useToast } from "@/components/ui/use-toast";
import { useBranch } from "@/lib/contexts/DataProvider";
import { CustomerData } from "@/app/customers/customer-form";

// Receipt snapshot — preserves data after cart is cleared for receipt rendering
export interface ReceiptSnapshot {
  cart: CartItem[];
  appliedDiscount: { type: "percentage" | "amount"; value: number } | null;
  appliedTradeInAmount: number;
  selectedCashier: { id: string; name: string } | null;
  currentCustomer: CustomerData | null;
  carPlateNumber: string;
  selectedPaymentMethod:
    | "card"
    | "cash"
    | "mobile"
    | "on-hold"
    | "credit"
    | null;
  paymentRecipient: string | null;
  tradeinBatteries: TradeinBattery[];
}

interface UseCheckoutProps {
  cart: CartItem[];
  products: Product[];
  lubricantProducts: LubricantProduct[];
  getProductAvailability: (productId: number) => any;
  syncProducts: (force?: boolean, silent?: boolean) => Promise<void>;
  contextClearCart: () => void;
  appliedDiscount: { type: "percentage" | "amount"; value: number } | null;
  appliedTradeInAmount: number;
  tradeinBatteries: TradeinBattery[];
  cartContainsAnyBatteries: (cartItems: CartItem[]) => boolean;
  resetTradeInDialog: () => void;
  setAppliedDiscount: (
    discount: { type: "percentage" | "amount"; value: number } | null,
  ) => void;
  setDiscountValue: (value: number) => void;
  setAppliedTradeInAmount: (amount: number) => void;
  setShowCart: (show: boolean) => void;
}

export function useCheckout({
  cart,
  products,
  lubricantProducts,
  getProductAvailability,
  syncProducts,
  contextClearCart,
  appliedDiscount,
  appliedTradeInAmount,
  tradeinBatteries,
  cartContainsAnyBatteries,
  resetTradeInDialog,
  setAppliedDiscount,
  setDiscountValue,
  setAppliedTradeInAmount,
  setShowCart,
}: UseCheckoutProps) {
  const { toast } = useToast();
  const { currentBranch, inventoryLocationId } = useBranch();

  // Checkout flow state
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "card" | "cash" | "mobile" | "on-hold" | "credit" | null
  >(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showOtherOptions, setShowOtherOptions] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // On Hold state
  const [isOnHoldMode, setIsOnHoldMode] = useState(false);
  const [carPlateNumber, setCarPlateNumber] = useState("");
  const [showOnHoldTicket, setShowOnHoldTicket] = useState(false);

  // Transaction data
  const [transactionData, setTransactionData] = useState({
    receiptNumber: "",
    currentDate: "",
    currentTime: "",
  });

  // Cashier state
  const [isCashierSelectOpen, setIsCashierSelectOpen] = useState(false);
  const [enteredCashierId, setEnteredCashierId] = useState<string>("");
  const [fetchedCashier, setFetchedCashier] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [cashierIdError, setCashierIdError] = useState<string | null>(null);
  const [selectedCashier, setSelectedCashier] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Payment recipient
  const [paymentRecipient, setPaymentRecipient] = useState<string | null>(null);

  // Customer state
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerData | null>(
    null,
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [showCustomerSuccess, setShowCustomerSuccess] = useState(false);

  // ── Receipt Snapshot ──────────────────────────────────────────────────
  // Preserves cart + metadata after resetPOSState clears live state.
  // ReceiptPreviewDialog and SuccessDialog consume this to render
  // the sold items, even though the live cart is already empty.
  const receiptSnapshotRef = useRef<ReceiptSnapshot | null>(null);

  /** Get availability by numeric ID */
  const getAvailabilityByNumericId = useCallback(
    (productId: number) => {
      try {
        return getProductAvailability(productId);
      } catch {
        return null;
      }
    },
    [getProductAvailability],
  );

  /** Begin checkout — validate stock, open customer form */
  const handleCheckout = useCallback(async () => {
    if (isCheckoutLoading) return;
    setIsCheckoutLoading(true);

    try {
      if (cart.length === 0) {
        toast({
          title: "Empty Cart",
          description: "Please add items to your cart before checking out.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      // Validate stock
      const stockValidationErrors: string[] = [];
      for (const cartItem of cart) {
        if (cartItem.id === 9999 || cartItem.name === "Labor - Custom Service")
          continue;

        try {
          const availability = getAvailabilityByNumericId(cartItem.id);
          if (availability) {
            if (!availability.canSell) {
              stockValidationErrors.push(
                `${cartItem.name}: ${availability.errorMessage || "Not available"}`,
              );
            } else if (cartItem.quantity > availability.availableQuantity) {
              stockValidationErrors.push(
                `${cartItem.name}: Only ${availability.availableQuantity} available, but ${cartItem.quantity} requested`,
              );
            }
          } else {
            stockValidationErrors.push(
              `${cartItem.name}: Product not found in inventory`,
            );
          }
        } catch (availabilityError) {
          console.error(
            `Error checking availability for ${cartItem.name}:`,
            availabilityError,
          );
          stockValidationErrors.push(
            `${cartItem.name}: Error checking availability`,
          );
        }
      }

      if (stockValidationErrors.length > 0) {
        toast({
          title: "Stock Validation Failed",
          description: (
            <div className="space-y-2">
              <p>The following items have insufficient stock:</p>
              <ul className="list-disc list-inside text-sm">
                {stockValidationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
              <p className="text-sm font-medium">
                Please remove or reduce quantities before checking out.
              </p>
            </div>
          ),
          variant: "destructive",
          duration: 8000,
        });
        return;
      }

      // Setup the transaction metadata and open checkout modal directly
      const newCurrentDate = new Date().toLocaleDateString("en-GB");
      const newCurrentTime = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      setTransactionData({
        receiptNumber: "",
        currentDate: newCurrentDate,
        currentTime: newCurrentTime,
      });

      setEnteredCashierId("");
      setFetchedCashier(null);
      setCashierIdError(null);
      setIsCheckoutModalOpen(true);
    } catch (error) {
      console.error("Critical error in handleCheckout:", error);
      toast({
        title: "Checkout Error",
        description:
          "An unexpected error occurred during checkout. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsCheckoutLoading(false);
    }
  }, [cart, isCheckoutLoading, getAvailabilityByNumericId, toast]);

  /** After payment method selection — validate, open cashier dialog */
  const handlePaymentComplete = useCallback(() => {
    if (isOnHoldMode || cartContainsAnyBatteries(cart)) {
      if (!carPlateNumber.trim()) {
        toast({
          title: "Missing Information",
          description: "Car plate number is required for on-hold transactions.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }
    }

    setIsCheckoutModalOpen(false);
    setEnteredCashierId("");
    setFetchedCashier(null);
    setCashierIdError(null);
    setIsCashierSelectOpen(true);
  }, [isOnHoldMode, cartContainsAnyBatteries, cart, carPlateNumber, toast]);

  /** Prepare cart items for the checkout API */
  const prepareCartForAPI = useCallback(() => {
    return cart.map((item) => {
      if (item.id === 9999 || item.name === "Labor - Custom Service") {
        return {
          productId: "9999",
          quantity: item.quantity,
          sellingPrice: item.price,
          volumeDescription: item.name,
        };
      }

      const productInfo = products.find((p) => p.id === item.id);
      const lubricantProductInfo = lubricantProducts.find(
        (p) => p.id === item.id,
      );
      const isLubricant =
        productInfo?.category === "Lubricants" ||
        lubricantProductInfo !== undefined;

      const originalId =
        productInfo?.originalId || lubricantProductInfo?.originalId;
      if (!originalId) {
        throw new Error(`Original ID not found for product ${item.id}`);
      }

      return {
        productId: originalId,
        quantity: item.quantity,
        sellingPrice: item.price,
        volumeDescription: item.details || item.name,
        source: (isLubricant
          ? item.bottleType === "open"
            ? "OPEN"
            : "CLOSED"
          : undefined) as "OPEN" | "CLOSED" | undefined,
      };
    });
  }, [cart, products, lubricantProducts]);

  /** Prepare trade-in entries for the API */
  const prepareTradeInsForAPI = useCallback(() => {
    if (tradeinBatteries.length === 0) return undefined;
    return tradeinBatteries.map((battery) => ({
      productId: `tradein-${battery.size.toLowerCase().replace(/\s+/g, "-")}-${battery.status}`,
      quantity: 1,
      tradeInValue: battery.amount,
      size: battery.size,
      condition: battery.status,
      name: battery.size,
      costPrice: battery.amount,
    }));
  }, [tradeinBatteries]);

  // ── Background API Processor ──────────────────────────────────────────
  // Fires the checkout API call without blocking the UI.
  // On success: updates receipt reference number silently.
  // On failure: shows a persistent error toast.
  const processInBackground = useCallback(
    (
      payload: Parameters<
        typeof import("@/lib/services/checkout-service").checkoutService.processCheckout
      >[0],
    ) => {
      // Detached promise — does NOT block UI
      import("@/lib/services/checkout-service")
        .then(({ checkoutService }) => checkoutService.processCheckout(payload))
        .then((result) => {
          if (result.success) {
            // Update receipt reference with the real server-generated number
            const ref =
              result.data?.transaction?.referenceNumber ||
              (result.data as any)?.referenceNumber;
            if (ref) {
              setTransactionData((prev) => ({ ...prev, receiptNumber: ref }));
            }

            // Silent inventory refresh in the background
            syncProducts(false, true).catch((err) => {
              console.error("Background inventory refresh failed:", err);
            });
          } else {
            toast({
              title: "Transaction Recording Issue",
              description:
                "Payment was accepted but recording to the database failed. Please note your receipt number and contact support.",
              variant: "destructive",
              duration: 0, // persistent until dismissed
            });
          }
        })
        .catch((error) => {
          console.error("Background checkout API error:", error);
          toast({
            title: "Transaction Recording Failed",
            description: `The sale was NOT recorded in the database. Error: ${(error as Error)?.message || "Unknown"}. Please retry or contact support.`,
            variant: "destructive",
            duration: 0, // persistent until dismissed
          });
        });
    },
    [syncProducts, toast],
  );

  // ── On-Hold Background Processor ──────────────────────────────────────
  // Same pattern but for on-hold transactions specifically.
  const processOnHoldInBackground = useCallback(
    (
      payload: Parameters<
        typeof import("@/lib/services/checkout-service").checkoutService.processCheckout
      >[0],
    ) => {
      import("@/lib/services/checkout-service")
        .then(({ checkoutService }) => checkoutService.processCheckout(payload))
        .then((result) => {
          if (result.success) {
            const ref =
              result.data?.transaction?.referenceNumber ||
              (result.data as any)?.referenceNumber;
            if (ref) {
              setTransactionData((prev) => ({ ...prev, receiptNumber: ref }));
            }

            toast({
              title: "On-Hold Transaction Saved",
              description: "Transaction has been recorded successfully.",
              variant: "default",
              duration: 3000,
            });

            syncProducts(false, true).catch(() => {});
          } else {
            toast({
              title: "On-Hold Recording Issue",
              description:
                "Transaction ticket was generated but database recording failed. Contact support.",
              variant: "destructive",
              duration: 0,
            });
          }
        })
        .catch((error) => {
          console.error("Background on-hold API error:", error);
          toast({
            title: "On-Hold Recording Failed",
            description: `Error: ${(error as Error)?.message || "Unknown"}. The on-hold ticket was generated but NOT saved to the database.`,
            variant: "destructive",
            duration: 0,
          });
        });
    },
    [syncProducts, toast],
  );

  // ── Optimistic Finalize Payment ───────────────────────────────────────
  // SYNCHRONOUS — shows success/ticket immediately, fires API in background.
  const handleFinalizePayment = useCallback(() => {
    if (isProcessingCheckout) return;

    // ─── On Hold workflow ───────────────────────────────────────────
    if (isOnHoldMode) {
      if (!carPlateNumber.trim()) {
        toast({
          title: "Missing Information",
          description: "Car plate number is required for on-hold transactions.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      if (!selectedCashier) {
        toast({
          title: "Missing Information",
          description:
            "Cashier selection is required for on-hold transactions.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      // Prepare data synchronously
      let cartForAPI;
      try {
        cartForAPI = prepareCartForAPI();
      } catch (err) {
        toast({
          title: "Data Error",
          description:
            (err as Error)?.message || "Failed to prepare cart data.",
          variant: "destructive",
          duration: 5000,
        });
        return;
      }
      const tradeInsForAPI = prepareTradeInsForAPI();

      // Generate optimistic timestamp + reference
      const newCurrentDate = new Date().toLocaleDateString("en-GB");
      const newCurrentTime = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      setTransactionData({
        receiptNumber: `OH-${Date.now()}`,
        currentDate: newCurrentDate,
        currentTime: newCurrentTime,
      });

      // Snapshot receipt data before any state is cleared
      receiptSnapshotRef.current = {
        cart: [...cart],
        appliedDiscount,
        appliedTradeInAmount,
        selectedCashier,
        currentCustomer,
        carPlateNumber,
        selectedPaymentMethod,
        paymentRecipient,
        tradeinBatteries: [...tradeinBatteries],
      };

      // Show on-hold ticket IMMEDIATELY
      setShowOnHoldTicket(true);
      setIsCashierSelectOpen(false);

      // Fire API in background
      const payload = {
        locationId:
          inventoryLocationId || currentBranch?.id || "default-location",
        shopId: currentBranch?.id || "default-shop",
        paymentMethod: "ON_HOLD",
        cashierId: selectedCashier?.id || "on-hold-system",
        cart: cartForAPI,
        carPlateNumber: carPlateNumber.trim() || undefined,
        customerId: currentCustomer?.id || undefined,
        ...(tradeInsForAPI ? { tradeIns: tradeInsForAPI } : {}),
        ...(appliedDiscount ? { discount: appliedDiscount } : {}),
      };

      processOnHoldInBackground(payload as any);
      return;
    }

    // ─── Regular payment workflow ───────────────────────────────────
    if (!selectedPaymentMethod || !selectedCashier) {
      toast({
        title: "Missing Information",
        description: "Payment method and cashier are required.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Prepare data synchronously (pure transforms, <1ms)
    let cartForAPI;
    try {
      cartForAPI = prepareCartForAPI();
    } catch (err) {
      toast({
        title: "Data Error",
        description: (err as Error)?.message || "Failed to prepare cart data.",
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    const tradeInsForAPI = prepareTradeInsForAPI();

    // Generate optimistic reference + timestamp
    const newCurrentDate = new Date().toLocaleDateString("en-GB");
    const newCurrentTime = new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    setTransactionData({
      receiptNumber: `OPT-${Date.now()}`,
      currentDate: newCurrentDate,
      currentTime: newCurrentTime,
    });

    // ── Snapshot receipt data BEFORE clearing cart ──────────────────
    receiptSnapshotRef.current = {
      cart: [...cart],
      appliedDiscount,
      appliedTradeInAmount,
      selectedCashier,
      currentCustomer,
      carPlateNumber,
      selectedPaymentMethod,
      paymentRecipient,
      tradeinBatteries: [...tradeinBatteries],
    };

    // ── Show success IMMEDIATELY ───────────────────────────────────
    setIsCashierSelectOpen(false);
    setShowSuccess(true);

    // ── Fire API in background (non-blocking) ──────────────────────
    const payload = {
      locationId:
        inventoryLocationId || currentBranch?.id || "default-location",
      shopId: currentBranch?.id || "default-shop",
      paymentMethod: selectedPaymentMethod.toUpperCase(),
      cashierId: selectedCashier?.id || "default-cashier",
      cart: cartForAPI,
      carPlateNumber: carPlateNumber.trim() || undefined,
      customerId: currentCustomer?.id || undefined,
      ...(tradeInsForAPI ? { tradeIns: tradeInsForAPI } : {}),
      ...(appliedDiscount ? { discount: appliedDiscount } : {}),
      ...(selectedPaymentMethod === "mobile" && paymentRecipient
        ? { mobilePaymentAccount: paymentRecipient }
        : {}),
      ...(selectedPaymentMethod === "mobile" && currentCustomer?.phone
        ? { mobileNumber: currentCustomer.phone }
        : {}),
    };

    processInBackground(payload as any);
  }, [
    isProcessingCheckout,
    isOnHoldMode,
    carPlateNumber,
    selectedCashier,
    selectedPaymentMethod,
    prepareCartForAPI,
    prepareTradeInsForAPI,
    appliedDiscount,
    appliedTradeInAmount,
    currentCustomer,
    paymentRecipient,
    tradeinBatteries,
    inventoryLocationId,
    currentBranch,
    cart,
    processInBackground,
    processOnHoldInBackground,
    toast,
  ]);

  /** Reset all POS state after a transaction is complete */
  const resetPOSState = useCallback(() => {
    contextClearCart();
    setShowCart(false);
    setSelectedPaymentMethod(null);
    setAppliedDiscount(null);
    setDiscountValue(0);
    setAppliedTradeInAmount(0);
    resetTradeInDialog();
    setSelectedCashier(null);
    setEnteredCashierId("");
    setFetchedCashier(null);
    setCashierIdError(null);
    setPaymentRecipient(null);
    setCurrentCustomer(null);
    setSelectedCustomerId("");
  }, [
    contextClearCart,
    resetTradeInDialog,
    setAppliedDiscount,
    setDiscountValue,
    setAppliedTradeInAmount,
    setShowCart,
  ]);

  /** Handle customer form submission */
  const handleAddCustomer = useCallback((customerData: CustomerData) => {
    setCurrentCustomer(customerData);
    setShowCustomerSuccess(true);
    setIsCustomerFormOpen(false);

    setTimeout(() => {
      setShowCustomerSuccess(false);
    }, 2000);
  }, []);

  /** Handle skipping customer form */
  const handleSkipCustomerForm = useCallback(() => {
    setIsCustomerFormOpen(false);
  }, []);

  return {
    // Checkout flow state
    isCheckoutModalOpen,
    setIsCheckoutModalOpen,
    selectedPaymentMethod,
    setSelectedPaymentMethod,
    showSuccess,
    setShowSuccess,
    showReceiptDialog,
    setShowReceiptDialog,
    showOtherOptions,
    setShowOtherOptions,
    isCheckoutLoading,
    isProcessingCheckout,

    // On Hold state
    isOnHoldMode,
    setIsOnHoldMode,
    carPlateNumber,
    setCarPlateNumber,
    showOnHoldTicket,
    setShowOnHoldTicket,

    // Transaction data
    transactionData,
    setTransactionData,

    // Cashier state
    isCashierSelectOpen,
    setIsCashierSelectOpen,
    enteredCashierId,
    setEnteredCashierId,
    fetchedCashier,
    setFetchedCashier,
    cashierIdError,
    setCashierIdError,
    selectedCashier,
    setSelectedCashier,

    // Payment
    paymentRecipient,
    setPaymentRecipient,

    // Customer state
    isCustomerFormOpen,
    setIsCustomerFormOpen,
    currentCustomer,
    setCurrentCustomer,
    selectedCustomerId,
    setSelectedCustomerId,
    showCustomerSuccess,
    setShowCustomerSuccess,

    // Receipt snapshot (for dialogs to consume after cart is cleared)
    receiptSnapshotRef,

    // Actions
    handleCheckout,
    handlePaymentComplete,
    handleFinalizePayment,
    resetPOSState,
    handleAddCustomer,
    handleSkipCustomerForm,
  };
}
