# Supabase Integration Plan

This document outlines the plan for integrating the POS application with a Supabase backend database.

## 1. Setup Supabase Project ✅

- Create a new Supabase project via the Supabase dashboard.
- Securely store the Project URL and `anon` key.
- Ensure Row Level Security (RLS) is enabled for all tables by default. Policies will be defined per table.

## 2. Define Database Schema

The following tables will be created in the `public` schema:

### `branches` Table

Stores information about different store locations or operational units.

- `id`: `uuid` (Primary Key, default `gen_random_uuid()`)
- `name`: `text` (Not Null)
- `address`: `text` (Optional)
- `created_at`: `timestamp with time zone` (default `now()`)
- `updated_at`: `timestamp with time zone` (default `now()`)
- _RLS:_ Define based on user roles (e.g., admins can manage, users can read assigned branch).

### `categories` Table

Stores product categories.

- `id`: `uuid` (Primary Key, default `gen_random_uuid()`)
- `name`: `text` (Unique, Not Null)
- `created_at`: `timestamp with time zone` (default `now()`)
- `updated_at`: `timestamp with time zone` (default `now()`)
- _RLS:_ Allow authenticated users to read, specific roles to modify.

### `brands` Table

Stores product brands.

- `id`: `uuid` (Primary Key, default `gen_random_uuid()`)
- `name`: `text` (Unique, Not Null)
- `created_at`: `timestamp with time zone` (default `now()`)
- `updated_at`: `timestamp with time zone` (default `now()`)
- _RLS:_ Allow authenticated users to read, specific roles to modify.

### `suppliers` Table

Stores supplier information (relevant for batches).

- `id`: `uuid` (Primary Key, default `gen_random_uuid()`)
- `name`: `text` (Not Null)
- `contact_info`: `text` (Optional)
- `created_at`: `timestamp with time zone` (default `now()`)
- `updated_at`: `timestamp with time zone` (default `now()`)
- _RLS:_ Allow specific roles (e.g., inventory managers) to read/modify.

### `items` Table

Represents the core inventory items.

- `id`: `uuid` (Primary Key, default `gen_random_uuid()`)
- `name`: `text` (Not Null)
- `category_id`: `uuid` (Foreign Key -> `categories.id`, On Delete Set Null)
- `brand_id`: `uuid` (Foreign Key -> `brands.id`, On Delete Set Null)
- `price`: `numeric` (Selling price, Not Null, default 0)
- `type`: `text` (Optional, e.g., "0W-20")
- `image_url`: `text` (Optional)
- `sku`: `text` (Optional, potentially Unique)
- `description`: `text` (Optional)
- `is_oil`: `boolean` (default `false`)
- `created_at`: `timestamp with time zone` (default `now()`)
- `updated_at`: `timestamp with time zone` (default `now()`)
- _RLS:_ Allow authenticated users to read, specific roles to modify.

### `item_volumes` Table

Handles different volumes/prices for items (e.g., oil).

- `id`: `uuid` (Primary Key, default `gen_random_uuid()`)
- `item_id`: `uuid` (Foreign Key -> `items.id`, On Delete Cascade, Not Null)
- `size`: `text` (e.g., "5L", "1L", Not Null)
- `price`: `numeric` (Price for this volume, Not Null, default 0)
- _RLS:_ Inherit from `items` or define separately based on access needs.

### `batches` Table

Tracks individual purchase batches for cost price and quantity.

- `id`: `uuid` (Primary Key, default `gen_random_uuid()`)
- `item_id`: `uuid` (Foreign Key -> `items.id`, On Delete Cascade, Not Null)
- `purchase_date`: `date` (Not Null)
- `cost_price`: `numeric` (Not Null, default 0)
- `initial_quantity`: `integer` (Not Null, default 0)
- `current_quantity`: `integer` (Not Null, default 0) - Tracks stock depletion per batch.
- `supplier_id`: `uuid` (Foreign Key -> `suppliers.id`, On Delete Set Null)
- `expiration_date`: `date` (Optional)
- `created_at`: `timestamp with time zone` (default `now()`)
- `updated_at`: `timestamp with time zone` (default `now()`)
- _RLS:_ Allow specific roles (e.g., inventory managers) to read/modify.

