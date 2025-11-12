# Point of Sale System - Product Requirements Document

## 1. Introduction

This document outlines the comprehensive product requirements for a Point of Sale (POS) and inventory management system designed specifically for automotive service businesses. The system enables tracking of specialty products like oils with volume-based pricing and special handling needs, alongside traditional inventory management for parts, filters, and other automotive products. The PRD serves as a reference for the development team, providing detailed specifications for features, user interface, technical requirements, and design guidelines to ensure consistent implementation of the product vision.

## 2. Product Overview

The POS system is a comprehensive solution that combines point-of-sale functionality with real-time inventory management. It is specifically tailored for automotive service shops that need to track oil products (which can be sold in partial volumes from larger containers), parts, filters, batteries, and other automotive-related items. The application provides an intuitive interface for sales transactions, inventory tracking across multiple locations and shops, batch management, and financial reporting.

Key features include:

- Multiple transaction types: sales, refunds, warranty claims, credit transactions, on-hold transactions, and stock transfers
- Battery trade-in management with scrap/resellable status tracking
- Customer and vehicle management
- Staff management with transaction tracking
- Sequential reference number generation for all transactions
- Digital receipt generation with HTML storage
- Mobile payment integration (Adanan/Forman)
- Role-based access control with granular permissions
- Multi-location and multi-shop support

The system emphasizes ease of use, performance, and real-time data synchronization across multiple locations.

## 3. Goals and Objectives

### 3.1 Primary Goals

- Create an intuitive POS interface for processing sales of automotive products and services
- Provide specialized inventory management for oil products that can be sold in partial volumes
- Enable real-time inventory tracking across multiple branches
- Support batch-based inventory management to track costs and expiration dates
- Deliver comprehensive sales reporting and analytics
- Ensure responsive performance across all device types

### 3.2 Success Metrics

- Reduction in inventory discrepancies by at least 90%
- Improvement in transaction processing time by at least 50%
- Accurate tracking of partial oil usage from larger containers
- Complete visibility of inventory across multiple branches

## 4. Target Audience

### 4.1 Primary Users

- Cashiers/Sales staff processing transactions
- Inventory managers overseeing stock levels
- Branch managers reviewing sales and inventory data
- Shop owners/administrators analyzing business performance

### 4.2 User Needs

- Simple, intuitive interface for processing sales
- Clear visibility of available inventory
- Easy tracking of oil usage, including partial volumes
- Ability to transfer inventory between branches
- Comprehensive reporting on sales and inventory

## 5. Features and Requirements

### 5.1 Core POS Functionality

| Requirement ID | Requirement                 | Description                                                                                     | Priority |
| -------------- | --------------------------- | ----------------------------------------------------------------------------------------------- | -------- |
| POS-101        | Sales Processing            | Process sales transactions with multiple items, including discounts and various payment methods | High     |
| POS-102        | Receipt Generation          | Generate digital and printable receipts for completed transactions                              | High     |
| POS-103        | Refund Processing           | Process returns and refunds with appropriate inventory adjustments                              | Medium   |
| POS-104        | Customer Management         | Track customer information and purchase history                                                 | Medium   |
| POS-105        | Payment Methods             | Support various payment methods (cash, card, mobile payment via Adanan/Forman)                  | High     |
| POS-106        | Discount Application        | Apply percentage or fixed amount discounts to transactions                                      | Medium   |
| POS-107        | On-Hold Transactions        | Place transactions on hold with car plate number for later payment                              | Medium   |
| POS-108        | Credit Transactions         | Process credit transactions for customers to pay later                                          | Medium   |
| POS-109        | Transaction Settlement      | Settle on-hold and credit transactions with payment                                             | Medium   |
| POS-110        | Trade-In Processing         | Process battery trade-ins with scrap/resellable status tracking                                 | Medium   |
| POS-111        | Warranty Claims             | Process warranty claims with certificate generation                                             | Medium   |
| POS-112        | Dispute Handling            | Handle transaction disputes and create dispute records                                          | Low      |
| POS-113        | Reference Number Generation | Generate unique sequential reference numbers for transactions                                   | High     |

### 5.2 Oil Inventory Management

