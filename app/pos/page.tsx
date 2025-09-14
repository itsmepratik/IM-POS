"use client";

export const dynamic = "force-dynamic"; // Ensure dynamic rendering and no server-side caching

import { useState, useMemo, useCallback, memo, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
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
// Removed unused hooks
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

// Import the RefundDialog component
import { RefundDialog, WarrantyDialog } from "./components/refund-dialog";
import { ImportDialog } from "./components/import-dialog";
import {
  useIntegratedPOSData,
  LubricantProduct,
  Product,
} from "@/lib/hooks/data/useIntegratedPOSData";
import { FilterModal } from "./components/filter-modal";
import { PartsModal } from "./components/parts-modal";
import { TradeInDialog } from "./components/modals/trade-in-dialog";
import { VolumeModal } from "./components/volume-modal";
import { BrandCard } from "./components/brand-card";
import { BrandLogo } from "./components/brand-logo";

// Import the BillComponent
import { BillComponent } from "./components/bill-component";
import { useIsMobile } from "@/hooks/use-mobile";
import { useStaffIDs } from "@/lib/hooks/useStaffIDs";
import { Vehicle, CustomerData } from "@/app/customers/customer-form";
import { CategoryProvider } from "./context/CategoryContext";
import { CartProvider } from "./context/CartContext";
import { LubricantCategory } from "./components/categories/LubricantCategory";
import { FiltersCategory } from "./components/categories/FiltersCategory";
import { PartsCategory } from "./components/categories/PartsCategory";
import { AdditivesFluidsCategory } from "./components/categories/AdditivesFluidsCategory";
import { DataProvider, useBranch } from "@/lib/contexts/DataProvider";
import { BranchSelector } from "@/components/BranchSelector";

// Types are now imported from usePOSMockData hook

interface CartItem extends Product {
  quantity: number;
  details?: string;
  uniqueId: string;
  bottleType?: "open" | "closed";
}

interface SelectedVolume {
  size: string;
  quantity: number;
  price: number;
  bottleType?: "open" | "closed";
}

// Add these after the existing interface definitions near the top of the file
interface ImportedCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  // Add any other properties that might be in imported customers
}

interface TradeinBattery {
  id: string;
  size: string;
  status: "scrap" | "resellable";
  amount: number;
}

// Replaced hardcoded arrays with hook-driven POS catalog

// products and lubricantProducts will come from usePOSCatalog

// Memoize the cart item component
const CartItem = memo(
  ({
    item,
    updateQuantity,
    removeFromCart,
  }: {
    item: CartItem;
    updateQuantity: (id: number, quantity: number, uniqueId?: string) => void;
    removeFromCart: (id: number, uniqueId?: string) => void;
  }) => (
    <div className="grid grid-cols-[1fr_auto] gap-3 py-3 first:pt-0 items-start border-b last:border-b-0">
      {/* Item details */}
      <div className="min-w-0">
        <div className="font-medium text-[clamp(0.875rem,2vw,1rem)] mb-1">
          {item.name}
        </div>
        {item.bottleType && (
          <div className="flex items-center gap-1 mb-1">
            {item.bottleType === "closed" ? (
              <ClosedBottleIcon className="h-4 w-4 text-primary" />
            ) : (
              <OpenBottleIcon className="h-4 w-4 text-primary" />
            )}
            <span className="text-xs text-muted-foreground capitalize">
              {item.bottleType} bottle
            </span>
          </div>
        )}
        <div className="text-[clamp(0.75rem,1.5vw,0.875rem)] text-muted-foreground">
          OMR {item.price.toFixed(3)} each
        </div>
        <div className="font-medium text-[clamp(0.875rem,2vw,1rem)] mt-1">
          OMR {(item.price * item.quantity).toFixed(3)}
        </div>
      </div>

      {/* Right side controls: quantity and delete */}
      <div className="flex flex-col gap-2 items-end">
        {/* Delete button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={() => removeFromCart(item.id, item.uniqueId)}
          aria-label="Remove item"
        >
          <X className="h-3 w-3" />
        </Button>

        {/* Quantity controls - horizontal */}
        <div className="flex items-center gap-1 mt-1">
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() =>
              updateQuantity(
                item.id,
                Math.max(1, item.quantity - 1),
                item.uniqueId
              )
            }
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-5 text-center font-medium text-xs">
            {item.quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-6 w-6"
            onClick={() =>
              updateQuantity(item.id, item.quantity + 1, item.uniqueId)
            }
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  )
);
CartItem.displayName = "CartItem";

// Memoize the product button component
const ProductButton = memo(
  ({
    product,
    addToCart,
  }: {
    product: Product;
    addToCart: (product: Product) => void;
  }) => (
    <Button
      key={product.id}
      variant="outline"
      className="h-[160px] sm:h-[180px] flex flex-col items-center justify-between text-center p-4 hover:shadow-md transition-all overflow-hidden"
      onClick={() => addToCart(product)}
    >
      <div className="flex items-center justify-center h-10 w-10 mb-2">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <Package className="h-4 w-4 text-primary opacity-70" />
        </div>
      </div>
      <div className="text-center flex-1 flex flex-col justify-between">
        <span
          className="font-medium text-xs sm:text-sm word-wrap whitespace-normal leading-tight hyphens-auto"
          style={{ lineHeight: 1.1 }}
        >
          {product.name}
        </span>
        <span className="block text-sm text-primary mt-2">
          OMR {product.price.toFixed(3)}
        </span>
      </div>
    </Button>
  )
);
ProductButton.displayName = "ProductButton";

