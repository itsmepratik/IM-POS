# Point of Sale System - Product Requirements Document

## 1. Introduction

This document outlines the comprehensive product requirements for a Point of Sale (POS) and inventory management system designed specifically for automotive service businesses. The system enables tracking of specialty products like oils with volume-based pricing and special handling needs, alongside traditional inventory management for parts, filters, and other automotive products. The PRD serves as a reference for the development team, providing detailed specifications for features, user interface, technical requirements, and design guidelines to ensure consistent implementation of the product vision.

## 2. Product Overview

The POS system is a comprehensive solution that combines point-of-sale functionality with real-time inventory management. It is specifically tailored for automotive service shops that need to track oil products (which can be sold in partial volumes from larger containers), parts, filters, and other automotive-related items. The application provides an intuitive interface for sales transactions, inventory tracking across multiple branches, batch management, and financial reporting. The system emphasizes ease of use, performance, and real-time data synchronization across multiple locations.

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

| Requirement ID | Requirement          | Description                                                                                     | Priority |
| -------------- | -------------------- | ----------------------------------------------------------------------------------------------- | -------- |
| POS-101        | Sales Processing     | Process sales transactions with multiple items, including discounts and various payment methods | High     |
| POS-102        | Receipt Generation   | Generate digital and printable receipts for completed transactions                              | High     |
| POS-103        | Refund Processing    | Process returns and refunds with appropriate inventory adjustments                              | Medium   |
| POS-104        | Customer Management  | Track customer information and purchase history                                                 | Medium   |
| POS-105        | Payment Methods      | Support various payment methods (cash, card, mobile payment)                                    | High     |
| POS-106        | Discount Application | Apply percentage or fixed amount discounts to transactions                                      | Medium   |

### 5.2 Oil Inventory Management

| Requirement ID | Requirement           | Description                                                   | Priority |
| -------------- | --------------------- | ------------------------------------------------------------- | -------- |
| OIL-101        | Oil Product Tracking  | Track oil products by brand, type, and viscosity              | High     |
| OIL-102        | Volume-Based Pricing  | Configure different prices based on volume (5L, 4L, 1L, etc.) | High     |
| OIL-103        | Partial Volume Sales  | Support selling partial volumes from larger containers        | High     |
| OIL-104        | Bottle State Tracking | Track opened vs. closed bottle status for accurate inventory  | High     |
| OIL-105        | Container Usage       | Track remaining volume in opened containers                   | High     |

### 5.3 General Inventory Management

| Requirement ID | Requirement        | Description                                                    | Priority |
| -------------- | ------------------ | -------------------------------------------------------------- | -------- |
| INV-101        | Product Categories | Organize products into categories (Oils, Filters, Parts, etc.) | High     |
| INV-102        | Brand Management   | Organize products by brand for easy filtering                  | Medium   |
| INV-103        | Batch Tracking     | Track cost price, quantity, and expiration dates by batch      | High     |
| INV-104        | Stock Alerts       | Alert users when stock levels fall below defined thresholds    | Medium   |
| INV-105        | Inventory Search   | Search functionality for quickly finding inventory items       | High     |

### 5.4 Branch Management

| Requirement ID | Requirement          | Description                                                   | Priority |
| -------------- | -------------------- | ------------------------------------------------------------- | -------- |
| BRN-101        | Multiple Branches    | Support for multiple store locations/branches                 | High     |
| BRN-102        | Per-Branch Inventory | Track inventory levels independently for each branch          | High     |
| BRN-103        | Inventory Transfers  | Transfer inventory between branches with appropriate tracking | High     |
| BRN-104        | Branch Performance   | Compare sales and inventory metrics across branches           | Medium   |

### 5.5 Reporting and Analytics

| Requirement ID | Requirement          | Description                                                             | Priority |
| -------------- | -------------------- | ----------------------------------------------------------------------- | -------- |
| RPT-101        | Sales Reports        | Generate reports on sales by time period, product, category, and branch | High     |
| RPT-102        | Inventory Reports    | Generate reports on current inventory levels and value                  | High     |
| RPT-103        | Profit Margins       | Calculate and report on profit margins based on cost vs. selling price  | Medium   |
| RPT-104        | Export Functionality | Export reports in common formats (CSV, PDF)                             | Low      |

### 5.6 User Management

| Requirement ID | Requirement       | Description                                                                        | Priority |
| -------------- | ----------------- | ---------------------------------------------------------------------------------- | -------- |
| USR-101        | User Roles        | Define different user roles (cashier, manager, admin) with appropriate permissions | Medium   |
| USR-102        | Authentication    | Secure login system with role-based access                                         | High     |
| USR-103        | Activity Tracking | Track user actions for accountability                                              | Low      |

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
  - Refund transaction is recorded
  - Inventory is automatically updated to reflect returned items
  - Refund receipt is generated

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

**BRN-103: Transfer Inventory**

- As a branch manager, I want to transfer inventory items to another branch so that I can optimize stock levels
- **Acceptance Criteria:**
  - User can select source and destination branches
  - User can select items and quantities to transfer
  - System validates that source branch has sufficient inventory
  - Transfer is recorded as a transaction
  - Inventory is deducted from source branch and added to destination branch
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

