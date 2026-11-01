import { NextRequest, NextResponse } from "next/server";
import { getStaffByTextId } from "@/lib/utils/staff-validation";
import { z } from "zod";
import { requireAdmin, authErrorResponse } from "@/lib/auth/require-user";
import { STAFF_PUBLIC_COLUMNS } from "@/lib/services/staff-columns";

type StaffRouteContext = { params: Promise<{ staff_id: string }> };

function internalError(error: unknown): NextResponse {
  const authResponse = authErrorResponse(error);
  if (authResponse) return authResponse;
  return NextResponse.json(
    {
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
    },
    { status: 500 },
  );
}

/**
 * GET /api/staff/[staff_id]
 * Fetch a single staff member by staff_id (admin only — full HR record).
 */
export async function GET(
  _req: NextRequest,
  { params }: StaffRouteContext,
): Promise<NextResponse> {
  try {
    await requireAdmin();
    const { staff_id } = await params;

    if (!staff_id) {
      return NextResponse.json(
        { success: false, error: "Staff ID is required" },
        { status: 400 },
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
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: staff });
  } catch (error) {
    return internalError(error);
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
 * Update a staff member (admin only).
 */
export async function PATCH(
  req: NextRequest,
  { params }: StaffRouteContext,
): Promise<NextResponse> {
  try {
    await requireAdmin();
    const { staff_id } = await params;

    if (!staff_id) {
      return NextResponse.json(
        { success: false, error: "Staff ID is required" },
        { status: 400 },
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
        { status: 404 },
      );
    }

    const body: unknown = await req.json();
    const validation = UpdateStaffSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request data",
          details: validation.error.flatten(),
        },
        { status: 400 },
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
      .select(STAFF_PUBLIC_COLUMNS)
      .single();

    if (error || !updatedStaff) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to update staff member",
          details: error?.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data: updatedStaff });
  } catch (error) {
    return internalError(error);
  }
}

/**
 * DELETE /api/staff/[staff_id]
 * Delete a staff member (admin only). Staff referenced by sales, shifts or
 * labor history (RESTRICT foreign keys) cannot be hard-deleted without
 * destroying the audit trail, so they are deactivated instead.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: StaffRouteContext,
): Promise<NextResponse> {
  try {
    await requireAdmin();
    const { staff_id } = await params;

    if (!staff_id) {
      return NextResponse.json(
        { success: false, error: "Staff ID is required" },
        { status: 400 },
      );
    }

    const { createClient } = await import("@/supabase/server");
    const supabase = await createClient();

    const existing = await getStaffByTextId(staff_id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Staff member not found" },
        { status: 404 },
      );
    }

    const { error } = await supabase
      .from("staff")
      .delete()
      .eq("staff_id", staff_id);

    if (error?.code === "23503") {
      const { error: deactivateError } = await supabase
        .from("staff")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("staff_id", staff_id);
      if (deactivateError) {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to deactivate staff member",
            details: deactivateError.message,
          },
          { status: 500 },
        );
      }
      return NextResponse.json({
        success: true,
        deactivated: true,
        message:
          "Staff member has transaction or shift history, so they were deactivated instead of deleted.",
      });
    }

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to delete staff member",
          details: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      deactivated: false,
      message: "Staff member deleted successfully",
    });
  } catch (error) {
    return internalError(error);
  }
}