| Requirement ID | Requirement           | Description                                                   | Priority |
| -------------- | --------------------- | ------------------------------------------------------------- | -------- |
| OIL-101        | Oil Product Tracking  | Track oil products by brand, type, and viscosity              | High     |
| OIL-102        | Volume-Based Pricing  | Configure different prices based on volume (5L, 4L, 1L, etc.) | High     |
| OIL-103        | Partial Volume Sales  | Support selling partial volumes from larger containers        | High     |
| OIL-104        | Bottle State Tracking | Track opened vs. closed bottle status for accurate inventory  | High     |
| OIL-105        | Container Usage       | Track remaining volume in opened containers                   | High     |

### 5.3 General Inventory Management

| Requirement ID | Requirement               | Description                                                    | Priority |
| -------------- | ------------------------- | -------------------------------------------------------------- | -------- |
| INV-101        | Product Categories        | Organize products into categories (Oils, Filters, Parts, etc.) | High     |
| INV-102        | Brand Management          | Organize products by brand for easy filtering                  | Medium   |
| INV-103        | Batch Tracking            | Track cost price, quantity, and expiration dates by batch      | High     |
| INV-104        | Stock Alerts              | Alert users when stock levels fall below defined thresholds    | Medium   |
| INV-105        | Inventory Search          | Search functionality for quickly finding inventory items       | High     |
| INV-106        | Battery State Management  | Track battery states (new, scrap, resellable) for inventory    | Medium   |
| INV-107        | Trade-In Price Management | Configure trade-in prices by battery size and condition        | Medium   |

### 5.4 Branch Management

| Requirement ID | Requirement              | Description                                                          | Priority |
| -------------- | ------------------------ | -------------------------------------------------------------------- | -------- |
| BRN-101        | Multiple Locations       | Support for multiple physical store locations                        | High     |
| BRN-102        | Shop Management          | Support for multiple shops (logical business units) within locations | High     |
| BRN-103        | Per-Location Inventory   | Track inventory levels independently for each location               | High     |
| BRN-104        | Inventory Transfers      | Transfer inventory between locations with appropriate tracking       | High     |
| BRN-105        | Branch Performance       | Compare sales and inventory metrics across locations                 | Medium   |
| BRN-106        | User Location Assignment | Assign users to specific locations and shops                         | Medium   |

### 5.5 Reporting and Analytics

| Requirement ID | Requirement          | Description                                                             | Priority |
| -------------- | -------------------- | ----------------------------------------------------------------------- | -------- |
| RPT-101        | Sales Reports        | Generate reports on sales by time period, product, category, and branch | High     |
| RPT-102        | Inventory Reports    | Generate reports on current inventory levels and value                  | High     |
| RPT-103        | Profit Margins       | Calculate and report on profit margins based on cost vs. selling price  | Medium   |
| RPT-104        | Export Functionality | Export reports in common formats (CSV, PDF)                             | Low      |

### 5.6 User Management

| Requirement ID | Requirement       | Description                                                                       | Priority |
| -------------- | ----------------- | --------------------------------------------------------------------------------- | -------- |
| USR-101        | User Roles        | Define different user roles (admin, shop) with appropriate permissions            | Medium   |
| USR-102        | Authentication    | Secure login system with role-based access via Supabase Auth                      | High     |
| USR-103        | Permission System | Granular permission system (pos.access, inventory.access, customers.access, etc.) | Medium   |
| USR-104        | Staff Management  | Manage staff members with staff IDs for transaction tracking                      | Medium   |
| USR-105        | Activity Tracking | Track user actions for accountability                                             | Low      |

## 6. User Stories and Acceptance Criteria

### 6.1 Sales Processing

**POS-101: Process a Sale**

- As a cashier, I want to process a sale so that I can serve customers and receive payment
- **Acceptance Criteria:**
  - User can select products from inventory to add to cart
  - For oil products, user can specify volume and bottle state (open/closed)
  - System calculates total including any applicable taxes
  - User can apply discounts (percentage or fixed amount)
  - User can select payment method
  - Sale is recorded and inventory is automatically updated
  - Receipt is generated

**POS-103: Process a Refund**

- As a cashier, I want to process a refund so that I can handle customer returns
- **Acceptance Criteria:**
  - User can look up previous sales by reference number or customer
  - User can select items from the sale to refund
  - System calculates refund amount
  - Refund transaction is recorded with type 'REFUND'
  - Inventory is automatically updated to reflect returned items
  - Refund receipt is generated

