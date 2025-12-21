import { createClient } from "@/supabase/server";

export interface StaffMember {
  id: string; // UUID from staff table
  staff_id: string; // Text ID like "0010"
  name: string;
  is_active: boolean;
}

/**
 * Validates if a staff ID (text like "0010") exists and is active
 * Returns the UUID id for database storage
 * @param staffId - The staff ID to validate (e.g., "0010")
 * @returns Staff member data with UUID id if valid, null otherwise
 */
export async function validateStaffId(
  staffId: string
): Promise<StaffMember | null> {
  if (!staffId || typeof staffId !== "string") {
    return null;
  }

  const supabase = await createClient();

  const { data: staff, error } = await supabase
    .from("staff")
    .select("id, staff_id, name, is_active")
    .eq("staff_id", staffId)
    .eq("is_active", true)
    .single();

  if (error || !staff) {
    return null;
  }

  return {
    id: staff.id, // UUID
    staff_id: staff.staff_id, // Text ID like "0010"
    name: staff.name,
    is_active: staff.is_active,
  };
}

/**
 * Converts staff_id text (like "0010") to UUID id
 * @param staffId - The staff ID text (e.g., "0010")
 * @returns UUID id if found, null otherwise
 */
export async function getStaffUuidById(staffId: string): Promise<string | null> {
  const staff = await validateStaffId(staffId);
  return staff?.id || null;
}

/**
 * Fetches a staff member by staff ID
 * @param staffId - The staff ID to fetch (e.g., "0010")
 * @returns Staff member data with UUID id if found, null otherwise
 */
export async function getStaffById(
  staffId: string
): Promise<StaffMember | null> {
  return validateStaffId(staffId);
}

/**
 * Fetches all active staff members with UUID ids
 * @returns Array of active staff members with UUID ids
 */
export async function getAllActiveStaff(): Promise<StaffMember[]> {
  const supabase = await createClient();

  const { data: staffMembers, error } = await supabase
    .from("staff")
    .select("id, staff_id, name, is_active")
    .eq("is_active", true)
    .order("staff_id", { ascending: true });

  if (error || !staffMembers) {
    return [];
  }

  return staffMembers.map((staff) => ({
    id: staff.id, // UUID
    staff_id: staff.staff_id, // Text ID like "0010"
    name: staff.name,
    is_active: staff.is_active,
  }));
}

/**
 * Fetches ALL staff members (active and inactive)
 * @returns Array of all staff members
 */
export async function getAllStaff(): Promise<StaffMember[]> {
  const supabase = await createClient();

  const { data: staffMembers, error } = await supabase
    .from("staff")
    .select("id, staff_id, name, is_active")
    .order("staff_id", { ascending: true });

  if (error || !staffMembers) {
    return [];
  }

  return staffMembers.map((staff) => ({
    id: staff.id, // UUID
    staff_id: staff.staff_id, // Text ID like "0010"
    name: staff.name,
    is_active: staff.is_active,
  }));
}

/**
 * Fetches a staff member by staff ID (text) without checking active status
 * @param staffId - The staff ID to fetch (e.g., "0010")
 * @returns Staff member data or null
 */
export async function getStaffByTextId(
  staffId: string
): Promise<StaffMember | null> {
  if (!staffId) return null;

  const supabase = await createClient();

  const { data: staff, error } = await supabase
    .from("staff")
    .select("id, staff_id, name, is_active")
    .eq("staff_id", staffId)
    .single();

  if (error || !staff) {
    return null;
  }

  return {
    id: staff.id, // UUID
    staff_id: staff.staff_id, // Text ID like "0010"
    name: staff.name,
    is_active: staff.is_active,
  };
}

