-- Update all dashboard SQL functions to exclude voided transactions from financial calculations

-- ============================
-- 1. get_daily_sales
-- ============================
CREATE OR REPLACE FUNCTION public.get_daily_sales(start_date timestamp with time zone, end_date timestamp with time zone, filter_shop_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(sale_date date, total_sales numeric)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    date_trunc('day', created_at AT TIME ZONE 'Asia/Muscat')::date as sale_date,
    SUM(
      CASE 
        WHEN type = 'REFUND' THEN -total_amount 
        ELSE total_amount 
      END
    ) as total_sales
  FROM transactions
  WHERE created_at >= start_date
    AND created_at <= end_date
    AND (filter_shop_id IS NULL OR shop_id = filter_shop_id)
    AND type IN ('SALE', 'ON_HOLD_PAID', 'REFUND')
    AND is_voided = false
  GROUP BY 1
  ORDER BY 1;
END;
$function$;

-- ============================
-- 2. get_daily_payment_metrics
-- ============================
CREATE OR REPLACE FUNCTION public.get_daily_payment_metrics(query_date timestamp with time zone DEFAULT now(), target_shop_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(payment_method text, total_amount numeric, transaction_count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  day_start timestamp with time zone;
  day_end timestamp with time zone;
BEGIN
  -- Convert query_date to Muscat time to find the start of the day in that timezone
  -- Then convert back to UTC for searching the created_at column
  day_start := date_trunc('day', query_date AT TIME ZONE 'Asia/Muscat') AT TIME ZONE 'Asia/Muscat';
  day_end := day_start + interval '1 day';

  RETURN QUERY
  SELECT
    t.payment_method,
    COALESCE(SUM(t.total_amount), 0) as total_amount,
    COUNT(*) as transaction_count
  FROM
    transactions t
  WHERE
    t.created_at >= day_start
    AND t.created_at < day_end
    AND t.type = 'SALE'
    AND (target_shop_id IS NULL OR t.shop_id = target_shop_id)
    AND t.payment_method IS NOT NULL
    AND t.is_voided = false
  GROUP BY
    t.payment_method;
END;
$function$;

-- ============================
-- 3. get_dashboard_profits_estimate
-- ============================
CREATE OR REPLACE FUNCTION public.get_dashboard_profits_estimate(start_date timestamp without time zone, end_date timestamp without time zone, filter_shop_id uuid DEFAULT NULL::uuid)
 RETURNS numeric
 LANGUAGE sql
AS $function$
    WITH sold_items AS (
        SELECT 
            -- Determine multiplier: -1 for REFUND, 1 for others
            CASE WHEN t.type = 'REFUND' THEN -1 ELSE 1 END as multiplier,
            
            -- Revenue Ratio (Handles both Discount AND Trade-In)
            CASE 
                WHEN COALESCE(t.subtotal_before_discount, 0) > 0 THEN 
                   t.total_amount / t.subtotal_before_discount
                ELSE 
                   1
            END as revenue_ratio,

            COALESCE((item->>'sellingPrice')::numeric, 0) as selling_price,
            COALESCE((item->>'costPrice')::numeric, 0) as cost_price,
            COALESCE((item->>'quantity')::numeric, 0) as quantity
        FROM transactions t
        CROSS JOIN LATERAL jsonb_array_elements(t.items_sold) as item
        WHERE 
            t.created_at >= start_date
            AND t.created_at <= end_date
            AND t.type IN ('SALE', 'ON_HOLD_PAID', 'CREDIT_PAID', 'REFUND')
            AND (filter_shop_id IS NULL OR t.shop_id = filter_shop_id)
            AND t.is_voided = false
    )
    SELECT 
        COALESCE(
            SUM(
                ((selling_price * quantity * revenue_ratio) - (cost_price * quantity)) * multiplier
            ), 0
        ) as profit
    FROM sold_items;
$function$;

-- ============================
-- 4. get_net_revenue
-- ============================
CREATE OR REPLACE FUNCTION public.get_net_revenue(start_date timestamp with time zone, end_date timestamp with time zone, filter_shop_id uuid DEFAULT NULL::uuid)
 RETURNS numeric
 LANGUAGE sql
AS $function$
    SELECT COALESCE(
        SUM(
            CASE 
                WHEN type = 'REFUND' THEN -total_amount 
                ELSE total_amount 
            END
        ), 0
    ) as net_revenue
    FROM transactions
    WHERE created_at >= start_date
      AND created_at <= end_date
      AND (filter_shop_id IS NULL OR shop_id = filter_shop_id)
      AND type IN ('SALE', 'ON_HOLD_PAID', 'CREDIT_PAID', 'REFUND')
      AND is_voided = false;
$function$;

-- ============================
-- 5. get_dashboard_top_items
-- ============================
CREATE OR REPLACE FUNCTION public.get_dashboard_top_items(start_date timestamp with time zone, end_date timestamp with time zone, filter_shop_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(name text, units bigint, revenue numeric)
 LANGUAGE sql
AS $function$
    SELECT
        CASE 
            WHEN p.name IS NOT NULL THEN 
              TRIM(CONCAT(COALESCE(b.name, ''), ' ', p.name))
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
    WHERE 
        t.created_at >= start_date
        AND t.created_at <= end_date
        AND (filter_shop_id IS NULL OR t.shop_id = filter_shop_id)
        AND t.type IN ('SALE', 'ON_HOLD_PAID', 'CREDIT_PAID')
        AND t.is_voided = false
    GROUP BY product_name
    ORDER BY units DESC
    LIMIT 5;
$function$;
