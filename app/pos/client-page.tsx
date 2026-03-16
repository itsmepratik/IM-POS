"use client";

import { useState, useMemo, useCallback, memo, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Minus,
  X,
  CreditCard,
  Banknote,
  ShoppingCart,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ImageIcon,
  Check,
  Printer,
  Smartphone,
  Ticket,
  Receipt,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  PercentIcon,
  Scissors,
  Calculator,
  Droplet,
  Package,
  Trash2,
  Wrench,
  Car,
  Eraser,
  Edit2,
  Shield,
  DollarSign,
  MoreHorizontal,
} from "lucide-react";
import { Cashier02Icon } from "hugeicons-react";
import HugeiconsIcon from "@/components/HugeiconsIcon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogContentWithoutClose,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import { OpenBottleIcon, ClosedBottleIcon } from "@/components/ui/bottle-icons";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useCompanyInfo } from "@/lib/hooks/useCompanyInfo";
// useNotification and createLubricantVolumeAlert moved to useLubricantVolume hook
// Removed unused hooks
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

import dynamic from "next/dynamic";
// Import the RefundDialog component
const RefundDialog = dynamic(
  () =>
    import("./components/dispute/RefundDialog").then((mod) => mod.RefundDialog),
  { ssr: false },
);
const WarrantyDialog = dynamic(
  () =>
    import("./components/dispute/WarrantyDialog").then(
      (mod) => mod.WarrantyDialog,
    ),
  { ssr: false },
);
const SettlementDialog = dynamic(
  () =>
    import("./components/dispute/SettlementDialog").then(
      (mod) => mod.SettlementDialog,
    ),
  { ssr: false },
);
const MiscellaneousDialog = dynamic(
  () =>
    import("./components/dispute/MiscellaneousDialog").then(
      (mod) => mod.MiscellaneousDialog,
    ),
  { ssr: false },
);
const ImportDialog = dynamic(
  () => import("./components/import-dialog").then((mod) => mod.ImportDialog),
  { ssr: false },
);
import { customerService } from "@/lib/services/customerService";
import {
  useIntegratedPOSData,
  LubricantProduct,
  Product,
} from "@/lib/hooks/data/useIntegratedPOSData";
const FilterModal = dynamic(
  () =>
    import("./components/modals/filter-modal").then((mod) => mod.FilterModal),
  { ssr: false },
);
const PartsModal = dynamic(
  () => import("./components/modals/parts-modal").then((mod) => mod.PartsModal),
  { ssr: false },
);
const TradeInDialog = dynamic(
  () =>
    import("./components/modals/trade-in-dialog").then(
      (mod) => mod.TradeInDialog,
    ),
  { ssr: false },
);
const VolumeModal = dynamic(
  () =>
    import("./components/modals/VolumeModal").then((mod) => mod.VolumeModal),
  { ssr: false },
);
import { BrandCard } from "./components/brand-card";
import { BrandLogo } from "./components/brand-logo";
import { OnHoldTicket } from "./components/on-hold-ticket";

// Import the BillComponent
import { BillComponent } from "./components/bill-component";
import { useIsMobile } from "@/hooks/use-mobile";
import { useStaffIDs } from "@/lib/hooks/useStaffIDs";
import { Vehicle, CustomerData } from "@/app/customers/customer-form";
import { CategoryProvider } from "./context/CategoryContext";
import { CartProvider, useCart } from "./context/CartContext";
import { LubricantCategory } from "./components/categories/LubricantCategory";
import { FiltersCategory } from "./components/categories/FiltersCategory";
import { PartsCategory } from "./components/categories/PartsCategory";
import { AdditivesFluidsCategory } from "./components/categories/AdditivesFluidsCategory";
import { DataProvider, useBranch } from "@/lib/contexts/DataProvider";
import { BranchSelector } from "@/components/BranchSelector";
// parseVolumeString, findHighestVolumeFromVolumes, isHighestVolume moved to useLubricantVolume hook

// Extracted types
import {
  CartItem as CartItemType,
  ImportedCustomer,
  TradeinBattery,
} from "./types";
// Extracted components
import { CartItem } from "./components/cart/CartItem";
import { ProductButton } from "./components/cart/ProductButton";
import { Numpad } from "./components/Numpad";
import { POSCustomerForm } from "./components/POSCustomerForm";

// Extracted dialog components
const BottleTypeDialog = dynamic(
  () =>
    import("./components/modals/BottleTypeDialog").then(
      (mod) => mod.BottleTypeDialog,
    ),
  { ssr: false },
);
const CheckoutModal = dynamic(
  () =>
    import("./components/modals/CheckoutModal").then(
      (mod) => mod.CheckoutModal,
    ),
  { ssr: false },
);
const CashierDialog = dynamic(
  () =>
    import("./components/modals/CashierDialog").then(
      (mod) => mod.CashierDialog,
    ),
  { ssr: false },
);
const SuccessDialog = dynamic(
  () =>
    import("./components/modals/SuccessDialog").then(
      (mod) => mod.SuccessDialog,
    ),
  { ssr: false },
);
const ReceiptPreviewDialog = dynamic(
  () =>
    import("./components/modals/ReceiptPreviewDialog").then(
      (mod) => mod.ReceiptPreviewDialog,
    ),
  { ssr: false },
);
const DiscountDialog = dynamic(
  () =>
    import("./components/modals/DiscountDialog").then(
      (mod) => mod.DiscountDialog,
    ),
  { ssr: false },
);
const DisputeDialog = dynamic(
  () =>
    import("./components/modals/DisputeDialog").then(
      (mod) => mod.DisputeDialog,
    ),
  { ssr: false },
);
const LaborDialog = dynamic(
  () =>
    import("./components/modals/LaborDialog").then((mod) => mod.LaborDialog),
  { ssr: false },
);
const CustomerSuccessDialog = dynamic(
  () =>
    import("./components/modals/CustomerSuccessDialog").then(
      (mod) => mod.CustomerSuccessDialog,
    ),
  { ssr: false },
);
const ClearCartConfirm = dynamic(
  () =>
    import("./components/modals/ClearCartConfirm").then(
      (mod) => mod.ClearCartConfirm,
    ),
  { ssr: false },
);

// Extracted cart panel components
import { DesktopCart } from "./components/cart/DesktopCart";
import { MobileCart } from "./components/cart/MobileCart";

// Extracted hooks
import { useCartHelpers } from "./hooks/useCartHelpers";
import { useFilters } from "./hooks/useFilters";
import { useParts } from "./hooks/useParts";
import { useLubricantVolume } from "./hooks/useLubricantVolume";
import { useCheckout } from "./hooks/useCheckout";

// Note: useTradeIn and useDiscount hooks are available in ./hooks/ for future use

