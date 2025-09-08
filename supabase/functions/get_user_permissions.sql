-- Function to get user permissions based on their role
-- This function returns all permissions for a given user role

CREATE OR REPLACE FUNCTION public.get_user_permissions(user_role_param user_role)
RETURNS TABLE(permission permission)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT rp.permission
    FROM public.role_permissions rp
    WHERE rp.role = user_role_param;
$$;

-- Function to check if a user has a specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(
    user_id_param UUID,
    required_permission permission
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_profiles up
        JOIN public.role_permissions rp ON up.role = rp.role
        WHERE up.id = user_id_param
        AND rp.permission = required_permission
    );
$$;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id_param UUID DEFAULT auth.uid())
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT up.role
    FROM public.user_profiles up
    WHERE up.id = user_id_param;
$$;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id_param UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT up.is_admin OR up.role = 'admin'
    FROM public.user_profiles up
    WHERE up.id = user_id_param;
$$;

-- Add comments
COMMENT ON FUNCTION public.get_user_permissions(user_role) IS 'Returns all permissions for a given user role';
COMMENT ON FUNCTION public.user_has_permission(UUID, permission) IS 'Checks if a user has a specific permission';
COMMENT ON FUNCTION public.get_user_role(UUID) IS 'Gets the role of a user (defaults to current user)';
COMMENT ON FUNCTION public.is_admin(UUID) IS 'Checks if a user is an admin (defaults to current user)';