**POS-107: Place Transaction On Hold**

- As a cashier, I want to place a transaction on hold so that customers can pay later
- **Acceptance Criteria:**
  - User can place a transaction on hold with car plate number
  - Transaction is recorded with type 'ON_HOLD'
  - User can later settle the transaction with payment
  - System generates on-hold ticket/receipt
  - On-hold transactions are tracked separately

**POS-108: Process Credit Transaction**

- As a cashier, I want to process credit transactions so that customers can pay later
- **Acceptance Criteria:**
  - User can create a credit transaction
  - Transaction is recorded with type 'CREDIT'
  - User can later settle the credit transaction with payment
  - Credit transactions are tracked separately

**POS-110: Process Battery Trade-In**

- As a cashier, I want to process battery trade-ins so that customers can receive credit for old batteries
- **Acceptance Criteria:**
  - User can add multiple batteries with size and condition (scrap/resellable)
  - System calculates trade-in value based on configured prices
  - Trade-in amount is deducted from total sale amount
  - Trade-in batteries are added to inventory with appropriate state
  - Trade-in transaction is recorded

### 6.2 Oil Inventory Management

**OIL-103: Sell Partial Oil Volume**

- As a cashier, I want to sell a partial volume of oil from a larger container so that I can serve customers efficiently
- **Acceptance Criteria:**
  - User can select an oil product and specify a custom volume less than the container size
  - System first checks for already-open bottles with sufficient remaining volume
  - If an open bottle exists, system deducts the amount from that bottle
  - If no open bottle exists, system opens a new bottle and marks it as "open"
  - System tracks remaining volume in the open bottle
  - If bottle becomes empty, it is marked as empty and removed from inventory

**OIL-104: Track Open Bottle Status**

- As an inventory manager, I want to track which oil bottles are open and their remaining volume so that I can manage inventory accurately
- **Acceptance Criteria:**
  - System displays open bottles separately from closed bottles
  - Remaining volume for each open bottle is clearly displayed
  - System prioritizes using older opened bottles first (FIFO)
  - User can manually update remaining volume if needed (with appropriate permissions)

### 6.3 Inventory Management

**INV-101: Add New Product**

- As an inventory manager, I want to add a new product to the system so that it can be sold and tracked
- **Acceptance Criteria:**
  - User can enter product details (name, category, brand, price, etc.)
  - For oil products, user can configure available volumes and prices
  - User can specify initial stock levels
  - Product immediately appears in inventory
  - Product can be found through search and filters

**INV-103: Receive New Batch**

- As an inventory manager, I want to record a new batch of products so that I can track cost price, quantity, and expiration
- **Acceptance Criteria:**
  - User can select an existing product
  - User can enter batch details (purchase date, cost price, quantity, supplier, expiration date)
  - System calculates average cost price across all batches of the product
  - New stock is reflected in inventory levels

### 6.4 Branch Management

**BRN-104: Transfer Inventory**

- As a branch manager, I want to transfer inventory items to another location so that I can optimize stock levels
- **Acceptance Criteria:**
  - User can select source and destination locations
  - User can select items and quantities to transfer
  - System validates that source location has sufficient inventory
  - Transfer is recorded as a transaction with type 'STOCK_TRANSFER'
  - Inventory is deducted from source location and added to destination location
  - Transfer history is tracked and viewable

### 6.5 Reporting

**RPT-101: Generate Sales Report**

- As a manager, I want to generate a sales report so that I can analyze business performance
- **Acceptance Criteria:**
  - User can select report parameters (date range, branch, product categories)
  - System generates report showing sales data according to selected parameters
  - Report includes key metrics like total sales, item quantities, and profit margins
  - Report can be viewed on screen and exported if needed

## 7. Technical Requirements

### 7.1 Technology Stack

| Requirement ID | Requirement      | Description                                             |
| -------------- | ---------------- | ------------------------------------------------------- |
| TECH-101       | Framework        | Next.js 15 with App Router and React Server Components  |
| TECH-102       | Database         | Supabase (PostgreSQL)                                   |
| TECH-103       | Authentication   | Supabase Authentication                                 |
| TECH-104       | UI Components    | Shadcn UI with TailwindCSS                              |
| TECH-105       | State Management | React Context for global state, Zustand for local state |
| TECH-106       | Form Handling    | React Hook Form with Zod validation                     |
| TECH-107       | API Layer        | Supabase client and custom API routes                   |
| TECH-108       | Runtime          | Bun                                                     |

