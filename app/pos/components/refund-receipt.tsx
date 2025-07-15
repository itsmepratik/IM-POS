"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

// Define the structure for refund items
interface RefundItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  details?: string;
  uniqueId: string;
  bottleType?: "open" | "closed";
}

interface RefundReceiptProps {
  items: RefundItem[];
  receiptNumber: string;
  originalReceiptNumber: string;
  currentDate: string;
  currentTime: string;
  customerName?: string;
  cashier?: string;
  refundAmount: number;
  hidePrintButton?: boolean;
}

const companyDetails = {
  name: "AL-TARATH NATIONAL CO.",
  arabicName: "شركة الطارث الوطنية",
  crNumber: "1001886",
  addressLine1: "W.Saham",
  addressLine2: "Al-Sanaiya",
  addressLine3: "Sultanate of Oman",
  contactNumber: "71170805",
};

const serviceDescription = {
  english: "TYRE REPAIRING & OIL CHANGING OF VEHICLES",
  arabic: "إصلاح الإطارات وتغيير النفط للمركبات",
};

const thankYouMessage = "Thankyou for shopping with us";

export const RefundReceipt: React.FC<RefundReceiptProps> = ({
  items,
  receiptNumber,
  originalReceiptNumber,
  currentDate,
  currentTime,
  customerName = "",
  cashier,
  refundAmount,
  hidePrintButton = false,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Determine if this is a receipt with only battery items
  const isOnlyBatteryItems = items.every(
    (item) =>
      item.name.toLowerCase().includes("battery") ||
      (item.uniqueId && item.uniqueId.includes("battery"))
  );

  // Format item name with details
  const formatItemName = (item: RefundItem): string => {
    let itemName = item.name;

    // Don't show discount items as separate entries
    if (item.name.toLowerCase().includes("discount")) {
      return itemName;
    }

    // Add details if they exist
    if (item.details) {
      itemName += ` (${item.details})`;
    }

    // Add bottle type for lubricants
    if (item.bottleType) {
      itemName += ` - ${
        item.bottleType === "open" ? "Open Bottle" : "Closed Bottle"
      }`;
    }

    return itemName;
  };

  // Get product type from uniqueId or name
  const getProductType = (item: RefundItem): string => {
    if (item.uniqueId && item.uniqueId.includes("-")) {
      const type = item.uniqueId.split("-")[1];
      if (type) return type;
    }

    if (item.name.toLowerCase().includes("lubricant")) return "lubricant";
    if (item.name.toLowerCase().includes("filter")) return "filter";
    if (item.name.toLowerCase().includes("battery")) return "battery";
    if (item.name.toLowerCase().includes("fluid")) return "fluid";
    if (item.name.toLowerCase().includes("additive")) return "additive";

    return "other";
  };

  // Calculate subtotal (same as refund amount, but we'll use it for VAT calculation)
  const subtotal = refundAmount / 1.05; // Remove 5% VAT
  const vat = refundAmount - subtotal; // 5% of subtotal

  // Generate HTML for print window with product type-specific formatting
  const generateReceiptHTML = () => {
    // Filter out discount items from display
    const displayItems = items.filter(
      (item) => !item.name.toLowerCase().includes("discount")
    );

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Refund Receipt</title>
        <style>
          @page {
            size: 80mm 297mm;
            margin: 0;
          }
          html, body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            width: 100%;
            font-size: 10pt;
          }
          .receipt {
            width: 76mm;
            padding: 5mm 2mm;
            margin: 0 auto;
          }
          .receipt-header {
            text-align: center;
            margin-bottom: 10px;
          }
          .receipt-header h1 {
            font-size: 14pt;
            margin: 0;
            font-weight: bold;
          }
          .receipt-header p {
            font-size: 8pt;
            margin: 2px 0;
            color: #555;
          }
          .receipt-divider {
            border-top: 1px dashed #000;
            margin: 5px 0;
          }
          .receipt-info {
            font-size: 9pt;
            margin: 5px 0;
          }
          .receipt-info p {
            margin: 2px 0;
            display: flex;
            justify-content: space-between;
          }
          .receipt-title {
            text-align: center;
            font-weight: bold;
            margin: 10px 0;
            font-size: 11pt;
            color: #D9534F;
          }
          .receipt-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 8pt;
          }
          .receipt-table th, .receipt-table td {
            text-align: left;
            padding: 2px 0;
          }
          .receipt-table .qty {
            width: 10%;
            text-align: left;
          }
          .receipt-table .description {
            width: 50%;
            text-align: left;
          }
          .receipt-table .price {
            width: 20%;
            text-align: right;
          }
          .receipt-table .amount {
            width: 20%;
            text-align: right;
          }
          .receipt-summary {
            margin: 10px 0;
            font-size: 9pt;
          }
          .receipt-summary table {
            width: 100%;
          }
          .receipt-summary td {
            padding: 2px 0;
          }
          .receipt-summary .total-amount {
            text-align: right;
          }
          .receipt-summary .total-label {
            font-weight: bold;
          }
          .receipt-footer {
            margin-top: 15px;
            font-size: 8pt;
            text-align: center;
          }
          .receipt-footer p {
            margin: 2px 0;
          }
          .discount-row {
            color: #D9534F;
            font-weight: bold;
          }
          .original-receipt {
            font-size: 9pt;
            margin: 5px 0;
            font-style: italic;
          }
          .item-details {
            font-size: 7pt;
            color: #555;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="receipt-header">
            <h1>H Automotives</h1>
            <p>Saham, Sultanate of Oman</p>
            <p>Ph: 92510750 | 26856848</p>
            <p>VATIN: OM1100006980</p>
          </div>
          
          <div class="receipt-divider"></div>
          
          <div class="receipt-title">REFUND RECEIPT</div>
          
          <div class="receipt-info">
            <p>
              <span>Original Receipt: ${originalReceiptNumber}</span>
            </p>
            <p>
              <span>Date: ${currentDate}</span>
            </p>
            <p>
              <span>Time: ${currentTime}</span>
              <span>POS ID: ${receiptNumber}</span>
            </p>
            ${customerName ? `<p>Customer: ${customerName}</p>` : ""}
          </div>
          
          <div class="receipt-divider"></div>
          
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
              ${displayItems
                .map(
                  (item) => `
                <tr>
                  <td class="qty">${item.quantity}</td>
                  <td class="description">${formatItemName(item)}</td>
                  <td class="price">${item.price.toFixed(3)}</td>
                  <td class="amount">${(item.price * item.quantity).toFixed(
                    3
                  )}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          
          <div class="receipt-divider"></div>
          
          <div class="receipt-summary">
            <table>
              <tr>
                <td>Total w/o VAT</td>
                <td class="total-amount">OMR ${subtotal.toFixed(3)}</td>
              </tr>
              <tr>
                <td>VAT</td>
                <td class="total-amount">OMR ${vat.toFixed(3)}</td>
              </tr>
              <tr>
                <td class="total-label">TOTAL REFUND:</td>
                <td class="total-amount" style="font-weight: bold; color: #D9534F;">OMR ${refundAmount.toFixed(
                  3
                )}</td>
              </tr>
            </table>
          </div>
          
          <div class="receipt-footer">
            <p>Number of Items: ${displayItems.reduce(
              (sum, item) => sum + item.quantity,
              0
            )}</p>
            ${cashier ? `<p>Cashier: ${cashier}</p>` : ""}
            <div class="receipt-divider"></div>
            <p>Thank you for shopping with us</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = useCallback(() => {
    const content = receiptRef.current;
    if (!content || !isClient) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the refund receipt.");
      return;
    }

    const htmlContent = generateReceiptHTML();

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.document.title = "Refund Receipt";

    setTimeout(() => {
      printWindow.print();
      // Don't automatically close the print window on mobile devices
      if (
        !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      ) {
        // Removed auto close to prevent about:blank text
        // printWindow.close();
      }
    }, 500);
  }, [
    isClient,
    items,
    receiptNumber,
    originalReceiptNumber,
    currentDate,
    currentTime,
    customerName,
    cashier,
    refundAmount,
    subtotal,
    vat,
  ]);

  if (!isClient) {
    return null;
  }

  // Filter out discount items from preview display
  const displayItems = items.filter(
    (item) => !item.name.toLowerCase().includes("discount")
  );

  // Calculate the number of items
  const itemCount = displayItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
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
          <p className="text-xs font-medium text-center text-red-600 uppercase">
            Refund Receipt
          </p>
          <div className="flex justify-between text-xs">
            <span>Original Receipt: {originalReceiptNumber}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Date: {currentDate}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Time: {currentTime}</span>
            <span>POS ID: {receiptNumber}</span>
          </div>
          {customerName && (
            <div className="text-xs">
              <span>Customer: {customerName}</span>
            </div>
          )}
        </div>

        <div className="text-xs mb-3">
          <div className="grid grid-cols-12 gap-1 font-medium mb-1">
            <span className="col-span-1">Qty.</span>
            <span className="col-span-7">Description</span>
            <span className="col-span-2 text-right">Price</span>
            <span className="col-span-2 text-right">Amount</span>
          </div>

          {displayItems.map((item) => (
            <div key={item.uniqueId} className="grid grid-cols-12 gap-1 mb-1">
              <span className="col-span-1">{item.quantity}</span>
              <span className="col-span-7 break-words">
                {formatItemName(item)}
              </span>
              <span className="col-span-2 text-right">
                {item.price.toFixed(3)}
              </span>
              <span className="col-span-2 text-right">
                {(item.price * item.quantity).toFixed(3)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed pt-2 mb-3">
          <div className="flex justify-between text-xs">
            <span>Total w/o VAT</span>
            <span>OMR {subtotal.toFixed(3)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>VAT</span>
            <span>OMR {vat.toFixed(3)}</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-red-600">
            <span>Total Refund</span>
            <span>OMR {refundAmount.toFixed(3)}</span>
          </div>
        </div>

        <div className="text-center text-xs border-t border-dashed pt-2">
          <p>Number of Items: {itemCount}</p>
          {cashier && <p>Cashier: {cashier}</p>}
          <p className="text-xs italic mt-2">Thank you for shopping with us</p>
        </div>
      </div>

      {!hidePrintButton && (
        <Button
          onClick={handlePrint}
          className="w-full mt-4 flex items-center justify-center gap-2"
        >
          <Printer className="h-4 w-4" /> Print Receipt
        </Button>
      )}
    </motion.div>
  );
};

export default RefundReceipt;
