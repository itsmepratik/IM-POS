import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAllStaff, getStaffByTextId } from "@/lib/utils/staff-validation";

/**
 * GET /api/staff
 * Fetch all staff members
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const activeOnly = searchParams.get("active") === "true";
    const shopId = searchParams.get("shop_id");

    let staffMembers = await getAllStaff();

    if (role) {
      staffMembers = staffMembers.filter((s) => s.role === role);
    }
    if (activeOnly) {
      staffMembers = staffMembers.filter((s) => s.is_active);
    }
    if (shopId) {
      staffMembers = staffMembers.filter((s) => s.shop_id === shopId);
    }

    return NextResponse.json({
      success: true,
      data: staffMembers,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch staff members",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

const CreateStaffSchema = z.object({
  staff_id: z.string().min(1, "Staff ID is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  role: z.enum(["admin", "manager", "technician", "cashier", "staff"]).default("staff"),
  salary: z.coerce.number().nullable().optional(),
  hire_date: z.string().nullable().optional(),
  date_of_birth: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  national_id: z.string().nullable().optional(),
  emergency_contact: z.string().nullable().optional(),
  emergency_phone: z.string().nullable().optional(),
  profile_image_url: z.string().nullable().optional(),
  shop_id: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  is_active: z.boolean().default(true).optional(),
});

/**
 * POST /api/staff
 * Create a new staff member
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = CreateStaffSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      staff_id,
      name,
      email,
      phone,
      role,
      salary,
      hire_date,
      date_of_birth,
      address,
      national_id,
      emergency_contact,
      emergency_phone,
      profile_image_url,
      shop_id,
      notes,
      is_active,
    } = validation.data;

    const existing = await getStaffByTextId(staff_id);
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Staff ID already exists",
          details: `Staff with ID ${staff_id} already exists`,
        },
        { status: 409 }
      );
    }

    const { createClient } = await import("@/supabase/server");
    const supabase = await createClient();

    const insertData: Record<string, unknown> = {
      staff_id,
      name,
      is_active: is_active ?? true,
    };

    if (email !== undefined) insertData.email = email;
    if (phone !== undefined) insertData.phone = phone;
    if (role !== undefined) insertData.role = role;
    if (salary !== undefined) insertData.salary = salary;
    if (hire_date !== undefined) insertData.hire_date = hire_date;
    if (date_of_birth !== undefined) insertData.date_of_birth = date_of_birth;
    if (address !== undefined) insertData.address = address;
    if (national_id !== undefined) insertData.national_id = national_id;
    if (emergency_contact !== undefined) insertData.emergency_contact = emergency_contact;
    if (emergency_phone !== undefined) insertData.emergency_phone = emergency_phone;
    if (profile_image_url !== undefined) insertData.profile_image_url = profile_image_url;
    if (shop_id !== undefined) insertData.shop_id = shop_id;
    if (notes !== undefined) insertData.notes = notes;

    const { data: newStaff, error } = await supabase
      .from("staff")
      .insert(insertData)
      .select()
      .single();

    if (error || !newStaff) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create staff member",
          details: error?.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: newStaff }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
