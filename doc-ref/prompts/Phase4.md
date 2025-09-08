Phase 4: Checkout & FIFO Transaction Logic
Goal: To handle the checkout process by creating a transaction record, accurately updating inventory stock levels from the correct batch using First-In, First-Out (FIFO) logic, and generating receipts.

Prompt:

Create a Next.js API endpoint for handling checkouts (`/api/checkout`). This function must perform all actions within a single database transaction using Drizzle's transaction API.

**Input:** A payload containing `locationId`, `shopId`, `paymentMethod`, `cashierId`, a `cart` array (each object having `productId`, `quantity`, `selling_price`, and potentially `volume_description` for lubricants), and an optional `tradeIns` array (each object having `productId`, `quantity`, `trade_in_value`).

**Logic:**

1.  Generate a unique `reference_number` for the bill.
2.  Calculate the `total_amount` from the cart.
3.  Create a new record in the `transactions` table with `type` = 'SALE'. Store the cart details in the `items_sold` JSONB column. Include `locationId`, `shopId`, `paymentMethod`, and `cashierId`.
4.  **For each item in the `cart`:**
    a. Find the `inventory` record for the `productId` and `locationId`.
    b. Find the active batch (`is_active_batch: true`) for that inventory item, ordered by `purchase_date` ascending.
    c. Decrement the `stock_remaining` in that batch record by the quantity sold.
    d. Update the main stock count in the `inventory` table. For lubricants, prioritize decrementing `closed_bottles_stock`. For other products, decrement `standard_stock`.
    e. **FIFO Rule:** If depleting the active batch, set its `is_active_batch` to `false` and activate the next oldest batch.
5.  **Handle Trade-ins (if `tradeIns` array is present):**
    a. For each item in the `tradeIns` array:
    _ Create a record in the `trade_in_transactions` table, linking it to the current `transaction_id`.
    _ Find the `inventory` record for the `trade_in_product_id` (e.g., "80 Scrap") and `locationId`.
    _ **Increment** the `standard_stock` for this trade-in product in the `inventory` table.
    _ Apply the `trade_in_value` as a discount to the `total_amount` of the main transaction.
6.  **Generate & Store Receipts:**
    - For non-battery transactions, generate the thermal receipt HTML based on the transaction details and store it in the `receipt_html` column of the `transactions` table.
    - For battery transactions, generate the A5-sized bill HTML and store it in the `battery_bill_html` column of the `transactions` table.
