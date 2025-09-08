Phase 1: Database Schema & ORM Setup (Fully Revised)
Goal: To establish a comprehensive and robust database structure in Supabase using Drizzle ORM. This schema is designed to handle the distinct requirements of normal products and lubricants, including variable volume pricing and batch management.

Prompt:

Initialize Drizzle ORM for my Next.js project connected to a Supabase PostgreSQL database. Create the database schema with the following tables, columns, and relationships. This schema will power an existing frontend UI.

1.  **`locations` Table:**
    * `id`: UUID, primary key.
    * `name`: Text, not null (e.g., "Saham HQ").

2.  **`categories` Table:**
    * `id`: UUID, primary key.
    * `name`: Text, not null, unique (e.g., "Lubricants", "Filters", "Parts").

3.  **`products` Table:** (The central catalog for all items)
    * `id`: UUID, primary key.
    * `name`: Text, not null (e.g., "Shell 0W-20", "Cabin Filter XYZ").
    * `category_id`: UUID, foreign key referencing `categories.id`.
    * `brand`: Text, nullable.
    * `product_type`: Text, nullable (e.g., "Synthetic", "Oil Filter").
    * `description`: Text, nullable.
    * `image_url`: Text, nullable.
    * `low_stock_threshold`: Integer, default 0.

4.  **`product_volumes` Table:** (For lubricant pricing)
    * `id`: UUID, primary key.
    * `product_id`: UUID, foreign key referencing `products.id`.
    * `volume_description`: Text, not null (e.g., "1L", "4L", "5L").
    * `selling_price`: Numeric, not null.

5.  **`inventory` Table:** (Tracks stock levels for each product at each location)
    * `id`: UUID, primary key.
    * `product_id`: UUID, foreign key referencing `products.id`.
    * `location_id`: UUID, foreign key referencing `locations.id`.
    * **Generic Product Stock:**
        * `standard_stock`: Integer, nullable, default 0.
        * `selling_price`: Numeric, nullable (for non-lubricant products with a single price).
    * **Lubricant-Specific Stock:**
        * `open_bottles_stock`: Integer, nullable, default 0.
        * `closed_bottles_stock`: Integer, nullable, default 0.
    * `total_stock`: Integer, generated column computing the total stock.

6.  **`batches` Table:** (Tracks incoming stock for FIFO)
    * `id`: UUID, primary key.
    * `inventory_id`: UUID, foreign key referencing `inventory.id`.
    * `cost_price`: Numeric, not null.
    * `quantity_received`: Integer, not null.
    * `stock_remaining`: Integer, not null.
    * `supplier`: Text, nullable.
    * `purchase_date`: Timestamp with time zone, default now.
    * `is_active_batch`: Boolean, default false.

7.  **`transactions` Table:**
    * `id`: UUID, primary key.
    * `reference_number`: Text, unique, not null.
    * `location_id`: UUID, foreign key referencing `locations.id`.
    * `type`: Text, not null ('SALE', 'REFUND', 'WARRANTY_CLAIM').
    * `total_amount`: Numeric, not null.
    * `items_sold`: JSONB, containing an array of product details.
    * `original_reference_number`: Text, nullable (for linking disputes).
    * `created_at`: Timestamp with time zone, default now.

After defining the schema, generate the initial Drizzle migration file and apply it.