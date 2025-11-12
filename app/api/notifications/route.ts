import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

/**
 * GET /api/notifications
 * Fetch notifications for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (searchParams.has("is_read")) {
      query = query.eq("is_read", searchParams.get("is_read") === "true");
    }

    if (searchParams.has("category")) {
      query = query.eq("category", searchParams.get("category"));
    }

    if (searchParams.has("limit")) {
      const limit = parseInt(searchParams.get("limit") || "50", 10);
      query = query.limit(limit);
    }

    const { data: notifications, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ notifications: notifications || [] }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Create a new notification
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.type || !body.title || !body.message) {
      return NextResponse.json(
        { error: "Missing required fields: type, title, message" },
        { status: 400 }
      );
    }

    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        user_id: user.id,
        type: body.type,
        title: body.title,
        message: body.message,
        category: body.category || null,
        metadata: body.metadata || {},
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create notification" },
      { status: 500 }
    );
  }
}

