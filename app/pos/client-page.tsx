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
import { useNotification } from "@/lib/contexts/NotificationContext";
import { createLubricantVolumeAlert } from "@/lib/utils/alert-helpers";
// Removed unused hooks
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

// Import the RefundDialog component
import { RefundDialog, WarrantyDialog } from "./components/refund-dialog";
import { ImportDialog } from "./components/import-dialog";
import { customerService } from "@/lib/services/customerService";
import {
  useIntegratedPOSData,
  LubricantProduct,
  Product,
} from "@/lib/hooks/data/useIntegratedPOSData";
import { FilterModal } from "./components/modals/filter-modal";
import { PartsModal } from "./components/modals/parts-modal";
import { TradeInDialog } from "./components/modals/trade-in-dialog";
// VolumeModal import removed as logic is inline
import { BrandCard } from "./components/brand-card";
import { BrandLogo } from "./components/brand-logo";
import { OnHoldTicket } from "./components/on-hold-ticket";

// Import the BillComponent
import { BillComponent } from "./components/bill-component";
import { SettlementDialog } from "./components/dispute/SettlementDialog";
import { MiscellaneousDialog } from "./components/dispute/MiscellaneousDialog";
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
import {
  findHighestVolumeFromVolumes,
  parseVolumeString,
  isHighestVolume,
} from "@/lib/utils/volume-parser";

// Extracted types
import { CartItem as CartItemType, SelectedVolume, ImportedCustomer, TradeinBattery } from "./types";
// Extracted components
import { CartItem } from "./components/cart/CartItem";
import { ProductButton } from "./components/cart/ProductButton";
import { Numpad } from "./components/Numpad";
import { POSCustomerForm } from "./components/POSCustomerForm";

