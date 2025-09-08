-- Row-Level Security policies for role_permissions table
-- These policies control access to role and permission data

-- Enable RLS on role_permissions table
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view role permissions (needed for permission checks)
CREATE POLICY "Anyone can view role permissions" ON public.role_permissions
    FOR SELECT
    USING (true);

-- Policy: Only admins can modify role permissions
CREATE POLICY "Admins can insert role permissions" ON public.role_permissions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND (up.is_admin = true OR up.role = 'admin')
        )
    );

-- Policy: Only admins can update role permissions
CREATE POLICY "Admins can update role permissions" ON public.role_permissions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND (up.is_admin = true OR up.role = 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND (up.is_admin = true OR up.role = 'admin')
        )
    );

-- Policy: Only admins can delete role permissions
CREATE POLICY "Admins can delete role permissions" ON public.role_permissions
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND (up.is_admin = true OR up.role = 'admin')
        )
    );
