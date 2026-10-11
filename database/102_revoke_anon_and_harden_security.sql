-- ==============================================================================
-- Migration 102: Revoke Anon Grants and Harden Database Security
-- Audit Finding S6: Prevent accidental exposure of user data via anon role.
-- ==============================================================================

-- 1. Revoke all privileges on all existing tables in schema public from the anon role
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- 2. Revoke all privileges on all existing sequences in schema public from the anon role
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- 3. Revoke all privileges on all existing routines/functions in schema public from the anon role
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;

-- 4. Alter default privileges so future tables and sequences created in public schema
--    do not automatically grant any access to anon
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon;

-- 5. Ensure authenticated role has full CRUD capabilities subject to Row-Level Security
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO authenticated;

-- 6. Ensure service_role maintains administrative bypass
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO service_role;

-- Verification note:
-- Run in Supabase SQL Editor:
-- SELECT grantee, table_name, privilege_type 
-- FROM information_schema.role_table_grants 
-- WHERE grantee = 'anon' AND table_schema = 'public';
-- (Expected result: 0 rows)
