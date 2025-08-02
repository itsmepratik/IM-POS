"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { motion } from "framer-motion";

// Define the structure for cart items consistent with POSPage
interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  details?: string;
  uniqueId: string;
  bottleType?: "open" | "closed";
}

interface BillComponentProps {
  cart: CartItem[];
  billNumber: string;
  currentDate: string;
  currentTime: string;
  customerName?: string;
  cashier?: string;
  appliedDiscount?: { type: "percentage" | "amount"; value: number } | null;
  appliedTradeInAmount?: number;
  hideButton?: boolean;
  isWarrantyClaim?: boolean;
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

const thankYouMessage = "Thankyou for shopping with us\nشكراً للتسوق معنا";

export const BillComponent: React.FC<BillComponentProps> = ({
  cart,
  billNumber,
  currentDate,
  currentTime,
  customerName = "",
  cashier,
  appliedDiscount,
  appliedTradeInAmount,
  hideButton = false,
  isWarrantyClaim = false,
}) => {
  const billRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handlePrint = useCallback(() => {
    const content = billRef.current;
    if (!content || !isClient) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to print the bill.");
      return;
    }

    let subtotalForBill = 0;
    let oldBatteryDiscountAmount = 0;
    const billItems = cart.filter((item) => {
      if (item.name.toLowerCase().includes("discount on old battery")) {
        oldBatteryDiscountAmount += Math.abs(item.price * item.quantity);
        return false;
      }
      subtotalForBill += item.price * item.quantity;
      return true;
    });

    let mainDiscountAmount = 0;
    if (appliedDiscount) {
      if (appliedDiscount.type === "percentage") {
        mainDiscountAmount = subtotalForBill * (appliedDiscount.value / 100);
      } else {
        mainDiscountAmount = Math.min(appliedDiscount.value, subtotalForBill);
      }
    }

    const subtotalAfterMainDiscount = subtotalForBill - mainDiscountAmount;
    const finalTradeInAmount = appliedTradeInAmount || 0;
    const totalAmount = Math.max(
      0,
      subtotalAfterMainDiscount - finalTradeInAmount - oldBatteryDiscountAmount
    );

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title></title>
        <style>
          @page {
            size: A5;
            margin: 0;
            margin-top: 0.35cm;
            margin-bottom: 0.40cm;
          }
          html, body {
            height: 100%; /* Ensure html and body take full height */
            margin: 0;
            padding: 0;
            font-family: sans-serif !important;
          }
          body {
            font-family: sans-serif !important;
            font-size: 10pt;
            line-height: 1.3;
            width: 100%;
            color: #000;
          }
          * {
            font-family: sans-serif !important;
          }
          .bill-container {
            width: calc(100% - 4mm); 
            height: 100%; /* Make bill container take full printable height */
            padding: 2mm;
            margin: 0 auto; 
            box-sizing: border-box;
            display: flex; /* Enable flexbox for vertical alignment */
            flex-direction: column; /* Stack children vertically */
            justify-content: space-between; /* Push footer to bottom */
          }
          /* Header styling */
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
          }
          .header-table td {
            vertical-align: top;
            padding: 0;
          }
          .left-header {
            width: 30%;
            text-align: left;
            font-size: 13.5px !important;
            -webkit-text-size-adjust: none;
          }
          .center-header {
            width: 40%;
            text-align: center;
          }
          .right-header {
            width: 30%;
            text-align: right;
            font-size: 12.5px !important;
            -webkit-text-size-adjust: none;
            direction: rtl;
          }
          .company-name {
            color: #0000CC;
            font-size: 16.5px;
            font-weight: bold;
            text-transform: uppercase;
            white-space: nowrap;
          }
          .company-arabic-name {
            color: #0000CC;
            font-size: 15.5px;
            font-weight: bold;
            margin-top: 2px;
          }
          .cr-number {
            font-weight: normal;
          }
          /* Service description */
          .service-description {
            text-align: center;
            font-weight: bold;
            font-size: 13.5px;
            margin: 15px 0;
            padding: 6px 0;
          }
          .service-description-arabic {
            font-size: 12.5px;
            margin-top: 2px;
          }
          /* Warranty claim text */
          .warranty-claim-text {
            text-align: center;
            font-weight: bold;
            font-size: 9px;
            margin-top: 5px;
            color: #D9534F;
            display: block;
          }
          .warranty-claim-text-arabic {
            font-size: 8px;
            margin-top: 2px;
            color: #D9534F;
            display: block;
          }
          /* Bill info */
          .bill-info-table {
            width: 100%;
            margin-bottom: 12px;
          }
          .bill-info-table td {
            vertical-align: top;
            padding: 0;
          }
          .bill-number {
            text-align: left;
            font-size: 13.5px;
          }
          .print-date {
            text-align: right;
            font-size: 13.5px;
          }
          .customer-info {
            text-align: left;
            font-size: 13.5px;
            font-weight: bold;
            margin-bottom: 8px;
          }
          .customer-name {
            font-weight: normal;
          }
          .car-plate {
            text-align: right;
            font-size: 13.5px;
            font-weight: bold;
          }
          .plate-number {
            font-weight: normal;
          }
          /* Items table */
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 13.5px;
          }
          .items-table th, .items-table td {
            padding: 6px 5px;
            text-align: left;
          }
          .items-table th {
            font-weight: bold;
          }
          .items-table td, .items-table th {
            border-bottom: 1px solid #ddd;
          }
          .items-table th:nth-child(3), .items-table td:nth-child(3),
          .items-table th:nth-child(4), .items-table td:nth-child(4),
          .items-table th:nth-child(5), .items-table td:nth-child(5) {
            text-align: right;
          }
          .items-table tr:last-child td {
            border-bottom: none;
          }

