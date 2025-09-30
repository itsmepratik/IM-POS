"use client";

import {
  useState,
  useEffect,
  useCallback,
  useTransition,
  useMemo,
} from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Minus,
  Plus,
  History,
  FileText,
  Truck,
  Pencil,
  X,
  ChevronDown,
  RefreshCw,
  ShoppingCart,
  Package,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Loader2,
  Receipt,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useTransfer } from "@/hooks/use-transfer";
import { useTransferLocations } from "@/lib/hooks/data/useTransferLocations";
import { Transfer2POSInterface } from "./components/Transfer2POSInterface";

// Define interfaces for our data (copied from original transfer)
interface Location {
  id: string;
  name: string;
}

interface TransferItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  sku: string;
  quantity: number;
  price: number;
}

// Define a proper interface for the converted item
interface ConvertedInventoryItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  sku: string;
  location: string;
  inStock: number;
  price: number;
}

// Interface for POS items that will be selected
interface POSCartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  details?: string;
  uniqueId: string;
  bottleType?: "open" | "closed";
}

// Mock interface for sales data
interface SaleItem {
  id: string;
  name: string;
  category: string;
  sku: string;
  quantitySold: number;
  price: number;
  brand?: string;
}

// Submitted transfer order interface
interface SubmittedTransferOrder {
  id: string;
  transferId: string;
  sourceLocation: string;
  destinationLocation: string;
  items: SaleItem[];
  orderDate: string;
  status: "pending" | "in_transit" | "delivered" | "cancelled";
  submittedBy: string;
  targetDate: string;
  receivedItems: SaleItem[]; // Items that have been received
  pendingItems: SaleItem[]; // Items that haven't been received yet
}

