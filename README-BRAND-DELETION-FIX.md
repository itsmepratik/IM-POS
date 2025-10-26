# Brand & Category Deletion Fix

## Problem

The brand and category deletion was failing with error:

```
Error: update or delete on table "brands" violates foreign key constraint "products_brand_id_fkey" on table "products"
Code: 23503
Details: Key (id)=(...) is still referenced from table "products".
```

Even though the schema was supposed to have `ON DELETE SET NULL`, the constraint wasn't working properly.

## Root Cause

The foreign key constraints on `products.brand_id` and `products.category_id` were **not** properly configured with `ON DELETE SET NULL`. This prevented deletion of brands/categories that had associated products.

## Solution

### 1. Database Migration (Recommended)

A new migration file has been created that will automatically fix the constraints on next deployment:

**File:** `supabase/migrations/20250120000000_fix_brand_category_constraints.sql`

This migration will:

- Drop the existing foreign key constraints
- Recreate them with proper `ON DELETE SET NULL` and `ON UPDATE CASCADE`
- Add documentation comments

### 2. Manual Fix (For Immediate Resolution)

If you need to fix this **immediately** without waiting for a migration:

#### Option A: Run SQL Script

Execute the SQL script directly in your Supabase SQL Editor:

```bash
# Open the file and copy its contents:
cat scripts/apply-constraint-fix.sql

# Then paste into Supabase SQL Editor and run
```

#### Option B: Manual SQL Commands

Run these commands in your Supabase SQL Editor:

```sql
BEGIN;

-- Drop existing constraints
ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS products_brand_id_fkey CASCADE;

ALTER TABLE public.products
DROP CONSTRAINT IF EXISTS products_category_id_fkey CASCADE;

-- Recreate with proper ON DELETE SET NULL
ALTER TABLE public.products
ADD CONSTRAINT products_brand_id_fkey
FOREIGN KEY (brand_id)
REFERENCES public.brands(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

ALTER TABLE public.products
ADD CONSTRAINT products_category_id_fkey
FOREIGN KEY (category_id)
REFERENCES public.categories(id)
ON DELETE SET NULL
ON UPDATE CASCADE;

COMMIT;
```

### 3. Code Changes

The service functions have been updated to:

- Remove manual product updates (now handled by database constraints)
- Add better logging to track deletion process
- Simplify the deletion logic

## How It Works Now

1. **User deletes a brand/category**
2. **Database automatically updates products:**
   - Products using the deleted brand → `brand_id` set to `NULL` (shows as "No Brand")
   - Products using the deleted category → `category_id` set to `NULL` (shows as "Uncategorized")
3. **Brand/category is deleted successfully**
4. **User sees success message**

## Testing

After applying the fix, test by:

1. **Create a test brand:**

   ```
   Go to Inventory → More Options → Brands → Add "Test Brand"
   ```

2. **Assign it to a product:**

   ```
   Edit any product → Set brand to "Test Brand" → Save
   ```

3. **Delete the brand:**

   ```
   Go to Brands → Click X next to "Test Brand"
   ```

4. **Verify:**
   - Brand deletion succeeds
   - Product now shows "No Brand"
   - No errors in console

## Files Modified

1. **Migration:**

   - `supabase/migrations/20250120000000_fix_brand_category_constraints.sql`

2. **Scripts:**

   - `scripts/apply-constraint-fix.sql`

3. **Services:**

   - `lib/services/inventoryService.ts`
     - Simplified `deleteBrandService()`
     - Simplified `deleteCategoryService()`

4. **UI:**
   - `app/inventory/brand-modal.tsx` - Updated confirmation message
   - `app/inventory/category-modal.tsx` - Updated confirmation message
   - `app/inventory/items-context.tsx` - Updated error handling

## Verification

To verify the constraints are properly set:

```sql
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    CASE confdeltype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
    END AS on_delete_action,
    CASE confupdtype
        WHEN 'a' THEN 'NO ACTION'
        WHEN 'r' THEN 'RESTRICT'
        WHEN 'c' THEN 'CASCADE'
        WHEN 'n' THEN 'SET NULL'
        WHEN 'd' THEN 'SET DEFAULT'
    END AS on_update_action
FROM pg_constraint
WHERE conname IN ('products_brand_id_fkey', 'products_category_id_fkey');
```

Expected output:

```
constraint_name              | table_name | referenced_table | on_delete_action | on_update_action
---------------------------- | ---------- | ---------------- | ---------------- | ----------------
products_brand_id_fkey       | products   | brands           | SET NULL         | CASCADE
products_category_id_fkey    | products   | categories       | SET NULL         | CASCADE
```

## Success Criteria

✅ Can delete brands without errors  
✅ Products automatically update to show "No Brand"  
✅ Can delete categories without errors  
✅ Products automatically update to show "Uncategorized"  
✅ No orphaned data  
✅ Clear user feedback messages

## Notes

- **Data Safety:** The `ON DELETE SET NULL` constraint ensures no data is lost. Products remain but lose their brand/category reference.
- **Performance:** This is a database-level operation, so it's instant regardless of how many products are affected.
- **Backwards Compatible:** This fix doesn't break any existing functionality.