          /* Summary section */
          .summary-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13.5px;
          }
          .summary-table td {
            padding: 3px 0;
          }
          .summary-table .label {
            text-align: left;
          }
          .summary-table .amount {
            text-align: right;
            font-weight: bold;
          }
          .summary-divider {
            border-top: 1px solid #000;
            margin: 6px 0;
          }
          .total-row {
            font-weight: bold;
            font-size: 15.5px;
            color: #0000CC;
          }
          
          /* Footer section */
          .cashier-section {
            display: flex;
            justify-content: space-between;
            margin-top: 5px;
            margin-bottom: 0;
            font-size: 12.5px !important;
            -webkit-text-size-adjust: none;
          }
          .cashier-info {
            text-align: left;
          }
          .signature-line {
            text-align: right;
          }
          .signature-line .line {
            display: inline-block;
            border-top: 1px solid #777;
            width: 150px;
            text-align: center;
            padding-top: 3px;
            font-size: 12.5px !important;
            -webkit-text-size-adjust: none;
            color: #777;
          }
          .footer {
            text-align: center;
            font-size: 12.5px !important;
            -webkit-text-size-adjust: none;
            color: #333;
            width: 100%;
            padding-top: 0;
            margin-top: 0;
            margin-bottom: 0;
            position: relative;
            left: 0;
            right: 0;
          }
          .footer-contact {
            font-weight: bold;
            margin-bottom: 1px;
          }
          .footer-phone-numbers {
            margin-bottom: 1px;
          }
          .footer-thank-you {
            font-style: italic;
            font-size: 12.5px !important;
            -webkit-text-size-adjust: none;
            line-height: 1.2;
          }
        </style>
      </head>
      <body>
        <div class="bill-container">
          <!-- Header with three columns -->
          <table class="header-table">
            <tr>
              <td class="left-header">
                <div>C.R. No.: ${companyDetails.crNumber}</div>
                <div>${companyDetails.addressLine1}</div>
                <div>${companyDetails.addressLine2}</div>
                <div>${companyDetails.addressLine3}</div>
              </td>
              <td class="center-header">
                <div class="company-name">${companyDetails.name}</div>
                <div class="company-arabic-name">${
                  companyDetails.arabicName
                }</div>
              </td>
              <td class="right-header">
                <div class="cr-number">السجل التجاري: ${
                  companyDetails.crNumber
                }</div>
                <div>ولاية صحم</div>
                <div>الصناعية</div>
                <div>سلطنة عمان</div>
              </td>
            </tr>
          </table>

          <!-- Service description -->
          <div class="service-description">
            ${serviceDescription.english}
            <div class="service-description-arabic">${
              serviceDescription.arabic
            }</div>
          </div>
          
                      ${
                        isWarrantyClaim
                          ? `<!-- Warranty claim text -->
                   <div style="text-align: center; font-weight: bold; font-size: 13.5px; margin: 8px 0; color: #D9534F; border-bottom: 1px solid #ccc; padding-bottom: 6px;">
                     <span style="border: 1px solid #D9534F; padding: 2px 8px; display: inline-block;">WARRANTY CLAIM CERTIFICATE</span>
                     <div style="font-size: 13.5px; margin-top: 4px; color: #D9534F;">شهادة ضمان</div>
                   </div>`
                          : ""
                      }

          <!-- Bill info with two columns -->
          <table class="bill-info-table" style="width: 100%;">
            <tr>
              <td class="bill-number">Bill no.: ${billNumber}</td>
              <td class="print-date">Printed on: ${currentDate} ${currentTime}</td>
            </tr>
          </table>
          <div style="width: 100%; border-bottom: 1px dashed #999; margin: 3px 0;"></div>

          <!-- Customer info with two columns -->
          <table class="bill-info-table">
            <tr>
              <td class="customer-info">To, Mr./Mrs.: <span class="customer-name">${
                customerName || ""
              }</span></td>
              <td class="car-plate">${
                isWarrantyClaim
                  ? "Warranty Type: Battery"
                  : `Car Plate: <span class="plate-number">1456 B</span>`
              }</td>
            </tr>
          </table>

          <!-- Items table -->
          <table class="items-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${billItems
                .map(
                  (item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.name}${
                    item.details ? " (" + item.details + ")" : ""
                  }</td>
                  <td>${item.quantity}</td>
                  <td>${item.price.toFixed(3)}</td>
                  <td>${(item.price * item.quantity).toFixed(3)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <!-- Summary section -->
          <table class="summary-table">
            <tr>
              <td class="label">Subtotal</td>
              <td class="amount">${subtotalForBill.toFixed(3)}</td>
            </tr>
            ${
              finalTradeInAmount > 0
                ? `
              <tr style="color: #D9534E;">
                <td class="label">Trade-In Amount</td>
                <td class="amount" style="color: #D9534E;">- ${finalTradeInAmount.toFixed(
                  3
                )}</td>
              </tr>
            `
                : ""
            }
            ${
              mainDiscountAmount > 0
                ? `
              <tr style="color: #D9534E;">
                <td class="label">Discount ${
                  appliedDiscount?.type === "percentage"
                    ? `(${appliedDiscount.value}%)`
                    : `(Amount)`
                }</td>
                <td class="amount" style="color: #D9534E;">- ${mainDiscountAmount.toFixed(
                  3
                )}</td>
              </tr>
            `
                : ""
            }
            ${
              oldBatteryDiscountAmount > 0
                ? `
              <tr style="color: #D9534E;">
                <td class="label">Discount on old battery</td>
                <td class="amount" style="color: #D9534E;">- ${oldBatteryDiscountAmount.toFixed(
                  3
                )}</td>
              </tr>
            `
                : ""
            }
          </table>
          
          <div class="summary-divider"></div>
          
          <table class="summary-table">
            <tr class="total-row">
              <td class="label">${
                isWarrantyClaim ? "WARRANTY AMOUNT:" : "TOTAL AMOUNT:"
              }</td>
              <td class="amount">${totalAmount.toFixed(3)} OMR</td>
            </tr>
          </table>
          
          <div style="flex-grow: 1;"></div>
          
          <div class="cashier-section">
            <div class="cashier-info">Cashier: ${cashier || ""}</div>
            <div class="signature-line">
              <div class="line">Authorized Signature</div>
            </div>
          </div>

          <div class="footer" style="border-top: none;">
            <div class="footer-contact">Contact no.: ${
              companyDetails.contactNumber
            }</div>
            <div class="footer-phone-numbers" style="direction: rtl;">رقم الاتصال: ٧١١٧٠٨٠٥</div>
            <div class="footer-thank-you" style="white-space: pre-line;">${
              isWarrantyClaim
                ? "Thank you for trusting us with your warranty claim\nشكراً لثقتكم بنا"
                : thankYouMessage
            }</div>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.document.title = "";

    setTimeout(() => {
      printWindow.print();
      // Don't automatically close the print window on mobile devices
      // and don't add the about:blank text
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
    cart,
    billNumber,
    currentDate,
    currentTime,
    customerName,
    cashier,
    appliedDiscount,
    appliedTradeInAmount,
  ]);

  if (!isClient) {
    return null;
  }

  let subtotalForDisplay = 0;
  let oldBatteryDiscountForDisplay = 0;
  cart.forEach((item) => {
    if (item.name.toLowerCase().includes("discount on old battery")) {
      oldBatteryDiscountForDisplay += Math.abs(item.price * item.quantity);
    } else {
      subtotalForDisplay += item.price * item.quantity;
    }
  });

  let mainDiscountForDisplay = 0;
  if (appliedDiscount) {
    if (appliedDiscount.type === "percentage") {
      mainDiscountForDisplay =
        subtotalForDisplay * (appliedDiscount.value / 100);
    } else {
      mainDiscountForDisplay = Math.min(
        appliedDiscount.value,
        subtotalForDisplay
      );
    }
  }

  const subtotalAfterMainDiscountDisplay =
    subtotalForDisplay - mainDiscountForDisplay;
  const finalTradeInAmountForDisplay = appliedTradeInAmount || 0;

  const totalAmountForDisplay = Math.max(
    0,
    subtotalAfterMainDiscountDisplay -
      finalTradeInAmountForDisplay -
      oldBatteryDiscountForDisplay
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full flex flex-col"
      data-bill-component
    >
      <div className="max-h-[40vh] overflow-auto mb-4">
        <div
          ref={billRef}
          data-bill-ref
          className="bg-white border rounded-lg p-4 w-full max-w-[400px] mx-auto"
        >
          {/* Header - three column layout */}
          <div className="text-center mb-2">
            <h3 className="font-bold text-lg text-blue-800">
              {companyDetails.name}
            </h3>
            <p className="font-bold text-blue-800 text-sm">
              {companyDetails.arabicName}
            </p>
            <div className="flex text-xs text-gray-500 justify-between mt-1">
              <div className="text-left">
                <div>C.R. No.: {companyDetails.crNumber}</div>
                <div>{companyDetails.addressLine1}</div>
                <div>{companyDetails.addressLine2}</div>
                <div>{companyDetails.addressLine3}</div>
              </div>
              <div className="text-right rtl">
                <div>السجل التجاري: {companyDetails.crNumber}</div>
                <div>ولاية صحم</div>
                <div>الصناعية</div>
                <div>سلطنة عمان</div>
              </div>
            </div>
          </div>

          {/* Service description */}
          <div className="border-t border-dashed py-1">
            <p className="text-xs font-bold text-center">
              {serviceDescription.english}
            </p>
            <p className="text-xs font-bold text-center">
              {serviceDescription.arabic}
            </p>
          </div>

          {isWarrantyClaim && (
            <div className="border-b border-dashed py-1 mb-3">
              <div className="flex justify-center mt-2">
                <span className="text-xs font-bold text-center text-red-600 border border-red-600 px-2 py-0.5">
                  WARRANTY CLAIM CERTIFICATE
                </span>
              </div>
              <p className="text-xs font-bold text-center text-red-600 mt-1">
                شهادة ضمان
              </p>
            </div>
          )}

          {!isWarrantyClaim && (
            <div className="border-b border-dashed mb-3"></div>
          )}

          {/* Bill info */}
          <div className="flex justify-between text-xs">
            <span>Bill no.: {billNumber}</span>
            <span>
              Printed on: {currentDate} {currentTime}
            </span>
          </div>
          <div className="border-t border-dashed my-2"></div>

          {/* Customer info */}
          <div className="flex justify-between text-xs mb-3">
            <span className="font-medium">To, Mr./Mrs.: {customerName}</span>
            <span className="font-medium">
              {isWarrantyClaim ? "Warranty Type: Battery" : "Car Plate: 1456 B"}
            </span>
          </div>

          {/* Items table */}
          <div className="text-xs mb-3">
            <div className="grid grid-cols-12 gap-1 font-medium mb-1">
              <span className="col-span-1">#</span>
              <span className="col-span-5">Item</span>
              <span className="col-span-2 text-right">Qty</span>
              <span className="col-span-2 text-right">Price</span>
              <span className="col-span-2 text-right">Total</span>
            </div>

            {cart
              .filter(
                (item) =>
                  !item.name.toLowerCase().includes("discount on old battery")
              )
              .map((item, index) => (
                <div
                  key={item.uniqueId}
                  className="grid grid-cols-12 gap-1 mb-1"
                >
                  <span className="col-span-1">{index + 1}</span>
                  <span className="col-span-5 break-words">
                    {item.name} {item.details ? `(${item.details})` : ""}
                  </span>
                  <span className="col-span-2 text-right">{item.quantity}</span>
                  <span className="col-span-2 text-right">
                    {item.price.toFixed(3)}
                  </span>
                  <span className="col-span-2 text-right">
                    {(item.price * item.quantity).toFixed(3)}
                  </span>
                </div>
              ))}
          </div>

          {/* Summary section */}
          <div className="border-t border-dashed pt-2 mb-3">
            <div className="flex justify-between text-xs">
              <span>Subtotal</span>
              <span>OMR {subtotalForDisplay.toFixed(3)}</span>
            </div>

            {finalTradeInAmountForDisplay > 0 && (
              <div className="flex justify-between text-xs text-[#D9534E]">
                <span>Trade-In Amount</span>
                <span>- OMR {finalTradeInAmountForDisplay.toFixed(3)}</span>
              </div>
            )}

            {mainDiscountForDisplay > 0 && (
              <div className="flex justify-between text-xs text-[#D9534E]">
                <span>
                  Discount{" "}
                  {appliedDiscount?.type === "percentage"
                    ? `(${appliedDiscount.value}%)`
                    : `(Amount)`}
                </span>
                <span>- OMR {mainDiscountForDisplay.toFixed(3)}</span>
              </div>
            )}

            {oldBatteryDiscountForDisplay > 0 && (
              <div className="flex justify-between text-xs text-[#D9534E]">
                <span>Discount on old battery</span>
                <span>- OMR {oldBatteryDiscountForDisplay.toFixed(3)}</span>
              </div>
            )}

            <div className="border-t border-gray-800 my-1"></div>

            <div className="flex justify-between text-xs font-bold text-blue-800">
              <span>
                {isWarrantyClaim ? "WARRANTY AMOUNT:" : "TOTAL AMOUNT:"}
              </span>
              <span>OMR {totalAmountForDisplay.toFixed(3)}</span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs border-t border-dashed pt-2">
            <div className="flex justify-between mb-2">
              <span>Cashier: {cashier || ""}</span>
              <div className="text-right">
                <div className="inline-block border-t border-gray-500 w-[100px] text-center pt-1 text-xs text-gray-600">
                  Authorized Signature
                </div>
              </div>
            </div>

            <p className="font-medium">
              Contact no.: {companyDetails.contactNumber}
            </p>
            <p className="rtl">رقم الاتصال: ٧١١٧٠٨٠٥</p>
            <p className="italic text-xs">
              {isWarrantyClaim
                ? "Thank you for trusting us with your warranty claim\nشكراً لثقتكم بنا"
                : thankYouMessage}
            </p>
            <p className="font-mono mt-2">{billNumber}</p>
          </div>
        </div>
      </div>

      {!hideButton && (
        <Button
          onClick={handlePrint}
          className="w-full flex items-center justify-center gap-2"
          data-warranty-print-button
        >
          <Printer className="h-4 w-4" /> Print Bill
        </Button>
      )}
    </motion.div>
  );
};

export default BillComponent;
