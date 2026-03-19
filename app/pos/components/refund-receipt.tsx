"use client";

import React, {
  useRef,
  useCallback,
  useEffect,
  useState,
  Fragment,
} from "react";
import { Printer } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useCompanyInfo } from "@/lib/hooks/useCompanyInfo";
import { generateBarcodeHTML } from "@/lib/utils/barcodeGenerator";

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
  onClose?: () => void;
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
  onClose,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [barcodeHtml, setBarcodeHtml] = useState<string>("");
  const { brand } = useCompanyInfo();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (receiptNumber) {
      generateBarcodeHTML(receiptNumber).then(setBarcodeHtml);
    }
  }, [receiptNumber]);

  // Determine if this is a receipt with only battery items
  const isOnlyBatteryItems = items.every(
    (item) =>
      item.name.toLowerCase().includes("battery") ||
      (item.uniqueId && item.uniqueId.includes("battery")),
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

  // Calculate subtotal
  const subtotal = refundAmount;

  // Generate HTML for print window with product type-specific formatting
  const generateReceiptHTML = () => {
    // Filter out discount items from display
    const displayItems = items.filter(
      (item) => !item.name.toLowerCase().includes("discount"),
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
                    item,
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
                    3,
                  )}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
          
          <div class="receipt-divider"></div>
          
          <div class="receipt-summary">
            <table>
              <tr>
                <td class="total-label">Subtotal</td>
                <td class="total-amount">OMR ${subtotal.toFixed(3)}</td>
              </tr>
              <tr>
                <td class="total-label">TOTAL REFUND</td>
                <td class="total-amount" style="color: #D9534F; font-size: 14px; border-top: 1px solid #000; padding-top: 5px;">OMR ${refundAmount.toFixed(
                  3,
                )}</td>
              </tr>
            </table>
          </div>
          
          <div class="receipt-footer">
            <p>Number of Items: ${displayItems.reduce(
              (sum, item) => sum + item.quantity,
              0,
            )}</p>
            ${cashier ? `<p>Cashier: ${cashier}</p>` : ""}
            <p>Thank you for shopping with us.</p>
            <p class="arabic">شكراً للتسوق معنا</p>
            <p style="font-weight:bold; margin-top:6px;">WhatsApp ${brand.whatsapp || ""} for latest offers</p>
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
       <\/script></body>`,
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
    barcodeHtml,
  ]);

  if (!isClient) {
    return null;
  }

  // Filter out discount items from preview display
  const displayItems = items.filter(
    (item) => !item.name.toLowerCase().includes("discount"),
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
            className="p-[5mm] px-[2mm]"
            style={{ fontFamily: "sans-serif" }}
          >
            {/* Receipt Preview */}
            <div className="text-center mb-2.5">
              <h1 className="font-bold text-[16px] leading-[1.2] m-0 tracking-tight text-black">
                {brand.name}
              </h1>
              <p className="text-[12px] m-0 mt-[2px] text-[#555] leading-[1.2]">
                {brand.addressLines.join(" ")}
              </p>
              <p className="text-[12px] m-0 mt-[2px] text-[#555] leading-[1.2]">
                Ph: {brand.phones.join(" | ")}
              </p>
            </div>

            <div className="border-t border-dashed border-black my-[5px]"></div>

            <div className="text-center font-bold my-[10px] text-[13px] text-[#D9534F] uppercase">
              REFUND RECEIPT
            </div>

            <div className="text-[12px] my-[5px]">
              <p className="m-0 my-[2px] flex justify-between items-center text-black">
                <span>Refund: {receiptNumber}</span>
              </p>
              <p className="m-0 my-[2px] flex justify-between items-center text-black">
                <span>Original Invoice: {originalReceiptNumber}</span>
              </p>
              <p className="m-0 my-[2px] flex justify-between items-center text-black">
                <span>Date: {currentDate}</span>
                <span>Time: {currentTime}</span>
              </p>
              {customerName && (
                <p className="m-0 my-[2px] flex justify-start items-center text-black">
                  Customer: {customerName}
                </p>
              )}
            </div>

            <div className="border-t border-dashed border-black my-[5px]"></div>

            <table
              className="w-full my-[10px] table-fixed text-[12px] border-collapse text-black"
              style={{ wordWrap: "break-word" }}
            >
              <thead>
                <tr>
                  <th className="text-left font-normal pb-[5px] w-[20px]">#</th>
                  <th className="text-left font-normal pb-[5px]">
                    Description
                  </th>
                  <th className="text-right font-normal pb-[5px] w-[44px]">
                    Price
                  </th>
                  <th className="text-center font-normal pb-[5px] w-[24px] pl-[8px] pr-[3px]">
                    Qty
                  </th>
                  <th className="text-right font-normal pb-[5px] w-[64px] pl-[21px]">
                    Amt
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayItems.map((item, index) => (
                  <Fragment key={item.uniqueId}>
                    <tr>
                      <td className="align-top pb-0 text-black">{index + 1}</td>
                      <td className="align-top pb-0 text-black" colSpan={4}>
                        {formatItemName(item)}
                      </td>
                    </tr>
                    <tr>
                      <td className="pt-0"></td>
                      <td className="pt-0"></td>
                      <td className="align-top text-right text-black pt-0 pb-0 whitespace-nowrap tabular-nums">
                        {item.price.toFixed(3)}
                      </td>
                      <td className="align-top text-center text-black pt-0 pb-0 whitespace-nowrap pl-[8px] pr-[3px] tabular-nums">
                        (x{item.quantity})
                      </td>
                      <td className="align-top text-right text-black pt-0 pb-0 whitespace-nowrap pl-[21px] tabular-nums">
                        {(item.price * item.quantity).toFixed(3)}
                      </td>
                    </tr>
                  </Fragment>
                ))}
              </tbody>
            </table>

            <div className="border-t border-dashed border-black my-[5px]"></div>

            <div className="mt-[10px] pt-[5px]">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="font-bold text-[12px] py-[2px] text-black">
                      Subtotal
                    </td>
                    <td className="font-bold text-right text-[12px] py-[2px] text-black tabular-nums">
                      OMR {subtotal.toFixed(3)}
                    </td>
                  </tr>
                  <tr>
                    <td className="font-bold text-[12px] py-[2px] text-black">
                      TOTAL REFUND
                    </td>
                    <td className="font-bold text-right text-[#D9534F] py-[2px] text-[14px] border-t border-black pt-[5px] tabular-nums">
                      OMR {refundAmount.toFixed(3)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-[10px] text-center text-[12px] border-t border-dashed border-black pt-[5px] text-black">
              <p className="m-0 my-[3px]">Number of Items: {itemCount}</p>
              {cashier && <p className="m-0 my-[3px]">Cashier: {cashier}</p>}
              <p className="m-0 my-[3px]">Thank you for shopping with us.</p>
              <p className="m-0 my-[2px] text-[11px]" dir="rtl">
                شكراً للتسوق معنا
              </p>
              <p className="font-bold mt-[6px] m-0">
                WhatsApp {brand.whatsapp || ""} for latest offers
              </p>
            </div>

            {barcodeHtml && (
              <div
                className="flex justify-center mt-[15px] mb-[5px]"
                dangerouslySetInnerHTML={{ __html: barcodeHtml }}
              />
            )}
            <div className="h-[4px]" />
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

      {!hidePrintButton && (
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
            onClick={handlePrint}
            variant="chonky"
            className={`flex items-center justify-center gap-2 ${
              onClose ? "flex-1" : "w-full"
            }`}
          >
            <Printer className="h-4 w-4" /> Print Receipt
          </Button>
        </div>
      )}
    </motion.div>
  );
};

export default RefundReceipt;
