-- Migration: Comprehensive database repair after FK-destroying migrations
--
-- Root cause: Migrations 20260726000001 and 20260726000003 altered the inventory
-- table (DROP COLUMN, ALTER COLUMN TYPE, ADD COLUMN) which silently dropped ALL
-- foreign key constraints. Subsequent migrations never re-created them.
-- Additionally, RPC functions and Realtime publications were lost.
--
-- This migration:
-- 1. Restores ALL missing FKs (idempotent — safe to re-run)
-- 2. Cleans up orphan rows that violate new FKs
-- 3. Recreates missing RPC functions (dashboard metrics, middleware auth)
-- 4. Restores Realtime publication tables (inventory, products, transactions)
-- 5. Reloads the PostgREST schema cache

BEGIN;

-- ============================================================
-- PART 1: Foreign Key Constraints
-- ============================================================

-- inventory
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_product_id_fkey' AND conrelid = 'public.inventory'::regclass) THEN
    ALTER TABLE public.inventory ADD CONSTRAINT inventory_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_location_id_fkey' AND conrelid = 'public.inventory'::regclass) THEN
    ALTER TABLE public.inventory ADD CONSTRAINT inventory_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- products
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_category_id_fkey' AND conrelid = 'public.products'::regclass) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_brand_id_fkey' AND conrelid = 'public.products'::regclass) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE SET NULL;
  END IF;
END $$;

-- product_types
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_types_product_id_fkey' AND conrelid = 'public.product_types'::regclass) THEN
    ALTER TABLE public.product_types ADD CONSTRAINT product_types_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;
END $$;
DELETE FROM product_types WHERE type_id NOT IN (SELECT id FROM types);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_types_type_id_fkey' AND conrelid = 'public.product_types'::regclass) THEN
    ALTER TABLE public.product_types ADD CONSTRAINT product_types_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.types(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- product_volumes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_volumes_product_id_fkey' AND conrelid = 'public.product_volumes'::regclass) THEN
    ALTER TABLE public.product_volumes ADD CONSTRAINT product_volumes_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
  END IF;
END $$;

-- batches
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'batches_inventory_id_fkey' AND conrelid = 'public.batches'::regclass) THEN
    ALTER TABLE public.batches ADD CONSTRAINT batches_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventory(id) ON DELETE CASCADE;
  END IF;
END $$;

-- open_bottle_details
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'open_bottle_details_inventory_id_fkey' AND conrelid = 'public.open_bottle_details'::regclass) THEN
    ALTER TABLE public.open_bottle_details ADD CONSTRAINT open_bottle_details_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventory(id) ON DELETE CASCADE;
  END IF;
END $$;

-- shops
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'shops_location_id_fkey' AND conrelid = 'public.shops'::regclass) THEN
    ALTER TABLE public.shops ADD CONSTRAINT shops_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- cash_shifts
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cash_shifts_shop_id_fkey' AND conrelid = 'public.cash_shifts'::regclass) THEN
    ALTER TABLE public.cash_shifts ADD CONSTRAINT cash_shifts_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE RESTRICT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cash_shifts_location_id_fkey' AND conrelid = 'public.cash_shifts'::regclass) THEN
    ALTER TABLE public.cash_shifts ADD CONSTRAINT cash_shifts_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- transactions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_shop_id_fkey' AND conrelid = 'public.transactions'::regclass) THEN
    ALTER TABLE public.transactions ADD CONSTRAINT transactions_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.shops(id) ON DELETE RESTRICT;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'transactions_location_id_fkey' AND conrelid = 'public.transactions'::regclass) THEN
    ALTER TABLE public.transactions ADD CONSTRAINT transactions_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- ============================================================
-- PART 1b: Drop duplicate FKs that cause PostgREST ambiguity
-- ============================================================
-- Some tables already had FKs with different naming conventions (e.g.
-- products_brand_id_brands_id_fk). Our restoration added new ones
-- (products_brand_id_fkey). PostgREST sees both and fails with
-- "Could not embed because more than one relationship was found".

