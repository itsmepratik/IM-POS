Phase 7: Trade-In Price Management API
Goal: To create the backend endpoints and connect the frontend UI for managing the prices of scrap and resalable batteries.

Prompt:

Create a new Next.js API route file at `/api/trade-in/prices` to manage the `trade_in_prices` table. The existing frontend component "Manage Trade-in Price" needs to be wired up to this API.

**Implement the following functionality:**

1.  **`GET` Request Handler:**

    - Fetches and returns all records from the `trade_in_prices` table. This will populate the management UI.

2.  **`POST` Request Handler:**
    - Accepts an array of trade-in price objects, e.g., `[{ size: "80", condition: "Scrap", trade_in_value: 2.5 }, ...]`.
    - For each object in the array, perform an "upsert" operation into the `trade_in_prices` table:
      - If a record with the given `size` and `condition` already exists, update its `trade_in_value`.
      - If it does not exist, insert a new record.
    - Return a success message upon completion.
