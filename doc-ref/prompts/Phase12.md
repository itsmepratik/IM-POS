Phase 12: Updating Data Fetching API for Frontend Display
Goal: To update the API that serves data to the frontend, so that the Inventory and POS pages can accurately display the new, detailed information about open bottles.

Prompt:

Modify the versatile Next.js API endpoint at `/api/products/fetch` to provide the detailed data required by the frontend UI for managing and selling lubricants.

**Functionality Updates:**

1.  **For the Inventory Page (`/api/products/fetch?locationId=<id>`):**
    * When fetching a product that belongs to the "Lubricants" category, the returned JSON object for that product must now include:
        * `closed_bottles_stock`: The count from the `inventory` table.
        * `open_bottles_stock`: The count of non-empty open bottles.
        * A new nested array named `openBottleDetails`. This array should contain a list of all individual, non-empty bottles from the `open_bottle_details` table for that product, showing their `id` and `current_volume`. (e.g., `openBottleDetails: [{ id: '...', current_volume: 3.5 }, { id: '...', current_volume: 1.2 }]`).

2.  **For the POS Page (`/api/products/fetch?locationId=<id>&category=Lubricants...`):**
    * When fetching a lubricant product for the POS, the returned JSON object must include the `open_bottles_stock` count.
    * The frontend will use this count to conditionally enable or disable the "Sell from Open Bottle" option in the UI.