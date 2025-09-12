Phase 10: Database Schema Enhancement for Detailed Lubricant Tracking
Goal: To update the database schema using Drizzle ORM to precisely track each individual open oil bottle and its remaining volume. This creates the necessary foundation for the advanced inventory logic.

Prompt:

I need to update my existing Drizzle ORM schema to support a more detailed management system for open lubricant bottles. Generate a new Drizzle migration file to perform the following changes:

1.  **Create a New `open_bottle_details` Table:**

    - This table will track every single bottle that has been opened, allowing for precise volume deduction.
    - `id`: UUID, primary key.
    - `inventory_id`: UUID, foreign key referencing the `inventory` table. This links the open bottle back to a specific product at a specific location.
    - `initial_volume`: Numeric, not null. The original size of the bottle when it was new (e.g., 4.0 for a 4-liter bottle).
    - `current_volume`: Numeric, not null. The amount of liquid currently remaining in this specific bottle.
    - `opened_at`: Timestamp with time zone, default `now()`.
    - `is_empty`: Boolean, default `false`. This will be set to `true` when `current_volume` reaches zero.

2.  **Clarify the `inventory` Table's Role:**
    - No schema change is needed for the `inventory` table itself, but the logic will now interpret the `open_bottles_stock` column as a simple **COUNT** of records in the `open_bottle_details` table that are not empty (`is_empty: false`) for that `inventory_id`. This is a crucial context for the next phase.

After defining the new table, generate the SQL migration file.