export default function Transfer2Page() {
  const { toast } = useToast();
  const { items, refreshItems } = useTransfer(); // Get items from the hook
  const {
    locations,
    categories,
    isLoading: locationsLoading,
    refreshTransferData,
  } = useTransferLocations();
  const [hasMounted, setHasMounted] = useState(false);

  // Memoized component for rendering modal items to improve performance
  const ModalItems = useMemo(() => {
    return function ModalItemsComponent({ items }: { items: SaleItem[] }) {
      return (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 border rounded"
            >
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-muted-foreground">
                  {item.brand && `${item.brand} • `}SKU: {item.sku}
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">Qty: {item.quantitySold}</div>
                <div className="text-xs text-muted-foreground">
                  ${item.price.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    };
  }, []);

  // Use useEffect to refresh items and locations when the component mounts
  useEffect(() => {
    // First clear any cached locations
    if (typeof window !== "undefined") {
      localStorage.removeItem("transferLocations");
    }

    refreshItems();
    refreshTransferData(); // Force refresh locations to ensure we have the latest data
  }, [refreshItems, refreshTransferData]);

  // Separate effect to log locations after they've been updated
  useEffect(() => {
    if (locations.length > 0) {
      console.log("Transfer 2.0 - Current locations available:", locations);
    }
  }, [locations]);

  // Set source location to be fixed as "Sanaiya" - use a fake ID to avoid confusion
  const [sourceLocation] = useState<string>("loc0"); // Fixed to "Sanaiya (Main)"
  const [destinationLocation, setDestinationLocation] = useState<string>("");
  const [showPOSInterface, setShowPOSInterface] = useState(false);
  const [posCart, setPosCart] = useState<POSCartItem[]>([]);
  const [isCustomBillLoading, setIsCustomBillLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [targetDate, setTargetDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  ); // Today's date by default
  const [transferId, setTransferId] = useState<string>("");
  const [customBillSuccess, setCustomBillSuccess] = useState(false);

  // State for submitted transfer orders
  const [submittedOrders, setSubmittedOrders] = useState<
    SubmittedTransferOrder[]
  >([]);
  const [confirmSubmitDialogOpen, setConfirmSubmitDialogOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] =
    useState<SubmittedTransferOrder | null>(null);

  // Initialize component state
  useEffect(() => {
    setHasMounted(true);

    // Generate initial transfer ID
    const initialId = `T2-${Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")}`;
    setTransferId(initialId);

    // Load saved transfer orders from localStorage
    if (typeof window !== "undefined") {
      const savedOrders = localStorage.getItem("transfer2Orders");
      if (savedOrders) {
        setSubmittedOrders(JSON.parse(savedOrders));
      }
    }
  }, []);

  // Save transfer orders to localStorage whenever they change
  useEffect(() => {
    if (hasMounted && typeof window !== "undefined") {
      localStorage.setItem("transfer2Orders", JSON.stringify(submittedOrders));
    }
  }, [submittedOrders, hasMounted]);

  // Handle custom bill button click
  const handleCustomBillClick = useCallback(() => {
    if (!destinationLocation || sourceLocation === destinationLocation) {
      toast({
        title: "Error",
        description: "Please select a valid destination location",
        variant: "destructive",
      });
      return;
    }

    setShowPOSInterface(true);
    toast({
      title: "POS Interface Opened",
      description: "Select products to add to your custom transfer bill",
    });
  }, [destinationLocation, sourceLocation, toast]);

  // Handle POS cart update
  const handlePOSCartUpdate = useCallback((cart: POSCartItem[]) => {
    setPosCart(cart);
  }, []);

  // Handle confirming the custom bill
  const handleConfirmCustomBill = useCallback(() => {
    if (posCart.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to your custom bill",
        variant: "destructive",
      });
      return;
    }

    setConfirmSubmitDialogOpen(true);
  }, [posCart, toast]);

  // Handle target date change
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTargetDate(e.target.value);
  };

  // Handle submit transfer order
  const handleSubmitTransfer = () => {
    // Convert POS cart items to SaleItems
    const transferItems: SaleItem[] = posCart.map((item) => ({
      id: item.uniqueId,
      name: item.name,
      category: "Custom", // Default category for custom items
      sku: `SKU-${item.id}`,
      quantitySold: item.quantity,
      price: item.price,
      brand: item.details || "Unknown",
    }));

    const newOrder: SubmittedTransferOrder = {
      id: `transfer2-${Date.now()}`,
      transferId,
      sourceLocation,
      destinationLocation,
      items: transferItems,
      orderDate: new Date().toISOString(),
      status: "pending",
      submittedBy: "Current User", // TODO: Get from user context
      targetDate,
      receivedItems: [],
      pendingItems: transferItems, // All items start as pending
    };

    setSubmittedOrders((prev) => [newOrder, ...prev]);
    setPosCart([]);
    setShowPOSInterface(false);
    setConfirmSubmitDialogOpen(false);

    // Generate new transfer ID for next order
    setTransferId(
      `T2-${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`
    );

    toast({
      title: "Transfer Order Submitted",
      description: `Transfer ${transferId} has been submitted successfully`,
    });
  };

  // Handle order review
  const handleReviewOrder = (order: SubmittedTransferOrder) => {
    startTransition(() => {
      setSelectedOrder(order);
      setReviewModalOpen(true);
    });
  };

  // Handle order status update
  const handleStatusUpdate = (
    orderId: string,
    newStatus: SubmittedTransferOrder["status"]
  ) => {
    setSubmittedOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );

    toast({
      title: "Status Updated",
      description: `Order status changed to ${newStatus}`,
    });
  };

  // Handle order deletion
  const handleDeleteOrder = (orderId: string) => {
    setSubmittedOrders((prev) => prev.filter((order) => order.id !== orderId));
    toast({
      title: "Order Deleted",
      description: "Transfer order has been deleted",
    });
  };

  const getStatusColor = (status: SubmittedTransferOrder["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "in_transit":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "delivered":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  if (!hasMounted) {
    return null; // Prevent hydration mismatch
  }

  return (
    <Layout>
      <div className="flex-1 p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/transfer">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Transfer
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold"></h1>
              <p className="text-muted-foreground"></p>
            </div>
          </div>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {transferId}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Container - Location Selection */}
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">From Location</label>
                <Select value={sourceLocation} disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="loc0">Sanaiya (Main)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Source location is fixed to main branch
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">To Location</label>
                <Select
                  value={destinationLocation}
                  onValueChange={setDestinationLocation}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locations
                      .filter((location) => location.id !== sourceLocation)
                      .map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {destinationLocation && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="h-4 w-4 text-primary" />
                    <span>
                      Transfer from{" "}
                      <strong>
                        {locations.find((l) => l.id === sourceLocation)?.name}
                      </strong>{" "}
                      to{" "}
                      <strong>
                        {
                          locations.find((l) => l.id === destinationLocation)
                            ?.name
                        }
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right Container - Custom Bill */}
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Date</label>
                <Input
                  type="date"
                  value={targetDate}
                  onChange={handleDateChange}
                  max={new Date().toISOString().split("T")[0]} // Limit to today
                  className="w-full"
                />
              </div>

              <div className="pt-4">
                <Button
                  size="lg"
                  className="gap-2 w-full"
                  onClick={handleCustomBillClick}
                  disabled={
                    !destinationLocation ||
                    sourceLocation === destinationLocation ||
                    isCustomBillLoading
                  }
                >
                  <Receipt className="h-5 w-5" />
                  Custom Bill
                </Button>
              </div>

              {posCart.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Items in Cart</span>
                    <Badge variant="secondary">{posCart.length}</Badge>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {posCart.map((item) => (
                      <div
                        key={item.uniqueId}
                        className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded"
                      >
                        <span className="truncate">{item.name}</span>
                        <span>{item.quantity}x</span>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={handleConfirmCustomBill}
                    className="w-full"
                    size="sm"
                  >
                    Confirm Custom Bill ({posCart.length} items)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* POS Interface - Show when custom bill is clicked */}
          {showPOSInterface && (
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Product Selection</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPOSInterface(false)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Close
                    </Button>
                  </div>
                  <Transfer2POSInterface
                    onCartUpdate={handlePOSCartUpdate}
                    initialCart={posCart}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Submitted Orders History */}
          {submittedOrders.length > 0 && (
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <History className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">
                      Transfer 2.0 History ({submittedOrders.length})
                    </h3>
                  </div>
                  <ScrollArea className="max-h-96">
                    <div className="space-y-2">
                      {submittedOrders.map((order) => (
                        <div
                          key={order.id}
                          className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="font-mono text-xs"
                                >
                                  {order.transferId}
                                </Badge>
                                <Badge
                                  className={`text-xs ${getStatusColor(
                                    order.status
                                  )}`}
                                  variant="secondary"
                                >
                                  {order.status.replace("_", " ").toUpperCase()}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {
                                  locations.find(
                                    (l) => l.id === order.sourceLocation
                                  )?.name
                                }{" "}
                                →{" "}
                                {
                                  locations.find(
                                    (l) => l.id === order.destinationLocation
                                  )?.name
                                }
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {order.items.length} items • Created{" "}
                                {new Date(order.orderDate).toLocaleDateString()}
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleReviewOrder(order)}
                                  disabled={isPending}
                                >
                                  {isPending ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <FileText className="h-4 w-4 mr-2" />
                                  )}
                                  Review
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusUpdate(order.id, "in_transit")
                                  }
                                  disabled={order.status === "in_transit"}
                                >
                                  <Truck className="h-4 w-4 mr-2" />
                                  Mark In Transit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusUpdate(order.id, "delivered")
                                  }
                                  disabled={order.status === "delivered"}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Mark Delivered
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="text-red-600"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Submit Transfer Confirmation Dialog */}
      <AlertDialog
        open={confirmSubmitDialogOpen}
        onOpenChange={setConfirmSubmitDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Transfer Order</AlertDialogTitle>
            <AlertDialogDescription>
              This will submit a transfer order for {posCart.length} items from{" "}
              {locations.find((l) => l.id === sourceLocation)?.name ||
                "Unknown"}{" "}
              to{" "}
              {locations.find((l) => l.id === destinationLocation)?.name ||
                "Unknown"}
              . Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitTransfer}
              className="bg-primary hover:bg-primary/90"
            >
              Submit Transfer Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Order Review Dialog */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Transfer Order: {selectedOrder?.transferId}
            </DialogTitle>
            <DialogDescription>
              Review transfer order details and items
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">From:</span>{" "}
                  {
                    locations.find((l) => l.id === selectedOrder.sourceLocation)
                      ?.name
                  }
                </div>
                <div>
                  <span className="font-medium">To:</span>{" "}
                  {
                    locations.find(
                      (l) => l.id === selectedOrder.destinationLocation
                    )?.name
                  }
                </div>
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <Badge
                    className={`${getStatusColor(selectedOrder.status)}`}
                    variant="secondary"
                  >
                    {selectedOrder.status.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Date:</span>{" "}
                  {new Date(selectedOrder.orderDate).toLocaleDateString()}
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">
                  Items ({selectedOrder.items.length})
                </h4>
                <ScrollArea className="max-h-64">
                  <ModalItems items={selectedOrder.items} />
                </ScrollArea>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
