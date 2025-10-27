Phase 11: Refactoring the Checkout API for Precise Lubricant Sales
Goal: To refactor the checkout API endpoint to implement the new, precise logic for selling lubricants. This will handle deducting from either a new closed bottle or an existing open bottle.

Prompt:

Refactor the Next.js API endpoint for checkouts at `/api/checkout`. The logic for handling products in the "Lubricants" category needs to be completely updated to use the new `open_bottle_details` table. This logic must be executed within the existing Drizzle database transaction.

**Updated Input:** The payload for a cart item that is a lubricant should now include a `source` property, which can be either `'CLOSED'` or `'OPEN'`, based on the cashier's selection in the UI.

**New Lubricant Checkout Logic:**

- When processing a lubricant item from the cart:

  **1. If the `source` is `'CLOSED'`: (Selling from a new bottle)**
  a. Decrement the `closed_bottles_stock` count in the `inventory` table by 1.
  b. Increment the `open_bottles_stock` count in the `inventory` table by 1.
  c. Create a **new record** in the `open_bottle_details` table.
  d. Set its `inventory_id` to the correct item.
  e. Set its `initial_volume` to the bottle's standard size (e.g., 4.0).
  f. Set its `current_volume` to (`initial_volume` - `quantity_sold`).
  g. Check if the `current_volume` is now zero. If so, set its `is_empty` flag to `true` and decrement the `open_bottles_stock` count in `inventory`.

  **2. If the `source` is `'OPEN'`: (Selling from an existing open bottle)**
  a. Query the `open_bottle_details` table to find the oldest, non-empty bottle (`is_empty: false`) for that `inventory_id`, ordered by `opened_at` ascending.
  b. If no open bottle is found, return an error.
  c. Decrement the `current_volume` of that specific open bottle record by the `quantity_sold`.
  d. Check if the `current_volume` of that bottle is now less than or equal to zero.
  e. If it is, set its `is_empty` flag to `true` and decrement the `open_bottles_stock` count in the `inventory` table by 1.

- Ensure all other checkout functionalities (FIFO for other products, transaction logging, etc.) remain intact.
