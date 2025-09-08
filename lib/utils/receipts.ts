// Receipt generation utilities for thermal and battery bills

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
  date: string;
  time: string;
}

export function generateThermalReceipt(data: ReceiptData): string {
  const {
    referenceNumber,
    totalAmount,
    paymentMethod,
    items,
    tradeIns,
    date,
    time,
  } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt</title>
      <style>
        body { 
          font-family: 'Courier New', monospace; 
          font-size: 12px; 
          margin: 0; 
          padding: 10px; 
          max-width: 300px;
        }
        .header { 
          text-align: center; 
          margin-bottom: 15px; 
          border-bottom: 1px dashed #000;
          padding-bottom: 10px;
        }
        .item { 
          display: flex; 
          justify-content: space-between; 
          margin: 3px 0; 
          font-size: 11px;
        }
        .item-name {
          flex: 1;
          margin-right: 10px;
        }
        .item-price {
          font-weight: bold;
        }
        .total { 
          border-top: 1px solid #000; 
          padding-top: 8px; 
          margin-top: 15px; 
          font-weight: bold;
        }
        .trade-in {
          color: #666;
          font-size: 10px;
        }
        .footer { 
          text-align: center; 
          margin-top: 20px; 
          font-size: 10px; 
          border-top: 1px dashed #000;
          padding-top: 10px;
        }
        .separator {
          border-top: 1px dashed #ccc;
          margin: 5px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>RECEIPT</h2>
        <p><strong>Ref:</strong> ${referenceNumber}</p>
        <p>${date} ${time}</p>
      </div>
      
      <div class="items">
        ${items
          .map(
            (item) => `
          <div class="item">
            <span class="item-name">${item.name}${
              item.volumeDescription ? ` (${item.volumeDescription})` : ""
            } x${item.quantity}</span>
            <span class="item-price">OMR ${(
              item.sellingPrice * item.quantity
            ).toFixed(3)}</span>
          </div>
        `
          )
          .join("")}
        
        ${
          tradeIns && tradeIns.length > 0
            ? `
          <div class="separator"></div>
          <div class="trade-in">
            <div style="font-weight: bold; margin-bottom: 5px;">Trade-ins:</div>
            ${tradeIns
              .map(
                (tradeIn) => `
              <div class="item">
                <span class="item-name">${tradeIn.name} x${
                  tradeIn.quantity
                }</span>
                <span class="item-price">-OMR ${tradeIn.tradeInValue.toFixed(
                  3
                )}</span>
              </div>
            `
              )
              .join("")}
          </div>
        `
            : ""
        }
      </div>
      
      <div class="total">
        <div class="item">
          <span><strong>TOTAL: OMR ${totalAmount}</strong></span>
        </div>
        <p>Payment: ${paymentMethod}</p>
      </div>
      
      <div class="footer">
        <p>Thank you for your business!</p>
        <p>Keep this receipt for warranty</p>
      </div>
    </body>
    </html>
  `;
}

export function generateBatteryBill(data: ReceiptData): string {
  const {
    referenceNumber,
    totalAmount,
    paymentMethod,
    items,
    tradeIns,
    date,
    time,
  } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Battery Bill</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          font-size: 14px; 
          margin: 0; 
          padding: 20px; 
          max-width: 500px;
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
        `
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
                  3
                )}</span>
              </div>
            `
              )
              .join("")}
          </div>
        `
            : ""
        }
      </div>
      
      <div class="total">
        <div class="item">
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


