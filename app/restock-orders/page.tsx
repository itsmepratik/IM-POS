"use client";

import { useState, useRef, useEffect } from "react";
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
import {
  ChevronDown,
  Printer,
  AlertCircle,
  MoreHorizontal,
  RotateCcw,
} from "lucide-react";
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
import { toast } from "@/components/ui/use-toast";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useRestockOrders,
  TransferOrder as HookTransferOrder,
  TransferItem as HookTransferItem,
} from "@/lib/hooks/data/useRestockOrders";

// Extend the imported types with our additional fields
interface TransferItem extends HookTransferItem {
  price?: number;
}

interface TransferOrder extends Omit<HookTransferOrder, "items"> {
  items: TransferItem[];
}

// Update the mock data with pricing information
const mockItems: Record<string, TransferItem[]> = {
  "to-001": [
    {
      id: "item-001",
      name: "Toyota Oil Filter",
      quantity: 5,
      unit: "pcs",
      price: 9.99,
    },
    {
      id: "item-002",
      name: "Brake Fluid DOT 4",
      quantity: 10,
      unit: "bottles",
      price: 12.5,
    },
  ],
  "to-002": [
    {
      id: "item-003",
      name: 'Wiper Blades 22"',
      quantity: 8,
      unit: "pairs",
      price: 15.75,
    },
    {
      id: "item-004",
      name: "Engine Oil 5W-30",
      quantity: 12,
      unit: "liters",
      price: 8.25,
    },
  ],
  "to-003": [
    {
      id: "item-005",
      name: "Air Filter",
      quantity: 15,
      unit: "pcs",
      price: 7.5,
    },
  ],
  "to-004": [
    {
      id: "item-006",
      name: "Transmission Fluid",
      quantity: 6,
      unit: "bottles",
      price: 18.99,
    },
    {
      id: "item-007",
      name: "Coolant",
      quantity: 8,
      unit: "bottles",
      price: 14.25,
    },
  ],
};

// Helper function to convert from hook transfer to our transfer with prices
const enhanceTransferWithPrices = (
  transfer: HookTransferOrder
): TransferOrder => {
  // Find matching items from our mock data if available
  const itemsWithPrices = transfer.items
    ? transfer.items.map((item) => {
        // Look for a matching item in our mock data
        for (const itemSet of Object.values(mockItems)) {
          const matchingItem = itemSet.find(
            (mockItem) =>
              mockItem.name === item.name &&
              mockItem.quantity === item.quantity &&
              mockItem.unit === item.unit
          );
          if (matchingItem) {
            return { ...item, price: matchingItem.price };
          }
        }
        return { ...item, price: undefined };
      })
    : [];

  return {
    ...transfer,
    items: itemsWithPrices,
  };
};

// Initial mock data for transfer orders
const initialMockTransfers: TransferOrder[] = [
  {
    id: "to-001",
    orderNumber: "TO-2023-001",
    date: "Nov 15, 2023",
    time: "10:30 AM",
    sourceLocation: "Main Warehouse",
    destinationLocation: "Downtown Shop",
    itemCount: 2,
    status: "pending",
    items: mockItems["to-001"],
  },
  {
    id: "to-002",
    orderNumber: "TO-2023-002",
    date: "Nov 16, 2023",
    time: "02:15 PM",
    sourceLocation: "Main Warehouse",
    destinationLocation: "Westside Location",
    itemCount: 2,
    status: "pending",
    items: mockItems["to-002"],
  },
  {
    id: "to-003",
    orderNumber: "TO-2023-003",
    date: "Nov 14, 2023",
    time: "09:00 AM",
    sourceLocation: "South Distribution Center",
    destinationLocation: "Downtown Shop",
    itemCount: 1,
    status: "confirmed",
    items: mockItems["to-003"],
  },
  {
    id: "to-004",
    orderNumber: "TO-2023-004",
    date: "Nov 13, 2023",
    time: "11:45 AM",
    sourceLocation: "East Warehouse",
    destinationLocation: "Northside Branch",
    itemCount: 2,
    status: "rejected",
    items: mockItems["to-004"],
  },
];

