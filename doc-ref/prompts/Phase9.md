Phase 9: Frontend Enhancements for Inventory and Transactions
Goal: To implement the UI changes on the Inventory and Transactions pages to support the new features.

Prompt:

I need to update two key frontend pages in my Next.js application using React/Tailwind CSS to reflect the new backend capabilities.

**1. Update the Inventory Page:**

- Implement the logic for the "Show Trade-in Batteries" toggle switch.
- When the toggle is OFF, the page should fetch data from the `/api/products/fetch?locationId=<id>` endpoint as normal.
- When the toggle is ON, the page should fetch data from `/api/products/fetch?locationId=<id>&showTradeIns=true`.
- The API will return only the "Scrap" and "Resalable" battery products. The frontend should render these items in the inventory table.

**2. Update the Transactions Page:**

- **Shop Filter Dropdown:**
  - Wire up the shop selector dropdown (Sanaiya 1, Sanaiya 2).
  - When a shop is selected, re-fetch the transactions list, passing the selected `shopId` as a query parameter to the API. The API should filter the results accordingly.
- **Universal Print Button Logic:**
  - Modify the "Print" button's `onClick` handler for each transaction row.
  - When clicked, the handler should fetch the full transaction record by its ID.
  - In the response, it should check the data:
    - If the `battery_bill_html` field is not null, it should trigger the print action using that HTML content.
    - Otherwise, it should use the content from the `receipt_html` field.
  - This logic ensures the correct format is reprinted without needing a separate `bill_type` field.
