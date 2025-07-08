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
  ExternalLink,
  ChevronRight,
  PercentIcon,
  Scissors,
  Calculator,
  Droplet,
  Package,
  Trash2,
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

// Import the RefundDialog component
import { RefundDialog, WarrantyDialog } from "./components/refund-dialog";
import { ImportDialog } from "./components/import-dialog";
import { FilterModal } from "./components/filter-modal";
import { PartsModal } from "./components/parts-modal";
import { BrandCard } from "./components/brand-card";
import { BrandLogo } from "./components/brand-logo";

// Import the BillComponent
import { BillComponent } from "./components/bill-component";
import { useIsMobile } from "@/hooks/use-mobile";
import { useStaffIDs } from "@/lib/hooks/useStaffIDs";

interface OilProduct {
  id: number;
  brand: string;
  name: string;
  basePrice: number;
  type: string;
  image?: string;
  volumes: {
    size: string;
    price: number;
  }[];
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: "Filters" | "Parts" | "Additives & Fluids";
  brand?: string;
  type?: string;
}

interface CartItem extends Omit<Product, "category"> {
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

// Updated oil products data structure
const oilProducts: OilProduct[] = [
  {
    id: 101,
    brand: "Toyota",
    name: "0W-20",
    basePrice: 39.99,
    type: "0W-20",
    image: "/oils/toyota-0w20.jpg",
    volumes: [
      { size: "5L", price: 39.99 },
      { size: "4L", price: 34.99 },
      { size: "1L", price: 11.99 },
      { size: "500ml", price: 6.99 },
      { size: "250ml", price: 3.99 },
    ],
  },
  {
    id: 102,
    brand: "Toyota",
    name: "5W-30",
    basePrice: 39.99,
    type: "5W-30",
    image: "/oils/toyota-5w30.jpg",
    volumes: [
      { size: "5L", price: 39.99 },
      { size: "4L", price: 34.99 },
      { size: "1L", price: 11.99 },
      { size: "500ml", price: 6.99 },
      { size: "250ml", price: 3.99 },
    ],
  },
  {
    id: 103,
    brand: "Toyota",
    name: "10W-30",
    basePrice: 39.99,
    type: "10W-30",
    image: "/oils/toyota-10w30.jpg",
    volumes: [
      { size: "5L", price: 39.99 },
      { size: "4L", price: 34.99 },
      { size: "1L", price: 11.99 },
      { size: "500ml", price: 6.99 },
      { size: "250ml", price: 3.99 },
    ],
  },
  {
    id: 201,
    brand: "Shell",
    name: "0W-20",
    basePrice: 45.99,
    type: "0W-20",
    image: "/oils/shell-0w20.jpg",
    volumes: [
      { size: "5L", price: 45.99 },
      { size: "4L", price: 39.99 },
      { size: "1L", price: 13.99 },
      { size: "500ml", price: 7.99 },
      { size: "250ml", price: 4.99 },
    ],
  },
  {
    id: 202,
    brand: "Shell",
    name: "5W-30",
    basePrice: 45.99,
    type: "5W-30",
    image: "/oils/shell-5w30.jpg",
    volumes: [
      { size: "5L", price: 45.99 },
      { size: "4L", price: 39.99 },
      { size: "1L", price: 13.99 },
      { size: "500ml", price: 7.99 },
      { size: "250ml", price: 4.99 },
    ],
  },
  {
    id: 203,
    brand: "Shell",
    name: "10W-40",
    basePrice: 35.99,
    type: "10W-40",
    image: "/oils/shell-10w40.jpg",
    volumes: [
      { size: "5L", price: 35.99 },
      { size: "4L", price: 31.99 },
      { size: "1L", price: 11.99 },
      { size: "500ml", price: 6.99 },
      { size: "250ml", price: 3.99 },
    ],
  },
  {
    id: 301,
    brand: "Lexus",
    name: "0W-20",
    basePrice: 49.99,
    type: "0W-20",
    image: "/oils/lexus-0w20.jpg",
    volumes: [
      { size: "5L", price: 49.99 },
      { size: "4L", price: 43.99 },
      { size: "1L", price: 14.99 },
      { size: "500ml", price: 8.99 },
      { size: "250ml", price: 5.99 },
    ],
  },
  {
    id: 302,
    brand: "Lexus",
    name: "5W-30",
    basePrice: 49.99,
    type: "5W-30",
    image: "/oils/lexus-5w30.jpg",
    volumes: [
      { size: "5L", price: 49.99 },
      { size: "4L", price: 43.99 },
      { size: "1L", price: 14.99 },
      { size: "500ml", price: 8.99 },
      { size: "250ml", price: 5.99 },
    ],
  },
];

const products: Product[] = [
  // Toyota Filters
  {
    id: 3,
    name: "Oil Filter - Standard",
    price: 12.99,
    category: "Filters",
    brand: "Toyota",
    type: "Oil Filter",
  },
  {
    id: 4,
    name: "Air Filter - Standard",
    price: 15.99,
    category: "Filters",
    brand: "Toyota",
    type: "Air Filter",
  },
  {
    id: 5,
    name: "Air Filter - Medium",
    price: 17.99,
    category: "Filters",
    brand: "Toyota",
    type: "Air Filter",
  },
  {
    id: 6,
    name: "Cabin Filter - Standard",
    price: 11.99,
    category: "Filters",
    brand: "Toyota",
    type: "Cabin Filter",
  },
  {
    id: 7,
    name: "Cabin Filter - Deluxe",
    price: 25.99,
    category: "Filters",
    brand: "Toyota",
    type: "Cabin Filter",
  },
  {
    id: 8,
    name: "Oil Filter - Premium",
    price: 19.99,
    category: "Filters",
    brand: "Toyota",
    type: "Oil Filter",
  },
  {
    id: 9,
    name: "Oil Filter - Economy",
    price: 9.99,
    category: "Filters",
    brand: "Toyota",
    type: "Oil Filter",
  },
  // Honda Filters
  {
    id: 31,
    name: "Oil Filter - Basic",
    price: 11.99,
    category: "Filters",
    brand: "Honda",
    type: "Oil Filter",
  },
  {
    id: 32,
    name: "Air Filter - Basic",
    price: 14.99,
    category: "Filters",
    brand: "Honda",
    type: "Air Filter",
  },
  {
    id: 33,
    name: "Air Filter - Medium",
    price: 16.99,
    category: "Filters",
    brand: "Honda",
    type: "Air Filter",
  },
  {
    id: 34,
    name: "Cabin Filter - Basic",
    price: 12.99,
    category: "Filters",
    brand: "Honda",
    type: "Cabin Filter",
  },
  {
    id: 35,
    name: "Cabin Filter - Deluxe",
    price: 23.99,
    category: "Filters",
    brand: "Honda",
    type: "Cabin Filter",
  },
  {
    id: 36,
    name: "Oil Filter - Premium",
    price: 18.99,
    category: "Filters",
    brand: "Honda",
    type: "Oil Filter",
  },
  {
    id: 37,
    name: "Oil Filter - Economy",
    price: 8.99,
    category: "Filters",
    brand: "Honda",
    type: "Oil Filter",
  },
  // Nissan Filters
  {
    id: 41,
    name: "Oil Filter - Standard",
    price: 13.99,
    category: "Filters",
    brand: "Nissan",
    type: "Oil Filter",
  },
  {
    id: 42,
    name: "Air Filter - Standard",
    price: 16.99,
    category: "Filters",
    brand: "Nissan",
    type: "Air Filter",
  },
  {
    id: 43,
    name: "Air Filter - Medium",
    price: 18.99,
    category: "Filters",
    brand: "Nissan",
    type: "Air Filter",
  },
  {
    id: 44,
    name: "Cabin Filter - Standard",
    price: 13.99,
    category: "Filters",
    brand: "Nissan",
    type: "Cabin Filter",
  },
  {
    id: 45,
    name: "Cabin Filter - Deluxe",
    price: 26.99,
    category: "Filters",
    brand: "Nissan",
    type: "Cabin Filter",
  },
  {
    id: 46,
    name: "Oil Filter - Premium",
    price: 20.99,
    category: "Filters",
    brand: "Nissan",
    type: "Oil Filter",
  },
  {
    id: 47,
    name: "Oil Filter - Economy",
    price: 10.99,
    category: "Filters",
    brand: "Nissan",
    type: "Oil Filter",
  },
  // Other Products
  {
    id: 5,
    name: "Brake Pads",
    price: 45.99,
    category: "Parts",
    brand: "Generic",
    type: "Miscellaneous Parts",
  },
  {
    id: 6,
    name: "Spark Plugs",
    price: 8.99,
    category: "Parts",
    brand: "Generic",
    type: "Miscellaneous Parts",
  },

  // Additives with brand information
  {
    id: 7,
    name: "Fuel System Cleaner",
    price: 14.99,
    category: "Additives & Fluids",
    brand: "Shell",
  },
  {
    id: 8,
    name: "Oil Treatment",
    price: 11.99,
    category: "Additives & Fluids",
    brand: "Shell",
  },
  {
    id: 9001,
    name: "Diesel Additive",
    price: 16.99,
    category: "Additives & Fluids",
    brand: "Shell",
  },
  {
    id: 9002,
    name: "Engine Flush",
    price: 19.99,
    category: "Additives & Fluids",
    brand: "Toyota",
  },
  {
    id: 9003,
    name: "Radiator Coolant",
    price: 12.99,
    category: "Additives & Fluids",
    brand: "Toyota",
  },
  {
    id: 9004,
    name: "Fuel Injector Cleaner",
    price: 15.99,
    category: "Additives & Fluids",
    brand: "Toyota",
  },
  {
    id: 9005,
    name: "Octane Booster",
    price: 9.99,
    category: "Additives & Fluids",
    brand: "Lexus",
  },
  {
    id: 9006,
    name: "Transmission Fluid",
    price: 22.99,
    category: "Additives & Fluids",
    brand: "Lexus",
  },
  {
    id: 9007,
    name: "Power Steering Fluid",
    price: 13.99,
    category: "Additives & Fluids",
    brand: "Lexus",
  },
  {
    id: 9008,
    name: "Brake Fluid",
    price: 8.99,
    category: "Additives & Fluids",
    brand: "Castrol",
  },
  {
    id: 9009,
    name: "Engine Stop Leak",
    price: 17.99,
    category: "Additives & Fluids",
    brand: "Castrol",
  },
  {
    id: 9010,
    name: "Oil Stabilizer",
    price: 14.99,
    category: "Additives & Fluids",
    brand: "Castrol",
  },

  // Parts with brands and types
  {
    id: 1001,
    name: "Brake Pads - Front",
    price: 45.99,
    category: "Parts",
    brand: "Toyota",
    type: "Brake Parts",
  },
  {
    id: 1002,
    name: "Brake Pads - Rear",
    price: 39.99,
    category: "Parts",
    brand: "Toyota",
    type: "Brake Parts",
  },
  {
    id: 1003,
    name: "Brake Rotor - Front",
    price: 79.99,
    category: "Parts",
    brand: "Toyota",
    type: "Brake Parts",
  },
  {
    id: 1004,
    name: "Brake Rotor - Rear",
    price: 69.99,
    category: "Parts",
    brand: "Toyota",
    type: "Brake Parts",
  },
  {
    id: 1005,
    name: "Spark Plugs - Standard",
    price: 8.99,
    category: "Parts",
    brand: "Toyota",
    type: "Engine Parts",
  },
  {
    id: 1006,
    name: "Spark Plugs - Iridium",
    price: 18.99,
    category: "Parts",
    brand: "Toyota",
    type: "Engine Parts",
  },
  {
    id: 1007,
    name: "Ignition Coil",
    price: 45.99,
    category: "Parts",
    brand: "Toyota",
    type: "Engine Parts",
  },
  {
    id: 1008,
    name: "Water Pump",
    price: 89.99,
    category: "Parts",
    brand: "Toyota",
    type: "Cooling System",
  },
  {
    id: 1009,
    name: "Thermostat",
    price: 22.99,
    category: "Parts",
    brand: "Toyota",
    type: "Cooling System",
  },
  {
    id: 1010,
    name: "Radiator",
    price: 159.99,
    category: "Parts",
    brand: "Toyota",
    type: "Cooling System",
  },

  // Lexus Parts
  {
    id: 1011,
    name: "Brake Pads - Front",
    price: 65.99,
    category: "Parts",
    brand: "Lexus",
    type: "Brake Parts",
  },
  {
    id: 1012,
    name: "Brake Pads - Rear",
    price: 59.99,
    category: "Parts",
    brand: "Lexus",
    type: "Brake Parts",
  },
  {
    id: 1013,
    name: "Brake Rotor - Front",
    price: 99.99,
    category: "Parts",
    brand: "Lexus",
    type: "Brake Parts",
  },
  {
    id: 1014,
    name: "Brake Rotor - Rear",
    price: 89.99,
    category: "Parts",
    brand: "Lexus",
    type: "Brake Parts",
  },
  {
    id: 1015,
    name: "Spark Plugs - Iridium",
    price: 22.99,
    category: "Parts",
    brand: "Lexus",
    type: "Engine Parts",
  },
  {
    id: 1016,
    name: "Ignition Coil",
    price: 55.99,
    category: "Parts",
    brand: "Lexus",
    type: "Engine Parts",
  },

  // Honda Parts
  {
    id: 1017,
    name: "Brake Pads - Front",
    price: 42.99,
    category: "Parts",
    brand: "Honda",
    type: "Brake Parts",
  },
  {
    id: 1018,
    name: "Brake Pads - Rear",
    price: 38.99,
    category: "Parts",
    brand: "Honda",
    type: "Brake Parts",
  },
  {
    id: 1019,
    name: "Brake Rotor - Front",
    price: 69.99,
    category: "Parts",
    brand: "Honda",
    type: "Brake Parts",
  },
  {
    id: 1020,
    name: "Alternator",
    price: 129.99,
    category: "Parts",
    brand: "Honda",
    type: "Electrical",
  },
  {
    id: 1021,
    name: "Starter Motor",
    price: 139.99,
    category: "Parts",
    brand: "Honda",
    type: "Electrical",
  },

  // Nissan Parts
  {
    id: 1022,
    name: "Brake Pads - Front",
    price: 39.99,
    category: "Parts",
    brand: "Nissan",
    type: "Brake Parts",
  },
  {
    id: 1023,
    name: "Brake Pads - Rear",
    price: 36.99,
    category: "Parts",
    brand: "Nissan",
    type: "Brake Parts",
  },
  {
    id: 1024,
    name: "Oxygen Sensor",
    price: 49.99,
    category: "Parts",
    brand: "Nissan",
    type: "Sensors",
  },
  {
    id: 1025,
    name: "Mass Air Flow Sensor",
    price: 89.99,
    category: "Parts",
    brand: "Nissan",
    type: "Sensors",
  },
  {
    id: 1026,
    name: "Camshaft Position Sensor",
    price: 45.99,
    category: "Parts",
    brand: "Nissan",
    type: "Sensors",
  },
  // Add Battery products
  {
    id: 1027,
    name: "Standard Battery",
    price: 89.99,
    category: "Parts",
    brand: "Toyota",
    type: "Batteries",
  },
  {
    id: 1028,
    name: "Premium Battery",
    price: 129.99,
    category: "Parts",
    brand: "Toyota",
    type: "Batteries",
  },
  {
    id: 1029,
    name: "Economy Battery",
    price: 69.99,
    category: "Parts",
    brand: "Honda",
    type: "Batteries",
  },
  {
    id: 1030,
    name: "Heavy Duty Battery",
    price: 149.99,
    category: "Parts",
    brand: "Lexus",
    type: "Batteries",
  },
  {
    id: 1031,
    name: "Standard Battery",
    price: 84.99,
    category: "Parts",
    brand: "Nissan",
    type: "Batteries",
  },
  // Add Spark Plugs as a separate category
  {
    id: 1032,
    name: "Standard Spark Plugs",
    price: 7.99,
    category: "Parts",
    brand: "Toyota",
    type: "Spark Plugs",
  },
  {
    id: 1033,
    name: "Iridium Spark Plugs",
    price: 19.99,
    category: "Parts",
    brand: "Toyota",
    type: "Spark Plugs",
  },
  {
    id: 1034,
    name: "Platinum Spark Plugs",
    price: 14.99,
    category: "Parts",
    brand: "Honda",
    type: "Spark Plugs",
  },
  {
    id: 1035,
    name: "Premium Spark Plugs",
    price: 22.99,
    category: "Parts",
    brand: "Lexus",
    type: "Spark Plugs",
  },
  {
    id: 1036,
    name: "Performance Spark Plugs",
    price: 24.99,
    category: "Parts",
    brand: "Nissan",
    type: "Spark Plugs",
  },
];

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
          OMR {item.price.toFixed(2)} each
        </div>
        <div className="font-medium text-[clamp(0.875rem,2vw,1rem)] mt-1">
          OMR {(item.price * item.quantity).toFixed(2)}
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
          OMR {product.price.toFixed(2)}
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

export default function POSPage() {
  console.log("--- VERCEL DEBUG START ---");
  console.log("oilProducts length:", oilProducts.length);
  console.log(
    "First oil product:",
    oilProducts[0]
      ? oilProducts[0].brand
      : "oilProducts is empty or first item undefined"
  );
  console.log("products length:", products.length);
  console.log(
    "First product:",
    products[0] ? products[0].name : "products is empty or first item undefined"
  );
  console.log("--- VERCEL DEBUG END ---");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("Oil");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showClearCartDialog, setShowClearCartDialog] = useState(false);
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const [selectedOil, setSelectedOil] = useState<OilProduct | null>(null);
  const [isVolumeModalOpen, setIsVolumeModalOpen] = useState(false);
  const [selectedVolumes, setSelectedVolumes] = useState<SelectedVolume[]>([]);
  const [selectedFilterBrand, setSelectedFilterBrand] = useState<string | null>(
    null
  );
  const [selectedFilterType, setSelectedFilterType] = useState<string | null>(
    null
  );
  const [isFilterBrandModalOpen, setIsFilterBrandModalOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<
    Array<{ id: number; name: string; price: number; quantity: number }>
  >([]);
  const [filterImageError, setFilterImageError] = useState(false);
  const [oilImageError, setOilImageError] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "card" | "cash" | "mobile" | "voucher" | null
  >(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showOtherOptions, setShowOtherOptions] = useState(false);
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Add discount state
  const [isDiscountDialogOpen, setIsDiscountDialogOpen] = useState(false);
  const [discountType, setDiscountType] = useState<"percentage" | "amount">(
    "amount"
  );
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [appliedDiscount, setAppliedDiscount] = useState<{
    type: "percentage" | "amount";
    value: number;
  } | null>(null);

  // State for Trade-In
  const [isTradeInDialogOpen, setIsTradeInDialogOpen] = useState(false);
  const [tradeInAmount, setTradeInAmount] = useState<number>(0);
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

  // New state for cashiers with proper type
  const [isCashierSelectOpen, setIsCashierSelectOpen] = useState(false);
  const [enteredCashierId, setEnteredCashierId] = useState<string>("");
  const [fetchedCashier, setFetchedCashier] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [cashierIdError, setCashierIdError] = useState<string | null>(null);
  const [selectedCashier, setSelectedCashier] = useState<string | null>(null);

  // Add new state variables for parts
  const [isPartBrandModalOpen, setIsPartBrandModalOpen] = useState(false);
  const [selectedPartBrand, setSelectedPartBrand] = useState<string | null>(
    null
  );
  const [selectedPartType, setSelectedPartType] = useState<string | null>(null);
  const [selectedParts, setSelectedParts] = useState<
    Array<{ id: number; name: string; price: number; quantity: number }>
  >([]);

  // Add state for payment recipient
  const [paymentRecipient, setPaymentRecipient] = useState<string | null>(null);

  // Get cashier data from the hook
  const { staffMembers } = useStaffIDs();
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
      quantity: number = 1
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

        // Find the original product to get the brand if it exists
        const originalProduct =
          products.find((p) => p.id === product.id) ||
          oilProducts.find((p) => p.id === product.id);

        const brand =
          originalProduct && "brand" in originalProduct
            ? originalProduct.brand
            : undefined;
        const fullName = brand ? `${brand} ${product.name}` : product.name;

        return [
          ...prevCart,
          {
            ...product,
            name: fullName,
            quantity,
            details,
            uniqueId,
          },
        ];
      });
    },
    []
  );

  const handleOilSelect = useCallback((oil: OilProduct) => {
    setSelectedOil(oil);
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
        addToCart(
          {
            id: selectedOil.id,
            name: selectedOil.name,
            price: volume.price,
          },
          details,
          volume.quantity
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

  const oilBrands = Array.from(new Set(oilProducts.map((oil) => oil.brand)));

  const filterBrands = Array.from(
    new Set(
      products.filter((p) => p.category === "Filters").map((p) => p.brand!)
    )
  );

  const filterTypes = Array.from(
    new Set(
      products.filter((p) => p.category === "Filters").map((p) => p.type!)
    )
  );

  const getFiltersByType = (type: string) =>
    products.filter(
      (product) => product.category === "Filters" && product.type === type
    );

  // Memoize filtered data
  const filteredOilBrands = useMemo(
    () =>
      oilBrands.filter((brand) =>
        brand.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [searchQuery, oilBrands]
  );

  const filteredProducts = useMemo(
    () =>
      activeCategory === "Oil"
        ? []
        : products.filter((product) => {
            const matchesCategory = product.category === activeCategory;
            const matchesSearch = product.name
              .toLowerCase()
              .includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
          }),
    [activeCategory, searchQuery]
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
    setShowClearCartDialog(false);
  };

  const handleCheckout = () => {
    // Reset the cashierId field whenever checkout is started
    setEnteredCashierId("");
    setFetchedCashier(null);
    setCashierIdError(null);
    setIsCheckoutModalOpen(true);

    // Generate transaction data before showing payment method selection
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
  // Add this new function to handle final payment completion
  const handleFinalizePayment = () => {
    // Make a copy of the appliedDiscount before resetting state
    const discountForReceipt = appliedDiscount ? { ...appliedDiscount } : null;

    // Create payment info object to include recipient for mobile payments
    const paymentInfo = {
      method: selectedPaymentMethod,
      ...(selectedPaymentMethod === "mobile" && paymentRecipient
        ? { recipient: paymentRecipient }
        : {}),
    };

    setIsCashierSelectOpen(false);
    // Pass the receipt with the copied discount
    setShowSuccess(true);

    // We'll reset other states but keep the discount for the receipt
    console.log("Finalizing payment with discount:", discountForReceipt);
    console.log("Payment info:", paymentInfo);
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
    setTradeInAmount(0);

    // Reset cashier info - this is the important part for fixing the ID persistence issue
    setSelectedCashier(null);
    setEnteredCashierId("");
    setFetchedCashier(null);
    setCashierIdError(null);
    setPaymentRecipient(null);
  };

  // Replace the handleImportCustomers function definition with this one
  const handleImportCustomers = (importedCustomers: ImportedCustomer[]) => {
    // In a real implementation, this would add the imported customers to the database
    console.log("Imported customers:", importedCustomers);
    setIsImportDialogOpen(false);
  };

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

  // Get part brands and types - ensure we don't include undefined values
  const partBrands = Array.from(
    new Set(
      products
        .filter((p) => p.category === "Parts" && p.brand) // Only include products with brand
        .map((p) => p.brand!)
    )
  );

  const partTypes = Array.from(
    new Set(
      products
        .filter(
          (p) =>
            p.category === "Parts" &&
            p.type &&
            ["Miscellaneous Parts", "Spark Plugs", "Batteries"].includes(p.type)
        )
        .map((p) => p.type!)
    )
  );

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
      // Assuming item.id in the cart corresponds to the original product ID in the `products` array.
      // This ID is used to look up the definitive product characteristics.
      const productInfo = products.find((p) => p.id === item.id);
      return (
        productInfo?.category === "Parts" && productInfo?.type === "Batteries"
      );
    });
  };

  // Helper function to check if the cart contains any battery products
  const cartContainsAnyBatteries = (cartItems: CartItem[]): boolean => {
    if (cartItems.length === 0) return false;
    return cartItems.some((item) => {
      const productInfo = products.find((p) => p.id === item.id);
      return (
        productInfo?.category === "Parts" && productInfo?.type === "Batteries"
      );
    });
  };

  const [isDisputeDialogOpen, setIsDisputeDialogOpen] = useState(false);
  const [isWarrantyDialogOpen, setIsWarrantyDialogOpen] = useState(false);

  const isMobile = useIsMobile();

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
                <CardTitle className="text-xl sm:text-2xl">Products</CardTitle>
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
                    {cart.length > 0 && (
                      <Badge
                        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0"
                        variant="destructive"
                      >
                        {cart.length}
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
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1 gap-1">
                      <TabsTrigger value="Oil">Oil</TabsTrigger>
                      <TabsTrigger value="Filters">Filters</TabsTrigger>
                      <TabsTrigger value="Parts">Parts</TabsTrigger>
                      <TabsTrigger value="Additives & Fluids">
                        Additives & Fluids
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  <ScrollArea className="flex-1 mt-4 -mx-2 px-2">
                    <div className="grid grid-cols-1 gap-4">
                      {activeCategory === "Oil" ? (
                        // Show oil brands with dropdown
                        filteredOilBrands.map((brand) => (
                          <div
                            key={brand}
                            className="border rounded-lg overflow-hidden"
                          >
                            <Button
                              variant="ghost"
                              className="w-full p-4 flex items-center justify-between hover:bg-accent"
                              onClick={() =>
                                setExpandedBrand(
                                  expandedBrand === brand ? null : brand
                                )
                              }
                            >
                              <span className="font-semibold text-lg">
                                {brand}
                              </span>
                              {expandedBrand === brand ? (
                                <ChevronUp className="h-5 w-5" />
                              ) : (
                                <ChevronDown className="h-5 w-5" />
                              )}
                            </Button>
                            {expandedBrand === brand && (
                              <div className="p-4 bg-muted/50 grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {oilProducts
                                  .filter((oil) => oil.brand === brand)
                                  .map((oil) => (
                                    <Button
                                      key={oil.id}
                                      variant="outline"
                                      className="flex flex-col items-center justify-between p-3 sm:p-4 h-[160px] sm:h-[180px] md:h-[200px] overflow-hidden"
                                      onClick={() => handleOilSelect(oil)}
                                    >
                                      <div className="relative w-16 h-16 sm:w-24 sm:h-24 mt-1 mb-1">
                                        {oil.image && !oilImageError ? (
                                          <Image
                                            src={oil.image}
                                            alt={`${oil.brand} ${oil.type}`}
                                            className="object-contain"
                                            fill
                                            sizes="(max-width: 768px) 64px, 96px"
                                            onError={() =>
                                              setOilImageError(true)
                                            }
                                          />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center bg-muted rounded-md">
                                            <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="text-center flex-1 flex flex-col justify-between">
                                        <span
                                          className="text-center font-medium text-xs sm:text-sm w-full px-1 word-wrap whitespace-normal leading-tight hyphens-auto"
                                          style={{ lineHeight: 1.1 }}
                                        >
                                          {oil.type}
                                        </span>
                                        <span className="block text-sm text-primary mt-2">
                                          OMR {oil.basePrice.toFixed(2)}
                                        </span>
                                      </div>
                                    </Button>
                                  ))}
                              </div>
                            )}
                          </div>
                        ))
                      ) : activeCategory === "Filters" ? (
                        // Show filter types with dropdown
                        <div className="grid grid-cols-1 gap-4">
                          {filterTypes
                            .filter((type) =>
                              type
                                .toLowerCase()
                                .includes(searchQuery.toLowerCase())
                            )
                            .map((type) => (
                              <div
                                key={type}
                                className="border rounded-lg overflow-hidden"
                              >
                                <Button
                                  variant="ghost"
                                  className="w-full p-4 flex items-center justify-between hover:bg-accent"
                                  onClick={() =>
                                    setSelectedFilterType(
                                      selectedFilterType === type ? null : type
                                    )
                                  }
                                >
                                  <span className="font-semibold text-lg">
                                    {type}
                                  </span>
                                  {selectedFilterType === type ? (
                                    <ChevronUp className="h-5 w-5" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5" />
                                  )}
                                </Button>
                                {selectedFilterType === type && (
                                  <div
                                    className="p-4 bg-muted/50 grid gap-4"
                                    style={{
                                      gridTemplateColumns:
                                        "repeat(auto-fit, minmax(120px, 1fr))",
                                    }}
                                  >
                                    {filterBrands.map((brand) => (
                                      <BrandCard
                                        key={brand}
                                        brand={brand}
                                        onClick={() => {
                                          setSelectedFilterBrand(brand);
                                          setSelectedFilters([]);
                                          setIsFilterBrandModalOpen(true);
                                        }}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      ) : activeCategory === "Parts" ? (
                        // Show part types with dropdown (similar to Filters)
                        <div className="grid grid-cols-1 gap-4">
                          {partTypes
                            .filter((type) =>
                              type
                                .toLowerCase()
                                .includes(searchQuery.toLowerCase())
                            )
                            .map((type) => (
                              <div
                                key={type}
                                className="border rounded-lg overflow-hidden"
                              >
                                <Button
                                  variant="ghost"
                                  className="w-full p-4 flex items-center justify-between hover:bg-accent"
                                  onClick={() =>
                                    setSelectedPartType(
                                      selectedPartType === type ? null : type
                                    )
                                  }
                                >
                                  <span className="font-semibold text-lg">
                                    {type}
                                  </span>
                                  {selectedPartType === type ? (
                                    <ChevronUp className="h-5 w-5" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5" />
                                  )}
                                </Button>
                                {selectedPartType === type && (
                                  <div
                                    className="p-4 bg-muted/50 grid gap-4"
                                    style={{
                                      gridTemplateColumns:
                                        "repeat(auto-fit, minmax(120px, 1fr))",
                                    }}
                                  >
                                    {partBrands.map((brand) => (
                                      <BrandCard
                                        key={brand}
                                        brand={brand}
                                        onClick={() => {
                                          setSelectedPartBrand(brand);
                                          setSelectedParts([]);
                                          setIsPartBrandModalOpen(true);
                                        }}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      ) : activeCategory === "Additives & Fluids" ? (
                        // Show additives brands with dropdown (similar to Oil)
                        Array.from(
                          new Set(
                            products
                              .filter(
                                (p) => p.category === "Additives & Fluids"
                              )
                              .map((p) => p.brand || "Other") // Use "Other" for undefined brands
                          )
                        )
                          .filter((brand) =>
                            brand
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase())
                          )
                          .map((brand) => (
                            <div
                              key={brand}
                              className="border rounded-lg overflow-hidden"
                            >
                              <Button
                                variant="ghost"
                                className="w-full p-4 flex items-center justify-between hover:bg-accent"
                                onClick={() =>
                                  setExpandedBrand(
                                    expandedBrand === brand ? null : brand
                                  )
                                }
                              >
                                <span className="font-semibold text-lg">
                                  {brand}
                                </span>
                                {expandedBrand === brand ? (
                                  <ChevronUp className="h-5 w-5" />
                                ) : (
                                  <ChevronDown className="h-5 w-5" />
                                )}
                              </Button>
                              {expandedBrand === brand && (
                                <div className="p-4 bg-muted/50 grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-4">
                                  {products
                                    .filter(
                                      (p) =>
                                        p.category === "Additives & Fluids" &&
                                        (p.brand || "Other") === brand // Handle null/undefined brands
                                    )
                                    .map((product) => (
                                      <Button
                                        key={product.id}
                                        variant="outline"
                                        className="flex flex-col items-center justify-between p-4 h-auto min-h-[150px] transition-all hover:shadow-md overflow-hidden"
                                        onClick={() => {
                                          const brandedName = product.brand
                                            ? `${product.brand} ${product.name}`
                                            : product.name;
                                          addToCart({
                                            id: product.id,
                                            name: brandedName,
                                            price: product.price,
                                          });
                                        }}
                                      >
                                        {/* Product icon with fixed dimensions */}
                                        <div className="w-12 h-12 mb-3 flex-shrink-0 flex items-center justify-center rounded-md bg-muted/80">
                                          <Droplet className="h-6 w-6 text-primary/70" />
                                        </div>

                                        {/* Product information with proper text handling */}
                                        <div className="w-full flex flex-col items-center space-y-2">
                                          {/* Product name with line clamping */}
                                          <div className="text-center w-full">
                                            <p className="text-sm font-medium line-clamp-2 leading-tight">
                                              {product.name}
                                            </p>
                                          </div>

                                          {/* Price with consistent formatting */}
                                          <div className="mt-auto">
                                            <span className="text-sm text-primary font-medium">
                                              OMR {product.price.toFixed(2)}
                                            </span>
                                          </div>
                                        </div>
                                      </Button>
                                    ))}
                                </div>
                              )}
                            </div>
                          ))
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
                  </div>
                </ScrollArea>
                <div className="pt-3 mt-auto border-t">
                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between text-[clamp(1rem,2.5vw,1.125rem)] font-semibold">
                      <span>Subtotal</span>
                      <span>OMR {subtotal.toFixed(2)}</span>
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
                        <span>- OMR {discountAmount.toFixed(2)}</span>
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
                      <span>OMR {total.toFixed(2)}</span>
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
                            setTradeInAmount(
                              appliedTradeInAmount > 0
                                ? appliedTradeInAmount
                                : 0
                            ); // Pre-fill with current applied amount or 0
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
                      disabled={cart.length === 0}
                      onClick={handleCheckout}
                    >
                      Checkout
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
                    </div>
                  </ScrollArea>
                  <div className="mt-2 space-y-2 border-t pt-3 sticky bottom-0 bg-background w-full">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[clamp(1rem,2.5vw,1.125rem)] font-semibold">
                        <span>Subtotal</span>
                        <span>OMR {subtotal.toFixed(2)}</span>
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
                          <span>- OMR {discountAmount.toFixed(2)}</span>
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
                        <span>OMR {total.toFixed(2)}</span>
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
                              setTradeInAmount(
                                appliedTradeInAmount > 0
                                  ? appliedTradeInAmount
                                  : 0
                              );
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
                        disabled={cart.length === 0}
                        onClick={handleCheckout}
                      >
                        Checkout
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
                  {!oilImageError && selectedOil?.image ? (
                    <Image
                      src={selectedOil.image}
                      alt={`${selectedOil.brand} ${selectedOil.type}`}
                      className="object-contain p-2"
                      fill
                      sizes="(max-width: 768px) 120px, 160px"
                      onError={() => setOilImageError(true)}
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
                        OMR {volume.price.toFixed(2)}
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
                                  {(volume.price * volume.quantity).toFixed(2)}
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
                      selectedPaymentMethod === "card" ? "default" : "outline"
                    }
                    className={cn(
                      "h-24 flex flex-col items-center justify-center gap-2",
                      selectedPaymentMethod === "card" && "ring-2 ring-primary"
                    )}
                    onClick={() => {
                      setSelectedPaymentMethod("card");
                      setShowOtherOptions(false);
                    }}
                  >
                    <CreditCard className="w-6 h-6" />
                    <span>Card</span>
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
                      (selectedPaymentMethod === "mobile" ||
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
                        selectedPaymentMethod === "mobile"
                          ? "default"
                          : "outline"
                      }
                      className={cn(
                        "h-24 flex flex-col items-center justify-center gap-2",
                        selectedPaymentMethod === "mobile" &&
                          "ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedPaymentMethod("mobile")}
                    >
                      <Smartphone className="w-6 h-6" />
                      <span>Mobile Pay</span>
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
                    <span>OMR {total.toFixed(2)}</span>
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
          onImport={handleImportCustomers}
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
                      setSelectedCashier(found.name);
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
            if (!open) {
              console.log(
                "Closing success dialog, current discount:",
                appliedDiscount
              );
              setShowSuccess(false);
              // Use our resetPOSState function to completely reset all state
              resetPOSState();
            }
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
              className="flex flex-col items-center justify-center py-2"
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

              {/* Receipt/Bill will appear after 1 second (handled internally by components) */}
              <div className="w-full">
                {cartContainsOnlyBatteries(cart) ? (
                  <BillComponent
                    key={`bill-${transactionData.receiptNumber}`}
                    cart={cart}
                    billNumber={transactionData.receiptNumber}
                    currentDate={transactionData.currentDate}
                    currentTime={transactionData.currentTime}
                    cashier={selectedCashier ?? undefined}
                    appliedDiscount={appliedDiscount} // Pass general discount
                    appliedTradeInAmount={appliedTradeInAmount} // Pass trade-in amount
                    // customerName prop can be added if customer selection is implemented
                  />
                ) : (
                  <ReceiptComponent
                    key={`receipt-${transactionData.receiptNumber}`}
                    cart={cart}
                    paymentMethod={selectedPaymentMethod || "cash"}
                    cashier={selectedCashier ?? undefined}
                    discount={appliedDiscount}
                    paymentRecipient={
                      selectedPaymentMethod === "mobile"
                        ? paymentRecipient
                        : undefined
                    }
                    // Pass transaction data to ReceiptComponent
                    receiptNumber={transactionData.receiptNumber}
                    currentDate={transactionData.currentDate}
                    currentTime={transactionData.currentTime}
                  />
                )}

                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("Close button clicked, resetting state");
                    setShowSuccess(false);
                    resetPOSState();
                  }}
                  className="w-full mt-4"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </DialogContentWithoutClose>
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
                    ).toFixed(2)} OMR`
                  : `This will reduce the total by ${Math.min(
                      discountValue,
                      subtotal
                    ).toFixed(2)} OMR`}
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

      {/* Trade-In Dialog */}
      <Dialog open={isTradeInDialogOpen} onOpenChange={setIsTradeInDialogOpen}>
        <DialogContent className="w-[90%] max-w-[400px] p-6 rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Enter Trade-In Amount
            </DialogTitle>
            <DialogDescription className="text-center">
              Enter the value of the trade-in in OMR.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label htmlFor="trade-in-amount">Trade-In Amount (OMR)</Label>
              <Input
                id="trade-in-amount"
                type="number"
                placeholder="e.g. 5.000"
                min="0"
                step="0.001" // Allow for 3 decimal places as in example bill
                value={tradeInAmount === 0 ? "" : tradeInAmount}
                onChange={(e) =>
                  setTradeInAmount(parseFloat(e.target.value) || 0)
                }
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsTradeInDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setAppliedTradeInAmount(tradeInAmount);
                setIsTradeInDialogOpen(false);
              }}
              disabled={tradeInAmount <= 0}
            >
              Apply Trade-In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print receipt");
      return;
    }

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

    // No VAT in this example (0%)
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
              font-family: 'Courier New', monospace;
              padding: 0;
              margin: 0;
              width: 80mm;
              font-size: 12px;
            }
            .receipt-container {
              padding: 5mm;
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
              padding: 2px 0;
              word-wrap: break-word;
              word-break: break-word;
            }
            .receipt-table .qty {
              width: 30px;
            }
            .receipt-table .description {
              width: auto;
              max-width: 180px;
            }
            .receipt-table .price {
              width: 60px;
              text-align: right;
            }
            .receipt-table .amount {
              width: 70px;
              text-align: right;
            }
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
              @page {
                margin: 0;
                size: 80mm auto;
              }
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
              <h2>H Automotives</h2>
              <p>Saham, Sultanate of Oman</p>
              <p>Ph: 92510750 | 26856848</p>
              <p>VATIN: OM1100006980</p>
            </div>
            
            <div class="receipt-info">
              <p>INVOICE</p>
              <p>Date: ${currentDate}</p>
              <p>Time: ${currentTime}    POS ID: ${receiptNumber}</p>
            </div>
            
            <table class="receipt-table">
              <thead>
                <tr>
                  <th class="qty">Qty.</th>
                  <th class="description">Description</th>
                  <th class="price">Price</th>
                  <th class="amount">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${cart
                  .map(
                    (item, _index) => `
                  <tr>
                    <td class="qty">${item.quantity}</td>
                    <td class="description">${item.name}${
                      item.details ? ` (${item.details})` : ""
                    }</td>
                    <td class="price">${item.price.toFixed(2)}</td>
                    <td class="amount">${(item.price * item.quantity).toFixed(
                      2
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
                  <td class="total-amount">OMR ${subtotal.toFixed(2)}</td>
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
                  <td class="total-amount">OMR ${vat.toFixed(2)}</td>
                </tr>
                <tr>
                  <td class="total-label">Total with VAT</td>
                  <td class="total-amount">OMR ${total.toFixed(2)}</td>
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
            
            <div class="barcode">
              <!-- Barcode would go here in a real implementation -->
              ${receiptNumber}
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.open();
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
      <div className="max-h-[40vh] overflow-auto mb-4">
        <div
          className="bg-white border rounded-lg p-4 w-full max-w-[300px] mx-auto"
          ref={receiptRef}
        >
          {/* Receipt Preview */}
          <div className="text-center mb-2">
            <h3 className="font-bold text-lg">H Automotives</h3>
            <p className="text-xs text-gray-500">Saham, Sultanate of Oman</p>
            <p className="text-xs text-gray-500">Ph: 92510750 | 26856848</p>
            <p className="text-xs text-gray-500">VATIN: OM1100006980</p>
          </div>

          <div className="border-t border-b border-dashed py-1 mb-3">
            <p className="text-xs font-medium text-center">INVOICE</p>
            <div className="flex justify-between text-xs">
              <span>Date: {currentDate}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>Time: {currentTime}</span>
              <span>POS ID: {receiptNumber}</span>
            </div>
          </div>

          <div className="text-xs mb-3">
            <div className="grid grid-cols-12 gap-1 font-medium mb-1">
              <span className="col-span-1">Qty.</span>
              <span className="col-span-7">Description</span>
              <span className="col-span-2 text-right">Price</span>
              <span className="col-span-2 text-right">Amount</span>
            </div>

            {cart.map((item) => (
              <div key={item.uniqueId} className="grid grid-cols-12 gap-1 mb-1">
                <span className="col-span-1">{item.quantity}</span>
                <span className="col-span-7 break-words">
                  {item.name}
                  {item.details ? ` (${item.details})` : ""}
                </span>
                <span className="col-span-2 text-right">
                  {item.price.toFixed(2)}
                </span>
                <span className="col-span-2 text-right">
                  {(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed pt-2 mb-3">
            <div className="flex justify-between text-xs">
              <span>Total w/o VAT</span>
              <span>OMR {subtotal.toFixed(2)}</span>
            </div>
            {localDiscount && (
              <div className="flex justify-between items-center border-t pt-2">
                <span>
                  Discount{" "}
                  {localDiscount.type === "percentage"
                    ? `(${localDiscount.value}%)`
                    : "(Amount)"}
                </span>
                <span>- OMR {discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span>VAT</span>
              <span>OMR {vat.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold">
              <span>Total with VAT</span>
              <span>OMR {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="text-center text-xs text-gray-600 border-t border-dashed pt-2">
            <p>Number of Items: {itemCount}</p>
            <p>Payment Method: {getFormattedPaymentMethod(paymentMethod)}</p>
            {paymentMethod === "mobile" && paymentRecipient && (
              <p>Mobile Payment Recipient: {paymentRecipient}</p>
            )}
            {cashier && <p>Cashier: {cashier}</p>}
            <p>Keep this Invoice for your Exchanges</p>
            <p className="text-xs text-right text-gray-600">
              احتفظ بهذه الفاتورة للتبديل
            </p>
            <p>Exchange with in 15 Days</p>
            <p className="text-xs text-right text-gray-600">
              التبديل خلال 15 يوم
            </p>
            <p>Thank you for shopping with us.</p>
            <p className="text-xs text-right text-gray-600">
              شكراً للتسوق معنا
            </p>
            <p className="font-medium mt-2">
              WhatsApp 72702537 for latest offers
            </p>
            <p className="font-mono">{receiptNumber}</p>
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
