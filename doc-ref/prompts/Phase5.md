Phase 5: Dispute Logic via Bill Number
Goal: To handle refunds and warranty claims by using the bill number to fetch the original sale and updating inventory appropriately based on the new, detailed schema.

Prompt:

Create a Next.js API endpoint for handling disputes (`/api/dispute`).

**Input:** A payload containing `originalBillNumber`, `disputeType` ('REFUND' or 'WARRANTY_CLAIM'), `locationId`, `shopId`, `cashierId`, and an array of `disputedItems` (`productId`, `quantity`).

**Logic:**

1.  **Fetch & Validate:** Use the `originalBillNumber` to query the `transactions` table. If not found, return an error.
2.  **Create Dispute Transaction:** Within a database transaction, create a new record in the `transactions` table.
    - Generate a **new** unique `reference_number` for this dispute.
    - Set the `type` to the `disputeType` from the input.
    - Set the `original_reference_number` to link it to the original sale.
    - Include `locationId`, `shopId`, and `cashierId`.
    - Populate `items_sold` and `total_amount` based on the `disputedItems`. For a refund, the total amount should be negative.
3.  **Perform Conditional Inventory Update:**
    - **If `disputeType` is 'REFUND':** For each item, find its `inventory` record. If the product is a lubricant, **increment** `closed_bottles_stock`. If it is a standard product (including battery trade-in types), **increment** `standard_stock`.
    - **If `disputeType` is 'WARRANTY_CLAIM':** Make **no changes** to any inventory stock levels.
4.  **Generate & Store Receipts:**
    - For non-battery disputes, generate the thermal receipt HTML and store it in `receipt_html`.
    - For battery disputes, generate the A5-sized bill HTML and store it in `battery_bill_html`.
5.  Return a success message.
