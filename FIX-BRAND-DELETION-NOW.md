# 🔧 Fix Brand Deletion - Execute This NOW

## Quick Fix (2 Minutes)

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

### Step 2: Paste and Run This SQL

Copy and paste this **exact code** into the SQL editor:

```sql
-- Fix brand and category deletion constraints
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

-- Verify it worked
SELECT
    conname AS constraint_name,
    CASE confdeltype
        WHEN 'n' THEN '✅ SET NULL (CORRECT)'
        ELSE '❌ ' || confdeltype || ' (WRONG)'
    END AS on_delete_status
FROM pg_constraint
WHERE conname IN ('products_brand_id_fkey', 'products_category_id_fkey');
```

### Step 3: Click "Run" (or press Ctrl+Enter)

You should see:

```
constraint_name              | on_delete_status
---------------------------- | -------------------------
products_brand_id_fkey       | ✅ SET NULL (CORRECT)
products_category_id_fkey    | ✅ SET NULL (CORRECT)
```

### Step 4: Test It

1. Go to your **Inventory** page
2. Click **"More Options"** → **"Brands"**
3. Try deleting any brand
4. **It should work now!** ✅

## What This Does

- **Removes** the broken foreign key constraints
- **Recreates** them with proper `ON DELETE SET NULL`
- **Allows** you to delete brands/categories
- **Automatically** sets products to "No Brand" / "Uncategorized"

## Expected Behavior After Fix

| Action                    | Result                       |
| ------------------------- | ---------------------------- |
| Delete brand "Castrol"    | ✅ Deletes successfully      |
| Products using "Castrol"  | Shows as "No Brand" or "N/A" |
| Delete category "Filters" | ✅ Deletes successfully      |
| Products in "Filters"     | Shows as "Uncategorized"     |

## Troubleshooting

### If you see an error like "permission denied":

You need to be logged in as a **database admin**. Contact your database administrator or use the Supabase service role key.

### If brands still won't delete:

1. Check if there are any RLS policies blocking it
2. Make sure you're logged in as an admin user in your app
3. Check browser console for errors

## Done!

After running the SQL above, brand and category deletion should work perfectly. The database will automatically handle updating products when you delete a brand or category.

---

**Need more details?** See `README-BRAND-DELETION-FIX.md` for the full technical explanation.
