-- Role and permission management
-- This file defines the role-based access control schema

-- Create user_role enum
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('admin', 'shop');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create permission enum
DO $$ BEGIN
    CREATE TYPE public.permission AS ENUM (
        'pos.access',
        'inventory.access',
        'customers.access',
        'transactions.access',
        'notifications.access',
        'reports.access',
        'settings.access',
        'users.access',
        'admin.access'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role user_role NOT NULL,
    permission permission NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(role, permission)
);

-- Add comments
COMMENT ON TABLE public.role_permissions IS 'Maps roles to their permissions';
COMMENT ON TYPE public.user_role IS 'Available user roles in the system';
COMMENT ON TYPE public.permission IS 'Available permissions in the system';
