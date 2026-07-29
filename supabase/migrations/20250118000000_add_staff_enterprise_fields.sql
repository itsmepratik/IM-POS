-- Add enterprise-level fields to staff table

-- Add new columns
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'staff';
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS salary NUMERIC;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS hire_date TIMESTAMPTZ;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS date_of_birth TIMESTAMPTZ;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS national_id TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS emergency_phone TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS shop_id UUID REFERENCES public.shops(id) ON DELETE SET NULL;
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_staff_email ON public.staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_role ON public.staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_shop ON public.staff(shop_id);

-- Add comments for documentation
COMMENT ON COLUMN public.staff.email IS 'Employee email address';
COMMENT ON COLUMN public.staff.phone IS 'Employee phone number';
COMMENT ON COLUMN public.staff.role IS 'Employee role: admin, manager, technician, cashier, staff';
COMMENT ON COLUMN public.staff.salary IS 'Monthly salary in OMR';
COMMENT ON COLUMN public.staff.hire_date IS 'Date the employee was hired';
COMMENT ON COLUMN public.staff.date_of_birth IS 'Employee date of birth';
COMMENT ON COLUMN public.staff.address IS 'Employee residential address';
COMMENT ON COLUMN public.staff.national_id IS 'National ID or civil ID number';
COMMENT ON COLUMN public.staff.emergency_contact IS 'Name of emergency contact person';
COMMENT ON COLUMN public.staff.emergency_phone IS 'Phone number of emergency contact';
COMMENT ON COLUMN public.staff.profile_image_url IS 'URL to profile image';
COMMENT ON COLUMN public.staff.shop_id IS 'Assigned shop/branch for the employee';
COMMENT ON COLUMN public.staff.notes IS 'Additional notes about the employee';
