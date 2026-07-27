-- Fix get_dashboard_profits_estimate to use timestamp with time zone
-- and include service/labor items from service_items table

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
    ),
    service_profits AS (
        SELECT 
            CASE WHEN t.type = 'REFUND' THEN -1 ELSE 1 END as multiplier,
            CASE 
                WHEN COALESCE(t.subtotal_before_discount, 0) > 0 THEN 
                   t.total_amount / t.subtotal_before_discount
                ELSE 
                   1
            END as revenue_ratio,
            COALESCE(s.unit_price, 0) as selling_price,
            COALESCE(s.cost_price, 0) as cost_price,
            COALESCE(s.quantity, 0) as quantity
        FROM transactions t
        JOIN service_items s ON s.transaction_id = t.id
        WHERE 
            t.created_at >= start_date
            AND t.created_at <= end_date
            AND t.type IN ('SALE', 'ON_HOLD_PAID', 'CREDIT_PAID', 'REFUND')
            AND (filter_shop_id IS NULL OR t.shop_id = filter_shop_id)
            AND t.is_voided = false
            AND s.item_type IN ('service', 'labor', 'composite')
    ),
    combined AS (
        SELECT * FROM sold_items
        UNION ALL
        SELECT * FROM service_profits
    )
    SELECT 
        COALESCE(
            SUM(
                ((selling_price * quantity * revenue_ratio) - (cost_price * quantity)) * multiplier
            ), 0
        ) as profit
    FROM combined;
$function$;
