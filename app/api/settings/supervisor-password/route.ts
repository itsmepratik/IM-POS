import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getDatabase } from "@/lib/db/client";
import { shops } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin, authErrorResponse } from "@/lib/auth/require-user";

const UpdatePasswordSchema = z.object({
  shopId: z.string().uuid(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

const ShopQuerySchema = z.string().uuid();

/**
 * GET /api/settings/supervisor-password?shopId=<uuid>
 * Admin only. Reports whether a supervisor password is configured for the
 * shop — never returns the hash.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin();
    const parsedShopId = ShopQuerySchema.safeParse(req.nextUrl.searchParams.get("shopId"));
    if (!parsedShopId.success) {
      return NextResponse.json({ success: false, error: "Valid shopId is required" }, { status: 400 });
    }
    const db = getDatabase();
    const [shop] = await db
      .select({ hash: shops.supervisorPasswordHash })
      .from(shops)
      .where(eq(shops.id, parsedShopId.data))
      .limit(1);
    if (!shop) {
      return NextResponse.json({ success: false, error: "Shop not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: { configured: Boolean(shop.hash) } });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/settings/supervisor-password
 * Admin only. Sets or rotates a shop's supervisor (void) password. When a
 * password already exists the current one is required.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin();
    const db = getDatabase();
    const body: unknown = await req.json();

    const parsed = UpdatePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input", details: parsed.error.issues },
        { status: 400 },
      );
    }
    const { shopId, currentPassword, newPassword } = parsed.data;

    const [shop] = await db
      .select({ id: shops.id, hash: shops.supervisorPasswordHash })
      .from(shops)
      .where(eq(shops.id, shopId))
      .limit(1);

    if (!shop) {
      return NextResponse.json(
        { success: false, error: "Shop not found" },
        { status: 404 },
      );
    }

    if (shop.hash) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: "Current password is required to change the password" },
          { status: 400 },
        );
      }

      const valid = await bcrypt.compare(currentPassword, shop.hash);
      if (!valid) {
        return NextResponse.json(
          { success: false, error: "Current password is incorrect" },
          { status: 401 },
        );
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const [updated] = await db
      .update(shops)
      .set({ supervisorPasswordHash: hashedPassword })
      .where(eq(shops.id, shopId))
      .returning({ id: shops.id });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Shop not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Supervisor password updated successfully",
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
