-- Migration: Migrate hardcoded staff data from frontend to database
-- This inserts/updates all 9 staff members from lib/hooks/useStaffIDs.ts

-- Insert or update staff members
-- If staff_id exists, update the name; otherwise insert new record
INSERT INTO public.staff (staff_id, name, is_active, created_at, updated_at)
VALUES 
  ('0010', 'Abul Hossain (foreman)', true, now(), now()),
  ('0020', 'Adnan', true, now(), now()),
  ('0030', 'Ashiq', true, now(), now()),
  ('0041', 'Badsha', true, now(), now()),
  ('0051', 'Abid', true, now(), now()),
  ('0062', 'Bellal', true, now(), now()),
  ('0073', 'Sakib', true, now(), now()),
  ('0084', 'Obaydul', true, now(), now()),
  ('0094', 'Nur Alom', true, now(), now())
ON CONFLICT (staff_id) 
DO UPDATE SET 
  name = EXCLUDED.name,
  is_active = true,
  updated_at = now();

-- Verify all staff members were inserted/updated
-- This will fail if any staff_id is missing
DO $$
DECLARE
  expected_count INTEGER := 9;
  actual_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO actual_count 
  FROM public.staff 
  WHERE staff_id IN ('0010', '0020', '0030', '0041', '0051', '0062', '0073', '0084', '0094');
  
  IF actual_count < expected_count THEN
    RAISE EXCEPTION 'Expected % staff members, but found %', expected_count, actual_count;
  END IF;
END $$;

