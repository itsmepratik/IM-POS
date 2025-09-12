-- Initial brands seed data
-- This file populates the brands table with common automotive brands

-- Insert initial brands if they don't exist
INSERT INTO public.brands (name)
SELECT unnest(ARRAY[
  'Castrol',
  'Mobil',
  'Bosch',
  'K&N',
  'Akebono',
  'Valvoline',
  'Prestone',
  'Rain-X',
  'ATE',
  'Meguiar\'s',
  'Motul',
  'Brembo',
  'ACME',
  'GearMax'
])
ON CONFLICT (name) DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE public.brands IS 'Automotive brands for products';
