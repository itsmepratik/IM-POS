-- Self-Hosted Supabase Migration Script
-- Run this on the server: psql -U postgres -d postgres -f migrate.sql

-- ============================================
-- PHASE 1: Apply Schema
-- ============================================
\i /tmp/cloud_schema_dump.sql

-- ============================================
-- PHASE 2: Apply Data
-- ============================================
\i /tmp/cloud_data_dump.sql

-- ============================================
-- PHASE 3: Verify
-- ============================================
SELECT 'Tables:' as info;
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='public' AND table_name=t.table_name) as columns
FROM information_schema.tables t
WHERE table_schema='public' AND table_type='BASE TABLE'
ORDER BY table_name;

SELECT 'Functions:' as info;
SELECT routine_name FROM information_schema.routines WHERE routine_schema='public' ORDER BY routine_name;

SELECT 'RLS Policies:' as info;
SELECT policyname, tablename FROM pg_policies WHERE schemaname='public' ORDER BY tablename;

SELECT 'Migration Complete!' as status;
