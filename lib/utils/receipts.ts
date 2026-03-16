// Receipt generation utilities for thermal and battery bills
import { generateBarcodeHTML } from "./barcodeGenerator";

export interface ReceiptData {
  referenceNumber: string;
  totalAmount: string;
  paymentMethod: string;
  items: Array<{
    name: string;
    quantity: number;
    sellingPrice: number;
    volumeDescription?: string;
  }>;
  tradeIns?: Array<{
    name: string;
    quantity: number;
    tradeInValue: number;
  }>;
  discount?: {
    type: "percentage" | "amount";
    value: number;
    amount: number;
  };
  subtotalBeforeDiscount?: number;
  date: string;
  time: string;
  cashier?: string;
  paymentRecipient?: string;
  posId?: string;
  carPlateNumber?: string;
  whatsapp?: string;
}

// Default company info (matches useCompanyInfo default)
const DEFAULT_COMPANY_INFO = {
  brand: {
    name: "H Automotives Service Center",
    addressLines: ["Saham, Sultanate of Oman"],
    phones: ["92510750", "26856848"],
    whatsapp: "",
    posId: "A0054",
  },
};

export async function generateThermalReceipt(
  data: ReceiptData,
): Promise<string> {
  const {
    referenceNumber,
    totalAmount,
    paymentMethod,
    items,
    tradeIns,
    discount,
    subtotalBeforeDiscount,
    date,
    time,
    cashier,
    paymentRecipient,
    posId,
  } = data;

  // Use provided company info or defaults
  const brandName = DEFAULT_COMPANY_INFO.brand.name;
  const addressLines = DEFAULT_COMPANY_INFO.brand.addressLines;
  const phones = DEFAULT_COMPANY_INFO.brand.phones;
  const whatsapp = data.whatsapp || DEFAULT_COMPANY_INFO.brand.whatsapp || "";
  const POS_ID = posId || DEFAULT_COMPANY_INFO.brand.posId || "A0054";

  // Calculate subtotal from items if not provided
  const subtotal =
    subtotalBeforeDiscount ??
    items.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);

  // Calculate discount amount
  const discountAmount = discount?.amount || 0;

  // Calculate total item quantity
  const totalItemQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const barcodeHtml = await generateBarcodeHTML(referenceNumber);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Receipt</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
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

        body {
          font-family: 'Formula1', sans-serif !important;
          padding: 0;
          margin: 0;
          width: 80mm;
          font-size: 12px;
        }
        * {
          font-family: 'Formula1', sans-serif !important;
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
          <h2>${brandName}</h2>
          <p>${addressLines.join(" ")}</p>
          <p>Ph: ${phones.join(" | ")}</p>
        </div>
        
        <div class="receipt-info">
            <span>Invoice: ${referenceNumber}</span>
          </p>
          <p style="display:flex;justify-content:space-between;align-items:center;">
            <span>Date: ${date}</span>
            <span>Time: ${time}</span>
          </p>
        </div>
        
        ${
          barcodeHtml
            ? `
        <div style="text-align: center; margin: 10px 0;">
          ${barcodeHtml}
        </div>
        `
            : ""
        }
        
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
            ${items
              .map(
                (item, index) => `
              <tr class="row-top">
                <td class="sno">${index + 1}</td>
                <td class="description" colspan="4">${item.name}${
                  item.volumeDescription ? ` (${item.volumeDescription})` : ""
                }</td>
                <td class="price" style="display:none;"></td>
                <td class="qty" style="display:none;"></td>
                <td class="amount" style="display:none;"></td>
              </tr>
              <tr class="row-bottom">
                <td class="sno"></td>
                <td class="description"></td>
                <td class="price">${item.sellingPrice.toFixed(3)}</td>
                <td class="qty">(x${item.quantity})</td>
                <td class="amount">${(item.sellingPrice * item.quantity).toFixed(3)}</td>
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
              discount && discount.amount > 0
                ? `
            <tr class="discount-row" style="color: #22c55e; font-weight: bold;">
              <td style="color: #22c55e; font-weight: bold;">Discount ${
                discount.type === "percentage"
                  ? `(${discount.value}%)`
                  : "(Amount)"
              }</td>
              <td class="total-amount" style="color: #22c55e; font-weight: bold;">- OMR ${discount.amount.toFixed(3)}</td>
            </tr>`
                : ""
            }
            <tr>
              <td class="total-label" style="border-top: 1px solid #000; padding-top: 5px;">Total</td>
              <td class="total-amount" style="border-top: 1px solid #000; padding-top: 5px; font-size: 14px;">OMR ${totalAmount}</td>
            </tr>
          </table>
        </div>
        
        <div class="receipt-footer">
          <p>Number of Items: ${totalItemQuantity}</p>
          <p>Payment Method: ${paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1)}</p>
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
          WhatsApp ${whatsapp} for latest offers
        </div>
        
        ${barcodeHtml ? `<div style="text-align: center; margin-top: 15px;">${barcodeHtml}</div>` : ""}
      </div>
    </body>
    </html>
  `;
}

export async function generateBatteryBill(data: ReceiptData): Promise<string> {
  const {
    referenceNumber,
    totalAmount,
    paymentMethod,
    items,
    tradeIns,
    discount,
    subtotalBeforeDiscount,
    date,
    time,
    carPlateNumber,
  } = data;

  // Calculate subtotal from items if not provided
  const subtotal =
    subtotalBeforeDiscount ??
    items.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);

  const barcodeHtml = await generateBarcodeHTML(referenceNumber);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Battery Bill</title>
      <style>
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

        body { 
          font-family: 'Formula1', Arial, sans-serif !important; 
          font-size: 14px; 
          margin: 0; 
          padding: 20px; 
          max-width: 500px;
        }
        * {
          font-family: 'Formula1', Arial, sans-serif !important;
        }
        .header { 
          text-align: center; 
          margin-bottom: 25px; 
          border-bottom: 2px solid #000; 
          padding-bottom: 15px;
        }
        .item { 
          display: flex; 
          justify-content: space-between; 
          margin: 10px 0; 
          padding: 8px 0; 
          border-bottom: 1px solid #eee;
        }
        .item-name {
          flex: 1;
          margin-right: 15px;
        }
        .item-price {
          font-weight: bold;
        }
        .total { 
          border-top: 2px solid #000; 
          padding-top: 15px; 
          margin-top: 25px; 
          font-size: 16px; 
          font-weight: bold;
        }
        .trade-in {
          background: #f8f8f8;
          padding: 10px;
          margin: 15px 0;
          border-radius: 5px;
          border-left: 4px solid #007bff;
        }
        .discount {
          background: #f0fdf4;
          padding: 10px;
          margin: 15px 0;
          border-radius: 5px;
          border-left: 4px solid #22c55e;
          color: #15803d;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          padding: 5px 0;
        }
        .footer { 
          text-align: center; 
          margin-top: 30px; 
          font-size: 12px;
        }
        .warranty { 
          background: #fff3cd; 
          padding: 15px; 
          margin: 20px 0; 
          border-radius: 8px; 
          border-left: 4px solid #ffc107;
        }
        .separator {
          border-top: 1px solid #ddd;
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>BATTERY PURCHASE RECEIPT</h1>
        <p><strong>Reference:</strong> ${referenceNumber}</p>
        <p><strong>Date:</strong> ${date} <strong>Time:</strong> ${time}</p>
        ${carPlateNumber ? `<p><strong>Car Plate:</strong> ${carPlateNumber}</p>` : ""}
      </div>
      
      <div class="items">
        <h3>Items Purchased:</h3>
        ${items
          .map(
            (item) => `
          <div class="item">
            <span class="item-name"><strong>${item.name}</strong>${
              item.volumeDescription ? ` (${item.volumeDescription})` : ""
            } (Qty: ${item.quantity})</span>
            <span class="item-price">OMR ${(
              item.sellingPrice * item.quantity
            ).toFixed(3)}</span>
          </div>
        `,
          )
          .join("")}
        
        ${
          tradeIns && tradeIns.length > 0
            ? `
          <div class="separator"></div>
          <div class="trade-in">
            <h4>Trade-ins Applied:</h4>
            ${tradeIns
              .map(
                (tradeIn) => `
              <div class="item">
                <span class="item-name">${tradeIn.name} x${
                  tradeIn.quantity
                }</span>
                <span class="item-price">-OMR ${tradeIn.tradeInValue.toFixed(
                  3,
                )}</span>
              </div>
            `,
              )
              .join("")}
          </div>
        `
            : ""
        }
        
        ${
          discount && discount.amount > 0
            ? `
          <div class="separator"></div>
          <div class="discount">
            <h4>Discount Applied:</h4>
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>OMR ${subtotal.toFixed(3)}</span>
            </div>
            <div class="summary-row">
              <span>Discount ${discount.type === "percentage" ? `(${discount.value}%)` : ""}:</span>
              <span style="color: #15803d; font-weight: bold;">-OMR ${discount.amount.toFixed(3)}</span>
            </div>
          </div>
        `
            : ""
        }
      </div>
      
      <div class="total">
        ${
          (discount && discount.amount > 0) || (tradeIns && tradeIns.length > 0)
            ? `
        <div class="summary-row">
          <span>Subtotal:</span>
          <span>OMR ${subtotal.toFixed(3)}</span>
        </div>
        ${
          discount && discount.amount > 0
            ? `
        <div class="summary-row" style="color: #15803d;">
          <span>Discount ${discount.type === "percentage" ? `(${discount.value}%)` : ""}:</span>
          <span>-OMR ${discount.amount.toFixed(3)}</span>
        </div>
        `
            : ""
        }
        ${
          tradeIns && tradeIns.length > 0
            ? `
        <div class="summary-row">
          <span>Trade-in:</span>
          <span>-OMR ${tradeIns.reduce((sum, ti) => sum + ti.tradeInValue, 0).toFixed(3)}</span>
        </div>
        `
            : ""
        }
        `
            : ""
        }
        <div class="item" style="margin-top: 10px; border-top: 2px solid #000; padding-top: 10px;">
          <span><strong>TOTAL AMOUNT:</strong></span>
          <span><strong>OMR ${totalAmount}</strong></span>
        </div>
        <p><strong>Payment Method:</strong> ${paymentMethod}</p>
      </div>
      
      <div class="warranty">
        <h4>🔋 Battery Warranty Information:</h4>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>12-month warranty from date of purchase</li>
          <li>Warranty covers manufacturing defects only</li>
          <li>Keep this receipt for warranty claims</li>
          <li>Warranty void if battery is damaged or misused</li>
        </ul>
      </div>
      
      <div class="footer">
        <p><strong>Thank you for choosing our battery services!</strong></p>
        <p>For warranty claims or questions, please contact us with this receipt.</p>
        <p style="margin-top: 15px; font-size: 10px; color: #666;">
          This receipt is your proof of purchase and warranty document.
        </p>
      </div>
      
      ${barcodeHtml ? `<div style="text-align: center; margin-top: 15px;">${barcodeHtml}</div>` : ""}
    </body>
    </html>
  `;
}

export function formatCurrency(amount: number): string {
  return `OMR ${amount.toFixed(3)}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB");
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
