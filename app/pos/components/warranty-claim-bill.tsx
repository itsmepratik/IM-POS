"use client";

import React, {
  useRef,
  useCallback,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useCompanyInfo } from "@/lib/hooks/useCompanyInfo";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { motion } from "framer-motion";
import { generateBarcodeHTML } from "@/lib/utils/barcodeGenerator";

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

interface WarrantyClaimBillProps {
  cart: CartItem[];
  billNumber: string;
  currentDate: string;
  currentTime: string;
  customerName?: string;
  cashier?: string;
  carPlateNumber?: string;
  hideButton?: boolean;
  onClose?: () => void;
}

export interface WarrantyClaimBillRef {
  print: () => void;
}

export const WarrantyClaimBill = forwardRef<
  WarrantyClaimBillRef,
  WarrantyClaimBillProps
>(
  (
    {
      cart,
      billNumber,
      currentDate,
      currentTime,
      customerName = "",
      cashier,
      carPlateNumber,
      hideButton = false,
      onClose,
    },
    ref,
  ) => {
    const billRef = useRef<HTMLDivElement>(null);
    const [isClient, setIsClient] = useState(false);
    const [barcodeHtml, setBarcodeHtml] = useState<string>("");
    const { registered, thankYouMessage } = useCompanyInfo();

    // Filter out Sanaiya from address lines
    const filteredAddressLines = (registered.addressLines || []).filter(
      (line) => !line.toLowerCase().includes("al-sanaiya"),
    );

    // Flatten address lines for compatibility with existing template
    const companyDetails = {
      ...registered,
      addressLine1: filteredAddressLines[0] || "",
      addressLine2: filteredAddressLines[1] || "",
      addressLine3: filteredAddressLines[2] || "",
    };
    const serviceDescriptionContent = registered.serviceDescription || {
      english: "",
      arabic: "",
    };

    useEffect(() => {
      setIsClient(true);
    }, []);

    useEffect(() => {
      if (billNumber) {
        generateBarcodeHTML(billNumber).then(setBarcodeHtml);
      }
    }, [billNumber]);

    const handlePrint = useCallback(() => {
      const content = billRef.current;
      if (!content || !isClient) return;

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Please allow popups to print the bill.");
        return;
      }

      let subtotalForBill = 0;
      const billItems = cart.filter((item) => {
        // Typically warranty claims might not show prices the same way or might be zero cost,
        // but assuming we print the item value for record.
        subtotalForBill += item.price * item.quantity;
        return true;
      });

      const totalAmount = subtotalForBill; // Warranty usually doesn't have discounts applied on the claim certificate itself unless specified

      const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Warranty Claim</title>
        <style>
          @page {
            size: A5;
            margin: 0;
            margin-top: 0.35cm;
            margin-bottom: 0.40cm;
          }
          @font-face {
            font-family: 'Formula1';
            src: url('/fonts/Formula1-Bold-4.ttf') format('truetype');
            font-weight: bold;
            font-style: normal;
          }
          @font-face {
            font-family: 'Formula1';
            src: url('/fonts/Formula1-Regular-1.ttf') format('truetype');
            font-weight: normal;
            font-style: normal;
          }
          @font-face {
            font-family: 'Formula1';
            src: url('/fonts/Formula1-Black.ttf') format('truetype');
            font-weight: 900;
            font-style: normal;
          }

          html, body {
            height: 100%; /* Ensure html and body take full height */
            margin: 0;
            padding: 0;
            font-family: 'Formula1', sans-serif;
          }
          body {
            font-family: 'Formula1', sans-serif;
            font-size: 10pt;
            line-height: 1.3;
            width: 100%;
            color: #000;
          }
          * {
            font-family: 'Formula1', sans-serif !important;
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
            width: 50%;
            text-align: left;
            color: #777 !important;
            line-height: 1.2 !important;
            -moz-transform-origin: left top;
          }
          .right-header {
            width: 50%;
            text-align: right;
            color: #777 !important;
            line-height: 1.2 !important;
            direction: rtl;
            -moz-transform-origin: right top;
          }
          .cr-number, .cr-number-line {
            font-weight: bold !important;
            color: #555 !important; /* Slightly darker for contrast */
          }
          /* Enforce small font sizes for printing */
          @media print {
            .left-header, .left-header div, .right-header, .right-header div {
              font-size: 15px !important;
              color: #666 !important;
            }
            .address-line {
              font-size: 11px !important;
              white-space: nowrap !important;
            }
          }
          /* Screen preview fallback */
          .left-header div, .right-header div {
            font-size: 12px !important; /* Base size that zoom will scale down */
          }
          .center-header {
            width: 100%;
            text-align: center;
            margin-bottom: 5px;
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
          <!-- Company Name Top Section -->
          <div style="text-align: center; margin-bottom: 8px;">
            <div class="company-name">${companyDetails.name}</div>
            <div class="company-arabic-name">${companyDetails.arabicName}</div>
          </div>

          <!-- Header with two columns for details -->
          <table class="header-table">
            <tr>
              <td class="left-header">
                <div class="cr-number-line">C.R. No.: ${companyDetails.crNumber}</div>
                <div class="address-line">${companyDetails.addressLine1}</div>
                <div class="address-line">${companyDetails.addressLine2}</div>
                <div class="address-line">${companyDetails.addressLine3}</div>
              </td>
              <td class="right-header">
                <div class="cr-number" style="white-space: nowrap">السجل التجاري: ${
                  companyDetails.crNumber
                }</div>
                <div class="address-line" style="white-space: nowrap">${companyDetails.arabicAddressLines?.[0] || ""}</div>
                <div class="address-line" style="white-space: nowrap">${companyDetails.arabicAddressLines?.[1] || ""}</div>
              </td>
            </tr>
          </table>

          <!-- Service description -->
          <div class="service-description">
            ${serviceDescriptionContent.english}
            <div class="service-description-arabic">${
              serviceDescriptionContent.arabic
            }</div>
          </div>
          
           <!-- Warranty claim text -->
           <div style="text-align: center; font-weight: bold; font-size: 13.5px; margin: 8px 0; color: #D9534F; border-bottom: 1px solid #ccc; padding-bottom: 6px;">
             <span style="border: 1px solid #D9534F; padding: 2px 8px; display: inline-block;">WARRANTY CLAIM CERTIFICATE</span>
             <div style="font-size: 13.5px; margin-top: 4px; color: #D9534F;">شهادة ضمان</div>
           </div>

          <!-- Bill info with two columns -->
          <table class="bill-info-table" style="width: 100%;">
            <tr>
              <td class="bill-number">Bill no.: ${billNumber}</td>
              <td class="print-date">Printed on: ${currentDate} ${currentTime}</td>
            </tr>
          </table>
          <!-- Customer info with two columns -->
          <table class="bill-info-table">
            <tr>
              <td class="customer-info">To, Mr./Mrs.: <span class="customer-name">${
                customerName || ""
              }</span></td>
              <td class="car-plate">Warranty Type: Battery</td>
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
              `,
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
          </table>
          
          <div class="summary-divider"></div>
          
          <table class="summary-table">
            <tr class="total-row">
              <td class="label">WARRANTY AMOUNT:</td>
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
            <div class="footer-phone-numbers" style="direction: rtl;">رقم الاتصال: ${companyDetails.contactNumberArabic || ""}</div>
            <div class="footer-thank-you" style="white-space: pre-line;">${
              thankYouMessage?.english + "\n" + thankYouMessage?.arabic
            }</div>
            
            ${barcodeHtml ? `<div style="text-align: center; margin-top: 15px;">${barcodeHtml}</div>` : ""}
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
        if (
          !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent,
          )
        ) {
          // Removed auto close
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
      barcodeHtml,
    ]);

    useImperativeHandle(ref, () => ({
      print: handlePrint,
    }));

    if (!isClient) {
      return null;
    }

    let subtotalForDisplay = 0;
    cart.forEach((item) => {
      subtotalForDisplay += item.price * item.quantity;
    });

    const totalAmountForDisplay = subtotalForDisplay;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full flex flex-col"
      >
        <div className="max-h-[40vh] overflow-auto mb-4">
          <div
            ref={billRef}
            className="bg-white border rounded-lg p-4 w-full max-w-[400px] mx-auto font-formula1"
          >
            {/* Header - three column layout */}
            <div className="text-center mb-2">
              <h3 className="font-bold text-lg text-black">
                {companyDetails.name}
              </h3>
              <p className="font-bold text-black text-sm">
                {companyDetails.arabicName}
              </p>
              <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 mt-1">
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
                {serviceDescriptionContent.english}
              </p>
              <p className="text-xs font-bold text-center">
                {serviceDescriptionContent.arabic}
              </p>
            </div>

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

            {/* Bill info */}
            <div className="flex justify-between text-xs">
              <span>Bill no.: {billNumber}</span>
              <span>
                Printed on: {currentDate} {currentTime}
              </span>
            </div>
            {/* Customer info */}
            <div className="flex justify-between text-xs mb-3">
              <span className="font-medium">To, Mr./Mrs.: {customerName}</span>
              <span className="font-medium">Warranty Type: Battery</span>
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

              {cart.map((item, index) => (
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
              {/* Warranty doesn't usually show discounts unless needed */}
            </div>

            <div className="border-t border-dashed pt-2 mb-3">
              <div className="flex justify-between text-xs font-bold text-[#0000CC]">
                <span>WARRANTY AMOUNT:</span>
                <span>OMR {totalAmountForDisplay.toFixed(3)}</span>
              </div>
            </div>

            <div className="flex justify-between text-xs mt-4">
              <div>Cashier: {cashier || ""}</div>
              <div className="border-t border-gray-400 w-32 text-center pt-1 text-[10px] text-gray-500">
                Authorized Signature
              </div>
            </div>

            {barcodeHtml && (
              <div
                className="flex justify-center mt-3 pt-2"
                dangerouslySetInnerHTML={{ __html: barcodeHtml }}
              />
            )}
          </div>
        </div>

        {!hideButton && (
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
              Print Warranty Claim
            </Button>
          </div>
        )}
      </motion.div>
    );
  },
);

WarrantyClaimBill.displayName = "WarrantyClaimBill";
