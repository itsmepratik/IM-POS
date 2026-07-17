import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/client";
import { shops } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const VerifyPasswordSchema = z.object({
  password: z.string().min(1, "Password is required"),
  shopId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validatedInput = VerifyPasswordSchema.parse(body);
    const { password, shopId, locationId } = validatedInput;

    const shopFilter = shopId
      ? eq(shops.id, shopId)
      : eq(shops.locationId, locationId!);

    if (!shopId && !locationId) {
      return NextResponse.json(
        { success: false, error: "Either shopId or locationId is required" },
        { status: 400 },
      );
    }

    const [shop] = await db
      .select()
      .from(shops)
      .where(shopFilter)
      .limit(1);

    if (!shop || !shop.supervisorPasswordHash) {
      return NextResponse.json(
        { success: false, error: "Supervisor password not configured" },
        { status: 400 },
      );
    }

    const valid = await bcrypt.compare(password, shop.supervisorPasswordHash);

    if (!valid) {
      return NextResponse.json(
        { success: false, error: "Invalid supervisor password" },
        { status: 401 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