### 7.2 Database Schema

**Core Tables:**

1. **locations** (Physical store locations)

   - `id`: UUID (Primary Key)
   - `name`: Text (Not Null, Unique)
   - `address`: Text (Optional)
   - `created_at`, `updated_at`: Timestamps

2. **shops** (Logical business units within locations)

   - `id`: UUID (Primary Key)
   - `name`: Text (Not Null)
   - `location_id`: UUID (Foreign Key -> locations.id)
   - `display_name`: Text (Optional)
   - `is_active`: Boolean (default true)
   - `created_at`, `updated_at`: Timestamps

3. **categories**

   - `id`: UUID (Primary Key)
   - `name`: Text (Unique, Not Null)
   - `description`: Text (Optional)
   - `created_at`, `updated_at`: Timestamps

4. **brands**

   - `id`: UUID (Primary Key)
   - `name`: Text (Unique, Not Null)
   - `images`: JSONB (Optional, for brand images and metadata)
   - `created_at`, `updated_at`: Timestamps

5. **suppliers**

   - `id`: UUID (Primary Key)
   - `name`: Text (Not Null)
   - `contact`: Text (Optional)
   - `email`: Text (Optional)
   - `phone`: Text (Optional)
   - `address`: Text (Optional)
   - `created_at`, `updated_at`: Timestamps

6. **products**

   - `id`: UUID (Primary Key)
   - `name`: Text (Not Null)
   - `category_id`: UUID (Foreign Key -> categories.id)
   - `brand_id`: UUID (Foreign Key -> brands.id, Optional)
   - `brand`: Text (Optional, for backward compatibility)
   - `product_type`: Text (Optional, e.g., "0W-20")
   - `description`: Text (Optional)
   - `image_url`: Text (Optional)
   - `low_stock_threshold`: Integer (default 0)
   - `cost_price`: Numeric (Optional)
   - `manufacturing_date`: Timestamp (Optional)
   - `created_at`, `updated_at`: Timestamps

7. **product_volumes** (For oil products with different sizes)

   - `id`: UUID (Primary Key)
   - `product_id`: UUID (Foreign Key -> products.id)
   - `volume_description`: Text (Not Null, e.g., "5L", "4L", "1L")
   - `selling_price`: Numeric (Not Null)
   - `cost_price`: Numeric (Optional)
   - `created_at`, `updated_at`: Timestamps
   - Unique constraint on (product_id, volume_description)

8. **inventory** (Stock levels per product per location)

   - `id`: UUID (Primary Key)
   - `product_id`: UUID (Foreign Key -> products.id)
   - `location_id`: UUID (Foreign Key -> locations.id)
   - `standard_stock`: Integer (default 0, for non-oil products)
   - `selling_price`: Numeric (Optional, for non-oil products)
   - `open_bottles_stock`: Integer (default 0, for oils)
   - `closed_bottles_stock`: Integer (default 0, for oils)
   - `total_stock`: Integer (Generated column: standard_stock + open_bottles_stock + closed_bottles_stock)
   - `is_battery`: Boolean (default false)
   - `battery_state`: Text (Optional, CHECK: 'new', 'scrap', 'resellable')
   - `cost_price`: Numeric (Optional)
   - `manufacturing_date`: Date (Optional)
   - `created_at`, `updated_at`: Timestamps
   - Unique constraint on (product_id, location_id)

9. **batches** (For tracking product batches)

   - `id`: UUID (Primary Key)
   - `inventory_id`: UUID (Foreign Key -> inventory.id)
   - `cost_price`: Numeric (Not Null)
   - `quantity_received`: Integer (Not Null)
   - `stock_remaining`: Integer (Not Null)
   - `supplier`: Text (Optional)
   - `purchase_date`: Timestamp (default now)
   - `is_active_batch`: Boolean (default false)
   - `created_at`, `updated_at`: Timestamps

10. **open_bottle_details** (Track individual open bottles)

    - `id`: UUID (Primary Key)
    - `inventory_id`: UUID (Foreign Key -> inventory.id)
    - `initial_volume`: Numeric (Not Null)
    - `current_volume`: Numeric (Not Null)
    - `opened_at`: Timestamp (default now)
    - `is_empty`: Boolean (default false)

