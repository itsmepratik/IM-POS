-- Initial data for the POS system
-- This file contains default data needed for the system to function

-- Insert default role permissions for 'shop' role
INSERT INTO public.role_permissions (role, permission) VALUES
    ('shop', 'pos.access'),
    ('shop', 'inventory.access'),
    ('shop', 'customers.access'),
    ('shop', 'transactions.access'),
    ('shop', 'notifications.access'),
    ('shop', 'reports.access')
ON CONFLICT (role, permission) DO NOTHING;

-- Insert default role permissions for 'admin' role
INSERT INTO public.role_permissions (role, permission) VALUES
    ('admin', 'pos.access'),
    ('admin', 'inventory.access'),
    ('admin', 'customers.access'),
    ('admin', 'transactions.access'),
    ('admin', 'notifications.access'),
    ('admin', 'reports.access'),
    ('admin', 'settings.access'),
    ('admin', 'users.access'),
    ('admin', 'admin.access')
ON CONFLICT (role, permission) DO NOTHING;

-- Note: User profiles will be created automatically when users sign up
-- through the authentication system. No manual insertion needed here.

-- Add comments
COMMENT ON TABLE public.role_permissions IS 'Default permissions for each role in the system';