ALTER TABLE IF EXISTS products DROP CONSTRAINT IF EXISTS products_brand_id_fkey;
ALTER TABLE IF EXISTS products DROP CONSTRAINT IF EXISTS products_category_id_fkey;
ALTER TABLE IF EXISTS open_bottle_details DROP CONSTRAINT IF EXISTS open_bottle_details_inventory_id_fkey;
ALTER TABLE IF EXISTS shops DROP CONSTRAINT IF EXISTS shops_location_id_fkey;
ALTER TABLE IF EXISTS transactions DROP CONSTRAINT IF EXISTS transactions_location_id_fkey;
ALTER TABLE IF EXISTS transactions DROP CONSTRAINT IF EXISTS transactions_shop_id_fkey;

-- ============================================================
-- PART 2: Missing RPC Functions
-- ============================================================

-- get_net_revenue (used by dashboard-metrics edge function)
CREATE OR REPLACE FUNCTION public.get_net_revenue(
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    filter_shop_id uuid DEFAULT NULL::uuid
)
RETURNS numeric
LANGUAGE sql
AS $function$
    SELECT COALESCE(
        SUM(CASE WHEN type = 'REFUND' THEN -total_amount ELSE total_amount END), 0
    )
    FROM transactions
    WHERE created_at >= start_date AND created_at <= end_date
      AND (filter_shop_id IS NULL OR shop_id = filter_shop_id)
      AND type IN ('SALE', 'ON_HOLD_PAID', 'CREDIT_PAID', 'REFUND')
      AND is_voided = false;
$function$;

