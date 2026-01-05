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
  GROUP BY 1
  ORDER BY 1;
END;
$function$;

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
  GROUP BY
    t.payment_method;
END;
$function$;
