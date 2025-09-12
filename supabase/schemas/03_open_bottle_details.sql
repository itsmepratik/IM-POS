-- Open Bottle Details Schema
-- This schema defines the open_bottle_details table for detailed lubricant tracking

CREATE TABLE IF NOT EXISTS public.open_bottle_details (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
    initial_volume NUMERIC NOT NULL,
    current_volume NUMERIC NOT NULL,
    opened_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_empty BOOLEAN DEFAULT false NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_open_bottle_details_inventory_id ON public.open_bottle_details(inventory_id);
CREATE INDEX IF NOT EXISTS idx_open_bottle_details_is_empty ON public.open_bottle_details(is_empty);
CREATE INDEX IF NOT EXISTS idx_open_bottle_details_opened_at ON public.open_bottle_details(opened_at);

-- Table documentation
COMMENT ON TABLE public.open_bottle_details IS 'Tracks individual open lubricant bottles and their remaining volume';
COMMENT ON COLUMN public.open_bottle_details.inventory_id IS 'Foreign key referencing the inventory table - links to specific product at specific location';
COMMENT ON COLUMN public.open_bottle_details.initial_volume IS 'The original size of the bottle when it was new (e.g., 4.0 for a 4-liter bottle)';
COMMENT ON COLUMN public.open_bottle_details.current_volume IS 'The amount of liquid currently remaining in this specific bottle';
COMMENT ON COLUMN public.open_bottle_details.opened_at IS 'Timestamp when this bottle was first opened';
COMMENT ON COLUMN public.open_bottle_details.is_empty IS 'Set to true when current_volume reaches zero';
