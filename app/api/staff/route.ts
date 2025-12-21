import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/supabase/server";
import { getAllStaff, getStaffByTextId } from "@/lib/utils/staff-validation";

/**
 * GET /api/staff
 * Fetch all active staff members
 */
export async function GET(req: NextRequest) {
  try {
    // For settings, we want ALL staff members
    const staffMembers = await getAllStaff();

    return NextResponse.json({
      success: true,
      data: staffMembers,
    });
  } catch (error) {
    console.error("Error fetching staff members:", error);
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

/**
 * POST /api/staff
 * Create a new staff member (admin only - add auth check if needed)
 */
const CreateStaffSchema = z.object({
  staff_id: z.string().min(1, "Staff ID is required"),
  name: z.string().min(1, "Name is required"),
  is_active: z.boolean().default(true).optional(),
});

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

    const { staff_id, name, is_active = true } = validation.data;

    // Check if staff_id already exists (globally unique)
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

    const { data: newStaff, error } = await supabase
      .from("staff")
      .insert({
        staff_id,
        name,
        is_active,
      })
      .select("id, staff_id, name, is_active")
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

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newStaff.id, // UUID
          staff_id: newStaff.staff_id, // Text ID like "0010"
          name: newStaff.name,
          is_active: newStaff.is_active,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating staff member:", error);
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