// Components are now imported from ./components/*
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
  const { addPersistentNotification } = useNotification();
  const { currentBranch, inventoryLocationId } = useBranch();
  const companyInfo = useCompanyInfo();
  
  // Ref to track last notification creation to prevent duplicates
  const lastNotificationRef = useRef<{ key: string; timestamp: number } | null>(null);

  const {
    cart,
    addToCart: contextAddToCart,
    removeFromCart: contextRemoveFromCart,
    updateQuantity: contextUpdateQuantity,
    clearCart: contextClearCart,
  } = useCart();
  const [activeCategory, setActiveCategory] = useState<string>("Lubricants");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showClearCartDialog, setShowClearCartDialog] = useState(false);
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const [selectedOil, setSelectedOil] = useState<LubricantProduct | null>(null);
  const [currentBottleVolumeSize, setCurrentBottleVolumeSize] =
    useState<string | null>(null);
  const [showBottleTypeDialog, setShowBottleTypeDialog] = useState(false);
  const [filterImageError, setFilterImageError] = useState(false);
  const [lubricantImageError, setLubricantImageError] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "card" | "cash" | "mobile" | "on-hold" | "credit" | null
  >(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showOtherOptions, setShowOtherOptions] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // On Hold functionality state
  const [isOnHoldMode, setIsOnHoldMode] = useState(false);
  const [carPlateNumber, setCarPlateNumber] = useState("");
  const [showOnHoldTicket, setShowOnHoldTicket] = useState(false);

  // Discount state (kept inline as these are directly used in the UI)
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [discountType, setDiscountType] = useState<"percentage" | "amount">("amount");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    type: "percentage" | "amount";
    value: number;
  } | null>(null);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  // Trade-In Dialog State
  const [isTradeInDialogOpen, setIsTradeInDialogOpen] = useState(false);
  const [appliedTradeInAmount, setAppliedTradeInAmount] = useState<number>(0);

  // State for receipt/bill number, date, time - to be generated before showing success dialog
  const [transactionData, setTransactionData] = useState({
    receiptNumber: "",
    currentDate: "",
    currentTime: "",
  });




  // Volume modal states
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

  // Filter modal states
  const [isFilterBrandModalOpen, setIsFilterBrandModalOpen] = useState(false);
  const [selectedFilterType, setSelectedFilterType] = useState<string | null>(
    null
  );
  const [selectedFilterBrand, setSelectedFilterBrand] = useState<string | null>(
    null
  );
  const [selectedFilters, setSelectedFilters] = useState<
    Array<{
      id: number;
      name: string;
      price: number;
      quantity: number;
    }>
  >([]);

  // Parts modal states
  const [isPartBrandModalOpen, setIsPartBrandModalOpen] = useState(false);
  const [selectedPartType, setSelectedPartType] = useState<string | null>(null);
  const [selectedPartBrand, setSelectedPartBrand] = useState<string | null>(
    null
  );
  const [selectedParts, setSelectedParts] = useState<
    Array<{
      id: number;
      name: string;
      price: number;
      quantity: number;
    }>
  >([]);

  // New state for cashiers with proper type
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

  // Parts state handled locally

  // Add state for payment recipient
  const [paymentRecipient, setPaymentRecipient] = useState<string | null>(null);

  // Add loading state for checkout processing
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // Trade-in battery states
  const [tradeinBatteries, setTradeinBatteries] = useState<TradeinBattery[]>([]);
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

  // Get cashier data from the hook
  const { staffMembers } = useStaffIDs();

  // Trade-in helper functions
  const calculateTotalTradeInAmount = () => {
    return tradeinBatteries.reduce(
      (total, battery) => total + battery.amount,
      0
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
          : battery
      )
    );

    setCurrentBatteryEntry({ size: "", status: "", amount: 0 });
    setEditingBatteryId(null);
    setTradeinFormErrors({ size: false, status: false, amount: false });
  };

  const removeBatteryFromTradein = (batteryId: string) => {
    setTradeinBatteries((prev) =>
      prev.filter((battery) => battery.id !== batteryId)
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

  const resetTradeInDialog = () => {
    setTradeinBatteries([]);
    setCurrentBatteryEntry({ size: "", status: "", amount: 0 });
    setEditingBatteryId(null);
    setTradeinFormErrors({ size: false, status: false, amount: false });
  };



  // Memoize handlers
  const removeFromCart = useCallback((productId: number, uniqueId?: string) => {
    if (uniqueId) {
      contextRemoveFromCart(uniqueId);
    } else {
      // Fallback for backward compatibility
      const item = cart.find((i) => i.id === productId);
      if (item) {
        contextRemoveFromCart(item.uniqueId);
      }
    }
  }, [contextRemoveFromCart, cart]);

  const updateQuantity = useCallback(
    (productId: number, newQuantity: number, uniqueId?: string) => {
      if (uniqueId) {
        contextUpdateQuantity(uniqueId, newQuantity);
      } else {
        const item = cart.find((i) => i.id === productId);
        if (item) {
          contextUpdateQuantity(item.uniqueId, newQuantity);
        }
      }
    },
    [contextUpdateQuantity, cart]
  );

  const addToCart = useCallback(
    (
      product: { id: number; name: string; price: number },
      details?: string,
      quantity: number = 1,
      source?: string,
      bottleType?: "open" | "closed"
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
    [products, lubricantProducts, contextAddToCart]
  );

  // Update selectedOil when lubricantProducts refresh (e.g., after checkout)
  useEffect(() => {
    if (!selectedOil || lubricantProducts.length === 0) {
      return;
    }
    
    // Find the updated product with fresh inventory data
    const updatedProduct = lubricantProducts.find(
      (p) => p.id === selectedOil.id || p.originalId === selectedOil.originalId
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

  // Helper to calculate total closed bottles of a specific product already in cart
  const calculateCartClosedCount = (productId: string | number): number => {
    return cart.reduce((total, item) => {
      // Check if item matches current lubricant product (by numeric ID or original UUID)
      const matches = item.id === productId || item.originalId === productId;
      
      // Cart items for lubricants have source "CLOSED" or "OPEN"
      if (matches && (item.source === "CLOSED" || (!item.source && !item.bottleType) || item.bottleType === "closed")) {
         // item.quantity for closed bottles is the number of bottles
         return total + (item.quantity || 0);
      }
      return total;
    }, 0);
  };

  // Helper to calculate total open volume of a specific product already in cart
  const calculateCartOpenVolume = (productId: string | number): number => {
    return cart.reduce((total, item) => {
      // Check if item matches current lubricant product
      const matches = item.id === productId || item.originalId === productId;
      
      if (matches && (item.source === "OPEN" || item.bottleType === "open")) {
         // item.quantity for open source is volume in liters
         return total + (item.quantity || 0);
      }
      return total;
    }, 0);
  };

  // Generic helper to calculate total quantity of any product in cart
  const calculateCartCount = (productId: string | number): number => {
    return cart.reduce((total, item) => {
      const matches = item.id === productId || item.originalId === productId;
      // Exclude lubricant volume entries which are handled separately
      if (matches && !item.bottleType && item.source !== "OPEN" && item.source !== "CLOSED") {
        return total + (item.quantity || 0);
      }
      return total;
    }, 0);
  };

  const handleLubricantSelect = useCallback((lubricant: LubricantProduct) => {
    setSelectedOil(lubricant);
    setSelectedVolumes([]);
    setIsVolumeModalOpen(true);
  }, []);

  // Function to handle volume selection with bottle type prompt for smaller volumes
  const handleVolumeClick = (volume: { size: string; price: number }) => {
    if (!selectedOil) return;

    // Logic for determining if bottle type selection is needed
    // Assuming larger volumes don't need selection (or based on business rule)
    // Here we check if the selected oil has open bottles capability and if the volume warrants a choice
    // For simplicity, let's assume we logic based on size string or data
    // The previous logic used specific checks.
    
    // Check if we need to show bottle type dialog
    // We show it if the oil supports open bottles AND specific conditions (e.g. not a 4L/5L jug which is always closed)
    // Using a simple heuristic: if `hasOpenBottles` is true, we ask.
    // UNLESS it's a large volume which we know is only closed.
    // Let's assume volumes < 4 are "small" and might be open.
    const sizeNum = parseVolumeString(volume.size);
    const isSmallVolume = sizeNum < 4; 
    
    // Fix: Always show bottle type dialog for small volumes, even if no open bottles exist yet.
    // This allows creating NEW open bottles from closed stock.
    if (isSmallVolume) {
      setCurrentBottleVolumeSize(volume.size);
      setIsVolumeModalOpen(false); // Close parent
      setShowBottleTypeDialog(true); // Open child
    } else {
      // Directly add as closed
      addVolumeWithBottleType(volume.size, "closed");
    }
  };

  // Helper function to calculate total open volume selected
  const calculateTotalOpenVolumeSelected = (
    volumes: SelectedVolume[]
  ): number => {
    return volumes
      .filter((v) => v.bottleType === "open")
      .reduce((total, v) => {
        const volumeAmount = parseVolumeString(v.size);
        return total + volumeAmount * v.quantity;
      }, 0);
  };



  // Function to add volume with selected bottle type
  const addVolumeWithBottleType = (
    size: string,
    bottleType: "open" | "closed"
  ) => {
    if (!selectedOil) return;

    // Validate Open Bottle Stock
    if (bottleType === "open" && selectedOil.totalOpenVolume !== undefined) {
      // Calculate total open volume currently in cart/selected for this oil
      const cartOpenVolume = calculateCartOpenVolume(selectedOil.id);
      
      const currentModalOpenVolume = calculateTotalOpenVolumeSelected(selectedVolumes);
      
      const volumeAmount = parseVolumeString(size);
      
      // Calculate new total
      const newTotal = cartOpenVolume + currentModalOpenVolume + volumeAmount;

      if (newTotal > selectedOil.totalOpenVolume) {
         toast({
          title: "Insufficient Open Bottle Stock",
          description: `Only ${selectedOil.totalOpenVolume.toFixed(2)}L available.`,
          variant: "destructive",
        });
        return;
      }
    }

    const volumeDetails = selectedOil.volumes.find((v) => v.size === size);
    if (!volumeDetails) return;
    
    // Check stock for closed bottles if needed
    if (bottleType === "closed") {
         const availableClosed = selectedOil?.volumes?.[0]?.bottleStates?.closed || 0;
         const cartClosedCount = calculateCartClosedCount(selectedOil.id);
         const modalClosedCount = selectedVolumes
              .filter(v => !v.bottleType || v.bottleType === "closed")
              .reduce((sum, v) => sum + v.quantity, 0);

         if ((cartClosedCount + modalClosedCount + 1) > availableClosed) {
             toast({
                title: "Insufficient Closed Bottle Stock",
                description: `Only ${availableClosed} closed bottles available.`,
                variant: "destructive",
             });
             return;
         }
    }

    // Add to selectedVolumes
    setSelectedVolumes((prev) => {
        const existing = prev.find(
          (v) => v.size === size && v.bottleType === bottleType
        );

        if (existing) {
          return prev.map((v) =>
            v.size === size && v.bottleType === bottleType
              ? { ...v, quantity: v.quantity + 1 }
              : v
          );
        }
        return [...prev, { ...volumeDetails, quantity: 1, bottleType }];
    });
    
    // Reset and Swap Back
    setShowBottleTypeDialog(false);
    setCurrentBottleVolumeSize(null);
    setIsVolumeModalOpen(true); // Re-open parent
  };

  const handleQuantityChange = (
    size: string,
    change: number,
    bottleType?: "open" | "closed"
  ) => {
    setSelectedVolumes((prev) => {
      // Find the volume being changed - match by both size and bottleType if provided
      const volumeToChange = prev.find(
        (v) => v.size === size && (!bottleType || v.bottleType === bottleType)
      );
      
      // If incrementing an open bottle volume, validate against available volume
      if (
        change > 0 &&
        volumeToChange?.bottleType === "open" &&
        selectedOil?.totalOpenVolume !== undefined
      ) {
        // Calculate current total excluding the volume we're about to change
        const currentTotalOpenVolume = prev
          .filter((v) => !(v.size === size && (!bottleType || v.bottleType === bottleType)))
          .filter((v) => v.bottleType === "open")
          .reduce((total, v) => {
            const volumeAmount = parseVolumeString(v.size);
            return total + volumeAmount * v.quantity;
          }, 0);
        
        // Calculate volume already in cart for this product
        const cartOpenVolume = calculateCartOpenVolume(selectedOil.id);
        
        // Add the volume that will exist after increment
        const volumeAmount = parseVolumeString(size);
        const newQuantity = volumeToChange.quantity + change;
        const newModalTotal = currentTotalOpenVolume + (volumeAmount * newQuantity);
        const newTotal = newModalTotal + cartOpenVolume;

        if (newTotal > selectedOil.totalOpenVolume) {
          const availableVolume = selectedOil.totalOpenVolume;
          const formattedAvailable = availableVolume.toFixed(1).replace(/\.0$/, "");
          const formattedAttempted = newTotal.toFixed(1).replace(/\.0$/, "");
          
          // Show toast for immediate feedback
          toast({
            title: "Insufficient Open Bottle Volume",
            description: `Only ${formattedAvailable}L available in open bottles. Cannot select ${formattedAttempted}L.`,
            variant: "destructive",
          });
          
          // Create persistent notification (with duplicate prevention)
          if (selectedOil?.id && selectedOil?.name) {
            const notificationKey = `${selectedOil.id}-${size}-${volumeToChange?.bottleType || "open"}-${formattedAttempted}`;
            const now = Date.now();
            const lastNotification = lastNotificationRef.current;
            
            // Prevent duplicate notifications within 2 seconds
            if (lastNotification && lastNotification.key === notificationKey && (now - lastNotification.timestamp) < 2000) {
              return prev;
            }
            
            lastNotificationRef.current = { key: notificationKey, timestamp: now };
            
            const alertParams = createLubricantVolumeAlert({
              productId: selectedOil.id,
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
          
          return prev; // Don't update if validation fails
        }
      }

      // Proceed with quantity change - match by both size and bottleType if provided
      const updated = prev
        .map((v) =>
          v.size === size &&
          (!bottleType || v.bottleType === bottleType)
            ? { ...v, quantity: Math.max(0, v.quantity + change) }
            : v
        )
        .filter((v) => v.quantity > 0);
      return updated;
    });
  };

  const addCurrentSelectionToCart = () => {
    selectedVolumes.forEach((volume) => {
      if (selectedOil) {
        // Construct details string
        const detailsText = volume.size + (volume.bottleType ? ` ${volume.bottleType} bottle` : "");
        const details = detailsText;

        // Create full display name: "Brand Product (Size Type)"
        // e.g., "Shell Helix 5W-30 (1L closed bottle)"
        const fullDisplayName = `${selectedOil.name} (${detailsText})`;

        // Determine source based on bottle type for checkout API
        // Highest volumes don't have bottleType (they're always closed)
        const source = volume.bottleType === "open" ? "OPEN" : "CLOSED";

        addToCart(
          {
            id: selectedOil.id,
            name: fullDisplayName, // Use the full name including details
            price: volume.price,
          },
          details,
          volume.quantity, // Pass the item quantity, not total volume
          source,
          volume.bottleType || "closed" // Pass bottleType (or "closed" for highest volumes)
        );
      }
    });
  };

  const handleAddSelectedToCart = () => {
    addCurrentSelectionToCart();
    setIsVolumeModalOpen(false);
    setSelectedOil(null);
    setSelectedVolumes([]);
    if (isMobile) setShowCart(true);
  };

  const handleNextItem = () => {
    // Add current selection to cart
    addCurrentSelectionToCart();

    // Navigate to Filters section and close modal
    setActiveCategory("Filters");
    setIsVolumeModalOpen(false);
    setSelectedOil(null);
    setSelectedVolumes([]);
    setSearchQuery(""); // Clear search when changing categories
  };

  // Brand and type arrays are now provided by the hook

  const getFiltersByType = (type: string) =>
    products.filter(
      (product) => product.category === "Filters" && product.type === type
    );

  // Memoize filtered data
  const filteredLubricantBrands = useMemo(
    () =>
      lubricantBrands.filter((brand) =>
        brand.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery, lubricantBrands]
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
    [activeCategory, searchQuery, expandedBrand, products]
  );

  // Calculate total with discount and trade-in
  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
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

  const handleSafeAddToCart = (
    item: { id: number; name: string; price: number },
    details?: string,
    quantity = 1,
    source?: string,
    bottleType?: string
  ) => {
    // Check if adding this quantity exceeds availability
    // Find the product to check availability
    // Note: This logic assumes 'products' contains up-to-date availability
    const product = products.find((p) => p.id === item.id);
    // If not in generic products, it might be lubricant (handled separately/safe usually) or not found
    
    if (product) {
        const currentInCart = calculateCartCount(item.id);
        const available = product.availableQuantity;
        
        if (currentInCart + quantity > available) {
             toast({
              title: "Stock Limit Reached",
              description: `Only ${available} available. You already have ${currentInCart} in cart.`,
              variant: "destructive",
            });
            return;
        }
    }
    
    addToCart(item, details, quantity, source, bottleType);
  };

  const handleFilterClick = (filter: Product) => {
    // Check stock before adding to selection
    if (filter.availableQuantity <= 0) {
        toast({
            title: "Out of Stock",
            description: "This item is currently out of stock.",
            variant: "destructive"
        });
        return;
    }

    setSelectedFilters((prev) => {
      const existing = prev.find((f) => f.id === filter.id);
      const currentSelected = existing ? existing.quantity : 0;
      const inCart = calculateCartCount(filter.id);
      
      // Check validation
      if (currentSelected + inCart + 1 > filter.availableQuantity) {
        toast({
            title: "Stock Limit Reached",
            description: `Only ${filter.availableQuantity} available.`,
            variant: "destructive"
        });
        return prev;
      }

      if (existing) {
        return prev.map((f) =>
          f.id === filter.id ? { ...f, quantity: f.quantity + 1 } : f
        );
      }
      return [...prev, { ...filter, quantity: 1 }];
    });
  };

  const handleFilterQuantityChange = (filterId: number, change: number) => {
    setSelectedFilters((prev) => {
      // Find the filter to access availability
      // We need to look up availability from the source 'products' based on ID
      const product = products.find(p => p.id === filterId);
      const limit = product ? product.availableQuantity : 9999;
      const inCart = calculateCartCount(filterId);

      const existing = prev.find(f => f.id === filterId);
      const currentQty = existing?.quantity || 0;

      if (change > 0 && (currentQty + inCart + change > limit)) {
         toast({
            title: "Stock Limit Reached",
            description: `Cannot add more. Limit is ${limit}.`,
            variant: "destructive"
        });
        return prev;
      }
      
      const updated = prev
        .map((f) =>
          f.id === filterId
            ? { ...f, quantity: Math.max(0, f.quantity + change) }
            : f
        )
        .filter((f) => f.quantity > 0);
      return updated;
    });
  };

  const addFiltersToCart = (): boolean => {
    // Final check before bulk add
    let blocked = false;
    selectedFilters.forEach((filter) => {
        const product = products.find(p => p.id === filter.id);
        const limit = product ? product.availableQuantity : 9999;
        const inCart = calculateCartCount(filter.id);
        
        if (inCart + filter.quantity > limit) {
            blocked = true;
        }
    });

    if (blocked) {
         toast({
            title: "Stock Validation Failed",
            description: "Some items exceed available stock. Please adjust quantities.",
            variant: "destructive"
        });
        return false;
    }

    selectedFilters.forEach((filter) => {
      addToCart(
        {
          id: filter.id,
          name: filter.name,
          price: filter.price,
        },
        undefined,
        filter.quantity
      );
    });
    return true;
  };

  const handleAddSelectedFiltersToCart = () => {
    const success = addFiltersToCart();
    if (success) {
      setIsFilterBrandModalOpen(false);
      setSelectedFilters([]);
      if (isMobile) setShowCart(true);
    }
  };

  const handleNextFilterItem = () => {
    const success = addFiltersToCart();
    if (success) {
      setActiveCategory("Parts");
      setIsFilterBrandModalOpen(false);
      setSelectedFilters([]);
      setSearchQuery("");
      // Do NOT show cart to allow flow to continue
    }
  };

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

  // Helper function to get availability by numeric ID using the hook's built-in function
  const getAvailabilityByNumericId = (productId: number) => {
    // Find the product in either products or lubricantProducts arrays
    const allProducts = [...products, ...lubricantProducts];
    const product = allProducts.find((p) => p.id === productId);

    if (!product) {
      return {
        canSell: false,
        availableQuantity: 0,
        errorMessage: "Product not found in inventory",
      };
    }

    // Use the hook's built-in getProductAvailability function with numeric ID
    const availability = getProductAvailability(productId);

    // Handle null availability response
    if (!availability) {
      return {
        canSell: false,
        availableQuantity: 0,
        errorMessage: "Product availability could not be determined",
      };
    }

    // Transform to match the expected interface
    return {
      canSell: availability.canSell,
      availableQuantity: availability.availableQuantity,
      errorMessage: availability.errorMessage,
    };
  };

  const handleCheckout = async () => {
    if (isCheckoutLoading) {
      return;
    }

    setIsCheckoutLoading(true);

    try {

      // Validate cart is not empty
      if (cart.length === 0) {
        toast({
          title: "Empty Cart",
          description: "Please add items to your cart before checking out.",
          variant: "destructive",
          duration: 3000,
        });
        return;
      }

      // Validate stock availability for all cart items (excluding labor charges)
      const stockValidationErrors: string[] = [];

      for (const cartItem of cart) {
        // Skip inventory validation for labor charges
        if (
          cartItem.id === 9999 ||
          cartItem.name === "Labor - Custom Service"
        ) {
          continue;
        }

        try {
          const availability = getAvailabilityByNumericId(cartItem.id);

          if (availability) {
            if (!availability.canSell) {
              stockValidationErrors.push(
                `${cartItem.name}: ${
                  availability.errorMessage || "Not available"
                }`
              );
            } else if (cartItem.quantity > availability.availableQuantity) {
              stockValidationErrors.push(
                `${cartItem.name}: Only ${availability.availableQuantity} available, but ${cartItem.quantity} requested`
              );
            }
          } else {
            console.warn(
              `⚠️ No availability data for product: ${cartItem.name}`
            );
            stockValidationErrors.push(
              `${cartItem.name}: Product not found in inventory`
            );
          }
        } catch (availabilityError) {
          console.error(
            `❌ Error checking availability for ${cartItem.name}:`,
            availabilityError
          );
          stockValidationErrors.push(
            `${cartItem.name}: Error checking availability`
          );
        }
      }

      // If there are stock validation errors, show them and don't proceed
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

      // If all validations pass, proceed with checkout
      setIsCustomerFormOpen(true);

      // Generate transaction data for later use

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
    } catch (error) {
      console.error("💥 Critical error in handleCheckout:", error);
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
  };

  const handlePaymentComplete = () => {
    // For on-hold mode or battery sales, validate car plate number first, then proceed to cashier selection
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

    // For both regular payments and on-hold transactions, show cashier selection dialog
    setIsCheckoutModalOpen(false);
    // Reset cashier fields before opening the cashier selection dialog
    setEnteredCashierId("");
    setFetchedCashier(null);
    setCashierIdError(null);
    setIsCashierSelectOpen(true);
  };

  // Add this new function to handle final payment completion
  const handleFinalizePayment = async () => {
    if (isProcessingCheckout) return;

    // Handle On Hold workflow differently
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

      // Start loading
      setIsProcessingCheckout(true);

      // Process the on-hold transaction through the API
      try {
        // Prepare cart items for the API call
        const cartForAPI = cart.map((item) => {
          // Handle labor charges specially
          if (item.id === 9999 || item.name === "Labor - Custom Service") {
            return {
              productId: "9999", // Use string ID for labor charges
              quantity: item.quantity,
              sellingPrice: item.price,
              volumeDescription: item.name,
            };
          }

          // Handle regular inventory items
          const productInfo = products.find((p) => p.id === item.id);
          const lubricantProductInfo = lubricantProducts.find(
            (p) => p.id === item.id
          );
          const isLubricant =
            productInfo?.category === "Lubricants" ||
            lubricantProductInfo !== undefined;

          // Use the originalId (UUID) instead of the numeric id
          const originalId =
            productInfo?.originalId || lubricantProductInfo?.originalId;
          if (!originalId) {
            throw new Error(`Original ID not found for product ${item.id}`);
          }

          return {
            productId: originalId, // Use the original UUID as expected by API
            quantity: item.quantity,
            sellingPrice: item.price,
            volumeDescription: item.details || item.name,
            // If it's a lubricant, ensure 'source' is set. Default to 'CLOSED' if bottleType is not specified.
            source: (isLubricant
              ? item.bottleType === "open"
                ? "OPEN"
                : "CLOSED"
              : undefined) as "OPEN" | "CLOSED" | undefined,
          };
        });

        // Prepare trade-ins if any - Enable for battery checkouts
        let tradeInsForAPI = undefined;

        // Check if this is a battery sale and has trade-ins
        const isBatterySale = cartContainsAnyBatteries(cart);
        if (isBatterySale && tradeinBatteries.length > 0) {
          // For battery sales, create trade-in entries using battery size as name
          tradeInsForAPI = tradeinBatteries.map((battery) => ({
            productId: `tradein-${battery.size
              .toLowerCase()
              .replace(/\s+/g, "-")}-${battery.status}`, // Generate consistent ID
            quantity: 1,
            tradeInValue: battery.amount,
            size: battery.size,
            condition: battery.status,
            name: battery.size, // Use battery size as the name
            costPrice: battery.amount, // Use trade-in amount as cost price
          }));
        }

        // Use the enhanced checkout service with retry and offline support
        const { checkoutService } = await import(
          "@/lib/services/checkout-service"
        );

        const result = await checkoutService.processCheckout({
          locationId: inventoryLocationId || currentBranch?.id || "default-location",
          shopId: currentBranch?.id || "default-shop",
          paymentMethod: "ON_HOLD", // Use ON_HOLD as the payment method
          cashierId: selectedCashier?.id || "on-hold-system", // Use the selected cashier ID
          cart: cartForAPI,
          carPlateNumber: carPlateNumber.trim() || undefined, // Normalize empty string to undefined
          customerId: currentCustomer?.id || undefined, // Normalize null/empty to undefined
          ...(tradeInsForAPI ? { tradeIns: tradeInsForAPI } : {}),
          ...(appliedDiscount ? { discount: appliedDiscount } : {}),
        });

        if (!result.success) {
          throw new Error(
            result.error || "On-hold transaction processing failed"
          );
        }

        // Store the transaction result for receipt display

        if (result.data?.offline) {
          toast({
            title: "On-Hold Transaction Completed Offline",
            description:
              "Transaction saved. Will sync when connection is restored.",
            variant: "default",
            duration: 5000,
          });
        } else {
          toast({
            title: "On-Hold Transaction Saved",
            description: "Transaction has been recorded successfully.",
            variant: "default",
            duration: 3000,
          });
        }

        // Update transaction data with real reference number from server
        const serverReferenceNumber = result.data?.transaction?.referenceNumber || result.data?.referenceNumber;
        if (serverReferenceNumber) {
          setTransactionData((prev) => ({
            ...prev,
            receiptNumber: serverReferenceNumber,
          }));
        }

        // Generate and show ticket for On Hold after successful API call
        setShowOnHoldTicket(true);
        setIsProcessingCheckout(false);
        return;
        return;
      } catch (error) {
        console.error("On-hold checkout error:", error);
        toast({
          title: "Transaction Failed",
          description: "Failed to save on-hold transaction. Please try again.",
          variant: "destructive",
          duration: 5000,
        });
      } finally {
        setIsProcessingCheckout(false);
      }
      return;
    }

    if (!selectedPaymentMethod || !selectedCashier) {
      toast({
        title: "Missing Information",
        description: "Payment method and cashier are required.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Ensure transaction data is initialized (but wait for real ID)
    if (!transactionData.receiptNumber) {
      const newCurrentDate = new Date().toLocaleDateString("en-GB");
      const newCurrentTime = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setTransactionData({
        receiptNumber: "", // Wait for server reference
        currentDate: newCurrentDate,
        currentTime: newCurrentTime,
      });
    }

    // Set loading state for checkout processing
    setIsProcessingCheckout(true);

    try {
      // Prepare cart items for the API call
      // Include all items, but handle labor charges specially
      const cartForAPI = cart.map((item) => {
        // Handle labor charges specially
        if (item.id === 9999 || item.name === "Labor - Custom Service") {
          return {
            productId: "9999", // Use string ID for labor charges
            quantity: item.quantity,
            sellingPrice: item.price,
            volumeDescription: item.name,
          };
        }

        // Handle regular inventory items
        const productInfo = products.find((p) => p.id === item.id);
        const lubricantProductInfo = lubricantProducts.find(
          (p) => p.id === item.id
        );
        const isLubricant =
          productInfo?.category === "Lubricants" ||
          lubricantProductInfo !== undefined;

        // Use the originalId (UUID) instead of the numeric id
        const originalId =
          productInfo?.originalId || lubricantProductInfo?.originalId;
        if (!originalId) {
          throw new Error(`Original ID not found for product ${item.id}`);
        }

        const cartItemForAPI = {
          productId: originalId, // Use the original UUID as expected by API
          quantity: item.quantity,
          sellingPrice: item.price,
          volumeDescription: item.details || item.name,
          // If it's a lubricant, ensure 'source' is set. Default to 'CLOSED' if bottleType is not specified.
          source: isLubricant
            ? item.bottleType === "open"
              ? "OPEN"
              : "CLOSED"
            : undefined,
        };

        if (isLubricant) {
        }

        return cartItemForAPI;
      });

      // Prepare trade-ins if any - Enable for battery checkouts
      let tradeInsForAPI = undefined;

      // Check if this is a battery sale (for logging/logic) but send trade-ins regardless
      const isBatterySale = cartContainsAnyBatteries(cart);
      
      if (tradeinBatteries.length > 0) {
        // Create trade-in entries using battery size as name
        tradeInsForAPI = tradeinBatteries.map((battery) => ({
          productId: `tradein-${battery.size
            .toLowerCase()
            .replace(/\s+/g, "-")}-${battery.status}`, // Generate consistent ID
          quantity: 1,
          tradeInValue: battery.amount,
          size: battery.size,
          condition: battery.status,
          name: battery.size, // Use battery size as the name
          costPrice: battery.amount, // Use trade-in amount as cost price
        }));
      } else {
      }

      // Use the enhanced checkout service with retry and offline support
      const { checkoutService } = await import(
        "@/lib/services/checkout-service"
      );

      const checkoutPayload = {
        locationId: inventoryLocationId || currentBranch?.id || "default-location", // Will be derived from shopId if shopId is provided
        shopId: currentBranch?.id || "default-shop", // currentBranch.id is now a shop ID
        paymentMethod: selectedPaymentMethod.toUpperCase(),
        cashierId: selectedCashier?.id || "default-cashier",
        cart: cartForAPI,
        carPlateNumber: carPlateNumber.trim() || undefined, // Normalize empty string to undefined
        customerId: currentCustomer?.id || undefined, // Normalize null/empty to undefined
        ...(tradeInsForAPI ? { tradeIns: tradeInsForAPI } : {}),
        ...(appliedDiscount ? { discount: appliedDiscount } : {}),
        ...(selectedPaymentMethod === "mobile" && paymentRecipient
          ? { mobilePaymentAccount: paymentRecipient }
          : {}),
        ...(selectedPaymentMethod === "mobile" && currentCustomer?.phone
          ? { mobileNumber: currentCustomer.phone }
          : {}),
      };

      const result = await checkoutService.processCheckout(checkoutPayload);

      if (!result.success) {
        throw new Error(result.error || "Checkout processing failed");
      }

      // Store the transaction result for receipt display

      // Update transaction data with real reference number from server
      // Update transaction data with real reference number from server
      const serverReferenceNumber = result.data?.transaction?.referenceNumber || result.data?.referenceNumber;
      if (serverReferenceNumber) {
        setTransactionData((prev) => ({
          ...prev,
          receiptNumber: serverReferenceNumber,
        }));
      }

      if (result.data?.offline) {
        toast({
          title: "Transaction Completed Offline",
          description:
            "Receipt generated. Transaction will sync when connection is restored.",
          variant: "default",
          duration: 5000,
        });
      } else {
        if (result.data?.batteryBillHtml) {
        } else if (result.data?.receiptHtml) {
        }
      }

      setIsCashierSelectOpen(false);
      setShowSuccess(true);
      setIsProcessingCheckout(false);

      // Refresh products to update inventory counts (especially open bottle volumes)
      try {
        await syncProducts(false, true);
      } catch (error) {
        console.error("Failed to refresh products after checkout:", error);
      }

      // Auto-sync offline transactions periodically
      if (typeof window !== "undefined") {
        setTimeout(async () => {
          try {
            await checkoutService.syncOfflineTransactions();
          } catch (error) {
            console.error("Failed to sync offline transactions:", error);
          }
        }, 5000); // Sync after 5 seconds
      }

      // Make a copy of the appliedDiscount for the receipt display
      const discountForReceipt = appliedDiscount
        ? { ...appliedDiscount }
        : null;
    } catch (error) {
      console.error("Checkout error:", error);

      // Enhanced error handling based on error type with actionable guidance
      let errorTitle = "Checkout Processing Issue";
      let errorDescription = "There was an issue processing the payment.";
      let errorActions = [];

      if (error instanceof Error) {
        if (
          error.message.includes("Database") ||
          error.message.includes("authentication failed")
        ) {
          errorTitle = "Database Connection Issue";
          errorDescription =
            "Unable to connect to database. Please check your configuration.";
          errorActions = [
            "1. Check your DATABASE_URL in environment variables",
            "2. Verify the password in Supabase Dashboard",
            "3. Run GET /api/diagnose-db for diagnostics",
            "4. Try again in a few moments",
          ];
        } else if (
          error.message.includes("network") ||
          error.message.includes("fetch") ||
          error.message.includes("connection")
        ) {
          errorTitle = "Network Connection Issue";
          errorDescription =
            "Connection problem detected. Please check your internet connection.";
          errorActions = [
            "1. Check your internet connection",
            "2. Verify Supabase project is active",
            "3. Check if your IP is blocked in Supabase settings",
            "4. Try again in a few moments",
          ];
        } else if (error.message.includes("timeout")) {
          errorTitle = "Request Timeout";
          errorDescription = "Request took too long. The service may be busy.";
          errorActions = [
            "1. Wait a moment and try again",
            "2. Check if the database is under heavy load",
            "3. Contact support if this persists",
          ];
        } else if (error.message.includes("Server error")) {
          errorTitle = "Server Error";
          errorDescription =
            "The server encountered an error. Please try again.";
          errorActions = [
            "1. Try the transaction again",
            "2. Check your database connection",
            "3. Run GET /api/diagnose-db for diagnostics",
            "4. Contact support if this persists",
          ];
        } else if (error.message.includes("Invalid request data")) {
          errorTitle = "Data Validation Error";
          errorDescription =
            "The request data is invalid. Please check your input.";
          errorActions = [
            "1. Verify all required fields are filled",
            "2. Check product IDs and quantities",
            "3. Try again with corrected data",
          ];
        }
      }

      toast({
        title: errorTitle,
        description: (
          <div className="space-y-2">
            <p>{errorDescription}</p>
            {errorActions.length > 0 && (
              <div className="mt-2">
                <p className="font-medium text-sm">What to do:</p>
                <ul className="text-sm mt-1 space-y-0.5">
                  {errorActions.map((action, index) => (
                    <li key={index} className="text-muted-foreground">
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ),
        variant: "destructive",
        duration: 8000,
      });

      // Reset cashier dialog state on error
      setIsCashierSelectOpen(true);
      setEnteredCashierId("");
      setFetchedCashier(null);
      setCashierIdError(null);
      setPaymentRecipient(null);

      // Fallback removed: Do NOT complete transaction manually if API fails.
      // This ensures data consistency. The user sees the error toast and can retry.
      console.error("❌ API checkout failed. Transaction NOT completed locally.");
      setIsProcessingCheckout(false);

    }
  };

  // Function to reset all POS state after a transaction is complete
  const resetPOSState = () => {
    // Reset cart
    contextClearCart();
    setShowCart(false);

    // Reset payment info
    setSelectedPaymentMethod(null);
    setAppliedDiscount(null);
    setDiscountValue(0);

    // Reset trade-in amounts
    setAppliedTradeInAmount(0);
    resetTradeInDialog();

    // Reset cashier info - this is the important part for fixing the ID persistence issue
    setSelectedCashier(null);
    setEnteredCashierId("");
    setFetchedCashier(null);
    setCashierIdError(null);
    setPaymentRecipient(null);

    // Reset customer info
    setCurrentCustomer(null);
    setSelectedCustomerId("");
  };

  // Replace the handleImportCustomers function definition with this one
  // (no-op placeholder wired to ImportDialog which expects product-shaped data)
  const handleImportCustomers = () => {};

  // Function to toggle between open and closed bottle types
  const toggleBottleType = (size: string) => {
    setSelectedVolumes((prev) => {
      return prev.map((v) =>
        v.size === size
          ? {
              ...v,
              bottleType: v.bottleType === "open" ? "closed" : "open",
            }
          : v
      );
    });
  };

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
  useEffect(() => {
  }, [appliedDiscount]);

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

  // Parts handlers
  const handlePartClick = (part: {
    id: number;
    name: string;
    price: number;
  }) => {
    // Check initial stock
    const product = products.find(p => p.id === part.id);
    if (product && product.availableQuantity <= 0) {
         toast({
            title: "Out of Stock",
            description: "Item is out of stock.",
            variant: "destructive"
        });
        return;
    }

    setSelectedParts((prev) => {
      const existing = prev.find((p) => p.id === part.id);
      const currentQty = existing ? existing.quantity : 0;
      const inCart = calculateCartCount(part.id);
      const limit = product ? product.availableQuantity : 9999;

      if (currentQty + inCart + 1 > limit) {
         toast({
            title: "Stock Limit Reached",
            description: `Only ${limit} available.`,
            variant: "destructive"
        });
        return prev;
      }

      if (existing) {
        return prev.map((p) =>
          p.id === part.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, { ...part, quantity: 1 }];
    });
  };

  const handlePartQuantityChange = (partId: number, change: number) => {
    setSelectedParts((prev) => {
      // Check limits
      const product = products.find(p => p.id === partId);
      const limit = product ? product.availableQuantity : 9999;
      const inCart = calculateCartCount(partId);
      const existing = prev.find(p => p.id === partId);
      const currentQty = existing?.quantity || 0;

      if (change > 0 && (currentQty + inCart + change > limit)) {
         toast({
            title: "Stock Limit Reached",
            description: `Cannot add more. Limit is ${limit}.`,
            variant: "destructive"
        });
        return prev;
      }
      
      const updated = prev
        .map((p) =>
          p.id === partId
            ? { ...p, quantity: Math.max(0, p.quantity + change) }
            : p
        )
        .filter((p) => p.quantity > 0);
      return updated;
    });
  };

  const handleAddSelectedPartsToCart = () => {
    // Volume/Bulk check
    let blocked = false;
    selectedParts.forEach((part) => {
        const product = products.find(p => p.id === part.id);
        const limit = product ? product.availableQuantity : 9999;
        const inCart = calculateCartCount(part.id);
        
        if (inCart + part.quantity > limit) {
            blocked = true;
        }
    });

    if (blocked) {
         toast({
            title: "Stock Validation Failed",
            description: "Some items exceed available stock. Please adjust quantities.",
            variant: "destructive"
        });
        return;
    }

    selectedParts.forEach((part) => {
      addToCart(
        {
          id: part.id,
          name: part.name,
          price: part.price,
        },
        undefined,
        part.quantity
      );
    });
    setIsPartBrandModalOpen(false);
    setSelectedParts([]);
    setSelectedPartType(null);
    if (isMobile) setShowCart(true);
  };

  const handleNextPartItem = () => {
    handleAddSelectedPartsToCart();
    setActiveCategory("Additives & Fluids");
    setSearchQuery("");
  };

  // Part brands and types are now provided by the hook

  const getPartsByType = (type: string) =>
    products.filter(
      (product) => product.category === "Parts" && product.type === type
    );

  // Helper function to check if the cart contains only batteries
  const cartContainsOnlyBatteries = (cartItems: CartItem[]): boolean => {
    if (cartItems.length === 0) return false;

    // Filter out the special discount item before checking if all remaining are batteries
    const actualProductItems = cartItems.filter(
      (item) => !item.name.toLowerCase().includes("discount on old battery")
    );

    // If, after filtering out the discount, there are no actual products, it's not a battery-only sale.
    if (actualProductItems.length === 0) return false;

    // Helper to check if a type string indicates a battery (case-insensitive, handles both singular and plural)
    const isBatteryType = (type?: string): boolean => {
      if (!type) return false;
      const normalizedType = type.toLowerCase().trim();
      return normalizedType === "battery" || normalizedType === "batteries";
    };

    return actualProductItems.every((item) => {
      // Method 1: Check via product lookup (primary method)
      const productInfo = products.find((p) => p.id === item.id);
      const isProductBattery =
        productInfo?.category === "Parts" && isBatteryType(productInfo?.type);

      // Method 2: Check via cart item's own category/type properties (primary method)
      const isCartItemBattery =
        item.category === "Parts" && isBatteryType(item.type);

      // Return true if product is identified as a battery by category/type
      // Note: Removed name-based fallback - relying solely on category/type for accuracy
      return isProductBattery || isCartItemBattery;
    });
  };

  // Helper function to check if the cart contains any battery products
  const cartContainsAnyBatteries = (cartItems: CartItem[]): boolean => {
    if (cartItems.length === 0) return false;
    return cartItems.some((item) => {
      // Helper to check if a type string indicates a battery (case-insensitive, handles both singular and plural)
      const isBatteryType = (type?: string): boolean => {
        if (!type) return false;
        const normalizedType = type.toLowerCase().trim();
        return normalizedType === "battery" || normalizedType === "batteries";
      };

      // Method 1: Check via product lookup (primary method)
      const productInfo = products.find((p) => p.id === item.id);
      const isProductBattery =
        productInfo?.category === "Parts" && isBatteryType(productInfo?.type);

      // Method 2: Check via cart item's own category/type properties (primary method)
      const isCartItemBattery =
        item.category === "Parts" && isBatteryType(item.type);

      // Return true if product is identified as a battery by category/type
      // Note: Removed name-based fallback - relying solely on category/type for accuracy
      return isProductBattery || isCartItemBattery;
    });
  };

  const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false);
  const [isWarrantyDialogOpen, setIsWarrantyDialogOpen] = useState(false);
  const [isLaborDialogOpen, setIsLaborDialogOpen] = useState(false);
  const [laborAmount, setLaborAmount] = useState<number>(0.5);

  // Settlement modal state
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);

  // Miscellaneous deduction modal state
  const [isMiscellaneousDialogOpen, setIsMiscellaneousDialogOpen] =
    useState(false);

  const isMobile = useIsMobile();

  // Keep cart view scrolled to the latest added item (desktop and mobile carts)
  const desktopCartEndRef = useRef<HTMLDivElement | null>(null);
  const mobileCartEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    // Smoothly scroll to the end sentinels when cart updates
    desktopCartEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
    mobileCartEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [cart]);

  // Add new state for customer form
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerData | null>(
    null
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  // Add new state for customer add success animation
  const [showCustomerSuccess, setShowCustomerSuccess] = useState(false);

  // Total quantity of items in cart (for mobile badge)
  const totalCartQuantity = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Handle customer form submission
  const handleAddCustomer = (customerData: CustomerData) => {
    // Save customer data (includes id)
    setCurrentCustomer(customerData);

    // Show customer add success animation
    setShowCustomerSuccess(true);
    setIsCustomerFormOpen(false);

    // After 3 seconds, proceed to payment selection
    setTimeout(() => {
      setShowCustomerSuccess(false);
      // Reset the cashierId field before showing payment selection
      setEnteredCashierId("");
      setFetchedCashier(null);
      setCashierIdError(null);
      setIsCheckoutModalOpen(true);
    }, 3000);
  };

  // Handle skipping customer form
  const handleSkipCustomerForm = () => {
    // Close customer form and proceed to payment selection
    setIsCustomerFormOpen(false);

    // Reset the cashierId field before showing payment selection
    setEnteredCashierId("");
    setFetchedCashier(null);
    setCashierIdError(null);
    setIsCheckoutModalOpen(true);
  };

  // ✅ CONDITIONAL RENDERING AFTER ALL HOOKS (React Rules of Hooks)
  // Show loading state while data is being fetched
  if (isLoading) {
    return (
      <Layout>
        <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner className="text-muted-foreground w-8 h-8" />
          </div>
        </div>
      </Layout>
    );
  }

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
                        <HugeiconsIcon icon={Cashier02Icon} size={22} strokeWidth={2.2} className="!size-[22px]" />
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
                    <span className="font-mono text-sm text-gray-600" suppressHydrationWarning>
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
                    <HugeiconsIcon icon={Cashier02Icon} size={22} strokeWidth={2.2} className="!size-[22px]" />
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
          <div className="hidden lg:block lg:w-[400px] xl:w-[450px] 2xl:w-[500px]">
            <Card className="h-[calc(100vh-4rem)] flex flex-col">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 px-4">
                <CardTitle>Cart</CardTitle>
                <Button
                  variant="chonky-destructive"
                  className="flex items-center gap-2 rounded-[12px] px-4 py-[9px] h-auto"
                  onClick={() => setShowClearCartDialog(true)}
                  disabled={cart.length === 0}
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Cart
                </Button>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-4 min-h-0">
                <ScrollArea className="flex-1 -mx-4 px-4">
                  <div className="space-y-2 pb-2">
                    {cart.map((item) => (
                      <CartItem
                        key={item.uniqueId}
                        item={item}
                        updateQuantity={updateQuantity}
                        removeFromCart={removeFromCart}
                      />
                    ))}
                    {/* Sentinel to auto-scroll to latest item */}
                    <div ref={desktopCartEndRef} />
                  </div>
                </ScrollArea>
                <div className="pt-3 mt-auto border-t">
                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between text-[clamp(1rem,2.5vw,1.125rem)] font-semibold">
                      <span>Subtotal</span>
                      <span>OMR {subtotal.toFixed(3)}</span>
                    </div>

                    {appliedDiscount && (
                      <div className="flex justify-between text-[clamp(0.875rem,2vw,1rem)] text-muted-foreground">
                        <div className="flex justify-between items-center">
                          <span>
                            Discount{" "}
                            {appliedDiscount.type === "percentage"
                              ? `(${appliedDiscount.value}%)`
                              : "(Amount)"}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 rounded-full"
                            onClick={removeDiscount}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <span>- OMR {discountAmount.toFixed(3)}</span>
                      </div>
                    )}

                    {appliedTradeInAmount > 0 && (
                      <div className="flex justify-between text-[clamp(0.875rem,2vw,1rem)] text-green-600">
                        {" "}
                        {/* Trade-in shown in green */}
                        <span>Trade-In Amount</span>
                        <span>- OMR {appliedTradeInAmount.toFixed(3)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-[clamp(1rem,2.5vw,1.125rem)] font-semibold">
                      <span>Total</span>
                      <span>OMR {total.toFixed(3)}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex gap-2 mb-2">
                      <Button
                        variant="chonky-secondary"
                        className={cn(
                          "h-auto py-[9px] rounded-[12px] flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800",
                          cartContainsAnyBatteries(cart) ? "flex-1" : "w-full" // Condition updated here
                        )}
                        onClick={() => setIsDiscountDialogOpen(true)}
                        disabled={cart.length === 0}
                      >
                        <Scissors className="h-4 w-4" />
                        {appliedDiscount ? "Edit Discount" : "Discount"}
                      </Button>
                      {cartContainsAnyBatteries(cart) && (
                        <Button
                          variant="chonky-secondary"
                          className="h-auto py-[9px] rounded-[12px] flex-1 flex items-center justify-center gap-2 bg-secondary hover:bg-accent text-foreground border-input border"
                          onClick={() => {
                            // Pre-populate with existing trade-in data if available
                            if (appliedTradeInAmount > 0) {
                              // If there's already an applied trade-in, show it as the first entry
                              setCurrentBatteryEntry({
                                size: "",
                                status: "",
                                amount: appliedTradeInAmount,
                              });
                            }
                            setIsTradeInDialogOpen(true);
                          }}
                        >
                          <PercentIcon className="h-4 w-4" />
                          {appliedTradeInAmount > 0
                            ? "Edit Trade-In"
                            : "Trade In"}
                        </Button>
                      )}
                    </div>

                    <Button
                      variant="chonky"
                      className="w-full h-auto py-[9px] rounded-[12px]"
                      disabled={cart.length === 0 || isCheckoutLoading}
                      onClick={handleCheckout}
                    >
                      {isCheckoutLoading ? (
                        <div className="flex items-center justify-center w-full">
                          <Spinner className="text-black mr-2" />
                          Processing...
                        </div>
                      ) : (
                        "Checkout"
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Cart */}
          <div
            className={cn(
              "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:hidden transition-all duration-300",
              showCart ? "opacity-100 pointer-events-auto" : "opacity-0",
              !cartVisible && "pointer-events-none"
            )}
          >
            <div
              className={cn(
                "fixed right-0 top-0 h-full w-full sm:w-[400px] bg-background shadow-lg transition-transform duration-300 ease-out",
                showCart ? "translate-x-0" : "translate-x-full"
              )}
            >
              <Card className="h-full flex flex-col border-0">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4">
                  <CardTitle className="text-[clamp(1.125rem,3vw,1.25rem)]">
                    Cart
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="chonky-destructive"
                      className="flex items-center gap-2 text-[clamp(0.875rem,2vw,1rem)] h-auto px-4 py-[9px] rounded-[12px]"
                      onClick={() => setShowClearCartDialog(true)}
                      disabled={cart.length === 0}
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear Cart
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 bg-muted hover:bg-muted/80 text-foreground border border-input shadow-sm rounded-[12px] transition-colors"
                      onClick={() => setShowCart(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
                  <ScrollArea className="flex-1 -mx-4 px-4 overflow-y-auto">
                    <div className="space-y-2 pb-2">
                      {cart.map((item) => (
                        <CartItem
                          key={item.uniqueId}
                          item={item}
                          updateQuantity={updateQuantity}
                          removeFromCart={removeFromCart}
                        />
                      ))}
                      {/* Sentinel to auto-scroll to latest item */}
                      <div ref={mobileCartEndRef} />
                    </div>
                  </ScrollArea>
                  <div className="mt-2 space-y-2 border-t pt-3 sticky bottom-0 bg-background w-full">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[clamp(1rem,2.5vw,1.125rem)] font-semibold">
                        <span>Subtotal</span>
                        <span>OMR {subtotal.toFixed(3)}</span>
                      </div>

                      {appliedDiscount && (
                        <div className="flex justify-between text-[clamp(0.875rem,2vw,1rem)] text-muted-foreground">
                          <div className="flex justify-between items-center">
                            <span>
                              Discount{" "}
                              {appliedDiscount.type === "percentage"
                                ? `(${appliedDiscount.value}%)`
                                : "(Amount)"}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 rounded-full"
                            onClick={removeDiscount}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <span>- OMR {discountAmount.toFixed(3)}</span>
                      </div>
                    )}

                    {appliedTradeInAmount > 0 && (
                      <div className="flex justify-between text-[clamp(0.875rem,2vw,1rem)] text-green-600">
                          <span>Trade-In Amount</span>
                          <span>- OMR {appliedTradeInAmount.toFixed(3)}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-[clamp(1rem,2.5vw,1.125rem)] font-semibold">
                        <span>Total</span>
                        <span>OMR {total.toFixed(3)}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex gap-2 mb-2">
                        <Button
                          variant="chonky-secondary"
                          className={cn(
                            "h-auto py-[9px] rounded-[12px] flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800",
                            cartContainsAnyBatteries(cart) ? "flex-1" : "w-full" // Condition updated here
                          )}
                          onClick={() => setIsDiscountDialogOpen(true)}
                          disabled={cart.length === 0}
                        >
                          <Scissors className="h-4 w-4" />
                          {appliedDiscount ? "Edit Discount" : "Discount"}
                        </Button>
                        {cartContainsAnyBatteries(cart) && (
                          <Button
                            variant="chonky-secondary"
                            className="h-auto py-[9px] rounded-[12px] flex-1 flex items-center justify-center gap-2 bg-secondary hover:bg-accent text-foreground border-input border"
                            onClick={() => {
                              // Pre-populate with existing trade-in data if available
                              if (appliedTradeInAmount > 0) {
                                // If there's already an applied trade-in, show it as the first entry
                                setCurrentBatteryEntry({
                                  size: "",
                                  status: "",
                                  amount: appliedTradeInAmount,
                                });
                              }
                              setIsTradeInDialogOpen(true);
                            }}
                          >
                            <PercentIcon className="h-4 w-4" />
                            {appliedTradeInAmount > 0
                              ? "Edit Trade-In"
                              : "Trade In"}
                          </Button>
                        )}
                      </div>

                      <Button
                        variant="chonky"
                        className="w-full h-auto py-[9px] rounded-[12px]"
                        disabled={cart.length === 0 || isCheckoutLoading}
                        onClick={handleCheckout}
                      >
                        {isCheckoutLoading ? (
                          <div className="flex items-center justify-center w-full">
                            <Spinner className="text-black mr-2" />
                            Processing...
                          </div>
                        ) : (
                          "Checkout"
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Volume Selection Modal */}
          <Dialog open={isVolumeModalOpen} onOpenChange={setIsVolumeModalOpen}>
              <DialogContent className="w-[90%] max-w-[500px] rounded-lg max-h-[85vh] flex flex-col overflow-hidden gap-0">
              
                {/* --- STANDARD VOLUME SELECTION VIEW --- */}
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
                              // Prevent the default error behavior
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
                            onClick={() => handleVolumeClick(volume)}
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
                                  key={`${volume.size}-${
                                    volume.bottleType || "default"
                                  }`}
                                  className={cn(
                                    "flex flex-col py-1.5",
                                    index === selectedVolumes.length - 1 &&
                                      "mb-2 sm:mb-4"
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 shrink-0"
                                        onClick={() =>
                                          handleQuantityChange(
                                            volume.size,
                                            -1,
                                            volume.bottleType
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
                                        disabled={
                                          (() => {
                                            // 1. OPEN BOTTLE VALIDATION
                                            if (volume.bottleType === "open" && selectedOil?.totalOpenVolume !== undefined) {
                                              // Calculate current total excluding this specific volume
                                              const currentTotalOpenVolume = selectedVolumes
                                                .filter((v) => !(v.size === volume.size && v.bottleType === volume.bottleType))
                                                .filter((v) => v.bottleType === "open")
                                                .reduce((total, v) => {
                                                  const volumeAmount = parseVolumeString(v.size);
                                                  return total + volumeAmount * v.quantity;
                                                }, 0);
                                              
                                              // Calculate volume already in cart for this product
                                              const cartOpenVolume = calculateCartOpenVolume(selectedOil.id);
                                              
                                              // Add this volume with incremented quantity
                                              const volumeAmount = parseVolumeString(volume.size);
                                              const newQuantity = volume.quantity + 1;
                                              const newModalTotal = currentTotalOpenVolume + (volumeAmount * newQuantity);
                                              const newTotal = newModalTotal + cartOpenVolume;
                                              
                                              return newTotal > selectedOil.totalOpenVolume;
                                            }
                                            
                                            // 2. CLOSED BOTTLE VALIDATION
                                            // Default to closed if no bottleType or explicitly closed
                                            if (!volume.bottleType || volume.bottleType === "closed") {
                                              // Ensure we have available quantity data, otherwise fallback to existing behavior
                                              if (volume.availableQuantity === undefined && !selectedOil?.volumes?.[0]?.bottleStates?.closed) return false;
                                              
                                              // Total available closed bottles
                                              const availableClosed = selectedOil?.volumes?.[0]?.bottleStates?.closed || 0;
                                              
                                              // Calculate cart closed count
                                              const cartClosedCount = calculateCartClosedCount(selectedOil.id);
                                              
                                              // Sum of ALL closed bottles currently in modal for this product
                                              const modalClosedCount = selectedVolumes
                                                .filter(v => !v.bottleType || v.bottleType === "closed")
                                                .reduce((sum, v) => sum + v.quantity, 0);
                                                
                                              // Check if adding 1 more exceeds available
                                              return (cartClosedCount + modalClosedCount + 1) > availableClosed;
                                            }
                                            
                                            return false;
                                          })()
                                        }
                                        onClick={() =>
                                          handleQuantityChange(
                                            volume.size,
                                            1,
                                            volume.bottleType
                                          )
                                        }
                                        title={
                                          volume.bottleType === "open" &&
                                          selectedOil?.totalOpenVolume !== undefined
                                            ? (() => {
                                                const currentTotalOpenVolume =
                                                  calculateTotalOpenVolumeSelected(
                                                    selectedVolumes
                                                  );
                                                // Calculate volume already in cart for this product
                                                const cartOpenVolume = calculateCartOpenVolume(selectedOil.id);
                                                const volumeAmount = parseVolumeString(
                                                  volume.size
                                                );
                                                const newTotal =
                                                  currentTotalOpenVolume + volumeAmount + cartOpenVolume;
                                                if (newTotal > selectedOil.totalOpenVolume) {
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
                        onClick={() => {
                          setIsVolumeModalOpen(false);
                          setSelectedVolumes([]);
                          setCurrentBottleVolumeSize(null); // Reset bottle type selection
                        }}
                      >
                        Cancel
                      </Button>
                      <div className="flex gap-2">
                        <Button
                          variant="chonky"
                          className="px-2 sm:px-6 text-sm sm:text-base"
                          onClick={handleAddSelectedToCart}
                          disabled={selectedVolumes.length === 0}
                        >
                          Go to Cart
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 sm:h-10 sm:w-10"
                          onClick={handleNextItem}
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
                availableQuantity: (getFiltersByType(selectedFilterType || "").find(f => f.id === id)?.availableQuantity || 0)
              }))}
            selectedFilters={selectedFilters}
            onFilterClick={({ id, name, price, imageUrl, originalId }) => {
              // Find the full product to pass to handleFilterClick
              const product = getFiltersByType(selectedFilterType || "").find(
                (f) => f.id === id
              );
              if (product) handleFilterClick(product);
            }}
            onQuantityChange={handleFilterQuantityChange}
            onAddToCart={handleAddSelectedFiltersToCart}
            onNext={handleNextFilterItem}
          />

          {/* Clear Cart Confirmation Dialog */}
          <AlertDialog
            open={showClearCartDialog}
            onOpenChange={setShowClearCartDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear Cart</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to clear your cart? This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={clearCart}
                  className={cn(buttonVariants({ variant: "chonky-destructive" }))}
                >
                  Clear Cart
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Checkout Modal */}
          <Dialog
            open={isCheckoutModalOpen}
            onOpenChange={(open) => {
              // Only allow closing via X button when not in success state
              if (!showSuccess) {
                setIsCheckoutModalOpen(open);
                if (!open) {
                  setShowOtherOptions(false); // Reset other options when closing modal
                }
              }
            }}
          >
            <DialogContent
              className="w-[90%] max-w-[500px] p-6 rounded-lg max-h-[90vh] overflow-auto"
              onPointerDownOutside={(e) => e.preventDefault()}
              onEscapeKeyDown={(e) => e.preventDefault()}
            >
              <DialogHeader className="pb-4 sticky top-0 bg-background z-10 pr-8">
                <DialogTitle className="text-xl font-semibold text-center">
                  Select Payment Method
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Choose how the customer will pay for this transaction
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <div
                  className={cn(
                    "grid gap-4",
                    showOtherOptions ? "grid-cols-2" : "grid-cols-3"
                  )}
                >
                  <Button
                    variant={
                      selectedPaymentMethod === "mobile" ? "chonky" : "outline"
                    }
                    className={cn(
                      "h-24 flex flex-col items-center justify-center gap-2",
                      selectedPaymentMethod === "mobile" &&
                        "ring-2 ring-primary"
                    )}
                    onClick={() => {
                      setSelectedPaymentMethod("mobile");
                      setShowOtherOptions(false);
                      setIsOnHoldMode(false);
                      setCarPlateNumber("");
                    }}
                  >
                    <Smartphone className="w-6 h-6" />
                    <span>Mobile Pay</span>
                  </Button>
                  <Button
                    variant={
                      selectedPaymentMethod === "cash" ? "chonky" : "outline"
                    }
                    className={cn(
                      "h-24 flex flex-col items-center justify-center gap-2",
                      selectedPaymentMethod === "cash" && "ring-2 ring-primary"
                    )}
                    onClick={() => {
                      setSelectedPaymentMethod("cash");
                      setShowOtherOptions(false);
                      setIsOnHoldMode(false);
                      setCarPlateNumber("");
                      setPaymentRecipient(null);
                    }}
                  >
                    <Banknote className="w-6 h-6" />
                    <span>Cash</span>
                  </Button>
                  <Button
                    variant={showOtherOptions ? "chonky" : "outline"}
                    className={cn(
                      "h-24 flex flex-col items-center justify-center gap-2",
                      (selectedPaymentMethod === "card" ||
                        selectedPaymentMethod === "on-hold" ||
                        selectedPaymentMethod === "credit") &&
                        "ring-2 ring-primary"
                    )}
                    onClick={() => {
                      setShowOtherOptions(!showOtherOptions);
                      if (!showOtherOptions) {
                        setSelectedPaymentMethod(null);
                      }
                    }}
                  >
                    <ChevronDown className="w-6 h-6" />
                    <span>Other</span>
                  </Button>
                </div>

                {showOtherOptions && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-3 gap-4"
                  >
                    <Button
                      variant={
                        selectedPaymentMethod === "card" ? "chonky" : "outline"
                      }
                      className={cn(
                        "h-24 flex flex-col items-center justify-center gap-2",
                        selectedPaymentMethod === "card" &&
                          "ring-2 ring-primary"
                      )}
                      onClick={() => {
                        setSelectedPaymentMethod("card");
                        setIsOnHoldMode(false);
                        setCarPlateNumber("");
                        setPaymentRecipient(null);
                      }}
                    >
                      <CreditCard className="w-6 h-6" />
                      <span>Card</span>
                    </Button>
                    <Button
                      variant={
                        selectedPaymentMethod === "on-hold"
                          ? "chonky"
                          : "outline"
                      }
                      className={cn(
                        "h-24 flex flex-col items-center justify-center gap-2",
                        selectedPaymentMethod === "on-hold" &&
                          "ring-2 ring-primary"
                      )}
                      onClick={() => {
                        setSelectedPaymentMethod("on-hold");
                        setIsOnHoldMode(true);
                        setCarPlateNumber("");
                        setPaymentRecipient(null);
                      }}
                    >
                      <Ticket className="w-6 h-6" />
                      <span>on-hold</span>
                    </Button>
                    <Button
                      variant={
                        selectedPaymentMethod === "credit"
                          ? "chonky"
                          : "outline"
                      }
                      className={cn(
                        "h-24 flex flex-col items-center justify-center gap-2",
                        selectedPaymentMethod === "credit" &&
                          "ring-2 ring-primary"
                      )}
                      onClick={() => {
                        setSelectedPaymentMethod("credit");
                        setIsOnHoldMode(false);
                        setCarPlateNumber("");
                        setPaymentRecipient(null);
                      }}
                    >
                      <Receipt className="w-6 h-6" />
                      <span>Credit</span>
                    </Button>
                  </motion.div>
                )}

                <div className="border-t pt-6">
                  {/* Car plate input - show for on-hold payments OR battery sales */}
                  {(isOnHoldMode || cartContainsAnyBatteries(cart)) && (
                    <div className="w-full mb-4">
                      <div className="text-sm font-medium text-gray-600 mb-2">
                        Car Plate Number
                      </div>
                      <input
                        type="text"
                        value={carPlateNumber}
                        onChange={(e) =>
                          setCarPlateNumber(e.target.value.toUpperCase())
                        }
                        placeholder="e.g., ABC-123"
                        className="w-full h-10 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        maxLength={10}
                      />
                    </div>
                  )}

                  {/* Payment recipient selection - only show for mobile payments */}
                  {selectedPaymentMethod === "mobile" && (
                    <div className="w-full mb-4">
                      <div className="text-sm font-medium text-gray-600 mb-2">
                        Select payment recipient:
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {staffMembers
                          .filter((staff) => {
                            // Filter for mobile payment recipients - check by staff_id if available
                            // This should be configurable in the future
                            const staffId = staff.id;
                            return staffId === "0020" || staffId === "0010";
                          })
                          .map((staff) => (
                            <Button
                              key={staff.id}
                              variant={
                                paymentRecipient === staff.name
                                  ? "chonky"
                                  : "outline"
                              }
                              className={cn(
                                "h-10 text-center",
                                paymentRecipient === staff.name &&
                                  "ring-2 ring-primary"
                              )}
                              onClick={() => setPaymentRecipient(staff.name)}
                            >
                              {staff.id === "0010" ? "Foreman" : staff.name}
                            </Button>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between text-lg font-semibold mb-6">
                    <span>Total Amount</span>
                    <span>OMR {total.toFixed(3)}</span>
                  </div>
                  <Button
                    className="w-full h-12 text-base"
                    variant="chonky"
                    disabled={
                      !selectedPaymentMethod ||
                      (selectedPaymentMethod === "mobile" &&
                        !paymentRecipient) ||
                      ((isOnHoldMode || cartContainsAnyBatteries(cart)) && !carPlateNumber.trim())
                    }
                    onClick={handlePaymentComplete}
                  >
                    {isOnHoldMode ? "Confirm" : "Complete Payment"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
            const ticketNumber = transactionData.receiptNumber || `OH-${Date.now().toString().slice(-6)}`;

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
                        ", "
                      )}</p>
                      <p class="company-info">Tel: ${companyInfo.brand.phones.join(
                        ", "
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
                          `
                            )
                            .join("")}
                        </div>
                      </div>
                    </div>

                    <div class="total-section">
                      <div class="total-row">
                        <span class="total-label">TOTAL AMOUNT:</span>
                        <span class="total-amount">OMR ${total.toFixed(
                          3
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
      <Dialog
        open={isCashierSelectOpen}
        onOpenChange={(open) => {
          setIsCashierSelectOpen(open);
          // Always reset the cashier info when opening or closing the dialog
          if (open) {
            setEnteredCashierId("");
            setFetchedCashier(null);
            setCashierIdError(null);
          } else {
            setEnteredCashierId("");
            setFetchedCashier(null);
            setCashierIdError(null);
            setPaymentRecipient(null);
            if (!selectedCashier) setIsCheckoutModalOpen(true);
          }
        }}
      >
        <DialogContent
          className="w-[90%] max-w-[400px] p-6 rounded-lg"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          {!fetchedCashier ? (
            <>
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-semibold text-center">
                  Enter Cashier ID
                </DialogTitle>
                <DialogDescription className="text-center">
                  Please enter your cashier ID to proceed.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center">
                <form
                  className="flex flex-col items-center w-full"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const found = staffMembers.find(
                      (c) => c.id === enteredCashierId
                    );
                    if (found) {
                      setFetchedCashier(found);
                      setSelectedCashier(found);
                      setCashierIdError(null);
                    } else {
                      setCashierIdError(
                        "Invalid cashier ID. Please try again."
                      );
                    }
                  }}
                >
                  <Input
                    key={`cashier-id-input-${isCashierSelectOpen}`}
                    className="text-center text-2xl w-32 mb-2"
                    value={enteredCashierId}
                    onChange={(e) => {
                      setEnteredCashierId(e.target.value.replace(/\D/g, ""));
                      setCashierIdError(null);
                    }}
                    maxLength={6}
                    inputMode="numeric"
                    type="tel"
                    pattern="[0-9]*"
                    autoFocus
                    placeholder="ID"
                  />
                  <Button
                    className="w-full mt-4"
                    type="submit"
                    variant="chonky"
                    disabled={enteredCashierId.length === 0}
                  >
                    Proceed
                  </Button>
                </form>
                {cashierIdError && (
                  <div className="text-destructive text-sm mt-2">
                    {cashierIdError}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <DialogHeader className="pb-4">
                <DialogTitle className="text-xl font-semibold text-center">
                  Welcome, {fetchedCashier.name}!
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center my-4">
                <div className="text-muted-foreground mb-4">
                  ID: {fetchedCashier.id}
                </div>

                <Button
                  className="w-full h-12 text-base"
                  variant="chonky"
                  onClick={handleFinalizePayment}
                  disabled={
                    (selectedPaymentMethod === "mobile" && !paymentRecipient) ||
                    isProcessingCheckout
                  }
                >
                  {isProcessingCheckout ? (
                    <div className="flex items-center justify-center w-full">
                      <Spinner className="text-black w-5 h-5" />
                    </div>
                  ) : (
                    "Confirm Payment"
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Success dialog shown after cashier selection */}
      {showSuccess && (
        <Dialog
          open={showSuccess}
          onOpenChange={(open) => {
            setShowSuccess(open);
          }}
        >
          <DialogContentWithoutClose
            className="w-[90%] max-w-[500px] px-6 pb-6 pt-0 rounded-lg max-h-[90vh] overflow-auto"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogHeader className="pb-4 sticky top-0 bg-background z-10 pt-6">
              <DialogTitle className="text-xl font-semibold text-center">
                {cartContainsOnlyBatteries(cart)
                  ? "Bill Generated"
                  : "Payment Complete"}
              </DialogTitle>
            </DialogHeader>

            <motion.div
              key={
                cartContainsOnlyBatteries(cart)
                  ? "bill-success"
                  : "payment-success"
              }
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="flex flex-col items-center justify-center py-6"
            >
              {!cartContainsOnlyBatteries(cart) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="rounded-full bg-green-100 p-3 mb-4"
                >
                  <Check className="w-8 h-8 text-green-600" />
                </motion.div>
              )}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-lg font-medium text-green-600 mb-4"
              >
                {cartContainsOnlyBatteries(cart)
                  ? "Bill Ready for Printing"
                  : "Order Successfully Processed!"}
              </motion.p>

              <div className="w-full flex flex-row gap-4 mt-4">
                <Button
                  onClick={() => {
                    setShowSuccess(false);
                    setShowReceiptDialog(true);
                  }}
                  className="flex-1"
                  variant="chonky-secondary"
                >
                  View Receipt
                </Button>
                <Button
                  variant="chonky-secondary"
                  onClick={() => {
                    setShowSuccess(false);
                    resetPOSState();
                  }}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </DialogContentWithoutClose>
        </Dialog>
      )}

      {/* Separate receipt/bill dialog */}
      {showReceiptDialog && (
        <Dialog
          open={showReceiptDialog}
          onOpenChange={(open) => {
            setShowReceiptDialog(open);
            if (!open) {
              resetPOSState();
            }
          }}
        >
          <DialogContent className="w-[95%] max-w-[520px] p-4 rounded-lg max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="text-center text-xl">
                {cartContainsOnlyBatteries(cart)
                  ? "Bill Preview"
                  : "Receipt Preview"}
              </DialogTitle>
            </DialogHeader>

            <div className="mt-2">
              {cartContainsOnlyBatteries(cart) ? (
                <BillComponent
                  key={`bill-${transactionData.receiptNumber || "fallback"}`}
                  cart={cart}
                  billNumber={
                    transactionData.receiptNumber || "PENDING"
                  }
                  currentDate={
                    transactionData.currentDate ||
                    new Date().toLocaleDateString("en-GB")
                  }
                  currentTime={
                    transactionData.currentTime ||
                    new Date().toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  }
                  cashier={selectedCashier?.name ?? undefined}
                  appliedDiscount={appliedDiscount}
                  appliedTradeInAmount={appliedTradeInAmount}
                  customerName={currentCustomer?.name || ""}
                  carPlateNumber={carPlateNumber}
                  onClose={() => setShowReceiptDialog(false)}
                />
              ) : (
                <ReceiptComponent
                  key={`receipt-${transactionData.receiptNumber || "fallback"}`}
                  cart={cart}
                  paymentMethod={selectedPaymentMethod || "cash"}
                  cashier={selectedCashier?.name ?? undefined}
                  discount={appliedDiscount}
                  paymentRecipient={
                    selectedPaymentMethod === "mobile"
                      ? paymentRecipient
                      : undefined
                  }
                  receiptNumber={
                    transactionData.receiptNumber || "PENDING"
                  }
                  currentDate={
                    transactionData.currentDate ||
                    new Date().toLocaleDateString("en-GB")
                  }
                  currentTime={
                    transactionData.currentTime ||
                    new Date().toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  }
                  onClose={() => setShowReceiptDialog(false)}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Discount Dialog */}
      <Dialog
        open={isDiscountDialogOpen}
        onOpenChange={setIsDiscountDialogOpen}
      >
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
                  discountType === "percentage" && "ring-2 ring-primary"
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
                  discountType === "amount" && "ring-2 ring-primary"
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
                      subtotal
                    ).toFixed(3)} OMR`}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="chonky-secondary"
              className="flex-1"
              onClick={() => setIsDiscountDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              variant="chonky"
              onClick={applyDiscount}
              disabled={discountValue <= 0}
            >
              Apply Discount
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  p.type === selectedPartType
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
      <Dialog open={isDisputeDialogOpen} onOpenChange={setIsDisputeDialogOpen}>
        <DialogContent className="w-[90%] max-w-sm p-6 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">
              Dispute Options
            </DialogTitle>
          </DialogHeader>

          {/* 2x2 Grid Layout for Dispute Options */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {/* Refund Option */}
            <Button
              className="flex flex-col items-center justify-center gap-2 h-20 p-3"
              variant="chonky-secondary"
              onClick={() => {
                setIsDisputeDialogOpen(false);
                setIsRefundDialogOpen(true);
              }}
            >
              <RotateCcw className="h-6 w-6 text-blue-600" />
              <span className="font-medium text-sm">Refund</span>
            </Button>

            {/* Warranty Claim Option */}
            <Button
              className="flex flex-col items-center justify-center gap-2 h-20 p-3"
              variant="chonky-secondary"
              onClick={() => {
                setIsDisputeDialogOpen(false);
                setIsWarrantyDialogOpen(true);
              }}
            >
              <Shield className="h-6 w-6 text-green-600" />
              <span className="font-medium text-sm">Warranty</span>
            </Button>

            {/* Settlement Option */}
            <Button
              className="flex flex-col items-center justify-center gap-2 h-20 p-3"
              variant="chonky-secondary"
              onClick={() => {
                setIsDisputeDialogOpen(false);
                setIsSettlementModalOpen(true);
              }}
            >
              <DollarSign className="h-6 w-6 text-purple-600" />
              <span className="font-medium text-sm">Settlement</span>
            </Button>

            {/* Miscellaneous Option */}
            <Button
              className="flex flex-col items-center justify-center gap-2 h-20 p-3"
              variant="chonky-secondary"
              onClick={() => {
                setIsDisputeDialogOpen(false);
                setIsMiscellaneousDialogOpen(true);
              }}
            >
              <MoreHorizontal className="h-6 w-6 text-primary" />
              <span className="font-medium text-sm">Misc</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Warranty Dialog */}
      <WarrantyDialog
        isOpen={isWarrantyDialogOpen}
        onClose={() => setIsWarrantyDialogOpen(false)}
      />

      {/* Labor Dialog */}
      <Dialog open={isLaborDialogOpen} onOpenChange={setIsLaborDialogOpen}>
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
                    Math.max(0, Math.round((laborAmount - 0.5) * 10) / 10)
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
              onClick={() => setIsLaborDialogOpen(false)}
            >
              Cancel
            </Button>
              <Button
                className="flex-1 h-12 text-base"
                variant="chonky"
              onClick={() => {
                if (laborAmount > 0) {
                  // Add labor charge to cart
                  addToCart({
                    id: 9999, // Use a unique ID for labor
                    name: "Labor - Custom Service",
                    price: laborAmount,
                  });
                  setLaborAmount(0.5); // Reset to default 0.5
                  setIsLaborDialogOpen(false);
                  if (isMobile) setShowCart(true);
                }
              }}
              disabled={laborAmount <= 0}
            >
              Add to Cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      {/* Render the customer add success animation dialog */}
      {showCustomerSuccess && (
        <Dialog open={showCustomerSuccess} onOpenChange={() => {}}>
          <DialogContentWithoutClose
            className="w-[90%] max-w-[400px] px-6 pb-6 pt-0 rounded-lg max-h-[90vh] overflow-auto"
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>
                <span className="sr-only">Customer Added Successfully</span>
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center min-h-[180px] py-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="rounded-full bg-green-100 p-3 mb-4"
              >
                <Check className="w-8 h-8 text-green-600" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-lg font-semibold text-green-600 text-center"
              >
                Customer Added Successfully
              </motion.p>
            </div>
          </DialogContentWithoutClose>
        </Dialog>
      )}
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
      0
    );
    if (localDiscount) {
    }
    return () => clearTimeout(timer);
  }, [cart, localDiscount]); // Removed receiptData from dependencies

  const handlePrint = useCallback(() => {

    // Calculate subtotal
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
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
                        .replace(/\s*\(?(\d+(\.\d+)?[Ll])\s+(open|closed)\s+bottle\)?/i, "")
                        .replace(/\s*\(?(open|closed)\s+bottle\)?/i, "")
                        .trim();
                      
                      // Clean up details similarly
                      let cleanDetails = item.details 
                        ? item.details
                            .replace(/\s*\(?(\d+(\.\d+)?[Ll])\s+(open|closed)\s+bottle\)?/i, "$1")
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
                      3
                    )}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
            
            <div class="receipt-summary">
              <table>
                <tr>
                  <td>Total w/o VAT</td>
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
                    2
                  )}</td>
                </tr>`
                    : "<!-- No discount applied -->"
                }
                <tr>
                  <td>VAT</td>
                  <td class="total-amount">OMR ${vat.toFixed(3)}</td>
                </tr>
                <tr>
                  <td class="total-label">Total with VAT</td>
                  <td class="total-amount">OMR ${total.toFixed(3)}</td>
                </tr>
              </table>
            </div>
            
            <div class="receipt-footer">
              <p>Number of Items: ${cart.reduce(
                (sum, item) => sum + item.quantity,
                0
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
            navigator.userAgent
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
    0
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
              <div key={item.uniqueId} className="grid grid-cols-12 gap-1 mb-1">
                <span className="col-span-1">{index + 1}</span>
                <span className="col-span-2">(x{item.quantity})</span>
                <span className="col-span-7 break-words">
                  {(() => {
                    // Clean up name by removing bottle info if present
                    let cleanName = item.name
                      .replace(/\s*\(?(\d+(\.\d+)?[Ll])\s+(open|closed)\s+bottle\)?/i, "")
                      .replace(/\s*\(?(open|closed)\s+bottle\)?/i, "")
                      .trim();
                    
                    // Clean up details similarly
                    let cleanDetails = item.details 
                      ? item.details
                          .replace(/\s*\(?(\d+(\.\d+)?[Ll])\s+(open|closed)\s+bottle\)?/i, "$1")
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
              <span>Total w/o VAT</span>
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
            <div className="flex justify-between text-[11px] sm:text-xs font-bold">
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
}

function BottleTypeDialog({
  isOpen,
  onOpenChange,
  volumeSize,
  onSelect,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  volumeSize: string | null;
  onSelect: (type: "open" | "closed") => void;
}) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90%] max-w-[400px] p-6 rounded-lg" aria-describedby={undefined}>
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


