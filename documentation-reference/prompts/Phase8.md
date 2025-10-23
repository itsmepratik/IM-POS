Phase 8: Advanced Checkout API (Refactoring)
Goal: To completely refactor the existing checkout logic to handle the complex battery sale workflow, including trade-ins, inventory updates for traded-in items, and storing the correct bill format.

Prompt:

Refactor the Next.js API endpoint for checkouts at `/api/checkout`. This endpoint must now handle standard sales, battery sales, and battery sales with trade-ins, all within a single Drizzle database transaction.

**Input:** The endpoint will receive a payload containing `locationId`, `shopId`, `paymentMethod`, a `cart` array, and an optional `tradeIns` array.

- The `tradeIns` array will contain objects like `{ productId: "...", size: "80", condition: "Scrap", quantity: 1, trade_in_value: 2.5 }`.

**Endpoint Logic:**

1.  **Start a Database Transaction.**
2.  **Process Cart Items:** Perform the existing FIFO logic to decrement stock for all items sold in the `cart`.
3.  **Process Trade-Ins (if the `tradeIns` array is present):**
    - For each item in the `tradeIns` array:
      - Find the corresponding product in the `products` table (e.g., the one named "80 Scrap").
      - **Increment** the `standard_stock` for this product in the `inventory` table at the given `locationId`.
      - Log this action by creating a new record in the `trade_in_transactions` table, linking it to the main transaction ID.
4.  **Calculate Totals:** Calculate the final `total_amount` by summing the cart item prices and subtracting the sum of all `trade_in_value` amounts.
5.  **Generate and Store Bill/Receipt:**
    - **Check the cart:** Determine if any of the products sold belong to the "Batteries" category.
    - **If it is a battery sale:** Generate the specific A5-sized bill HTML. Store this HTML string in the `battery_bill_html` column of the `transactions` table. Leave `receipt_html` as null.
    - **If it is a regular sale:** Generate the standard thermal receipt HTML. Store this HTML string in the `receipt_html` column. Leave `battery_bill_html` as null.
6.  **Create Transaction Record:** Create the final record in the `transactions` table, ensuring you save the `shop_id`, the calculated `total_amount`, and the appropriate bill/receipt HTML.
7.  **Commit the Transaction.**
8.  Return the final transaction details and the generated HTML to the frontend for immediate printing.