// Function to handle type checking for TransferItem with price
const hasPrice = (item: HookTransferItem): item is TransferItem => {
  return "price" in item;
};

export default function RestockOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All...");
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedTransferId, setSelectedTransferId] = useState<string | null>(
    null
  );
  const [changeStatusDialogOpen, setChangeStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<
    "pending" | "confirmed" | "rejected"
  >("pending");
  const { toast } = useToast();

  // Use the hook instead of direct mock data
  const { transfers, isLoading, updateTransferStatus } = useRestockOrders();

  // Filter transfers based on search query and status
  const filteredTransfers = transfers.filter((transfer) => {
    const matchesSearch =
      searchQuery === "" ||
      transfer.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.sourceLocation
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      transfer.destinationLocation
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "All..." ||
      (filterStatus === "Pending" && transfer.status === "pending") ||
      (filterStatus === "Confirmed" && transfer.status === "confirmed") ||
      (filterStatus === "Rejected" && transfer.status === "rejected");

    return matchesSearch && matchesStatus;
  });

  // Handle print functionality for receipt-like format
  const handlePrint = (origTransfer: HookTransferOrder) => {
    // Convert from hook transfer to our enhanced transfer with prices
    const transfer = enhanceTransferWithPrices(origTransfer);

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: "Print Error",
        description: "Please allow popups to print receipt",
        variant: "destructive",
      });
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transfer Order ${transfer.orderNumber}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @page {
              size: A4;
              margin: 1.5cm;
            }
            
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              font-size: 12pt;
              line-height: 1.5;
              color: #333;
            }
            
            .a4-container {
              width: 21cm;
              min-height: 29.7cm;
              padding: 1.5cm;
              margin: 0 auto;
              background: white;
              box-sizing: border-box;
            }
            
            .header {
              text-align: center;
              margin-bottom: 2cm;
              border-bottom: 2px solid #000;
              padding-bottom: 0.5cm;
            }
            
            .header h1 {
              font-size: 24pt;
              margin: 0;
              margin-bottom: 0.3cm;
            }
            
            .header h2 {
              font-size: 18pt;
              margin: 0;
              font-weight: normal;
              text-transform: uppercase;
            }
            
            .info-section {
              display: flex;
              justify-content: space-between;
              margin-bottom: 1cm;
            }
            
            .info-block {
              width: 48%;
            }
            
            .info-row {
              margin-bottom: 0.3cm;
            }
            
            .info-label {
              font-weight: bold;
              display: inline-block;
              width: 3cm;
            }
            
            .status-badge {
              display: inline-block;
              padding: 0.2cm 0.5cm;
              border-radius: 0.2cm;
              font-weight: bold;
              margin-top: 0.5cm;
              text-transform: uppercase;
            }
            
            .status-pending {
              background-color: #fff3cd;
              color: #856404;
            }
            
            .status-confirmed {
              background-color: #d4edda;
              color: #155724;
            }
            
            .status-rejected {
              background-color: #f8d7da;
              color: #721c24;
            }
            
            .items-section {
              margin-bottom: 1cm;
            }
            
            .items-section h3 {
              font-size: 14pt;
              border-bottom: 1px solid #ddd;
              padding-bottom: 0.2cm;
              margin-bottom: 0.5cm;
            }
            
            .items-table {
              width: 100%;
              border-collapse: collapse;
            }
            
            .items-table th {
              background-color: #f8f9fa;
              border-bottom: 2px solid #ddd;
              padding: 0.3cm;
              text-align: left;
            }
            
            .items-table th:last-child,
            .items-table td:last-child {
              text-align: right;
            }
            
            .items-table td {
              padding: 0.3cm;
              border-bottom: 1px solid #eee;
            }
            
            .footer {
              margin-top: 1cm;
              padding-top: 0.5cm;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 10pt;
              color: #666;
            }
            
            .total-row td {
              font-weight: bold;
              border-top: 2px solid #ddd;
              padding-top: 0.5cm;
            }
            
            @media print {
              body {
                background: white;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .a4-container {
                width: 100%;
                min-height: auto;
                padding: 0;
                box-shadow: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="a4-container">
            <div class="header">
              <h1>H AUTOMOTIVES</h1>
              <h2>Transfer Order</h2>
              <div>
                <div class="status-badge status-${transfer.status}">
                  ${
                    transfer.status.charAt(0).toUpperCase() +
                    transfer.status.slice(1)
                  }
                </div>
              </div>
            </div>
            
            <div class="info-section">
              <div class="info-block">
                <div class="info-row">
                  <span class="info-label">Order #:</span>
                  <span>${transfer.orderNumber}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Date:</span>
                  <span>${transfer.date}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Time:</span>
                  <span>${transfer.time}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">ID:</span>
                  <span>${transfer.id}</span>
                </div>
              </div>
              <div class="info-block">
                <div class="info-row">
                  <span class="info-label">From:</span>
                  <span>${transfer.sourceLocation}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">To:</span>
                  <span>${transfer.destinationLocation}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Printed on:</span>
                  <span>${new Date().toLocaleDateString(
                    "en-GB"
                  )} ${new Date().toLocaleTimeString("en-GB")}</span>
                </div>
              </div>
            </div>
            
            <div class="items-section">
              <h3>Items (${transfer.itemCount})</h3>
              <table class="items-table">
                <thead>
                  <tr>
                    <th width="5%">#</th>
                    <th width="45%">Item</th>
                    <th width="15%">Quantity</th>
                    <th width="15%">Unit Price</th>
                    <th width="20%">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    transfer.items && transfer.items.length > 0
                      ? transfer.items
                          .map((item, index) => {
                            const itemWithPrice = item as TransferItem;
                            return `
                    <tr>
                      <td>${index + 1}</td>
                      <td>${item.name}</td>
                      <td>${item.quantity}</td>
                      <td>OMR ${
                        hasPrice(itemWithPrice) && itemWithPrice.price
                          ? itemWithPrice.price.toFixed(2)
                          : "N/A"
                      }</td>
                      <td>OMR ${
                        hasPrice(itemWithPrice) && itemWithPrice.price
                          ? (itemWithPrice.price * item.quantity).toFixed(2)
                          : "N/A"
                      }</td>
                    </tr>
                  `;
                          })
                          .join("")
                      : '<tr><td colspan="5">No items available</td></tr>'
                  }
                  ${
                    transfer.items && transfer.items.length > 0
                      ? `
                    <tr class="total-row">
                      <td colspan="4" style="text-align: right;">Total Amount:</td>
                      <td>OMR ${transfer.items
                        .reduce((sum, item) => {
                          const itemWithPrice = item as TransferItem;
                          return (
                            sum +
                            (hasPrice(itemWithPrice) && itemWithPrice.price
                              ? itemWithPrice.price * item.quantity
                              : 0)
                          );
                        }, 0)
                        .toFixed(2)}</td>
                    </tr>
                  `
                      : ""
                  }
                </tbody>
              </table>
            </div>
            
            <div class="footer">
              <p>This is a computer generated document and does not require signature.</p>
              <p>H Automotives - Thank you for your business</p>
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

    // Log the print action
    toast({
      title: "Printing Order",
      description: `Printing transfer order ${transfer.orderNumber}`,
    });
  };

  // Open confirm dialog
  const openConfirmDialog = (transferId: string) => {
    setSelectedTransferId(transferId);
    setConfirmDialogOpen(true);
  };

  // Open reject dialog
  const openRejectDialog = (transferId: string) => {
    setSelectedTransferId(transferId);
    setRejectDialogOpen(true);
  };

  // Handle reject transfer
  const handleReject = () => {
    if (!selectedTransferId) return;

    // Update the transfer status in our state
    updateTransferStatus(selectedTransferId, "rejected");

    // Show success toast
    toast({
      title: "Transfer Rejected",
      description: `Transfer order has been rejected successfully.`,
    });

    // Close the dialog
    setRejectDialogOpen(false);
    setSelectedTransferId(null);
  };

  // Handle confirm transfer
  const handleConfirm = () => {
    if (!selectedTransferId) return;

    // Update the transfer status in our state
    updateTransferStatus(selectedTransferId, "confirmed");

    // Show success toast
    toast({
      title: "Transfer Confirmed",
      description: `Transfer order has been confirmed successfully.`,
    });

    // Close the dialog
    setConfirmDialogOpen(false);
    setSelectedTransferId(null);
  };

  // Handle status change
  const handleStatusChange = () => {
    if (!selectedTransferId || !newStatus) return;

    // Update the transfer status in our state
    updateTransferStatus(selectedTransferId, newStatus);

    // Show success toast
    toast({
      title: "Status Updated",
      description: `Transfer order status has been changed to ${newStatus}.`,
    });

    // Close the dialog
    setChangeStatusDialogOpen(false);
    setSelectedTransferId(null);
  };

  // Open change status dialog
  const openChangeStatusDialog = (
    transferId: string,
    currentStatus: "pending" | "confirmed" | "rejected"
  ) => {
    setSelectedTransferId(transferId);
    setNewStatus(currentStatus); // Set current status as default
    setChangeStatusDialogOpen(true);
  };

  // Toggle details visibility
  const toggleDetails = (transferId: string) => {
    setExpandedOrders((prev) =>
      prev.includes(transferId)
        ? prev.filter((id) => id !== transferId)
        : [...prev, transferId]
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Incoming Restocks</h1>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search orders, items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="w-full sm:w-auto">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All...">All...</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransfers.map((transfer) => (
              <div
                key={transfer.id}
                className={`border rounded-lg p-4 ${
                  transfer.status === "confirmed"
                    ? "bg-green-50"
                    : transfer.status === "rejected"
                    ? "bg-red-50"
                    : ""
                }`}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <h3 className="text-lg font-semibold">
                        Transfer {transfer.orderNumber}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {transfer.date}, {transfer.time}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {transfer.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            className="border-red-500 text-red-500 hover:bg-red-50"
                            onClick={() => openRejectDialog(transfer.id)}
                          >
                            <span className="mr-2">✕</span> Reject
                          </Button>
                          <Button
                            variant="outline"
                            className="border-green-500 text-green-500 hover:bg-green-50"
                            onClick={() => openConfirmDialog(transfer.id)}
                          >
                            <span className="mr-2">✓</span> Confirm
                          </Button>
                        </>
                      )}
                      {transfer.status === "confirmed" && (
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-green-100 text-green-800 rounded-md font-medium">
                            Confirmed
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              openChangeStatusDialog(
                                transfer.id,
                                transfer.status
                              )
                            }
                            title="Change Status"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {transfer.status === "rejected" && (
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-red-100 text-red-800 rounded-md font-medium">
                            Rejected
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              openChangeStatusDialog(
                                transfer.id,
                                transfer.status
                              )
                            }
                            title="Change Status"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        onClick={() => handlePrint(transfer)}
                        className="flex items-center gap-2"
                      >
                        <Printer className="h-4 w-4" />
                        Print
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => toggleDetails(transfer.id)}
                          >
                            {expandedOrders.includes(transfer.id)
                              ? "Hide details"
                              : "Show details"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handlePrint(transfer)}
                          >
                            Print Receipt
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              openChangeStatusDialog(
                                transfer.id,
                                transfer.status
                              )
                            }
                          >
                            Change Status
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-500"
                      >
                        <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path>
                        <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"></path>
                      </svg>
                      <span>From: {transfer.sourceLocation}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-500"
                      >
                        <path d="M20 9v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9"></path>
                        <path d="M9 22V12h6v10"></path>
                        <path d="M2 10.6L12 2l10 8.6"></path>
                      </svg>
                      <span>To: {transfer.destinationLocation}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-gray-500"
                      >
                        <rect width="20" height="14" x="2" y="5" rx="2"></rect>
                        <line x1="2" x2="22" y1="10" y2="10"></line>
                      </svg>
                      <span>
                        {transfer.itemCount}{" "}
                        {transfer.itemCount === 1 ? "item" : "items"}
                      </span>
                    </div>
                    <button
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                      onClick={() => toggleDetails(transfer.id)}
                    >
                      {expandedOrders.includes(transfer.id)
                        ? "Hide details"
                        : "Show details"}
                    </button>
                  </div>

                  {/* Expanded details section */}
                  {expandedOrders.includes(transfer.id) && (
                    <div className="mt-4 border-t pt-4">
                      <h4 className="font-medium mb-2">Items:</h4>
                      <div className="space-y-2">
                        {transfer.items?.map((item) => {
                          // Cast the hook item to our enhanced item if possible
                          const itemWithPrice = item as TransferItem;
                          return (
                            <div
                              key={item.id}
                              className="flex justify-between items-center p-2 bg-gray-50 rounded"
                            >
                              <div>
                                <span className="font-medium">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span>{item.quantity}</span>
                                {hasPrice(itemWithPrice) &&
                                  itemWithPrice.price !== undefined && (
                                    <>
                                      <span className="text-gray-500">×</span>
                                      <span>
                                        OMR {itemWithPrice.price.toFixed(2)}
                                      </span>
                                      <span className="font-medium">
                                        = OMR{" "}
                                        {(
                                          itemWithPrice.price * item.quantity
                                        ).toFixed(2)}
                                      </span>
                                    </>
                                  )}
                              </div>
                            </div>
                          );
                        })}
                        {!transfer.items?.length && (
                          <p className="text-gray-500">No items available</p>
                        )}
                      </div>
                      {transfer.items && transfer.items.length > 0 && (
                        <div className="mt-4 pt-2 border-t flex justify-between">
                          <span className="font-semibold">Total:</span>
                          <span className="font-semibold">
                            OMR{" "}
                            {transfer.items
                              .reduce((sum, item) => {
                                const itemWithPrice = item as TransferItem;
                                return (
                                  sum +
                                  (hasPrice(itemWithPrice) &&
                                  itemWithPrice.price
                                    ? itemWithPrice.price * item.quantity
                                    : 0)
                                );
                              }, 0)
                              .toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredTransfers.length === 0 && !isLoading && (
              <div className="text-center py-8 border rounded-lg">
                <p className="text-gray-500">
                  No transfer orders found matching your criteria.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Transfer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to confirm this transfer order? This will
              update inventory levels accordingly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-green-600 hover:bg-green-700"
            >
              Confirm Transfer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Reject Transfer
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this transfer order? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700"
            >
              Reject Transfer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Status Dialog */}
      <AlertDialog
        open={changeStatusDialogOpen}
        onOpenChange={setChangeStatusDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-blue-500" />
              Change Order Status
            </AlertDialogTitle>
            <AlertDialogDescription>
              Select a new status for this transfer order.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="status-pending"
                  name="status"
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={newStatus === "pending"}
                  onChange={() => setNewStatus("pending")}
                />
                <label
                  htmlFor="status-pending"
                  className="text-sm font-medium text-gray-700"
                >
                  Pending
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="status-confirmed"
                  name="status"
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={newStatus === "confirmed"}
                  onChange={() => setNewStatus("confirmed")}
                />
                <label
                  htmlFor="status-confirmed"
                  className="text-sm font-medium text-gray-700"
                >
                  Confirmed
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="status-rejected"
                  name="status"
                  className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={newStatus === "rejected"}
                  onChange={() => setNewStatus("rejected")}
                />
                <label
                  htmlFor="status-rejected"
                  className="text-sm font-medium text-gray-700"
                >
                  Rejected
                </label>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChange}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Update Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
