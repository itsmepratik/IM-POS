import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/client";
import { shops } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const UpdatePasswordSchema = z.object({
  shopId: z.string().uuid(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const validatedInput = UpdatePasswordSchema.parse(body);
    const { shopId, currentPassword, newPassword } = validatedInput;

    const [shop] = await db
      .select()
      .from(shops)
      .where(eq(shops.id, shopId))
      .limit(1);

    if (!shop) {
      return NextResponse.json(
        { success: false, error: "Shop not found" },
        { status: 404 },
      );
    }

    if (shop.supervisorPasswordHash) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: "Current password is required to change the password" },
          { status: 400 },
        );
      }

      const valid = await bcrypt.compare(currentPassword, shop.supervisorPasswordHash);
      if (!valid) {
        return NextResponse.json(
          { success: false, error: "Current password is incorrect" },
          { status: 401 },
        );
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await db
      .update(shops)
      .set({ supervisorPasswordHash: hashedPassword })
      .where(eq(shops.id, shopId));

    return NextResponse.json({
      success: true,
      message: "Supervisor password updated successfully",
    });
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
