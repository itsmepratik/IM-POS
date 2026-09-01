import { getDatabase } from "@/lib/db/client";
import { staff, type Staff } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

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

function mapStaff(row: Staff): StaffMember {
  return {
    id: row.id,
    staff_id: row.staffId,
    name: row.name,
    email: row.email ?? null,
    phone: row.phone ?? null,
    role: row.role ?? "staff",
    salary: row.salary ?? null,
    hire_date: row.hireDate ? row.hireDate.toISOString() : null,
    date_of_birth: row.dateOfBirth ? row.dateOfBirth.toISOString() : null,
    address: row.address ?? null,
    national_id: row.nationalId ?? null,
    emergency_contact: row.emergencyContact ?? null,
    emergency_phone: row.emergencyPhone ?? null,
    profile_image_url: row.profileImageUrl ?? null,
    shop_id: row.shopId ?? null,
    notes: row.notes ?? null,
    is_active: row.isActive ?? true,
    created_at: row.createdAt ? row.createdAt.toISOString() : null,
    updated_at: row.updatedAt ? row.updatedAt.toISOString() : null,
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

  const db = getDatabase();
  const [member] = await db
    .select()
    .from(staff)
    .where(and(eq(staff.staffId, staffId.trim()), eq(staff.isActive, true)))
    .limit(1);

  if (!member) {
    return null;
  }

  return mapStaff(member);
}

/**
 * Converts staff_id text (like "0010") to UUID id
 */
export async function getStaffUuidById(
  staffId: string
): Promise<string | null> {
  const staffMember = await validateStaffId(staffId);
  return staffMember?.id || null;
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
  const db = getDatabase();
  const staffMembers = await db
    .select()
    .from(staff)
    .where(eq(staff.isActive, true))
    .orderBy(asc(staff.staffId));

  return staffMembers.map(mapStaff);
}

/**
 * Fetches ALL staff members (active and inactive)
 */
export async function getAllStaff(): Promise<StaffMember[]> {
  const db = getDatabase();
  const staffMembers = await db
    .select()
    .from(staff)
    .orderBy(asc(staff.staffId));

  return staffMembers.map(mapStaff);
}

/**
 * Fetches a staff member by staff ID (text) without checking active status
 */
export async function getStaffByTextId(
  staffId: string
): Promise<StaffMember | null> {
  if (!staffId) return null;

  const db = getDatabase();
  const [member] = await db
    .select()
    .from(staff)
    .where(eq(staff.staffId, staffId.trim()))
    .limit(1);

  if (!member) {
    return null;
  }

  return mapStaff(member);
}

