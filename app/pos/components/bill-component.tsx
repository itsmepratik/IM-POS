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
        <title>Bill ${billNumber}</title>
        <style>
          @page {
            size: A5;
            margin: 10mm;
          }
          body {
            font-family: 'Inter', Arial, sans-serif;
            font-size: 8.5pt;
            line-height: 1.3;
            margin: 0;
            padding: 0;
            width: 100%;
            color: #333;
          }
          .bill-container {
            width: 100%;
            padding: 0;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
          }
          .header .cr-no {
            font-size: 9.5pt;
            font-weight: bold;
            text-align: left;
            margin-bottom: 4px;
            color: #555;
          }
          .header .company-name {
            font-size: 15pt;
            font-weight: bold;
            color: #1E3A8A;
            margin-bottom: 2px;
          }
          .header .company-arabic-name {
            font-size: 11pt;
            font-weight: bold;
            margin-bottom: 6px;
            color: #444;
          }
          .address-block {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            font-size: 7.5pt;
            color: #555;
            margin-top: 5px;
            margin-bottom: 10px;
            text-align: left;
          }
          .address-left,
          .address-right {
            flex-basis: 48%;
          }
          .address-right {
            text-align: right;
          }
          .address-line {
            margin-bottom: 1px;
          }
          .service-description {
            text-align: center;
            font-weight: bold;
            font-size: 9.5pt;
            margin-bottom: 12px;
            border-top: 1px solid #eee;
            border-bottom: 1px solid #eee;
            padding: 7px 0;
            color: #333;
          }
          .service-description .arabic {
            font-size: 8.5pt;
          }
          .bill-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 8.5pt;
            padding-bottom: 4px;
            border-bottom: 1px dashed #ccc;
          }
          .customer-info {
            margin-bottom: 12px;
            font-size: 9.5pt;
            font-weight: bold;
          }
          .customer-info span {
            font-weight: normal;
            color: #444;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 8.5pt;
          }
          .items-table th, .items-table td {
            padding: 7px 5px;
            text-align: left;
            border-bottom: 1px solid #eee;
          }
          .items-table th {
            background-color: #f9f9f9;
            font-weight: bold;
            color: #333;
            border-bottom-width: 1.5px;
            border-bottom-color: #ddd;
          }
          .items-table td.quantity, .items-table td.unit-price, .items-table td.total {
            text-align: right;
          }
          .items-table tr:last-child td {
            border-bottom: none;
          }
          .items-table .item-description {
             max-width: 170px;
             word-wrap: break-word;
          }
          .summary {
            margin-top: 15px;
            font-size: 9.5pt;
          }
          .summary-item {
            display: flex;
            justify-content: space-between;
            padding: 4px 0;
            color: #444;
          }
          .summary-item span:last-child {
            font-weight: bold;
            color: #333;
          }
          .summary-item.total-amount {
            font-weight: bold;
            font-size: 11pt;
            border-top: 1.5px solid #333;
            padding-top: 8px;
            margin-top: 8px;
            color: #1E3A8A;
          }
           .summary-item.discount {
            color: #D9534F;
          }
           .summary-item.discount span:last-child {
            color: #D9534F;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 8.5pt;
            color: #666;
            border-top: 1px solid #eee;
            padding-top: 12px;
          }
          .footer .contact-no {
            font-weight: bold;
            margin-bottom: 7px;
            color: #444;
          }
          .footer .thank-you {
            font-style: italic;
            margin-bottom: 20px;
          }
          .signature-line {
            margin-top: 30px;
            padding-top: 4px;
            text-align: right;
          }
          .signature-line span {
             border-top: 1px solid #777;
             padding-top: 4px;
             display: inline-block;
             width: 160px;
             text-align: center;
             font-size: 7.5pt;
             color: #777;
          }
        </style>
      </head>
      <body>
        <div class="bill-container">
          <div class="header">
            <div class="cr-no">C.R. No.: ${companyDetails.crNumber}</div>
            <div class="company-name">${companyDetails.name}</div>
            <div class="company-arabic-name">${companyDetails.arabicName}</div>
            <div class="address-block">
              <div class="address-left">
                <div class="address-line">${companyDetails.addressLine1}</div> 
                <div class="address-line">${companyDetails.addressLine2}</div>
              </div>
              <div class="address-right">
                <div class="address-line">${companyDetails.addressLine3}</div>
              </div>
            </div>
          </div>

          <div class="service-description">
            ${serviceDescription.english}<br>
            <span class="arabic">${serviceDescription.arabic}</span>
          </div>

          <div class="bill-info">
            <div>Bill no.: ${billNumber}</div>
            <div>Printed on: ${currentDate} ${currentTime}</div>
          </div>
          <div class="customer-info">
            To, Mr./Mrs.: <span>${customerName || ""}</span>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th>#</th>
                <th class="item-description">Item</th>
                <th style="text-align:right;">Quantity</th>
                <th style="text-align:right;">Unit Price</th>
                <th style="text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${billItems
                .map(
                  (item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td class="item-description">${item.name} ${
                    item.details ? "(" + item.details + ")" : ""
                  }</td>
                  <td class="quantity">${item.quantity}</td>
                  <td class="unit-price">${item.price.toFixed(3)}</td>
                  <td class="total">${(item.price * item.quantity).toFixed(
                    3
                  )}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-item">
              <span>Subtotal</span>
              <span>${subtotalForBill.toFixed(3)}</span>
            </div>
            ${
              mainDiscountAmount > 0
                ? `
              <div class="summary-item discount">
                <span>Discount ${
                  appliedDiscount?.type === "percentage"
                    ? `(${appliedDiscount.value}%)`
                    : `(Amount)`
                }</span>
                <span>- ${mainDiscountAmount.toFixed(3)}</span>
              </div>
            `
                : ""
            }
            ${
              oldBatteryDiscountAmount > 0
                ? `
              <div class="summary-item discount">
                <span>Discount on old battery</span>
                <span>- ${oldBatteryDiscountAmount.toFixed(3)}</span>
              </div>
            `
                : ""
            }
            ${
              finalTradeInAmount > 0
                ? `
              <div class="summary-item discount">
                <span>Trade-In Amount</span>
                <span>- ${finalTradeInAmount.toFixed(3)}</span>
              </div>
            `
                : ""
            }
            <div class="summary-item total-amount">
              <span>TOTAL AMOUNT:</span>
              <span>${totalAmount.toFixed(3)} OMR</span>
            </div>
          </div>
          
          ${
            cashier
              ? `<div style="font-size: 8.5pt; margin-top: 8px;">Cashier: ${cashier}</div>`
              : ""
          }

          <div class="footer">
            <div class="contact-no">Contact no.: ${
              companyDetails.contactNumber
            }</div>
            <div class="thank-you">${thankYouMessage}</div>
            <div class="signature-line"><span>Authorized Signature</span></div>
          </div>

        </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
      if (
        !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      ) {
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
        className="bill-preview-area p-2 border border-dashed max-h-[50vh] overflow-y-auto text-xs"
      >
        <div className="text-center mb-2">
          <p className="font-bold text-sm">${companyDetails.name}</p>
          <p className="text-xs">C.R. No: ${companyDetails.crNumber}</p>
          <hr className="my-1" />
        </div>
        <div className="text-xs mb-1">
          <p>
            Bill: ${billNumber} | Date: ${currentDate} ${currentTime}
          </p>
          <p className="font-semibold">To: ${customerName}</p>
        </div>
        <hr className="my-1" />
        <div className="text-xs font-semibold mb-1 flex justify-between">
          <span>Item</span>
          <span>Total</span>
        </div>
        {cart
          .filter(
            (item) =>
              !item.name.toLowerCase().includes("discount on old battery")
          )
          .map((item, index) => (
            <div
              key={item.uniqueId}
              className="flex justify-between text-xs py-0.5"
            >
              <span className="flex-1 break-words pr-2">
                ${index + 1}. ${item.name} (${item.quantity} x $
                {item.price.toFixed(3)})
              </span>
              <span className="text-right">
                ${(item.price * item.quantity).toFixed(3)}
              </span>
            </div>
          ))}
        <hr className="my-1" />
        <div className="flex justify-between text-xs mt-1 pt-1">
          <span>Subtotal:</span>
          <span className="font-semibold">
            ${subtotalForDisplay.toFixed(3)}
          </span>
        </div>
        {mainDiscountForDisplay > 0 && (
          <div className="flex justify-between text-xs text-red-600">
            <span>
              Discount $
              {appliedDiscount?.type === "percentage"
                ? `(${appliedDiscount.value}%)`
                : `(Amount)`}
              :
            </span>
            <span className="font-semibold">
              - ${mainDiscountForDisplay.toFixed(3)}
            </span>
          </div>
        )}
        {oldBatteryDiscountForDisplay > 0 && (
          <div className="flex justify-between text-xs text-red-600">
            <span>Discount on old battery:</span>
            <span className="font-semibold">
              - ${oldBatteryDiscountForDisplay.toFixed(3)}
            </span>
          </div>
        )}
        {finalTradeInAmountForDisplay > 0 && (
          <div className="flex justify-between text-xs text-red-600">
            <span>Trade-In Amount:</span>
            <span className="font-semibold">
              - ${finalTradeInAmountForDisplay.toFixed(3)}
            </span>
          </div>
        )}

        <div className="flex justify-between font-bold text-sm mt-1 pt-1 border-t border-gray-400">
          <span>Total Amount:</span>
          <span>${totalAmountForDisplay.toFixed(3)} OMR</span>
        </div>
        <div className="text-center text-xs mt-2">
          Contact: ${companyDetails.contactNumber} <br /> ${thankYouMessage}
        </div>
      </div>

      <Button onClick={handlePrint} className="w-full mt-4">
        <Printer className="mr-2 h-4 w-4" /> Print Bill
      </Button>
    </div>
  );
};

export default BillComponent;
