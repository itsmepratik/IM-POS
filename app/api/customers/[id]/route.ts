import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase, isDatabaseAvailable } from "@/lib/db/client";
import { customers, customerVehicles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Validation schemas
const UpdateCustomerSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255, "Name too long")
    .optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z
    .string()
    .max(20, "Phone number too long")
    .optional()
    .or(z.literal("")),
  address: z.string().max(500, "Address too long").optional().or(z.literal("")),
  notes: z.string().max(1000, "Notes too long").optional().or(z.literal("")),
});

// GET /api/customers/[id] - Get single customer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check database availability
    if (!isDatabaseAvailable()) {
      return NextResponse.json(
        { error: "Database is not available" },
        { status: 503 }
      );
    }

    const { id } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid customer ID format" },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Find customer
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Fetch customer vehicles
    const vehicles = await db
      .select()
      .from(customerVehicles)
      .where(eq(customerVehicles.customerId, id));

    // Transform vehicles to match the expected format
    const transformedVehicles = vehicles.map((vehicle) => ({
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      licensePlate: vehicle.licensePlate,
      plateNumber: vehicle.licensePlate, // For backward compatibility
      vin: vehicle.vin,
      notes: vehicle.notes,
    }));

    // Return customer with vehicles
    const customerWithVehicles = {
      ...customer,
      vehicles: transformedVehicles,
      vehicleCount: transformedVehicles.length,
    };

    return NextResponse.json({ customer: customerWithVehicles });
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    );
  }
}

// PUT /api/customers/[id] - Update customer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check database availability
    if (!isDatabaseAvailable()) {
      return NextResponse.json(
        { error: "Database is not available" },
        { status: 503 }
      );
    }

    const { id } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid customer ID format" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input
    const validationResult = UpdateCustomerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Check if customer exists
    const [existingCustomer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const updateData = validationResult.data;

    // Convert empty strings to null for optional fields
    const cleanedData = {
      ...updateData,
      email: updateData.email === "" ? null : updateData.email,
      phone: updateData.phone === "" ? null : updateData.phone,
      address: updateData.address === "" ? null : updateData.address,
      notes: updateData.notes === "" ? null : updateData.notes,
      updatedAt: new Date(),
    };

    // Remove undefined values
    const filteredData = Object.fromEntries(
      Object.entries(cleanedData).filter(([_, value]) => value !== undefined)
    );

    // Update customer
    const [updatedCustomer] = await db
      .update(customers)
      .set(filteredData)
      .where(eq(customers.id, id))
      .returning();

    return NextResponse.json({
      message: "Customer updated successfully",
      customer: updatedCustomer,
    });
  } catch (error) {
    console.error("Error updating customer:", error);

    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes("unique")) {
      return NextResponse.json(
        { error: "Customer with this information already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] - Delete customer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check database availability
    if (!isDatabaseAvailable()) {
      return NextResponse.json(
        { error: "Database is not available" },
        { status: 503 }
      );
    }

    const { id } = await params;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid customer ID format" },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Check if customer exists
    const [existingCustomer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1);

    if (!existingCustomer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // TODO: Check if customer has any associated transactions
    // For now, we'll allow deletion, but in production you might want to:
    // 1. Prevent deletion if customer has transactions
    // 2. Or implement soft delete (add deleted_at field)

    // Delete customer
    await db.delete(customers).where(eq(customers.id, id));

    return NextResponse.json({
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting customer:", error);

    // Handle foreign key constraint violations
    if (error instanceof Error && error.message.includes("foreign key")) {
      return NextResponse.json(
        { error: "Cannot delete customer with existing transactions" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
