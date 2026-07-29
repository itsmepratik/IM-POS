-- Migration: Create vehicles lookup table for internal tool
-- This table stores vehicle specifications for the Car Oil & Filter Lookup tool
-- Date: 2026-07-28

-- Create vehicles table (if not exists - was created directly in Supabase previously)
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    engine TEXT NOT NULL,
    oil_capacity NUMERIC(4,1) NOT NULL,
    oil_filter_part_number TEXT, -- DEPRECATED: use vehicle_filters table
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(make, model, year, engine)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicles_make_model ON public.vehicles(make, model);
CREATE INDEX IF NOT EXISTS idx_vehicles_year ON public.vehicles(year);
CREATE INDEX IF NOT EXISTS idx_vehicles_make_model_year ON public.vehicles(make, model, year);

-- Add comment for documentation
COMMENT ON TABLE public.vehicles IS 'Vehicle specifications lookup table for internal tool. Contains oil capacity and filter information.';
COMMENT ON COLUMN public.vehicles.make IS 'Vehicle manufacturer (e.g., Toyota, Nissan)';
COMMENT ON COLUMN public.vehicles.model IS 'Vehicle model (e.g., Corolla, Camry)';
COMMENT ON COLUMN public.vehicles.year IS 'Model year';
COMMENT ON COLUMN public.vehicles.engine IS 'Engine specification (e.g., 2.5L A25A-FKS)';
COMMENT ON COLUMN public.vehicles.oil_capacity IS 'Required oil volume in liters';
COMMENT ON COLUMN public.vehicles.oil_filter_part_number IS 'DEPRECATED: Use vehicle_filters table for multiple filters per vehicle';

-- Enable Row Level Security (RLS)
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all operations for authenticated users)
CREATE POLICY "Allow all operations for authenticated users" ON public.vehicles
    FOR ALL USING (auth.role() = 'authenticated');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vehicles_updated_at 
    BEFORE UPDATE ON public.vehicles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