-- get_dashboard_top_items (used by dashboard-metrics edge function)
CREATE OR REPLACE FUNCTION public.get_dashboard_top_items(
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    filter_shop_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(name text, units bigint, revenue numeric)
LANGUAGE sql
AS $function$
    SELECT
        CASE
            WHEN p.name IS NOT NULL THEN TRIM(CONCAT(COALESCE(b.name, ''), ' ', p.name))
            WHEN item->>'name' IS NOT NULL THEN item->>'name'
            WHEN item->>'volumeDescription' IS NOT NULL THEN item->>'volumeDescription'
            ELSE 'Custom Item'
        END as product_name,
        SUM(COALESCE((item->>'quantity')::int, 0)) as units,
        SUM(COALESCE((item->>'sellingPrice')::numeric, (item->>'price')::numeric, 0) * COALESCE((item->>'quantity')::int, 0)) as revenue
    FROM transactions t
    CROSS JOIN LATERAL jsonb_array_elements(t.items_sold) as item
    LEFT JOIN products p ON p.id::text = (item->>'productId')
    LEFT JOIN brands b ON b.id = p.brand_id
    WHERE t.created_at >= start_date AND t.created_at <= end_date
      AND (filter_shop_id IS NULL OR t.shop_id = filter_shop_id)
      AND t.type IN ('SALE', 'ON_HOLD_PAID', 'CREDIT_PAID')
      AND t.is_voided = false
    GROUP BY product_name
    ORDER BY units DESC
    LIMIT 5;
$function$;

-- get_dashboard_profits_estimate (used by dashboard-metrics edge function)
DROP FUNCTION IF EXISTS public.get_dashboard_profits_estimate(timestamp without time zone, timestamp without time zone, uuid);
CREATE OR REPLACE FUNCTION public.get_dashboard_profits_estimate(
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    filter_shop_id uuid DEFAULT NULL::uuid
)
RETURNS numeric
LANGUAGE sql
AS $function$
    WITH sold_items AS (
        SELECT
            CASE WHEN t.type = 'REFUND' THEN -1 ELSE 1 END as multiplier,
            CASE WHEN COALESCE(t.subtotal_before_discount, 0) > 0
                 THEN t.total_amount / t.subtotal_before_discount ELSE 1 END as revenue_ratio,
            COALESCE((item->>'sellingPrice')::numeric, 0) as selling_price,
            COALESCE((item->>'costPrice')::numeric, 0) as cost_price,
            COALESCE((item->>'quantity')::numeric, 0) as quantity
        FROM transactions t
        CROSS JOIN LATERAL jsonb_array_elements(t.items_sold) as item
        WHERE t.created_at >= start_date AND t.created_at <= end_date
          AND t.type IN ('SALE', 'ON_HOLD_PAID', 'CREDIT_PAID', 'REFUND')
          AND (filter_shop_id IS NULL OR t.shop_id = filter_shop_id)
          AND t.is_voided = false
    ),
    service_profits AS (
        SELECT
            CASE WHEN t.type = 'REFUND' THEN -1 ELSE 1 END as multiplier,
            CASE WHEN COALESCE(t.subtotal_before_discount, 0) > 0
                 THEN t.total_amount / t.subtotal_before_discount ELSE 1 END as revenue_ratio,
            COALESCE(s.unit_price, 0) as selling_price,
            COALESCE(s.cost_price, 0) as cost_price,
            COALESCE(s.quantity, 0) as quantity
        FROM transactions t
        JOIN service_items s ON s.transaction_id = t.id
        WHERE t.created_at >= start_date AND t.created_at <= end_date
          AND t.type IN ('SALE', 'ON_HOLD_PAID', 'CREDIT_PAID', 'REFUND')
          AND (filter_shop_id IS NULL OR t.shop_id = filter_shop_id)
          AND t.is_voided = false
          AND s.item_type IN ('service', 'labor', 'composite')
    ),
    combined AS (SELECT * FROM sold_items UNION ALL SELECT * FROM service_profits)
    SELECT COALESCE(SUM(((selling_price * quantity * revenue_ratio) - (cost_price * quantity)) * multiplier), 0)
    FROM combined;
$function$;

-- get_user_role_for_middleware (used by middleware.ts for role-based routing)
CREATE OR REPLACE FUNCTION public.get_user_role_for_middleware(user_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $function$
    SELECT COALESCE(up.role, 'shop') FROM public.user_profiles up WHERE up.id = user_id;
$function$;

-- get_daily_payment_metrics (used by dashboard-metrics edge function)
DROP FUNCTION IF EXISTS public.get_daily_payment_metrics(text);
CREATE OR REPLACE FUNCTION public.get_daily_payment_metrics(
    query_date timestamp with time zone DEFAULT now(),
    target_shop_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(payment_method text, total_amount numeric, transaction_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  day_start timestamp with time zone;
  day_end timestamp with time zone;
BEGIN
  day_start := date_trunc('day', query_date AT TIME ZONE 'Asia/Muscat') AT TIME ZONE 'Asia/Muscat';
  day_end := day_start + interval '1 day';
  RETURN QUERY
  SELECT t.payment_method, COALESCE(SUM(t.total_amount), 0), COUNT(*)
  FROM transactions t
  WHERE t.created_at >= day_start AND t.created_at < day_end
    AND t.type = 'SALE'
    AND (target_shop_id IS NULL OR t.shop_id = target_shop_id)
    AND t.payment_method IS NOT NULL
    AND t.is_voided = false
  GROUP BY t.payment_method;
END;
$function$;

-- get_daily_sales (used by dashboard-metrics edge function)
DROP FUNCTION IF EXISTS public.get_daily_sales(timestamp with time zone, timestamp with time zone, uuid);
CREATE OR REPLACE FUNCTION public.get_daily_sales(
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    filter_shop_id uuid DEFAULT NULL::uuid
)
RETURNS TABLE(date text, revenue numeric, units bigint)
LANGUAGE sql
AS $function$
    SELECT to_char(t.created_at, 'YYYY-MM-DD'), COALESCE(SUM(t.total_amount), 0), COUNT(*)
    FROM transactions t
    WHERE t.created_at >= start_date AND t.created_at <= end_date
      AND t.type IN ('SALE', 'ON_HOLD_PAID', 'CREDIT_PAID')
      AND (filter_shop_id IS NULL OR t.shop_id = filter_shop_id)
      AND t.is_voided = false
    GROUP BY to_char(t.created_at, 'YYYY-MM-DD')
    ORDER BY 1;
$function$;

-- ============================================================
-- PART 3: Realtime Publication (was empty — 0 tables)
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'inventory') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'products') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE products;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'transactions') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'cash_shifts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE cash_shifts;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'cash_shift_movements') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE cash_shift_movements;
  END IF;
END $$;

-- ============================================================
-- PART 4: Reload PostgREST schema cache
-- ============================================================

NOTIFY pgrst, 'reload schema';

COMMIT;
