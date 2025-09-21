import { NextRequest, NextResponse } from "next/server";
import { getDatabase, isDatabaseAvailable } from "@/lib/db/client";
import { customers, customerVehicles } from "@/lib/db/schema";
import { eq, ilike, or, desc } from "drizzle-orm";

// GET /api/customers/dropdown - Get customers for dropdown selector
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
    const limit = parseInt(searchParams.get("limit") || "100");

    let query = db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
      })
      .from(customers);

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

    // Get customers ordered by most recent
    const customerList = await query
      .orderBy(desc(customers.createdAt))
      .limit(limit);

    // Format for dropdown display
    const formattedCustomers = customerList.map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      displayText: `${customer.name}${customer.phone ? ` - ${customer.phone}` : ''}${customer.email ? ` (${customer.email})` : ''}`,
    }));

    return NextResponse.json({
      customers: formattedCustomers,
      total: formattedCustomers.length,
    });
  } catch (error) {
    console.error("Error fetching customers for dropdown:", error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}