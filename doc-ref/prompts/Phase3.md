Phase 3: Data Fetching API for Inventory & POS
Goal: To create a flexible backend API that can serve product and inventory data to both the main/branch inventory pages and the highly custom POS page.

Prompt:

Create a versatile Next.js API endpoint (`/api/products/fetch`) to read product and inventory data. The function must adapt its query based on URL parameters to serve different parts of the UI.

**Functionality Required:**

1.  **For Inventory Pages (`/api/products/fetch?locationId=<id>`):**

    - When only a `locationId` is provided, fetch all products for that location.
    - Join `products` with `inventory` to get all stock details (`standard_stock`, `open_bottles_stock`, `closed_bottles_stock`, `total_stock`).
    - The response should be a list of products suitable for displaying in the main inventory table.

2.  **For the POS Page (`/api/products/fetch?locationId=<id>&category=<name>&...`):**
    - The function must handle additional parameters like `category`, `brand`, and `product_type` to facilitate the POS UI's drill-down flow.
    - **Crucially, if the fetched product's category is "Lubricants"**: The JSON object for that product must include an embedded array named `volumes` which contains all its pricing options from the `product_volumes` table. This is essential for the POS UI to display the volume selection modal correctly.
    - Return a JSON response that the existing frontend components can consume to render the dynamic dropdowns and product lists for each category.
