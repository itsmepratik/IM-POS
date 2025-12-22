-- Create a function to get daily payment metrics
CREATE OR REPLACE FUNCTION get_daily_payment_metrics(
  query_date timestamp with time zone DEFAULT now(),
  target_shop_id uuid DEFAULT NULL
)
RETURNS TABLE (
  payment_method text,
  total_amount numeric,
  transaction_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.payment_method,
    COALESCE(SUM(t.total_amount), 0) as total_amount,
    COUNT(*) as transaction_count
  FROM
    transactions t
  WHERE
    t.created_at >= date_trunc('day', query_date)
    AND t.created_at < date_trunc('day', query_date) + interval '1 day'
    AND t.type = 'SALE'
    AND (target_shop_id IS NULL OR t.shop_id = target_shop_id)
    AND t.payment_method IS NOT NULL
  GROUP BY
    t.payment_method;
END;
$$;