// Numpad component for cashier ID entry
function Numpad({
  value,
  onChange,
  onBackspace,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
  disabled?: boolean;
}) {
  const touchHandled = useRef(false);

  const handleClick = (num: string) => {
    if (value.length < 6) onChange(value + num);
  };

  const handleTouchStart = (num: string) => {
    touchHandled.current = true;
    handleClick(num);
    setTimeout(() => {
      touchHandled.current = false;
    }, 100);
  };

  return (
    <div className="grid grid-cols-3 gap-2 w-48 mx-auto my-4">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
        <button
          key={n}
          className="bg-muted rounded-lg p-4 text-xl font-bold hover:bg-accent"
          onClick={() => {
            if (!touchHandled.current) handleClick(n.toString());
          }}
          onTouchStart={() => handleTouchStart(n.toString())}
          disabled={disabled}
        >
          {n}
        </button>
      ))}
      <button
        className="bg-muted rounded-lg p-4 text-xl font-bold hover:bg-accent"
        onClick={() => {
          if (!touchHandled.current) onBackspace();
        }}
        onTouchStart={() => {
          touchHandled.current = true;
          onBackspace();
          setTimeout(() => {
            touchHandled.current = false;
          }, 100);
        }}
        disabled={disabled}
      >
        ⌫
      </button>
      <button
        className="bg-muted rounded-lg p-4 text-xl font-bold hover:bg-accent"
        onClick={() => {
          if (!touchHandled.current) handleClick("0");
        }}
        onTouchStart={() => handleTouchStart("0")}
        disabled={disabled}
      >
        0
      </button>
      <button
        className="bg-primary text-primary-foreground rounded-lg p-4 text-xl font-bold hover:bg-primary/90"
        onClick={() => {
          if (!touchHandled.current) onSubmit();
        }}
        onTouchStart={() => {
          touchHandled.current = true;
          onSubmit();
          setTimeout(() => {
            touchHandled.current = false;
          }, 100);
        }}
        disabled={disabled || value.length === 0}
      >
        OK
      </button>
    </div>
  );
}

