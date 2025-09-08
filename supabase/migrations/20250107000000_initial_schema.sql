-- Initial schema migration
-- This migration sets up the basic database structure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role user_role DEFAULT 'shop',
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role user_role NOT NULL,
    permission permission NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(role, permission)
);

-- Create user_info view
CREATE OR REPLACE VIEW public.user_info AS
SELECT 
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
FROM public.user_profiles;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON public.role_permissions(permission);
