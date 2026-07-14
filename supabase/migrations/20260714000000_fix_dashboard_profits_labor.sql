CREATE OR REPLACE FUNCTION public.get_dashboard_profits_estimate(start_date timestamp without time zone, end_date timestamp without time zone, filter_shop_id uuid DEFAULT NULL::uuid)
 RETURNS numeric
 LANGUAGE sql
AS $function$
    WITH sold_items AS (
        SELECT 
            -- Determine multiplier: -1 for REFUND, 1 for others
            CASE WHEN t.type = 'REFUND' THEN -1 ELSE 1 END as multiplier,
            
            -- Revenue Ratio (Handles both Discount AND Trade-In)
            -- We assume total_amount is the final Net Cash received (Subtotal - Discount - TradeIn)
            -- If subtotal is missing/zero, we calculate it from items, or fallback to 1 (if total_amount > 0?)
            CASE 
                WHEN COALESCE(t.subtotal_before_discount, 0) > 0 THEN 
                   t.total_amount / t.subtotal_before_discount
                ELSE 
                   -- Fallback: If subtotal is missing but total_amount exists, we might default to 1 
                   -- But safer to re-calculate subtotal from items if possible? 
                   -- For optimization, we'll just assume 1 if subtotal is missing (likely old data without discount/tradein)
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
    )
    SELECT 
        COALESCE(
            SUM(
                ((selling_price * quantity * revenue_ratio) - (cost_price * quantity)) * multiplier
            ), 0
        ) as profit
    FROM sold_items;
$function$;