### `branch_inventory` Table

Associates items/batches with specific branches and tracks stock per branch.

- `id`: `uuid` (Primary Key, default `gen_random_uuid()`)
- `branch_id`: `uuid` (Foreign Key -> `branches.id`, On Delete Cascade, Not Null)
- `item_id`: `uuid` (Foreign Key -> `items.id`, On Delete Cascade, Not Null)
- `batch_id`: `uuid` (Foreign Key -> `batches.id`, On Delete Cascade, Nullable - for non-batch items or aggregated stock)
- `quantity`: `integer` (Stock level for this item/batch _in this branch_, Not Null, default 0)
- `open_bottles`: `integer` (Specific to oils, default 0)
- `closed_bottles`: `integer` (Specific to oils, default 0)
- `created_at`: `timestamp with time zone` (default `now()`)
- `updated_at`: `timestamp with time zone` (default `now()`)
- _Constraint:_ `UNIQUE(branch_id, item_id, batch_id)`
- _RLS:_ Define policies based on user's assigned branch (e.g., users can only see/modify inventory for their branch).

### Database Functions/Views (Recommended)

- `get_item_stock(p_item_id uuid, p_branch_id uuid)`: Function/View to calculate total stock for an item in a specific branch by summing relevant `branch_inventory.quantity`.
- `get_average_cost(p_item_id uuid)`: Function/View to calculate the weighted average cost price across all batches for an item.

## 3. Integrate Supabase Client

- Install the Supabase JS library: `bun add @supabase/supabase-js`
- Create a Supabase client instance (e.g., in `lib/supabaseClient.ts`).
  - Use environment variables (`.env.local`) for Project URL and `anon` key (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- Generate TypeScript types from the database schema:
  ```bash
  bunx supabase gen types typescript --project-id <your-project-id> --schema public > types/supabase.ts
  ```
  (Replace `<your-project-id>` with your actual Supabase project ID).

## 4. Refactor Data Management

- **Contexts (`items-context`, `branch-context`):**
  - Replace `useState` for primary data arrays (`items`, `branches`, `categories`, `brands`) with data fetching logic using the Supabase client (likely within `useEffect`).
  - Modify `add*`, `update*`, `delete*` functions to perform database operations using the Supabase client (`insert`, `update`, `delete`).
  - Consider using Supabase Realtime subscriptions for live updates to the UI, updating the local state based on database events.
- **Hooks (`useInventoryData`):**
  - Update the hook to consume data fetched from Supabase via the refactored contexts.
  - Adjust filtering and memoization logic as needed. Ensure branch filtering utilizes the `branch_inventory` table.
- **Components (Modals, Pages):**
  - Update forms and display logic to work with the Supabase schema (e.g., use foreign keys like `category_id`, `brand_id`).
  - Ensure components call the refactored context functions for data manipulation.
- **Branch-Specific Logic:**
  - All inventory reads and writes must be scoped to the `currentBranch`. This involves filtering queries by `branch_id` in the `branch_inventory` table.
  - Stock adjustments (sales, receiving inventory, oil bottle state changes) must update the correct rows in `branch_inventory`.

## 5. Authentication (If Applicable)

- If user authentication is required:
  - Implement Supabase Auth (e.g., email/password, social logins).
  - Define RLS policies on tables to restrict access based on `auth.uid()` and potentially custom user roles or branch assignments.

## 6. Data Migration

- Create a script (e.g., `scripts/migrate-initial-data.ts`) using the Supabase client.
- This script should:
  - Read the initial mock data from `items-context.tsx` and `branch-context.tsx`.
  - Insert corresponding records into the `branches`, `categories`, `brands`, `items`, `item_volumes`, `batches`, and `branch_inventory` tables in Supabase. Ensure relationships (foreign keys) are correctly established.

## 7. Environment Variables

- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are defined in `.env.local`.
- Configure these environment variables in deployment environments (Vercel, Netlify, etc.).

## 8. Testing

- Conduct thorough testing of all CRUD operations for all data entities (items, batches, branches, etc.).
- Verify calculations (stock levels per branch, average cost).
- Test branch-specific inventory views and operations.
- If authentication is used, test RLS policies rigorously for different user roles/permissions.
