Phase 6: Database Schema Enhancement for Batteries & Multi-Shop Tracking
Goal: To update the database schema using Drizzle ORM to support the new functionalities. This is the foundational step before any backend or frontend code can be written.

Prompt:

I need to update my existing Drizzle ORM schema to handle battery trade-ins and track sales from different shops at the same location. Generate a Drizzle migration file to perform the following changes:

1.  **Modify the `transactions` Table:**

    - Add a new column `shop_id`: UUID, foreign key referencing `locations.id`. This will store which specific shop (e.g., "Sanaiya 1") made the sale, even if it shares the location ID of the main branch.
    - Add a new column `receipt_html`: Text, nullable. This will store the generated HTML for standard thermal receipts.
    - Add a new column `battery_bill_html`: Text, nullable. This will store the generated HTML for the unique A5-sized battery bills.

2.  **Create a `trade_in_prices` Table:**

    - This table will act as a master list for the value of trade-in batteries, managed by the admin.
    - `id`: UUID, primary key.
    - `size`: Text, not null (e.g., "80", "50", "40").
    - `condition`: Text, not null (either "Scrap" or "Resalable").
    - `trade_in_value`: Numeric, not null. This is the fixed value/discount given to the customer.
    - Add a unique constraint on the combination of `size` and `condition`.

3.  **Create a `trade_in_transactions` Table:**

    - This table will log every battery that is traded in as part of a sale, creating a historical record.
    - `id`: UUID, primary key.
    - `transaction_id`: UUID, foreign key referencing `transactions.id`.
    - `product_id`: UUID, foreign key referencing the specific trade-in product in the `products` table (e.g., the product named "80 Scrap").
    - `quantity`: Integer, not null.
    - `value_at_time_of_trade`: Numeric, not null. The discount amount for this item applied to the transaction.

4.  **Modify the `products` Table:**
    - Add a new column `product_type`: Text, nullable. This will be used to flag items like "Scrap" or "Resalable" to make them easy to filter for the trade-in inventory view.

After defining these schema changes, generate the SQL migration file.
