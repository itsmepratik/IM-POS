-- Row-Level Security policies for user_profiles table
-- These policies control access to user profile data

-- Enable RLS on user_profiles table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND (up.is_admin = true OR up.role = 'admin')
        )
    );

-- Policy: Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON public.user_profiles
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

-- Policy: Admins can insert new profiles
CREATE POLICY "Admins can insert profiles" ON public.user_profiles
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND (up.is_admin = true OR up.role = 'admin')
        )
    );

-- Policy: Admins can delete profiles
CREATE POLICY "Admins can delete profiles" ON public.user_profiles
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid() 
            AND (up.is_admin = true OR up.role = 'admin')
        )
    );
