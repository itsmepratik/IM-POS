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
  CheckCircle,
  XCircle,
  Package,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

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
      name: "Toyota Filter 90915-YZZD2",
      quantity: 5,
      unit: "pcs",
      price: 1.5,
    },
    {
      id: "item-011",
      name: "Toyota 5W-30 4L",
      quantity: 10,
      unit: "bottles",
      price: 8.0,
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
  // Add new large order with pricing information
  "to-005": [
    {
      id: "item-008",
      name: "Synthetic Oil 5W-40",
      quantity: 20,
      unit: "liters",
      price: 12.75,
    },
    {
      id: "item-009",
      name: "Spark Plugs NGK Iridium",
      quantity: 32,
      unit: "pcs",
      price: 7.95,
    },
    {
      id: "item-010",
      name: "Air Filter Toyota Camry",
      quantity: 15,
      unit: "pcs",
      price: 9.5,
    },
    {
      id: "item-011",
      name: "Cabin Filter Honda Accord",
      quantity: 10,
      unit: "pcs",
      price: 8.25,
    },
    {
      id: "item-012",
      name: "Brake Pads Front Set",
      quantity: 8,
      unit: "sets",
      price: 45.99,
    },
    {
      id: "item-013",
      name: "Brake Discs Front Pair",
      quantity: 6,
      unit: "pairs",
      price: 79.95,
    },
    {
      id: "item-014",
      name: "Windshield Washer Fluid",
      quantity: 24,
      unit: "bottles",
      price: 4.99,
    },
    {
      id: "item-015",
      name: "Power Steering Fluid",
      quantity: 12,
      unit: "bottles",
      price: 8.5,
    },
    {
      id: "item-016",
      name: "Differential Fluid 75W-90",
      quantity: 8,
      unit: "liters",
      price: 22.75,
    },
    {
      id: "item-017",
      name: "Transmission Fluid ATF",
      quantity: 16,
      unit: "liters",
      price: 15.5,
    },
    {
      id: "item-018",
      name: "Oil Filter Nissan Altima",
      quantity: 18,
      unit: "pcs",
      price: 6.95,
    },
    {
      id: "item-019",
      name: "Radiator Cap 1.1 Bar",
      quantity: 10,
      unit: "pcs",
      price: 5.25,
    },
    {
      id: "item-020",
      name: "Thermostat Toyota Corolla",
      quantity: 7,
      unit: "pcs",
      price: 12.99,
    },
    {
      id: "item-021",
      name: "Serpentine Belt Honda Civic",
      quantity: 9,
      unit: "pcs",
      price: 18.75,
    },
    {
      id: "item-022",
      name: "Water Pump Ford Focus",
      quantity: 5,
      unit: "pcs",
      price: 42.5,
    },
    {
      id: "item-023",
      name: "Fuel Filter Hyundai Sonata",
      quantity: 12,
      unit: "pcs",
      price: 9.99,
    },
    {
      id: "item-024",
      name: "Shock Absorber KYB Front",
      quantity: 6,
      unit: "pcs",
      price: 65.0,
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
    destinationLocation: "Hijari",
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
  // Add new large transfer order
  {
    id: "to-005",
    orderNumber: "TO-2023-005",
    date: "Nov 18, 2023",
    time: "09:45 AM",
    sourceLocation: "Central Distribution Hub",
    destinationLocation: "Main Service Center",
    itemCount: 17,
    status: "pending",
    items: mockItems["to-005"],
  },
];

// Function to handle type checking for TransferItem with price
const hasPrice = (item: HookTransferItem): item is TransferItem => {
  return "price" in item;
};

// Add a function to reset localStorage data
const resetLocalStorageData = () => {
  if (typeof window !== "undefined") {
    // Remove localStorage data
    localStorage.removeItem("restockOrders");
    // Reload the page to get fresh data
    window.location.reload();
  }
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
  // New state for order details modal
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] =
    useState<TransferOrder | null>(null);
  // State for item verification
  const [verifiedItems, setVerifiedItems] = useState<Record<string, boolean>>(
    {}
  );
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

    // Format current date and time in the format shown in the image (19/05/2025 19:04:18)
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    const formattedDate = `${day}/${month}/${year}`;
    const formattedTime = `${hours}:${minutes}:${seconds}`;
    const printedDateTime = `${formattedDate} ${formattedTime}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Transfer Order ${transfer.orderNumber}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @page {
              size: A4;
              margin: 0;
              padding: 0;
            }

            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              font-size: 10pt;
              line-height: 1.3;
              color: #333;
              position: relative;
              box-sizing: border-box;
            }

            .document-container {
              width: 21cm;
              margin: 0 auto;
              min-height: 29.7cm;
              position: relative;
              display: flex;
              flex-direction: column;
              padding: 0;
            }

            .header-box {
              background-color: white;
              padding: 10px 20px;
              margin-bottom: 20px;
              text-align: center;
            }

            .header h1 {
              font-size: 24pt;
              margin: 0;
              margin-bottom: 5px;
              font-weight: bold;
              color: #333;
            }

            .header h2 {
              font-size: 16pt;
              margin: 0;
              font-weight: normal;
              text-transform: uppercase;
              color: #333;
            }

            .main-divider {
              border-top: 1px solid #000;
              margin: 15px 0;
              height: 0;
            }

            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              column-gap: 30px;
              row-gap: 8px;
              margin-bottom: 20px;
              padding: 0 15px;
              page-break-inside: avoid;
            }

            .info-row {
              display: flex;
              align-items: center;
              margin-bottom: 0;
              line-height: 1.4;
            }

            .info-label {
              font-weight: bold;
              width: 100px;
              display: inline-block;
            }

            .info-value {
              display: inline-block;
            }

            .status-badge {
              display: inline-block;
              padding: 3px 10px;
              background-color: #FFCC00;
              font-weight: bold;
              text-transform: uppercase;
              width: 200px;
              text-align: center;
            }

            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              background-color: #f9f9f9;
              table-layout: fixed;
            }

            .items-table thead {
              display: table-header-group;
              page-break-after: avoid;
            }
            
            .items-table tfoot {
              display: table-footer-group;
              page-break-before: avoid;
              page-break-after: avoid;
            }

            .items-table th {
              border-bottom: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              font-weight: bold;
              font-size: 10pt;
              background-color: #f5f5f5;
            }

            .items-table td {
              padding: 8px;
              border-bottom: 1px solid #ddd;
              font-size: 10pt;
              height: 25px;
            }

            .items-table th:nth-child(1) {
              width: 5%;
            }
            
            .items-table th:nth-child(2) {
              width: 45%;
            }

            .items-table th:nth-child(3) {
              width: 15%;
              text-align: center;
            }
            
            .items-table th:nth-child(4) {
              width: 15%;
              text-align: right;
            }
            
            .items-table th:nth-child(5) {
              width: 20%;
              text-align: right;
            }

            .items-table td:nth-child(3) {
              text-align: center;
            }

            .items-table td:nth-child(4),
            .items-table td:nth-child(5) {
              text-align: right;
            }

            .total-row {
              border-top: 1px solid #000;
              font-weight: bold;
            }

            .total-amount {
              text-align: right;
              padding: 8px;
              font-weight: bold;
              margin-top: 10px;
              border-top: 1px solid #000;
              page-break-inside: avoid;
              page-break-before: avoid;
            }

            .footer-box {
              padding: 10px;
              text-align: center;
              background-color: white;
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              width: 100%;
            }

            .footer p {
              margin: 5px 0;
              line-height: 1.4;
              font-size: 10pt;
            }

            .timestamp {
              position: absolute;
              top: 20px;
              left: 15px;
              font-size: 9pt;
              color: #333;
            }

            .order-number {
              position: absolute;
              top: 20px;
              right: 15px;
              font-size: 9pt;
              color: #333;
              text-align: right;
            }

            .page-number {
              position: absolute;
              bottom: 15px;
              right: 15px;
              font-size: 9pt;
            }

            .content-area {
              padding: 0 15px;
              flex-grow: 1;
            }

            @media print {
              body {
                background: white;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
                
                /* Apply these styles to control header/footer placement */
                .header-box {
                  position: running(header);
                  display: block;
                }
                
                /* Make sure the footer only appears once at the end */
                .footer-box {
                  position: fixed;
                  bottom: 0;
                  left: 0;
                  right: 0;
                  width: 100%;
                  background-color: white;
                }
                
                @page {
                  @top-center { content: element(header); }
                }
                
                @page:first {
                  @top-center { content: element(header); }
                }
                
                @page:not(:first) {
                  @top-center { content: none; }
                }
                
                /* Make sure table rows don't break across pages */
                table { page-break-inside: auto; }
                tr { page-break-inside: avoid; page-break-after: auto; }
                thead { display: table-header-group; }
                
                /* Create space for the footer */
                .document-container {
                  margin-bottom: 100px;
                  padding-bottom: 50px;
                }
                
                /* Handle page breaks for large item lists */
                tr[style*="page-break-before"] {
                  page-break-before: always;
                }
                
                /* Make sure the total always shows properly */
                .total-amount {
                  page-break-inside: avoid;
                  page-break-before: avoid;
                  margin-top: 10px;
                  margin-bottom: 40px;
                }
            }
          </style>
        </head>
        <body>
          <div class="document-container">
          <div class="timestamp">${formattedDate}, ${formattedTime}</div>
            <div class="order-number">Transfer Order ${
              transfer.orderNumber
            }</div>

            <div class="header-box">
            <div class="header">
              <h1>HNS AUTOMOTIVES</h1>
              <h2>TRANSFER ORDER</h2>
              </div>
            </div>

            <div class="content-area">
            <div class="main-divider"></div>

            <div class="info-grid">
              <div class="info-row">
                <span class="info-label">Order #:</span>
                <span class="info-value">${transfer.orderNumber}</span>
              </div>
              <div class="info-row">
                <span class="info-label">From:</span>
                <span class="info-value">${transfer.sourceLocation}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Date:</span>
                <span class="info-value">${transfer.date}</span>
              </div>
              <div class="info-row">
                <span class="info-label">To:</span>
                  <span class="info-value">${
                    transfer.destinationLocation
                  }</span>
              </div>
              <div class="info-row">
                <span class="info-label">Status:</span>
                <span class="status-badge">PENDING</span>
              </div>
              <div class="info-row">
                <span class="info-label">Printed on:</span>
                <span class="info-value">${printedDateTime}</span>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                    <th>#</th>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>Unit Price<br/>(OMR)</th>
                    <th>Total<br/>(OMR)</th>
                </tr>
              </thead>
              <tbody>
                ${
                  transfer.items && transfer.items.length > 0
                    ? transfer.items
                        .map((item, index) => {
                          const itemWithPrice = item as TransferItem;
                          // Add page break before item 16 (index 15)
                          const pageBreak =
                            index === 15
                              ? 'style="page-break-before: always;"'
                              : "";
                          return `
                    <tr ${pageBreak}>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${
                      hasPrice(itemWithPrice) && itemWithPrice.price
                        ? itemWithPrice.price.toFixed(3)
                        : "N/A"
                    }</td>
                    <td>${
                      hasPrice(itemWithPrice) && itemWithPrice.price
                        ? (itemWithPrice.price * item.quantity).toFixed(3)
                        : "N/A"
                    }</td>
                  </tr>
                `;
                        })
                        .join("")
                    : '<tr><td colspan="5">No items available</td></tr>'
                }
              </tbody>
            </table>

              <div class="total-amount" style="page-break-inside: avoid; padding-bottom: 40px;">
                <span style="margin-right: 20px;">Total Amount:</span>
              <span>OMR ${transfer.items
                .reduce((sum, item) => {
                  const itemWithPrice = item as TransferItem;
                  return (
                    sum +
                    (hasPrice(itemWithPrice) && itemWithPrice.price
                      ? itemWithPrice.price * item.quantity
                      : 0)
                  );
                }, 0)
                .toFixed(3)}</span>
              </div>
            </div>

            <div class="footer-box">
              <p>This is a computer generated document and does not require signature.</p>
              <p>HNS Automotive - Thank you for your business</p>
              <span class="page-number">1/1</span>
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

  // Handle confirm transfer
  const handleConfirm = () => {
    if (!selectedTransferId) return;

    // Update the transfer status
    updateTransferStatus(selectedTransferId, "confirmed");

    // Show success toast
    toast({
      title: "Transfer Confirmed",
      description: `Transfer order has been confirmed successfully.`,
      variant: "default",
    });

    // Close modals
    setConfirmDialogOpen(false);
    setDetailsModalOpen(false);
  };

  // Handle reject transfer
  const handleReject = () => {
    if (!selectedTransferId) return;

    // Update the transfer status
    updateTransferStatus(selectedTransferId, "rejected");

    // Show success toast
    toast({
      title: "Transfer Rejected",
      description: `Transfer order has been rejected.`,
      variant: "destructive",
    });

    // Close modals
    setRejectDialogOpen(false);
    setDetailsModalOpen(false);
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

  // Open order details modal
  const openDetailsModal = (transfer: HookTransferOrder) => {
    const enhancedTransfer = enhanceTransferWithPrices(transfer);
    setSelectedOrderDetails(enhancedTransfer);
    setSelectedTransferId(transfer.id);
    // Initialize all items as unverified
    const initialVerifications: Record<string, boolean> = {};
    enhancedTransfer.items.forEach((item) => {
      initialVerifications[item.id] = false;
    });
    setVerifiedItems(initialVerifications);
    setDetailsModalOpen(true);
  };

  // Toggle item verification
  const toggleItemVerification = (itemId: string) => {
    setVerifiedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Check if all items are verified
  const areAllItemsVerified = () => {
    if (!selectedOrderDetails || !selectedOrderDetails.items.length)
      return false;
    return selectedOrderDetails.items.every((item) => verifiedItems[item.id]);
  };

  // Confirm all items
  const confirmAllItems = () => {
    if (!selectedOrderDetails) return;

    const allVerified: Record<string, boolean> = {};
    selectedOrderDetails.items.forEach((item) => {
      allVerified[item.id] = true;
    });
    setVerifiedItems(allVerified);
  };

  // Toggle details visibility
  const toggleDetails = (transferId: string) => {
    const transfer = transfers.find((t) => t.id === transferId);
    if (transfer) {
      openDetailsModal(transfer);
    } else {
      // Fallback to original expand/collapse functionality
      setExpandedOrders((prev) =>
        prev.includes(transferId)
          ? prev.filter((id) => id !== transferId)
          : [...prev, transferId]
      );
    }
  };

  return (
    <Layout>
      <div className="space-y-2 sm:space-y-4 pt-1">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search orders, items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full text-sm">
                <SelectValue placeholder="All..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All...">All...</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Confirmed">Confirmed</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={resetLocalStorageData}
              className="text-xs shrink-0"
            >
              Reset Data
            </Button>
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
                className={`border rounded-lg p-3 sm:p-4 ${
                  transfer.status === "confirmed"
                    ? "bg-green-50"
                    : transfer.status === "rejected"
                    ? "bg-red-50"
                    : ""
                }`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <h3 className="text-base sm:text-lg font-semibold">
                        Transfer {transfer.orderNumber}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {transfer.date}, {transfer.time}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-0">
                      {transfer.status === "pending" && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-blue-500 text-blue-500 hover:bg-blue-50 h-8 px-2 text-xs sm:text-sm"
                            onClick={() => toggleDetails(transfer.id)}
                          >
                            <Package className="h-3.5 w-3.5 mr-1" />
                            Review Items
                          </Button>
                        </>
                      )}
                      {transfer.status === "confirmed" && (
                        <div className="flex items-center gap-2">
                          <div className="px-2 py-1 bg-green-100 text-green-800 rounded-md font-medium text-xs">
                            Confirmed
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              openChangeStatusDialog(
                                transfer.id,
                                transfer.status
                              )
                            }
                            title="Change Status"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                      {transfer.status === "rejected" && (
                        <div className="flex items-center gap-2">
                          <div className="px-2 py-1 bg-red-100 text-red-800 rounded-md font-medium text-xs">
                            Rejected
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              openChangeStatusDialog(
                                transfer.id,
                                transfer.status
                              )
                            }
                            title="Change Status"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrint(transfer)}
                        className="flex items-center gap-1 h-8 px-2 text-xs sm:text-sm"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Print
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem
                            onClick={() => handlePrint(transfer)}
                          >
                            <Printer className="h-4 w-4 mr-2" />
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
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Change Status
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
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
                        width="14"
                        height="14"
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

                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
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
                      className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 text-xs sm:text-sm"
                      onClick={() => toggleDetails(transfer.id)}
                    >
                      <Package className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      {expandedOrders.includes(transfer.id)
                        ? "Hide details"
                        : "View Items"}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredTransfers.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 border rounded-lg">
                <Package className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground opacity-30 mb-3 sm:mb-4" />
                <p className="text-base sm:text-lg font-medium text-muted-foreground mb-1">
                  No Transfer Orders Found
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground text-center px-4">
                  No orders match your current filters. Try adjusting your
                  search criteria.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-[425px] p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Confirm Transfer
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Are you sure you want to confirm this transfer order? This will
              update inventory levels accordingly.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-2">
            <AlertDialogCancel className="mt-0 text-xs sm:text-sm h-9">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm h-9"
            >
              Confirm Transfer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-[425px] p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Reject Transfer
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Are you sure you want to reject this transfer order? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-2">
            <AlertDialogCancel className="mt-0 text-xs sm:text-sm h-9">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm h-9"
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
        <AlertDialogContent className="max-w-[90vw] sm:max-w-[425px] p-4 sm:p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-blue-500" />
              Change Order Status
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Select a new status for this transfer order.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-3 sm:py-4">
            <div className="space-y-3 sm:space-y-4">
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
                  className="text-xs sm:text-sm font-medium text-gray-700"
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
                  className="text-xs sm:text-sm font-medium text-gray-700"
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
                  className="text-xs sm:text-sm font-medium text-gray-700"
                >
                  Rejected
                </label>
              </div>
            </div>
          </div>

          <AlertDialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-2">
            <AlertDialogCancel className="mt-0 text-xs sm:text-sm h-9">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChange}
              className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm h-9"
            >
              Update Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Order Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="sm:max-w-[700px] w-[95vw] max-h-[90vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6 shrink-0 border-b">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Package className="h-5 w-5 text-primary" />
              Order #{selectedOrderDetails?.orderNumber}
            </DialogTitle>
          </DialogHeader>

          {selectedOrderDetails && (
            <>
              <div className="px-4 sm:px-6 py-3 shrink-0 border-b">
                <div className="flex flex-col sm:flex-row justify-between text-xs sm:text-sm gap-1 sm:gap-2">
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="font-medium">From:</span>{" "}
                    <span className="text-muted-foreground">
                      {selectedOrderDetails.sourceLocation}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="font-medium">To:</span>{" "}
                    <span className="text-muted-foreground">
                      {selectedOrderDetails.destinationLocation}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="font-medium">Date:</span>{" "}
                    <span className="text-muted-foreground">
                      {selectedOrderDetails.date}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-4 sm:px-6 py-2 flex items-center justify-between shrink-0 border-b">
                <div className="text-xs text-muted-foreground">
                  {Object.values(verifiedItems).filter(Boolean).length} of{" "}
                  {selectedOrderDetails.items.length} verified
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2 py-1"
                  onClick={confirmAllItems}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Mark All
                </Button>
              </div>

              {/* Scrollable items area with flex-grow to take available space */}
              <div className="flex-1 overflow-auto min-h-0 py-2">
                <div className="space-y-2 sm:space-y-3 px-4 sm:px-6">
                  {selectedOrderDetails.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-2 sm:space-x-3 p-2 rounded-md border bg-background"
                    >
                      <Checkbox
                        id={`item-${item.id}`}
                        checked={verifiedItems[item.id] || false}
                        onCheckedChange={() => toggleItemVerification(item.id)}
                        className="h-3.5 w-3.5 sm:h-4 sm:w-4"
                      />
                      <div className="flex flex-1 justify-between items-center gap-2 flex-wrap sm:flex-nowrap">
                        <label
                          htmlFor={`item-${item.id}`}
                          className="text-xs sm:text-sm font-medium cursor-pointer line-clamp-2"
                        >
                          {item.name}
                        </label>
                        <div className="flex items-center ml-auto gap-2 sm:gap-4 text-xs sm:text-sm flex-shrink-0">
                          <div className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-blue-50 text-blue-700 rounded whitespace-nowrap">
                            {item.quantity} {item.unit}
                          </div>
                          {hasPrice(item) && item.price !== undefined && (
                            <div className="text-muted-foreground whitespace-nowrap text-right">
                              OMR {(item.price * item.quantity).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fixed footer with total and buttons */}
              <div className="px-4 sm:px-6 py-3 border-t shrink-0 bg-muted/20">
                {selectedOrderDetails.items.length > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm mb-3">
                    <span className="font-semibold">Total Cost:</span>
                    <span className="font-semibold">
                      OMR{" "}
                      {selectedOrderDetails.items
                        .reduce((sum, item) => {
                          const itemWithPrice = item as TransferItem;
                          return (
                            sum +
                            (hasPrice(itemWithPrice) && itemWithPrice.price
                              ? itemWithPrice.price * item.quantity
                              : 0)
                          );
                        }, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full sm:w-auto text-xs sm:text-sm"
                    onClick={() => openRejectDialog(selectedTransferId || "")}
                    disabled={selectedOrderDetails?.status !== "pending"}
                  >
                    <XCircle className="h-3.5 w-3.5 mr-1.5" />
                    Reject Order
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-xs sm:text-sm"
                    size="sm"
                    onClick={() => openConfirmDialog(selectedTransferId || "")}
                    disabled={
                      !areAllItemsVerified() ||
                      selectedOrderDetails?.status !== "pending"
                    }
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Confirm Order
                  </Button>
                </div>
              </div>
            </>
          )}

          {selectedOrderDetails?.items.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-6 text-muted-foreground">
              <Package className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">No items found in this transfer order.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
