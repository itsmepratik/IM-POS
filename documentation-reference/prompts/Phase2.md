Phase 2: Product Management API (Create/Update)
Goal: To create a single, intelligent backend endpoint for creating and updating products. This endpoint must correctly handle the different data structures for lubricants versus standard products, as dictated by the UI.

Prompt:

Create a Next.js API endpoint (`/api/products/save`) to handle both the creation and updating of products. The frontend UI is already built and will send a comprehensive JSON payload.

**Endpoint Logic:**
1.  The endpoint should accept a `POST` request with the product data. If an `id` is present in the payload, it's an update; otherwise, it's a new creation.
2.  **Product Data:** Save or update the core details (name, category_id, brand, type, description, etc.) in the `products` table.
3.  **Conditional Logic based on Category:**
    * **If the product's category is "Lubricants":**
        * The payload will include an array of volumes and prices (e.g., `[{volume: "1L", price: 5.5}, {volume: "4L", price: 20.0}]`). You must upsert these records into the `product_volumes` table associated with the product ID.
        * The payload will also contain `open_bottles_stock` and `closed_bottles_stock` for a specific location. Upsert these values into the `inventory` table for that product and location.
    * **If the category is NOT "Lubricants":**
        * The payload will include a single `standard_stock` value and a single `selling_price`. Upsert these values into the corresponding columns in the `inventory` table.
4.  **Batch Creation:** The payload for a new product will include initial batch information (cost_price, quantity, supplier). Create the first record in the `batches` table for this inventory item and set `is_active_batch` to `true`.