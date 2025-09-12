-- Add open_bottle_details table for detailed lubricant tracking
-- This table tracks every single bottle that has been opened, allowing for precise volume deduction

CREATE TABLE IF NOT EXISTS public.open_bottle_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
    initial_volume NUMERIC NOT NULL,
    current_volume NUMERIC NOT NULL,
    opened_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_empty BOOLEAN DEFAULT false NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_open_bottle_details_inventory_id ON public.open_bottle_details(inventory_id);
CREATE INDEX IF NOT EXISTS idx_open_bottle_details_is_empty ON public.open_bottle_details(is_empty);
CREATE INDEX IF NOT EXISTS idx_open_bottle_details_opened_at ON public.open_bottle_details(opened_at);

-- Add comments for documentation
COMMENT ON TABLE public.open_bottle_details IS 'Tracks individual open lubricant bottles and their remaining volume';
COMMENT ON COLUMN public.open_bottle_details.inventory_id IS 'Foreign key referencing the inventory table - links to specific product at specific location';
COMMENT ON COLUMN public.open_bottle_details.initial_volume IS 'The original size of the bottle when it was new (e.g., 4.0 for a 4-liter bottle)';
COMMENT ON COLUMN public.open_bottle_details.current_volume IS 'The amount of liquid currently remaining in this specific bottle';
COMMENT ON COLUMN public.open_bottle_details.opened_at IS 'Timestamp when this bottle was first opened';
COMMENT ON COLUMN public.open_bottle_details.is_empty IS 'Set to true when current_volume reaches zero';

-- Enable Row Level Security (RLS)
ALTER TABLE public.open_bottle_details ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy for authenticated users to read open bottle details
CREATE POLICY "Users can view open bottle details" ON public.open_bottle_details
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert open bottle details
CREATE POLICY "Users can create open bottle details" ON public.open_bottle_details
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for authenticated users to update open bottle details
CREATE POLICY "Users can update open bottle details" ON public.open_bottle_details
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Policy for authenticated users to delete open bottle details
CREATE POLICY "Users can delete open bottle details" ON public.open_bottle_details
    FOR DELETE USING (auth.role() = 'authenticated');
