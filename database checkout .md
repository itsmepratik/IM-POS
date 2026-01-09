You can significantly reduce checkout latency by moving the hot path into the database (single call), batching updates instead of per-item updates, using targeted locking (SELECT ... FOR UPDATE / FOR UPDATE SKIP LOCKED), and offloading non-essential work to async workers/triggers. Below are concrete, actionable strategies with examples tailored to your schema and workflow.

1) Move logic to the DB — single stored procedure (recommended)
Yes — implement a single PL/pgSQL function that performs the entire checkout atomically. Benefits: one network round-trip, single transaction, fewer context switches, and easier to enforce idempotency and validations.

Key features to include:

Input: shop/location id, cashier_id, cart JSONB (array of items with product_id, volume/qty, client_ref), payment method, optional client_request_id for idempotency.
Idempotency: check client_ref or client_request_id and return existing transaction if present.
Reserve / decrement inventory, open_bottle_details, and batches within the function using SELECT ... FOR UPDATE or FOR UPDATE SKIP LOCKED where appropriate.
Use nextval('...') sequence or atomically increment reference_number_counters via UPDATE ... RETURNING for reference_number.
Insert transaction row (items_sold JSONB) once.
Return transaction id / reference_number / receipt data.
Would you like I draft and execute the SQL function for your DB? (I can produce a PL/pgSQL function next.)

2) Batch updates — reduce per-item queries
Replace per-row UPDATEs with set-based statements inside the stored proc.

a) Bulk decrement inventories (non-lubricants)

Build a VALUES list from cart items (product/inventory id + qty) and do single UPDATE ... FROM: Example pattern (conceptual):
WITH v (inventory_id, qty) AS (VALUES (...),(...))
UPDATE inventory i SET standard_stock = i.standard_stock - v.qty FROM v WHERE i.id = v.inventory_id RETURNING i.id, i.standard_stock;
This runs in a single statement and returns updated rows for checks.

b) Bulk decrement batches (FIFO)

If you don't need per-batch granularity immediately, you can:
Use SKIP LOCKED to pull batches for all cart items in one loop inside the function (still row-level but minimized).
Or, when possible, reserve total quantity from inventory first, then allocate to batches in background if costing can be deferred.
To allocate to batches in-set:
For each inventory_id gather needed_qty, select candidate batches ordered by purchase_date FOR UPDATE SKIP LOCKED, then update those batches in a loop — but this is done inside DB and avoids network round-trips.
If you must update multiple batches across many items, accumulate batch updates and use a single UPDATE ... FROM with VALUES (batch_id, new_stock_remaining).
c) Bulk updates for open_bottle_details (lubricants)

Construct a list of modifications (bottle_id, new_current_volume, is_empty boolean).
Use an UPDATE ... FROM (VALUES ...) to apply updates in one statement.
If opening new bottles is required, do batched INSERTs with INSERT ... SELECT from VALUES.
d) Use JSONB as single source of truth on write

Insert items_sold (the whole cart) as JSONB in transactions in the same statement to preserve the line items without extra relational work on the hot path.
3) Locking & concurrency strategies
Goal: prevent race conditions while maximizing throughput.

a) Lock only necessary rows

Use SELECT ... FOR UPDATE only on inventory/batch/open_bottle rows that will change, not entire tables.
Example: SELECT id, standard_stock FROM inventory WHERE id = ANY(...) FOR UPDATE;
b) SKIP LOCKED for high throughput on batches

When allocating from batches (FIFO), use FOR UPDATE SKIP LOCKED so concurrent transactions don’t block on the same batch rows; they skip locked rows and choose next available batch.
Pattern:
SELECT * FROM batches WHERE inventory_id = X AND stock_remaining > 0 ORDER BY purchase_date FOR UPDATE SKIP LOCKED LIMIT 10;*
c) Use short transactions and minimal work inside transactional context

Do only the necessary DB updates inside the stored proc; offload receipt generation, analytics, emails to asynchronous workers (pg_notify, Realtime, or an Edge Function queue).
d) Atomic counters

Prefer sequences for high-volume unique numeric references: nextval('transaction_ref_seq') — fastest and avoids contention.
If you need prefixed counters, use reference_number_counters but increment via: UPDATE reference_number_counters SET counter = counter + 1, updated_at = now() WHERE prefix = 'S' RETURNING counter; This is atomic but more contended than sequences. Consider a sequence per prefix if throughput is high.
e) Avoid long-lived row locks

If you must perform heavier computation (e.g., complex costing), compute in a background job using the stored transaction id.
4) Trigger-based consistency vs. single-proc updates
Triggers can help maintain derived data (e.g., denormalized counters) but are not a replacement for primary stock updates in high-throughput POS.
Patterns:

Synchronous triggers on transactions (AFTER INSERT) that decrement stock are possible, but they make the insert operation heavier and can increase contention (because the trigger runs within the same transaction).
Better pattern: perform stock changes inside the stored procedure that creates the transaction (synchronous, minimal, deterministic). Use triggers for non-critical maintenance (audit logs, denormalized caches) or for asynchronous queuing.
Async triggers: a lightweight AFTER INSERT trigger could push a message to a queue table or call pg_notify. A worker then processes batch assignments or heavy recalculations. This reduces pressure on the insert but adds eventual consistency.
Recommendation: keep stock updates synchronous inside the proc; use triggers/pg_notify to offload receipts/analytics.

5) Schema & indexing optimizations
a) Index recommendations

inventory: composite index on (product_id, location_id) exists — keep it. Also index (location_id, product_id) if queries use location first.
batches: existing index on (inventory_id, is_active_batch) is good. Add:
CREATE INDEX idx_batches_inventory_purchase_date ON batches (inventory_id, purchase_date, id) WHERE stock_remaining > 0;
CREATE INDEX idx_batches_inventory_stock ON batches (inventory_id, stock_remaining) WHERE stock_remaining > 0; These help FIFO selection queries and skip-dead batches fast.
open_bottle_details: index on (inventory_id, is_empty, opened_at) or (inventory_id, is_empty, id) to quickly find non-empty bottles.
transactions: partition by time (monthly) if transaction volume is large and queries usually recent. Also index reference_number (unique), shop_id, created_at.
reference_number_counters: if you stick to this table, ensure prefix is primary key.
b) Partitioning strategies

transactions: range partition on created_at (monthly) or list partition by shop_id if shops are large and isolated. Partitioning reduces index bloat and speeds queries that target recent data.
batches: probably small; partitioning rarely needed. If you have extremely many batches, consider partitioning by inventory_id hash.
c) Denormalization

Keep items_sold JSONB on transactions (you already have it) to reduce relational writes in hot path.
Maintain a small materialized counter table for frequently-read aggregates (e.g., daily_sales) updated asynchronously.
6) Specific code patterns and examples
a) Bulk inventory UPDATE (conceptual)

Inside stored proc, after you lock inventories: WITH vals (inventory_id, qty) AS ( VALUES ('inv-1'::uuid, 2), ('inv-2'::uuid, 1) ), updated AS ( UPDATE inventory i SET standard_stock = i.standard_stock - v.qty FROM vals v WHERE i.id = v.inventory_id RETURNING i.id, i.standard_stock ) SELECT * FROM updated;*
b) Sequence for reference numbers

SQL: CREATE SEQUENCE IF NOT EXISTS transaction_ref_seq START 1; reference_number := nextval('transaction_ref_seq');
c) Batch allocation with SKIP LOCKED (conceptual)

For each inventory_id need: LOOP SELECT id, stock_remaining FROM batches WHERE inventory_id = cur_inventory_id AND stock_remaining > 0 ORDER BY purchase_date FOR UPDATE SKIP LOCKED LIMIT 1 INTO batch_row; EXIT WHEN NOT FOUND; allocate := LEAST(batch_row.stock_remaining, remaining_qty); UPDATE batches SET stock_remaining = stock_remaining - allocate WHERE id = batch_row.id; remaining_qty := remaining_qty - allocate; EXIT WHEN remaining_qty = 0; END LOOP;
Because this runs inside DB, it's fast and avoids network round-trips. Use SKIP LOCKED to avoid contention.

d) Update multiple batches in one statement (if you can precompute new values)

Collect pairs (batch_id, new_stock) and: WITH v (id, new_stock) AS (VALUES (...), (...)) UPDATE batches b SET stock_remaining = v.new_stock FROM v WHERE b.id = v.id RETURNING b.id;
7) Drizzle / Next.js considerations
Keep the Next.js layer thin: send validated cart to the DB function via a single call. Use Drizzle to call a PostgreSQL function or use a direct SQL exec if Drizzle lacks stored-proc helpers.
Avoid ORM per-row updates on hot path. Use the DB function instead and only use Drizzle for non-hot tasks or analytic writes.
8) Observability & safety
Add logging/audit rows inside the stored proc (lightweight) or emit pg_notify events so external workers can log asynchronously.
Add monitoring: measure transaction duration, lock wait times, and deadlocks using pg_stat_activity and pg_locks.
Add metrics for SKIP LOCKED fallbacks (how often a worker must skip a locked batch).
9) Step-by-step action plan (practical)
Create a sequence for reference numbers (if acceptable).
Implement a PL/pgSQL function create_checkout(...) that:
Validates idempotency,
Locks involved inventory rows (SELECT ... FOR UPDATE),
Bulk updates inventory via UPDATE ... FROM (VALUES ...),
Allocates batch stock with FOR UPDATE SKIP LOCKED inside the proc, updating batches with batched UPDATEs,
Updates open_bottle_details via a single UPDATE ... FROM (VALUES ...),
Inserts transactions with items_sold JSONB and returns transaction id/reference.
Replace application hot path to call this single function.
Add triggers/pg_notify to queue receipts and analytics asynchronously.
Add indexes described above.
Monitor performance and, if needed, partition transactions monthly.