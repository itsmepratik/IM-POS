import { NextRequest, NextResponse } from "next/server";
import { getStaffByTextId } from "@/lib/utils/staff-validation";
import { z } from "zod";

/**
 * GET /api/staff/[staff_id]
 * Fetch a single staff member by staff_id
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ staff_id: string }> }
) {
  try {
    const { staff_id } = await params;

    if (!staff_id) {
      return NextResponse.json(
        { success: false, error: "Staff ID is required" },
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

    return NextResponse.json({ success: true, data: staff });
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

const UpdateStaffSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  role: z.enum(["admin", "manager", "technician", "cashier", "staff"]).optional(),
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
  is_active: z.boolean().optional(),
});

/**
 * PATCH /api/staff/[staff_id]
 * Update a staff member
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ staff_id: string }> }
) {
  try {
    const { staff_id } = await params;

    if (!staff_id) {
      return NextResponse.json(
        { success: false, error: "Staff ID is required" },
        { status: 400 }
      );
    }

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

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const fields = [
      "name", "email", "phone", "role", "salary", "hire_date",
      "date_of_birth", "address", "national_id", "emergency_contact",
      "emergency_phone", "profile_image_url", "shop_id", "notes", "is_active",
    ] as const;

    for (const field of fields) {
      if (validation.data[field] !== undefined) {
        updateData[field] = validation.data[field];
      }
    }

    const { createClient } = await import("@/supabase/server");
    const supabase = await createClient();

    const { data: updatedStaff, error } = await supabase
      .from("staff")
      .update(updateData)
      .eq("staff_id", staff_id)
      .select()
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

    return NextResponse.json({ success: true, data: updatedStaff });
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

/**
 * DELETE /api/staff/[staff_id]
 * Delete a staff member
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ staff_id: string }> }
) {
  try {
    const { staff_id } = await params;

    if (!staff_id) {
      return NextResponse.json(
        { success: false, error: "Staff ID is required" },
        { status: 400 }
      );
    }

    const { createClient } = await import("@/supabase/server");
    const supabase = await createClient();

    const existing = await getStaffByTextId(staff_id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Staff member not found" },
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