11. **transactions** (Unified transaction table)

    - `id`: UUID (Primary Key)
    - `reference_number`: Text (Unique, Not Null)
    - `location_id`: UUID (Foreign Key -> locations.id)
    - `shop_id`: UUID (Foreign Key -> shops.id, Optional)
    - `cashier_id`: UUID (Foreign Key -> staff.id, Optional)
    - `type`: Text (Not Null: 'SALE', 'REFUND', 'WARRANTY_CLAIM', 'CREDIT', 'ON_HOLD', 'ON_HOLD_PAID', 'CREDIT_PAID', 'STOCK_TRANSFER', 'EXPENSE')
    - `total_amount`: Numeric (Not Null)
    - `items_sold`: JSONB (Array of product details)
    - `payment_method`: Text (Optional: 'CASH', 'CARD', 'MOBILE', 'ON_HOLD', etc.)
    - `mobile_payment_account`: Text (Optional: 'Adanan' or 'Forman')
    - `mobile_number`: Text (Optional)
    - `car_plate_number`: Text (Optional, for on-hold transactions)
    - `receipt_html`: Text (Optional)
    - `battery_bill_html`: Text (Optional, for battery sales)
    - `original_reference_number`: Text (Optional, for linking disputes)
    - `customer_id`: UUID (Foreign Key -> customers.id, Optional)
    - `created_at`: Timestamp (default now)

12. **trade_in_prices** (Battery trade-in pricing)

    - `id`: UUID (Primary Key)
    - `size`: Text (Not Null)
    - `condition`: Text (Not Null: 'Scrap' or 'Resalable')
    - `trade_in_value`: Numeric (Not Null)
    - `created_at`, `updated_at`: Timestamps
    - Unique constraint on (size, condition)

13. **trade_in_transactions** (Trade-in records)

    - `id`: UUID (Primary Key)
    - `transaction_id`: UUID (Foreign Key -> transactions.id)
    - `product_id`: UUID (Foreign Key -> products.id)
    - `quantity`: Integer (Not Null)
    - `trade_in_value`: Numeric (Not Null)
    - `created_at`: Timestamp (default now)

14. **customers**

    - `id`: UUID (Primary Key)
    - `name`: Text (Not Null)
    - `email`: Text (Optional)
    - `phone`: Text (Optional)
    - `address`: Text (Optional)
    - `notes`: Text (Optional)
    - `created_at`, `updated_at`: Timestamps

15. **customer_vehicles**

    - `id`: UUID (Primary Key)
    - `customer_id`: UUID (Foreign Key -> customers.id)
    - `make`: Text (Not Null)
    - `model`: Text (Not Null)
    - `year`: Text (Not Null)
    - `license_plate`: Text (Not Null)
    - `vin`: Text (Optional)
    - `notes`: Text (Optional)
    - `created_at`, `updated_at`: Timestamps

16. **staff**

    - `id`: UUID (Primary Key)
    - `staff_id`: Text (Unique, Not Null)
    - `name`: Text (Not Null)
    - `is_active`: Boolean (default true)
    - `created_at`, `updated_at`: Timestamps

17. **reference_number_counters** (Sequential reference number generation)

    - `prefix`: Text (Primary Key)
    - `counter`: Integer (Not Null, default 0)
    - `updated_at`: Timestamp (Not Null, default now)

18. **user_profiles** (User authentication and roles)

    - `id`: UUID (Primary Key, Foreign Key -> auth.users.id)
    - `email`: Text (Unique, Not Null)
    - `full_name`: Text (Optional)
    - `role`: user_role enum ('admin', 'shop')
    - `is_admin`: Boolean (default false)
    - `shop_location_id`: UUID (Foreign Key -> locations.id, Optional)
    - `inventory_location_id`: UUID (Foreign Key -> locations.id, Optional)
    - `shop_display_name`: Text (Optional)
    - `created_at`, `updated_at`: Timestamps

19. **role_permissions** (Permission management)

    - `id`: UUID (Primary Key)
    - `role`: user_role enum (Not Null)
    - `permission`: permission enum (Not Null: 'pos.access', 'inventory.access', 'customers.access', 'transactions.access', 'notifications.access', 'reports.access', 'settings.access', 'users.access', 'admin.access')
    - `created_at`: Timestamp (default now)
    - Unique constraint on (role, permission)

