"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

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

export const BillComponent: React.FC<BillComponentProps> = ({
  cart,
  billNumber,
  currentDate,
  currentTime,
  customerName = "Salim Al Marzuf",
  cashier,
  appliedDiscount,
  appliedTradeInAmount,
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
          }
          html, body {
            height: 100%; /* Ensure html and body take full height */
            margin: 0;
            padding: 0;
          }
          body {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.3;
            width: 100%;
            color: #000;
          }
          .bill-container {
            width: calc(100% - 10mm); 
            height: 100%; /* Make bill container take full printable height */
            padding: 5mm;
            margin: 0 auto; 
            box-sizing: border-box;
            display: flex; /* Enable flexbox for vertical alignment */
            flex-direction: column; /* Stack children vertically */
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
            font-size: 9pt;
          }
          .center-header {
            width: 40%;
            text-align: center;
          }
          .right-header {
            width: 30%;
            text-align: right;
            font-size: 9pt;
            direction: rtl;
          }
          .company-name {
            color: #0000CC;
            font-size: 14pt;
            font-weight: bold;
            text-transform: uppercase;
          }
          .company-arabic-name {
            color: #0000CC;
            font-size: 12pt;
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
            font-size: 9pt;
            margin: 15px 0;
            border-top: 1px solid #ccc;
            border-bottom: 1px solid #ccc;
            padding: 6px 0;
          }
          .service-description-arabic {
            font-size: 8pt;
            margin-top: 2px;
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
            font-size: 9pt;
          }
          .print-date {
            text-align: right;
            font-size: 9pt;
          }
          .customer-info {
            text-align: left;
            font-size: 9pt;
            font-weight: bold;
            margin-bottom: 8px;
          }
          .car-plate {
            text-align: right;
            font-size: 9pt;
            font-weight: bold;
          }
          /* Items table */
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 9pt;
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
            font-size: 9pt;
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
          .trade-in {
            color: #D9534F;
          }
          .total-row {
            font-weight: bold;
            font-size: 11pt;
            color: #0000CC;
          }
          
          /* Footer section */
          .cashier-section {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
            margin-bottom: 15px;
            font-size: 9pt;
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
            font-size: 8pt;
            color: #777;
          }
          .footer {
            text-align: center;
            font-size: 5pt;
            color: #333;
            border-top: 1px solid #ccc;
            padding-top: 6px;
            margin-top: 0;
          }
          .footer-contact {
            font-weight: bold;
            margin-bottom: 2px;
          }
          .footer-phone-numbers {
            direction: ltr;
            margin-bottom: 2px;
          }
          .footer-thank-you {
            font-style: italic;
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
                <div class="cr-number">السجل التجاري ${
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

          <!-- Bill info with two columns -->
          <table class="bill-info-table">
            <tr>
              <td class="bill-number">Bill no.: ${billNumber}</td>
              <td class="print-date">Printed on: ${currentDate} ${currentTime}</td>
            </tr>
          </table>

          <!-- Customer info with two columns -->
          <table class="bill-info-table">
            <tr>
              <td class="customer-info">To, Mr./Mrs.: ${customerName || ""}</td>
              <td class="car-plate">Car Plate: 1456 B</td>
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
              <tr class="trade-in">
                <td class="label">Trade-In Amount</td>
                <td class="amount">- ${finalTradeInAmount.toFixed(3)}</td>
              </tr>
            `
                : ""
            }
            ${
              mainDiscountAmount > 0
                ? `
              <tr class="trade-in">
                <td class="label">Discount ${
                  appliedDiscount?.type === "percentage"
                    ? `(${appliedDiscount.value}%)`
                    : `(Amount)`
                }</td>
                <td class="amount">- ${mainDiscountAmount.toFixed(3)}</td>
              </tr>
            `
                : ""
            }
            ${
              oldBatteryDiscountAmount > 0
                ? `
              <tr class="trade-in">
                <td class="label">Discount on old battery</td>
                <td class="amount">- ${oldBatteryDiscountAmount.toFixed(3)}</td>
              </tr>
            `
                : ""
            }
          </table>
          
          <div class="summary-divider"></div>
          
          <table class="summary-table">
            <tr class="total-row">
              <td class="label">TOTAL AMOUNT:</td>
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

          <div class="footer">
            <div class="footer-contact">Contact no.: ${
              companyDetails.contactNumber
            }</div>
            <div class="footer-phone-numbers">968 7117 0805 :رقم الاتصال</div>
            <div class="footer-thank-you">${thankYouMessage}</div>
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
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-center">Bill Preview</h3>

      <div
        ref={billRef}
        className="bill-preview-area p-[5mm] border border-dashed max-h-[50vh] overflow-y-auto text-xs bg-gray-50"
      >
        {/* Header - three column layout */}
        <div className="flex mb-3">
          <div className="w-1/3 text-left text-[9px]">
            <div>C.R. No.: {companyDetails.crNumber}</div>
            <div>{companyDetails.addressLine1}</div>
            <div>{companyDetails.addressLine2}</div>
            <div>{companyDetails.addressLine3}</div>
          </div>
          <div className="w-1/3 text-center">
            <div className="font-bold text-blue-800 text-sm">
              {companyDetails.name}
            </div>
            <div className="font-bold text-blue-800 text-[10px]">
              {companyDetails.arabicName}
            </div>
          </div>
          <div className="w-1/3 text-right text-[9px] rtl">
            <div>السجل التجاري {companyDetails.crNumber}</div>
            <div>ولاية صحم</div>
            <div>الصناعية</div>
            <div>سلطنة عمان</div>
          </div>
        </div>

        {/* Service description */}
        <div className="text-center font-bold py-1 text-[9px] border-t border-b border-gray-200 my-2">
          {serviceDescription.english}
          <div className="text-[8px] mt-0.5">{serviceDescription.arabic}</div>
        </div>

        {/* Bill info */}
        <div className="flex justify-between text-[9px] mb-2">
          <div>Bill no.: {billNumber}</div>
          <div>
            Printed on: {currentDate} {currentTime}
          </div>
        </div>

        {/* Customer info */}
        <div className="flex justify-between text-[9px] mb-3">
          <div className="font-semibold">To, Mr./Mrs.: {customerName}</div>
          <div className="font-semibold">Car Plate: 1456 B</div>
        </div>

        {/* Items table */}
        <table className="w-full text-[9px] mb-3">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-1">#</th>
              <th className="text-left py-1">Item</th>
              <th className="text-right py-1">Quantity</th>
              <th className="text-right py-1">Unit Price</th>
              <th className="text-right py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {cart
              .filter(
                (item) =>
                  !item.name.toLowerCase().includes("discount on old battery")
              )
              .map((item, index) => (
                <tr key={item.uniqueId} className="border-b border-gray-200">
                  <td className="py-1">{index + 1}</td>
                  <td className="py-1">
                    {item.name} {item.details ? `(${item.details})` : ""}
                  </td>
                  <td className="text-right py-1">{item.quantity}</td>
                  <td className="text-right py-1">{item.price.toFixed(3)}</td>
                  <td className="text-right py-1">
                    {(item.price * item.quantity).toFixed(3)}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Summary section */}
        <div className="text-[9px]">
          <div className="flex justify-between py-0.5">
            <span>Subtotal</span>
            <span className="font-semibold">
              {subtotalForDisplay.toFixed(3)}
            </span>
          </div>

          {finalTradeInAmountForDisplay > 0 && (
            <div className="flex justify-between py-0.5 text-red-600">
              <span>Trade-In Amount</span>
              <span className="font-semibold">
                - {finalTradeInAmountForDisplay.toFixed(3)}
              </span>
            </div>
          )}

          {mainDiscountForDisplay > 0 && (
            <div className="flex justify-between py-0.5 text-red-600">
              <span>
                Discount{" "}
                {appliedDiscount?.type === "percentage"
                  ? `(${appliedDiscount.value}%)`
                  : `(Amount)`}
              </span>
              <span className="font-semibold">
                - {mainDiscountForDisplay.toFixed(3)}
              </span>
            </div>
          )}

          {oldBatteryDiscountForDisplay > 0 && (
            <div className="flex justify-between py-0.5 text-red-600">
              <span>Discount on old battery</span>
              <span className="font-semibold">
                - {oldBatteryDiscountForDisplay.toFixed(3)}
              </span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 my-1"></div>

        {/* Total */}
        <div className="flex justify-between font-bold text-[11px] text-blue-800 py-0.5">
          <span>TOTAL AMOUNT:</span>
          <span>{totalAmountForDisplay.toFixed(3)} OMR</span>
        </div>

        <div style={{ flexGrow: 1 }}></div>

        <div className="flex justify-between text-[9px] mt-4 mb-2">
          <div>Cashier: {cashier || ""}</div>
          <div className="text-right">
            <div className="inline-block border-t border-gray-500 w-[120px] text-center pt-0.5 text-[8px] text-gray-600">
              Authorized Signature
            </div>
          </div>
        </div>

        <div className="text-center text-[6px] pt-1 border-t border-gray-300">
          <div className="font-semibold">
            Contact no.: {companyDetails.contactNumber}
          </div>
          <div>968 7117 0805 :رقم الاتصال</div>
          <div className="italic">{thankYouMessage}</div>
        </div>
      </div>

      <Button onClick={handlePrint} className="w-full mt-4">
        <Printer className="mr-2 h-4 w-4" /> Print Bill
      </Button>
    </div>
  );
};

export default BillComponent;
