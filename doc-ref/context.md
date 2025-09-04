# Web Application Context: POS System

This document provides a comprehensive overview of the web application's structure, focusing on the Point of Sale (POS) system within the `app/pos` directory. It details page structures, workflows, inventory handling, and identifies areas for future development, particularly concerning multi-location management.

## 1. Application Structure Overview

The application is built with Next.js and React, utilizing a component-based architecture. State management is primarily handled through React Context and custom hooks. Styling is implemented using Tailwind CSS.

### 1.1. Core Pages

- **`app/page.tsx` (Root/Landing Page):** Not directly analyzed in depth for this context, but serves as the entry point to the application. It is assumed to handle authentication and routing to different modules, including the POS.
- **`app/customers/page.tsx` (Customers Page):** Although not fully analyzed, the `POSCustomerForm` component in `app/pos/page.tsx` and the `CustomerData` and `Vehicle` types imported from `@/app/customers/customer-form` indicate a dedicated customer management section. This page likely provides functionality to view, add, edit, and manage customer profiles and their associated vehicles.
- **`app/pos/page-new.tsx` (Point of Sale Page):** This is the core POS interface, a client-side component (due to `"use client"` directive). It serves as the primary interaction point for cashiers to process sales, refunds, and manage the cart. It integrates various sub-components, contexts, and hooks to provide a rich user experience. This page has been refactored to use `CartProvider` and `CategoryProvider` for global state management.

### 1.2. Key Components (`app/pos/components/`)

The `app/pos/components/` directory contains modular UI elements that build the POS interface.

- **Category Components:**
  - `LubricantCategory.tsx`: Displays various lubricant brands. Clicking a brand expands to show different lubricant types (e.g., 0W-20, 5W-30). Selecting a lubricant type triggers the `VolumeModal` for volume selection.
  - `FiltersCategory.tsx`: Presents different filter types. Selecting a type expands to show available brands, which then opens the `FilterModal`.
  - `PartsCategory.tsx`: Similar to `FiltersCategory`, it displays part types and brands, leading to the `PartsModal`. This category also handles batteries and spark plugs.
  - `AdditivesFluidsCategory.tsx`: Lists additive and fluid products, grouped by brand.
- **Modals/Dialogs:**
  - `volume-modal.tsx`: Facilitates the selection of specific volumes (e.g., 5L, 1L) and quantities for a chosen lubricant product, and allows specifying if it's an "open" or "closed" bottle.
  - `filter-modal.tsx`: Enables the selection of specific filter products from a chosen brand and type, including quantity adjustment.
  - `parts-modal.tsx`: Similar to `filter-modal`, but for vehicle parts.
  - `product-modal.tsx`: A more generic modal that appears to be a predecessor or alternative for selecting product variants. In the `page-new.tsx` structure, specialized modals like `volume-modal`, `filter-modal`, and `parts-modal` are preferred.
  - `trade-in-dialog.tsx`: Manages the process of trading in old batteries, allowing input of size, status (scrap/resellable), and amount, and calculates the total trade-in value as a discount.
  - `refund-dialog.tsx`: Orchestrates the refund workflow, including searching for receipts, selecting items for refund, confirming the refund, and generating a `RefundReceipt`. It also incorporates test refund scenarios for quick development and testing.
  - `import-dialog.tsx`: A general-purpose dialog for importing data (e.g., customer details or product lists).
- **Cart and Bill Related Components:**
  - `cart.tsx`: Displays the items currently in the customer's cart, showing names, quantities, and prices. It also provides options to clear the cart or proceed to checkout.
  - `cart-item.tsx`: Represents a single item within the cart, allowing for quantity adjustments and removal.
  - `bill-component.tsx`: Responsible for rendering the final sales bill, incorporating company details, itemized list, discounts, trade-in amounts, and total. It includes print functionality.
  - `refund-receipt.tsx`: Generates a printable refund receipt, similar in structure to the sales bill but detailing refunded items and amounts.
- **Shared UI Elements:**
  - `brand-card.tsx`: A reusable card component to display a brand logo and name, often used in category views.
  - `brand-logo.tsx`: Handles displaying brand SVG/PNG logos with fallback to a generic icon if images are not found.
  - `numpad.tsx` (from `page.tsx`): A numeric keypad for entering IDs (e.g., cashier ID).
  - `POSCustomerForm.tsx` (from `page.tsx`): A form for adding new customer details, including multiple vehicles.