### 7.3 Performance Requirements

- Page load time < 2 seconds on standard connections
- Transaction processing time < 1 second
- Support for at least 10,000 inventory items without performance degradation
- Support for at least 1,000 transactions per day
- Concurrent usage by up to 20 users without performance impact

### 7.4 Security Requirements

- Role-based access control for all sensitive operations
- Row-Level Security in database to control data access by branch and user role
- Secure storage of authentication credentials
- HTTPS for all API communications

## 8. Design and User Interface

### 8.1 Visual Design Principles

- Clean, modern interface focusing on usability
- Consistent use of color to indicate item types and statuses
- High contrast for readability in various lighting conditions
- Clear visual hierarchy with emphasis on key actions and information
- Support for both light and dark modes

### 8.2 Key User Interfaces

1. **Main POS Interface**

   - Left sidebar for category/brand selection
   - Center section for product display with search functionality
   - Right sidebar for cart display and checkout
   - Bottom section for numerical keypad and payment options

2. **Inventory Management Interface**

   - Data table view with filtering and sorting
   - Modal forms for adding/editing items
   - Visual indicators for stock levels (adequate, low, out of stock)
   - Separate views for branch, category, and brand filtering

3. **Oil Management Interface**

   - Special views showing open vs. closed bottles
   - Visual indicators for remaining volume in open bottles
   - Special controls for partial volume sales

4. **Reporting Dashboard**
   - Graphical charts for sales trends
   - Tabular data for detailed analysis
   - Filter controls for time period, branch, product categories
   - Export options for further analysis

## 9. Implementation Timeline

### Phase 1: Core Infrastructure (Weeks 1-2)

- Database schema setup
- Authentication implementation
- Base UI components and layouts

### Phase 2: Inventory Management (Weeks 3-4)

- Product management (CRUD)
- Batch tracking
- Branch-specific inventory

### Phase 3: POS Functionality (Weeks 5-7)

- Sales processing
- Receipt generation
- Payment methods
- Refund handling

### Phase 4: Oil-Specific Features (Weeks 8-9)

- Volume-based pricing
- Open/closed bottle tracking
- Partial volume sales

### Phase 5: Reporting and Analytics (Weeks 10-11)

- Sales reports
- Inventory reports
- Dashboard implementation

### Phase 6: Testing and Refinement (Weeks 12-13)

- User acceptance testing
- Performance optimization
- Bug fixes and refinements

## 10. Additional Features

### 10.1 Transaction Types

The system supports the following transaction types:

- **SALE**: Regular sales transactions
- **REFUND**: Return/refund transactions
- **WARRANTY_CLAIM**: Warranty claim transactions with certificate generation
- **CREDIT**: Credit transactions for customers to pay later
- **ON_HOLD**: Transactions placed on hold with car plate number
- **ON_HOLD_PAID**: Settled on-hold transactions
- **CREDIT_PAID**: Settled credit transactions
- **STOCK_TRANSFER**: Inventory transfers between locations
- **EXPENSE**: Miscellaneous expense transactions

### 10.2 Payment Methods

- Cash
- Card
- Mobile Payment (Adanan or Forman)
- On-Hold (for deferred payment)
- Credit (for credit transactions)

### 10.3 Reference Number System

The system uses a sequential reference number generation system with prefixes:

- Regular sales: Prefix-based sequential numbers
- Battery sales: Special prefix for battery transactions
- Warranty claims: WBX prefix
- Refunds: A prefix (regular transaction)

### 10.4 Receipt Generation

- Digital receipts stored as HTML in database
- Printable receipt format
- Battery bill HTML for battery sales
- Warranty claim certificates
- On-hold tickets

## 11. Success Criteria and Future Enhancements

### 11.1 Success Criteria

- Full implementation of all high-priority requirements
- System successfully deployed to production environment
- Training completed for all user roles
- Successful migration of existing inventory data
- Support for multiple locations and shops
- Complete transaction type coverage

### 11.2 Future Enhancements

- Mobile app for inventory counting
- Customer loyalty program
- Integration with accounting software
- Enhanced analytics with predictive inventory suggestions
- Online ordering system
- Integration with vehicle service history
- Advanced reporting with AI-generated insights