// Export named component
export function POSClient({ initialData }: { initialData?: any }) {
  // ✅ CRITICAL: ALL HOOKS MUST BE CALLED FIRST (React Rules of Hooks)
  const {
    lubricantProducts,
    products,
    filterBrands,
    filterTypes,
    partBrands,
    partTypes,
    lubricantBrands,
    brands,
    isLoading,
    isBackgroundSyncing,
    error,
    lastSyncTime,
    syncProducts,
    processSale,
    getProductAvailability,
  } = useIntegratedPOSData(undefined, { initialData });

  const { toast } = useToast();
  const { currentBranch, inventoryLocationId } = useBranch();
  const companyInfo = useCompanyInfo();
  // lastNotificationRef and addPersistentNotification moved to useLubricantVolume hook

  const {
    cart,
    addToCart: contextAddToCart,
    removeFromCart: contextRemoveFromCart,
    updateQuantity: contextUpdateQuantity,
    clearCart: contextClearCart,
  } = useCart();

  // Cart helper functions (stock validation, battery detection, etc.)
  const {
    calculateCartClosedCount,
    calculateCartOpenVolume,
    calculateCartCount,
    cartContainsOnlyBatteries,
    cartContainsAnyBatteries,
    handleSafeAddToCart,
  } = useCartHelpers({
    cart,
    products,
    addToCart: contextAddToCart,
  });

  const isMobile = useIsMobile();

  const [activeCategory, setActiveCategory] = useState<string>("Lubricants");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCart, setShowCart] = useState(false);

  // Filter state + handlers
  const {
    isFilterBrandModalOpen,
    setIsFilterBrandModalOpen,
    selectedFilterType,
    setSelectedFilterType,
    selectedFilterBrand,
    setSelectedFilterBrand,
    selectedFilters,
    setSelectedFilters,
    getFiltersByType,
    handleFilterClick,
    handleFilterQuantityChange,
    addFiltersToCart,
    handleAddSelectedFiltersToCart,
    handleNextFilterItem,
  } = useFilters({
    products,
    addToCart: contextAddToCart,
    calculateCartCount,
    isMobile,
    setShowCart,
    setActiveCategory,
    setSearchQuery,
  });
  const [showClearCartDialog, setShowClearCartDialog] = useState(false);
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);

  // Lubricant volume state + handlers
  const {
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
    handleLubricantSelect,
    handleVolumeClick,
    addVolumeWithBottleType,
    handleQuantityChange,
    addCurrentSelectionToCart,
    handleAddSelectedToCart,
    handleNextItem,
    toggleBottleType,
    calculateTotalOpenVolumeSelected,
  } = useLubricantVolume({
    addToCart: contextAddToCart,
    calculateCartClosedCount,
    calculateCartOpenVolume,
    isMobile,
    setShowCart,
    setActiveCategory,
    setSearchQuery,
  });
  const [filterImageError, setFilterImageError] = useState(false);
  const [lubricantImageError, setLubricantImageError] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Discount state (kept inline as these are directly used in the UI)
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [discountType, setDiscountType] = useState<"percentage" | "amount">(
    "amount",
  );
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    type: "percentage" | "amount";
    value: number;
  } | null>(null);

  // Trade-In Dialog State
  const [isTradeInDialogOpen, setIsTradeInDialogOpen] = useState(false);
  const [appliedTradeInAmount, setAppliedTradeInAmount] = useState<number>(0);

  // Volume modal states — provided by useLubricantVolume hook;

  // Filter state + handlers — provided by useFilters hook (below)

  // Parts state + handlers
  const {
    isPartBrandModalOpen,
    setIsPartBrandModalOpen,
    selectedPartType,
    setSelectedPartType,
    selectedPartBrand,
    setSelectedPartBrand,
    selectedParts,
    setSelectedParts,
    getPartsByType,
    handlePartClick,
    handlePartQuantityChange,
    handleAddSelectedPartsToCart,
    handleNextPartItem,
  } = useParts({
    products,
    addToCart: contextAddToCart,
    calculateCartCount,
    isMobile,
    setShowCart,
    setActiveCategory,
    setSearchQuery,
  });

  // Trade-in battery states (must be before useCheckout which references tradeinBatteries/resetTradeInDialog)
  const [tradeinBatteries, setTradeinBatteries] = useState<TradeinBattery[]>(
    [],
  );
  const [currentBatteryEntry, setCurrentBatteryEntry] = useState<{
    size: string;
    status: string;
    amount: number;
  }>({ size: "", status: "", amount: 0 });
  const [editingBatteryId, setEditingBatteryId] = useState<string | null>(null);
  const [tradeinFormErrors, setTradeinFormErrors] = useState<{
    size: boolean;
    status: boolean;
    amount: boolean;
  }>({ size: false, status: false, amount: false });

  const resetTradeInDialog = () => {
    setTradeinBatteries([]);
    setCurrentBatteryEntry({ size: "", status: "", amount: 0 });
    setEditingBatteryId(null);
    setTradeinFormErrors({ size: false, status: false, amount: false });
  };

  // Checkout state + handlers — provided by useCheckout hook
  const {
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
    isOnHoldMode,
    setIsOnHoldMode,
    carPlateNumber,
    setCarPlateNumber,
    showOnHoldTicket,
    setShowOnHoldTicket,
    transactionData,
    setTransactionData,
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
    paymentRecipient,
    setPaymentRecipient,
    isCustomerFormOpen,
    setIsCustomerFormOpen,
    currentCustomer,
    setCurrentCustomer,
    selectedCustomerId,
    setSelectedCustomerId,
    showCustomerSuccess,
    setShowCustomerSuccess,
    handleCheckout,
    handlePaymentComplete,
    handleFinalizePayment,
    resetPOSState,
    handleAddCustomer,
    handleSkipCustomerForm,
    receiptSnapshotRef,
  } = useCheckout({
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
  });

  // Trade-in battery states moved above useCheckout hook call

  // Get cashier data from the hook
  const { staffMembers } = useStaffIDs();

  // Trade-in helper functions
  const calculateTotalTradeInAmount = () => {
    return tradeinBatteries.reduce(
      (total, battery) => total + battery.amount,
      0,
    );
  };

  const validateCurrentBatteryEntry = () => {
    const errors = {
      size: !currentBatteryEntry.size,
      status: !currentBatteryEntry.status,
      amount: currentBatteryEntry.amount <= 0,
    };
    setTradeinFormErrors(errors);
    return !errors.size && !errors.status && !errors.amount;
  };

  const addBatteryToTradein = () => {
    if (!validateCurrentBatteryEntry()) return;

    const newBattery: TradeinBattery = {
      id: `battery-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      size: currentBatteryEntry.size,
      status: currentBatteryEntry.status as "scrap" | "resellable",
      amount: currentBatteryEntry.amount,
    };

    setTradeinBatteries((prev) => [...prev, newBattery]);
    setCurrentBatteryEntry({ size: "", status: "", amount: 0 });
    setTradeinFormErrors({ size: false, status: false, amount: false });
  };

  const editBattery = (batteryId: string) => {
    const battery = tradeinBatteries.find((b) => b.id === batteryId);
    if (battery) {
      setCurrentBatteryEntry({
        size: battery.size,
        status: battery.status,
        amount: battery.amount,
      });
      setEditingBatteryId(batteryId);
    }
  };

  const updateEditedBattery = () => {
    if (!validateCurrentBatteryEntry() || !editingBatteryId) return;

    setTradeinBatteries((prev) =>
      prev.map((battery) =>
        battery.id === editingBatteryId
          ? {
              ...battery,
              size: currentBatteryEntry.size,
              status: currentBatteryEntry.status as "scrap" | "resellable",
              amount: currentBatteryEntry.amount,
            }
          : battery,
      ),
    );

    setCurrentBatteryEntry({ size: "", status: "", amount: 0 });
    setEditingBatteryId(null);
    setTradeinFormErrors({ size: false, status: false, amount: false });
  };

  const removeBatteryFromTradein = (batteryId: string) => {
    setTradeinBatteries((prev) =>
      prev.filter((battery) => battery.id !== batteryId),
    );
    if (editingBatteryId === batteryId) {
      setEditingBatteryId(null);
      setCurrentBatteryEntry({ size: "", status: "", amount: 0 });
      setTradeinFormErrors({ size: false, status: false, amount: false });
    }
  };

  const cancelBatteryEdit = () => {
    setEditingBatteryId(null);
    setCurrentBatteryEntry({ size: "", status: "", amount: 0 });
    setTradeinFormErrors({ size: false, status: false, amount: false });
  };

  // resetTradeInDialog moved above useCheckout hook call

  // Memoize handlers
  const removeFromCart = useCallback(
    (productId: number, uniqueId?: string) => {
      if (uniqueId) {
        contextRemoveFromCart(uniqueId);
      } else {
        // Fallback for backward compatibility
        const item = cart.find((i) => i.id === productId);
        if (item) {
          contextRemoveFromCart(item.uniqueId);
        }
      }
    },
    [contextRemoveFromCart, cart],
  );

  const updateQuantity = useCallback(
    (productId: number, newQuantity: number, uniqueId?: string) => {
      const item = uniqueId
        ? cart.find((i) => i.uniqueId === uniqueId)
        : cart.find((i) => i.id === productId);

      if (!item) return false;

      // Check stock limit when increasing quantity
      if (newQuantity > item.quantity) {
        const additionalQuantity = newQuantity - item.quantity;
        const product = products.find((p) => p.id === productId);

        if (product) {
          const currentInCart = calculateCartCount(productId);
          const available =
            product.availableQuantity !== undefined
              ? product.availableQuantity
              : 9999;

          if (currentInCart + additionalQuantity > available) {
            toast({
              title: "Stock Limit Reached",
              description: `Only ${available} available. You already have ${currentInCart} in cart.`,
              variant: "destructive",
            });
            return false;
          }
        } else {
          // For lubricants
          const avail = getProductAvailability(item.id);
          if (avail && !avail.canSell) {
            toast({
              title: "Stock Limit Reached",
              description: avail.errorMessage || "Not enough stock available.",
              variant: "destructive",
            });
            return false;
          }
        }
      }

      if (uniqueId) {
        contextUpdateQuantity(uniqueId, newQuantity);
      } else {
        contextUpdateQuantity(item.uniqueId, newQuantity);
      }
      return true;
    },
    [
      contextUpdateQuantity,
      cart,
      products,
      calculateCartCount,
      getProductAvailability,
      toast,
    ],
  );

  const addToCart = useCallback(
    (
      product: { id: number; name: string; price: number },
      details?: string,
      quantity: number = 1,
      source?: string,
      bottleType?: "open" | "closed",
    ) => {
      const uniqueId = `${product.id}-${details || ""}`;

      // Find the original product to get full product details
      const originalProduct =
        products.find((p) => p.id === product.id) ||
        lubricantProducts.find((p) => p.id === product.id);

      const brand =
        originalProduct && "brand" in originalProduct
          ? originalProduct.brand
          : undefined;
      const fullName = brand ? `${brand} ${product.name}` : product.name;

      // Extract category and type information for proper battery detection
      const category = originalProduct?.category;
      const type = originalProduct?.type;

      const newItem: CartItemType = {
        ...product,
        name: fullName,
        quantity,
        details,
        uniqueId,
        // Include category and type for proper battery detection
        ...(category && { category }),
        ...(type && { type }),
        ...(brand && { brand }),
        // Include source for lubricants (required by checkout API)
        ...(source && { source }),
        // Include bottleType for lubricants (used to determine source in API preparation)
        ...(bottleType && { bottleType }),
      };

      contextAddToCart([newItem]);
    },
    [products, lubricantProducts, contextAddToCart],
  );

  // Update selectedOil when lubricantProducts refresh (e.g., after checkout)
  useEffect(() => {
    if (!selectedOil || lubricantProducts.length === 0) {
      return;
    }

    // Find the updated product with fresh inventory data
    const updatedProduct = lubricantProducts.find(
      (p) => p.id === selectedOil.id || p.originalId === selectedOil.originalId,
    );

    if (!updatedProduct) {
      return;
    }

    // Only update if totalOpenVolume or hasOpenBottles actually changed
    // This prevents infinite loops
    const hasChanged =
      updatedProduct.totalOpenVolume !== selectedOil.totalOpenVolume ||
      updatedProduct.hasOpenBottles !== selectedOil.hasOpenBottles;

    if (hasChanged) {
      setSelectedOil(updatedProduct);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lubricantProducts]);

  // calculateCartClosedCount, calculateCartOpenVolume, calculateCartCount — provided by useCartHelpers

  // handleLubricantSelect, handleVolumeClick, addVolumeWithBottleType, handleQuantityChange,
  // addCurrentSelectionToCart, handleAddSelectedToCart, handleNextItem,
  // calculateTotalOpenVolumeSelected — provided by useLubricantVolume hook

  // Brand and type arrays are now provided by the hook

  // getFiltersByType — provided by useFilters hook

  // Memoize filtered data
  const filteredLubricantBrands = useMemo(
    () =>
      lubricantBrands.filter((brand) =>
        brand.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery, lubricantBrands],
  );

  const filteredProducts = useMemo(
    () =>
      activeCategory === "Lubricants"
        ? []
        : products.filter((product) => {
            const matchesCategory = product.category === activeCategory;
            const matchesSearch = product.name
              .toLowerCase()
              .includes(searchQuery.toLowerCase());
            const matchesBrand = expandedBrand
              ? (product.brand || "").toLowerCase() ===
                expandedBrand.toLowerCase()
              : true;
            return matchesCategory && matchesSearch && matchesBrand;
          }),
    [activeCategory, searchQuery, expandedBrand, products],
  );

  // Calculate total with discount and trade-in
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const discountAmount = useMemo(() => {
    if (!appliedDiscount) return 0;

    if (appliedDiscount.type === "percentage") {
      return subtotal * (appliedDiscount.value / 100);
    } else {
      // Ensure discount doesn't exceed subtotal (or subtotal after trade-in if that's the business rule)
      // For now, discount applies to original subtotal
      return Math.min(appliedDiscount.value, subtotal);
    }
  }, [subtotal, appliedDiscount]);

  const total = useMemo(() => {
    // Apply discount first, then trade-in to the discounted subtotal
    const subtotalAfterDiscount = subtotal - discountAmount;
    // Ensure trade-in doesn't make the total negative
    return Math.max(0, subtotalAfterDiscount - appliedTradeInAmount);
  }, [subtotal, discountAmount, appliedTradeInAmount]);

  // handleSafeAddToCart — provided by useCartHelpers

  // handleFilterClick, handleFilterQuantityChange, addFiltersToCart,
  // handleAddSelectedFiltersToCart, handleNextFilterItem — provided by useFilters hook

  const clearCart = () => {
    contextClearCart();
    setAppliedTradeInAmount(0);
    // Reset trade-in dialog state directly instead of calling resetTradeInDialog()
    // which relies on setTradeinBatteries that seems to be out of scope
    setCurrentBatteryEntry({ size: "", status: "", amount: 0 });
    setEditingBatteryId(null);
    setTradeinFormErrors({ size: false, status: false, amount: false });
    setShowClearCartDialog(false);
  };

  // Total quantity of items in cart (for mobile badge)
  const totalCartQuantity = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Helper function to get availability by numeric ID using the hook's built-in function
  // handleCheckout, handlePaymentComplete, handleFinalizePayment,
  // resetPOSState, getAvailabilityByNumericId — provided by useCheckout hook

  // Replace the handleImportCustomers function definition with this one
  // (no-op placeholder wired to ImportDialog which expects product-shaped data)
  const handleImportCustomers = () => {};

  // toggleBottleType — provided by useLubricantVolume hook

  // Function to apply discount
  const applyDiscount = () => {
    setAppliedDiscount({
      type: discountType,
      value: discountValue,
    });
    setIsDiscountDialogOpen(false);
  };

  // Function to remove discount
  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountValue(0);
  };

  // Debug discount state
  useEffect(() => {}, [appliedDiscount]);

  // Mobile Cart Animation State
  const [cartVisible, setCartVisible] = useState(false);
  useEffect(() => {
    if (showCart) {
      setCartVisible(true);
    } else {
      // Wait for the slide-out transition before hiding overlay
      const timeout = setTimeout(() => setCartVisible(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [showCart]);

  // handlePartClick, handlePartQuantityChange, handleAddSelectedPartsToCart,
  // handleNextPartItem, getPartsByType — provided by useParts hook

  // cartContainsOnlyBatteries, cartContainsAnyBatteries — provided by useCartHelpers

  const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false);
  const [isWarrantyDialogOpen, setIsWarrantyDialogOpen] = useState(false);
  const [isLaborDialogOpen, setIsLaborDialogOpen] = useState(false);
  const [laborAmount, setLaborAmount] = useState<number>(0.5);

  // Settlement modal state
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);

  // Miscellaneous deduction modal state
  const [isMiscellaneousDialogOpen, setIsMiscellaneousDialogOpen] =
    useState(false);

  // isMobile — moved to top of component (required by useFilters/useParts hooks)

  // handleAddCustomer, handleSkipCustomerForm — provided by useCheckout hook

  // ✅ CONDITIONAL RENDERING AFTER ALL HOOKS (React Rules of Hooks)

  // Show error state if there's a database error
  if (error) {
    return (
      <Layout>
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-red-600 mb-4">Database Error: {error}</p>
            <p className="text-sm text-gray-600">
              Using offline data as fallback
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        className="h-[calc(100vh-4rem)] flex flex-col pb-0"
        suppressHydrationWarning
      >
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
          {/* Product Grid */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <Card className="flex-1 overflow-hidden flex flex-col h-full">
              <CardHeader className="flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-2 lg:space-y-0 pb-3 px-4 flex-shrink-0">
                {/* Desktop: Show title and branch selector side by side */}
                <div className="hidden lg:flex items-center gap-4">
                  <CardTitle className="text-xl sm:text-2xl">
                    Products
                  </CardTitle>
                  <BranchSelector compact={true} showLabel={false} />
                </div>

                {/* Mobile: Show branch selector first, then title below */}
                <div className="flex lg:hidden flex-col gap-2 w-full">
                  <div className="flex items-center justify-between w-full">
                    <BranchSelector compact={true} showLabel={false} />
                    <div className="flex gap-2 items-center lg:hidden">
                      <Button
                        variant="outline"
                        size="default"
                        className="dispute-button h-auto px-4 py-[9px] rounded-[12px] flex items-center gap-2 relative transition-all duration-200 ease-in-out active:transition-none"
                        onClick={() => setIsDisputeDialogOpen(true)}
                      >
                        <HugeiconsIcon
                          icon={Cashier02Icon}
                          size={22}
                          strokeWidth={2.2}
                          className="!size-[22px]"
                        />
                        <span className="font-medium">Dispute</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        className="cart-button h-10 w-10 relative transition-all duration-200 ease-in-out active:transition-none"
                        onClick={() => setShowCart(true)}
                      >
                        <ShoppingCart className="h-5 w-5" />
                        {totalCartQuantity > 0 && (
                          <Badge
                            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0"
                            variant="destructive"
                          >
                            {totalCartQuantity}
                          </Badge>
                        )}
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-xl sm:text-2xl">
                    Products
                  </CardTitle>
                </div>

                {/* Desktop: Show status indicators and buttons on the right */}
                <div className="hidden lg:flex gap-4 items-center">
                  {/* Status Indicator */}
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 bg-green-500 rounded-full" />
                    <span
                      className="font-mono text-sm text-gray-600"
                      suppressHydrationWarning
                    >
                      {new Date().toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="default"
                    className="dispute-button h-auto px-4 py-[9px] flex items-center gap-2 relative transition-all duration-200 ease-in-out active:transition-none"
                    onClick={() => setIsDisputeDialogOpen(true)}
                  >
                    <HugeiconsIcon
                      icon={Cashier02Icon}
                      size={22}
                      strokeWidth={2.2}
                      className="!size-[22px]"
                    />
                    <span className="font-medium">Dispute</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden flex flex-col p-4 min-h-0">
                <Tabs
                  value={activeCategory}
                  className="flex-1 flex flex-col min-h-0"
                  onValueChange={setActiveCategory}
                >
                  <div className="space-y-4 flex-shrink-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={`Search in ${activeCategory}...`}
                        className="pl-9 h-10 text-base"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        suppressHydrationWarning
                      />
                    </div>

                    {/* Labor Pill Button */}
                    <Button
                      variant="outline"
                      className="w-full rounded-[12px] border-2 border-muted-foreground/30 bg-muted-foreground/5 hover:bg-muted-foreground/10 text-foreground px-4 py-[9px] font-medium transition-colors shadow-sm mt-2 mb-2"
                      onClick={() => setIsLaborDialogOpen(true)}
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      Labor Service
                    </Button>

                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1 gap-1">
                      <TabsTrigger value="Lubricants">Lubricants</TabsTrigger>
                      <TabsTrigger value="Filters">Filters</TabsTrigger>
                      <TabsTrigger value="Parts">Parts</TabsTrigger>
                      <TabsTrigger value="Additives & Fluids">
                        Additives & Fluids
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  <ScrollArea className="flex-1 mt-4 -mx-2 px-2">
                    <div className="grid grid-cols-1 gap-4">
                      {activeCategory === "Lubricants" ? (
                        <LubricantCategory
                          searchQuery={searchQuery}
                          expandedBrand={expandedBrand}
                          setExpandedBrand={setExpandedBrand}
                          onLubricantSelect={handleLubricantSelect}
                          lubricantProducts={lubricantProducts}
                          lubricantBrands={lubricantBrands}
                          brands={brands}
                          isLoading={isLoading}
                        />
                      ) : activeCategory === "Filters" ? (
                        <FiltersCategory
                          searchQuery={searchQuery}
                          selectedFilterType={selectedFilterType}
                          setSelectedFilterType={setSelectedFilterType}
                          setSelectedFilterBrand={setSelectedFilterBrand}
                          setSelectedFilters={setSelectedFilters}
                          setIsFilterBrandModalOpen={setIsFilterBrandModalOpen}
                          filterTypes={filterTypes}
                          filterBrands={filterBrands}
                          brands={brands}
                          products={products}
                          isLoading={isLoading}
                        />
                      ) : activeCategory === "Parts" ? (
                        <PartsCategory
                          searchQuery={searchQuery}
                          selectedPartType={selectedPartType}
                          setSelectedPartType={setSelectedPartType}
                          setSelectedPartBrand={setSelectedPartBrand}
                          setSelectedParts={setSelectedParts}
                          setIsPartBrandModalOpen={setIsPartBrandModalOpen}
                          partTypes={partTypes}
                          partBrands={partBrands}
                          brands={brands}
                          products={products}
                          isLoading={isLoading}
                        />
                      ) : activeCategory === "Additives & Fluids" ? (
                        <AdditivesFluidsCategory
                          searchQuery={searchQuery}
                          expandedBrand={expandedBrand}
                          setExpandedBrand={setExpandedBrand}
                          addToCart={handleSafeAddToCart}
                          products={products}
                          brands={brands}
                          isLoading={isLoading}
                        />
                      ) : (
                        // Show other category products
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                          {filteredProducts.map((product) => (
                            <ProductButton
                              key={product.id}
                              product={product}
                              addToCart={handleSafeAddToCart}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Desktop Cart */}
          <DesktopCart
            cart={cart}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            subtotal={subtotal}
            total={total}
            discountAmount={discountAmount}
            appliedDiscount={appliedDiscount}
            appliedTradeInAmount={appliedTradeInAmount}
            isCheckoutLoading={isCheckoutLoading}
            cartContainsAnyBatteries={cartContainsAnyBatteries}
            onClearCart={() => setShowClearCartDialog(true)}
            onRemoveDiscount={removeDiscount}
            onOpenDiscount={() => setIsDiscountDialogOpen(true)}
            onOpenTradeIn={() => {
              if (appliedTradeInAmount > 0) {
                setCurrentBatteryEntry({
                  size: "",
                  status: "",
                  amount: appliedTradeInAmount,
                });
              }
              setIsTradeInDialogOpen(true);
            }}
            onCheckout={handleCheckout}
          />

          {/* Mobile Cart */}
          <MobileCart
            cart={cart}
            showCart={showCart}
            cartVisible={cartVisible}
            setShowCart={setShowCart}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            subtotal={subtotal}
            total={total}
            discountAmount={discountAmount}
            appliedDiscount={appliedDiscount}
            appliedTradeInAmount={appliedTradeInAmount}
            isCheckoutLoading={isCheckoutLoading}
            cartContainsAnyBatteries={cartContainsAnyBatteries}
            onClearCart={() => setShowClearCartDialog(true)}
            onRemoveDiscount={removeDiscount}
            onOpenDiscount={() => setIsDiscountDialogOpen(true)}
            onOpenTradeIn={() => {
              if (appliedTradeInAmount > 0) {
                setCurrentBatteryEntry({
                  size: "",
                  status: "",
                  amount: appliedTradeInAmount,
                });
              }
              setIsTradeInDialogOpen(true);
            }}
            onCheckout={handleCheckout}
          />

          {/* Volume Selection Modal */}
          <VolumeModal
            isOpen={isVolumeModalOpen}
            onOpenChange={setIsVolumeModalOpen}
            selectedOil={selectedOil}
            selectedVolumes={selectedVolumes}
            onVolumeClick={handleVolumeClick}
            onQuantityChange={handleQuantityChange}
            onAddSelectedToCart={handleAddSelectedToCart}
            onNextItem={handleNextItem}
            onCancel={() => {
              setIsVolumeModalOpen(false);
              setSelectedVolumes([]);
              setCurrentBottleVolumeSize(null);
            }}
            calculateCartOpenVolume={calculateCartOpenVolume}
            calculateCartClosedCount={calculateCartClosedCount}
            calculateTotalOpenVolumeSelected={calculateTotalOpenVolumeSelected}
          />

          {/* Bottle Type Selection Dialog */}
          <BottleTypeDialog
            isOpen={showBottleTypeDialog}
            onOpenChange={(open) => {
              if (!open) {
                setShowBottleTypeDialog(false);
                setCurrentBottleVolumeSize(null);
                setIsVolumeModalOpen(true);
              }
            }}
            volumeSize={currentBottleVolumeSize}
            onSelect={(type) => {
              if (currentBottleVolumeSize) {
                addVolumeWithBottleType(currentBottleVolumeSize, type);
              }
            }}
          />

          {/* Filter Selection Modal */}
          <FilterModal
            isOpen={isFilterBrandModalOpen}
            onOpenChange={setIsFilterBrandModalOpen}
            selectedFilterBrand={selectedFilterBrand}
            selectedFilterType={selectedFilterType}
            filters={getFiltersByType(selectedFilterType || "")
              .filter((filter) => filter.brand === selectedFilterBrand)
              .map(({ id, name, price, imageUrl, originalId }) => ({
                id,
                name,
                price,
                imageUrl,
                originalId,
                availableQuantity:
                  getFiltersByType(selectedFilterType || "").find(
                    (f) => f.id === id,
                  )?.availableQuantity || 0,
              }))}
            selectedFilters={selectedFilters}
            onFilterClick={({ id, name, price, imageUrl, originalId }) => {
              // Find the full product to pass to handleFilterClick
              const product = getFiltersByType(selectedFilterType || "").find(
                (f) => f.id === id,
              );
              if (product) handleFilterClick(product);
            }}
            onQuantityChange={handleFilterQuantityChange}
            onAddToCart={handleAddSelectedFiltersToCart}
            onNext={handleNextFilterItem}
          />

          {/* Clear Cart Confirmation Dialog */}
          <ClearCartConfirm
            open={showClearCartDialog}
            onOpenChange={setShowClearCartDialog}
            onClear={clearCart}
          />

          {/* Checkout Modal */}
          <CheckoutModal
            isOpen={isCheckoutModalOpen}
            onOpenChange={(open) => {
              setIsCheckoutModalOpen(open);
            }}
            selectedPaymentMethod={selectedPaymentMethod}
            setSelectedPaymentMethod={setSelectedPaymentMethod}
            showOtherOptions={showOtherOptions}
            setShowOtherOptions={setShowOtherOptions}
            isOnHoldMode={isOnHoldMode}
            setIsOnHoldMode={setIsOnHoldMode}
            carPlateNumber={carPlateNumber}
            setCarPlateNumber={setCarPlateNumber}
            paymentRecipient={paymentRecipient}
            setPaymentRecipient={setPaymentRecipient}
            total={total}
            cart={cart}
            cartContainsAnyBatteries={cartContainsAnyBatteries}
            staffMembers={staffMembers}
            onPaymentComplete={handlePaymentComplete}
            showSuccess={showSuccess}
          />
        </div>
      </div>

      {/* Import Dialog */}
      {isImportDialogOpen && (
        <ImportDialog
          isOpen={isImportDialogOpen}
          onClose={() => setIsImportDialogOpen(false)}
          onImport={() => setIsImportDialogOpen(false)}
        />
      )}

      {/* Refund Dialog */}
      <RefundDialog
        isOpen={isRefundDialogOpen}
        onClose={() => setIsRefundDialogOpen(false)}
      />

      {/* On Hold Ticket */}
      <OnHoldTicket
        isOpen={showOnHoldTicket}
        onClose={() => {
          setShowOnHoldTicket(false);
          // Reset the cart and states after ticket is closed
          contextClearCart();
          setIsOnHoldMode(false);
          setCarPlateNumber("");
          setSelectedPaymentMethod("");
        }}
        carPlateNumber={carPlateNumber}
        cartItems={cart}
        total={total}
        ticketNumber={transactionData.receiptNumber || "PENDING"}
        onPrint={() => {
          // Print functionality for on-hold ticket
          const ticketContent = document.getElementById("ticket-content");
          if (ticketContent) {
            // Use iframe approach like regular receipts (more reliable, less likely to be blocked by popup blockers)
            const iframe = document.createElement("iframe");
            iframe.style.position = "fixed";
            iframe.style.right = "0";
            iframe.style.bottom = "0";
            iframe.style.width = "0";
            iframe.style.height = "0";
            iframe.style.border = "0";
            document.body.appendChild(iframe);

            // Get current date and ticket number
            const currentDate = new Date();
            const ticketNumber =
              transactionData.receiptNumber ||
              `OH-${Date.now().toString().slice(-6)}`;

            const htmlContent = `
              <html>
                <head>
                  <title>On Hold Ticket</title>
                  <style>
                    body {
                      margin: 0;
                      padding: 2mm;
                      font-family: Arial, sans-serif;
                      background: white;
                      color: black;
                      font-size: 12px;
                      line-height: 1.4;
                    }
                    .ticket {
                      width: 80mm;
                      margin: 0 auto;
                      background: white;
                      padding: 2mm;
                    }
                    .header {
                      text-align: center;
                      margin-bottom: 3mm;
                      border-bottom: 2px solid black;
                      padding-bottom: 2mm;
                    }
                    .ticket-title {
                      border: 2px solid black;
                      padding: 2mm;
                      margin-bottom: 2mm;
                    }
                    .ticket-title h2 {
                      font-size: 16px;
                      font-weight: bold;
                      margin: 0 0 2mm 0;
                      text-align: center;
                    }
                    .ticket-number {
                      font-size: 14px;
                      font-weight: bold;
                      margin: 0;
                      text-align: center;
                    }
                    .company-name {
                      font-size: 14px;
                      font-weight: bold;
                      margin: 0 0 1mm 0;
                    }
                    .company-info {
                      font-size: 11px;
                      margin: 0.5mm 0;
                    }
                    .info-section {
                      border: 1px solid black;
                      padding: 2mm;
                      margin-bottom: 2mm;
                    }
                    .info-row {
                      display: flex;
                      justify-content: space-between;
                      margin-bottom: 2mm;
                    }
                    .info-label {
                      font-weight: bold;
                    }
                    .vehicle-section {
                      border-top: 1px solid black;
                      padding-top: 2mm;
                      margin-top: 2mm;
                    }
                    .plate-number {
                      font-size: 14px;
                      font-weight: bold;
                      border: 2px solid black;
                      padding: 1mm;
                      text-align: center;
                      margin-top: 1mm;
                    }
                    .items-section {
                      margin-bottom: 2mm;
                    }
                    .items-container {
                      margin-bottom: 2mm;
                    }
                    .items-label {
                      font-weight: bold;
                      text-align: center;
                      padding: 1mm;
                      margin-bottom: 2mm;
                    }
                    .items-box {
                      border: 1px solid black;
                      padding: 2mm;
                    }
                    .item-row {
                      margin-bottom: 2mm;
                    }
                    .item-header {
                      display: flex;
                      justify-content: space-between;
                      margin-bottom: 1mm;
                    }
                    .item-name {
                      font-weight: bold;
                      flex: 1;
                    }
                    .item-qty {
                      font-size: 11px;
                      margin-left: 2mm;
                    }
                    .item-footer {
                      display: flex;
                      justify-content: space-between;
                      font-size: 11px;
                    }
                    .item-amount {
                      font-weight: bold;
                    }
                    .item-separator {
                      border-top: 1px solid black;
                      margin: 2mm 0;
                    }
                    .total-section {
                      border: 2px solid black;
                      padding: 2mm;
                      margin-bottom: 2mm;
                    }
                    .total-row {
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                    }
                    .total-label {
                      font-size: 14px;
                      font-weight: bold;
                    }
                    .total-amount {
                      font-size: 16px;
                      font-weight: bold;
                    }
                    .footer {
                      text-align: center;
                      padding-top: 2mm;
                      border-top: 1px solid black;
                      font-size: 10px;
                    }
                    .footer p {
                      margin: 0.5mm 0;
                    }
                    .footer-company {
                      font-weight: bold;
                    }
                    @media print {
                      body {
                        padding: 1mm;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                      }
                      .ticket {
                        width: 80mm;
                        margin: 0;
                        padding: 1mm;
                      }
                    }
                    @page {
                      margin: 1mm;
                      size: 80mm auto;
                    }
                  </style>
                </head>
                <body>
                  <div class="ticket">
                    <div class="header">
                      <div class="ticket-title">
                        <h2>ON HOLD TICKET</h2>
                        <p class="ticket-number">#${ticketNumber}</p>
                      </div>
                      <h3 class="company-name">${companyInfo.brand.name}</h3>
                      <p class="company-info">${companyInfo.brand.addressLines.join(
                        ", ",
                      )}</p>
                      <p class="company-info">Tel: ${companyInfo.brand.phones.join(
                        ", ",
                      )}</p>
                    </div>

                    <div class="info-section">
                      <div class="info-row">
                        <span class="info-label">Date:</span>
                        <span>${currentDate.toLocaleDateString("en-GB")}</span>
                      </div>
                      <div class="info-row">
                        <span class="info-label">Time:</span>
                        <span>${currentDate.toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}</span>
                      </div>
                      <div class="vehicle-section">
                        <div class="info-label">Vehicle Plate:</div>
                        <div class="plate-number">${carPlateNumber}</div>
                      </div>
                    </div>

                    <div class="items-section">
                      <div class="items-container">
                        <div class="items-label">ITEMS</div>
                        <div class="items-box">
                          ${cart
                            .map(
                              (item, index) => `
                            <div class="item-row">
                              <div class="item-header">
                                <span class="item-name">${item.name
                                  .replace(/\s\(open bottle\)/gi, "")
                                  .replace(/\s\(closed bottle\)/gi, "")
                                  .replace(/\sopen bottle/gi, "") // Fallback
                                  .replace(/\sclosed bottle/gi, "")}</span>
                                <span class="item-qty">Qty: ${
                                  item.quantity
                                }</span>
                              </div>
                              <div class="item-footer">
                                <span>OMR ${
                                  item.price?.toFixed(3) || "0.000"
                                } each</span>
                                <span class="item-amount">OMR ${(
                                  (item.price || 0) * item.quantity
                                ).toFixed(3)}</span>
                              </div>
                              ${
                                index < cart.length - 1
                                  ? '<hr class="item-separator">'
                                  : ""
                              }
                            </div>
                          `,
                            )
                            .join("")}
                        </div>
                      </div>
                    </div>

                    <div class="total-section">
                      <div class="total-row">
                        <span class="total-label">TOTAL AMOUNT:</span>
                        <span class="total-amount">OMR ${total.toFixed(
                          3,
                        )}</span>
                      </div>
                    </div>


                    <div class="footer">
                      <p>Thank you for choosing</p>
                      <p class="footer-company">${companyInfo.brand.name}</p>
                    </div>
                  </div>
                </body>
              </html>
            `;

            iframe.onload = () => {
              try {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
              } finally {
                setTimeout(() => {
                  document.body.removeChild(iframe);
                }, 500);
              }
            };

            const doc = iframe.contentWindow?.document;
            if (doc) {
              doc.open();
              doc.write(htmlContent);
              doc.close();
            }
          }
        }}
      />

      {/* Cashier Selection Dialog */}
      <CashierDialog
        isOpen={isCashierSelectOpen}
        onOpenChange={setIsCashierSelectOpen}
        enteredCashierId={enteredCashierId}
        setEnteredCashierId={setEnteredCashierId}
        fetchedCashier={fetchedCashier}
        setFetchedCashier={setFetchedCashier}
        cashierIdError={cashierIdError}
        setCashierIdError={setCashierIdError}
        staffMembers={staffMembers}
        setSelectedCashier={setSelectedCashier}
        selectedCashier={selectedCashier}
        setPaymentRecipient={setPaymentRecipient}
        setIsCheckoutModalOpen={setIsCheckoutModalOpen}
        selectedPaymentMethod={selectedPaymentMethod}
        paymentRecipient={paymentRecipient}
        isProcessingCheckout={isProcessingCheckout}
        onFinalizePayment={handleFinalizePayment}
      />

      {/* Success dialog shown after cashier selection */}
      <SuccessDialog
        open={showSuccess}
        onOpenChange={(open) => {
          if (!open) {
            setShowSuccess(false);
            receiptSnapshotRef.current = null;
            resetPOSState();
          }
        }}
        cartContainsOnlyBatteries={cartContainsOnlyBatteries}
        cart={receiptSnapshotRef.current?.cart || cart}
        onViewReceipt={() => {
          setShowSuccess(false);
          setShowReceiptDialog(true);
        }}
        onClose={() => {
          setShowSuccess(false);
          receiptSnapshotRef.current = null;
          resetPOSState();
        }}
      />

      {/* Receipt/Bill Preview Dialog */}
      <ReceiptPreviewDialog
        open={showReceiptDialog}
        onOpenChange={(open) => {
          setShowReceiptDialog(open);
          if (!open) {
            receiptSnapshotRef.current = null;
            resetPOSState();
          }
        }}
        cart={receiptSnapshotRef.current?.cart || cart}
        cartContainsOnlyBatteries={cartContainsOnlyBatteries}
        transactionData={transactionData}
        selectedCashier={
          receiptSnapshotRef.current?.selectedCashier || selectedCashier
        }
        appliedDiscount={
          receiptSnapshotRef.current?.appliedDiscount || appliedDiscount
        }
        appliedTradeInAmount={
          receiptSnapshotRef.current?.appliedTradeInAmount ??
          appliedTradeInAmount
        }
        customerName={
          receiptSnapshotRef.current?.currentCustomer?.name ||
          currentCustomer?.name ||
          ""
        }
        carPlateNumber={
          receiptSnapshotRef.current?.carPlateNumber || carPlateNumber
        }
        selectedPaymentMethod={
          receiptSnapshotRef.current?.selectedPaymentMethod ||
          selectedPaymentMethod
        }
        paymentRecipient={
          receiptSnapshotRef.current?.paymentRecipient || paymentRecipient
        }
        onClose={() => setShowReceiptDialog(false)}
        resetPOSState={resetPOSState}
      />

      {/* Discount Dialog */}
      <DiscountDialog
        open={isDiscountDialogOpen}
        onOpenChange={setIsDiscountDialogOpen}
        discountType={discountType}
        setDiscountType={setDiscountType}
        discountValue={discountValue}
        setDiscountValue={setDiscountValue}
        subtotal={subtotal}
        onApply={applyDiscount}
      />

      {/* Parts Modal */}
      <PartsModal
        isOpen={isPartBrandModalOpen}
        onOpenChange={setIsPartBrandModalOpen}
        selectedPartBrand={selectedPartBrand}
        selectedPartType={selectedPartType}
        parts={
          selectedPartBrand && selectedPartType
            ? products.filter(
                (p) =>
                  p.category === "Parts" &&
                  p.brand === selectedPartBrand &&
                  p.type === selectedPartType,
              )
            : []
        }
        selectedParts={selectedParts}
        onPartClick={handlePartClick}
        onQuantityChange={handlePartQuantityChange}
        onAddToCart={handleAddSelectedPartsToCart}
        onNext={handleNextPartItem}
      />

      {/* Enhanced Trade-In Dialog */}
      <TradeInDialog
        open={isTradeInDialogOpen}
        onOpenChange={setIsTradeInDialogOpen}
        initialAmount={appliedTradeInAmount}
        onApply={(total, batteries) => {
          setAppliedTradeInAmount(total);
          setTradeinBatteries(batteries);
        }}
      />

      {/* Dispute Dialog */}
      <DisputeDialog
        open={isDisputeDialogOpen}
        onOpenChange={setIsDisputeDialogOpen}
        onRefund={() => {
          setIsDisputeDialogOpen(false);
          setIsRefundDialogOpen(true);
        }}
        onWarranty={() => {
          setIsDisputeDialogOpen(false);
          setIsWarrantyDialogOpen(true);
        }}
        onSettlement={() => {
          setIsDisputeDialogOpen(false);
          setIsSettlementModalOpen(true);
        }}
        onMiscellaneous={() => {
          setIsDisputeDialogOpen(false);
          setIsMiscellaneousDialogOpen(true);
        }}
      />

      {/* Warranty Dialog */}
      <WarrantyDialog
        isOpen={isWarrantyDialogOpen}
        onClose={() => setIsWarrantyDialogOpen(false)}
      />

      {/* Labor Dialog */}
      <LaborDialog
        open={isLaborDialogOpen}
        onOpenChange={setIsLaborDialogOpen}
        laborAmount={laborAmount}
        setLaborAmount={setLaborAmount}
        onAddToCart={() => {
          if (laborAmount > 0) {
            addToCart({
              id: 9999,
              name: "Labor - Custom Service",
              price: laborAmount,
            });
            setLaborAmount(0.5);
            setIsLaborDialogOpen(false);
            if (isMobile) setShowCart(true);
          }
        }}
      />

      {/* Settlement Modal */}
      <SettlementDialog
        open={isSettlementModalOpen}
        onOpenChange={setIsSettlementModalOpen}
      />

      {/* Miscellaneous Deduction Modal */}
      <MiscellaneousDialog
        open={isMiscellaneousDialogOpen}
        onOpenChange={setIsMiscellaneousDialogOpen}
      />

      {/* Add Customer Form Dialog */}
      <POSCustomerForm
        isOpen={isCustomerFormOpen}
        onClose={() => setIsCustomerFormOpen(false)}
        onSubmit={handleAddCustomer}
        onSkip={handleSkipCustomerForm}
        setCurrentCustomer={setCurrentCustomer}
      />

      {/* Customer Add Success Animation */}
      <CustomerSuccessDialog open={showCustomerSuccess} />
    </Layout>
  );
}

// Add this component at the end of the file, before the final export default
const ReceiptComponent = ({
  cart,
  paymentMethod,
  cashier,
  discount,
  paymentRecipient,
  // Add props for receipt number, date, and time
  receiptNumber,
  currentDate,
  currentTime,
}: {
  cart: CartItemType[];
  paymentMethod: string;
  cashier?: string;
  discount?: { type: "percentage" | "amount"; value: number } | null;
  paymentRecipient?: string | null;
  receiptNumber: string;
  currentDate: string;
  currentTime: string;
}) => {
  const { brand } = useCompanyInfo();
  // POS terminal identifier (used where VATIN used to be)
  const POS_ID = brand.posId || "POS-01";

  const [localDiscount, setLocalDiscount] = useState(discount);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Client-side state for random values and dates (REMOVED - now passed as props)
  // const [receiptData, setReceiptData] = useState({
  //   receiptNumber: "",
  //   currentDate: "",
  //   currentTime: "",
  // });

  useEffect(() => {
    if (discount) {
      setLocalDiscount(discount);
    }
  }, [discount]);

  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowReceipt(true);
    }, 1000); // Show receipt after 1 second

    // Log discount information if present
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    if (localDiscount) {
    }
    return () => clearTimeout(timer);
  }, [cart, localDiscount]); // Removed receiptData from dependencies

  const handlePrint = useCallback(() => {
    // Calculate subtotal
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    // Calculate discount if applicable
    const discountAmount = localDiscount
      ? localDiscount.type === "percentage"
        ? subtotal * (localDiscount.value / 100)
        : Math.min(localDiscount.value, subtotal)
      : 0;

    const vat = 0;
    const total = subtotal - discountAmount;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${receiptNumber}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: sans-serif !important;
              padding: 0;
              margin: 0;
              width: 80mm;
              font-size: 12px;
            }
            * {
              font-family: sans-serif !important;
            }
            .receipt-container {
              padding: 2mm 1mm 2mm 1mm;
            }
            .receipt-header {
              text-align: center;
              margin-bottom: 10px;
            }
            .receipt-header h2 {
              margin: 0;
              font-size: 16px;
            }
            .receipt-header p {
              margin: 2px 0;
              font-size: 12px;
            }
            .receipt-info {
              border-top: 1px dashed #000;
              border-bottom: 1px dashed #000;
              padding: 5px 0;
              margin-bottom: 10px;
            }
            .receipt-info p {
              margin: 2px 0;
              font-size: 12px;
            }
            .receipt-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
              table-layout: fixed;
            }
            .receipt-table th {
              text-align: left;
              font-size: 12px;
              padding-bottom: 5px;
            }
            .receipt-table td {
              font-size: 12px;
              padding: 2px 0; /* remove horizontal padding for tightest spacing */
              word-wrap: break-word;
              word-break: break-word;
            }
            .receipt-table .sno { width: 20px; }
            .receipt-table .qty { width: 12px; text-align: center; padding-left: 8px; padding-right: 0px; border-spacing: 0; }
            .receipt-table .description { width: auto; max-width: 100%; }
            .receipt-table .description .name { display:inline-block; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .receipt-table .price { width: 44px; text-align: right; padding-right: 3px; }
            .receipt-table .amount { width: 64px; text-align: right; padding-left: 21px; }
            /* Prevent numeric cells from wrapping across lines */
            .receipt-table .price,
            .receipt-table .amount,
            .receipt-table .qty {
              white-space: nowrap;
              word-break: keep-all;
              font-variant-numeric: tabular-nums;
            }
            /* Tighten spacing between the two-line item rows */
            .receipt-table .row-top td { padding-bottom: 0; }
            .receipt-table .row-bottom td { padding-top: 0; }
            .receipt-table .total {
              width: 70px;
              text-align: right;
            }
            .receipt-summary {
              margin-top: 10px;
              border-top: 1px dashed #000;
              padding-top: 5px;
            }
            .receipt-summary table {
              width: 100%;
            }
            .receipt-summary td {
              font-size: 12px;
            }
            .receipt-summary .total-label {
              font-weight: bold;
            }
            .receipt-summary .total-amount {
              text-align: right;
              font-weight: bold;
            }
            .receipt-footer {
              margin-top: 10px;
              text-align: center;
              font-size: 12px;
              border-top: 1px dashed #000;
              padding-top: 5px;
            }
            .receipt-footer p {
              margin: 3px 0;
            }
            .receipt-footer .arabic {
              font-size: 11px;
              direction: rtl;
              margin: 2px 0;
            }
            .barcode {
              margin-top: 10px;
              text-align: center;
            }
            .whatsapp {
              margin-top: 5px;
              text-align: center;
              font-size: 11px;
              font-weight: bold;
            }
            @media print {
              body {
                width: 80mm;
                margin: 0;
                padding: 0;
              }
            }
            @page {
              margin: 0;
              size: 80mm auto;
            }
            .receipt-summary .discount-row {
              color: #22c55e;
              font-weight: bold;
            }
            .receipt-summary .discount-row td {
              color: #22c55e;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-header">
              <h2>${brand.name}</h2>
              <p>${brand.addressLines.join(" ")}</p>
              <p>Ph: ${brand.phones.join(" | ")}</p>
            </div>
            
            <div class="receipt-info">
              <p style="display:flex;justify-content:space-between;align-items:center;">
                <span>Invoice: ${receiptNumber}</span>
                <span>POS ID: ${POS_ID}</span>
              </p>
              <p style="display:flex;justify-content:space-between;align-items:center;">
                <span>Date: ${currentDate}</span>
                <span>Time: ${currentTime}</span>
              </p>
            </div>
            
            <table class="receipt-table">
              <thead>
                <tr>
                  <th class="sno">#</th>
                  <th class="description">Description</th>
                  <th class="price">Price</th>
                  <th class="qty">Qty</th>
                  <th class="amount">Amt</th>
                </tr>
              </thead>
              <tbody>
                ${cart
                  .map(
                    (item, _index) => `
                  <tr class="row-top">
                    <td class="sno">${_index + 1}</td>
                    <td class="description" colspan="4">${(() => {
                      // Clean up name by removing bottle info if present
                      let cleanName = item.name
                        .replace(
                          /\s*\(?(\d+(\.\d+)?[Ll])\s+(open|closed)\s+bottle\)?/i,
                          "",
                        )
                        .replace(/\s*\(?(open|closed)\s+bottle\)?/i, "")
                        .trim();

                      // Clean up details similarly
                      let cleanDetails = item.details
                        ? item.details
                            .replace(
                              /\s*\(?(\d+(\.\d+)?[Ll])\s+(open|closed)\s+bottle\)?/i,
                              "$1",
                            )
                            .replace(/\s*\(?(open|closed)\s+bottle\)?/i, "")
                            .trim()
                        : "";

                      // Combine carefully
                      if (cleanDetails && !cleanName.includes(cleanDetails)) {
                        return `${cleanName} (${cleanDetails})`;
                      }
                      return cleanName;
                    })()}</td>
                    <td class="price" style="display:none;"></td>
                    <td class="qty" style="display:none;"></td>
                    <td class="amount" style="display:none;"></td>
                  </tr>
                  <tr class="row-bottom">
                    <td class="sno"></td>
                    <td class="description"></td>
                    <td class="price">${item.price.toFixed(3)}</td>
                    <td class="qty">(x${item.quantity})</td>
                    <td class="amount">${(item.price * item.quantity).toFixed(
                      3,
                    )}</td>
                  </tr>
                `,
                  )
                  .join("")}
              </tbody>
            </table>
            
            <div class="receipt-summary">
              <table>
                <tr>
                  <td class="total-label">Subtotal</td>
                  <td class="total-amount">OMR ${subtotal.toFixed(3)}</td>
                </tr>
                ${
                  localDiscount
                    ? `
                <tr class="discount-row" style="color: #22c55e; font-weight: bold;">
                  <td style="color: #22c55e; font-weight: bold;">Discount ${
                    localDiscount.type === "percentage"
                      ? `(${localDiscount.value}%)`
                      : "(Amount)"
                  }</td>
                  <td class="total-amount" style="color: #22c55e; font-weight: bold;">- OMR ${discountAmount.toFixed(
                    2,
                  )}</td>
                </tr>`
                    : "<!-- No discount applied -->"
                }
                <tr>
                  <td class="total-label" style="border-top: 1px solid #000; padding-top: 5px;">TOTAL</td>
                  <td class="total-amount" style="border-top: 1px solid #000; padding-top: 5px;">OMR ${total.toFixed(3)}</td>
                </tr>
              </table>
            </div>
            
            <div class="receipt-footer">
              <p>Number of Items: ${cart.reduce(
                (sum, item) => sum + item.quantity,
                0,
              )}</p>
              <p>Payment Method: ${
                paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)
              }</p>
              ${
                paymentMethod === "mobile" && paymentRecipient
                  ? `<p>Mobile Payment Recipient: ${paymentRecipient}</p>`
                  : ""
              }
              ${cashier ? `<p>Cashier: ${cashier}</p>` : ""}
              <p>Keep this Invoice for your Exchanges</p>
              <p class="arabic">احتفظ بهذه الفاتورة للتبديل</p>
              <p>Exchange with in 15 Days</p>
              <p class="arabic">التبديل خلال 15 يوم</p>
              <p>Thank you for shopping with us.</p>
              <p class="arabic">شكراً للتسوق معنا</p>
            </div>
            
            <div class="whatsapp">
              WhatsApp ${brand.whatsapp || ""} for latest offers
            </div>
            
            <!-- Removed duplicate receipt number from footer -->
          </div>
        </body>
      </html>
    `;

    // Use popup window approach for better mobile compatibility
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // On mobile, we need a slight delay before printing
      setTimeout(() => {
        printWindow.print();
        // Close the window after print on desktop, but keep it open on mobile
        // as mobile browsers handle print differently
        if (
          !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent,
          )
        ) {
          printWindow.close();
        }
      }, 500);
    }
  }, [
    cart,
    paymentMethod,
    // receiptData, // Removed
    receiptNumber,
    currentDate,
    currentTime, // Added new props
    cashier,
    localDiscount,
    paymentRecipient,
  ]);

  if (!showReceipt) return null; // Removed: || !receiptData.receiptNumber

  // Calculate totals
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // Calculate discount amount if applicable
  const discountAmount = localDiscount
    ? localDiscount.type === "percentage"
      ? subtotal * (localDiscount.value / 100)
      : Math.min(localDiscount.value, subtotal)
    : 0;

  const vat = 0; // No VAT in this example
  const total = subtotal - discountAmount;
  const BillComponent = ({ cart }: { cart: CartItemType[] }) => {
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Format payment method name for display
    const getFormattedPaymentMethod = (method: string) => {
      switch (method) {
        case "card":
          return "Card";
        case "cash":
          return "Cash";
        case "mobile":
          return "Mobile Pay";
        case "on-hold":
          return "on-hold";
        case "credit":
          return "Credit";
        default:
          return method.charAt(0).toUpperCase() + method.slice(1);
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <div className="max-h-[55vh] md:max-h-[65vh] overflow-auto mb-4">
          <div
            className="bg-white border rounded-xl p-3 sm:p-4 w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] mx-auto shadow-md"
            ref={receiptRef}
          >
            {/* Receipt Preview */}
            <div className="text-center mb-2">
              <h3 className="font-bold text-base sm:text-lg tracking-tight">
                {brand.name}
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-500 leading-tight">
                {brand.addressLines.join(" ")}
              </p>
              <p className="text-[11px] sm:text-xs text-gray-500 leading-tight">
                Ph: {brand.phones.join(" | ")}
              </p>
            </div>

            <div className="border-t border-b border-dashed py-1.5 mb-2 sm:mb-3">
              <div className="flex justify-between text-[11px] sm:text-xs">
                <span className="font-medium">Invoice: {receiptNumber}</span>
                <span className="font-medium">POS ID: {POS_ID}</span>
              </div>
              <div className="flex justify-between text-[11px] sm:text-xs">
                <span>Date: {currentDate}</span>
                <span>Time: {currentTime}</span>
              </div>
            </div>

            <div className="text-[11px] sm:text-xs mb-3">
              <div className="grid grid-cols-12 gap-1 font-medium mb-1">
                <span className="col-span-1">#</span>
                <span className="col-span-2">Qty</span>
                <span className="col-span-7">Description</span>
                <span className="col-span-1 text-right">Price</span>
                <span className="col-span-1 text-right">Amount</span>
              </div>

              {cart.map((item, index) => (
                <div
                  key={item.uniqueId}
                  className="grid grid-cols-12 gap-1 mb-1"
                >
                  <span className="col-span-1">{index + 1}</span>
                  <span className="col-span-2">(x{item.quantity})</span>
                  <span className="col-span-7 break-words">
                    {(() => {
                      // Clean up name by removing bottle info if present
                      let cleanName = item.name
                        .replace(
                          /\s*\(?(\d+(\.\d+)?[Ll])\s+(open|closed)\s+bottle\)?/i,
                          "",
                        )
                        .replace(/\s*\(?(open|closed)\s+bottle\)?/i, "")
                        .trim();

                      // Clean up details similarly
                      let cleanDetails = item.details
                        ? item.details
                            .replace(
                              /\s*\(?(\d+(\.\d+)?[Ll])\s+(open|closed)\s+bottle\)?/i,
                              "$1",
                            )
                            .replace(/\s*\(?(open|closed)\s+bottle\)?/i, "")
                            .trim()
                        : "";

                      // Combine carefully
                      if (cleanDetails && !cleanName.includes(cleanDetails)) {
                        return `${cleanName} (${cleanDetails})`;
                      }
                      return cleanName;
                    })()}
                  </span>
                  <span className="font-medium text-foreground">
                    OMR {item.price.toFixed(3)}
                  </span>
                  <span className="col-span-1 text-right">
                    {(item.price * item.quantity).toFixed(3)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-dashed pt-2 mb-3">
              <div className="flex justify-between text-[11px] sm:text-xs">
                <span>Subtotal</span>
                <span>OMR {subtotal.toFixed(3)}</span>
              </div>
              {localDiscount && (
                <div className="flex justify-between items-center border-t pt-2 text-[11px] sm:text-xs">
                  <span>
                    Discount{" "}
                    {localDiscount.type === "percentage"
                      ? `(${localDiscount.value}%)`
                      : "(Amount)"}
                  </span>
                  <span>- OMR {discountAmount.toFixed(3)}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px] sm:text-xs font-bold border-t pt-1">
                <span>Total</span>
                <span>OMR {total.toFixed(3)}</span>
              </div>
            </div>

            <div className="text-center text-[11px] sm:text-xs text-gray-600 border-t border-dashed pt-2">
              <p>Number of Items: {itemCount}</p>
              <p>Payment Method: {getFormattedPaymentMethod(paymentMethod)}</p>
              {paymentMethod === "mobile" && paymentRecipient && (
                <p>Mobile Payment Recipient: {paymentRecipient}</p>
              )}
              {cashier && <p>Cashier: {cashier}</p>}
              <p>Keep this Invoice for your Exchanges</p>
              <p className="text-[11px] sm:text-xs text-right text-gray-600">
                احتفظ بهذه الفاتورة للتبديل
              </p>
              <p>Exchange with in 15 Days</p>
              <p className="text-[11px] sm:text-xs text-right text-gray-600">
                التبديل خلال 15 يوم
              </p>
              <p>Thank you for shopping with us.</p>
              <p className="text-[11px] sm:text-xs text-right text-gray-600">
                شكراً للتسوق معنا
              </p>
              <p className="font-medium mt-2">
                WhatsApp {brand.whatsapp || ""} for latest offers
              </p>
              {/* Removed bottom receipt number to avoid duplication */}
            </div>
          </div>
        </div>

        <Button
          onClick={handlePrint}
          className="w-full flex items-center justify-center gap-2 mt-2"
        >
          <Printer className="h-4 w-4" />
          Print Receipt
        </Button>
      </motion.div>
    );
  };

  return <BillComponent cart={cart} />;
};
