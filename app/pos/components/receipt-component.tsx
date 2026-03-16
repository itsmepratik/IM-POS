"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  Fragment,
} from "react";
import { useCompanyInfo } from "@/lib/hooks/useCompanyInfo";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { motion } from "framer-motion";
import { generateBarcodeHTML } from "@/lib/utils/barcodeGenerator";

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
  const [barcodeHtml, setBarcodeHtml] = useState<string>("");

  useEffect(() => {
    if (receiptNumber) {
      generateBarcodeHTML(receiptNumber).then(setBarcodeHtml);
    }
  }, [receiptNumber]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowReceipt(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [cart, localDiscount]);

  const handlePrint = useCallback(() => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const discountAmount = localDiscount
      ? localDiscount.type === "percentage"
        ? subtotal * (localDiscount.value / 100)
        : Math.min(localDiscount.value, subtotal)
      : 0;

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
                        .replace(
                          /\s*\(?(\d+(\.\d+)?[Ll])\s+(open|closed)\s+bottle\)?/i,
                          "",
                        ) // Remove "(1L closed bottle)" or similar
                        .replace(/\s*\(?(open|closed)\s+bottle\)?/i, "") // Remove "(open bottle)" etc
                        .trim();

                      // Clean up details similarly
                      let cleanDetails = item.details
                        ? item.details
                            .replace(
                              /\s*\(?(\d+(\.\d+)?[Ll])\s+(open|closed)\s+bottle\)?/i,
                              "$1",
                            ) // Keep size e.g. "1L"
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
                  <td class="total-amount" style="color: #22c55e; font-weight: bold;">- OMR ${discountAmount.toFixed(3)}</td>
                </tr>`
                    : ""
                }
                <tr>
                  <td class="total-label" style="border-top: 1px solid #000; padding-top: 5px;">Total</td>
                  <td class="total-amount" style="border-top: 1px solid #000; padding-top: 5px; font-size: 14px;">OMR ${total.toFixed(3)}</td>
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
            
            ${
              barcodeHtml
                ? `
            <div style="text-align: center; margin-top: 15px; margin-bottom: 5px;">
              ${barcodeHtml}
            </div>
            `
                : ""
            }
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
    receiptNumber,
    currentDate,
    currentTime,
    cashier,
    localDiscount,
    paymentRecipient,
    brand,
    POS_ID,
    barcodeHtml,
  ]);

  if (!showReceipt) return null;

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const discountAmount = localDiscount
    ? localDiscount.type === "percentage"
      ? subtotal * (localDiscount.value / 100)
      : Math.min(localDiscount.value, subtotal)
    : 0;

  const total = subtotal - discountAmount;
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
      <div className="max-h-[55vh] md:max-h-[65vh] overflow-auto mb-4 bg-muted/30 rounded-xl p-4 sm:p-6 flex justify-center items-start border inner-shadow-sm">
        <div
          className="bg-white w-full max-w-[380px] shrink-0 font-sans text-black mx-auto overflow-hidden relative"
          style={{
            boxShadow:
              "rgba(0, 0, 0, 0.1) 0px 4px 6px -1px, rgba(0, 0, 0, 0.06) 0px 2px 4px -1px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px",
          }}
          ref={receiptRef}
        >
          <div
            className="p-[2mm] pt-[4mm] pb-[6mm] px-[3mm]"
            style={{ fontFamily: "sans-serif" }}
          >
            {/* Header */}
            <div className="text-center mb-2.5">
              <h2 className="font-bold text-[16px] leading-[1.2] m-0 tracking-tight text-black">
                {brand.name}
              </h2>
              <p className="text-[12px] m-0 mt-0.5 leading-[1.2] text-black">
                {brand.addressLines.join(" ")}
              </p>
              <p className="text-[12px] m-0 mt-[2px] leading-[1.2] text-black">
                Ph: {brand.phones.join(" | ")}
              </p>
            </div>

            <div className="border-t border-b border-dashed border-black py-1.5 mb-2.5">
              <div className="flex justify-between items-center text-[12px] leading-[1.3] text-black">
                <span>Invoice: {receiptNumber}</span>
                <span>POS ID: {POS_ID}</span>
              </div>
              <div className="flex justify-between items-center text-[12px] leading-[1.3] text-black pt-[2px]">
                <span>Date: {currentDate}</span>
                <span>Time: {currentTime}</span>
              </div>
            </div>

            <table
              className="w-full mb-2.5 table-fixed text-[12px] border-collapse text-black"
              style={{ wordWrap: "break-word" }}
            >
              <thead>
                <tr>
                  <th className="text-left font-normal pb-1.5 w-[20px]">#</th>
                  <th className="text-left font-normal pb-1.5">Description</th>
                  <th className="text-right font-normal pb-1.5 w-[44px]">
                    Price
                  </th>
                  <th className="text-center font-normal pb-1.5 w-[36px] pl-[8px] pr-0">
                    Qty
                  </th>
                  <th className="text-right font-normal pb-1.5 w-[64px] pl-[12px]">
                    Amt
                  </th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, index) => {
                  let cleanName = item.name
                    .replace(
                      /\s*\(?(\d+(\.\d+)?[Ll])\s+(open|closed)\s+bottle\)?/i,
                      "",
                    )
                    .replace(/\s*\(?(open|closed)\s+bottle\)?/i, "")
                    .trim();

                  let cleanDetails = item.details
                    ? item.details
                        .replace(
                          /\s*\(?(\d+(\.\d+)?[Ll])\s+(open|closed)\s+bottle\)?/i,
                          "$1",
                        )
                        .replace(/\s*\(?(open|closed)\s+bottle\)?/i, "")
                        .trim()
                    : "";

                  let displayName = cleanName;
                  if (cleanDetails && !cleanName.includes(cleanDetails)) {
                    displayName = `${cleanName} (${cleanDetails})`;
                  }

                  return (
                    <Fragment key={item.uniqueId}>
                      <tr>
                        <td className="align-top pb-0 text-black pr-1">
                          {index + 1}
                        </td>
                        <td className="align-top pb-0 text-black" colSpan={4}>
                          {displayName}
                        </td>
                      </tr>
                      <tr>
                        <td className="pt-0"></td>
                        <td className="pt-0"></td>
                        <td className="align-top text-right text-black pt-0 pb-1.5 whitespace-nowrap tabular-nums">
                          {item.price.toFixed(3)}
                        </td>
                        <td className="align-top text-center text-black pt-0 pb-1.5 whitespace-nowrap pl-[8px] pr-0 tabular-nums">
                          (x{item.quantity})
                        </td>
                        <td className="align-top text-right text-black pt-0 pb-1.5 whitespace-nowrap pl-[12px] tabular-nums">
                          {(item.price * item.quantity).toFixed(3)}
                        </td>
                      </tr>
                    </Fragment>
                  );
                })}
              </tbody>
            </table>

            <div className="border-t border-dashed border-black pt-1.5 mt-2.5">
              <table className="w-full text-[12px]">
                <tbody>
                  <tr>
                    <td className="font-bold text-black py-[2px] pl-0">
                      Subtotal
                    </td>
                    <td className="font-bold text-right text-black py-[2px] pr-0 tabular-nums">
                      OMR {subtotal.toFixed(3)}
                    </td>
                  </tr>
                  {localDiscount && (
                    <tr className="text-[#22c55e] font-bold">
                      <td className="py-[2px] pl-0">
                        Discount{" "}
                        {localDiscount.type === "percentage"
                          ? `(${localDiscount.value}%)`
                          : "(Amount)"}
                      </td>
                      <td className="text-right py-[2px] pr-0 tabular-nums">
                        - OMR {discountAmount.toFixed(3)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="font-bold text-black pt-[5px] pb-0 border-t border-black mt-1 pl-0">
                      Total
                    </td>
                    <td className="font-bold text-right text-black pt-[5px] pb-0 border-t border-black mt-1 text-[14px] pr-0 tabular-nums">
                      OMR {total.toFixed(3)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="border-t border-dashed border-black pt-1.5 mt-2.5 text-center text-[12px] text-black">
              <p className="m-0 my-[3px]">Number of Items: {itemCount}</p>
              <p className="m-0 my-[3px]">
                Payment Method: {getFormattedPaymentMethod(paymentMethod)}
              </p>
              {paymentMethod === "mobile" && paymentRecipient && (
                <p className="m-0 my-[3px]">
                  Mobile Payment Recipient: {paymentRecipient}
                </p>
              )}
              {cashier && <p className="m-0 my-[3px]">Cashier: {cashier}</p>}
              <p className="m-0 my-[3px]">
                Keep this Invoice for your Exchanges
              </p>
              <p className="m-0 my-[2px] text-[11px]" dir="rtl">
                احتفظ بهذه الفاتورة للتبديل
              </p>
              <p className="m-0 my-[3px]">Exchange with in 15 Days</p>
              <p className="m-0 my-[2px] text-[11px]" dir="rtl">
                التبديل خلال 15 يوم
              </p>
              <p className="m-0 my-[3px]">Thank you for shopping with us.</p>
              <p className="m-0 my-[2px] text-[11px]" dir="rtl">
                شكراً للتسوق معنا
              </p>
            </div>

            <div className="text-center text-[11px] font-bold mt-[5px] text-black">
              WhatsApp {brand.whatsapp || ""} for latest offers
            </div>

            {barcodeHtml && (
              <div
                className="flex justify-center mt-[15px] mb-[5px]"
                dangerouslySetInnerHTML={{ __html: barcodeHtml }}
              />
            )}
          </div>

          {/* Jagged bottom edge representation */}
          <div className="absolute bottom-0 left-0 w-full h-[6px] overflow-hidden opacity-20 flex">
            {Array.from({ length: 60 }).map((_, i) => (
              <div
                key={i}
                className="w-[8px] h-[8px] bg-gray-300 transform rotate-45 translate-y-[4px] -ml-[4px]"
              ></div>
            ))}
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
