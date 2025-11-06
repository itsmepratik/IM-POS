-- Migration: Add shop location assignment fields to user_profiles
-- This migration adds fields to link shop users to their assigned locations
-- and to specify which location to use for inventory queries

-- Drop the user_info view first to avoid conflicts
DROP VIEW IF EXISTS public.user_info;

-- Add shop_location_id column (for UI display/locking)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS shop_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;

-- Add inventory_location_id column (for inventory queries)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS inventory_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;

-- Add shop_display_name column (for shop-specific display names)
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS shop_display_name TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_shop_location_id ON public.user_profiles(shop_location_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_inventory_location_id ON public.user_profiles(inventory_location_id);

-- Add comments for documentation
COMMENT ON COLUMN public.user_profiles.shop_location_id IS 'Location ID assigned to shop user for UI display and branch locking';
COMMENT ON COLUMN public.user_profiles.inventory_location_id IS 'Location ID to use for inventory queries (may differ from shop_location_id for shared inventory)';
COMMENT ON COLUMN public.user_profiles.shop_display_name IS 'Shop-specific display name to show in UI (e.g., "Saniya1", "Saniya2")';

-- Recreate user_info view to include new fields
CREATE OR REPLACE VIEW public.user_info AS
SELECT 
    id,
    email,
    full_name,
    role,
    shop_location_id,
    inventory_location_id,
    shop_display_name,
    created_at,
    updated_at
FROM public.user_profiles;

