import { NextRequest, NextResponse } from "next/server";
import { getStaffByTextId } from "@/lib/utils/staff-validation";
import { z } from "zod";

/**
 * GET /api/staff/[staff_id]
 * Fetch a single staff member by staff_id
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { staff_id: string } }
) {
  try {
    const { staff_id } = params;

    if (!staff_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Staff ID is required",
        },
        { status: 400 }
      );
    }

    const staff = await getStaffByTextId(staff_id);

    if (!staff) {
      return NextResponse.json(
        {
          success: false,
          error: "Staff member not found",
          details: `No staff member found with ID: ${staff_id}`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error("Error fetching staff member:", error);
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

/**
 * PATCH /api/staff/[staff_id]
 * Update a staff member (admin only - add auth check if needed)
 */
const UpdateStaffSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { staff_id: string } }
) {
  try {
    const { staff_id } = params;

    if (!staff_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Staff ID is required",
        },
        { status: 400 }
      );
    }

    // Check if staff exists
    const existing = await getStaffByTextId(staff_id);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Staff member not found",
          details: `No staff member found with ID: ${staff_id}`,
        },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validation = UpdateStaffSchema.safeParse(body);

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

    const updateData: { name?: string; is_active?: boolean; updated_at?: string } = {};
    if (validation.data.name !== undefined) {
      updateData.name = validation.data.name;
    }
    if (validation.data.is_active !== undefined) {
      updateData.is_active = validation.data.is_active;
    }
    updateData.updated_at = new Date().toISOString();

    const { createClient } = await import("@/supabase/server");
    const supabase = await createClient();

    const { data: updatedStaff, error } = await supabase
      .from("staff")
      .update(updateData)
      .eq("staff_id", staff_id)
      .select("id, staff_id, name, is_active")
      .single();

    if (error || !updatedStaff) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update staff member",
          details: error?.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: updatedStaff.id, // UUID
        staff_id: updatedStaff.staff_id, // Text ID like "0010"
        name: updatedStaff.name,
        is_active: updatedStaff.is_active,
      },
    });
  } catch (error) {
    console.error("Error updating staff member:", error);
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


/**
 * DELETE /api/staff/[staff_id]
 * Delete (or deactivate) a staff member
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { staff_id: string } }
) {
  try {
    const { staff_id } = params;

    if (!staff_id) {
      return NextResponse.json(
        {
          success: false,
          error: "Staff ID is required",
        },
        { status: 400 }
      );
    }

    const { createClient } = await import("@/supabase/server");
    const supabase = await createClient();

    // Check if staff exists
    const existing = await getStaffByTextId(staff_id);
    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Staff member not found",
        },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from("staff")
      .delete()
      .eq("staff_id", staff_id);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete staff member",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Staff member deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting staff member:", error);
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
