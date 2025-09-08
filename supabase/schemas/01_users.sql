-- User-related tables and views
-- This file defines the user management schema

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

-- Create user_info view for easier access
CREATE OR REPLACE VIEW public.user_info AS
SELECT 
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
FROM public.user_profiles;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- Add comments for documentation
COMMENT ON TABLE public.user_profiles IS 'User profile information linked to auth.users';
COMMENT ON VIEW public.user_info IS 'Simplified view of user information for common queries';