### 1.3. Contexts (`app/pos/context/`)

These contexts provide global state management for critical aspects of the POS system.

- **`CartContext.tsx`:** Manages the state of the shopping cart (`cart: CartItem[]`). It provides functions to `addToCart`, `removeFromCart`, `updateQuantity`, `clearCart`, calculate `getTotal` amount, and get the `getItemCount`. This centralizes cart logic, making it accessible throughout the POS interface.
- **`CategoryContext.tsx`:** Manages the currently `activeCategory` (e.g., "Lubricants", "Filters") in the POS interface, along with a `setActiveCategory` function. This drives the display of products relevant to the selected category.

### 1.4. Hooks (`app/pos/hooks/`)

Custom hooks abstract and encapsulate logic, making components cleaner and more reusable.

- **`useCart.tsx`:** Re-exports the `useCartContext` and provides additional utility functions like `calculateCartTotals`, `formatCartForReceipt`, and `getCartSummary`, offering a more comprehensive interface for cart-related operations.
- **`useCategory.tsx`:** Re-exports the `useCategoryContext` and includes utility functions like `getCategoryDisplayName` and `getCategoryIcon` for consistent display of category information.
- **`lib/hooks/data/usePOSMockData.ts`:** Provides mock data for all product categories (lubricants, filters, parts, additives & fluids), including brands, types, and individual products. This hook is a placeholder for actual data fetching from a backend database (likely Supabase).
- **`@/lib/hooks/useCompanyInfo.ts`:** Used by `BillComponent` and `RefundDialog` to retrieve company details (name, address, contact, etc.) for printing receipts. Currently, it provides fallback data if no registered information is available.
- **`@/lib/hooks/useStaffIDs.ts`:** Used by `RefundDialog` to fetch staff member IDs and names, likely for associating refunds with specific cashiers.

### 1.5. Types (`app/pos/types/index.ts`)

This file centralizes TypeScript interface definitions, ensuring type safety and consistency across the application. Key interfaces include:

- `CartItem`: Defines the structure of an item in the shopping cart, including `id`, `name`, `price`, `quantity`, `details`, `uniqueId`, `bottleType`, `category`, and `brand`.
- `Product`: Represents a generic product with `id`, `name`, `price`, `category`, `brand`, and `type`.
- `LubricantProduct`: Specific type for lubricants, including `brand`, `basePrice`, `type`, `image`, and `volumes`.
- `SelectedVolume`: Details selected volume for lubricants, including `size`, `quantity`, `price`, and `bottleType`.
- `CategoryComponentProps`, `Brand`, `FilterType`, `PartType`: Interfaces for props and data structures used in category-related components.
- `CategoryType`: A union type defining the possible product categories.

## 2. Workflows

### 2.1. Sales Workflow

