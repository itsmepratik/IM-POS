"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useCompanyInfo } from "@/lib/hooks/useCompanyInfo";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { motion } from "framer-motion";

interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  details?: string;
  uniqueId: string;
  bottleType?: "open" | "closed";
  category?: string;
  brand?: string;
  type?: string;
  source?: string;
}

interface ReceiptComponentProps {
  cart: CartItem[];
  paymentMethod: string;
  cashier?: string;
  discount?: { type: "percentage" | "amount"; value: number } | null;
  paymentRecipient?: string | null;
  receiptNumber: string;
  currentDate: string;
  currentTime: string;
  onClose?: () => void;
}

export const ReceiptComponent = ({
  cart,
  paymentMethod,
  cashier,
  discount,
  paymentRecipient,
  receiptNumber,
  currentDate,
  currentTime,
  onClose,
}: ReceiptComponentProps) => {
  const { brand } = useCompanyInfo();
  const POS_ID = brand.posId || "";

  const [localDiscount, setLocalDiscount] = useState(discount);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    if (discount) {
      setLocalDiscount(discount);
    }
  }, [discount]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowReceipt(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [cart, localDiscount]);

  const handlePrint = useCallback(() => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const discountAmount = localDiscount
      ? localDiscount.type === "percentage"
        ? subtotal * (localDiscount.value / 100)
        : Math.min(localDiscount.value, subtotal)
      : 0;

    // Calculate VAT (5%)
    const vat = (subtotal - discountAmount) * 0.05;
    const total = subtotal - discountAmount + vat;

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
              padding: 2px 0;
              word-wrap: break-word;
              word-break: break-word;
            }
            .receipt-table .sno { width: 20px; }
            .receipt-table .qty { width: 12px; text-align: center; padding-left: 8px; padding-right: 0px; border-spacing: 0; }
            .receipt-table .description { width: auto; max-width: 100%; }
            .receipt-table .description .name { display:inline-block; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .receipt-table .price { width: 44px; text-align: right; padding-right: 3px; }
            .receipt-table .amount { width: 64px; text-align: right; padding-left: 21px; }
            .receipt-table .price,
            .receipt-table .amount,
            .receipt-table .qty {
              white-space: nowrap;
              word-break: keep-all;
              font-variant-numeric: tabular-nums;
            }
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
                        .replace(/\s*\(?(\d+(\.\d+)?[Ll])\s+(open|closed)\s+bottle\)?/i, "") // Remove "(1L closed bottle)" or similar
                        .replace(/\s*\(?(open|closed)\s+bottle\)?/i, "") // Remove "(open bottle)" etc
                        .trim();
                      
                      // Clean up details similarly
                      let cleanDetails = item.details 
                        ? item.details
                            .replace(/\s*\(?(\d+(\.\d+)?[Ll])\s+(open|closed)\s+bottle\)?/i, "$1") // Keep size e.g. "1L"
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
                    <td class="amount">${(item.price * item.quantity).toFixed(3)}</td>
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
                  <td class="total-amount" style="color: #22c55e; font-weight: bold;">- OMR ${discountAmount.toFixed(3)}</td>
                </tr>`
                    : ""
                }
                <tr>
                  <td>VAT (5%)</td>
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
    receiptNumber,
    currentDate,
    currentTime,
    cashier,
    localDiscount,
    paymentRecipient,
    brand,
    POS_ID,
  ]);

  if (!showReceipt) return null;

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const discountAmount = localDiscount
    ? localDiscount.type === "percentage"
      ? subtotal * (localDiscount.value / 100)
      : Math.min(localDiscount.value, subtotal)
    : 0;

  // Calculate VAT (5%)
  const vat = (subtotal - discountAmount) * 0.05;
  const total = subtotal - discountAmount + vat;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

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
              <span className="col-span-5">Description</span>
              <span className="col-span-2 text-right">Price</span>
              <span className="col-span-2 text-right">Amount</span>
            </div>

            {cart.map((item, index) => (
              <div key={item.uniqueId} className="grid grid-cols-12 gap-1 mb-1 text-foreground">
                <span className="col-span-1">{index + 1}</span>
                <span className="col-span-2">(x{item.quantity})</span>
                <span className="col-span-5 break-words">
                  {(() => {
                      // Clean up name by removing bottle info if present
                      let cleanName = item.name
                        .replace(/\s*\(?(\d+(\.\d+)?[Ll])\s+(open|closed)\s+bottle\)?/i, "") // Remove "(1L closed bottle)" or similar
                        .replace(/\s*\(?(open|closed)\s+bottle\)?/i, "") // Remove "(open bottle)" etc
                        .trim();
                      
                      // Clean up details similarly
                      let cleanDetails = item.details 
                        ? item.details
                            .replace(/\s*\(?(\d+(\.\d+)?[Ll])\s+(open|closed)\s+bottle\)?/i, "$1") // Keep size e.g. "1L"
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
          </div>
        </div>
      </div>

      <div className="flex flex-row gap-4 mt-4">
        {onClose && (
          <Button
            variant="chonky-secondary"
            onClick={onClose}
            className="flex-1"
          >
            Close
          </Button>
        )}
        <Button
          variant="chonky"
          onClick={handlePrint}
          className="flex-1 flex items-center justify-center gap-2"
        >
          <Printer className="h-4 w-4" />
          Print Receipt
        </Button>
      </div>
    </motion.div>
  );
};



