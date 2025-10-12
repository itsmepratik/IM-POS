"use client";

import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, FileText, X } from "lucide-react";
import { useCompanyInfo } from "@/lib/hooks/useCompanyInfo";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  brand?: string;
}

interface CartItem extends Product {
  quantity: number;
  details?: string;
  uniqueId: string;
  bottleType?: "open" | "closed";
}

interface OnHoldTicketProps {
  isOpen: boolean;
  onClose: () => void;
  carPlateNumber: string;
  cartItems: CartItem[];
  total: number;
  onPrint: () => void;
}

export function OnHoldTicket({
  isOpen,
  onClose,
  carPlateNumber,
  cartItems,
  total,
  onPrint,
}: OnHoldTicketProps) {
  const companyInfo = useCompanyInfo();
  const currentDate = new Date();
  const ticketNumber = `OH-${Date.now().toString().slice(-6)}`;

  // Download functionality for PDF/text export
  const handleDownload = () => {
    const ticketContent = `
═══════════════════════════════════════════════
              ON HOLD TICKET
                #${ticketNumber}
═══════════════════════════════════════════════

${companyInfo.brand.name}
${companyInfo.brand.addressLines.join(', ')}
Tel: ${companyInfo.brand.phones.join(', ')}

───────────────────────────────────────────────
TICKET INFORMATION
───────────────────────────────────────────────
Date: ${currentDate.toLocaleDateString('en-GB')}
Time: ${currentDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
Vehicle Plate: ${carPlateNumber}

───────────────────────────────────────────────
RESERVED ITEMS
───────────────────────────────────────────────
${cartItems.map((item, index) => 
  `${index + 1}. ${item.name || item.product_name}
   Quantity: ${item.quantity}
   Price: OMR ${item.price?.toFixed(3) || "0.000"} each
   Amount: OMR ${((item.price || 0) * item.quantity).toFixed(3)}`
).join('\n\n')}

───────────────────────────────────────────────
TOTAL AMOUNT: OMR ${total.toFixed(3)}
───────────────────────────────────────────────

⚠️  IMPORTANT NOTICE  ⚠️
This ticket reserves your selected items.
Present this ticket to complete your purchase.
Valid for 24 hours from issue time.
Items will be released after expiry.

Thank you for choosing ${companyInfo.brand.name}
═══════════════════════════════════════════════
    `.trim();

    const blob = new Blob([ticketContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `on-hold-ticket-${ticketNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95%] max-w-[520px] p-4 rounded-lg max-h-[90vh] overflow-auto">
        <DialogTitle className="sr-only">On Hold Ticket</DialogTitle>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-center flex-1">On Hold Ticket</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* On-Hold Ticket Content - Distinct ticket format */}
        <div className="max-h-[55vh] md:max-h-[65vh] overflow-auto mb-4">
          <div
            id="ticket-content"
            className="bg-white rounded-lg p-4 w-full max-w-[400px] mx-auto shadow-lg"
          >
            {/* Ticket Header */}
            <div className="text-center mb-4 border-b-2 border-orange-400 pb-3">
              <div className="bg-orange-100 rounded-lg p-3 mb-3">
                <h2 className="text-2xl font-bold text-orange-800 mb-1">
                  ON HOLD TICKET
                </h2>
                <p className="text-lg font-semibold text-orange-700">
                  #{ticketNumber}
                </p>
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                {companyInfo.brand.name}
              </h3>
              <p className="text-sm text-gray-600">{companyInfo.brand.addressLines.join(', ')}</p>
              <p className="text-sm text-gray-600">Tel: {companyInfo.brand.phones.join(', ')}</p>
            </div>

            {/* Ticket Information */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Date:</span>
                  <p className="font-semibold">{currentDate.toLocaleDateString('en-GB')}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Time:</span>
                  <p className="font-semibold">{currentDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <span className="font-medium text-gray-700">Vehicle Plate:</span>
                <p className="text-xl font-bold text-blue-800 bg-blue-50 rounded px-2 py-1 mt-1 text-center">
                  {carPlateNumber}
                </p>
              </div>
            </div>

            {/* Items Section */}
            <div className="mb-4">
              <h4 className="font-bold text-gray-800 mb-3 text-center bg-gray-100 py-2 rounded">
                RESERVED ITEMS
              </h4>
              <div className="space-y-2">
                {cartItems.map((item, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded p-3">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-gray-800 flex-1">
                        {item.name || item.product_name}
                      </span>
                      <span className="text-sm text-gray-600 ml-2">
                        Qty: {item.quantity}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        OMR {item.price?.toFixed(3) || "0.000"} each
                      </span>
                      <span className="font-semibold text-green-700">
                        OMR {((item.price || 0) * item.quantity).toFixed(3)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Section */}
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-green-800">TOTAL AMOUNT:</span>
                <span className="text-xl font-bold text-green-800">
                  OMR {total.toFixed(3)}
                </span>
              </div>
            </div>

            {/* Important Instructions */}
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-center">
              <h4 className="font-bold text-red-800 text-lg mb-2">
                ⚠️ IMPORTANT NOTICE ⚠️
              </h4>
              <div className="text-sm text-red-700 space-y-1">
                <p className="font-semibold">This ticket reserves your selected items.</p>
                <p>Present this ticket to complete your purchase.</p>
                <p className="font-bold text-red-800 mt-2">
                  Valid for 24 hours from issue time
                </p>
                <p className="text-xs mt-3 text-red-600">
                  Items will be released after expiry
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-4 pt-3 border-t border-gray-300">
              <p className="text-sm text-gray-600">Thank you for choosing</p>
              <p className="font-bold text-gray-800">{companyInfo.brand.name}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons - Matching receipt button layout */}
        <Button
          onClick={onPrint}
          className="w-full flex items-center justify-center gap-2 mt-2"
        >
          <Printer className="h-4 w-4" />
          Print Ticket
        </Button>
      </DialogContent>
    </Dialog>
  );
}