1.  **Cashier Identification:** (Implicit from `Numpad` and `cashierId` state in `page.tsx`, less explicit in `page-new.tsx` where it's assumed to be handled before `POSPageContent` is rendered or is managed by an external `useStaffIDs` hook). A cashier typically logs in or enters an ID to start a shift.
2.  **Product Browsing/Selection:**
    - Cashier navigates through product categories using tabs (Lubricants, Filters, Parts, Additives & Fluids).
    - Within each category, they select specific products.
      - **Lubricants:** Select a brand, then a lubricant type. The `VolumeModal` appears, allowing the selection of one or more volumes (e.g., 2x5L, 1x1L) and specifying if a 1L/500ml bottle is "open" or "closed."
      - **Filters/Parts:** Select a type, then a brand. The `FilterModal` or `PartsModal` then displays available products for that brand/type, allowing selection and quantity adjustment.
      - **Additives & Fluids:** Select a brand, then individual products, adding them directly to the cart.
    - A search bar allows quick lookup of products across categories.
3.  **Cart Management:**
    - Selected products are added to the `CartContext`.
    - The cart sidebar (`cart.tsx`) displays all selected items, their quantities, and subtotals.
    - Cashiers can adjust quantities of items or remove items from the cart.
4.  **Customer Assignment (Optional):** The `POSCustomerForm` allows adding a new customer or associating an existing customer with the current transaction. This is crucial for tracking sales history and vehicle details.
5.  **Special Discounts/Trade-ins:**
    - **Discounts:** A discount dialog (state present in `page.tsx`) allows applying a percentage or fixed amount discount to the total bill.
    - **Battery Trade-in:** The `TradeInDialog` handles the process of accepting old batteries as trade-ins, calculating a discount amount based on their size and status.
6.  **Checkout & Payment:**
    - The total amount, including any discounts or trade-ins, is calculated.
    - The cashier selects a payment method (Card, Cash, Mobile, Voucher).
    - Upon successful payment, a transaction is finalized.
7.  **Bill Generation & Printing:** A sales bill is generated by `BillComponent` and can be printed. Transaction details (receipt number, date, time) are recorded.

### 2.2. Refund Workflow

1.  **Initiate Refund:** Cashier clicks the "Refund" button, opening the `RefundDialog`.
2.  **Receipt Lookup:** The cashier enters a receipt number to search for a past transaction. `mockReceipts` in `refund-dialog.tsx` simulates a database lookup.
3.  **Item Selection:** Once the receipt is found, a list of purchased items is displayed. The cashier selects the specific items to be refunded.
4.  **Refund Confirmation:** A summary of the refund (items, amount) is presented for confirmation.
5.  **Cashier Verification:** The cashier's ID is verified (via Numpad) to authorize the refund.
6.  **Refund Processing:** The refund is processed, and the system logs the transaction.
7.  **Refund Receipt Generation & Printing:** A refund receipt is generated by `RefundReceipt` and can be printed.

### 2.3. Inventory Management (Current State & Future Considerations)

Currently, inventory data is hardcoded within `lib/hooks/data/usePOSMockData.ts`. This mock data includes:

- `lubricantProducts`: Detailed lubricant information, including volumes and prices.
- `products`: General products encompassing filters, parts, and additives/fluids.
- Derived lists of `filterBrands`, `filterTypes`, `partBrands`, `partTypes`, and `lubricantBrands`.

**Key Observation:** There is no explicit frontend UI or backend API integration for real-time inventory management (e.g., tracking stock levels, updating quantities after sales, receiving new stock, conducting inventory counts). This is a significant area for future development. The existing data is static and does not reflect actual stock.

## 3. Handling of Multiple Locations

The current frontend codebase **does not explicitly contain logic or UI elements for handling multiple physical store locations (branches)**.

- The `useCompanyInfo` hook provides a single set of company details.
- There are no mechanisms for a user to select a location, view location-specific inventory, or route transactions to different branches.
- The concept of "three locations" is mentioned in the prompt, but this is not reflected in the application's current structure or data flow.

**Implications:**

- **Database Design:** A multi-tenant or multi-branch database design will be required on the backend (likely Supabase, as suggested in `sp-plan.md`) to support distinct inventories, sales, and customer data per location.
- **Frontend Implementation:**
  - A location selection mechanism will be needed (e.g., a dropdown in the header).
  - All data fetching (products, prices, customer history, staff IDs) will need to be scoped by the selected location.
  - Inventory updates and sales transactions must be associated with the correct location.
  - Reporting and analytics would also need to be location-aware.

## 4. Key Takeaways and Future Foundation

This `context.md` file serves as a foundation for understanding the current POS system.

**Strengths:**

- Modular component design within `app/pos`.
- Centralized state management for cart and categories using React Context.
- Clear workflows for sales and refunds.
- Use of mock data allows for isolated frontend development.
- Dedicated components for different product categories.

**Areas for Future Development / Further Detail:**

1.  **Multi-Location Support:**
    - Implement a clear strategy for managing and switching between the three mentioned locations.
    - Integrate backend APIs to fetch and manage location-specific data (inventory, sales, customers, staff).
    - Design UI for location selection and display of the active location.
2.  **Real Inventory System:**
    - Replace `usePOSMockData.ts` with actual API calls to a Supabase backend for product catalog and real-time stock levels.
    - Implement logic to decrement stock upon sales and increment upon returns/new stock.
    - Consider adding an inventory management interface (e.g., dedicated pages for stock viewing, adjustments, transfers).
3.  **Authentication/Authorization:** Details on cashier login and permissions are currently implicit/missing. This will be critical for a production system, especially with multi-location support.
4.  **Error Handling and Robustness:** While some basic toast notifications are present, a comprehensive error handling strategy for API calls (e.g., network failures, invalid responses) and edge cases should be implemented.
5.  **Analytics and Reporting:** Once real data and multi-location support are in place, developing dashboards and reports for sales, inventory, and refunds per location will be essential.

This document will be updated as the application evolves and more details regarding backend integration and multi-location functionality become available.
