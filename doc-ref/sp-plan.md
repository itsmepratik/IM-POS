## Supabase Integration Plan (Foolproof, Step-by-Step)

This plan takes you from zero to a working, secure Supabase-backed app, aligned with the POS PRD. Follow in order. Keep this doc as your source of truth during implementation.

### 0) Ground Rules

- **Security-first**: Enable RLS (Row Level Security) on all tables; no broad anon read/writes.
- **Branch-aware access**: Every row tied to a `branch_id` must be protected so users only see their branch.
- **Server-only secrets**: Service Role keys never ship to browsers.
- **Types-as-contract**: Generate TS types from DB after any schema change.

---

### 1) Account & Project

1. Create a Supabase account (free tier is fine to start).
2. Create a new project:
   - Region: closest to users.
   - Project Name: `pos-prod` (use a separate `pos-dev` for development).
3. Wait for initialization and note:
   - Project URL
   - anon public key
   - service role key (server-only)

Deliverable: Active `pos-dev` project with URL and keys recorded in your password manager.

---

### 2) Environment & Config

1. Add environment variables to your app (dev and prod). Do NOT commit secrets.
   - Client (browser-safe):
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Server only:
     - `SUPABASE_SERVICE_ROLE_KEY`
2. Confirm your deployment platform (e.g., Vercel) supports encrypted env vars and set them there too.

Deliverable: `.env.local` (dev) loaded; prod variables set in hosting provider.

---

### 3) Schema Alignment (from PRD)

Create normalized tables matching the PRD (essentials first):

1. Reference tables: `branches`, `categories`, `brands`, `suppliers`.
2. Core: `items`, `item_variants` (for products with volumes/sizes like lubricants), `batches`.
3. Branch stock: `location_stock`.
4. Sales: `sales`, `sale_items`, `trade_in_batteries` (to record details of traded-in batteries).
5. Operational logs: `inventory_transactions`, `inventory_transfers`.
6. Users: `profiles` table keyed by `auth.uid()` with columns `role` and `branch_id`.
7. Customers: `customers` table to store customer details, and `vehicles` table linked to `customers`.

Indexes (minimum):

- `items(name)`, `items(category_id)`, `items(brand_id)`
- `item_variants(item_id, size)`
- `batches(item_id, purchase_date DESC)` for FIFO
- `location_stock(branch_id, item_id)`
- `sales(branch_id, created_at DESC)`
- `sale_items(sale_id)`
- `trade_in_batteries(sale_id)`
- `customers(phone)` for quick lookup
- `vehicles(customer_id)`

Deliverable: All core tables created with required FKs and indexes, including new tables for `item_variants`, `trade_in_batteries`, `customers`, and `vehicles`.

---

### 4) Authentication & Profiles

1. Enable Email/Password (and optionally OAuth providers) in Supabase Auth.
2. Create `public.profiles` with PK = `uuid` referencing `auth.users.id`.
3. On user signup, insert a row into `profiles` with default `role = 'staff'` and an assigned `branch_id`.
4. Decide default roles: `admin`, `manager`, `staff`.

Deliverable: New signups get a `profiles` row with role + branch. Admins can promote users.

---

### 5) RLS (Row Level Security) Strategy

Principles:

- Deny by default. Explicitly allow per-role operations.
- Derive identity with `auth.uid()`; derive role/branch from `profiles`.

Policy blueprint (examples to implement):

- `items` (read): allow if user’s `profiles.branch_id` matches row via `location_stock` or read-only cross-branch for admins.
- `items` (write): allow managers/admins for their `branch_id`.
- `batches` (read/write): restrict to same-branch managers/admins.
- `location_stock` (read): same-branch for all roles; (write) managers/admins only.
- `sales` / `sale_items`: same-branch; `staff` can insert sales but cannot alter historical ones.
- `profiles`: self-read; only admins can update others’ role/branch.

Deliverable: RLS enabled on all tables with table-level policies matching above.

---

### 6) Storage (Images)

1. Create a bucket `item-images`.
2. Decide visibility:
   - Public-read if images are non-sensitive and you want simple CDN semantics.
   - Otherwise signed URLs (recommended for tighter control).
