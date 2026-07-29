import { createClient } from "@/supabase/server";

export interface StaffMember {
  id: string;
  staff_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  salary: string | null;
  hire_date: string | null;
  date_of_birth: string | null;
  address: string | null;
  national_id: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  profile_image_url: string | null;
  shop_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

const STAFF_SELECT_FIELDS =
  "id, staff_id, name, email, phone, role, salary, hire_date, date_of_birth, address, national_id, emergency_contact, emergency_phone, profile_image_url, shop_id, notes, is_active, created_at, updated_at";

function mapStaff(row: Record<string, unknown>): StaffMember {
  return {
    id: row.id as string,
    staff_id: row.staff_id as string,
    name: row.name as string,
    email: (row.email as string) ?? null,
    phone: (row.phone as string) ?? null,
    role: (row.role as string) ?? "staff",
    salary: (row.salary as string) ?? null,
    hire_date: (row.hire_date as string) ?? null,
    date_of_birth: (row.date_of_birth as string) ?? null,
    address: (row.address as string) ?? null,
    national_id: (row.national_id as string) ?? null,
    emergency_contact: (row.emergency_contact as string) ?? null,
    emergency_phone: (row.emergency_phone as string) ?? null,
    profile_image_url: (row.profile_image_url as string) ?? null,
    shop_id: (row.shop_id as string) ?? null,
    notes: (row.notes as string) ?? null,
    is_active: row.is_active as boolean,
    created_at: (row.created_at as string) ?? null,
    updated_at: (row.updated_at as string) ?? null,
  };
}

/**
 * Validates if a staff ID (text like "0010") exists and is active
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
    .select(STAFF_SELECT_FIELDS)
    .eq("staff_id", staffId)
    .eq("is_active", true)
    .single();

  if (error || !staff) {
    return null;
  }

  return mapStaff(staff);
}

/**
 * Converts staff_id text (like "0010") to UUID id
 */
export async function getStaffUuidById(
  staffId: string
): Promise<string | null> {
  const staff = await validateStaffId(staffId);
  return staff?.id || null;
}

/**
 * Fetches a staff member by staff ID
 */
export async function getStaffById(
  staffId: string
): Promise<StaffMember | null> {
  return validateStaffId(staffId);
}

/**
 * Fetches all active staff members
 */
export async function getAllActiveStaff(): Promise<StaffMember[]> {
  const supabase = await createClient();

  const { data: staffMembers, error } = await supabase
    .from("staff")
    .select(STAFF_SELECT_FIELDS)
    .eq("is_active", true)
    .order("staff_id", { ascending: true });

  if (error || !staffMembers) {
    return [];
  }

  return staffMembers.map(mapStaff);
}

/**
 * Fetches ALL staff members (active and inactive)
 */
export async function getAllStaff(): Promise<StaffMember[]> {
  const supabase = await createClient();

  const { data: staffMembers, error } = await supabase
    .from("staff")
    .select(STAFF_SELECT_FIELDS)
    .order("staff_id", { ascending: true });

  if (error || !staffMembers) {
    return [];
  }

  return staffMembers.map(mapStaff);
}

/**
 * Fetches a staff member by staff ID (text) without checking active status
 */
export async function getStaffByTextId(
  staffId: string
): Promise<StaffMember | null> {
  if (!staffId) return null;

  const supabase = await createClient();

  const { data: staff, error } = await supabase
    .from("staff")
    .select(STAFF_SELECT_FIELDS)
    .eq("staff_id", staffId)
    .single();

  if (error || !staff) {
    return null;
  }

  return mapStaff(staff);
}
