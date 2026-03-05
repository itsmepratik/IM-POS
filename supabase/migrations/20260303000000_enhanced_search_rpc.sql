-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- Drop existing function if it exists as we are changing the return type signature
DROP FUNCTION IF EXISTS search_inventory_items_v2(text,uuid,uuid,uuid,numeric,numeric,text,boolean,text,integer,integer);

-- Create search function for inventory (v2 to bypass signature cache/drop issues)
CREATE OR REPLACE FUNCTION search_inventory_items_v2(
  p_search_query TEXT,
  p_location_id UUID,
  p_category_id UUID DEFAULT NULL,
  p_brand_id UUID DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_stock_status TEXT DEFAULT 'all',
  p_is_battery BOOLEAN DEFAULT NULL,
  p_battery_state TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  inventory_id UUID,
  product_id UUID,
  standard_stock INTEGER,
  selling_price NUMERIC,
  open_bottles_stock INTEGER,
  closed_bottles_stock INTEGER,
  total_stock INTEGER,
  product_name TEXT,
  product_description TEXT,
  product_image_url TEXT,
  product_low_stock_threshold INTEGER,
  product_cost_price NUMERIC,
  product_manufacturing_date TIMESTAMP WITH TIME ZONE,
  product_is_battery BOOLEAN,
  product_battery_state TEXT,
  product_specification TEXT,
  category_id UUID,
  category_name TEXT,
  brand_id UUID,
  brand_name TEXT,
  search_rank REAL,
  total_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_search_tsquery tsquery;
  v_total_count BIGINT;
BEGIN
  -- Prepare search query
  -- Using websearch_to_tsquery for "semantic-lite" feel (handles quotes, minus sign, etc.)
  -- We use 'simple' configuration to avoid overly aggressive stemming which can be confusing for product codes
  v_search_tsquery := websearch_to_tsquery('simple', unaccent(p_search_query));

  -- Get total count for pagination
  SELECT COUNT(*) INTO v_total_count
  FROM inventory i
  JOIN products p ON i.product_id = p.id
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN brands b ON p.brand_id = b.id
  WHERE i.location_id = p_location_id
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_brand_id IS NULL OR p.brand_id = p_brand_id)
    AND (p_min_price IS NULL OR i.selling_price >= p_min_price)
    AND (p_max_price IS NULL OR i.selling_price <= p_max_price)
    AND (
      p_stock_status = 'all' OR
      (p_stock_status = 'in-stock' AND i.standard_stock > COALESCE(p.low_stock_threshold, 10)) OR
      (p_stock_status = 'low-stock' AND i.standard_stock > 0 AND i.standard_stock <= COALESCE(p.low_stock_threshold, 10)) OR
      (p_stock_status = 'out-of-stock' AND i.standard_stock = 0)
    )
    AND (p_is_battery IS NULL OR p.is_battery = p_is_battery)
    AND (p_battery_state IS NULL OR p.battery_state = p_battery_state)
    AND (
      p_search_query = '' OR
      to_tsvector('simple', unaccent(p.name || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(b.name, '') || ' ' || COALESCE(c.name, '') || ' ' || COALESCE(p.specification, ''))) @@ v_search_tsquery OR
      unaccent(p.name) % unaccent(p_search_query) OR
      unaccent(COALESCE(b.name, '')) % unaccent(p_search_query)
    );

  RETURN QUERY
  SELECT 
    i.id as inventory_id,
    p.id as product_id,
    i.standard_stock,
    i.selling_price,
    i.open_bottles_stock,
    i.closed_bottles_stock,
    i.total_stock,
    p.name as product_name,
    p.description as product_description,
    p.image_url as product_image_url,
    p.low_stock_threshold as product_low_stock_threshold,
    p.cost_price as product_cost_price,
    p.manufacturing_date as product_manufacturing_date,
    p.is_battery as product_is_battery,
    p.battery_state as product_battery_state,
    p.specification as product_specification,
    c.id as category_id,
    c.name as category_name,
    b.id as brand_id,
    b.name as brand_name,
    (
      -- Calculate search rank
      ts_rank_cd(
        to_tsvector('simple', unaccent(p.name || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(b.name, '') || ' ' || COALESCE(c.name, '') || ' ' || COALESCE(p.specification, ''))),
        v_search_tsquery
      ) + 
      similarity(unaccent(p.name), unaccent(p_search_query)) * 0.5 +
      similarity(unaccent(COALESCE(b.name, '')), unaccent(p_search_query)) * 0.3
    )::REAL as search_rank,
    v_total_count as total_count
  FROM inventory i
  JOIN products p ON i.product_id = p.id
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN brands b ON p.brand_id = b.id
  WHERE i.location_id = p_location_id
    AND (p_category_id IS NULL OR p.category_id = p_category_id)
    AND (p_brand_id IS NULL OR p.brand_id = p_brand_id)
    AND (p_min_price IS NULL OR i.selling_price >= p_min_price)
    AND (p_max_price IS NULL OR i.selling_price <= p_max_price)
    AND (
      p_stock_status = 'all' OR
      (p_stock_status = 'in-stock' AND i.standard_stock > COALESCE(p.low_stock_threshold, 10)) OR
      (p_stock_status = 'low-stock' AND i.standard_stock > 0 AND i.standard_stock <= COALESCE(p.low_stock_threshold, 10)) OR
      (p_stock_status = 'out-of-stock' AND i.standard_stock = 0)
    )
    AND (p_is_battery IS NULL OR p.is_battery = p_is_battery)
    AND (p_battery_state IS NULL OR p.battery_state = p_battery_state)
    AND (
      p_search_query = '' OR
      to_tsvector('simple', unaccent(p.name || ' ' || COALESCE(p.description, '') || ' ' || COALESCE(b.name, '') || ' ' || COALESCE(c.name, '') || ' ' || COALESCE(p.specification, ''))) @@ v_search_tsquery OR
      unaccent(p.name) % unaccent(p_search_query) OR
      unaccent(COALESCE(b.name, '')) % unaccent(p_search_query)
    )
  ORDER BY 
    CASE WHEN p_search_query = '' THEN i.id::text ELSE '' END ASC,
    search_rank DESC,
    p.name ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