1. **branches**

   - `id`: UUID (Primary Key)
   - `name`: Text (Not Null)
   - `address`: Text (Optional)
   - `created_at`, `updated_at`: Timestamps

2. **categories**

   - `id`: UUID (Primary Key)
   - `name`: Text (Unique, Not Null)
   - `created_at`, `updated_at`: Timestamps

3. **brands**

   - `id`: UUID (Primary Key)
   - `name`: Text (Unique, Not Null)
   - `created_at`, `updated_at`: Timestamps

4. **suppliers**

   - `id`: UUID (Primary Key)
   - `name`: Text (Not Null)
   - `contact_info`: Text (Optional)
   - `created_at`, `updated_at`: Timestamps

5. **items**

   - `id`: UUID (Primary Key)
   - `name`: Text (Not Null)
   - `category_id`: UUID (Foreign Key -> categories.id)
   - `brand_id`: UUID (Foreign Key -> brands.id)
   - `price`: Numeric (Not Null, default 0)
   - `type`: Text (Optional, e.g., "0W-20")
   - `image_url`: Text (Optional)
   - `sku`: Text (Optional)
   - `description`: Text (Optional)
   - `is_oil`: Boolean (default false)
   - `created_at`, `updated_at`: Timestamps

6. **item_volumes**

   - `id`: UUID (Primary Key)
   - `item_id`: UUID (Foreign Key -> items.id)
   - `size`: Text (Not Null, e.g., "5L")
   - `price`: Numeric (Not Null, default 0)
   - `created_at`, `updated_at`: Timestamps

7. **batches**

   - `id`: UUID (Primary Key)
   - `item_id`: UUID (Foreign Key -> items.id)
   - `purchase_date`: Date (Not Null)
   - `cost_price`: Numeric (Not Null, default 0)
   - `initial_quantity`: Integer (Not Null, default 0)
   - `current_quantity`: Integer (Not Null, default 0)
   - `supplier_id`: UUID (Foreign Key -> suppliers.id)
   - `expiration_date`: Date (Optional)
   - `created_at`, `updated_at`: Timestamps

8. **location_stock**

   - `id`: UUID (Primary Key)
   - `branch_id`: UUID (Foreign Key -> branches.id)
   - `item_id`: UUID (Foreign Key -> items.id)
   - `batch_id`: UUID (Foreign Key -> batches.id, Nullable)
   - `quantity`: Integer (Not Null, default 0)
   - `open_bottles`: Integer (default 0, for oils)
   - `closed_bottles`: Integer (default 0, for oils)
   - `created_at`, `updated_at`: Timestamps

9. **sales**

   - `id`: UUID (Primary Key)
   - `branch_id`: UUID (Foreign Key -> branches.id)
   - `cashier_id`: UUID (Foreign Key -> users.id)
   - `customer_id`: UUID (Foreign Key -> customers.id, Optional)
   - `total_amount`: Numeric (Not Null, default 0)
   - `discount_amount`: Numeric (default 0)
   - `payment_method`: Text (Not Null)
   - `payment_reference`: Text (Optional)
   - `created_at`: Timestamp

10. **sale_items**

    - `id`: UUID (Primary Key)
    - `sale_id`: UUID (Foreign Key -> sales.id)
    - `item_id`: UUID (Foreign Key -> items.id)
    - `batch_id`: UUID (Foreign Key -> batches.id, Optional)
    - `quantity`: Numeric (Not Null, default 0)
    - `price`: Numeric (Not Null, default 0)
    - `is_open_bottle`: Boolean (default false, for oils)
    - `volume`: Text (Optional, for oils)

11. **inventory_transactions**

    - `id`: UUID (Primary Key)
    - `branch_id`: UUID (Foreign Key -> branches.id)
    - `item_id`: UUID (Foreign Key -> items.id)
    - `batch_id`: UUID (Foreign Key -> batches.id, Optional)
    - `quantity_change`: Integer (Not Null)
    - `transaction_type`: Text (e.g., "sale", "refund", "adjustment", "transfer")
    - `reference_id`: UUID (Optional, reference to sales or transfers)
    - `notes`: Text (Optional)
    - `created_by`: UUID (Foreign Key -> users.id)
    - `created_at`: Timestamp

12. **inventory_transfers**
    - `id`: UUID (Primary Key)
    - `source_branch_id`: UUID (Foreign Key -> branches.id)
    - `destination_branch_id`: UUID (Foreign Key -> branches.id)
    - `status`: Text (e.g., "pending", "completed", "cancelled")
    - `created_by`: UUID (Foreign Key -> users.id)
    - `created_at`, `updated_at`: Timestamps

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

## 10. Success Criteria and Future Enhancements

### 10.1 Success Criteria

- Full implementation of all high-priority requirements
- System successfully deployed to production environment
- Training completed for all user roles
- Successful migration of existing inventory data

### 10.2 Future Enhancements

- Mobile app for inventory counting
- Customer loyalty program
- Integration with accounting software
- Enhanced analytics with predictive inventory suggestions
- Online ordering system
- Integration with vehicle service history
