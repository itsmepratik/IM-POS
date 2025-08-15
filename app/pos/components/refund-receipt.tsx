"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCompanyInfo } from "@/lib/hooks/useCompanyInfo";

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
const POS_ID_FALLBACK = "POS-01";

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
  const { brand } = useCompanyInfo();

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
          body { font-family: sans-serif !important; padding: 0; margin: 0; width: 80mm; font-size: 12px; }
          * { font-family: sans-serif !important; }
          .receipt { width: 76mm; padding: 5mm 2mm; margin: 0 auto; }
          .receipt-header { text-align: center; margin-bottom: 10px; }
          .receipt-header h1 { font-size: 16px; margin: 0; font-weight: bold; }
          .receipt-header p { font-size: 12px; margin: 2px 0; color: #555; }
          .receipt-divider { border-top: 1px dashed #000; margin: 5px 0; }
          .receipt-info { font-size: 12px; margin: 5px 0; }
          .receipt-info p { margin: 2px 0; display: flex; justify-content: space-between; align-items: center; }
          .receipt-title { text-align: center; font-weight: bold; margin: 10px 0; font-size: 13px; color: #D9534F; text-transform: uppercase; }
          .receipt-table { width: 100%; border-collapse: collapse; margin: 10px 0; table-layout: fixed; }
          .receipt-table th { text-align: left; font-size: 12px; padding-bottom: 5px; }
          .receipt-table td { font-size: 12px; padding: 2px 0; word-wrap: break-word; word-break: break-word; }
          .receipt-table .sno { width: 20px; }
          .receipt-table .description { width: auto; }
          .receipt-table .price { width: 44px; text-align: right; padding-right: 3px; }
          .receipt-table .qty { width: 24px; text-align: center; padding-left: 8px; padding-right: 3px; }
          .receipt-table .amount { width: 64px; text-align: right; padding-left: 21px; }
          .receipt-table .row-top td { padding-bottom: 0; }
          .receipt-table .row-bottom td { padding-top: 0; }
          .receipt-table .price, .receipt-table .amount, .receipt-table .qty { white-space: nowrap; word-break: keep-all; font-variant-numeric: tabular-nums; }
          .receipt-summary { margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
          .receipt-summary table { width: 100%; }
          .receipt-summary td { font-size: 12px; padding: 2px 0; }
          .receipt-summary .total-label { font-weight: bold; }
          .receipt-summary .total-amount { text-align: right; font-weight: bold; }
          .receipt-footer { margin-top: 10px; text-align: center; font-size: 12px; border-top: 1px dashed #000; padding-top: 5px; }
          .receipt-footer p { margin: 3px 0; }
          .arabic { font-size: 11px; direction: rtl; margin: 2px 0; }
          @media print { body { width: 80mm; margin: 0; padding: 0; } @page { margin: 0; size: 80mm auto; } }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="receipt-header">
            <h1>${brand.name}</h1>
            <p>${brand.addressLines.join(" ")}</p>
            <p>Ph: ${brand.phones.join(" | ")}</p>
          </div>
          
          <div class="receipt-divider"></div>
          
          <div class="receipt-title">REFUND RECEIPT</div>
          
          <div class="receipt-info">
            <p><span>Refund: ${receiptNumber}</span></p>
            <p><span>Original Invoice: ${originalReceiptNumber}</span></p>
            <p><span>Date: ${currentDate}</span><span>Time: ${currentTime}</span></p>
            ${
              customerName
                ? `<p style="justify-content:flex-start;">Customer: ${customerName}</p>`
                : ""
            }
          </div>
          
          <div class="receipt-divider"></div>
          
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
              ${displayItems
                .map(
                  (item, index) => `
                <tr class="row-top">
                  <td class="sno">${index + 1}</td>
                  <td class="description" colspan="4">${formatItemName(
                    item
                  )}</td>
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
          
          <div class="receipt-divider"></div>
          
          <div class="receipt-summary">
            <table>
              <tr>
                <td>Total w/o VAT</td>
                <td class="total-amount">OMR ${subtotal.toFixed(3)}</td>
              </tr>
              <tr>
                <td class="total-label">TOTAL REFUND</td>
                <td class="total-amount" style="color: #D9534F;">OMR ${refundAmount.toFixed(
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
            <p>Thank you for shopping with us.</p>
            <p class="arabic">شكراً للتسوق معنا</p>
            <p style="font-weight:bold; margin-top:6px;">WhatsApp 72702537 for latest offers</p>
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
    const htmlWithAutoPrint = htmlContent.replace(
      /<\/body>/,
      `<script>
         window.onload = function() {
           setTimeout(function(){
             try { window.focus(); window.print(); } catch (e) { }
           }, 300);
         };
       <\/script></body>`
    );

    printWindow.document.open();
    printWindow.document.write(htmlWithAutoPrint);
    printWindow.document.close();
    printWindow.document.title = "Refund Receipt";
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
          <h3 className="font-bold text-lg">{brand.name}</h3>
          <p className="text-xs text-gray-500">
            {brand.addressLines.join(" ")}
          </p>
          <p className="text-xs text-gray-500">
            Ph: {brand.phones.join(" | ")}
          </p>
        </div>

        <div className="border-t border-b border-dashed py-1 mb-3">
          <p className="text-xs font-medium text-center text-red-600 uppercase">
            Refund Receipt
          </p>
          <div className="flex justify-between text-xs">
            <span className="font-medium">Refund: {receiptNumber}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Original Invoice: {originalReceiptNumber}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Date: {currentDate}</span>
            <span>Time: {currentTime}</span>
          </div>
          {customerName && (
            <div className="text-xs">
              <span>Customer: {customerName}</span>
            </div>
          )}
        </div>

        <div className="text-xs mb-3">
          <div className="grid grid-cols-12 gap-1 font-medium mb-1">
            <span className="col-span-1">#</span>
            <span className="col-span-9">Description</span>
            <span className="col-span-1 text-right">Price</span>
            <span className="col-span-1 text-right">Qty</span>
            <span className="col-span-1 text-right">Amt</span>
          </div>

          {displayItems.map((item, index) => (
            <div key={item.uniqueId} className="mb-1">
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-1">{index + 1}</span>
                <span className="col-span-11 break-words">
                  {formatItemName(item)}
                </span>
              </div>
              <div className="grid grid-cols-12 gap-1">
                <span className="col-span-1"></span>
                <span className="col-span-9"></span>
                <span className="col-span-1 text-right">
                  {item.price.toFixed(3)}
                </span>
                <span className="col-span-1 text-right">
                  (x{item.quantity})
                </span>
                <span className="col-span-1 text-right">
                  {(item.price * item.quantity).toFixed(3)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed pt-2 mb-3">
          <div className="flex justify-between text-xs">
            <span>Total w/o VAT</span>
            <span>OMR {subtotal.toFixed(3)}</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-red-600">
            <span>Total Refund</span>
            <span>OMR {refundAmount.toFixed(3)}</span>
          </div>
        </div>

        <div className="text-center text-xs border-t border-dashed pt-2">
          <p>Number of Items: {itemCount}</p>
          {cashier && <p>Cashier: {cashier}</p>}
          <p>Thank you for shopping with us.</p>
          <p className="text-xs text-right text-gray-600">شكراً للتسوق معنا</p>
          <p className="font-medium mt-2">
            WhatsApp 72702537 for latest offers
          </p>
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
