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

// Helper function to extract item identifier from multiple possible fields
function getItemIdentifier(item: any): string {
  // Try multiple possible ID fields, normalize to string for consistent comparison
  const id = item.id ?? item.productId ?? item.product_id;
  if (id !== null && id !== undefined) {
    return String(id);
  }
  // Fallback: use name + price as identifier if no ID exists
  const name = item.name || item.productName || item.product_name || "";
  const price = item.price || item.sellingPrice || 0;
  return `name:${name}|price:${price.toFixed(3)}`;
}

// Helper function to get all possible IDs from an item (for flexible matching)
function getAllItemIds(item: any): string[] {
  const ids: string[] = [];
  
  // Collect all possible ID fields
  if (item.id !== null && item.id !== undefined) {
    ids.push(String(item.id));
  }
  if (item.productId !== null && item.productId !== undefined) {
    ids.push(String(item.productId));
  }
  if (item.product_id !== null && item.product_id !== undefined) {
    ids.push(String(item.product_id));
  }
  
  return ids;
}

// Helper function to check if two items match
// Primary: ID match (normalized), Fallback: Name + Price match (with volumeDescription support for lubricants)
function itemsMatch(item1: any, item2: any): boolean {
  // Get all possible IDs from both items
  const ids1 = getAllItemIds(item1);
  const ids2 = getAllItemIds(item2);
  
  // Primary match: Check if any IDs match (handles UUID strings vs numbers)
  for (const id1 of ids1) {
    for (const id2 of ids2) {
      // Exact string match
      if (id1 === id2) {
        return true;
      }
      // Also try comparing as numbers if both are numeric strings
      const num1 = Number(id1);
      const num2 = Number(id2);
      if (!isNaN(num1) && !isNaN(num2) && num1 === num2) {
        return true;
      }
    }
  }
  
  // CRITICAL: For lubricant products, prioritize volumeDescription matching
  // Lubricant items often have volumeDescription like "Shell 20W-50 - 1L"
  // which is more specific than just the product name
  const volumeDesc1 = (item1.volumeDescription || item1.volume_description || "").trim().toLowerCase();
  const volumeDesc2 = (item2.volumeDescription || item2.volume_description || "").trim().toLowerCase();
  
  // If both have volumeDescription, try matching by that first (most specific)
  if (volumeDesc1 !== "" && volumeDesc2 !== "") {
    const price1 = parseFloat(item1.price || item1.sellingPrice || 0);
    const price2 = parseFloat(item2.price || item2.sellingPrice || 0);
    
    // Match if volumeDescription matches (exact or contains) AND price matches
    if ((volumeDesc1 === volumeDesc2 || volumeDesc1.includes(volumeDesc2) || volumeDesc2.includes(volumeDesc1)) &&
        Math.abs(price1 - price2) < 0.01) {
      return true;
    }
  }
  
  // Fallback match: Name + Price (within tolerance for floating point)
  // Extract names from multiple possible fields (volumeDescription takes priority for lubricants)
  const name1 = (
    volumeDesc1 || // Use volumeDescription first if available
    item1.name || 
    item1.productName || 
    item1.product_name || 
    ""
  ).trim().toLowerCase();
  
  const name2 = (
    volumeDesc2 || // Use volumeDescription first if available
    item2.name || 
    item2.productName || 
    item2.product_name || 
    ""
  ).trim().toLowerCase();
  
  // Extract prices from multiple possible fields
  const price1 = parseFloat(item1.price || item1.sellingPrice || 0);
  const price2 = parseFloat(item2.price || item2.sellingPrice || 0);
  
  // Match by name+price if:
  // 1. Both names are not empty
  // 2. Names match (exact or one contains the other for flexibility)
  // 3. Prices match within tolerance
  if (name1 !== "" && name2 !== "") {
    // For lubricants, if one name contains the other (e.g., "Shell 20W-50" vs "Shell 20W-50 - 1L")
    // and prices match, consider it a match
    const namesMatch = name1 === name2 || 
                       name1.includes(name2) || 
                       name2.includes(name1);
    
    if (namesMatch) {
      // Price match within 0.01 tolerance (more lenient for floating point)
      if (Math.abs(price1 - price2) < 0.01) {
        return true;
      }
    }
  }
  
  // Last resort: Match by price only if prices are very close and one name is empty
  // This handles cases where original transaction doesn't have name but refund request does
  if (Math.abs(price1 - price2) < 0.001 && (name1 === "" || name2 === "")) {
    return true;
  }
  
  return false;
}

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

    // Validate cashier/staff ID and convert to UUID
    const { getStaffUuidById } = await import("@/lib/utils/staff-validation");
    const staffUuid = await getStaffUuidById(refundData.cashierId);
    
    if (!staffUuid) {
      return NextResponse.json(
        {
          error: "Invalid cashier ID",
          details: `No active staff member found with ID: ${refundData.cashierId}`,
        },
        { status: 400 }
      );
    }

    console.log(`✅ Cashier validated and converted to UUID: ${staffUuid}`);

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

    // Prevent refunding a refund transaction
    if (originalTransaction.type === "REFUND") {
      return NextResponse.json(
        {
          error: "Cannot refund a refund transaction",
          details: `Transaction ${refundData.originalReferenceNumber} is already a refund transaction. Cannot refund a refund.`,
        },
        { status: 400 }
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

    // Check for existing refunds for this original transaction
    const { data: existingRefunds, error: refundsError } = await supabase
      .from("transactions")
      .select("items_sold")
      .eq("type", "REFUND")
      .eq("original_reference_number", refundData.originalReferenceNumber);

    if (refundsError) {
      console.error("❌ Critical error checking existing refunds:", refundsError);
      return NextResponse.json(
        {
          error: "Failed to validate refund",
          details: "Could not check for existing refunds. Please try again or contact support.",
        },
        { status: 500 }
      );
    }

    console.log(`🔍 Found ${existingRefunds?.length || 0} existing refund(s) for transaction ${refundData.originalReferenceNumber}`);

    // Get original transaction items for validation
    const originalItems = originalTransaction.items_sold as Array<any> | null;
    
    if (!originalItems || !Array.isArray(originalItems)) {
      console.error("❌ Original transaction items invalid:", originalItems);
      return NextResponse.json(
        {
          error: "Invalid transaction data",
          details: "Original transaction items could not be parsed.",
        },
        { status: 400 }
      );
    }

    console.log(`📦 Original transaction has ${originalItems.length} item(s)`);
    console.log("📦 Original items:", JSON.stringify(originalItems.map(item => ({
      id: getItemIdentifier(item),
      name: item.name || item.productName,
      price: item.price || item.sellingPrice,
      quantity: item.quantity
    })), null, 2));

    // Check if any items have already been refunded
    if (existingRefunds && existingRefunds.length > 0) {
      console.log(`🔍 Checking ${existingRefunds.length} existing refund(s) for duplicates...`);
      
      // Collect all refunded items from existing refunds
      // CRITICAL: Store the actual item objects, not just identifiers, for proper matching
      const refundedItemsList: Array<{ item: any; quantity: number }> = [];
      
      for (const refund of existingRefunds) {
        const refundedItems = refund.items_sold as Array<any> | null;
        
        if (refundedItems && Array.isArray(refundedItems)) {
          console.log(`  📦 Processing refund with ${refundedItems.length} item(s)`);
          for (const item of refundedItems) {
            const itemName = item.name || item.productName || item.product_name || item.volumeDescription || "Unknown";
            const itemQty = item.quantity || 1;
            
            refundedItemsList.push({
              item: item,
              quantity: itemQty,
            });
            
            console.log(`    ✓ Refunded: ${itemName} (Qty: ${itemQty})`, {
              id: item.id,
              productId: item.productId,
              volumeDescription: item.volumeDescription,
              name: item.name,
              price: item.price,
            });
          }
        }
      }

      console.log(`📊 Total refunded items tracked: ${refundedItemsList.length} item(s)`);

      // Validate each item being refunded
      for (const refundItem of refundData.refundItems) {
        const refundItemName = refundItem.name || "Unknown";
        const refundItemQty = refundItem.quantity || 1;
        
        console.log(`🔎 Validating refund item: ${refundItemName} (Qty: ${refundItemQty})`, {
          refundItem: {
            id: refundItem.id,
            productId: refundItem.productId,
            name: refundItem.name,
            volumeDescription: refundItem.volumeDescription,
            price: refundItem.price,
            quantity: refundItemQty,
            allIds: getAllItemIds(refundItem),
          },
        });

        // CRITICAL: First check if this item matches any already-refunded items
        // This must happen BEFORE checking against original items
        // Use itemsMatch function for proper lubricant matching (handles volumeDescription)
        let matchedRefundedItem: { item: any; quantity: number } | undefined;
        let totalRefundedQty = 0;
        
        for (const refundedEntry of refundedItemsList) {
          if (itemsMatch(refundedEntry.item, refundItem)) {
            matchedRefundedItem = refundedEntry;
            totalRefundedQty += refundedEntry.quantity;
            console.log(`    ⚠️ Found matching refunded item:`, {
              refundedItem: {
                id: refundedEntry.item.id,
                productId: refundedEntry.item.productId,
                name: refundedEntry.item.name,
                volumeDescription: refundedEntry.item.volumeDescription,
                price: refundedEntry.item.price,
                quantity: refundedEntry.quantity,
              },
              totalRefundedQty,
            });
          }
        }

        // Find matching original item using improved matching
        // Log detailed comparison for debugging
        console.log(`    🔍 Attempting to match refund item against original transaction:`, {
          refundItem: {
            id: refundItem.id,
            productId: refundItem.productId,
            name: refundItemName,
            volumeDescription: refundItem.volumeDescription,
            price: refundItem.price,
            quantity: refundItemQty,
            allIds: getAllItemIds(refundItem),
          },
          originalItems: originalItems.map(item => ({
            id: item.id,
            productId: item.productId,
            product_id: item.product_id,
            name: item.name || item.productName || item.product_name || item.volumeDescription,
            volumeDescription: item.volumeDescription,
            price: item.price || item.sellingPrice,
            sellingPrice: item.sellingPrice,
            allIds: getAllItemIds(item),
          })),
        });
        
        // Try to find matching item in original transaction
        let originalItem = originalItems.find((item) => itemsMatch(item, refundItem));
        
        // If not found, try a more lenient match by checking if productId matches
        if (!originalItem && refundItem.productId) {
          console.log(`    🔄 Trying productId-based match: ${refundItem.productId}`);
          originalItem = originalItems.find((item) => {
            const itemProductId = item.productId || item.product_id || item.id;
            return String(itemProductId) === String(refundItem.productId);
          });
        }
        
        if (!originalItem) {
          // If we found a matching refunded item but couldn't match original, 
          // it means the item was already refunded (this is the duplicate case)
          if (matchedRefundedItem) {
            console.error(`❌ Item already refunded (found in refunds but not in original): ${refundItemName}`);
            return NextResponse.json(
              {
                error: "Item already refunded",
                details: `Item "${refundItemName}" has already been refunded. Cannot refund this item again.`,
              },
              { status: 400 }
            );
          }
          
          console.error(`❌ Item not found in original transaction: ${refundItemName}`);
          console.error(`   Refund item details:`, JSON.stringify({
            id: refundItem.id,
            productId: refundItem.productId,
            name: refundItem.name,
            volumeDescription: refundItem.volumeDescription,
            price: refundItem.price,
            quantity: refundItem.quantity,
            allIds: getAllItemIds(refundItem),
          }, null, 2));
          console.error(`   Available original items:`, JSON.stringify(originalItems.map(item => ({
            id: item.id,
            productId: item.productId,
            product_id: item.product_id,
            name: item.name || item.productName || item.product_name || item.volumeDescription,
            volumeDescription: item.volumeDescription,
            price: item.price || item.sellingPrice,
            quantity: item.quantity,
            allIds: getAllItemIds(item),
          })), null, 2));
          
          return NextResponse.json(
            {
              error: "Item not found in original transaction",
              details: `Item "${refundItemName}" was not found in the original transaction. Please verify the item selection.`,
            },
            { status: 400 }
          );
        }
        
        console.log(`    ✅ Matched original item:`, {
          id: originalItem.id,
          productId: originalItem.productId || originalItem.product_id,
          name: originalItem.name || originalItem.productName || originalItem.product_name || originalItem.volumeDescription,
          volumeDescription: originalItem.volumeDescription,
          price: originalItem.price || originalItem.sellingPrice,
        });

        const originalQty = originalItem.quantity || 0;
        
        console.log(`    📊 Original item: ${originalItem.name || originalItem.productName || originalItem.volumeDescription} (Qty: ${originalQty})`);
        console.log(`    📈 Already refunded: ${totalRefundedQty}, Original: ${originalQty}, Requested: ${refundItemQty}`);

        // Calculate available quantity
        const availableQty = originalQty - totalRefundedQty;

        // CRITICAL: If no quantity is available, reject immediately
        if (availableQty <= 0) {
          console.error(`❌ Item fully refunded: ${refundItemName} (${totalRefundedQty} of ${originalQty} refunded)`);
          return NextResponse.json(
            {
              error: "Item already refunded",
              details: `Item "${refundItemName}" has already been fully refunded (${totalRefundedQty} of ${originalQty}). Cannot refund this item again.`,
            },
            { status: 400 }
          );
        }

        // Check if requested quantity exceeds available
        if (refundItemQty > availableQty) {
          console.error(`❌ Insufficient quantity: ${refundItemName} (Available: ${availableQty}, Requested: ${refundItemQty})`);
          return NextResponse.json(
            {
              error: "Item already refunded",
              details: `Item "${refundItemName}" has already been partially refunded. Available quantity for refund: ${availableQty}, requested: ${refundItemQty}.`,
            },
            { status: 400 }
          );
        }

        console.log(`    ✅ Item validated: ${availableQty} available, ${refundItemQty} requested`);
      }

      console.log("✅ All items validated successfully - no duplicates detected");
    } else {
      console.log("✅ No existing refunds found - proceeding with refund");
    }

    // Use location_id and shop_id from original transaction if provided, otherwise use from request
    // This ensures we use valid UUIDs from the original transaction
    const locationId = originalTransaction.location_id || refundData.locationId;
    const shopId = originalTransaction.shop_id || refundData.shopId;

    // Validate UUID format for location_id and shop_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(locationId)) {
      return NextResponse.json(
        {
          error: "Invalid location ID",
          details: `Location ID must be a valid UUID. Received: ${locationId}`,
        },
        { status: 400 }
      );
    }

    if (shopId && !uuidRegex.test(shopId)) {
      return NextResponse.json(
        {
          error: "Invalid shop ID",
          details: `Shop ID must be a valid UUID. Received: ${shopId}`,
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
      location_id: locationId, // Use validated UUID from original transaction
      shop_id: shopId || null, // Use validated UUID from original transaction, allow null
      cashier_id: staffUuid, // Use UUID instead of staff_id text
      type: "REFUND",
      total_amount: -refundData.refundAmount, // Negative amount for refunds
      items_sold: refundData.refundItems,
      payment_method: "REFUND",
      original_reference_number: refundData.originalReferenceNumber,
      customer_id: refundData.customerId || null,
      car_plate_number: refundData.carPlateNumber || null,
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
      console.error("❌ Error creating refund transaction:", refundError);
      console.error("Refund transaction data:", JSON.stringify(refundTransaction, null, 2));
      
      // Provide more detailed error information
      let errorMessage = refundError.message;
      if (refundError.code === "23503") {
        errorMessage = "Invalid foreign key reference. Please check location_id, shop_id, or cashier_id.";
      } else if (refundError.code === "23505") {
        errorMessage = "A refund with this reference number already exists.";
      } else if (refundError.code === "23502") {
        errorMessage = "Required field is missing. Please check all required fields.";
      }
      
      return NextResponse.json(
        {
          error: "Failed to create refund transaction",
          details: errorMessage,
          code: refundError.code,
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
