-- Add staff member with ID 0020 if not exists
-- This fixes the "Invalid or inactive staff ID" error

INSERT INTO staff (staff_id, name, role, is_active, created_at, updated_at)
VALUES ('0020', 'Staff Member 0020', 'cashier', true, now(), now())
ON CONFLICT (staff_id) DO UPDATE SET
  is_active = true,
  updated_at = now();
