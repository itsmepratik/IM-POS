import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/supabase/server";

const RefundSchema = z.object({
  originalReferenceNumber: z
    .string()
    .min(1, "Original reference number is required"),
  refundAmount: z.number().positive("Refund amount must be positive"),
  refundItems: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      price: z.number(),
      quantity: z.number(),
    })
  ),
  reason: z.string().optional(),
  cashierId: z.string().min(1, "Cashier ID is required"),
  shopId: z.string().min(1, "Shop ID is required"), // Changed from .uuid() to support non-UUID IDs
  locationId: z.string().min(1, "Location ID is required"), // Changed from .uuid() to support non-UUID IDs
  customerId: z.string().optional().nullable(), // Made optional and nullable
  carPlateNumber: z.string().optional(),
});

type RefundRequest = z.infer<typeof RefundSchema>;

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Parse and validate the request body
    const body = await req.json();
    console.log(
      "📥 Received refund request body:",
      JSON.stringify(body, null, 2)
    );

    const parsed = RefundSchema.safeParse(body);

    if (!parsed.success) {
      console.error(
        "❌ Refund validation failed:",
        JSON.stringify(parsed.error.flatten(), null, 2)
      );
      return NextResponse.json(
        {
          error: "Invalid request data",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    console.log("✅ Refund request validated successfully");

    const refundData: RefundRequest = parsed.data;

    // First, find the original transaction by reference number
    const { data: originalTransaction, error: originalError } = await supabase
      .from("transactions")
      .select("*")
      .eq("reference_number", refundData.originalReferenceNumber)
      .single();

    if (originalError || !originalTransaction) {
      return NextResponse.json(
        {
          error: "Original transaction not found",
          details: `No transaction found with reference number: ${refundData.originalReferenceNumber}`,
        },
        { status: 404 }
      );
    }

    // Validate that the refund amount doesn't exceed the original transaction amount
    const originalAmount = Math.abs(
      parseFloat(originalTransaction.total_amount.toString())
    );

    if (refundData.refundAmount > originalAmount) {
      return NextResponse.json(
        {
          error: "Refund amount exceeds original transaction amount",
          details: `Cannot refund OMR ${refundData.refundAmount.toFixed(
            3
          )} from a transaction worth OMR ${originalAmount.toFixed(3)}`,
        },
        { status: 400 }
      );
    }

    // Generate a unique reference number for the refund
    const refundReferenceNumber = `R${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 4)
      .toUpperCase()}`;

    // Prepare the refund transaction data
    const refundTransaction = {
      reference_number: refundReferenceNumber,
      location_id: refundData.locationId,
      shop_id: refundData.shopId,
      cashier_id: refundData.cashierId,
      type: "REFUND",
      total_amount: -refundData.refundAmount, // Negative amount for refunds
      items_sold: refundData.refundItems,
      payment_method: "REFUND",
      original_reference_number: refundData.originalReferenceNumber,
      customer_id: refundData.customerId,
      car_plate_number: refundData.carPlateNumber,
      // Generate a simple receipt HTML for the refund
      receipt_html: generateRefundReceiptHTML(
        refundReferenceNumber,
        refundData.originalReferenceNumber,
        refundData.refundItems,
        refundData.refundAmount,
        refundData.reason
      ),
      created_at: new Date().toISOString(),
    };

    // Insert the refund transaction
    const { data: refundTransactionData, error: refundError } = await supabase
      .from("transactions")
      .insert(refundTransaction)
      .select()
      .single();

    if (refundError) {
      console.error("Error creating refund transaction:", refundError);
      return NextResponse.json(
        {
          error: "Failed to create refund transaction",
          details: refundError.message,
        },
        { status: 500 }
      );
    }

    console.log("✅ Refund transaction created successfully:", {
      id: refundTransactionData.id,
      reference_number: refundReferenceNumber,
      original_reference: refundData.originalReferenceNumber,
      amount: refundData.refundAmount,
    });

    return NextResponse.json({
      ok: true,
      refund: {
        id: refundTransactionData.id,
        referenceNumber: refundReferenceNumber,
        originalReferenceNumber: refundData.originalReferenceNumber,
        amount: refundData.refundAmount,
        createdAt: refundTransactionData.created_at,
      },
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Helper function to generate refund receipt HTML
function generateRefundReceiptHTML(
  refundReferenceNumber: string,
  originalReferenceNumber: string,
  refundItems: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number;
  }>,
  refundAmount: number,
  reason?: string
): string {
  const subtotal = refundItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const vat = 0; // No VAT for refunds in this implementation
  const total = subtotal;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Refund Receipt - ${refundReferenceNumber}</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: sans-serif; margin: 0; padding: 10mm; width: 80mm; font-size: 12px; }
          .receipt-container { width: 76mm; padding: 1mm; }
          .receipt-header { text-align: center; margin-bottom: 10px; }
          .receipt-header h2 { font-size: 16px; margin: 0; font-weight: bold; }
          .receipt-header p { font-size: 12px; margin: 2px 0; color: #555; }
          .receipt-info { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 5px 0; margin-bottom: 10px; }
          .receipt-info p { margin: 2px 0; font-size: 12px; }
          .receipt-title { text-align: center; font-weight: bold; margin: 10px 0; font-size: 13px; color: #D9534F; text-transform: uppercase; }
          .receipt-table { width: 100%; border-collapse: collapse; margin: 10px 0; table-layout: fixed; }
          .receipt-table th { text-align: left; font-size: 12px; padding-bottom: 5px; }
          .receipt-table td { font-size: 12px; padding: 2px 0; word-wrap: break-word; }
          .receipt-table .sno { width: 20px; }
          .receipt-table .description { width: auto; }
          .receipt-table .price { width: 44px; text-align: right; padding-right: 3px; }
          .receipt-table .qty { width: 24px; text-align: center; padding-left: 8px; padding-right: 0px; }
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
          .receipt-footer .arabic { font-size: 11px; direction: rtl; margin: 2px 0; }
          @media print { body { width: 80mm; margin: 0; padding: 0; } @page { margin: 0; size: 80mm auto; } }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="receipt-header">
            <h2>AL-TARATH NATIONAL CO.</h2>
            <p>W.Saham, Al-Sanaiya, Sultanate of Oman</p>
            <p>Ph: 71170805</p>
          </div>

          <div class="receipt-title">REFUND RECEIPT</div>

          <div class="receipt-info">
            <p><span>Refund: ${refundReferenceNumber}</span></p>
            <p><span>Original Invoice: ${originalReferenceNumber}</span></p>
            <p><span>Date: ${new Date().toLocaleDateString(
              "en-GB"
            )}</span><span>Time: ${new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}</span></p>
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
              ${refundItems
                .map(
                  (item, index) => `
                <tr class="row-top">
                  <td class="sno">${index + 1}</td>
                  <td class="description" colspan="4">${item.name}</td>
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
                    3
                  )}</td>
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
              <tr>
                <td class="total-label">TOTAL REFUND</td>
                <td class="total-amount" style="color: #D9534F;">OMR ${refundAmount.toFixed(
                  3
                )}</td>
              </tr>
            </table>
          </div>

          ${
            reason
              ? `
            <div class="receipt-info" style="margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 5px;">
              <p><strong>Reason:</strong> ${reason}</p>
            </div>
          `
              : ""
          }

          <div class="receipt-footer">
            <p>Thank you for shopping with us.</p>
            <p class="arabic">شكراً للتسوق معنا</p>
          </div>
        </div>
      </body>
    </html>
  `;
}
