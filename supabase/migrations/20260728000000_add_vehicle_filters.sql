-- Migration: Add vehicle_filters junction table
-- Supports multiple filter part numbers per vehicle
-- Date: 2026-07-28

-- Create vehicle_filters table
CREATE TABLE IF NOT EXISTS public.vehicle_filters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    filter_part_number TEXT NOT NULL,
    filter_type TEXT DEFAULT 'oil',
    is_primary BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT vehicle_filters_unique UNIQUE(vehicle_id, filter_part_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicle_filters_vehicle_id ON public.vehicle_filters(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_filters_part_number ON public.vehicle_filters(filter_part_number);

-- Add comment for documentation
COMMENT ON TABLE public.vehicle_filters IS 'Junction table linking vehicles to multiple filter part numbers';
COMMENT ON COLUMN public.vehicle_filters.vehicle_id IS 'Reference to the vehicles table';
COMMENT ON COLUMN public.vehicle_filters.filter_part_number IS 'Filter part number (e.g., 90915-YZZN1)';
COMMENT ON COLUMN public.vehicle_filters.filter_type IS 'Type of filter: oil, air, cabin, fuel';
COMMENT ON COLUMN public.vehicle_filters.is_primary IS 'Indicates if this is the primary/recommended filter';
COMMENT ON COLUMN public.vehicle_filters.notes IS 'Additional notes about this filter';

-- Enable Row Level Security (RLS)
ALTER TABLE public.vehicle_filters ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for authenticated users)
CREATE POLICY "Allow all operations for authenticated users" ON public.vehicle_filters
    FOR ALL USING (auth.role() = 'authenticated');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vehicle_filters_updated_at 
    BEFORE UPDATE ON public.vehicle_filters 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Backfill existing oil_filter_part_number data into vehicle_filters
-- This ensures existing vehicles get their filters migrated to the new table
INSERT INTO public.vehicle_filters (vehicle_id, filter_part_number, filter_type, is_primary)
SELECT id, oil_filter_part_number, 'oil', true
FROM public.vehicles
WHERE oil_filter_part_number IS NOT NULL
ON CONFLICT (vehicle_id, filter_part_number) DO NOTHING;

-- Add comment for documentation
COMMENT ON COLUMN public.vehicles.oil_filter_part_number IS 'DEPRECATED: Use vehicle_filters table instead. Kept for backward compatibility.';