// Add POS Customer Form component - adapted from the customer form
function POSCustomerForm({
  isOpen,
  onClose,
  onSubmit,
  onSkip,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (customer: Omit<CustomerData, "id" | "lastVisit">) => void;
  onSkip: () => void;
}) {
  const [formData, setFormData] = useState<
    Omit<CustomerData, "id" | "lastVisit">
  >({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    vehicles: [],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addVehicle = () => {
    setFormData((prev) => ({
      ...prev,
      vehicles: [
        ...prev.vehicles,
        {
          id: Date.now().toString(),
          make: "",
          model: "",
          year: "",
          licensePlate: "",
        },
      ],
    }));
  };

  const updateVehicle = (id: string, field: keyof Vehicle, value: string) => {
    setFormData((prev) => ({
      ...prev,
      vehicles: prev.vehicles.map((vehicle) =>
        vehicle.id === id ? { ...vehicle, [field]: value } : vehicle
      ),
    }));
  };

  const removeVehicle = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      vehicles: prev.vehicles.filter((vehicle) => vehicle.id !== id),
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[90%] max-w-[600px] max-h-[90vh] rounded-lg overflow-hidden flex flex-col pb-20 sm:pb-4">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <div className="flex items-center gap-4">
            <DialogTitle>Add New Customer</DialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs flex items-center gap-1 hover:bg-muted"
              onClick={() => {
                setFormData({
                  name: "",
                  email: "",
                  phone: "",
                  address: "",
                  notes: "",
                  vehicles: [],
                });
              }}
              title="Clear all fields"
            >
              <Eraser className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden">
          <ScrollArea
            className="h-full overflow-auto pr-2"
            style={{ maxHeight: "calc(85vh - 12rem)" }}
          >
            <div className="px-6 pb-6">
              <form
                id="customer-form"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="John Doe"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="customer@example.com"
                      type="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="(555) 123-4567"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder="Customer address"
                      className="h-20"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Additional notes about the customer"
                      className="h-20"
                    />
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <Label>Vehicles ({formData.vehicles.length})</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={addVehicle}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Vehicle
                      </Button>
                    </div>

                    {formData.vehicles.length > 0 ? (
                      <Accordion type="multiple" className="w-full">
                        {formData.vehicles.map((vehicle, idx) => (
                          <AccordionItem
                            key={vehicle.id}
                            value={vehicle.id}
                            className="border rounded-md px-3 my-2"
                          >
                            <div className="flex items-center">
                              <Car className="h-4 w-4 mr-2 text-muted-foreground" />
                              <AccordionTrigger className="flex-1 hover:no-underline py-2">
                                <span className="text-sm">
                                  {vehicle.make && vehicle.model
                                    ? `${vehicle.make} ${vehicle.model} ${vehicle.year}`
                                    : `Vehicle ${idx + 1}`}
                                </span>
                              </AccordionTrigger>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeVehicle(vehicle.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            <AccordionContent className="pb-3 pt-1">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label htmlFor={`make-${vehicle.id}`}>
                                    Make
                                  </Label>
                                  <Input
                                    id={`make-${vehicle.id}`}
                                    value={vehicle.make}
                                    onChange={(e) =>
                                      updateVehicle(
                                        vehicle.id,
                                        "make",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Toyota"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`model-${vehicle.id}`}>
                                    Model
                                  </Label>
                                  <Input
                                    id={`model-${vehicle.id}`}
                                    value={vehicle.model}
                                    onChange={(e) =>
                                      updateVehicle(
                                        vehicle.id,
                                        "model",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Camry"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`year-${vehicle.id}`}>
                                    Year
                                  </Label>
                                  <Input
                                    id={`year-${vehicle.id}`}
                                    value={vehicle.year}
                                    onChange={(e) =>
                                      updateVehicle(
                                        vehicle.id,
                                        "year",
                                        e.target.value
                                      )
                                    }
                                    placeholder="2023"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor={`license-${vehicle.id}`}>
                                    License Plate
                                  </Label>
                                  <Input
                                    id={`license-${vehicle.id}`}
                                    value={vehicle.licensePlate}
                                    onChange={(e) =>
                                      updateVehicle(
                                        vehicle.id,
                                        "licensePlate",
                                        e.target.value
                                      )
                                    }
                                    placeholder="ABC-1234"
                                  />
                                </div>
                                <div className="space-y-2 col-span-2">
                                  <Label htmlFor={`vin-${vehicle.id}`}>
                                    VIN (Optional)
                                  </Label>
                                  <Input
                                    id={`vin-${vehicle.id}`}
                                    value={vehicle.vin || ""}
                                    onChange={(e) =>
                                      updateVehicle(
                                        vehicle.id,
                                        "vin",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Vehicle Identification Number"
                                  />
                                </div>
                                <div className="space-y-2 col-span-2">
                                  <Label htmlFor={`notes-${vehicle.id}`}>
                                    Vehicle Notes
                                  </Label>
                                  <Textarea
                                    id={`notes-${vehicle.id}`}
                                    value={vehicle.notes || ""}
                                    onChange={(e) =>
                                      updateVehicle(
                                        vehicle.id,
                                        "notes",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Additional information about the vehicle"
                                    className="h-16"
                                  />
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <div className="text-center py-6 border border-dashed rounded-md">
                        <Car className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No vehicles added yet
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={addVehicle}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add Vehicle
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Add extra padding at the bottom to ensure content is fully scrollable */}
                <div className="pb-20 sm:pb-10"></div>
              </form>
            </div>
          </ScrollArea>
        </div>
        <DialogFooter className="px-6 py-4 border-t shrink-0 flex flex-col sm:flex-row gap-3 sm:gap-2 fixed bottom-0 left-0 right-0 bg-background sm:relative">
          <Button
            type="button"
            variant="secondary"
            onClick={onSkip}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Skip
          </Button>
          <Button
            type="submit"
            form="customer-form"
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            Add Customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function POSPageContent() {
  // ✅ CRITICAL: ALL HOOKS MUST BE CALLED FIRST (React Rules of Hooks)
  const {
    lubricantProducts,
    products,
    filterBrands,
    filterTypes,
    partBrands,
    partTypes,
    lubricantBrands,
    isLoading,
    isBackgroundSyncing,
    error,
    lastSyncTime,
    syncProducts,
    processSale,
    getProductAvailability,
  } = useIntegratedPOSData();

  const { toast } = useToast();
  const { currentBranch } = useBranch();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("Lubricants");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showClearCartDialog, setShowClearCartDialog] = useState(false);
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const [selectedOil, setSelectedOil] = useState<LubricantProduct | null>(null);
  const [filterImageError, setFilterImageError] = useState(false);
  const [lubricantImageError, setLubricantImageError] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "card" | "cash" | "mobile" | "voucher" | null
  >(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showOtherOptions, setShowOtherOptions] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Add discount state
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [discountType, setDiscountType] = useState<"percentage" | "amount">(
    "amount"
  );
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    type: "percentage" | "amount";
    value: number;
  } | null>(null);

  // Trade-In Dialog State
  const [isTradeInDialogOpen, setIsTradeInDialogOpen] = useState(false);
  const [appliedTradeInAmount, setAppliedTradeInAmount] = useState<number>(0);

  // State for receipt/bill number, date, time - to be generated before showing success dialog
  const [transactionData, setTransactionData] = useState({
    receiptNumber: "",
    currentDate: "",
    currentTime: "",
  });

  // Add a state to track if bottle type dialog is open
  const [showBottleTypeDialog, setShowBottleTypeDialog] = useState(false);
  const [currentBottleVolumeSize, setCurrentBottleVolumeSize] = useState<
    string | null
  >(null);

  // Volume modal states
  const [isVolumeModalOpen, setIsVolumeModalOpen] = useState(false);
  const [selectedVolumes, setSelectedVolumes] = useState<
    Array<{
      size: string;
      price: number;
      quantity: number;
      bottleType?: "open" | "closed";
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

  // Trade-in battery states
  const [tradeinBatteries, setTradeinBatteries] = useState<TradeinBattery[]>(
    []
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
    setCart((prevCart) => {
      // If uniqueId is provided, only remove the item with matching uniqueId
      if (uniqueId) {
        return prevCart.filter((item) => item.uniqueId !== uniqueId);
      }
      // Otherwise fall back to filtering by id (for backward compatibility)
      return prevCart.filter((item) => item.id !== productId);
    });
  }, []);

  const updateQuantity = useCallback(
    (productId: number, newQuantity: number, uniqueId?: string) => {
      if (newQuantity < 1) {
        removeFromCart(productId, uniqueId);
      } else {
        setCart((prevCart) =>
          prevCart.map((item) =>
            uniqueId
              ? item.uniqueId === uniqueId
                ? { ...item, quantity: newQuantity }
                : item
              : item.id === productId
              ? { ...item, quantity: newQuantity }
              : item
          )
        );
      }
    },
    [removeFromCart]
  );

  const addToCart = useCallback(
    (
      product: { id: number; name: string; price: number },
      details?: string,
      quantity: number = 1,
      source?: string
    ) => {
      const uniqueId = `${product.id}-${details || ""}`;
      setCart((prevCart) => {
        const existingItem = prevCart.find(
          (item) => item.uniqueId === uniqueId
        );
        if (existingItem) {
          return prevCart.map((item) =>
            item.uniqueId === uniqueId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }

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

        return [
          ...prevCart,
          {
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
          },
        ];
      });
    },
    [products, lubricantProducts]
  );

  const handleLubricantSelect = useCallback((lubricant: LubricantProduct) => {
    setSelectedOil(lubricant);
    setSelectedVolumes([]);
    setIsVolumeModalOpen(true);
  }, []);

  // Function to handle volume selection with bottle type prompt for smaller volumes
  const handleVolumeClick = (volume: { size: string; price: number }) => {
    // For 4L and 5L, add directly without bottle type
    if (volume.size === "4L" || volume.size === "5L") {
      setSelectedVolumes((prev) => {
        const existing = prev.find((v) => v.size === volume.size);
        if (existing) {
          return prev.map((v) =>
            v.size === volume.size ? { ...v, quantity: v.quantity + 1 } : v
          );
        }
        return [...prev, { ...volume, quantity: 1 }];
      });
      return;
    }

    // For other volumes, show the bottle type dialog
    setCurrentBottleVolumeSize(volume.size);
    setShowBottleTypeDialog(true);
  };

  // Function to add volume with selected bottle type
  const addVolumeWithBottleType = (
    size: string,
    bottleType: "open" | "closed"
  ) => {
    const volumeDetails = selectedOil?.volumes.find((v) => v.size === size);
    if (volumeDetails) {
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
    }
    setShowBottleTypeDialog(false);
    setCurrentBottleVolumeSize(null);
  };

  const handleQuantityChange = (size: string, change: number) => {
    setSelectedVolumes((prev) => {
      const updated = prev
        .map((v) =>
          v.size === size
            ? { ...v, quantity: Math.max(0, v.quantity + change) }
            : v
        )
        .filter((v) => v.quantity > 0);
      return updated;
    });
  };

  const handleAddSelectedToCart = () => {
    selectedVolumes.forEach((volume) => {
      if (selectedOil) {
        const details =
          volume.size +
          (volume.bottleType ? ` (${volume.bottleType} bottle)` : "");
        
        // Determine source based on bottle type for checkout API
        const source = volume.bottleType === "open" ? "OPEN" : "CLOSED";
        
        addToCart(
          {
            id: selectedOil.id,
            name: selectedOil.name,
            price: volume.price,
          },
          details,
          volume.quantity,
          source
        );
      }
    });
    setIsVolumeModalOpen(false);
    setSelectedOil(null);
    setSelectedVolumes([]);
    if (isMobile) setShowCart(true);
  };

  const handleNextItem = () => {
    // Add current selection to cart
    handleAddSelectedToCart();

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

  const handleFilterClick = (filter: Product) => {
    setSelectedFilters((prev) => {
      const existing = prev.find((f) => f.id === filter.id);
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

  const handleAddSelectedFiltersToCart = () => {
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
    setIsFilterBrandModalOpen(false);
    setSelectedFilters([]);
    setSelectedFilterType(null);
    if (isMobile) setShowCart(true);
  };

  const handleNextFilterItem = () => {
    handleAddSelectedFiltersToCart();
    setActiveCategory("Parts");
    setSearchQuery("");
  };

  const clearCart = () => {
    setCart([]);
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
    const product = allProducts.find(p => p.id === productId);
    
    if (!product) {
      return {
        canSell: false,
        availableQuantity: 0,
        errorMessage: "Product not found in inventory"
      };
    }
    
    // Use the hook's built-in getProductAvailability function with numeric ID
    const availability = getProductAvailability(productId);
    
    // Handle null availability response
    if (!availability) {
      return {
        canSell: false,
        availableQuantity: 0,
        errorMessage: "Product availability could not be determined"
      };
    }
    
    // Transform to match the expected interface
    return {
      canSell: availability.canSell,
      availableQuantity: availability.availableQuantity,
      errorMessage: availability.errorMessage
    };
  };

  const handleCheckout = async () => {
    if (isCheckoutLoading) {
      console.log('⏳ Checkout already in progress, ignoring click');
      return;
    }
    
    setIsCheckoutLoading(true);
    
    try {
      console.log('🛒 Checkout initiated with cart:', cart);
      
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

      // Validate stock availability for all cart items
      const stockValidationErrors: string[] = [];

      for (const cartItem of cart) {
        console.log(`🔍 Checking availability for product ID: ${cartItem.id}`);
        
        try {
          const availability = getAvailabilityByNumericId(cartItem.id);
          console.log(`📊 Availability result for ${cartItem.name}:`, availability);
          
          if (availability) {
            if (!availability.canSell) {
              stockValidationErrors.push(
                `${cartItem.name}: ${availability.errorMessage || "Not available"}`
              );
            } else if (cartItem.quantity > availability.availableQuantity) {
              stockValidationErrors.push(
                `${cartItem.name}: Only ${availability.availableQuantity} available, but ${cartItem.quantity} requested`
              );
            }
          } else {
            console.warn(`⚠️ No availability data for product: ${cartItem.name}`);
            stockValidationErrors.push(
              `${cartItem.name}: Product not found in inventory`
            );
          }
        } catch (availabilityError) {
          console.error(`❌ Error checking availability for ${cartItem.name}:`, availabilityError);
          stockValidationErrors.push(
            `${cartItem.name}: Error checking availability`
          );
        }
      }

      // If there are stock validation errors, show them and don't proceed
      if (stockValidationErrors.length > 0) {
        console.log('❌ Stock validation failed:', stockValidationErrors);
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

      console.log('✅ Stock validation passed, proceeding with checkout');
      
      // If all validations pass, proceed with checkout
      setIsCustomerFormOpen(true);

      // Generate transaction data for later use
      const newReceiptNumber = `A${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`;
      const newCurrentDate = new Date().toLocaleDateString("en-GB");
      const newCurrentTime = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      
      console.log('📋 Transaction data generated:', {
        receiptNumber: newReceiptNumber,
        currentDate: newCurrentDate,
        currentTime: newCurrentTime,
      });
      
      setTransactionData({
        receiptNumber: newReceiptNumber,
        currentDate: newCurrentDate,
        currentTime: newCurrentTime,
      });
      
      console.log('🎯 Checkout process completed successfully');
        
      } catch (error) {
        console.error('💥 Critical error in handleCheckout:', error);
        toast({
          title: "Checkout Error",
          description: "An unexpected error occurred during checkout. Please try again.",
          variant: "destructive",
          duration: 5000,
        });
      } finally {
        setIsCheckoutLoading(false);
      }
    };

  const handlePaymentComplete = () => {
    // Instead of showing success immediately, show cashier selection dialog
    setIsCheckoutModalOpen(false);
    // Reset cashier fields before opening the cashier selection dialog
    setEnteredCashierId("");
    setFetchedCashier(null);
    setCashierIdError(null);
    setIsCashierSelectOpen(true);
  };

  // Add this new function to handle final payment completion
  const handleFinalizePayment = async () => {
    if (!selectedPaymentMethod || !selectedCashier) {
      toast({
        title: "Missing Information",
        description: "Payment method and cashier are required.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    // Ensure transaction data is generated if not already done
    if (!transactionData.receiptNumber) {
      const newReceiptNumber = `A${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`;
      const newCurrentDate = new Date().toLocaleDateString("en-GB");
      const newCurrentTime = new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setTransactionData({
        receiptNumber: newReceiptNumber,
        currentDate: newCurrentDate,
        currentTime: newCurrentTime,
      });
    }

    try {
      // Prepare cart items for the API call
      // Filter out "Labor - Custom Service" items as they don't have valid UUIDs
      const validCartItems = cart.filter(
        (item) => item.name !== "Labor - Custom Service"
      );

      const cartForAPI = validCartItems.map((item) => {
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
          source: isLubricant
            ? item.bottleType === "open"
              ? "OPEN"
              : "CLOSED"
            : undefined,
        };
      });

      // Prepare trade-ins if any - Enable for battery checkouts
      let tradeInsForAPI = undefined;
      
      // Check if this is a battery sale and has trade-ins
      const isBatterySale = cartContainsAnyBatteries(cart);
      if (isBatterySale && tradeinBatteries.length > 0) {
        // For battery sales, create trade-in entries using battery size as name
        tradeInsForAPI = tradeinBatteries.map((battery) => ({
          productId: `tradein-${battery.size.toLowerCase().replace(/\s+/g, '-')}-${battery.status}`, // Generate consistent ID
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
        locationId: currentBranch?.id || "default-location",
        shopId: currentBranch?.id || "default-shop",
        paymentMethod: selectedPaymentMethod.toUpperCase(),
        cashierId: selectedCashier?.id || "default-cashier",
        cart: cartForAPI,
        ...(tradeInsForAPI ? { tradeIns: tradeInsForAPI } : {}),
      });

      if (!result.success) {
        throw new Error(result.error || "Checkout processing failed");
      }

      // Store the transaction result for receipt display
      console.log("✅ Transaction completed:", result.data);

      if (result.data?.offline) {
        console.log("📱 Transaction completed offline - will sync when online");
        toast({
          title: "Transaction Completed Offline",
          description:
            "Receipt generated. Transaction will sync when connection is restored.",
          variant: "default",
          duration: 5000,
        });
      } else {
        console.log("🌐 Transaction completed online");
        if (result.data?.batteryBillHtml) {
          console.log("✅ Battery bill generated and saved to database");
        } else if (result.data?.receiptHtml) {
          console.log("✅ Thermal receipt generated and saved to database");
        }
      }

      setIsCashierSelectOpen(false);
      setShowSuccess(true);

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
      console.log("Finalizing payment with discount:", discountForReceipt);
    } catch (error) {
      console.error("Checkout error:", error);

      // Enhanced error handling based on error type
      let errorTitle = "Checkout Processing Issue";
      let errorDescription = "There was an issue processing the payment.";

      if (error instanceof Error) {
        if (error.message.includes("Database")) {
          errorTitle = "Database Connection Issue";
          errorDescription =
            "Unable to connect to database. Transaction saved offline.";
        } else if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        ) {
          errorTitle = "Network Issue";
          errorDescription =
            "Connection problem detected. Transaction saved offline.";
        } else if (error.message.includes("timeout")) {
          errorTitle = "Request Timeout";
          errorDescription =
            "Request took too long. Transaction completed offline.";
        }
      }

      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
        duration: 5000,
      });

      // Fallback: Complete the transaction locally even if API fails
      // This ensures the POS doesn't get stuck and customers can still get receipts
      console.log("⚠️ API checkout failed, completing transaction manually");

      setIsCashierSelectOpen(false);
      setShowSuccess(true);

      // Make a copy of the appliedDiscount for the receipt display
      const discountForReceipt = appliedDiscount
        ? { ...appliedDiscount }
        : null;
      console.log(
        "Manual transaction completion with discount:",
        discountForReceipt
      );

      // Show additional warning toast after a delay
      setTimeout(() => {
        toast({
          title: "Manual Transaction Completed",
          description:
            "Transaction completed offline. Please verify inventory sync later.",
          variant: "default",
          duration: 8000,
        });
      }, 1500);
    }
  };

  // Function to reset all POS state after a transaction is complete
  const resetPOSState = () => {
    // Reset cart
    setCart([]);
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
    console.log("Applying discount:", discountType, discountValue);
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
    console.log("Main component discount state:", appliedDiscount);
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
    setSelectedParts((prev) => {
      const existing = prev.find((p) => p.id === part.id);
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

    return actualProductItems.every((item) => {
      // Method 1: Check via product lookup (existing method)
      const productInfo = products.find((p) => p.id === item.id);
      const isProductBattery =
        productInfo?.category === "Parts" && productInfo?.type === "Batteries";

      // Method 2: Check via cart item's own category/type properties
      const isCartItemBattery =
        item.category === "Parts" && item.type === "Batteries";

      // Method 3: Check via item name (fallback method)
      const isNameBattery =
        item.name.toLowerCase().includes("battery") ||
        item.name.toLowerCase().includes("batteries");

      // Return true if any method identifies this as a battery
      return isProductBattery || isCartItemBattery || isNameBattery;
    });
  };

  // Helper function to check if the cart contains any battery products
  const cartContainsAnyBatteries = (cartItems: CartItem[]): boolean => {
    if (cartItems.length === 0) return false;
    return cartItems.some((item) => {
      // Method 1: Check via product lookup (existing method)
      const productInfo = products.find((p) => p.id === item.id);
      const isProductBattery =
        productInfo?.category === "Parts" && productInfo?.type === "Batteries";

      // Method 2: Check via cart item's own category/type properties
      const isCartItemBattery =
        item.category === "Parts" && item.type === "Batteries";

      // Method 3: Check via item name (fallback method)
      const isNameBattery =
        item.name.toLowerCase().includes("battery") ||
        item.name.toLowerCase().includes("batteries");

      // Return true if any method identifies this as a battery
      return isProductBattery || isCartItemBattery || isNameBattery;
    });
  };

  const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false);
  const [isWarrantyDialogOpen, setIsWarrantyDialogOpen] = useState(false);
  const [isLaborDialogOpen, setIsLaborDialogOpen] = useState(false);
  const [laborAmount, setLaborAmount] = useState<number>(0.5);

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
  const [currentCustomer, setCurrentCustomer] = useState<Omit<
    CustomerData,
    "id" | "lastVisit"
  > | null>(null);

  // Add new state for customer add success animation
  const [showCustomerSuccess, setShowCustomerSuccess] = useState(false);

  // Total quantity of items in cart (for mobile badge)
  const totalCartQuantity = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Handle customer form submission
  const handleAddCustomer = (
    customerData: Omit<CustomerData, "id" | "lastVisit">
  ) => {
    // Save customer data
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
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-lg">Loading inventory data...</p>
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
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 flex-shrink-0">
                <div className="flex items-center gap-4">
                  <CardTitle className="text-xl sm:text-2xl">
                    Products
                  </CardTitle>
                  <BranchSelector compact={true} showLabel={false} />

                  {/* Sync Status Indicator */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {isLoading ? (
                      <>
                        <div className="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full" />
                        <span className="hidden sm:inline">Syncing...</span>
                      </>
                    ) : lastSyncTime ? (
                      <>
                        <div
                          className={`h-2 w-2 rounded-full ${
                            isBackgroundSyncing
                              ? "bg-blue-500 animate-pulse"
                              : "bg-green-500"
                          }`}
                        />
                        <span className="hidden sm:inline">
                          {isBackgroundSyncing
                            ? "Syncing..."
                            : lastSyncTime.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={syncProducts}
                          disabled={isBackgroundSyncing}
                          className="h-6 px-1 ml-1 hover:bg-green-50 disabled:opacity-50"
                          title="Refresh inventory data"
                        >
                          <RefreshCw
                            className={`h-3 w-3 ${
                              isBackgroundSyncing ? "animate-spin" : ""
                            }`}
                          />
                        </Button>
                      </>
                    ) : error ? (
                      <>
                        <div className="h-2 w-2 bg-red-500 rounded-full" />
                        <span className="hidden sm:inline text-red-600">
                          Sync failed
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={syncProducts}
                          className="h-6 px-1 ml-1 hover:bg-red-50 text-red-600"
                          title="Retry sync"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <Button
                    variant="outline"
                    size="default"
                    className="dispute-button h-10 px-4 flex items-center gap-2 relative transition-all duration-200 ease-in-out active:transition-none"
                    onClick={() => setIsDisputeDialogOpen(true)}
                  >
                    <RotateCcw className="h-4 w-4" />
                    <span className="font-medium">Dispute</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="cart-button lg:hidden h-10 w-10 relative transition-all duration-200 ease-in-out active:transition-none"
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
                      className="w-full rounded-full border-2 border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 px-8 py-1 font-medium hover:border-blue-400 transition-colors shadow-sm mt-2 mb-2"
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
                          isLoading={isLoading}
                        />
                      ) : activeCategory === "Additives & Fluids" ? (
                        <AdditivesFluidsCategory
                          searchQuery={searchQuery}
                          expandedBrand={expandedBrand}
                          setExpandedBrand={setExpandedBrand}
                          addToCart={addToCart}
                          products={products}
                          isLoading={isLoading}
                        />
                      ) : (
                        // Show other category products
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                          {filteredProducts.map((product) => (
                            <ProductButton
                              key={product.id}
                              product={product}
                              addToCart={addToCart}
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
          <div className="hidden lg:block lg:w-[360px] xl:w-[400px] 2xl:w-[450px]">
            <Card className="h-[calc(100vh-4rem)] flex flex-col">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 px-4">
                <CardTitle>Cart</CardTitle>
                <Button
                  variant="destructive"
                  className="flex items-center gap-2"
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
                        variant="outline"
                        className={cn(
                          "h-9 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800",
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
                          variant="outline"
                          className="h-9 flex-1 flex items-center justify-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-800 border-orange-300"
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
                      className="w-full h-9"
                      disabled={cart.length === 0 || isCheckoutLoading}
                      onClick={handleCheckout}
                    >
                      {isCheckoutLoading ? "Processing..." : "Checkout"}
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
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-2 text-[clamp(0.875rem,2vw,1rem)]"
                      onClick={() => setShowClearCartDialog(true)}
                      disabled={cart.length === 0}
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear Cart
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 bg-blue-100/70 hover:bg-blue-200/80 text-blue-700 border border-blue-200 shadow-sm rounded-lg transition-colors"
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
                          variant="outline"
                          className={cn(
                            "h-9 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800",
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
                            variant="outline"
                            className="h-9 flex-1 flex items-center justify-center gap-2 bg-orange-100 hover:bg-orange-200 text-orange-800 border-orange-300"
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
                        className="w-full h-9"
                        disabled={cart.length === 0 || isCheckoutLoading}
                        onClick={handleCheckout}
                      >
                        {isCheckoutLoading ? "Processing..." : "Checkout"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Volume Selection Modal */}
          <Dialog open={isVolumeModalOpen} onOpenChange={setIsVolumeModalOpen}>
            <DialogContent className="w-[90%] max-w-[500px] p-4 sm:p-6 rounded-lg">
              <DialogHeader className="pb-3 sm:pb-4">
                <DialogTitle className="text-base sm:text-xl font-semibold">
                  {selectedOil?.brand} - {selectedOil?.type}
                </DialogTitle>
              </DialogHeader>

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
                        console.log(
                          `Error loading image for ${selectedOil.brand} ${selectedOil.type} in modal`
                        );
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
                      <div className="text-sm sm:text-base font-medium">
                        {volume.size}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
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
                                    handleQuantityChange(volume.size, -1)
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
                                  onClick={() =>
                                    handleQuantityChange(volume.size, 1)
                                  }
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-[60px_24px_1fr] items-center min-w-0 flex-1">
                                <span className="font-medium text-sm">
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

                                <span className="font-medium text-sm text-right w-full">
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

                <div className="flex justify-between gap-2 sm:gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="px-2 sm:px-6 text-sm sm:text-base"
                    onClick={() => {
                      setIsVolumeModalOpen(false);
                      setSelectedVolumes([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <div className="flex gap-2">
                    <Button
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
            </DialogContent>
          </Dialog>

          {/* Filter Selection Modal */}
          <FilterModal
            isOpen={isFilterBrandModalOpen}
            onOpenChange={(open) => {
              setIsFilterBrandModalOpen(open);
              if (!open) {
                setSelectedFilters([]);
                setSelectedFilterType(null);
                setFilterImageError(false);
              }
            }}
            selectedFilterBrand={selectedFilterBrand}
            selectedFilterType={selectedFilterType}
            filters={getFiltersByType(selectedFilterType || "")
              .filter((filter) => filter.brand === selectedFilterBrand)
              .map(({ id, name, price }) => ({ id, name, price }))}
            selectedFilters={selectedFilters}
            onFilterClick={({ id, name, price }) => {
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
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
                      selectedPaymentMethod === "mobile" ? "default" : "outline"
                    }
                    className={cn(
                      "h-24 flex flex-col items-center justify-center gap-2",
                      selectedPaymentMethod === "mobile" &&
                        "ring-2 ring-primary"
                    )}
                    onClick={() => {
                      setSelectedPaymentMethod("mobile");
                      setShowOtherOptions(false);
                    }}
                  >
                    <Smartphone className="w-6 h-6" />
                    <span>Mobile Pay</span>
                  </Button>
                  <Button
                    variant={
                      selectedPaymentMethod === "cash" ? "default" : "outline"
                    }
                    className={cn(
                      "h-24 flex flex-col items-center justify-center gap-2",
                      selectedPaymentMethod === "cash" && "ring-2 ring-primary"
                    )}
                    onClick={() => {
                      setSelectedPaymentMethod("cash");
                      setShowOtherOptions(false);
                    }}
                  >
                    <Banknote className="w-6 h-6" />
                    <span>Cash</span>
                  </Button>
                  <Button
                    variant={showOtherOptions ? "default" : "outline"}
                    className={cn(
                      "h-24 flex flex-col items-center justify-center gap-2",
                      (selectedPaymentMethod === "card" ||
                        selectedPaymentMethod === "voucher") &&
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
                    className="grid grid-cols-2 gap-4"
                  >
                    <Button
                      variant={
                        selectedPaymentMethod === "card" ? "default" : "outline"
                      }
                      className={cn(
                        "h-24 flex flex-col items-center justify-center gap-2",
                        selectedPaymentMethod === "card" &&
                          "ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedPaymentMethod("card")}
                    >
                      <CreditCard className="w-6 h-6" />
                      <span>Card</span>
                    </Button>
                    <Button
                      variant={
                        selectedPaymentMethod === "voucher"
                          ? "default"
                          : "outline"
                      }
                      className={cn(
                        "h-24 flex flex-col items-center justify-center gap-2",
                        selectedPaymentMethod === "voucher" &&
                          "ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedPaymentMethod("voucher")}
                    >
                      <Ticket className="w-6 h-6" />
                      <span>Voucher</span>
                    </Button>
                  </motion.div>
                )}

                <div className="border-t pt-6">
                  <div className="flex justify-between text-lg font-semibold mb-6">
                    <span>Total Amount</span>
                    <span>OMR {total.toFixed(3)}</span>
                  </div>
                  <Button
                    className="w-full h-12 text-base"
                    disabled={!selectedPaymentMethod}
                    onClick={handlePaymentComplete}
                  >
                    Complete Payment
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

      {/* Bottle Type Selection Dialog */}
      <Dialog
        open={showBottleTypeDialog}
        onOpenChange={(open) => {
          if (!open) {
            setShowBottleTypeDialog(false);
            setCurrentBottleVolumeSize(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden">
          <DialogHeader className="bg-primary text-primary-foreground px-6 py-4">
            <DialogTitle className="text-center text-xl">
              Select Bottle Type
            </DialogTitle>
          </DialogHeader>

          <div className="p-6">
            <div className="text-center mb-4">
              <div className="text-muted-foreground">
                For {currentBottleVolumeSize} volume
              </div>
              <div className="font-semibold text-lg mt-1">
                {selectedOil?.brand} {selectedOil?.type}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <Button
                variant="outline"
                className="h-40 flex flex-col items-center justify-center gap-2 px-2 hover:bg-accent rounded-xl border-2 hover:border-primary min-w-[120px] max-w-[180px]"
                onClick={() =>
                  addVolumeWithBottleType(currentBottleVolumeSize!, "closed")
                }
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <ClosedBottleIcon className="h-10 w-10 text-primary" />
                </div>
                <span
                  className="font-medium text-base text-center whitespace-normal break-words w-full"
                  style={{ lineHeight: 1 }}
                >
                  Closed Bottle
                </span>
                <span
                  className="text-xs text-muted-foreground text-center whitespace-normal break-words w-full"
                  style={{ lineHeight: 1 }}
                >
                  Factory sealed
                </span>
              </Button>

              <Button
                variant="outline"
                className="h-40 flex flex-col items-center justify-center gap-2 px-2 hover:bg-accent rounded-xl border-2 hover:border-primary min-w-[120px] max-w-[180px]"
                onClick={() =>
                  addVolumeWithBottleType(currentBottleVolumeSize!, "open")
                }
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <OpenBottleIcon className="h-10 w-10 text-primary" />
                </div>
                <span
                  className="font-medium text-base text-center whitespace-normal break-words w-full"
                  style={{ lineHeight: 1 }}
                >
                  Open Bottle
                </span>
                <span
                  className="text-xs text-muted-foreground text-center whitespace-normal break-words w-full"
                  style={{ lineHeight: 1 }}
                >
                  For immediate use
                </span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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

                {/* Payment recipient selection - only show for mobile payments */}
                {selectedPaymentMethod === "mobile" && (
                  <div className="w-full mb-4">
                    <div className="text-sm font-medium text-center mb-2">
                      Select payment recipient:
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {staffMembers
                        .filter(
                          (staff) => staff.id === "0020" || staff.id === "0010"
                        )
                        .map((staff) => (
                          <Button
                            key={staff.id}
                            variant={
                              paymentRecipient === staff.name
                                ? "default"
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

                <Button
                  className="w-full h-12 text-base"
                  onClick={handleFinalizePayment}
                  disabled={
                    selectedPaymentMethod === "mobile" && !paymentRecipient
                  }
                >
                  Confirm Payment
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
                  : "Payment Successful!"}
              </motion.p>

              <div className="w-full flex flex-col gap-2">
                <Button
                  onClick={() => {
                    setShowSuccess(false);
                    setShowReceiptDialog(true);
                  }}
                  className="w-full"
                >
                  View Receipt
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSuccess(false);
                    resetPOSState();
                  }}
                  className="w-full"
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
                    transactionData.receiptNumber ||
                    `A${Math.floor(Math.random() * 10000)
                      .toString()
                      .padStart(4, "0")}`
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
                    transactionData.receiptNumber ||
                    `A${Math.floor(Math.random() * 10000)
                      .toString()
                      .padStart(4, "0")}`
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
                />
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowReceiptDialog(false);
                }}
                className="w-full"
              >
                Close
              </Button>
            </DialogFooter>
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
                variant={discountType === "percentage" ? "default" : "outline"}
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
                variant={discountType === "amount" ? "default" : "outline"}
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
              variant="outline"
              className="flex-1"
              onClick={() => setIsDiscountDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
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
        onApply={(total) => setAppliedTradeInAmount(total)}
      />

      {/* Dispute Dialog */}
      <Dialog open={isDisputeDialogOpen} onOpenChange={setIsDisputeDialogOpen}>
        <DialogContent className="w-[90%] max-w-xs p-6 rounded-lg flex flex-col items-center gap-4">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-semibold">
              Dispute Options
            </DialogTitle>
          </DialogHeader>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => {
              setIsDisputeDialogOpen(false);
              setIsRefundDialogOpen(true);
            }}
          >
            Refund
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => {
              setIsDisputeDialogOpen(false);
              setIsWarrantyDialogOpen(true);
            }}
          >
            Warranty Claim
          </Button>
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
              className="flex-1 h-12 text-base bg-blue-500 hover:bg-blue-600"
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

      {/* Add Customer Form Dialog */}
      <POSCustomerForm
        isOpen={isCustomerFormOpen}
        onClose={() => setIsCustomerFormOpen(false)}
        onSubmit={handleAddCustomer}
        onSkip={handleSkipCustomerForm}
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
  cart: CartItem[];
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
  console.log("ReceiptComponent mounted with discount:", discount);
  console.log("Payment recipient:", paymentRecipient);

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
      console.log("Updating local discount from props:", discount);
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
    console.log("Receipt useEffect - discount value:", localDiscount);
    console.log("Receipt subtotal:", subtotal);
    if (localDiscount) {
      console.log("Receipt displaying discount:", {
        type: localDiscount.type,
        value: localDiscount.value,
        calculatedAmount:
          localDiscount.type === "percentage"
            ? subtotal * (localDiscount.value / 100)
            : Math.min(localDiscount.value, subtotal),
      });
    }
    return () => clearTimeout(timer);
  }, [cart, localDiscount]); // Removed receiptData from dependencies

  const handlePrint = useCallback(() => {
    console.log("Print triggered with discount:", localDiscount);

    const content = receiptRef.current;
    if (!content) return;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

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

    console.log("Print window calculations:", {
      subtotal,
      discountAmount,
      discount: localDiscount,
    });

    const vat = 0;
    const total = subtotal - discountAmount;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt</title>
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
                    <td class="description" colspan="4">${item.name}${
                      item.details ? ` (${item.details})` : ""
                    }</td>
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
              WhatsApp 72702537 for latest offers
            </div>
            
            <!-- Removed duplicate receipt number from footer -->
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
    if (!doc) return;
    doc.open();
    doc.write(htmlContent);
    doc.close();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {}
      }
    }, 500);
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
      case "voucher":
        return "Voucher";
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
            <p className="text-[11px] sm:text-xs text-gray-500 leading-tight">
              POS ID: {POS_ID}
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
                  {item.name}
                  {item.details ? ` (${item.details})` : ""}
                </span>
                <span className="col-span-1 text-right">
                  {item.price.toFixed(3)}
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
              WhatsApp 72702537 for latest offers
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

// Main POS Page with Context Providers
export default function POSPage() {
  return (
    <CategoryProvider initialCategory="Lubricants">
      <CartProvider>
        <POSPageContent />
      </CartProvider>
    </CategoryProvider>
  );
}
