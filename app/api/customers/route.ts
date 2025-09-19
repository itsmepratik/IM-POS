import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDatabase, isDatabaseAvailable } from "@/lib/db/client";
import { customers } from "@/lib/db/schema";
import { eq, ilike, or, desc } from "drizzle-orm";

// Validation schemas
const CreateCustomerSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().max(20, "Phone number too long").optional().or(z.literal("")),
  address: z.string().max(500, "Address too long").optional().or(z.literal("")),
  notes: z.string().max(1000, "Notes too long").optional().or(z.literal("")),
});

const UpdateCustomerSchema = CreateCustomerSchema.partial();

// GET /api/customers - List customers with optional search
export async function GET(request: NextRequest) {
  try {
    // Check database availability
    if (!isDatabaseAvailable()) {
      return NextResponse.json(
        { error: "Database is not available" },
        { status: 503 }
      );
    }

    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = db.select().from(customers);

    // Add search filter if provided
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query = query.where(
        or(
          ilike(customers.name, searchTerm),
          ilike(customers.email, searchTerm),
          ilike(customers.phone, searchTerm)
        )
      );
    }

    // Add pagination and ordering
    const customerList = await query
      .orderBy(desc(customers.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      customers: customerList,
      pagination: {
        limit,
        offset,
        total: customerList.length,
      },
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  try {
    // Check database availability
    if (!isDatabaseAvailable()) {
      return NextResponse.json(
        { error: "Database is not available" },
        { status: 503 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = CreateCustomerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const db = getDatabase();
    const customerData = validationResult.data;

    // Convert empty strings to null for optional fields
    const cleanedData = {
      ...customerData,
      email: customerData.email || null,
      phone: customerData.phone || null,
      address: customerData.address || null,
      notes: customerData.notes || null,
    };

    // Insert customer
    const [newCustomer] = await db
      .insert(customers)
      .values(cleanedData)
      .returning();

    return NextResponse.json(
      { 
        message: "Customer created successfully", 
        customer: newCustomer 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating customer:", error);
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes("unique")) {
      return NextResponse.json(
        { error: "Customer with this information already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}