3. Add storage policies:
   - Allow upload/list/delete only for managers/admins.
   - Read: public or signed depending on choice.

Deliverable: Bucket ready; policies enforced; documented usage (public vs signed).

---

### 7) Seed & Reference Data

Seed once in dev:

- `branches` (at least 2–3)
- Canonical `categories` and `brands`
- A few `items` with `item_volumes` and `batches`

Deliverable: Realistic dev dataset for end-to-end testing.

---

### 8) Types & Tooling

1. Install Supabase CLI locally.
2. Generate TS types from the DB after schema changes:
   - Use CLI to output to `types/database.ts`.
3. Wire types in your data layer to avoid drift.

Deliverable: Up-to-date generated types checked into the repo.

---

### 9) Client Integration Plan

Choose a consistent pattern:

- Client-side reads allowed by RLS: use `createClientComponentClient` (or plain supabase-js with public anon key) for non-sensitive reads.
- Server-side mutations or sensitive reads: use server code with Service Role (never exposed to client) OR stay client-only with strictly correct RLS that permits those mutations safely by role.

Migration steps from mock → Supabase:

1. Introduce a feature flag `USE_SUPABASE`.
2. Implement new data hooks that call Supabase in parallel to existing mock services (e.g., `usePOSMockData` will be replaced with Supabase calls, and the `useStaffIDs` will fetch from `profiles` table).
3. Update components (e.g., `TradeInDialog`, `POSCustomerForm`, category components) to consume data from Supabase-backed hooks.
4. Validate results/UI parity in dev.
5. Flip the flag in dev; soak; then flip in prod.

Deliverable: Inventory, batches, brands, categories, suppliers, customers, vehicles, trade-ins, and sales flows backed by Supabase with no user-visible regressions.

---

### 10) Realtime (Optional)

Decide where realtime adds value:

- `location_stock` updates
- `batches` consumption/receipts
- Live sales dashboard

Deliverable: Subscriptions only where needed; avoid unnecessary socket load.

---

### 11) Performance & Indexing Checklist

- Confirm all foreign keys are indexed.
- Add search trigram or `GIN` indexes if full-text search is needed.
- Verify slow queries with Supabase logs; add covering indexes as required.

Deliverable: No obvious slow paths on core screens (inventory list, POS cart, batch history).

---

### 12) Monitoring, Backups, and DR

1. Enable daily backups (free tier has limits—document them).
2. Document recovery steps (RPO/RTO expectations).
3. Set up log dashboards for Postgres/API/Auth.

Deliverable: Clear recovery procedure and monitoring cadence.

---

### 13) Access Control Operations

- Admin UI or scripts to:
  - Invite users and set `profiles.role` and `profiles.branch_id`.
  - Rotate keys and refresh env vars.

Deliverable: Runbook for user/role/branch management.

---

### 14) Testing Plan

- Unit tests for data access helpers.
- Policy tests (via SQL or integration tests) that assert allowed vs denied cases.
- End-to-end happy paths: add item, receive batch, sell item, verify stock/margins.

Deliverable: Green tests covering critical paths and RLS behavior.

---

### 15) Deployment & Rollout

1. Set prod env vars.
2. Run migrations in prod (idempotent, ordered).
3. Smoke test auth, basic reads, and restricted writes.
4. Flip feature flag to Supabase-backed data in production.

Deliverable: Stable production rollout with rollback plan (flag or revert).

---

### 16) Cutover Checklist (Short)

- Env vars present in dev/prod.
- Schema + RLS deployed.
- Storage bucket + policies set.
- Seed data in dev; minimal data in prod.
- Types generated and imported.
- Feature flag ready to switch.
- Monitoring and backups verified.

---

### 17) Risks & Mitigations

- Misconfigured RLS → Start with deny-all; add policies incrementally and test.
- Leaking service key → Keep on server only; rotate if compromised.
- Query slowness → Add indexes and limit payloads; paginate.
- Free tier limits → Monitor connection/storage limits; be ready to upgrade.

---

### 18) Deliverables Summary

- Working Supabase project (dev/prod), schema, RLS, storage.
- Generated TS types, integrated data layer, and feature-flagged rollout.
- Tests for core flows and policies.
- Monitoring/backups with a documented recovery plan.
